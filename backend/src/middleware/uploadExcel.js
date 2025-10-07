const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục uploads nếu chưa tồn tại
const uploadsDir = path.join(__dirname, '../../uploads');
const excelUploadsDir = path.join(uploadsDir, 'excel');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(excelUploadsDir)) {
  fs.mkdirSync(excelUploadsDir, { recursive: true });
}

// Cấu hình multer cho file Excel
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, excelUploadsDir);
  },
  filename: (req, file, cb) => {
    // Tạo tên file unique với timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
  }
});

// Filter chỉ cho phép file Excel
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/octet-stream' // fallback cho một số trường hợp
  ];
  
  const allowedExtensions = ['.xls', '.xlsx'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file Excel (.xls, .xlsx)'), false);
  }
};

// Cấu hình upload
const uploadExcel = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1 // Chỉ cho phép 1 file
  }
});

// Middleware xử lý lỗi upload
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File quá lớn. Kích thước tối đa 10MB',
        data: null
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ được upload 1 file',
        data: null
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Tên field không đúng. Sử dụng "excelFile"',
        data: null
      });
    }
  }
  
  if (error.message.includes('Chỉ cho phép upload file Excel')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      data: null
    });
  }
  
  return res.status(500).json({
    success: false,
    message: 'Lỗi upload file: ' + error.message,
    data: null
  });
};

// Middleware để validate file sau khi upload
const validateExcelFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Không có file được upload',
      data: null
    });
  }
  
  const allowedExtensions = ['.xls', '.xlsx'];
  const fileExtension = path.extname(req.file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(fileExtension)) {
    // Xóa file đã upload
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Lỗi xóa file:', err);
    });
    
    return res.status(400).json({
      success: false,
      message: 'File không đúng định dạng. Chỉ chấp nhận .xls hoặc .xlsx',
      data: null
    });
  }
  
  next();
};

// Utility function để xóa file
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Lỗi xóa file:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

module.exports = {
  uploadExcel: uploadExcel.single('excelFile'),
  handleUploadError,
  validateExcelFile,
  deleteFile,
  uploadsDir: excelUploadsDir
};
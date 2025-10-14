# 🔧 Hướng dẫn tích hợp Submission System vào Server

## 📋 Checklist

### 1. ✅ Files đã tạo
```
backend/
├── src/
│   ├── middleware/
│   │   └── validateSubmissionTime.js       ✅ Kiểm tra thời gian nộp bài
│   ├── services/
│   │   ├── SubmissionService.js           ✅ Logic nghiệp vụ bài nộp
│   │   └── RegistrationPeriodService.js   ✅ Logic nghiệp vụ đợt đăng ký
│   └── routes/
│       ├── submissions.js                 ✅ API endpoints bài nộp
│       └── registrationPeriods.js         ✅ API endpoints đợt đăng ký
└── docs/
    └── SUBMISSION_API_GUIDE.md            ✅ Tài liệu API
```

---

## 🚀 Bước 1: Cài đặt Dependencies (nếu chưa có)

```bash
cd backend
npm install multer
```

Dependencies cần thiết:
- ✅ `express` - Web framework
- ✅ `mysql2` - MySQL driver
- ✅ `multer` - File upload middleware
- ✅ `fs` - File system (built-in Node.js)
- ✅ `path` - Path utilities (built-in Node.js)

---

## 🔌 Bước 2: Đăng ký Routes trong `server.js`

Mở file `backend/server.js` hoặc `backend/src/server.js` và thêm:

```javascript
// ==================== IMPORT ROUTES ====================
const submissionsRouter = require('./src/routes/submissions');
const registrationPeriodsRouter = require('./src/routes/registrationPeriods');

// ... existing imports ...

// ==================== MIDDLEWARE SETUP ====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files - cho phép download file đã upload
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ... existing middleware ...

// ==================== API ROUTES ====================
// Existing routes...
app.use('/api/teachers', teachersRouter);
app.use('/api/students', studentsRouter);
// ... other routes ...

// 🆕 NEW ROUTES - Submission System
app.use('/api/submissions', submissionsRouter);
app.use('/api/registration-periods', registrationPeriodsRouter);

// ==================== ERROR HANDLING ====================
// Xử lý lỗi upload file
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File quá lớn. Kích thước tối đa: 10MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Lỗi upload: ${err.message}`
    });
  }
  
  if (err.message.includes('Loại file không được hỗ trợ')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next(err);
});

// ... existing error handlers ...
```

---

## 📁 Bước 3: Tạo thư mục uploads

```bash
# Windows
mkdir backend\uploads\submissions

# Linux/Mac
mkdir -p backend/uploads/submissions
```

Hoặc thêm vào `.gitignore`:
```
uploads/submissions/*
!uploads/submissions/.gitkeep
```

---

## 🔐 Bước 4: Thêm Authentication Middleware (nếu cần)

Nếu bạn đã có middleware xác thực, thêm vào routes:

```javascript
// Ví dụ trong submissions.js
const { authenticateStudent } = require('../middleware/auth');
const { authenticateTeacher } = require('../middleware/auth');

// Protected routes
router.post('/:slotId/upload', 
  authenticateStudent,           // 🔒 Kiểm tra token sinh viên
  validateSubmissionTime,        // ✅ Kiểm tra thời gian
  upload.single('file'),         // 📤 Upload file
  async (req, res) => { ... }
);

router.post('/:submissionId/review',
  authenticateTeacher,           // 🔒 Kiểm tra token giảng viên
  async (req, res) => { ... }
);
```

**Nếu chưa có auth middleware**, tạm thời có thể lấy từ `req.body`:
```javascript
const maSinhVien = req.user?.ma_sinh_vien || req.body?.ma_sinh_vien;
```

---

## 🧪 Bước 5: Test API

### Test 1: Kiểm tra trạng thái đăng ký
```bash
curl http://localhost:3000/api/registration-periods/status
```

### Test 2: Tạo đợt đăng ký mới
```bash
curl -X POST http://localhost:3000/api/registration-periods \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Đợt test",
    "start_time": "2025-01-01T00:00:00",
    "end_time": "2025-12-31T23:59:59",
    "description": "Test"
  }'
```

### Test 3: Nộp bài (Postman/Thunder Client)
```
POST http://localhost:3000/api/submissions/1/upload
Headers:
  Content-Type: multipart/form-data
Body (form-data):
  file: [chọn file]
  ma_sinh_vien: SV001
```

---

## 📊 Bước 6: Kiểm tra Database

Chạy query để verify:

```sql
-- Kiểm tra bảng tồn tại
SHOW TABLES LIKE '%bai_nop%';
SHOW TABLES LIKE '%bao_cao%';
SHOW TABLES LIKE '%thoi_gian_dang_ky%';

-- Xem cấu trúc
DESCRIBE bai_nop_cua_sinh_vien;
DESCRIBE dot_nop_bao_cao_theo_tuan;
DESCRIBE bao_cao_da_nop;
DESCRIBE thoi_gian_dang_ky_dot_thuc_tap;

-- Test data
SELECT * FROM thoi_gian_dang_ky_dot_thuc_tap;
SELECT * FROM bai_nop_cua_sinh_vien LIMIT 5;
```

---

## 🎨 Bước 7: Tích hợp Frontend

### Example: React Component

```jsx
// StudentSubmissionForm.jsx
import React, { useState, useEffect } from 'react';

function StudentSubmissionForm({ slotId }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  
  // Kiểm tra đợt có mở không
  useEffect(() => {
    fetch('/api/registration-periods/status')
      .then(res => res.json())
      .then(data => setStatus(data.data));
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!status?.isOpen) {
      alert('Đợt nộp bài đã đóng!');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`/api/submissions/${slotId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('✅ ' + result.message);
      } else {
        alert('❌ ' + result.message);
      }
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };
  
  return (
    <div>
      {status?.isOpen ? (
        <form onSubmit={handleSubmit}>
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files[0])}
            accept=".pdf,.doc,.docx"
          />
          <button type="submit">Nộp bài</button>
        </form>
      ) : (
        <p className="text-red-500">{status?.message}</p>
      )}
    </div>
  );
}
```

---

## ⚡ Bước 8: Tối ưu hóa (Optional)

### 8.1. Thêm CORS nếu frontend khác domain
```javascript
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true
}));
```

### 8.2. Compress response
```javascript
const compression = require('compression');
app.use(compression());
```

### 8.3. Rate limiting (chống spam upload)
```javascript
const rateLimit = require('express-rate-limit');

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // Tối đa 10 lần upload
  message: 'Quá nhiều lần nộp bài, vui lòng thử lại sau'
});

app.use('/api/submissions/:slotId/upload', uploadLimiter);
```

---

## 🐛 Troubleshooting

### Lỗi: "Cannot find module './src/routes/submissions'"
```bash
# Kiểm tra file tồn tại
ls backend/src/routes/submissions.js

# Restart server
npm run dev
```

### Lỗi: "ENOENT: no such file or directory, open 'uploads/...'"
```bash
# Tạo thư mục
mkdir -p backend/uploads/submissions
```

### Lỗi: "ER_NO_SUCH_TABLE: Table 'bai_nop_cua_sinh_vien' doesn't exist"
```bash
# Chạy migration hoặc tạo bảng thủ công
node backend/src/models/TeacherSubmissions.js
# Hoặc import SQL schema
```

### Lỗi: "File size too large"
```javascript
// Tăng giới hạn trong multer config (submissions.js)
limits: {
  fileSize: 50 * 1024 * 1024 // Tăng lên 50MB
}
```

---

## ✅ Checklist hoàn thành

- [ ] Install dependencies (`multer`)
- [ ] Đăng ký routes trong `server.js`
- [ ] Tạo thư mục `uploads/submissions`
- [ ] Test API với Postman/curl
- [ ] Kiểm tra database có bảng
- [ ] Thêm authentication middleware
- [ ] Tích hợp frontend
- [ ] Test upload file thực tế
- [ ] Test flow duyệt bài
- [ ] Test quản lý thời gian đăng ký

---

## 📚 Tài liệu tham khảo

- [API Documentation](./SUBMISSION_API_GUIDE.md)
- [Multer Documentation](https://github.com/expressjs/multer)
- [Express.js Guide](https://expressjs.com/)

---

## 🆘 Cần hỗ trợ?

Nếu gặp vấn đề, kiểm tra:
1. Console log trong terminal
2. Network tab trong DevTools
3. MySQL error logs
4. File permissions của thư mục `uploads/`

---

**Happy Coding! 🚀**

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const SubmissionService = require('../services/SubmissionService');
const { validateSubmissionTime } = require('../middleware/validateSubmissionTime');
const db = require('../database/connection');

// Cấu hình multer để upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const slotId = req.params.slotId;
    const uploadDir = path.join(process.cwd(), 'uploads', 'submissions', String(slotId));
    
    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const maSinhVien = req.user?.ma_sinh_vien || req.body?.ma_sinh_vien || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const sanitizedBasename = basename.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    cb(null, `${maSinhVien}_${timestamp}_${sanitizedBasename}${ext}`);
  }
});

// File filter - chỉ cho phép các loại file document
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Loại file không được hỗ trợ: ${file.mimetype}. Chỉ chấp nhận: PDF, Word, Excel, PowerPoint, JPG, PNG`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

/**
 * @route   POST /api/submissions/:slotId/upload
 * @desc    Sinh viên nộp bài vào đợt nộp bài
 * @access  Student (requires authentication)
 */
router.post('/:slotId/upload', validateSubmissionTime, upload.single('file'), async (req, res) => {
  try {
    const { slotId } = req.params;
    const maSinhVien = req.validatedSinhVien; // Đã được validate từ middleware
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file để nộp'
      });
    }

    // Kiểm tra quyền nộp bài
    const permission = await SubmissionService.checkSubmissionPermission(maSinhVien, slotId);
    if (!permission.allowed) {
      // Xóa file đã upload nếu không có quyền
      fs.unlinkSync(file.path);
      
      return res.status(403).json({
        success: false,
        message: permission.message
      });
    }

    // Kiểm tra file trùng lặp
    const duplicateCheck = await SubmissionService.checkDuplicateFile(
      maSinhVien,
      slotId,
      file.originalname
    );

    if (duplicateCheck.isDuplicate) {
      // Xóa file mới upload
      fs.unlinkSync(file.path);
      
      return res.status(400).json({
        success: false,
        message: duplicateCheck.message,
        data: duplicateCheck.existingFile
      });
    }

    // Lưu bài nộp
    const result = await SubmissionService.saveSubmission({
      slot_id: slotId,
      ma_sinh_vien: maSinhVien,
      file_path: file.path,
      original_name: file.originalname,
      mime_type: file.mimetype,
      file_size: file.size
    });

    return res.status(201).json({
      success: true,
      message: 'Nộp bài thành công',
      data: {
        submission: result.data,
        file: {
          name: file.originalname,
          size: file.size,
          type: file.mimetype
        }
      }
    });

  } catch (error) {
    console.error('❌ Error in upload submission:', error);
    
    // Xóa file nếu có lỗi
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message: 'Lỗi khi nộp bài',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/submissions/student/:maSinhVien
 * @desc    Lấy danh sách bài nộp của sinh viên
 * @access  Student/Teacher
 */
router.get('/student/:maSinhVien', async (req, res) => {
  try {
    const { maSinhVien } = req.params;
    const { slot_id, trang_thai } = req.query;

    let query = `
      SELECT 
        bncsv.id,
        bncsv.slot_id,
        bncsv.ma_sinh_vien,
        bncsv.original_name,
        bncsv.file_path,
        bncsv.mime_type,
        bncsv.file_size,
        bncsv.submitted_at,
        bncsv.teacher_comment,
        bncsv.trang_thai,
        bccsv.tieu_de as ten_dot_nop,
        bccsv.loai_bao_cao,
        bccsv.start_at,
        bccsv.end_at
      FROM bai_nop_cua_sinh_vien bncsv
      LEFT JOIN dot_nop_bao_cao_theo_tuan bccsv ON bncsv.slot_id = bccsv.id
      WHERE bncsv.ma_sinh_vien = ?
    `;

    const params = [maSinhVien];

    if (slot_id) {
      query += ' AND bncsv.slot_id = ?';
      params.push(slot_id);
    }

    if (trang_thai) {
      query += ' AND bncsv.trang_thai = ?';
      params.push(trang_thai);
    }

    query += ' ORDER BY bncsv.submitted_at DESC';

    const submissions = await db.query(query, params);

    // Lấy thống kê
    const statistics = await SubmissionService.getSubmissionStatistics(maSinhVien);

    return res.json({
      success: true,
      message: 'Lấy danh sách bài nộp thành công',
      data: {
        submissions,
        statistics,
        total: submissions.length
      }
    });

  } catch (error) {
    console.error('❌ Error in get student submissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bài nộp',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/submissions/:submissionId/review
 * @desc    Giảng viên duyệt hoặc từ chối bài nộp
 * @access  Teacher
 */
router.post('/:submissionId/review', async (req, res) => {
  try {
    const { submissionId } = req.params;
    const maGiangVien = req.user?.ma_giang_vien; // Giả sử có middleware xác thực
    const { trang_thai, teacher_comment, ly_do_tu_choi } = req.body;

    if (!maGiangVien) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin giảng viên'
      });
    }

    // Validate trạng thái
    if (!['da_duyet', 'tu_choi'].includes(trang_thai)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ. Chỉ chấp nhận: da_duyet hoặc tu_choi'
      });
    }

    // Nếu từ chối, phải có lý do
    if (trang_thai === 'tu_choi' && !ly_do_tu_choi) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập lý do từ chối'
      });
    }

    const result = await SubmissionService.reviewSubmission(
      submissionId,
      maGiangVien,
      { trang_thai, teacher_comment, ly_do_tu_choi }
    );

    return res.json({
      success: true,
      message: result.message,
      data: result.data
    });

  } catch (error) {
    console.error('❌ Error in review submission:', error);
    
    if (error.message.includes('Không tìm thấy')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('không có quyền')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Lỗi khi đánh giá bài nộp',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/submissions/slot/:slotId
 * @desc    Lấy tất cả bài nộp trong một đợt (cho giảng viên)
 * @access  Teacher
 */
router.get('/slot/:slotId', async (req, res) => {
  try {
    const { slotId } = req.params;
    const { trang_thai } = req.query;

    let query = `
      SELECT 
        bncsv.id,
        bncsv.ma_sinh_vien,
        bncsv.original_name,
        bncsv.file_size,
        bncsv.submitted_at,
        bncsv.teacher_comment,
        bncsv.trang_thai,
        sv.ho_ten as ten_sinh_vien,
        sv.lop,
        sv.email_ca_nhan
      FROM bai_nop_cua_sinh_vien bncsv
      LEFT JOIN sinh_vien sv ON bncsv.ma_sinh_vien = sv.ma_sinh_vien
      WHERE bncsv.slot_id = ?
    `;

    const params = [slotId];

    if (trang_thai) {
      query += ' AND bncsv.trang_thai = ?';
      params.push(trang_thai);
    }

    query += ' ORDER BY bncsv.submitted_at DESC';

    const submissions = await db.query(query, params);

    // Thống kê theo trạng thái
    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as tong_bai_nop,
        SUM(CASE WHEN trang_thai = 'da_nop' THEN 1 ELSE 0 END) as cho_duyet,
        SUM(CASE WHEN trang_thai = 'da_duyet' THEN 1 ELSE 0 END) as da_duyet,
        SUM(CASE WHEN trang_thai = 'tu_choi' THEN 1 ELSE 0 END) as tu_choi
       FROM bai_nop_cua_sinh_vien
       WHERE slot_id = ?`,
      [slotId]
    );

    return res.json({
      success: true,
      message: 'Lấy danh sách bài nộp thành công',
      data: {
        submissions,
        statistics: stats,
        total: submissions.length
      }
    });

  } catch (error) {
    console.error('❌ Error in get slot submissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bài nộp',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/submissions/:submissionId
 * @desc    Xóa bài nộp (chỉ sinh viên mới được xóa bài của mình, và chỉ khi chưa được duyệt)
 * @access  Student
 */
router.delete('/:submissionId', async (req, res) => {
  try {
    const { submissionId } = req.params;
    const maSinhVien = req.user?.ma_sinh_vien;

    if (!maSinhVien) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin sinh viên'
      });
    }

    // Lấy thông tin bài nộp
    const [submission] = await db.query(
      `SELECT * FROM bai_nop_cua_sinh_vien WHERE id = ? AND ma_sinh_vien = ? LIMIT 1`,
      [submissionId, maSinhVien]
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài nộp hoặc bạn không có quyền xóa'
      });
    }

    // Chỉ được xóa nếu chưa được duyệt
    if (submission.trang_thai !== 'da_nop') {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa bài nộp đã được duyệt hoặc đã bị từ chối'
      });
    }

    // Xóa file vật lý
    if (fs.existsSync(submission.file_path)) {
      fs.unlinkSync(submission.file_path);
    }

    // Xóa trong database
    await db.query('DELETE FROM bai_nop_cua_sinh_vien WHERE id = ?', [submissionId]);

    return res.json({
      success: true,
      message: 'Xóa bài nộp thành công'
    });

  } catch (error) {
    console.error('❌ Error in delete submission:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa bài nộp',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

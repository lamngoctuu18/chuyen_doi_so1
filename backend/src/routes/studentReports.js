const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const StudentReportSubmission = require('../models/StudentReportSubmission');

// Cấu hình multer để upload file báo cáo
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/student-reports');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file PDF, Word, Excel, PowerPoint'), false);
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
 * @swagger
 * /api/student-reports/upload:
 *   post:
 *     tags: [Nộp Báo Cáo]
 *     summary: Upload báo cáo thực tập
 *     description: Sinh viên nộp báo cáo thực tập (PDF, Word, Excel, PowerPoint - Max 10MB)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/StudentReportUpload'
 *     responses:
 *       201:
 *         description: Nộp báo cáo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Nộp báo cáo thành công
 *                 data:
 *                   $ref: '#/components/schemas/StudentReport'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/upload', upload.single('report_file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file báo cáo'
      });
    }

    const {
      ma_sinh_vien,
      dot_thuc_tap_id,
      loai_bao_cao,
      ghi_chu
    } = req.body;

    // Validate required fields
    if (!ma_sinh_vien || !dot_thuc_tap_id || !loai_bao_cao) {
      // Xóa file đã upload nếu validation fail
      await fs.unlink(req.file.path).catch(console.error);
      
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: ma_sinh_vien, dot_thuc_tap_id, loai_bao_cao'
      });
    }

    const reportData = {
      ma_sinh_vien,
      dot_thuc_tap_id: parseInt(dot_thuc_tap_id),
      loai_bao_cao,
      file_path: req.file.path,
      file_name: req.file.originalname,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      ghi_chu: ghi_chu || null
    };

    const result = await StudentReportSubmission.createReport(reportData);

    res.status(201).json({
      success: true,
      message: 'Nộp báo cáo thành công',
      data: result.data
    });

  } catch (error) {
    // Xóa file nếu có lỗi
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }

    console.error('Error uploading report:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi nộp báo cáo'
    });
  }
});

/**
 * @swagger
 * /api/student-reports:
 *   get:
 *     tags: [Nộp Báo Cáo]
 *     summary: Lấy danh sách báo cáo với filter
 *     description: Lấy danh sách báo cáo thực tập đã nộp (có phân trang và filter)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ma_sinh_vien
 *         schema:
 *           type: string
 *         description: Mã sinh viên
 *       - in: query
 *         name: dot_thuc_tap_id
 *         schema:
 *           type: integer
 *         description: ID đợt thực tập
 *       - in: query
 *         name: trang_thai_duyet
 *         schema:
 *           type: string
 *           enum: [cho_duyet, da_duyet, tu_choi]
 *         description: Trạng thái duyệt
 *       - in: query
 *         name: loai_bao_cao
 *         schema:
 *           type: string
 *           enum: [tuan, thang, cuoi_ky, tong_ket]
 *         description: Loại báo cáo
 *       - in: query
 *         name: ngay_nop_tu
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày nộp từ (YYYY-MM-DD)
 *       - in: query
 *         name: ngay_nop_den
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày nộp đến (YYYY-MM-DD)
 *       - in: query
 *         name: ma_giang_vien
 *         schema:
 *           type: string
 *         description: Mã giảng viên hướng dẫn
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số bản ghi mỗi trang
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StudentReport'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', async (req, res) => {
  try {
    const filters = {
      ma_sinh_vien: req.query.ma_sinh_vien,
      dot_thuc_tap_id: req.query.dot_thuc_tap_id ? parseInt(req.query.dot_thuc_tap_id) : undefined,
      trang_thai_duyet: req.query.trang_thai_duyet,
      loai_bao_cao: req.query.loai_bao_cao,
      ngay_nop_tu: req.query.ngay_nop_tu,
      ngay_nop_den: req.query.ngay_nop_den,
      ma_giang_vien: req.query.ma_giang_vien,
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 20
    };

    const result = await StudentReportSubmission.getReportsList(filters);

    res.json({
      success: true,
      message: 'Lấy danh sách báo cáo thành công',
      data: result.data,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('Error getting reports list:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách báo cáo'
    });
  }
});

/**
 * @swagger
 * /api/student-reports/{id}:
 *   get:
 *     tags: [Nộp Báo Cáo]
 *     summary: Lấy chi tiết một báo cáo
 *     description: Xem thông tin chi tiết báo cáo đã nộp
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID báo cáo
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/StudentReport'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);

    const result = await StudentReportSubmission.getReportsList({
      report_id: reportId,
      limit: 1
    });

    if (!result.data || result.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy báo cáo'
      });
    }

    res.json({
      success: true,
      message: 'Lấy thông tin báo cáo thành công',
      data: result.data[0]
    });

  } catch (error) {
    console.error('Error getting report detail:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy thông tin báo cáo'
    });
  }
});

/**
 * @swagger
 * /api/student-reports/{id}/review:
 *   post:
 *     tags: [Nộp Báo Cáo]
 *     summary: Giảng viên duyệt/từ chối báo cáo
 *     description: Giảng viên phê duyệt hoặc từ chối báo cáo của sinh viên
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID báo cáo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewReportRequest'
 *     responses:
 *       200:
 *         description: Duyệt báo cáo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/StudentReport'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/:id/review', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const { nguoi_duyet, trang_thai_duyet, nhan_xet } = req.body;

    // Validate
    if (!nguoi_duyet || !trang_thai_duyet) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin: nguoi_duyet, trang_thai_duyet'
      });
    }

    if (!['da_duyet', 'tu_choi'].includes(trang_thai_duyet)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ. Chỉ chấp nhận: da_duyet hoặc tu_choi'
      });
    }

    const reviewData = {
      trang_thai_duyet,
      nhan_xet: nhan_xet || null,
      ly_do_tu_choi: trang_thai_duyet === 'tu_choi' ? nhan_xet : null
    };

    const result = await StudentReportSubmission.reviewReport(
      reportId,
      nguoi_duyet,
      reviewData
    );

    res.json({
      success: true,
      message: result.message,
      data: result.data
    });

  } catch (error) {
    console.error('Error reviewing report:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi duyệt báo cáo'
    });
  }
});

/**
 * @swagger
 * /api/student-reports/statistics/{ma_sinh_vien}:
 *   get:
 *     tags: [Nộp Báo Cáo]
 *     summary: Lấy thống kê báo cáo của sinh viên
 *     description: Thống kê số lượng báo cáo theo trạng thái và loại báo cáo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ma_sinh_vien
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã sinh viên
 *     responses:
 *       200:
 *         description: Lấy thống kê thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ReportStatistics'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/statistics/:ma_sinh_vien', async (req, res) => {
  try {
    const { ma_sinh_vien } = req.params;

    const result = await StudentReportSubmission.getStatistics(ma_sinh_vien);

    res.json({
      success: true,
      message: 'Lấy thống kê thành công',
      data: result
    });

  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy thống kê'
    });
  }
});

/**
 * @swagger
 * /api/student-reports/{id}:
 *   delete:
 *     tags: [Nộp Báo Cáo]
 *     summary: Xóa báo cáo (chỉ báo cáo chờ duyệt)
 *     description: Sinh viên xóa báo cáo đang chờ duyệt (không thể xóa báo cáo đã duyệt/từ chối)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID báo cáo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ma_sinh_vien
 *             properties:
 *               ma_sinh_vien:
 *                 type: string
 *                 example: SV001
 *     responses:
 *       200:
 *         description: Xóa báo cáo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         description: Không thể xóa báo cáo đã duyệt
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const { ma_sinh_vien } = req.body;

    if (!ma_sinh_vien) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin: ma_sinh_vien'
      });
    }

    const result = await StudentReportSubmission.deleteReport(reportId, ma_sinh_vien);

    // Xóa file vật lý
    if (result.data && result.data.file_path) {
      await fs.unlink(result.data.file_path).catch(err => {
        console.error('Error deleting physical file:', err);
      });
    }

    res.json({
      success: true,
      message: result.message,
      data: result.data
    });

  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi xóa báo cáo'
    });
  }
});

/**
 * @swagger
 * /api/student-reports/download/{id}:
 *   get:
 *     tags: [Nộp Báo Cáo]
 *     summary: Download file báo cáo
 *     description: Tải xuống file báo cáo đã nộp
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID báo cáo
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/download/:id', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);

    // Lấy thông tin báo cáo
    const result = await StudentReportSubmission.getReportsList({
      report_id: reportId,
      limit: 1
    });

    if (!result.data || result.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy báo cáo'
      });
    }

    const report = result.data[0];
    const filePath = report.file_path;

    // Kiểm tra file tồn tại
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'File không tồn tại'
      });
    }

    // Download file
    res.download(filePath, report.file_name, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({
          success: false,
          message: 'Lỗi khi tải file'
        });
      }
    });

  } catch (error) {
    console.error('Error in download route:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tải file'
    });
  }
});

module.exports = router;

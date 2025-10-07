const express = require('express');
const router = express.Router();
const DoanhNghiep = require('../models/DoanhNghiep');
const DoanhNghiepController = require('../controllers/DoanhNghiepController');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Cấu hình multer cho upload file Excel
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/excel/');
  },
  filename: function (req, file, cb) {
    cb(null, 'excelFile-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls)'));
    }
  }
});

// GET /api/doanh-nghiep - Lấy danh sách doanh nghiệp với phân trang
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    let result;
    if (search && search.trim()) {
      result = await DoanhNghiep.search(search.trim(), parseInt(page), parseInt(limit));
    } else {
      result = await DoanhNghiep.getAll(parseInt(page), parseInt(limit));
    }

    res.json({
      success: true,
      message: 'Lấy danh sách doanh nghiệp thành công',
      data: {
        companies: result.doanhNghieps || [],
        pagination: result.pagination || {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0
        }
      }
    });
  } catch (error) {
    console.error('Error in GET /api/doanh-nghiep:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy danh sách doanh nghiệp'
    });
  }
});

// GET /api/doanh-nghiep/stats - Thống kê doanh nghiệp
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Tạm thời trả về stats cơ bản
    const allResult = await DoanhNghiep.getAll(1, 1000);
    const stats = {
      total: allResult.pagination?.total || 0,
      byLoaiHinh: {},
      byQuyMo: {}
    };
    
    res.json({
      success: true,
      message: 'Lấy thống kê doanh nghiệp thành công',
      data: stats
    });
  } catch (error) {
    console.error('Error in GET /api/doanh-nghiep/stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy thống kê doanh nghiệp'
    });
  }
});

// GET /api/doanh-nghiep/:id - Lấy thông tin doanh nghiệp theo account ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await DoanhNghiep.findByAccountId(id);
    
    if (result.success && result.data) {
      res.json({
        success: true,
        message: 'Lấy thông tin doanh nghiệp thành công',
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message || 'Không tìm thấy doanh nghiệp'
      });
    }
  } catch (error) {
    console.error('Error in GET /api/doanh-nghiep/:id:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy thông tin doanh nghiệp'
    });
  }
});

// PUT /api/doanh-nghiep/:id - Cập nhật thông tin doanh nghiệp
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await DoanhNghiep.updateByAccountId(id, req.body);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message || 'Cập nhật doanh nghiệp thành công',
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message || 'Không tìm thấy doanh nghiệp'
      });
    }
  } catch (error) {
    console.error('Error in PUT /api/doanh-nghiep/:id:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi cập nhật doanh nghiệp'
    });
  }
});

// DELETE /api/doanh-nghiep/:id - Xóa doanh nghiệp
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await DoanhNghiep.delete(id);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message || 'Xóa doanh nghiệp thành công'
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message || 'Không tìm thấy doanh nghiệp'
      });
    }
  } catch (error) {
    console.error('Error in DELETE /api/doanh-nghiep/:id:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi xóa doanh nghiệp'
    });
  }
});

// POST /api/doanh-nghiep/sync - Đồng bộ doanh nghiệp từ sinh viên hướng dẫn
router.post('/sync', authenticateToken, DoanhNghiepController.syncFromSinhVienHuongDan);

// GET /api/doanh-nghiep/export - Xuất Excel danh sách doanh nghiệp với số lượng sinh viên
router.get('/export', authenticateToken, DoanhNghiepController.exportToExcel);

// POST /api/doanh-nghiep/import - Import Excel sinh viên thực tập
router.post('/import', authenticateToken, upload.single('excelFile'), DoanhNghiepController.importFromExcel);

module.exports = router;
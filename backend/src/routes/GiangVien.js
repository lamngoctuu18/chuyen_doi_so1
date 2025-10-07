const express = require('express');
const router = express.Router();
const GiangVien = require('../models/GiangVien');
const GiangVienController = require('../controllers/GiangVienController');
const { authenticateToken } = require('../middleware/auth');

// GET /api/giang-vien - Lấy danh sách giảng viên với phân trang
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    let result;
    if (search && search.trim()) {
      result = await GiangVien.search(search.trim(), parseInt(page), parseInt(limit));
    } else {
      result = await GiangVien.getAll(parseInt(page), parseInt(limit));
    }

    res.json({
      success: true,
      message: 'Lấy danh sách giảng viên thành công',
      data: {
        teachers: result.giangViens || [],
        pagination: result.pagination || {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0
        }
      }
    });
  } catch (error) {
    console.error('Error in GET /api/giang-vien:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy danh sách giảng viên'
    });
  }
});

// GET /api/giang-vien/stats - Thống kê giảng viên
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Tạm thời trả về stats cơ bản
    const allResult = await GiangVien.getAll(1, 1000);
    const stats = {
      total: allResult.pagination?.total || 0,
      byKhoa: {},
      byBoMon: {}
    };
    
    res.json({
      success: true,
      message: 'Lấy thống kê giảng viên thành công',
      data: stats
    });
  } catch (error) {
    console.error('Error in GET /api/giang-vien/stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy thống kê giảng viên'
    });
  }
});

// GET /api/giang-vien/:id - Lấy thông tin giảng viên theo account ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await GiangVien.findByAccountId(id);
    
    if (result.success && result.data) {
      res.json({
        success: true,
        message: 'Lấy thông tin giảng viên thành công',
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message || 'Không tìm thấy giảng viên'
      });
    }
  } catch (error) {
    console.error('Error in GET /api/giang-vien/:id:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy thông tin giảng viên'
    });
  }
});

// PUT /api/giang-vien/:id - Cập nhật thông tin giảng viên
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await GiangVien.updateByAccountId(id, req.body);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message || 'Cập nhật giảng viên thành công',
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message || 'Không tìm thấy giảng viên'
      });
    }
  } catch (error) {
    console.error('Error in PUT /api/giang-vien/:id:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi cập nhật giảng viên'
    });
  }
});

// DELETE /api/giang-vien/:id - Xóa giảng viên
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await GiangVien.delete(id);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message || 'Xóa giảng viên thành công'
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message || 'Không tìm thấy giảng viên'
      });
    }
  } catch (error) {
    console.error('Error in DELETE /api/giang-vien/:id:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi xóa giảng viên'
    });
  }
});

// GET /api/giang-vien/export - Xuất Excel danh sách giảng viên với số lượng sinh viên hướng dẫn
router.get('/export', authenticateToken, GiangVienController.exportToExcel);

module.exports = router;
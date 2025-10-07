const express = require('express');
const router = express.Router();
const SinhVien = require('../models/SinhVien');
const { authenticateToken } = require('../middleware/auth');

// GET /api/sinh-vien - Lấy danh sách sinh viên với phân trang
router.get('/', authenticateToken, async (req, res) => {
  try {
    let { page = 1, limit = 10, search = '', nguyen_vong = '' } = req.query;

    // Normalize possible display strings to stored codes to make filter robust
    if (typeof nguyen_vong === 'string' && nguyen_vong) {
      const nv = nguyen_vong.toLowerCase().trim();
      if (nv === 'khoa giới thiệu' || nv === 'khoa-gioi-thieu' || nv === 'khoa_gioi_thieu') {
        nguyen_vong = 'khoa_gioi_thieu';
      } else if (nv === 'tự liên hệ' || nv === 'tu-lien-he' || nv === 'tu_lien_he') {
        nguyen_vong = 'tu_lien_he';
      }
    }

    // Recalculate assignment status for students before returning list (lightweight, idempotent)
    try {
      await SinhVien.recalcAssignmentStatus();
    } catch (err) {
      console.warn('Warning: failed to recalc assignment status:', err.message || err);
    }

    const result = await SinhVien.getAllWithPagination(
      parseInt(page),
      parseInt(limit),
      search,
      nguyen_vong
    );

    res.json({
      success: true,
      message: 'Lấy danh sách sinh viên thành công',
      data: {
        students: result.data || [],
        pagination: result.pagination || {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total: 0,
          totalPages: 0
        }
      }
    });
  } catch (error) {
    console.error('Error in GET /api/sinh-vien:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy danh sách sinh viên'
    });
  }
});

// GET /api/sinh-vien/stats - Thống kê sinh viên
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await SinhVien.getStatistics();
    res.json({
      success: true,
      message: 'Lấy thống kê sinh viên thành công',
      data: stats
    });
  } catch (error) {
    console.error('Error in GET /api/sinh-vien/stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy thống kê sinh viên'
    });
  }
});

// IMPORTANT: Place specific routes BEFORE dynamic parameter routes to avoid conflicts

// POST /api/sinh-vien/register-internship - Student registers for internship
router.post('/register-internship', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const {
      nguyen_vong_thuc_tap,
      vi_tri_muon_ung_tuyen_thuc_tap,
      don_vi_thuc_tap,
      cong_ty_tu_lien_he,
      dia_chi_cong_ty,
      nguoi_lien_he_cong_ty,
      sdt_nguoi_lien_he
    } = req.body;

    // Validate required fields
    if (!nguyen_vong_thuc_tap || !vi_tri_muon_ung_tuyen_thuc_tap) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin nguyện vọng thực tập và vị trí mong muốn'
      });
    }

    // If student chooses 'tu_lien_he', validate company info
    if (nguyen_vong_thuc_tap === 'tu_lien_he') {
      if (!cong_ty_tu_lien_he || !dia_chi_cong_ty || !nguoi_lien_he_cong_ty || !sdt_nguoi_lien_he) {
        return res.status(400).json({
          success: false,
          message: 'Khi chọn tự liên hệ, vui lòng điền đầy đủ thông tin công ty'
        });
      }
    }

    // Update student record
    const result = await SinhVien.updateInternshipRegistration(userId, {
      nguyen_vong_thuc_tap,
      vi_tri_muon_ung_tuyen_thuc_tap,
      don_vi_thuc_tap: nguyen_vong_thuc_tap === 'tu_lien_he' ? cong_ty_tu_lien_he : don_vi_thuc_tap,
      cong_ty_tu_lien_he: nguyen_vong_thuc_tap === 'tu_lien_he' ? cong_ty_tu_lien_he : null,
      dia_chi_cong_ty: nguyen_vong_thuc_tap === 'tu_lien_he' ? dia_chi_cong_ty : null,
      nguoi_lien_he_cong_ty: nguyen_vong_thuc_tap === 'tu_lien_he' ? nguoi_lien_he_cong_ty : null,
      sdt_nguoi_lien_he: nguyen_vong_thuc_tap === 'tu_lien_he' ? sdt_nguoi_lien_he : null
    });

    // If result contains updated student data, return it
    res.json({
      success: true,
      message: 'Đăng ký thực tập thành công',
      data: result.data || result
    });
  } catch (error) {
    console.error('Error in POST /api/sinh-vien/register-internship:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi đăng ký thực tập'
    });
  }
});

// GET /api/sinh-vien/test - Test endpoint without auth
router.get('/test', async (req, res) => {
  res.json({
    success: true,
    message: 'Test endpoint hoạt động',
    data: { timestamp: new Date() }
  });
});

// GET /api/sinh-vien/my-registration - Get current student's registration info
router.get('/my-registration', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    console.log('[SinhVien/my-registration v2] User ID from token:', userId);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID không tìm thấy trong token'
      });
    }

    const student = await SinhVien.getByUserId(userId);

    res.json({
      success: true,
      message: 'Lấy thông tin đăng ký thành công',
      data: student
    });
  } catch (error) {
    console.error('Error in GET /api/sinh-vien/my-registration:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy thông tin đăng ký'
    });
  }
});

// Dynamic parameter routes come LAST
// GET /api/sinh-vien/:id - Lấy thông tin sinh viên theo ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await SinhVien.findByAccountId(id);
    
    if (result.success && result.data) {
      res.json({
        success: true,
        message: 'Lấy thông tin sinh viên thành công',
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên'
      });
    }
  } catch (error) {
    console.error('Error in GET /api/sinh-vien/:id:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy thông tin sinh viên'
    });
  }
});

// PUT /api/sinh-vien/:id - Cập nhật thông tin sinh viên
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await SinhVien.updateByAccountId(id, req.body);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message || 'Cập nhật sinh viên thành công',
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message || 'Không tìm thấy sinh viên'
      });
    }
  } catch (error) {
    console.error('Error in PUT /api/sinh-vien/:id:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi cập nhật sinh viên'
    });
  }
});

// DELETE /api/sinh-vien/:id - Xóa sinh viên
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await SinhVien.deleteByAccountId(id);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message || 'Xóa sinh viên thành công'
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message || 'Không tìm thấy sinh viên'
      });
    }
  } catch (error) {
    console.error('Error in DELETE /api/sinh-vien/:id:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi xóa sinh viên'
    });
  }
});

// (Duplicate routes removed below to avoid conflicts)

module.exports = router;
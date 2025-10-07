const TeacherProfile = require('../models/TeacherProfile');

class TeacherProfileController {
  // GET /api/teacher-profile/info - Lấy thông tin giảng viên
  static async getInfo(req, res) {
    try {
      const maGiangVien = req.user?.maGiangVien || req.user?.userId;
      
      if (!maGiangVien) {
        return res.status(401).json({ 
          success: false, 
          message: 'Không tìm thấy thông tin giảng viên' 
        });
      }

      const teacherInfo = await TeacherProfile.getTeacherInfo(maGiangVien);
      
      res.json({
        success: true,
        data: teacherInfo
      });
    } catch (error) {
      console.error('❌ Get teacher info error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi lấy thông tin giảng viên: ' + error.message 
      });
    }
  }

  // GET /api/teacher-profile/dashboard - Lấy thống kê dashboard
  static async getDashboardStats(req, res) {
    try {
      const maGiangVien = req.user?.maGiangVien || req.user?.userId;
      
      if (!maGiangVien) {
        return res.status(401).json({ 
          success: false, 
          message: 'Không tìm thấy thông tin giảng viên' 
        });
      }

      const stats = await TeacherProfile.getDashboardStats(maGiangVien);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ Get dashboard stats error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi lấy thống kê dashboard: ' + error.message 
      });
    }
  }
}

module.exports = TeacherProfileController;
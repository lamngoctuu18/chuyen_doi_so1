const SinhVien = require('../models/SinhVien');
const GiangVien = require('../models/GiangVien');
const DoanhNghiep = require('../models/DoanhNghiep');
const connection = require('../database/connection');

class DashboardController {
  // GET /api/dashboard/stats - Lấy thống kê dashboard
  static async getStats(req, res) {
    try {
      // Lấy số lượng sinh viên
      const sinhVienResult = await SinhVien.getAllWithPagination(1, 1);
      const totalSinhVien = sinhVienResult.pagination.total;
      
      // Lấy số lượng giảng viên
      const giangVienResult = await GiangVien.getAll(1, 1);
      const totalGiangVien = giangVienResult.pagination.total;
      
      // Lấy số lượng doanh nghiệp
      const doanhNghiepResult = await DoanhNghiep.getAll(1, 1);
      const totalDoanhNghiep = doanhNghiepResult.pagination.total;
      
      // Lấy số lượng sinh viên đang thực tập (có thông tin thực tập)
      const [internshipStats] = await connection.query(`
        SELECT 
          COUNT(DISTINCT sv.ma_sinh_vien) as total_interns
        FROM sinh_vien sv
        INNER JOIN sinh_vien_huong_dan svhd ON sv.ma_sinh_vien = svhd.ma_sinh_vien
        WHERE svhd.doanh_nghiep_thuc_tap IS NOT NULL AND svhd.doanh_nghiep_thuc_tap != ''
      `);
      
      const totalInterns = internshipStats.total_interns || 0;
      
      // Lấy số báo cáo (có thể mở rộng sau)
      const totalReports = 0; // Placeholder
      
      const stats = {
        totalSinhVien,
        totalGiangVien,
        totalDoanhNghiep,
        totalInterns,
        totalReports,
        lastUpdated: new Date().toISOString()
      };
      
      res.json({
        success: true,
        message: 'Lấy thống kê dashboard thành công',
        data: stats
      });
      
    } catch (error) {
      console.error('❌ Lỗi lấy thống kê dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thống kê dashboard',
        error: error.message
      });
    }
  }
}

module.exports = DashboardController;
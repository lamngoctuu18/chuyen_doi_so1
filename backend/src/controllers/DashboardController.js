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

  // GET /api/dashboard/overview - Lấy thống kê tổng quan cho admin
  static async getOverview(req, res) {
    try {
      // Thống kê sinh viên
      const [studentStats] = await connection.query(`
        SELECT 
          COUNT(*) as total_students,
          COUNT(CASE WHEN giang_vien_huong_dan IS NOT NULL AND giang_vien_huong_dan <> '' THEN 1 END) as students_with_advisor,
          COUNT(CASE WHEN don_vi_thuc_tap IS NOT NULL AND don_vi_thuc_tap <> '' THEN 1 END) as students_with_company,
          COUNT(CASE WHEN trang_thai_phan_cong = 'da-phan-cong' THEN 1 END) as fully_assigned_students
        FROM sinh_vien
      `);

      // Thống kê giảng viên
      const [teacherStats] = await connection.query(`
        SELECT 
          COUNT(*) as total_teachers,
          COUNT(CASE WHEN so_sinh_vien_huong_dan > 0 THEN 1 END) as active_advisors,
          SUM(COALESCE(so_sinh_vien_huong_dan, 0)) as total_supervision_count
        FROM giang_vien
      `);

      // Thống kê doanh nghiệp
      const [companyStats] = await connection.query(`
        SELECT 
          COUNT(*) as total_companies,
          COUNT(CASE WHEN trang_thai_hop_tac = 'Đang hợp tác' THEN 1 END) as active_companies
        FROM doanh_nghiep
      `);

      // Thống kê đợt thực tập
      const [batchStats] = await connection.query(`
        SELECT 
          COUNT(*) as total_batches,
          COUNT(CASE WHEN trang_thai = 'dang-dien-ra' THEN 1 END) as active_batches,
          COUNT(CASE WHEN trang_thai = 'sap-mo' THEN 1 END) as upcoming_batches
        FROM dot_thuc_tap
      `);

      const overview = {
        students: {
          total: studentStats.total_students || 0,
          withAdvisor: studentStats.students_with_advisor || 0,
          withCompany: studentStats.students_with_company || 0,
          fullyAssigned: studentStats.fully_assigned_students || 0
        },
        teachers: {
          total: teacherStats.total_teachers || 0,
          activeAdvisors: teacherStats.active_advisors || 0,
          totalSupervisionCount: teacherStats.total_supervision_count || 0
        },
        companies: {
          total: companyStats.total_companies || 0,
          active: companyStats.active_companies || 0
        },
        batches: {
          total: batchStats.total_batches || 0,
          active: batchStats.active_batches || 0,
          upcoming: batchStats.upcoming_batches || 0
        }
      };

      res.json({
        success: true,
        message: 'Lấy thống kê tổng quan thành công',
        data: overview
      });

    } catch (error) {
      console.error('❌ Lỗi lấy thống kê tổng quan:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thống kê tổng quan',
        error: error.message
      });
    }
  }

  // GET /api/dashboard/summary - Lấy tóm tắt hệ thống
  static async getSummary(req, res) {
    try {
      // Tóm tắt nhanh các con số quan trọng
      const [summary] = await connection.query(`
        SELECT 
          (SELECT COUNT(*) FROM sinh_vien) as total_students,
          (SELECT COUNT(*) FROM giang_vien) as total_teachers,
          (SELECT COUNT(*) FROM doanh_nghiep) as total_companies,
          (SELECT COUNT(*) FROM dot_thuc_tap WHERE trang_thai = 'dang-dien-ra') as active_batches,
          (SELECT COUNT(*) FROM sinh_vien WHERE trang_thai_phan_cong = 'da-phan-cong') as assigned_students,
          (SELECT COUNT(*) FROM sinh_vien WHERE nguyen_vong_thuc_tap = 'khoa_gioi_thieu') as khoa_intro_students,
          (SELECT COUNT(*) FROM sinh_vien WHERE nguyen_vong_thuc_tap = 'tu_lien_he') as self_contact_students
      `);

      const data = summary || {};

      res.json({
        success: true,
        message: 'Lấy tóm tắt hệ thống thành công',
        data: {
          totalStudents: data.total_students || 0,
          totalTeachers: data.total_teachers || 0,
          totalCompanies: data.total_companies || 0,
          activeBatches: data.active_batches || 0,
          assignedStudents: data.assigned_students || 0,
          khoaIntroStudents: data.khoa_intro_students || 0,
          selfContactStudents: data.self_contact_students || 0,
          assignmentRate: data.total_students > 0 ? 
            Math.round((data.assigned_students / data.total_students) * 100) : 0
        }
      });

    } catch (error) {
      console.error('❌ Lỗi lấy tóm tắt hệ thống:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy tóm tắt hệ thống',
        error: error.message
      });
    }
  }
}

module.exports = DashboardController;
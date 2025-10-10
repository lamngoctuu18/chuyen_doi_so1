const connection = require('../database/connection');

class InternshipReportsController {
  /**
   * Lấy danh sách báo cáo thực tập của sinh viên theo lớp
   * GET /api/internship-reports/students
   */
  static async getStudentReports(req, res) {
    try {
      const { class: className, status } = req.query;

      let query = `
        SELECT 
          sv.id,
          sv.ma_sinh_vien as maSinhVien,
          sv.ho_ten as hoTen,
          sv.lop,
          COALESCE(sv.email_ca_nhan, svhd.email_sinh_vien) as email,
          COALESCE(sv.so_dien_thoai, svhd.so_dien_thoai_sinh_vien) as soDienThoai,
          COALESCE(gv.ho_ten, svhd.ten_giang_vien, 'Chưa phân công') as giangVienHuongDan,
          COALESCE(dn.ten_cong_ty, svhd.doanh_nghiep_thuc_tap, 'Chưa xác định') as doanhNghiepThucTap,
          COALESCE(svhd.vi_tri_thuc_tap, 'Chưa xác định') as viTriThucTap,
          pct.diem_giang_vien as diemGiangVien,
          CASE 
            WHEN pct.diem_giang_vien IS NOT NULL AND pct.diem_giang_vien >= 5 
            THEN 'da-hoan-thanh'
            ELSE 'chua-hoan-thanh'
          END as trangThaiBaoCao,
          pct.ngay_bat_dau as ngayBatDauThucTap,
          pct.ngay_ket_thuc as ngayKetThucThucTap,
          pct.nhan_xet_giang_vien as nhanXetGiangVien
        FROM sinh_vien sv
        LEFT JOIN phan_cong_thuc_tap pct ON sv.id = pct.sinh_vien_id
        LEFT JOIN giang_vien gv ON pct.giang_vien_id = gv.id
        LEFT JOIN doanh_nghiep dn ON pct.doanh_nghiep_id = dn.id
        LEFT JOIN sinh_vien_huong_dan svhd ON sv.ma_sinh_vien = svhd.ma_sinh_vien
        WHERE 1=1
      `;

      const params = [];

      if (className && className !== 'all') {
        query += ` AND sv.lop = ?`;
        params.push(className);
      }

      if (status && status !== 'all') {
        if (status === 'da-hoan-thanh') {
          query += ` AND pct.diem_giang_vien IS NOT NULL AND pct.diem_giang_vien >= 5`;
        } else if (status === 'chua-hoan-thanh') {
          query += ` AND (pct.diem_giang_vien IS NULL OR pct.diem_giang_vien < 5)`;
        }
      }

      query += ` ORDER BY sv.lop, sv.ho_ten`;

      const students = await connection.query(query, params);

      return res.json({
        success: true,
        data: students
      });
    } catch (error) {
      console.error('Error in getStudentReports:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách báo cáo sinh viên',
        error: error.message
      });
    }
  }

  /**
   * Lấy thống kê báo cáo theo lớp
   * GET /api/internship-reports/class-stats
   */
  static async getClassStats(req, res) {
    try {
      const query = `
        SELECT 
          sv.lop as tenLop,
          COUNT(sv.id) as tongSinhVien,
          SUM(CASE WHEN pct.diem_giang_vien IS NOT NULL AND pct.diem_giang_vien >= 5 THEN 1 ELSE 0 END) as daHoanThanh,
          SUM(CASE WHEN pct.diem_giang_vien IS NULL OR pct.diem_giang_vien < 5 THEN 1 ELSE 0 END) as chuaHoanThanh,
          ROUND(
            (SUM(CASE WHEN pct.diem_giang_vien IS NOT NULL AND pct.diem_giang_vien >= 5 THEN 1 ELSE 0 END) / COUNT(sv.id)) * 100,
            0
          ) as tyLeHoanThanh
        FROM sinh_vien sv
        LEFT JOIN phan_cong_thuc_tap pct ON sv.id = pct.sinh_vien_id
        WHERE sv.lop IS NOT NULL AND sv.lop != ''
        GROUP BY sv.lop
        ORDER BY sv.lop
      `;

      const stats = await connection.query(query);

      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error in getClassStats:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thống kê theo lớp',
        error: error.message
      });
    }
  }

  /**
   * Lấy thống kê tổng quan
   * GET /api/internship-reports/overview-stats
   */
  static async getOverviewStats(req, res) {
    try {
      const query = `
        SELECT 
          COUNT(sv.id) as tongSinhVien,
          SUM(CASE WHEN pct.diem_giang_vien IS NOT NULL AND pct.diem_giang_vien >= 5 THEN 1 ELSE 0 END) as daHoanThanh,
          SUM(CASE WHEN pct.diem_giang_vien IS NULL OR pct.diem_giang_vien < 5 THEN 1 ELSE 0 END) as chuaHoanThanh,
          ROUND(
            (SUM(CASE WHEN pct.diem_giang_vien IS NOT NULL AND pct.diem_giang_vien >= 5 THEN 1 ELSE 0 END) / COUNT(sv.id)) * 100,
            0
          ) as tyLeHoanThanh
        FROM sinh_vien sv
        LEFT JOIN phan_cong_thuc_tap pct ON sv.id = pct.sinh_vien_id
      `;

      const [stats] = await connection.query(query);

      return res.json({
        success: true,
        data: stats || {
          tongSinhVien: 0,
          daHoanThanh: 0,
          chuaHoanThanh: 0,
          tyLeHoanThanh: 0
        }
      });
    } catch (error) {
      console.error('Error in getOverviewStats:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thống kê tổng quan',
        error: error.message
      });
    }
  }

  /**
   * Lấy danh sách lớp
   * GET /api/internship-reports/classes
   */
  static async getClasses(req, res) {
    try {
      const query = `
        SELECT DISTINCT lop as className
        FROM sinh_vien
        WHERE lop IS NOT NULL AND lop != ''
        ORDER BY lop
      `;

      const classes = await connection.query(query);

      return res.json({
        success: true,
        data: classes.map(c => c.className)
      });
    } catch (error) {
      console.error('Error in getClasses:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách lớp',
        error: error.message
      });
    }
  }
}

module.exports = InternshipReportsController;

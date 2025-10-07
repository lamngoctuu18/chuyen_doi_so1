const connection = require('../database/connection');

class AdminController {
  // Get internship batches with company registration statistics
  static async getInternshipBatchesWithStats(req, res) {
    try {
      const query = `
        SELECT 
          dt.id,
          dt.ten_dot,
          dt.mo_ta,
          dt.ngay_bat_dau,
          dt.ngay_ket_thuc,
          dt.han_dang_ky,
          dt.trang_thai,
          COUNT(ddn.id) as so_doanh_nghiep_tham_gia,
          SUM(CASE WHEN ddn.trang_thai = 'da-duyet' THEN 1 ELSE 0 END) as so_doanh_nghiep_duyet,
          SUM(CASE WHEN ddn.trang_thai = 'cho-duyet' THEN 1 ELSE 0 END) as so_doanh_nghiep_cho_duyet
        FROM dot_thuc_tap dt
        LEFT JOIN dang_ky_doanh_nghiep ddn ON dt.id = ddn.dot_thuc_tap_id
        GROUP BY dt.id, dt.ten_dot, dt.mo_ta, dt.ngay_bat_dau, dt.ngay_ket_thuc, dt.han_dang_ky, dt.trang_thai
        ORDER BY dt.ngay_tao DESC
      `;

      connection.query(query, (error, results) => {
        if (error) {
          console.error('Error fetching internship batches with stats:', error);
          return res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi lấy danh sách đợt thực tập' 
          });
        }

        res.json({
          success: true,
          data: results
        });
      });
    } catch (error) {
      console.error('Error in getInternshipBatchesWithStats:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Lỗi server' 
      });
    }
  }

  // Get company registrations in a specific batch
  static async getCompanyRegistrationsInBatch(req, res) {
    try {
      const { batchId } = req.params;
      const { search = '', status = '' } = req.query;

      let query = `
        SELECT 
          ddn.id as dang_ky_id,
          ddn.vi_tri_tuyen,
          ddn.so_luong_tuyen,
          ddn.yeu_cau_ky_nang,
          ddn.mo_ta_cong_viec,
          ddn.luong_khoang,
          ddn.dia_chi_lam_viec,
          ddn.ngay_dang_ky,
          ddn.trang_thai,
          ddn.ly_do_tu_choi,
          ddn.doanh_nghiep_id,
          dn.ten_cong_ty,
          dn.dia_chi as dia_chi_cong_ty,
          dn.so_dien_thoai,
          dn.email as email_cong_ty,
          dn.website,
          dn.linh_vuc_hoat_dong,
          dn.quy_mo_nhan_su,
          dn.mo_ta as mo_ta_cong_ty,
          COUNT(dsv.id) as so_sinh_vien_dang_ky
        FROM dang_ky_doanh_nghiep ddn
        INNER JOIN doanh_nghiep dn ON ddn.doanh_nghiep_id = dn.id
        LEFT JOIN dang_ky_sinh_vien dsv ON ddn.id = dsv.dang_ky_doanh_nghiep_id
        WHERE ddn.dot_thuc_tap_id = ?
      `;

      const queryParams = [batchId];

      // Add search filter
      if (search) {
        query += ` AND (dn.ten_cong_ty LIKE ? OR ddn.vi_tri_tuyen LIKE ? OR dn.linh_vuc_hoat_dong LIKE ?)`;
        const searchPattern = `%${search}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern);
      }

      // Add status filter
      if (status) {
        query += ` AND ddn.trang_thai = ?`;
        queryParams.push(status);
      }

      query += ` 
        GROUP BY ddn.id, ddn.vi_tri_tuyen, ddn.so_luong_tuyen, ddn.yeu_cau_ky_nang, 
                 ddn.mo_ta_cong_viec, ddn.luong_khoang, ddn.dia_chi_lam_viec, 
                 ddn.ngay_dang_ky, ddn.trang_thai, ddn.ly_do_tu_choi, ddn.doanh_nghiep_id,
                 dn.ten_cong_ty, dn.dia_chi, dn.so_dien_thoai, dn.email, dn.website,
                 dn.linh_vuc_hoat_dong, dn.quy_mo_nhan_su, dn.mo_ta
        ORDER BY 
          CASE ddn.trang_thai 
            WHEN 'cho-duyet' THEN 1 
            WHEN 'da-duyet' THEN 2 
            WHEN 'bi-tu-choi' THEN 3 
            ELSE 4 
          END,
          ddn.ngay_dang_ky DESC
      `;

      connection.query(query, queryParams, (error, results) => {
        if (error) {
          console.error('Error fetching company registrations:', error);
          return res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi lấy danh sách đăng ký doanh nghiệp' 
          });
        }

        res.json({
          success: true,
          data: results
        });
      });
    } catch (error) {
      console.error('Error in getCompanyRegistrationsInBatch:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Lỗi server' 
      });
    }
  }

  // Approve company registration
  static async approveCompanyRegistration(req, res) {
    try {
      const { registrationId } = req.params;

      const query = `
        UPDATE dang_ky_doanh_nghiep 
        SET trang_thai = 'da-duyet', 
            ngay_duyet = NOW(),
            nguoi_duyet_id = ?,
            ly_do_tu_choi = NULL
        WHERE id = ?
      `;

      connection.query(query, [req.user.id, registrationId], (error, results) => {
        if (error) {
          console.error('Error approving company registration:', error);
          return res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi phê duyệt đăng ký' 
          });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ 
            success: false, 
            message: 'Không tìm thấy đăng ký' 
          });
        }

        res.json({
          success: true,
          message: 'Phê duyệt đăng ký thành công'
        });
      });
    } catch (error) {
      console.error('Error in approveCompanyRegistration:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Lỗi server' 
      });
    }
  }

  // Reject company registration
  static async rejectCompanyRegistration(req, res) {
    try {
      const { registrationId } = req.params;
      const { ly_do_tu_choi } = req.body;

      if (!ly_do_tu_choi || !ly_do_tu_choi.trim()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Vui lòng nhập lý do từ chối' 
        });
      }

      const query = `
        UPDATE dang_ky_doanh_nghiep 
        SET trang_thai = 'bi-tu-choi', 
            ngay_duyet = NOW(),
            nguoi_duyet_id = ?,
            ly_do_tu_choi = ?
        WHERE id = ?
      `;

      connection.query(query, [req.user.id, ly_do_tu_choi.trim(), registrationId], (error, results) => {
        if (error) {
          console.error('Error rejecting company registration:', error);
          return res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi từ chối đăng ký' 
          });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ 
            success: false, 
            message: 'Không tìm thấy đăng ký' 
          });
        }

        res.json({
          success: true,
          message: 'Từ chối đăng ký thành công'
        });
      });
    } catch (error) {
      console.error('Error in rejectCompanyRegistration:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Lỗi server' 
      });
    }
  }

  // Get student registrations for admin overview
  static async getStudentRegistrationsOverview(req, res) {
    try {
      const query = `
        SELECT 
          dsv.id,
          dsv.ngay_dang_ky,
          dsv.trang_thai,
          dsv.ly_do_tu_choi,
          dsv.ghi_chu,
          sv.ma_sinh_vien,
          sv.ho_ten as ten_sinh_vien,
          sv.email as email_sinh_vien,
          sv.so_dien_thoai as sdt_sinh_vien,
          dn.ten_cong_ty,
          ddn.vi_tri_tuyen,
          dt.ten_dot,
          dt.ngay_bat_dau,
          dt.ngay_ket_thuc
        FROM dang_ky_sinh_vien dsv
        INNER JOIN sinh_vien sv ON dsv.sinh_vien_id = sv.id
        INNER JOIN dang_ky_doanh_nghiep ddn ON dsv.dang_ky_doanh_nghiep_id = ddn.id
        INNER JOIN doanh_nghiep dn ON ddn.doanh_nghiep_id = dn.id
        INNER JOIN dot_thuc_tap dt ON ddn.dot_thuc_tap_id = dt.id
        ORDER BY dsv.ngay_dang_ky DESC
        LIMIT 100
      `;

      connection.query(query, (error, results) => {
        if (error) {
          console.error('Error fetching student registrations overview:', error);
          return res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi lấy danh sách đăng ký sinh viên' 
          });
        }

        res.json({
          success: true,
          data: results
        });
      });
    } catch (error) {
      console.error('Error in getStudentRegistrationsOverview:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Lỗi server' 
      });
    }
  }

  // Get statistics for admin dashboard
  static async getDashboardStats(req, res) {
    try {
      const queries = [
        // Total internship batches
        `SELECT COUNT(*) as total_batches FROM dot_thuc_tap`,
        
        // Active batches
        `SELECT COUNT(*) as active_batches FROM dot_thuc_tap WHERE trang_thai = 'dang-mo'`,
        
        // Total company registrations
        `SELECT COUNT(*) as total_company_registrations FROM dang_ky_doanh_nghiep`,
        
        // Pending company approvals
        `SELECT COUNT(*) as pending_company_approvals FROM dang_ky_doanh_nghiep WHERE trang_thai = 'cho-duyet'`,
        
        // Total student registrations
        `SELECT COUNT(*) as total_student_registrations FROM dang_ky_sinh_vien`,
        
        // Pending student approvals
        `SELECT COUNT(*) as pending_student_approvals FROM dang_ky_sinh_vien WHERE trang_thai = 'cho-duyet'`,
        
        // Rejected students (need attention)
        `SELECT COUNT(*) as rejected_students FROM dang_ky_sinh_vien WHERE trang_thai = 'bi-tu-choi'`
      ];

      const results = {};
      let completedQueries = 0;

      queries.forEach((query, index) => {
        connection.query(query, (error, result) => {
          if (error) {
            console.error(`Error in dashboard stats query ${index}:`, error);
            return res.status(500).json({ 
              success: false, 
              message: 'Lỗi khi lấy thống kê' 
            });
          }

          const key = Object.keys(result[0])[0];
          results[key] = result[0][key];
          completedQueries++;

          if (completedQueries === queries.length) {
            res.json({
              success: true,
              data: results
            });
          }
        });
      });
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Lỗi server' 
      });
    }
  }
}

module.exports = AdminController;
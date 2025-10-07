const connection = require('../database/connection');

class StudentRegistrationController {
  
  // GET /api/student-registrations/batches - Lấy danh sách đợt thực tập cho sinh viên
  static async getAvailableBatches(req, res) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE dt.trang_thai = "dang-mo"';
      const queryParams = [];
      
      if (search) {
        whereClause += ' AND (dt.ten_dot LIKE ? OR dt.mo_ta LIKE ?)';
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      const sql = `
        SELECT 
          dt.id,
          dt.ten_dot,
          dt.mo_ta,
          dt.ngay_bat_dau,
          dt.ngay_ket_thuc,
          dt.han_dang_ky,
          dt.trang_thai,
          COUNT(DISTINCT dk.id) as so_doanh_nghiep_tham_gia,
          COUNT(DISTINCT CASE WHEN dk.trang_thai_duyet = 'da-duyet' THEN dk.id END) as so_doanh_nghiep_duyet
        FROM dot_thuc_tap dt
        LEFT JOIN dang_ky_doanh_nghiep dk ON dt.id = dk.dot_thuc_tap_id
        ${whereClause}
        GROUP BY dt.id
        ORDER BY dt.ngay_bat_dau DESC
        LIMIT ? OFFSET ?
      `;
      
      queryParams.push(parseInt(limit), parseInt(offset));
      
      const batches = await connection.query(sql, queryParams);
      
      // Đếm tổng số đợt
      const countSql = `
        SELECT COUNT(DISTINCT dt.id) as total
        FROM dot_thuc_tap dt
        ${whereClause}
      `;
      
      const [countResult] = await connection.query(countSql, queryParams.slice(0, -2));
      const total = countResult.total;
      
      res.json({
        success: true,
        data: {
          batches,
          pagination: {
            current: parseInt(page),
            pageSize: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Get available batches error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách đợt thực tập'
      });
    }
  }

  // GET /api/student-registrations/batches/:id/companies - Lấy danh sách doanh nghiệp trong đợt
  static async getCompaniesInBatch(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10, search = '' } = req.query;
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE dk.dot_thuc_tap_id = ? AND dk.trang_thai_duyet = "da-duyet"';
      const queryParams = [id];
      
      if (search) {
        whereClause += ' AND (dn.ten_cong_ty LIKE ? OR dk.vi_tri_tuyen LIKE ?)';
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      const sql = `
        SELECT 
          dk.id as dang_ky_id,
          dk.vi_tri_tuyen,
          dk.so_luong_tuyen,
          dk.yeu_cau_ky_nang,
          dk.mo_ta_cong_viec,
          dk.luong_khoang,
          dk.dia_chi_lam_viec,
          dk.ghi_chu,
          dn.id as doanh_nghiep_id,
          dn.ten_cong_ty,
          dn.dia_chi_cong_ty,
          dn.so_dien_thoai,
          dn.email_cong_ty,
          dn.website,
          dn.linh_vuc_hoat_dong,
          dn.quy_mo_nhan_su,
          dn.mo_ta_cong_ty,
          COUNT(DISTINCT dsv.id) as so_sinh_vien_dang_ky,
          COUNT(DISTINCT CASE WHEN dsv.trang_thai = 'da-duyet' THEN dsv.id END) as so_sinh_vien_duyet
        FROM dang_ky_doanh_nghiep dk
        INNER JOIN doanh_nghiep dn ON dk.doanh_nghiep_id = dn.id
        LEFT JOIN dang_ky_sinh_vien dsv ON dk.id = dsv.dang_ky_doanh_nghiep_id
        ${whereClause}
        GROUP BY dk.id
        ORDER BY dk.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      queryParams.push(parseInt(limit), parseInt(offset));
      
      const companies = await connection.query(sql, queryParams);
      
      // Đếm tổng số doanh nghiệp
      const countSql = `
        SELECT COUNT(DISTINCT dk.id) as total
        FROM dang_ky_doanh_nghiep dk
        INNER JOIN doanh_nghiep dn ON dk.doanh_nghiep_id = dn.id
        ${whereClause}
      `;
      
      const [countResult] = await connection.query(countSql, queryParams.slice(0, -2));
      const total = countResult.total;
      
      res.json({
        success: true,
        data: {
          companies,
          pagination: {
            current: parseInt(page),
            pageSize: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Get companies in batch error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách doanh nghiệp'
      });
    }
  }

  // POST /api/student-registrations - Sinh viên đăng ký với doanh nghiệp
  static async registerWithCompany(req, res) {
    try {
      const { dang_ky_doanh_nghiep_id, ghi_chu } = req.body;
      const sinh_vien_id = req.user.sinh_vien_id;

      if (!sinh_vien_id) {
        return res.status(403).json({
          success: false,
          message: 'Chỉ sinh viên mới có thể đăng ký thực tập'
        });
      }

      // Kiểm tra thời gian đăng ký
      const RegistrationPeriod = require('../models/RegistrationPeriod');
      const isOpen = await RegistrationPeriod.isRegistrationOpen();
      
      if (!isOpen) {
        return res.status(400).json({
          success: false,
          message: 'Hiện tại không trong thời gian đăng ký thực tập'
        });
      }

      // Kiểm tra xem sinh viên đã đăng ký với doanh nghiệp này chưa
      const existingRegistration = await connection.query(
        'SELECT id FROM dang_ky_sinh_vien WHERE sinh_vien_id = ? AND dang_ky_doanh_nghiep_id = ?',
        [sinh_vien_id, dang_ky_doanh_nghiep_id]
      );

      if (existingRegistration.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Bạn đã đăng ký với doanh nghiệp này rồi'
        });
      }

      // Kiểm tra xem đợt thực tập còn mở đăng ký không
      const batchCheck = await connection.query(`
        SELECT dt.han_dang_ky, dt.trang_thai
        FROM dang_ky_doanh_nghiep dk
        INNER JOIN dot_thuc_tap dt ON dk.dot_thuc_tap_id = dt.id
        WHERE dk.id = ? AND dk.trang_thai_duyet = 'da-duyet'
      `, [dang_ky_doanh_nghiep_id]);

      if (batchCheck.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Doanh nghiệp này chưa được duyệt hoặc không tồn tại'
        });
      }

      const batch = batchCheck[0];
      if (batch.trang_thai !== 'dang-mo' || new Date() > new Date(batch.han_dang_ky)) {
        return res.status(400).json({
          success: false,
          message: 'Đợt thực tập đã hết hạn đăng ký'
        });
      }

      // Tạo đăng ký mới
      const result = await connection.query(
        'INSERT INTO dang_ky_sinh_vien (sinh_vien_id, dang_ky_doanh_nghiep_id, ghi_chu) VALUES (?, ?, ?)',
        [sinh_vien_id, dang_ky_doanh_nghiep_id, ghi_chu || null]
      );

      res.json({
        success: true,
        message: 'Đăng ký thành công! Vui lòng chờ doanh nghiệp phản hồi.',
        data: { id: result.insertId }
      });

    } catch (error) {
      console.error('❌ Student registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đăng ký thực tập'
      });
    }
  }

  // GET /api/student-registrations/my-registrations - Lấy danh sách đăng ký của sinh viên
  static async getMyRegistrations(req, res) {
    try {
      const sinh_vien_id = req.user.sinh_vien_id;

      if (!sinh_vien_id) {
        return res.status(403).json({
          success: false,
          message: 'Chỉ sinh viên mới có thể xem đăng ký'
        });
      }

      const sql = `
        SELECT 
          dsv.id,
          dsv.ngay_dang_ky,
          dsv.trang_thai,
          dsv.ly_do_tu_choi,
          dsv.ghi_chu,
          dk.vi_tri_tuyen,
          dk.so_luong_tuyen,
          dk.luong_khoang,
          dn.ten_cong_ty,
          dn.dia_chi_cong_ty,
          dn.so_dien_thoai,
          dn.email_cong_ty,
          dt.ten_dot,
          dt.ngay_bat_dau,
          dt.ngay_ket_thuc
        FROM dang_ky_sinh_vien dsv
        INNER JOIN dang_ky_doanh_nghiep dk ON dsv.dang_ky_doanh_nghiep_id = dk.id
        INNER JOIN doanh_nghiep dn ON dk.doanh_nghiep_id = dn.id
        INNER JOIN dot_thuc_tap dt ON dk.dot_thuc_tap_id = dt.id
        WHERE dsv.sinh_vien_id = ?
        ORDER BY dsv.ngay_dang_ky DESC
      `;

      const registrations = await connection.query(sql, [sinh_vien_id]);

      res.json({
        success: true,
        data: registrations
      });

    } catch (error) {
      console.error('❌ Get my registrations error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách đăng ký'
      });
    }
  }

  // POST /api/student-registrations/internship-form - Đăng ký thực tập form mới
  static async submitInternshipForm(req, res) {
    try {
      const sinh_vien_id = req.user.sinh_vien_id;
      
      if (!sinh_vien_id) {
        return res.status(403).json({
          success: false,
          message: 'Chỉ sinh viên mới có thể đăng ký thực tập'
        });
      }

      const {
        nguyen_vong_thuc_tap,
        vi_tri_thuc_tap_mong_muon,
        ten_cong_ty,
        dia_chi_cong_ty,
        nguoi_lien_he,
        so_dien_thoai_lien_he,
        ghi_chu
      } = req.body;

      // Validate required fields
      if (!nguyen_vong_thuc_tap || !vi_tri_thuc_tap_mong_muon) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
        });
      }

      // Validate company info if self-contact
      if (nguyen_vong_thuc_tap === 'tu-lien-he') {
        if (!ten_cong_ty || !dia_chi_cong_ty || !nguoi_lien_he || !so_dien_thoai_lien_he) {
          return res.status(400).json({
            success: false,
            message: 'Vui lòng điền đầy đủ thông tin công ty khi chọn tự liên hệ'
          });
        }
      }

      // Check if student already has a registration
      const existingRegistration = await connection.query(
        'SELECT id FROM dang_ky_thuc_tap_sinh_vien WHERE sinh_vien_id = ?',
        [sinh_vien_id]
      );

      if (existingRegistration.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Bạn đã đăng ký thực tập rồi. Vui lòng liên hệ với khoa nếu cần thay đổi thông tin.'
        });
      }

      // Insert registration
      const result = await connection.query(`
        INSERT INTO dang_ky_thuc_tap_sinh_vien 
        (sinh_vien_id, nguyen_vong_thuc_tap, vi_tri_thuc_tap_mong_muon, 
         ten_cong_ty, dia_chi_cong_ty, nguoi_lien_he, so_dien_thoai_lien_he, ghi_chu, trang_thai)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'cho-duyet')
      `, [
        sinh_vien_id,
        nguyen_vong_thuc_tap,
        vi_tri_thuc_tap_mong_muon,
        nguyen_vong_thuc_tap === 'tu-lien-he' ? ten_cong_ty : null,
        nguyen_vong_thuc_tap === 'tu-lien-he' ? dia_chi_cong_ty : null,
        nguyen_vong_thuc_tap === 'tu-lien-he' ? nguoi_lien_he : null,
        nguyen_vong_thuc_tap === 'tu-lien-he' ? so_dien_thoai_lien_he : null,
        ghi_chu || null
      ]);

      // Update student's desired position in main table
      await connection.query(
        'UPDATE sinh_vien SET vi_tri_muon_ung_tuyen_thuc_tap = ? WHERE id = ?',
        [vi_tri_thuc_tap_mong_muon, sinh_vien_id]
      );

      res.json({
        success: true,
        message: 'Đăng ký thực tập thành công! Khoa sẽ xem xét và phản hồi sớm.',
        data: { id: result.insertId }
      });

    } catch (error) {
      console.error('❌ Submit internship form error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi gửi đăng ký thực tập. Vui lòng thử lại sau.'
      });
    }
  }
}

module.exports = StudentRegistrationController;
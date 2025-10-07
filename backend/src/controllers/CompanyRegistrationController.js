const connection = require('../database/connection');

class CompanyRegistrationController {
  
  // POST /api/company-registrations - Doanh nghiệp đăng ký tham gia đợt thực tập
  static async registerForBatch(req, res) {
    try {
      const { 
        dotThucTapId, 
        viTriTuyen, 
        soLuongTuyen, 
        yeuCauKyNang, 
        moTaCongViec, 
        luongKhoang, 
        diaChiLamViec, 
        ghiChu 
      } = req.body;
      
      // Lấy account ID từ JWT token
      const accountId = req.user.id;
      
      console.log('🏢 Company registration request:', {
        accountId,
        dotThucTapId,
        viTriTuyen,
        soLuongTuyen,
        userInfo: req.user
      });

      // Tìm doanh nghiệp từ account_id
      const companyCheck = await connection.query(
        'SELECT id FROM doanh_nghiep WHERE account_id = ?',
        [accountId]
      );

      if (companyCheck.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Doanh nghiệp không tồn tại trong hệ thống'
        });
      }

      const doanhNghiepId = companyCheck[0].id;
      console.log('✅ Found company ID:', doanhNghiepId);

      // Kiểm tra đợt thực tập có tồn tại và ở trạng thái 'sap-mo'
      const batchCheck = await connection.query(
        'SELECT * FROM dot_thuc_tap WHERE id = ? AND trang_thai = ?',
        [dotThucTapId, 'sap-mo']
      );

      if (batchCheck.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Đợt thực tập không tồn tại hoặc không còn mở đăng ký'
        });
      }

      // Doanh nghiệp ID đã được validate ở trên

      // Kiểm tra doanh nghiệp đã đăng ký đợt này chưa
      const existingRegistration = await connection.query(
        'SELECT * FROM dang_ky_doanh_nghiep WHERE dot_thuc_tap_id = ? AND doanh_nghiep_id = ?',
        [dotThucTapId, doanhNghiepId]
      );

      if (existingRegistration.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Doanh nghiệp đã đăng ký đợt thực tập này rồi'
        });
      }

      // Tạo đăng ký mới
      console.log('📝 Inserting registration with data:', {
        dotThucTapId, doanhNghiepId, viTriTuyen, soLuongTuyen,
        yeuCauKyNang, moTaCongViec, luongKhoang, diaChiLamViec,
        ghiChu
      });

      const insertResult = await connection.query(`
        INSERT INTO dang_ky_doanh_nghiep (
          dot_thuc_tap_id, doanh_nghiep_id, vi_tri_tuyen, so_luong_tuyen,
          yeu_cau_ky_nang, mo_ta_cong_viec, luong_khoang, dia_chi_lam_viec,
          ghi_chu, trang_thai
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        dotThucTapId, doanhNghiepId, viTriTuyen, soLuongTuyen,
        yeuCauKyNang, moTaCongViec, luongKhoang, diaChiLamViec,
        ghiChu, 'cho-duyet'
      ]);

      console.log('✅ Company registration created:', insertResult.insertId);

      // Get updated batch info with new company count
      const updatedBatch = await connection.query(`
        SELECT 
          dt.*,
          COUNT(DISTINCT dk.doanh_nghiep_id) as soDoanhNghiepThamGia
        FROM dot_thuc_tap dt
        LEFT JOIN dang_ky_doanh_nghiep dk ON dt.id = dk.dot_thuc_tap_id 
          AND dk.trang_thai IN ('cho-duyet', 'da-duyet')
        WHERE dt.id = ?
        GROUP BY dt.id
      `, [dotThucTapId]);

      res.status(201).json({
        success: true,
        message: 'Đăng ký tham gia đợt thực tập thành công',
        data: {
          registrationId: insertResult.insertId,
          updatedBatch: updatedBatch[0] || null
        }
      });

    } catch (error) {
      console.error('❌ Company registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đăng ký tham gia đợt thực tập'
      });
    }
  }

  // GET /api/company-registrations - Lấy danh sách đăng ký của doanh nghiệp
  static async getCompanyRegistrations(req, res) {
    try {
      const accountId = req.user.id;
      
      // Tìm doanh nghiệp từ account_id
      const companyResult = await connection.query(
        'SELECT id FROM doanh_nghiep WHERE account_id = ?',
        [accountId]
      );

      if (companyResult.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Doanh nghiệp không tồn tại trong hệ thống'
        });
      }

      const doanhNghiepId = companyResult[0].id;
      
      const registrations = await connection.query(`
        SELECT 
          dk.*,
          dt.ten_dot,
          dt.thoi_gian_bat_dau,
          dt.thoi_gian_ket_thuc,
          dt.trang_thai as batch_status
        FROM dang_ky_doanh_nghiep dk
        JOIN dot_thuc_tap dt ON dk.dot_thuc_tap_id = dt.id
        WHERE dk.doanh_nghiep_id = ?
        ORDER BY dk.created_at DESC
      `, [doanhNghiepId]);

      res.json({
        success: true,
        data: registrations
      });

    } catch (error) {
      console.error('❌ Get company registrations error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách đăng ký'
      });
    }
  }

  // PUT /api/company-registrations/:id - Cập nhật thông tin đăng ký (chỉ khi đợt thực tập còn 'sap-mo')
  static async updateRegistration(req, res) {
    try {
      const { id } = req.params;
      const accountId = req.user.id;
      
      // Tìm doanh nghiệp từ account_id
      const companyResult = await connection.query(
        'SELECT id FROM doanh_nghiep WHERE account_id = ?',
        [accountId]
      );

      if (companyResult.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Doanh nghiệp không tồn tại trong hệ thống'
        });
      }

      const doanhNghiepId = companyResult[0].id;
      const {
        viTriTuyen,
        soLuongTuyen,
        yeuCauKyNang,
        moTaCongViec,
        luongKhoang,
        diaChiLamViec,
        ghiChu
      } = req.body;

      // Kiểm tra đăng ký thuộc về doanh nghiệp này và đợt thực tập còn 'sap-mo'
      const registrationCheck = await connection.query(`
        SELECT dk.*, dt.trang_thai as batch_status
        FROM dang_ky_doanh_nghiep dk
        JOIN dot_thuc_tap dt ON dk.dot_thuc_tap_id = dt.id
        WHERE dk.id = ? AND dk.doanh_nghiep_id = ?
      `, [id, doanhNghiepId]);

      if (registrationCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đăng ký'
        });
      }

      if (registrationCheck[0].batch_status !== 'sap-mo') {
        return res.status(400).json({
          success: false,
          message: 'Không thể chỉnh sửa khi đợt thực tập đã bắt đầu hoặc kết thúc'
        });
      }

      // Cập nhật thông tin
      await connection.query(`
        UPDATE dang_ky_doanh_nghiep 
        SET vi_tri_tuyen = ?, so_luong_tuyen = ?, yeu_cau_ky_nang = ?,
            mo_ta_cong_viec = ?, luong_khoang = ?, dia_chi_lam_viec = ?,
            ghi_chu = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [viTriTuyen, soLuongTuyen, yeuCauKyNang, moTaCongViec, luongKhoang, diaChiLamViec, ghiChu, id]);

      res.json({
        success: true,
        message: 'Cập nhật thông tin đăng ký thành công'
      });

    } catch (error) {
      console.error('❌ Update registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật thông tin đăng ký'
      });
    }
  }

  // DELETE /api/company-registrations/:id - Hủy đăng ký (chỉ khi đợt thực tập còn 'sap-mo')
  static async cancelRegistration(req, res) {
    try {
      const { id } = req.params;
      const accountId = req.user.id;
      
      // Tìm doanh nghiệp từ account_id
      const companyResult = await connection.query(
        'SELECT id FROM doanh_nghiep WHERE account_id = ?',
        [accountId]
      );

      if (companyResult.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Doanh nghiệp không tồn tại trong hệ thống'
        });
      }

      const doanhNghiepId = companyResult[0].id;

      // Kiểm tra đăng ký thuộc về doanh nghiệp này và đợt thực tập còn 'sap-mo'
      const registrationCheck = await connection.query(`
        SELECT dk.*, dt.trang_thai as batch_status
        FROM dang_ky_doanh_nghiep dk
        JOIN dot_thuc_tap dt ON dk.dot_thuc_tap_id = dt.id
        WHERE dk.id = ? AND dk.doanh_nghiep_id = ?
      `, [id, doanhNghiepId]);

      if (registrationCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đăng ký'
        });
      }

      if (registrationCheck[0].batch_status !== 'sap-mo') {
        return res.status(400).json({
          success: false,
          message: 'Không thể hủy đăng ký khi đợt thực tập đã bắt đầu hoặc kết thúc'
        });
      }

      // Xóa đăng ký
      await connection.query('DELETE FROM dang_ky_doanh_nghiep WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Hủy đăng ký thành công'
      });

    } catch (error) {
      console.error('❌ Cancel registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi hủy đăng ký'
      });
    }
  }
}

module.exports = CompanyRegistrationController;
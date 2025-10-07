const connection = require('../database/connection');

class TeacherReports {
  // Lấy danh sách sinh viên mà giảng viên hướng dẫn
  static async getStudentsByTeacher(maGiangVien) {
    try {
      // Match the actual columns shown in your screenshot
      const query = `
        SELECT 
          svhd.id,
          svhd.ma_giang_vien,
          svhd.ma_sinh_vien,
          svhd.ho_ten_sinh_vien,
          svhd.email_sinh_vien AS email_ca_nhan,
          svhd.so_dien_thoai_sinh_vien,
          svhd.lop_sinh_vien AS lop,
          svhd.ngay_sinh_sinh_vien AS ngay_sinh_vien,
          svhd.vi_tri_thuc_tap,
          svhd.doanh_nghiep_thuc_tap AS doanh_nghiep_thuc_tap,
          svhd.doanh_nghiep_thuc_tap AS ten_cong_ty
        FROM sinh_vien_huong_dan svhd
        WHERE svhd.ma_giang_vien = ?
        ORDER BY svhd.id DESC
      `;
      
      const results = await connection.query(query, [maGiangVien]);
      return results;
    } catch (error) {
      console.error('❌ Error getting students by teacher:', error);
      throw error;
    }
  }

  // Lấy thống kê báo cáo của giảng viên
  static async getTeacherReportsStats(maGiangVien) {
    try {
      // Đếm tổng sinh viên hướng dẫn từ bảng thực tế sinh_vien_huong_dan
      const [totalStudents] = await connection.query(
        'SELECT COUNT(*) as total FROM sinh_vien_huong_dan WHERE ma_giang_vien = ?',
        [maGiangVien]
      );

      // Đếm sinh viên đang thực tập (coi như có doanh nghiệp thực tập -> đang active)
      const [activeInternships] = await connection.query(
        `SELECT COUNT(*) as total 
         FROM sinh_vien_huong_dan 
         WHERE ma_giang_vien = ? AND COALESCE(TRIM(doanh_nghiep_thuc_tap), '') <> ''`,
        [maGiangVien]
      );

      // Tạm thời chưa có bảng báo cáo của giảng viên -> đặt submittedReports = 0
      const submittedReports = { total: 0 };

      const total = Number(totalStudents?.total || 0);
      const submitted = Number(submittedReports?.total || 0);
      const active = Number(activeInternships?.total || 0);

      // Dùng activeInternships làm chỉ số tiến độ tham gia
      const completionRate = total > 0 
        ? Math.round((active / total) * 100)
        : 0;

      return {
        totalStudents: total,
        activeInternships: active,
        submittedReports: submitted,
        pendingReports: Math.max(total - submitted, 0),
        completionRate
      };
    } catch (error) {
      console.error('❌ Error getting teacher reports stats:', error);
      throw error;
    }
  }

  // Tạo báo cáo mới
  static async createReport(reportData) {
    try {
      const {
        nguoi_nop_id,
        tieu_de,
        noi_dung,
        loai_bao_cao,
        file_dinh_kem,
        ma_sinh_vien
      } = reportData;

      const query = `
        INSERT INTO bao_cao_da_nop (
          nguoi_nop_id,
          loai_nguoi_nop,
          tieu_de,
          noi_dung,
          loai_bao_cao,
          file_dinh_kem,
          trang_thai,
          ngay_nop,
          ma_sinh_vien_lien_quan
        ) VALUES (?, 'giang_vien', ?, ?, ?, ?, 'da_nop', NOW(), ?)
      `;

      const result = await connection.query(query, [
        nguoi_nop_id,
        tieu_de,
        noi_dung,
        loai_bao_cao,
        file_dinh_kem,
        ma_sinh_vien
      ]);

      return { 
        id: result.insertId, 
        success: true,
        message: 'Tạo báo cáo thành công'
      };
    } catch (error) {
      console.error('❌ Error creating report:', error);
      throw error;
    }
  }

  // Lấy danh sách báo cáo đã nộp của giảng viên
  static async getSubmittedReports(maGiangVien, page = 1, limit = 10) {
    try {
      // Hiện tại chưa có bảng báo cáo của giảng viên -> trả về danh sách rỗng
      return {
        reports: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalReports: 0,
          limit
        }
      };
    } catch (error) {
      console.error('❌ Error getting submitted reports:', error);
      throw error;
    }
  }
}

module.exports = TeacherReports;
const connection = require('../database/connection');

class TeacherProfile {
  // Lấy thông tin chi tiết giảng viên
  static async getTeacherInfo(maGiangVien) {
    try {
      const query = `
        SELECT 
          gv.ma_giang_vien,
          gv.ho_ten,
          gv.email_ca_nhan,
          gv.so_dien_thoai,
          gv.khoa,
          gv.bo_mon,
          gv.chuc_vu,
          gv.so_sinh_vien_huong_dan,
          gv.hoc_vi AS trinh_do,
          gv.chuyen_mon
        FROM giang_vien gv
        WHERE gv.ma_giang_vien = ?
      `;
      
      const results = await connection.query(query, [maGiangVien]);
      
      if (results.length === 0) {
        throw new Error('Không tìm thấy thông tin giảng viên');
      }
      
      return results[0];
    } catch (error) {
      console.error('❌ Error getting teacher info:', error);
      throw error;
    }
  }

  // Lấy thống kê tổng quan cho dashboard
  static async getDashboardStats(maGiangVien) {
    try {
      // Số sinh viên hướng dẫn
      const [studentsCount] = await connection.query(
        'SELECT COUNT(*) as total FROM sinh_vien_huong_dan WHERE ma_giang_vien = ?',
        [maGiangVien]
      );

      // Số sinh viên đang thực tập
      const [activeInternships] = await connection.query(
        `SELECT COUNT(*) as total 
         FROM sinh_vien_huong_dan 
         WHERE ma_giang_vien = ? AND COALESCE(TRIM(doanh_nghiep_thuc_tap), '') <> ''`,
        [maGiangVien]
      );

      // Số doanh nghiệp đang hợp tác
      const [companiesCount] = await connection.query(
        `SELECT COUNT(DISTINCT TRIM(doanh_nghiep_thuc_tap)) as total 
         FROM sinh_vien_huong_dan 
         WHERE ma_giang_vien = ? AND COALESCE(TRIM(doanh_nghiep_thuc_tap), '') <> ''`,
        [maGiangVien]
      );

      // Danh sách sinh viên gần đây
      const recentStudents = await connection.query(`
        SELECT 
          ma_sinh_vien,
          ho_ten_sinh_vien,
          doanh_nghiep_thuc_tap,
          vi_tri_thuc_tap,
          ngay_sinh_sinh_vien
        FROM sinh_vien_huong_dan 
        WHERE ma_giang_vien = ?
        ORDER BY id DESC
        LIMIT 5
      `, [maGiangVien]);

      return {
        totalStudents: studentsCount.total || 0,
        activeInternships: activeInternships.total || 0,
        companiesCount: companiesCount.total || 0,
        recentStudents
      };
    } catch (error) {
      console.error('❌ Error getting dashboard stats:', error);
      throw error;
    }
  }
}

module.exports = TeacherProfile;
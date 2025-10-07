const db = require('../database/connection');

class SinhVienHuongDan {
  
  /**
   * Tạo mối quan hệ giảng viên - sinh viên hướng dẫn
   */
  static async create(data) {
    const query = `
      INSERT INTO sinh_vien_huong_dan (
        ma_giang_vien, ten_giang_vien, ma_sinh_vien, ho_ten_sinh_vien, email_sinh_vien, 
        so_dien_thoai_sinh_vien, lop_sinh_vien, ngay_sinh_sinh_vien,
        vi_tri_thuc_tap, doanh_nghiep_thuc_tap, nguyen_vong_thuc_tap
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        ten_giang_vien = VALUES(ten_giang_vien),
        ho_ten_sinh_vien = VALUES(ho_ten_sinh_vien),
        email_sinh_vien = VALUES(email_sinh_vien),
        so_dien_thoai_sinh_vien = VALUES(so_dien_thoai_sinh_vien),
        lop_sinh_vien = VALUES(lop_sinh_vien),
        ngay_sinh_sinh_vien = VALUES(ngay_sinh_sinh_vien),
        vi_tri_thuc_tap = VALUES(vi_tri_thuc_tap),
        doanh_nghiep_thuc_tap = VALUES(doanh_nghiep_thuc_tap),
        nguyen_vong_thuc_tap = VALUES(nguyen_vong_thuc_tap),
        updated_at = CURRENT_TIMESTAMP
    `;
    
    console.log('🔍 SinhVienHuongDan.create() with params:', [
      data.ma_giang_vien, data.ten_giang_vien, data.ma_sinh_vien, data.ho_ten_sinh_vien, 
      data.email_sinh_vien, data.so_dien_thoai_sinh_vien, data.lop_sinh_vien,
      data.ngay_sinh_sinh_vien, data.vi_tri_thuc_tap, data.doanh_nghiep_thuc_tap,
      data.nguyen_vong_thuc_tap
    ]);
    
    const result = await db.query(query, [
      data.ma_giang_vien, data.ten_giang_vien, data.ma_sinh_vien, data.ho_ten_sinh_vien, 
      data.email_sinh_vien, data.so_dien_thoai_sinh_vien, data.lop_sinh_vien,
      data.ngay_sinh_sinh_vien, data.vi_tri_thuc_tap, data.doanh_nghiep_thuc_tap,
      data.nguyen_vong_thuc_tap
    ]);
    
    return result;
  }

  /**
   * Lấy danh sách sinh viên hướng dẫn của một giảng viên
   */
  static async getByGiangVien(maGiangVien) {
    const query = `
      SELECT * FROM sinh_vien_huong_dan 
      WHERE ma_giang_vien = ?
      ORDER BY ho_ten_sinh_vien ASC
    `;
    
    console.log('🔍 SinhVienHuongDan.getByGiangVien() with params:', [maGiangVien]);
  const rows = await db.query(query, [maGiangVien]);
  return rows;
  }

  /**
   * Đếm số lượng sinh viên hướng dẫn của một giảng viên
   */
  static async countByGiangVien(maGiangVien) {
    const query = `
      SELECT COUNT(*) as count FROM sinh_vien_huong_dan 
      WHERE ma_giang_vien = ?
    `;
    
    console.log('🔍 SinhVienHuongDan.countByGiangVien() with params:', [maGiangVien]);
  const rows = await db.query(query, [maGiangVien]);
  return rows[0]?.count || 0;
  }

  /**
   * Xóa tất cả sinh viên hướng dẫn của một giảng viên (dùng khi import mới)
   */
  static async deleteByGiangVien(maGiangVien) {
    const query = `DELETE FROM sinh_vien_huong_dan WHERE ma_giang_vien = ?`;
    
    console.log('🔍 SinhVienHuongDan.deleteByGiangVien() with params:', [maGiangVien]);
  const result = await db.query(query, [maGiangVien]);
  return result;
  }

  /**
   * Import batch sinh viên hướng dẫn từ Excel
   */
  static async importBatch(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return { success: false, message: 'Không có dữ liệu để import' };
    }

    return await db.transaction(async (connection) => {
      
      // Group data by ma_giang_vien
      const groupedData = {};
      data.forEach(item => {
        const maGV = item.ma_giang_vien;
        if (!groupedData[maGV]) {
          groupedData[maGV] = [];
        }
        groupedData[maGV].push(item);
      });

      let totalProcessed = 0;
      const teacherCounts = {};

      // Process each teacher's students
      for (const [maGiangVien, students] of Object.entries(groupedData)) {
        // Delete existing records for this teacher
        await connection.query(
          `DELETE FROM sinh_vien_huong_dan WHERE ma_giang_vien = ?`,
          [maGiangVien]
        );

        // Insert new records
        for (const student of students) {
          await connection.query(`
            INSERT INTO sinh_vien_huong_dan (
              ma_giang_vien, ten_giang_vien, ma_sinh_vien, ho_ten_sinh_vien, email_sinh_vien, 
              so_dien_thoai_sinh_vien, lop_sinh_vien, ngay_sinh_sinh_vien,
              vi_tri_thuc_tap, doanh_nghiep_thuc_tap, nguyen_vong_thuc_tap
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            student.ma_giang_vien, student.ten_giang_vien, student.ma_sinh_vien, student.ho_ten_sinh_vien,
            student.email_sinh_vien, student.so_dien_thoai_sinh_vien, student.lop_sinh_vien,
            student.ngay_sinh_sinh_vien, student.vi_tri_thuc_tap, student.doanh_nghiep_thuc_tap,
            student.nguyen_vong_thuc_tap
          ]);
          totalProcessed++;
        }

        // Update teacher's student count
        teacherCounts[maGiangVien] = students.length;
        await connection.query(`
          UPDATE giang_vien 
          SET so_sinh_vien_huong_dan = ? 
          WHERE ma_giang_vien = ?
        `, [students.length, maGiangVien]);
      }
      
      return {
        success: true,
        message: `Import thành công ${totalProcessed} sinh viên hướng dẫn cho ${Object.keys(groupedData).length} giảng viên`,
        totalProcessed,
        teacherCounts
      };
    });
  }

  /**
   * Cập nhật số lượng sinh viên hướng dẫn cho tất cả giảng viên
   */
  static async updateAllTeacherCounts() {
    const query = `
      UPDATE giang_vien gv 
      SET so_sinh_vien_huong_dan = (
        SELECT COUNT(*) FROM sinh_vien_huong_dan svhd 
        WHERE svhd.ma_giang_vien = gv.ma_giang_vien
      )
    `;
    
    console.log('🔍 SinhVienHuongDan.updateAllTeacherCounts()');
  const result = await db.query(query);
  return result;
  }
}

module.exports = SinhVienHuongDan;
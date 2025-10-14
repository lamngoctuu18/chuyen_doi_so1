const db = require('../database/connection');

/**
 * Service xử lý logic nghiệp vụ cho bài nộp và báo cáo của sinh viên
 */
class SubmissionService {
  /**
   * Kiểm tra sinh viên có được phép nộp bài không
   * @param {string} maSinhVien - Mã sinh viên
   * @param {number} slotId - ID của đợt nộp bài
   * @returns {Object} { allowed: boolean, message: string, data: Object }
   */
  static async checkSubmissionPermission(maSinhVien, slotId) {
    try {
      // Kiểm tra sinh viên có tồn tại
      const [student] = await db.query(
        `SELECT 
          sv.ma_sinh_vien,
          sv.ho_ten,
          sv.email_ca_nhan,
          sv.trang_thai_thuc_tap,
          svhd.ma_giang_vien
         FROM sinh_vien sv
         LEFT JOIN sinh_vien_huong_dan svhd ON sv.ma_sinh_vien = svhd.ma_sinh_vien
         WHERE sv.ma_sinh_vien = ?
         LIMIT 1`,
        [maSinhVien]
      );

      if (!student) {
        return {
          allowed: false,
          message: 'Không tìm thấy sinh viên trong hệ thống'
        };
      }

      // Kiểm tra trạng thái thực tập
      if (!student.trang_thai_thuc_tap || student.trang_thai_thuc_tap === 'chua_thuc_tap') {
        return {
          allowed: false,
          message: 'Sinh viên chưa được phân công thực tập'
        };
      }

      if (student.trang_thai_thuc_tap === 'da_hoan_thanh') {
        return {
          allowed: false,
          message: 'Sinh viên đã hoàn thành thực tập, không thể nộp bài mới'
        };
      }

      // Kiểm tra đợt nộp bài
      const [slot] = await db.query(
        `SELECT * FROM dot_nop_bao_cao_theo_tuan WHERE id = ? LIMIT 1`,
        [slotId]
      );

      if (!slot) {
        return {
          allowed: false,
          message: 'Không tìm thấy đợt nộp bài'
        };
      }

      // Kiểm tra sinh viên có thuộc giảng viên quản lý không
      if (!student.ma_giang_vien || student.ma_giang_vien !== slot.ma_giang_vien) {
        return {
          allowed: false,
          message: 'Sinh viên không thuộc quyền quản lý của giảng viên này'
        };
      }

      return {
        allowed: true,
        message: 'Sinh viên được phép nộp bài',
        data: { student, slot }
      };
    } catch (error) {
      console.error('Error in checkSubmissionPermission:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra file trùng lặp
   * @param {string} maSinhVien - Mã sinh viên
   * @param {number} slotId - ID của đợt nộp bài
   * @param {string} fileName - Tên file
   * @returns {Object} { isDuplicate: boolean, existingFile: Object }
   */
  static async checkDuplicateFile(maSinhVien, slotId, fileName) {
    try {
      const [existingFiles] = await db.query(
        `SELECT 
          id,
          original_name,
          submitted_at,
          trang_thai
         FROM bai_nop_cua_sinh_vien
         WHERE ma_sinh_vien = ? 
           AND slot_id = ? 
           AND original_name = ?
         LIMIT 1`,
        [maSinhVien, slotId, fileName]
      );

      if (existingFiles) {
        return {
          isDuplicate: true,
          existingFile: existingFiles,
          message: `File "${fileName}" đã được nộp trước đó vào lúc ${new Date(existingFiles.submitted_at).toLocaleString('vi-VN')}`
        };
      }

      return {
        isDuplicate: false,
        message: 'File chưa được nộp'
      };
    } catch (error) {
      console.error('Error in checkDuplicateFile:', error);
      throw error;
    }
  }

  /**
   * Lưu bài nộp vào database
   * @param {Object} submissionData - Dữ liệu bài nộp
   * @returns {Object} Thông tin bài nộp đã lưu
   */
  static async saveSubmission(submissionData) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const {
        slot_id,
        ma_sinh_vien,
        file_path,
        original_name,
        mime_type,
        file_size
      } = submissionData;

      // Lưu bài nộp
      const [result] = await connection.query(
        `INSERT INTO bai_nop_cua_sinh_vien 
         (slot_id, ma_sinh_vien, file_path, original_name, mime_type, file_size, trang_thai)
         VALUES (?, ?, ?, ?, ?, ?, 'da_nop')`,
        [slot_id, ma_sinh_vien, file_path, original_name, mime_type, file_size]
      );

      const submissionId = result.insertId;

      // Tự động ghi log vào bao_cao_da_nop
      await this.logSubmission(connection, {
        submission_id: submissionId,
        ma_sinh_vien,
        slot_id,
        original_name
      });

      await connection.commit();

      // Lấy thông tin bài nộp vừa tạo
      const [newSubmission] = await db.query(
        `SELECT 
          bncsv.*,
          bccsv.tieu_de as ten_dot_nop,
          bccsv.loai_bao_cao
         FROM bai_nop_cua_sinh_vien bncsv
         LEFT JOIN dot_nop_bao_cao_theo_tuan bccsv ON bncsv.slot_id = bccsv.id
         WHERE bncsv.id = ?
         LIMIT 1`,
        [submissionId]
      );

      return {
        success: true,
        message: 'Nộp bài thành công',
        data: newSubmission
      };
    } catch (error) {
      await connection.rollback();
      console.error('Error in saveSubmission:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Ghi log bài nộp vào bảng bao_cao_da_nop
   * @param {Object} connection - MySQL connection
   * @param {Object} logData - Dữ liệu log
   */
  static async logSubmission(connection, logData) {
    try {
      const { submission_id, ma_sinh_vien, slot_id, original_name } = logData;

      // Lấy thông tin sinh viên và đợt nộp
      const [student] = await connection.query(
        `SELECT sv.ho_ten, sv.lop, svhd.ma_giang_vien
         FROM sinh_vien sv
         LEFT JOIN sinh_vien_huong_dan svhd ON sv.ma_sinh_vien = svhd.ma_sinh_vien
         WHERE sv.ma_sinh_vien = ?
         LIMIT 1`,
        [ma_sinh_vien]
      );

      const [slot] = await connection.query(
        `SELECT tieu_de, loai_bao_cao FROM dot_nop_bao_cao_theo_tuan WHERE id = ? LIMIT 1`,
        [slot_id]
      );

      if (student && slot) {
        await connection.query(
          `INSERT INTO bao_cao_da_nop 
           (tieu_de, loai_nguoi_nop, ma_nguoi_nop, ten_nguoi_nop, ngay_nop, trang_thai, noi_dung)
           VALUES (?, 'sinh_vien', ?, ?, NOW(), 'da_nop', ?)`,
          [
            `${slot.tieu_de} - ${original_name}`,
            ma_sinh_vien,
            student.ho_ten,
            `Sinh viên ${student.ho_ten} (${ma_sinh_vien}) - Lớp: ${student.lop || 'N/A'} đã nộp bài ${slot.loai_bao_cao}`
          ]
        );
      }
    } catch (error) {
      console.error('Error in logSubmission:', error);
      // Không throw error để không ảnh hưởng đến transaction chính
    }
  }

  /**
   * Duyệt hoặc từ chối bài nộp
   * @param {number} submissionId - ID bài nộp
   * @param {string} maGiangVien - Mã giảng viên
   * @param {Object} reviewData - Dữ liệu đánh giá
   * @returns {Object} Kết quả đánh giá
   */
  static async reviewSubmission(submissionId, maGiangVien, reviewData) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const { trang_thai, teacher_comment, ly_do_tu_choi } = reviewData;

      // Kiểm tra bài nộp có tồn tại và thuộc quyền quản lý không
      const [submission] = await connection.query(
        `SELECT bncsv.*, bccsv.ma_giang_vien
         FROM bai_nop_cua_sinh_vien bncsv
         INNER JOIN dot_nop_bao_cao_theo_tuan bccsv ON bncsv.slot_id = bccsv.id
         WHERE bncsv.id = ?
         LIMIT 1`,
        [submissionId]
      );

      if (!submission) {
        throw new Error('Không tìm thấy bài nộp');
      }

      if (submission.ma_giang_vien !== maGiangVien) {
        throw new Error('Bạn không có quyền đánh giá bài nộp này');
      }

      // Cập nhật trạng thái bài nộp
      await connection.query(
        `UPDATE bai_nop_cua_sinh_vien
         SET trang_thai = ?,
             teacher_comment = ?
         WHERE id = ?`,
        [trang_thai, teacher_comment || null, submissionId]
      );

      // Cập nhật log trong bao_cao_da_nop
      await connection.query(
        `UPDATE bao_cao_da_nop
         SET trang_thai = ?,
             nguoi_duyet = ?,
             ngay_duyet = NOW(),
             ly_do_tu_choi = ?
         WHERE ma_nguoi_nop = ? 
           AND tieu_de LIKE ?
         ORDER BY created_at DESC
         LIMIT 1`,
        [
          trang_thai,
          maGiangVien,
          trang_thai === 'tu_choi' ? ly_do_tu_choi : null,
          submission.ma_sinh_vien,
          `%${submission.original_name}%`
        ]
      );

      await connection.commit();

      return {
        success: true,
        message: trang_thai === 'da_duyet' 
          ? 'Đã duyệt bài nộp thành công' 
          : 'Đã từ chối bài nộp',
        data: { submissionId, trang_thai }
      };
    } catch (error) {
      await connection.rollback();
      console.error('Error in reviewSubmission:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Lấy thống kê bài nộp của sinh viên
   * @param {string} maSinhVien - Mã sinh viên
   * @returns {Object} Thống kê
   */
  static async getSubmissionStatistics(maSinhVien) {
    try {
      const [stats] = await db.query(
        `SELECT 
          COUNT(*) as tong_bai_nop,
          SUM(CASE WHEN trang_thai = 'da_nop' THEN 1 ELSE 0 END) as cho_duyet,
          SUM(CASE WHEN trang_thai = 'da_duyet' THEN 1 ELSE 0 END) as da_duyet,
          SUM(CASE WHEN trang_thai = 'tu_choi' THEN 1 ELSE 0 END) as tu_choi
         FROM bai_nop_cua_sinh_vien
         WHERE ma_sinh_vien = ?`,
        [maSinhVien]
      );

      return stats;
    } catch (error) {
      console.error('Error in getSubmissionStatistics:', error);
      throw error;
    }
  }
}

module.exports = SubmissionService;

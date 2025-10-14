const db = require('../database/connection');

/**
 * Model cho bảng bao_cao_da_nop
 * Quản lý báo cáo sinh viên đã nộp
 */
class StudentReportSubmission {
  /**
   * Tạo bảng bao_cao_da_nop với ràng buộc đầy đủ
   */
  static async createTable() {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS bao_cao_da_nop (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          ma_sinh_vien VARCHAR(20) NOT NULL,
          dot_thuc_tap_id INT,
          tieu_de VARCHAR(500) NOT NULL,
          file_path VARCHAR(500) NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          file_size INT,
          mime_type VARCHAR(100),
          ngay_nop DATETIME DEFAULT CURRENT_TIMESTAMP,
          trang_thai_duyet ENUM('cho_duyet', 'da_duyet', 'tu_choi') DEFAULT 'cho_duyet',
          nguoi_duyet VARCHAR(50),
          ngay_duyet DATETIME,
          ly_do_tu_choi TEXT,
          ghi_chu TEXT,
          loai_bao_cao ENUM('tuan', 'thang', 'cuoi_ky', 'tong_ket') DEFAULT 'tuan',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          -- Ràng buộc khóa ngoại
          FOREIGN KEY (ma_sinh_vien) REFERENCES sinh_vien(ma_sinh_vien) ON DELETE CASCADE,
          FOREIGN KEY (dot_thuc_tap_id) REFERENCES dot_thuc_tap(id) ON DELETE SET NULL,
          
          -- Indexes để tối ưu query
          INDEX idx_ma_sinh_vien (ma_sinh_vien),
          INDEX idx_dot_thuc_tap (dot_thuc_tap_id),
          INDEX idx_trang_thai (trang_thai_duyet),
          INDEX idx_ngay_nop (ngay_nop)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('✅ Bảng bao_cao_da_nop đã được tạo thành công');
    } catch (error) {
      console.error('❌ Lỗi tạo bảng bao_cao_da_nop:', error);
      throw error;
    }
  }

  /**
   * Lưu báo cáo mới khi sinh viên upload
   * @param {Object} reportData - Dữ liệu báo cáo
   * @returns {Object} Báo cáo đã lưu
   */
  static async createReport(reportData) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const {
        ma_sinh_vien,
        dot_thuc_tap_id,
        tieu_de,
        file_path,
        file_name,
        file_size,
        mime_type,
        loai_bao_cao,
        ghi_chu
      } = reportData;

      // Kiểm tra sinh viên tồn tại
      const [student] = await connection.query(
        `SELECT ma_sinh_vien, ho_ten FROM sinh_vien WHERE ma_sinh_vien = ? LIMIT 1`,
        [ma_sinh_vien]
      );

      if (!student) {
        throw new Error('Không tìm thấy sinh viên trong hệ thống');
      }

      // Kiểm tra đợt thực tập (nếu có)
      if (dot_thuc_tap_id) {
        const [dot] = await connection.query(
          `SELECT id, ten_dot FROM dot_thuc_tap WHERE id = ? LIMIT 1`,
          [dot_thuc_tap_id]
        );

        if (!dot) {
          throw new Error('Không tìm thấy đợt thực tập');
        }
      }

      // Lưu báo cáo
      const [result] = await connection.query(
        `INSERT INTO bao_cao_da_nop 
         (ma_sinh_vien, dot_thuc_tap_id, tieu_de, file_path, file_name, 
          file_size, mime_type, loai_bao_cao, ghi_chu, trang_thai_duyet)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'cho_duyet')`,
        [
          ma_sinh_vien,
          dot_thuc_tap_id || null,
          tieu_de,
          file_path,
          file_name,
          file_size || null,
          mime_type || null,
          loai_bao_cao || 'tuan',
          ghi_chu || null
        ]
      );

      await connection.commit();

      // Lấy thông tin báo cáo vừa tạo
      const [newReport] = await db.query(
        `SELECT 
          bcn.*,
          sv.ho_ten as ten_sinh_vien,
          sv.lop,
          dt.ten_dot
         FROM bao_cao_da_nop bcn
         LEFT JOIN sinh_vien sv ON bcn.ma_sinh_vien = sv.ma_sinh_vien
         LEFT JOIN dot_thuc_tap dt ON bcn.dot_thuc_tap_id = dt.id
         WHERE bcn.id = ?
         LIMIT 1`,
        [result.insertId]
      );

      return {
        success: true,
        message: 'Nộp báo cáo thành công',
        data: newReport
      };

    } catch (error) {
      await connection.rollback();
      console.error('Error in createReport:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Lấy danh sách báo cáo đã nộp (cho giảng viên)
   * @param {Object} filters - Bộ lọc
   * @returns {Array} Danh sách báo cáo
   */
  static async getReportsList(filters = {}) {
    try {
      const {
        ma_sinh_vien,
        dot_thuc_tap_id,
        trang_thai_duyet,
        loai_bao_cao,
        tu_ngay,
        den_ngay,
        ma_giang_vien,
        limit = 50,
        offset = 0
      } = filters;

      let query = `
        SELECT 
          bcn.*,
          sv.ho_ten as ten_sinh_vien,
          sv.lop,
          sv.email_ca_nhan,
          dt.ten_dot,
          svhd.ma_giang_vien,
          gv.ho_ten as ten_giang_vien
        FROM bao_cao_da_nop bcn
        LEFT JOIN sinh_vien sv ON bcn.ma_sinh_vien = sv.ma_sinh_vien
        LEFT JOIN dot_thuc_tap dt ON bcn.dot_thuc_tap_id = dt.id
        LEFT JOIN sinh_vien_huong_dan svhd ON sv.ma_sinh_vien = svhd.ma_sinh_vien
        LEFT JOIN giang_vien gv ON svhd.ma_giang_vien = gv.ma_giang_vien
        WHERE 1=1
      `;

      const params = [];

      if (ma_sinh_vien) {
        query += ' AND bcn.ma_sinh_vien = ?';
        params.push(ma_sinh_vien);
      }

      if (dot_thuc_tap_id) {
        query += ' AND bcn.dot_thuc_tap_id = ?';
        params.push(dot_thuc_tap_id);
      }

      if (trang_thai_duyet) {
        query += ' AND bcn.trang_thai_duyet = ?';
        params.push(trang_thai_duyet);
      }

      if (loai_bao_cao) {
        query += ' AND bcn.loai_bao_cao = ?';
        params.push(loai_bao_cao);
      }

      if (tu_ngay) {
        query += ' AND bcn.ngay_nop >= ?';
        params.push(tu_ngay);
      }

      if (den_ngay) {
        query += ' AND bcn.ngay_nop <= ?';
        params.push(den_ngay);
      }

      if (ma_giang_vien) {
        query += ' AND svhd.ma_giang_vien = ?';
        params.push(ma_giang_vien);
      }

      query += ' ORDER BY bcn.ngay_nop DESC';
      query += ' LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset));

      const reports = await db.query(query, params);

      // Đếm tổng số
      let countQuery = `
        SELECT COUNT(DISTINCT bcn.id) as total
        FROM bao_cao_da_nop bcn
        LEFT JOIN sinh_vien sv ON bcn.ma_sinh_vien = sv.ma_sinh_vien
        LEFT JOIN sinh_vien_huong_dan svhd ON sv.ma_sinh_vien = svhd.ma_sinh_vien
        WHERE 1=1
      `;

      const countParams = [...params.slice(0, -2)]; // Bỏ limit và offset

      if (ma_sinh_vien) countQuery += ' AND bcn.ma_sinh_vien = ?';
      if (dot_thuc_tap_id) countQuery += ' AND bcn.dot_thuc_tap_id = ?';
      if (trang_thai_duyet) countQuery += ' AND bcn.trang_thai_duyet = ?';
      if (loai_bao_cao) countQuery += ' AND bcn.loai_bao_cao = ?';
      if (tu_ngay) countQuery += ' AND bcn.ngay_nop >= ?';
      if (den_ngay) countQuery += ' AND bcn.ngay_nop <= ?';
      if (ma_giang_vien) countQuery += ' AND svhd.ma_giang_vien = ?';

      const [countResult] = await db.query(countQuery, countParams);

      return {
        reports,
        total: countResult.total || 0,
        limit: Number(limit),
        offset: Number(offset)
      };

    } catch (error) {
      console.error('Error in getReportsList:', error);
      throw error;
    }
  }

  /**
   * Duyệt hoặc từ chối báo cáo
   * @param {string} reportId - ID báo cáo
   * @param {string} nguoiDuyet - Mã người duyệt
   * @param {Object} reviewData - Dữ liệu đánh giá
   * @returns {Object} Kết quả
   */
  static async reviewReport(reportId, nguoiDuyet, reviewData) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const { trang_thai_duyet, ly_do_tu_choi } = reviewData;

      // Kiểm tra báo cáo tồn tại
      const [report] = await connection.query(
        `SELECT * FROM bao_cao_da_nop WHERE id = ? LIMIT 1`,
        [reportId]
      );

      if (!report) {
        throw new Error('Không tìm thấy báo cáo');
      }

      if (report.trang_thai_duyet !== 'cho_duyet') {
        throw new Error('Báo cáo đã được duyệt trước đó');
      }

      // Validate trạng thái
      if (!['da_duyet', 'tu_choi'].includes(trang_thai_duyet)) {
        throw new Error('Trạng thái không hợp lệ');
      }

      // Nếu từ chối, phải có lý do
      if (trang_thai_duyet === 'tu_choi' && !ly_do_tu_choi) {
        throw new Error('Vui lòng nhập lý do từ chối');
      }

      // Cập nhật trạng thái
      await connection.query(
        `UPDATE bao_cao_da_nop
         SET trang_thai_duyet = ?,
             nguoi_duyet = ?,
             ngay_duyet = NOW(),
             ly_do_tu_choi = ?
         WHERE id = ?`,
        [
          trang_thai_duyet,
          nguoiDuyet,
          trang_thai_duyet === 'tu_choi' ? ly_do_tu_choi : null,
          reportId
        ]
      );

      await connection.commit();

      return {
        success: true,
        message: trang_thai_duyet === 'da_duyet' 
          ? 'Đã duyệt báo cáo thành công' 
          : 'Đã từ chối báo cáo',
        data: { reportId, trang_thai_duyet }
      };

    } catch (error) {
      await connection.rollback();
      console.error('Error in reviewReport:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Lấy thống kê báo cáo
   * @param {string} ma_sinh_vien - Mã sinh viên (optional)
   * @returns {Object} Thống kê
   */
  static async getStatistics(ma_sinh_vien = null) {
    try {
      let query = `
        SELECT 
          COUNT(*) as tong_bao_cao,
          SUM(CASE WHEN trang_thai_duyet = 'cho_duyet' THEN 1 ELSE 0 END) as cho_duyet,
          SUM(CASE WHEN trang_thai_duyet = 'da_duyet' THEN 1 ELSE 0 END) as da_duyet,
          SUM(CASE WHEN trang_thai_duyet = 'tu_choi' THEN 1 ELSE 0 END) as tu_choi,
          SUM(CASE WHEN loai_bao_cao = 'tuan' THEN 1 ELSE 0 END) as bao_cao_tuan,
          SUM(CASE WHEN loai_bao_cao = 'thang' THEN 1 ELSE 0 END) as bao_cao_thang,
          SUM(CASE WHEN loai_bao_cao = 'cuoi_ky' THEN 1 ELSE 0 END) as bao_cao_cuoi_ky,
          SUM(CASE WHEN loai_bao_cao = 'tong_ket' THEN 1 ELSE 0 END) as bao_cao_tong_ket
        FROM bao_cao_da_nop
      `;

      const params = [];

      if (ma_sinh_vien) {
        query += ' WHERE ma_sinh_vien = ?';
        params.push(ma_sinh_vien);
      }

      const [stats] = await db.query(query, params);
      return stats;

    } catch (error) {
      console.error('Error in getStatistics:', error);
      throw error;
    }
  }

  /**
   * Xóa báo cáo (chỉ xóa được khi chưa duyệt)
   * @param {string} reportId - ID báo cáo
   * @param {string} ma_sinh_vien - Mã sinh viên
   * @returns {Object} Kết quả
   */
  static async deleteReport(reportId, ma_sinh_vien) {
    try {
      // Kiểm tra quyền
      const [report] = await db.query(
        `SELECT * FROM bao_cao_da_nop WHERE id = ? AND ma_sinh_vien = ? LIMIT 1`,
        [reportId, ma_sinh_vien]
      );

      if (!report) {
        throw new Error('Không tìm thấy báo cáo hoặc bạn không có quyền xóa');
      }

      if (report.trang_thai_duyet !== 'cho_duyet') {
        throw new Error('Không thể xóa báo cáo đã được duyệt');
      }

      await db.query('DELETE FROM bao_cao_da_nop WHERE id = ?', [reportId]);

      return {
        success: true,
        message: 'Xóa báo cáo thành công'
      };

    } catch (error) {
      console.error('Error in deleteReport:', error);
      throw error;
    }
  }
}

module.exports = StudentReportSubmission;

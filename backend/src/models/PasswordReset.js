const db = require('../database/connection');
const crypto = require('crypto');

/**
 * Model cho bảng doi_mat_khau
 * Quản lý yêu cầu đổi mật khẩu
 */
class PasswordReset {
  /**
   * Tạo bảng doi_mat_khau
   */
  static async createTable() {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS doi_mat_khau (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          reset_code VARCHAR(6) NOT NULL,
          expiration_time DATETIME NOT NULL,
          used_flag TINYINT(1) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          -- Indexes
          INDEX idx_email (email),
          INDEX idx_reset_code (reset_code),
          INDEX idx_expiration (expiration_time),
          INDEX idx_used_flag (used_flag)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('✅ Bảng doi_mat_khau đã được tạo thành công');
    } catch (error) {
      console.error('❌ Lỗi tạo bảng doi_mat_khau:', error);
      throw error;
    }
  }

  /**
   * Tạo mã xác thực ngẫu nhiên 6 chữ số
   * @returns {string} Mã 6 chữ số
   */
  static generateResetCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Tạo yêu cầu đổi mật khẩu
   * @param {string} email - Email người dùng
   * @param {number} expirationMinutes - Thời gian hết hạn (phút), mặc định 10 phút
   * @returns {Object} Thông tin yêu cầu
   */
  static async createResetRequest(email, expirationMinutes = 10) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Kiểm tra email tồn tại trong bảng accounts
      const [account] = await connection.query(
        `SELECT user_id, email FROM accounts WHERE email = ? LIMIT 1`,
        [email]
      );

      if (!account) {
        throw new Error('Email không tồn tại trong hệ thống');
      }

      // Xóa các yêu cầu cũ chưa sử dụng của email này
      await connection.query(
        `DELETE FROM doi_mat_khau WHERE email = ? AND used_flag = 0`,
        [email]
      );

      // Tạo mã xác thực
      const resetCode = this.generateResetCode();
      const expirationTime = new Date(Date.now() + expirationMinutes * 60 * 1000);

      // Lưu yêu cầu mới
      const [result] = await connection.query(
        `INSERT INTO doi_mat_khau (email, reset_code, expiration_time, used_flag)
         VALUES (?, ?, ?, 0)`,
        [email, resetCode, expirationTime]
      );

      await connection.commit();

      return {
        success: true,
        message: 'Mã xác thực đã được gửi',
        data: {
          id: result.insertId,
          email,
          reset_code: resetCode,
          expiration_time: expirationTime,
          expires_in_minutes: expirationMinutes
        }
      };

    } catch (error) {
      await connection.rollback();
      console.error('Error in createResetRequest:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Xác thực mã đổi mật khẩu
   * @param {string} email - Email
   * @param {string} resetCode - Mã xác thực
   * @returns {Object} Kết quả xác thực
   */
  static async verifyResetCode(email, resetCode) {
    try {
      const [request] = await db.query(
        `SELECT * FROM doi_mat_khau 
         WHERE email = ? 
           AND reset_code = ? 
           AND used_flag = 0 
           AND expiration_time > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [email, resetCode]
      );

      if (!request) {
        // Kiểm tra xem có phải mã hết hạn không
        const [expiredRequest] = await db.query(
          `SELECT * FROM doi_mat_khau 
           WHERE email = ? 
             AND reset_code = ? 
             AND expiration_time <= NOW()
           ORDER BY created_at DESC
           LIMIT 1`,
          [email, resetCode]
        );

        if (expiredRequest) {
          return {
            valid: false,
            message: 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.',
            reason: 'expired'
          };
        }

        // Kiểm tra xem mã đã được sử dụng chưa
        const [usedRequest] = await db.query(
          `SELECT * FROM doi_mat_khau 
           WHERE email = ? 
             AND reset_code = ? 
             AND used_flag = 1
           ORDER BY created_at DESC
           LIMIT 1`,
          [email, resetCode]
        );

        if (usedRequest) {
          return {
            valid: false,
            message: 'Mã xác thực đã được sử dụng',
            reason: 'used'
          };
        }

        return {
          valid: false,
          message: 'Mã xác thực không hợp lệ',
          reason: 'invalid'
        };
      }

      return {
        valid: true,
        message: 'Mã xác thực hợp lệ',
        data: {
          id: request.id,
          email: request.email,
          expiration_time: request.expiration_time
        }
      };

    } catch (error) {
      console.error('Error in verifyResetCode:', error);
      throw error;
    }
  }

  /**
   * Đổi mật khẩu
   * @param {string} email - Email
   * @param {string} resetCode - Mã xác thực
   * @param {string} newPassword - Mật khẩu mới (đã hash)
   * @returns {Object} Kết quả
   */
  static async resetPassword(email, resetCode, newPassword) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Xác thực mã
      const verification = await this.verifyResetCode(email, resetCode);

      if (!verification.valid) {
        throw new Error(verification.message);
      }

      // Kiểm tra account tồn tại
      const [account] = await connection.query(
        `SELECT user_id FROM accounts WHERE email = ? LIMIT 1`,
        [email]
      );

      if (!account) {
        throw new Error('Không tìm thấy tài khoản');
      }

      // Cập nhật mật khẩu mới
      await connection.query(
        `UPDATE accounts SET password = ? WHERE email = ?`,
        [newPassword, email]
      );

      // Đánh dấu mã đã sử dụng
      await connection.query(
        `UPDATE doi_mat_khau 
         SET used_flag = 1, updated_at = NOW() 
         WHERE email = ? AND reset_code = ?`,
        [email, resetCode]
      );

      await connection.commit();

      return {
        success: true,
        message: 'Đổi mật khẩu thành công',
        data: {
          email,
          user_id: account.user_id
        }
      };

    } catch (error) {
      await connection.rollback();
      console.error('Error in resetPassword:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Xóa các mã hết hạn tự động
   * @param {number} olderThanHours - Xóa mã cũ hơn X giờ, mặc định 24 giờ
   * @returns {Object} Kết quả
   */
  static async cleanupExpiredCodes(olderThanHours = 24) {
    try {
      const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

      const result = await db.query(
        `DELETE FROM doi_mat_khau 
         WHERE expiration_time < ? OR created_at < ?`,
        [cutoffTime, cutoffTime]
      );

      console.log(`🧹 Đã xóa ${result.affectedRows} mã hết hạn`);

      return {
        success: true,
        message: `Đã xóa ${result.affectedRows} mã hết hạn`,
        deleted_count: result.affectedRows
      };

    } catch (error) {
      console.error('Error in cleanupExpiredCodes:', error);
      throw error;
    }
  }

  /**
   * Lấy lịch sử yêu cầu đổi mật khẩu của email
   * @param {string} email - Email
   * @param {number} limit - Giới hạn số bản ghi
   * @returns {Array} Danh sách yêu cầu
   */
  static async getResetHistory(email, limit = 10) {
    try {
      const history = await db.query(
        `SELECT 
          id,
          email,
          reset_code,
          expiration_time,
          used_flag,
          created_at,
          CASE 
            WHEN used_flag = 1 THEN 'Đã sử dụng'
            WHEN expiration_time < NOW() THEN 'Hết hạn'
            ELSE 'Còn hiệu lực'
          END as trang_thai
         FROM doi_mat_khau
         WHERE email = ?
         ORDER BY created_at DESC
         LIMIT ?`,
        [email, limit]
      );

      return history;

    } catch (error) {
      console.error('Error in getResetHistory:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra tần suất yêu cầu đổi mật khẩu (chống spam)
   * @param {string} email - Email
   * @param {number} minutes - Khoảng thời gian kiểm tra (phút)
   * @param {number} maxRequests - Số lần tối đa
   * @returns {Object} Kết quả kiểm tra
   */
  static async checkRateLimit(email, minutes = 5, maxRequests = 3) {
    try {
      const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);

      const [result] = await db.query(
        `SELECT COUNT(*) as request_count
         FROM doi_mat_khau
         WHERE email = ? AND created_at >= ?`,
        [email, cutoffTime]
      );

      const requestCount = result.request_count || 0;
      const isLimited = requestCount >= maxRequests;

      return {
        is_limited: isLimited,
        request_count: requestCount,
        max_requests: maxRequests,
        time_window_minutes: minutes,
        message: isLimited 
          ? `Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau ${minutes} phút.`
          : 'Có thể yêu cầu'
      };

    } catch (error) {
      console.error('Error in checkRateLimit:', error);
      throw error;
    }
  }
}

module.exports = PasswordReset;

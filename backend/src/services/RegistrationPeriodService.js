const db = require('../database/connection');

/**
 * Service xử lý logic nghiệp vụ cho thời gian đăng ký đợt thực tập
 */
class RegistrationPeriodService {
  /**
   * Kiểm tra thời gian đăng ký có mở không
   * @param {number} periodId - ID của đợt đăng ký (optional)
   * @returns {Object} { isOpen: boolean, period: Object, message: string }
   */
  static async checkRegistrationStatus(periodId = null) {
    try {
      let query = `
        SELECT 
          id,
          title,
          start_time,
          end_time,
          description,
          is_active,
          created_at
        FROM thoi_gian_dang_ky_dot_thuc_tap
        WHERE is_active = 1
      `;

      const params = [];

      if (periodId) {
        query += ' AND id = ?';
        params.push(periodId);
      }

      query += ' ORDER BY created_at DESC LIMIT 1';

      const [period] = await db.query(query, params);

      if (!period) {
        return {
          isOpen: false,
          period: null,
          message: 'Hiện tại không có đợt đăng ký thực tập nào đang hoạt động'
        };
      }

      const now = new Date();
      const startTime = new Date(period.start_time);
      const endTime = new Date(period.end_time);

      if (now < startTime) {
        return {
          isOpen: false,
          period,
          message: `Đợt đăng ký "${period.title}" chưa mở. Thời gian bắt đầu: ${startTime.toLocaleString('vi-VN')}`,
          reason: 'not_started'
        };
      }

      if (now > endTime) {
        return {
          isOpen: false,
          period,
          message: `Đợt đăng ký "${period.title}" đã kết thúc vào ${endTime.toLocaleString('vi-VN')}`,
          reason: 'ended'
        };
      }

      return {
        isOpen: true,
        period,
        message: `Đợt đăng ký "${period.title}" đang mở`,
        timeRemaining: endTime - now // milliseconds
      };

    } catch (error) {
      console.error('Error in checkRegistrationStatus:', error);
      throw error;
    }
  }

  /**
   * Tạo đợt đăng ký mới (tự động đóng các đợt cũ)
   * @param {Object} periodData - Dữ liệu đợt đăng ký
   * @returns {Object} Đợt đăng ký mới
   */
  static async createRegistrationPeriod(periodData) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const { title, start_time, end_time, description } = periodData;

      // Validate thời gian
      const startTime = new Date(start_time);
      const endTime = new Date(end_time);

      if (startTime >= endTime) {
        throw new Error('Thời gian bắt đầu phải trước thời gian kết thúc');
      }

      // Kiểm tra trùng lặp thời gian với các đợt đang active
      const [overlappingPeriods] = await connection.query(
        `SELECT id, title, start_time, end_time 
         FROM thoi_gian_dang_ky_dot_thuc_tap
         WHERE is_active = 1
           AND (
             (start_time <= ? AND end_time >= ?) OR
             (start_time <= ? AND end_time >= ?) OR
             (start_time >= ? AND end_time <= ?)
           )
         LIMIT 1`,
        [start_time, start_time, end_time, end_time, start_time, end_time]
      );

      if (overlappingPeriods) {
        throw new Error(
          `Thời gian bị trùng với đợt đăng ký "${overlappingPeriods.title}" ` +
          `(${new Date(overlappingPeriods.start_time).toLocaleString('vi-VN')} - ` +
          `${new Date(overlappingPeriods.end_time).toLocaleString('vi-VN')})`
        );
      }

      // Tạo đợt mới
      const [result] = await connection.query(
        `INSERT INTO thoi_gian_dang_ky_dot_thuc_tap 
         (title, start_time, end_time, description, is_active)
         VALUES (?, ?, ?, ?, 1)`,
        [title, start_time, end_time, description || null]
      );

      await connection.commit();

      // Lấy thông tin đợt vừa tạo
      const [newPeriod] = await db.query(
        `SELECT * FROM thoi_gian_dang_ky_dot_thuc_tap WHERE id = ? LIMIT 1`,
        [result.insertId]
      );

      return {
        success: true,
        message: 'Tạo đợt đăng ký thành công',
        data: newPeriod
      };

    } catch (error) {
      await connection.rollback();
      console.error('Error in createRegistrationPeriod:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Đóng đợt đăng ký (đặt is_active = 0)
   * @param {number} periodId - ID của đợt đăng ký
   * @returns {Object} Kết quả
   */
  static async closeRegistrationPeriod(periodId) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Kiểm tra đợt có tồn tại không
      const [period] = await connection.query(
        `SELECT * FROM thoi_gian_dang_ky_dot_thuc_tap WHERE id = ? LIMIT 1`,
        [periodId]
      );

      if (!period) {
        throw new Error('Không tìm thấy đợt đăng ký');
      }

      if (period.is_active === 0) {
        throw new Error('Đợt đăng ký đã được đóng trước đó');
      }

      // Đóng đợt
      await connection.query(
        `UPDATE thoi_gian_dang_ky_dot_thuc_tap SET is_active = 0 WHERE id = ?`,
        [periodId]
      );

      // Đóng tất cả các đợt nộp bài liên quan (nếu có)
      await connection.query(
        `UPDATE dot_nop_bao_cao_theo_tuan 
         SET end_at = NOW() 
         WHERE end_at > NOW() 
           AND created_at >= ? 
           AND created_at <= ?`,
        [period.start_time, period.end_time]
      );

      await connection.commit();

      return {
        success: true,
        message: `Đã đóng đợt đăng ký "${period.title}" và tất cả các đợt nộp bài liên quan`,
        data: { periodId, closedAt: new Date() }
      };

    } catch (error) {
      await connection.rollback();
      console.error('Error in closeRegistrationPeriod:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Mở lại đợt đăng ký
   * @param {number} periodId - ID của đợt đăng ký
   * @returns {Object} Kết quả
   */
  static async reopenRegistrationPeriod(periodId) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Kiểm tra đợt có tồn tại không
      const [period] = await connection.query(
        `SELECT * FROM thoi_gian_dang_ky_dot_thuc_tap WHERE id = ? LIMIT 1`,
        [periodId]
      );

      if (!period) {
        throw new Error('Không tìm thấy đợt đăng ký');
      }

      if (period.is_active === 1) {
        throw new Error('Đợt đăng ký đang hoạt động');
      }

      // Kiểm tra thời gian có hợp lệ không
      const now = new Date();
      const endTime = new Date(period.end_time);

      if (now > endTime) {
        throw new Error('Không thể mở lại đợt đã quá thời gian kết thúc');
      }

      // Đóng tất cả các đợt khác
      await connection.query(
        `UPDATE thoi_gian_dang_ky_dot_thuc_tap SET is_active = 0 WHERE id != ?`,
        [periodId]
      );

      // Mở lại đợt này
      await connection.query(
        `UPDATE thoi_gian_dang_ky_dot_thuc_tap SET is_active = 1 WHERE id = ?`,
        [periodId]
      );

      await connection.commit();

      return {
        success: true,
        message: `Đã mở lại đợt đăng ký "${period.title}"`,
        data: { periodId, reopenedAt: new Date() }
      };

    } catch (error) {
      await connection.rollback();
      console.error('Error in reopenRegistrationPeriod:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Lấy danh sách tất cả các đợt đăng ký
   * @param {Object} filters - Bộ lọc
   * @returns {Array} Danh sách đợt đăng ký
   */
  static async getAllRegistrationPeriods(filters = {}) {
    try {
      const { is_active, from_date, to_date } = filters;

      let query = `
        SELECT 
          id,
          title,
          start_time,
          end_time,
          description,
          is_active,
          created_at,
          updated_at
        FROM thoi_gian_dang_ky_dot_thuc_tap
        WHERE 1=1
      `;

      const params = [];

      if (is_active !== undefined) {
        query += ' AND is_active = ?';
        params.push(is_active ? 1 : 0);
      }

      if (from_date) {
        query += ' AND start_time >= ?';
        params.push(from_date);
      }

      if (to_date) {
        query += ' AND end_time <= ?';
        params.push(to_date);
      }

      query += ' ORDER BY created_at DESC';

      const periods = await db.query(query, params);

      // Thêm trạng thái hiện tại cho mỗi đợt
      const now = new Date();
      const periodsWithStatus = periods.map(period => {
        const startTime = new Date(period.start_time);
        const endTime = new Date(period.end_time);

        let status = 'inactive';
        if (period.is_active) {
          if (now < startTime) {
            status = 'upcoming';
          } else if (now > endTime) {
            status = 'expired';
          } else {
            status = 'active';
          }
        }

        return {
          ...period,
          current_status: status
        };
      });

      return periodsWithStatus;

    } catch (error) {
      console.error('Error in getAllRegistrationPeriods:', error);
      throw error;
    }
  }

  /**
   * Gia hạn thời gian đăng ký
   * @param {number} periodId - ID của đợt đăng ký
   * @param {string} newEndTime - Thời gian kết thúc mới
   * @returns {Object} Kết quả
   */
  static async extendRegistrationPeriod(periodId, newEndTime) {
    try {
      // Kiểm tra đợt có tồn tại không
      const [period] = await db.query(
        `SELECT * FROM thoi_gian_dang_ky_dot_thuc_tap WHERE id = ? LIMIT 1`,
        [periodId]
      );

      if (!period) {
        throw new Error('Không tìm thấy đợt đăng ký');
      }

      const currentEndTime = new Date(period.end_time);
      const newEnd = new Date(newEndTime);

      if (newEnd <= currentEndTime) {
        throw new Error('Thời gian gia hạn phải sau thời gian kết thúc hiện tại');
      }

      await db.query(
        `UPDATE thoi_gian_dang_ky_dot_thuc_tap SET end_time = ? WHERE id = ?`,
        [newEndTime, periodId]
      );

      return {
        success: true,
        message: `Đã gia hạn đợt "${period.title}" đến ${newEnd.toLocaleString('vi-VN')}`,
        data: {
          periodId,
          old_end_time: period.end_time,
          new_end_time: newEndTime
        }
      };

    } catch (error) {
      console.error('Error in extendRegistrationPeriod:', error);
      throw error;
    }
  }
}

module.exports = RegistrationPeriodService;

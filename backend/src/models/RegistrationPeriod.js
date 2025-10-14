const db = require('../database/connection');

class RegistrationPeriod {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS thoi_gian_dang_ky_dot_thuc_tap (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL COMMENT 'Tiêu đề đợt đăng ký',
        start_time DATETIME NOT NULL COMMENT 'Thời gian bắt đầu đăng ký',
        end_time DATETIME NOT NULL COMMENT 'Thời gian kết thúc đăng ký',
        is_active TINYINT(1) DEFAULT 1 COMMENT 'Trạng thái hoạt động',
        description TEXT COMMENT 'Mô tả đợt đăng ký',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    try {
      await db.query(query);
      console.log('Table thoi_gian_dang_ky_dot_thuc_tap created successfully');
    } catch (error) {
      console.error('Error creating thoi_gian_dang_ky_dot_thuc_tap table:', error);
      throw error;
    }
  }

  // Tạo hoặc cập nhật đợt đăng ký
  static async createOrUpdate(data) {
    const { title, start_time, end_time, description } = data;
    
    try {
      // Deactivate all existing periods
      await db.query('UPDATE thoi_gian_dang_ky_dot_thuc_tap SET is_active = 0');
      
      // Create new active period
      const query = `
        INSERT INTO thoi_gian_dang_ky_dot_thuc_tap (title, start_time, end_time, description, is_active)
        VALUES (?, ?, ?, ?, 1)
      `;
      
      const result = await db.query(query, [title, start_time, end_time, description || null]);
      return result.insertId;
    } catch (error) {
      console.error('Error in createOrUpdate:', error);
      throw error;
    }
  }

  // Lấy đợt đăng ký hiện tại
  static async getCurrentPeriod() {
    try {
      const query = `
        SELECT * FROM thoi_gian_dang_ky_dot_thuc_tap 
        WHERE is_active = 1 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      const rows = await db.query(query);
      return rows[0] || null;
    } catch (error) {
      console.error('Error in getCurrentPeriod:', error);
      throw error;
    }
  }

  // Kiểm tra xem có trong thời gian đăng ký không
  static async isRegistrationOpen() {
    try {
      const query = `
        SELECT * FROM thoi_gian_dang_ky_dot_thuc_tap 
        WHERE is_active = 1 
          AND NOW() >= start_time 
          AND NOW() <= end_time
        LIMIT 1
      `;
      
      const rows = await db.query(query);
      return rows.length > 0;
    } catch (error) {
      console.error('Error in isRegistrationOpen:', error);
      throw error;
    }
  }

  // Lấy thông tin thời gian còn lại
  static async getRegistrationStatus() {
    try {
      const period = await this.getCurrentPeriod();
      if (!period) {
        return { status: 'no_period', message: 'Chưa có đợt đăng ký nào được thiết lập' };
      }

      const now = new Date();
      const startTime = new Date(period.start_time);
      const endTime = new Date(period.end_time);

      if (now < startTime) {
        const timeUntilStart = startTime.getTime() - now.getTime();
        return {
          status: 'before_start',
          message: 'Đăng ký chưa mở',
          period,
          timeUntilStart,
          timeUntilEnd: null
        };
      } else if (now > endTime) {
        return {
          status: 'ended',
          message: 'Đã hết thời gian đăng ký',
          period,
          timeUntilStart: null,
          timeUntilEnd: null
        };
      } else {
        const timeUntilEnd = endTime.getTime() - now.getTime();
        return {
          status: 'active',
          message: 'Đang trong thời gian đăng ký',
          period,
          timeUntilStart: null,
          timeUntilEnd
        };
      }
    } catch (error) {
      console.error('Error in getRegistrationStatus:', error);
      throw error;
    }
  }

  // Lấy lịch sử các đợt đăng ký
  static async getHistory() {
    try {
      const query = `
        SELECT * FROM thoi_gian_dang_ky_dot_thuc_tap 
        ORDER BY created_at DESC
      `;
      
      const rows = await db.query(query);
      return rows;
    } catch (error) {
      console.error('Error in getHistory:', error);
      throw error;
    }
  }

  // Xóa đợt đăng ký
  static async deletePeriod(id) {
    try {
      const query = 'DELETE FROM thoi_gian_dang_ky_dot_thuc_tap WHERE id = ?';
      const result = await db.query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in deletePeriod:', error);
      throw error;
    }
  }

  // Cập nhật trạng thái hoạt động
  static async updateActiveStatus(id, isActive) {
    try {
      if (isActive) {
        // Deactivate all others first
        await db.query('UPDATE thoi_gian_dang_ky_dot_thuc_tap SET is_active = 0');
      }
      
      const query = 'UPDATE thoi_gian_dang_ky_dot_thuc_tap SET is_active = ? WHERE id = ?';
      const result = await db.query(query, [isActive ? 1 : 0, id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in updateActiveStatus:', error);
      throw error;
    }
  }
}

module.exports = RegistrationPeriod;
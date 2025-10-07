const { query } = require('../database/connection');
const bcrypt = require('bcryptjs');

class Account {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.email = data.email;
    this.passwordHash = data.password_hash;
    this.role = data.role;
    this.isActive = data.is_active;
    this.lastLogin = data.last_login;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Tạo tài khoản mới (chỉ cho authentication)
  static async create(accountData) {
    const { userId, email, password, role } = accountData;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO accounts (user_id, email, password_hash, role, is_active) 
      VALUES (?, ?, ?, ?, TRUE)
    `;

    try {
      const result = await query(sql, [userId, email, passwordHash, role]);

      return {
        success: true,
        insertId: result.insertId,
        message: 'Tài khoản được tạo thành công'
      };
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  // Tạo nhiều tài khoản (bulk insert) - chỉ tạo account authentication
  static async createMany(accountsData) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const results = {
        created: 0,
        updated: 0,
        errors: []
      };

      for (const accountData of accountsData) {
        try {
          // Kiểm tra tài khoản đã tồn tại
          const existing = await this.findByUserId(accountData.userId);
          
          if (existing) {
            // Cập nhật password nếu có
            if (accountData.password) {
              await this.updatePassword(accountData.userId, accountData.password);
            }
            results.updated++;
          } else {
            // Tạo tài khoản mới
            await this.create(accountData);
            results.created++;
          }
        } catch (error) {
          results.errors.push({
            userId: accountData.userId,
            error: error.message
          });
        }
      }

      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Tìm tài khoản theo user_id
  static async findByUserId(userId) {
    const sql = 'SELECT * FROM accounts WHERE user_id = ? AND is_active = TRUE';
    
    try {
      const rows = await query(sql, [userId]);
      return rows.length > 0 ? new Account(rows[0]) : null;
    } catch (error) {
      console.error('Error finding account by userId:', error);
      throw error;
    }
  }

  // Tìm tài khoản theo email
  static async findByEmail(email) {
    const sql = 'SELECT * FROM accounts WHERE email = ? AND is_active = TRUE';
    
    try {
      const rows = await query(sql, [email]);
      return rows.length > 0 ? new Account(rows[0]) : null;
    } catch (error) {
      console.error('Error finding account by email:', error);
      throw error;
    }
  }

  // Xác thực đăng nhập
  static async authenticate(userId, password, role = null) {
    try {
      let sql = 'SELECT * FROM accounts WHERE user_id = ? AND is_active = TRUE';
      let params = [userId];

      if (role) {
        sql += ' AND role = ?';
        params.push(role);
      }

      const rows = await query(sql, params);
      
      if (rows.length === 0) {
        return null;
      }

      const account = new Account(rows[0]);
      const isPasswordValid = await bcrypt.compare(password, account.passwordHash);
      
      if (!isPasswordValid) {
        return null;
      }

      // Cập nhật last_login
      await this.updateLastLogin(account.id);

      return account;
    } catch (error) {
      console.error('Error authenticating account:', error);
      throw error;
    }
  }

  // Cập nhật last_login
  static async updateLastLogin(accountId) {
    const sql = 'UPDATE accounts SET last_login = NOW() WHERE id = ?';
    
    try {
      await query(sql, [accountId]);
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  // Cập nhật mật khẩu
  static async updatePassword(userId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const sql = 'UPDATE accounts SET password_hash = ?, updated_at = NOW() WHERE user_id = ?';

    try {
      const result = await query(sql, [passwordHash, userId]);
      return {
        success: result.affectedRows > 0,
        message: result.affectedRows > 0 ? 'Cập nhật mật khẩu thành công' : 'Không tìm thấy tài khoản'
      };
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  // Lấy danh sách tài khoản theo role
  static async getByRole(role, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const sql = `
      SELECT * FROM accounts 
      WHERE role = ? AND is_active = TRUE 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

    try {
      const rows = await query(sql, [role, limit, offset]);
      const accounts = rows.map(row => new Account(row));

      // Đếm tổng số
      const countSql = 'SELECT COUNT(*) as total FROM accounts WHERE role = ? AND is_active = TRUE';
      const countRows = await query(countSql, [role]);
      const total = countRows[0].total;

      return {
        accounts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting accounts by role:', error);
      throw error;
    }
  }

  // Vô hiệu hóa tài khoản
  static async deactivate(userId) {
    const sql = 'UPDATE accounts SET is_active = FALSE WHERE user_id = ?';
    
    try {
      const [result] = await query(query, [userId]);
      return {
        success: result.affectedRows > 0,
        message: result.affectedRows > 0 ? 'Vô hiệu hóa thành công' : 'Không tìm thấy tài khoản'
      };
    } catch (error) {
      console.error('Error deactivating account:', error);
      throw error;
    }
  }

  // Kích hoạt lại tài khoản
  static async activate(userId) {
    const sql = 'UPDATE accounts SET is_active = TRUE WHERE user_id = ?';
    
    try {
      const [result] = await query(query, [userId]);
      return {
        success: result.affectedRows > 0,
        message: result.affectedRows > 0 ? 'Kích hoạt thành công' : 'Không tìm thấy tài khoản'
      };
    } catch (error) {
      console.error('Error activating account:', error);
      throw error;
    }
  }

  // Xóa tài khoản (soft delete)
  static async delete(userId) {
    return await this.deactivate(userId);
  }

  // Thống kê tài khoản theo role
  static async getStatistics() {
    const sql = `
      SELECT 
        role,
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active,
        COUNT(CASE WHEN is_active = FALSE THEN 1 END) as inactive
      FROM accounts 
      GROUP BY role
    `;

    try {
      const [rows] = await query(query);
      return rows;
    } catch (error) {
      console.error('Error getting account statistics:', error);
      throw error;
    }
  }

  // Tìm kiếm tài khoản
  static async search(keyword, role = null, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT * FROM accounts 
      WHERE is_active = TRUE 
      AND (user_id LIKE ? OR full_name LIKE ? OR email LIKE ?)
    `;
    let params = [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    try {
      const [rows] = await query(query, params);
      const accounts = rows.map(row => new Account(row));

      // Đếm tổng số
      let countQuery = `
        SELECT COUNT(*) as total FROM accounts 
        WHERE is_active = TRUE 
        AND (user_id LIKE ? OR full_name LIKE ? OR email LIKE ?)
      `;
      let countParams = [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`];

      if (role) {
        countQuery += ' AND role = ?';
        countParams.push(role);
      }

      const [countRows] = await query(countQuery, countParams);
      const total = countRows[0].total;

      return {
        accounts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error searching accounts:', error);
      throw error;
    }
  }

  // Đăng nhập bằng mã sinh viên
  static async authenticateBySinhVien(maSinhVien, password) {
    try {
      const sql = `
        SELECT a.*, sv.ma_sinh_vien, sv.ho_ten 
        FROM accounts a
        INNER JOIN sinh_vien sv ON a.id = sv.account_id
        WHERE sv.ma_sinh_vien = ? AND a.is_active = TRUE AND a.role = 'sinh-vien'
      `;

      const rows = await query(sql, [maSinhVien]);
      
      if (rows.length === 0) {
        return null;
      }

      const accountData = rows[0];
      const isPasswordValid = await bcrypt.compare(password, accountData.password_hash);
      
      if (!isPasswordValid) {
        return null;
      }

      // Cập nhật last_login
      await this.updateLastLogin(accountData.id);

      // Trả về thông tin tài khoản cùng thông tin sinh viên
      return {
        account: new Account(accountData),
        sinhVien: {
          maSinhVien: accountData.ma_sinh_vien,
          hoTen: accountData.ho_ten
        }
      };
    } catch (error) {
      console.error('Error authenticating sinh vien:', error);
      throw error;
    }
  }

  // Đăng nhập bằng mã giảng viên
  static async authenticateByGiangVien(maGiangVien, password) {
    try {
      const sql = `
        SELECT a.*, gv.ma_giang_vien, gv.ho_ten 
        FROM accounts a
        INNER JOIN giang_vien gv ON a.id = gv.account_id
        WHERE gv.ma_giang_vien = ? AND a.is_active = TRUE AND a.role = 'giang-vien'
      `;

      const rows = await query(sql, [maGiangVien]);
      
      if (rows.length === 0) {
        return null;
      }

      const accountData = rows[0];
      const isPasswordValid = await bcrypt.compare(password, accountData.password_hash);
      
      if (!isPasswordValid) {
        return null;
      }

      // Cập nhật last_login
      await this.updateLastLogin(accountData.id);

      // Trả về thông tin tài khoản cùng thông tin giảng viên
      return {
        account: new Account(accountData),
        giangVien: {
          maGiangVien: accountData.ma_giang_vien,
          hoTen: accountData.ho_ten
        }
      };
    } catch (error) {
      console.error('Error authenticating giang vien:', error);
      throw error;
    }
  }

  // Đăng nhập bằng mã doanh nghiệp
  static async authenticateByDoanhNghiep(maDoanhNghiep, password) {
    try {
      const sql = `
        SELECT a.*, dn.ma_doanh_nghiep, dn.ten_cong_ty 
        FROM accounts a
        INNER JOIN doanh_nghiep dn ON a.id = dn.account_id
        WHERE dn.ma_doanh_nghiep = ? AND a.is_active = TRUE AND a.role = 'doanh-nghiep'
      `;

      const rows = await query(sql, [maDoanhNghiep]);
      
      if (rows.length === 0) {
        return null;
      }

      const accountData = rows[0];
      const isPasswordValid = await bcrypt.compare(password, accountData.password_hash);
      
      if (!isPasswordValid) {
        return null;
      }

      // Cập nhật last_login
      await this.updateLastLogin(accountData.id);

      // Trả về thông tin tài khoản cùng thông tin doanh nghiệp
      return {
        account: new Account(accountData),
        doanhNghiep: {
          maDoanhNghiep: accountData.ma_doanh_nghiep,
          tenDoanhNghiep: accountData.ten_doanh_nghiep
        }
      };
    } catch (error) {
      console.error('Error authenticating doanh nghiep:', error);
      throw error;
    }
  }
}

module.exports = Account;

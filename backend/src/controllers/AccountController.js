const Account = require('../models/Account');

class AccountController {

  // GET /api/accounts - Lấy danh sách tài khoản
  static async getAccounts(req, res) {
    try {
      const { role, page = 1, limit = 20, search } = req.query;

      let result;
      if (search) {
        result = await Account.search(search, role, parseInt(page), parseInt(limit));
      } else if (role) {
        result = await Account.getByRole(role, parseInt(page), parseInt(limit));
      } else {
        // Lấy tất cả tài khoản (phân trang)
        result = await Account.search('', null, parseInt(page), parseInt(limit));
      }

      res.json({
        success: true,
        message: 'Lấy danh sách tài khoản thành công',
        data: result
      });
    } catch (error) {
      console.error('Error getting accounts:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách tài khoản',
        error: error.message
      });
    }
  }

  // GET /api/accounts/:userId - Lấy thông tin tài khoản theo userId
  static async getAccountByUserId(req, res) {
    try {
      const { userId } = req.params;
      const account = await Account.findByUserId(userId);

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài khoản',
          data: null
        });
      }

      // Loại bỏ password hash khỏi response
      const accountData = { ...account };
      delete accountData.passwordHash;

      res.json({
        success: true,
        message: 'Lấy thông tin tài khoản thành công',
        data: accountData
      });
    } catch (error) {
      console.error('Error getting account:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin tài khoản',
        error: error.message
      });
    }
  }

  // POST /api/accounts - Tạo tài khoản mới
  static async createAccount(req, res) {
    try {
      const accountData = req.body;

      // Basic validation
      if (!accountData.userId || !accountData.email || !accountData.password || !accountData.fullName || !accountData.role) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin bắt buộc: userId, email, password, fullName, role',
          data: null
        });
      }

      // Kiểm tra tài khoản đã tồn tại
      const existingAccount = await Account.findByUserId(accountData.userId);
      if (existingAccount) {
        return res.status(409).json({
          success: false,
          message: 'Tài khoản đã tồn tại',
          data: null
        });
      }

      const result = await Account.create(accountData);

      res.status(201).json({
        success: true,
        message: 'Tạo tài khoản thành công',
        data: result
      });
    } catch (error) {
      console.error('Error creating account:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo tài khoản',
        error: error.message
      });
    }
  }

  // POST /api/accounts/bulk - Tạo nhiều tài khoản (bulk import)
  static async createBulkAccounts(req, res) {
    try {
      const { accounts } = req.body;

      if (!Array.isArray(accounts) || accounts.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Danh sách tài khoản không hợp lệ',
          data: null
        });
      }

      const result = await Account.createMany(accounts);

      res.json({
        success: true,
        message: 'Import tài khoản thành công',
        data: result
      });
    } catch (error) {
      console.error('Error bulk creating accounts:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi import tài khoản',
        error: error.message
      });
    }
  }

  // PUT /api/accounts/:userId - Cập nhật tài khoản
  static async updateAccount(req, res) {
    try {
      const { userId } = req.params;
      const updateData = req.body;

      const result = await Account.updateByUserId(userId, updateData);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message,
          data: null
        });
      }

      res.json({
        success: true,
        message: 'Cập nhật tài khoản thành công',
        data: result
      });
    } catch (error) {
      console.error('Error updating account:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật tài khoản',
        error: error.message
      });
    }
  }

  // DELETE /api/accounts/:userId - Xóa tài khoản (soft delete)
  static async deleteAccount(req, res) {
    try {
      const { userId } = req.params;
      const result = await Account.delete(userId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message,
          data: null
        });
      }

      res.json({
        success: true,
        message: 'Xóa tài khoản thành công',
        data: result
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa tài khoản',
        error: error.message
      });
    }
  }

  // POST /api/accounts/:userId/activate - Kích hoạt tài khoản
  static async activateAccount(req, res) {
    try {
      const { userId } = req.params;
      const result = await Account.activate(userId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message,
          data: null
        });
      }

      res.json({
        success: true,
        message: 'Kích hoạt tài khoản thành công',
        data: result
      });
    } catch (error) {
      console.error('Error activating account:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi kích hoạt tài khoản',
        error: error.message
      });
    }
  }

  // POST /api/accounts/:userId/deactivate - Vô hiệu hóa tài khoản
  static async deactivateAccount(req, res) {
    try {
      const { userId } = req.params;
      const result = await Account.deactivate(userId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message,
          data: null
        });
      }

      res.json({
        success: true,
        message: 'Vô hiệu hóa tài khoản thành công',
        data: result
      });
    } catch (error) {
      console.error('Error deactivating account:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi vô hiệu hóa tài khoản',
        error: error.message
      });
    }
  }

  // POST /api/accounts/auth - Xác thực đăng nhập
  static async authenticate(req, res) {
    try {
      const { userId, password, role } = req.body;

      // Basic validation
      if (!userId || !password) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu mã đăng nhập hoặc mật khẩu',
          data: null
        });
      }

      const account = await Account.authenticate(userId, password, role);

      if (!account) {
        return res.status(401).json({
          success: false,
          message: 'Thông tin đăng nhập không chính xác',
          data: null
        });
      }

      // Loại bỏ password hash khỏi response
      const accountData = { ...account };
      delete accountData.passwordHash;

      res.json({
        success: true,
        message: 'Đăng nhập thành công',
        data: accountData
      });
    } catch (error) {
      console.error('Error authenticating account:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xác thực đăng nhập',
        error: error.message
      });
    }
  }

  // GET /api/accounts/statistics - Thống kê tài khoản
  static async getStatistics(req, res) {
    try {
      const statistics = await Account.getStatistics();

      res.json({
        success: true,
        message: 'Lấy thống kê tài khoản thành công',
        data: statistics
      });
    } catch (error) {
      console.error('Error getting account statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thống kê tài khoản',
        error: error.message
      });
    }
  }

  // GET /api/accounts/check/:userId - Kiểm tra tài khoản tồn tại
  static async checkAccountExists(req, res) {
    try {
      const { userId } = req.params;
      const account = await Account.findByUserId(userId);

      res.json({
        success: true,
        message: 'Kiểm tra tài khoản thành công',
        data: {
          exists: !!account,
          account: account ? { userId: account.userId, fullName: account.fullName, role: account.role } : null
        }
      });
    } catch (error) {
      console.error('Error checking account exists:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi kiểm tra tài khoản',
        error: error.message
      });
    }
  }
}

module.exports = AccountController;
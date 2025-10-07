const Account = require('../models/Account');
const jwt = require('jsonwebtoken');

class AuthController {
  // Đăng nhập chung (tự động detect loại tài khoản)
  static async login(req, res) {
    try {
      const { userCode, password } = req.body;

      if (!userCode || !password) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập mã và mật khẩu'
        });
      }

      let authResult = null;
      let userInfo = null;

      // Thử đăng nhập theo các loại tài khoản
      // 1. Thử sinh viên (mã bắt đầu bằng SV)
      if (userCode.toUpperCase().startsWith('SV')) {
        authResult = await Account.authenticateBySinhVien(userCode, password);
        if (authResult) {
          userInfo = {
            id: authResult.account.id,
            userId: authResult.account.userId,
            role: authResult.account.role,
            maSinhVien: authResult.sinhVien.maSinhVien,
            hoTen: authResult.sinhVien.hoTen
          };
        }
      }
      // 2. Thử giảng viên (mã bắt đầu bằng GV)
      else if (userCode.toUpperCase().startsWith('GV')) {
        authResult = await Account.authenticateByGiangVien(userCode, password);
        if (authResult) {
          userInfo = {
            id: authResult.account.id,
            userId: authResult.account.userId,
            role: authResult.account.role,
            maGiangVien: authResult.giangVien.maGiangVien,
            hoTen: authResult.giangVien.hoTen
          };
        }
      }
      // 3. Thử doanh nghiệp (mã bắt đầu bằng DN)
      else if (userCode.toUpperCase().startsWith('DN')) {
        authResult = await Account.authenticateByDoanhNghiep(userCode, password);
        if (authResult) {
          userInfo = {
            id: authResult.account.id,
            userId: authResult.account.userId,
            role: authResult.account.role,
            maDoanhNghiep: authResult.doanhNghiep.maDoanhNghiep,
            tenDoanhNghiep: authResult.doanhNghiep.tenDoanhNghiep
          };
        }
      }
      // 4. Thử admin (user_id trực tiếp)
      else {
        authResult = await Account.authenticate(userCode, password, 'admin');
        if (authResult) {
          userInfo = {
            id: authResult.id,
            userId: authResult.userId,
            role: authResult.role
          };
        }
      }

      if (!authResult) {
        return res.status(401).json({
          success: false,
          message: 'Mã đăng nhập hoặc mật khẩu không chính xác'
        });
      }

      // Tạo JWT token
      const token = jwt.sign(
        userInfo,
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          user: userInfo,
          token: token
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đăng nhập'
      });
    }
  }

  // Đăng nhập sinh viên (riêng biệt)
  static async loginSinhVien(req, res) {
    try {
      const { maSinhVien, password } = req.body;

      if (!maSinhVien || !password) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập mã sinh viên và mật khẩu'
        });
      }

      const authResult = await Account.authenticateBySinhVien(maSinhVien, password);

      if (!authResult) {
        return res.status(401).json({
          success: false,
          message: 'Mã sinh viên hoặc mật khẩu không chính xác'
        });
      }

      const userInfo = {
        id: authResult.account.id,
        userId: authResult.account.userId,
        role: authResult.account.role,
        maSinhVien: authResult.sinhVien.maSinhVien,
        hoTen: authResult.sinhVien.hoTen
      };

      // Tạo JWT token
      const token = jwt.sign(
        userInfo,
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Đăng nhập sinh viên thành công',
        data: {
          user: userInfo,
          token: token
        }
      });

    } catch (error) {
      console.error('Sinh vien login error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đăng nhập sinh viên'
      });
    }
  }

  // Đăng nhập admin (riêng biệt)
  static async loginAdmin(req, res) {
    try {
      const { userId, password } = req.body;

      if (!userId || !password) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập tên người dùng và mật khẩu'
        });
      }

      // Kiểm tra định dạng tài khoản admin
      const cleanUserId = userId.trim().toLowerCase();
      if (!cleanUserId.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: 'Chỉ tài khoản admin mới được phép đăng nhập tại đây. Tài khoản phải chứa từ "admin"'
        });
      }

      // Xác thực admin bằng userId và password
      const authResult = await Account.authenticate(userId, password, 'admin');

      if (!authResult) {
        return res.status(401).json({
          success: false,
          message: 'Tài khoản admin hoặc mật khẩu không chính xác'
        });
      }

      // Kiểm tra lại role để đảm bảo thực sự là admin
      if (authResult.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản này không có quyền quản trị viên'
        });
      }

      const userInfo = {
        id: authResult.id,
        userId: authResult.userId,
        role: authResult.role
      };

      // Tạo JWT token
      const token = jwt.sign(
        userInfo,
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Đăng nhập quản trị viên thành công',
        data: {
          user: userInfo,
          token: token
        }
      });

    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đăng nhập quản trị viên'
      });
    }
  }

  // Logout
  static async logout(req, res) {
    try {
      // Với JWT, logout chỉ cần client xóa token
      res.json({
        success: true,
        message: 'Đăng xuất thành công'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đăng xuất'
      });
    }
  }

  // Kiểm tra token và lấy thông tin user
  static async me(req, res) {
    try {
      // req.user được set bởi auth middleware
      res.json({
        success: true,
        data: req.user
      });
    } catch (error) {
      console.error('Get user info error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin người dùng'
      });
    }
  }
}

module.exports = AuthController;
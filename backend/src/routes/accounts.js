const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const AccountController = require('../controllers/AccountController');

/**
 * @route   GET /api/accounts
 * @desc    Lấy danh sách tài khoản (có phân trang, tìm kiếm, lọc theo role)
 * @access  Private (Admin)
 * @query   role, page, limit, search
 */
router.get('/', AccountController.getAccounts);

/**
 * @route   GET /api/accounts/statistics
 * @desc    Thống kê tài khoản theo role
 * @access  Private (Admin)
 */
router.get('/statistics', AccountController.getStatistics);

/**
 * @route   GET /api/accounts/check/:userId
 * @desc    Kiểm tra tài khoản có tồn tại không
 * @access  Private
 */
router.get('/check/:userId', AccountController.checkAccountExists);

/**
 * @route   GET /api/accounts/:userId
 * @desc    Lấy thông tin tài khoản theo userId
 * @access  Private
 */
router.get('/:userId', AccountController.getAccountByUserId);

/**
 * @route   POST /api/accounts
 * @desc    Tạo tài khoản mới
 * @access  Private (Admin)
 */
router.post('/', [
  body('userId')
    .notEmpty()
    .withMessage('Mã đăng nhập là bắt buộc')
    .isLength({ min: 3, max: 50 })
    .withMessage('Mã đăng nhập phải từ 3-50 ký tự'),
  
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  
  body('fullName')
    .notEmpty()
    .withMessage('Họ tên là bắt buộc')
    .isLength({ max: 255 })
    .withMessage('Họ tên không được quá 255 ký tự'),
  
  body('role')
    .isIn(['admin', 'sinh-vien', 'giang-vien', 'doanh-nghiep'])
    .withMessage('Vai trò không hợp lệ'),
  
  body('phone')
    .optional()
    .isMobilePhone('vi-VN')
    .withMessage('Số điện thoại không hợp lệ'),
  
  body('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Tên khoa/phòng ban không được quá 100 ký tự'),
  
  body('class')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Tên lớp không được quá 50 ký tự'),
  
  body('companyName')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Tên công ty không được quá 255 ký tự'),
  
  body('position')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Chức vụ không được quá 100 ký tự')
], AccountController.createAccount);

/**
 * @route   POST /api/accounts/bulk
 * @desc    Tạo nhiều tài khoản (bulk import)
 * @access  Private (Admin)
 */
router.post('/bulk', [
  body('accounts')
    .isArray({ min: 1 })
    .withMessage('Danh sách tài khoản phải là mảng và không được rỗng'),
  
  body('accounts.*.userId')
    .notEmpty()
    .withMessage('Mã đăng nhập là bắt buộc')
    .isLength({ min: 3, max: 50 })
    .withMessage('Mã đăng nhập phải từ 3-50 ký tự'),
  
  body('accounts.*.email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  
  body('accounts.*.password')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  
  body('accounts.*.fullName')
    .notEmpty()
    .withMessage('Họ tên là bắt buộc')
    .isLength({ max: 255 })
    .withMessage('Họ tên không được quá 255 ký tự'),
  
  body('accounts.*.role')
    .isIn(['admin', 'sinh-vien', 'giang-vien', 'doanh-nghiep'])
    .withMessage('Vai trò không hợp lệ')
], AccountController.createBulkAccounts);

/**
 * @route   PUT /api/accounts/:userId
 * @desc    Cập nhật thông tin tài khoản
 * @access  Private
 */
router.put('/:userId', [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  
  body('fullName')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Họ tên không được quá 255 ký tự'),
  
  body('phone')
    .optional()
    .isMobilePhone('vi-VN')
    .withMessage('Số điện thoại không hợp lệ'),
  
  body('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Tên khoa/phòng ban không được quá 100 ký tự'),
  
  body('class')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Tên lớp không được quá 50 ký tự'),
  
  body('companyName')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Tên công ty không được quá 255 ký tự'),
  
  body('position')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Chức vụ không được quá 100 ký tự')
], AccountController.updateAccount);

/**
 * @route   DELETE /api/accounts/:userId
 * @desc    Xóa tài khoản (soft delete)
 * @access  Private (Admin)
 */
router.delete('/:userId', AccountController.deleteAccount);

/**
 * @route   POST /api/accounts/:userId/activate
 * @desc    Kích hoạt tài khoản
 * @access  Private (Admin)
 */
router.post('/:userId/activate', AccountController.activateAccount);

/**
 * @route   POST /api/accounts/:userId/deactivate
 * @desc    Vô hiệu hóa tài khoản
 * @access  Private (Admin)
 */
router.post('/:userId/deactivate', AccountController.deactivateAccount);

/**
 * @route   POST /api/accounts/auth
 * @desc    Xác thực đăng nhập
 * @access  Public
 */
router.post('/auth', [
  body('userId')
    .notEmpty()
    .withMessage('Mã đăng nhập là bắt buộc'),
  
  body('password')
    .notEmpty()
    .withMessage('Mật khẩu là bắt buộc'),
  
  body('role')
    .optional()
    .isIn(['admin', 'sinh-vien', 'giang-vien', 'doanh-nghiep'])
    .withMessage('Vai trò không hợp lệ')
], AccountController.authenticate);

module.exports = router;
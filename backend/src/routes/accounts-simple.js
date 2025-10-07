const express = require('express');
const router = express.Router();
const AccountController = require('../controllers/AccountController');

/**
 * @route   GET /api/accounts
 * @desc    Lấy danh sách tài khoản (có phân trang, tìm kiếm, lọc theo role)
 * @access  Private (Admin)
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
router.post('/', AccountController.createAccount);

/**
 * @route   POST /api/accounts/bulk
 * @desc    Tạo nhiều tài khoản (bulk import)
 * @access  Private (Admin)
 */
router.post('/bulk', AccountController.createBulkAccounts);

/**
 * @route   PUT /api/accounts/:userId
 * @desc    Cập nhật thông tin tài khoản
 * @access  Private
 */
router.put('/:userId', AccountController.updateAccount);

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
router.post('/auth', AccountController.authenticate);

module.exports = router;
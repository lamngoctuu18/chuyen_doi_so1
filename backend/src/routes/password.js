const express = require('express');
const PasswordController = require('../controllers/PasswordController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/password/change
 * @desc    Đổi mật khẩu
 * @access  Private
 */
router.post('/change', authenticateToken, PasswordController.changePassword);

/**
 * @route   POST /api/password/forgot
 * @desc    Quên mật khẩu - Tạo mật khẩu tạm thời
 * @access  Public
 */
router.post('/forgot', PasswordController.forgotPassword);

/**
 * @route   POST /api/password/send-reset-code
 * @desc    Gửi mã xác minh để reset password
 * @access  Public
 */
router.post('/send-reset-code', PasswordController.sendResetCode);

/**
 * @route   POST /api/password/verify-reset-code
 * @desc    Xác minh mã reset code
 * @access  Public
 */
router.post('/verify-reset-code', PasswordController.verifyResetCode);

/**
 * @route   POST /api/password/reset-password
 * @desc    Đặt lại mật khẩu với mã xác minh
 * @access  Public
 */
router.post('/reset-password', PasswordController.resetPassword);

module.exports = router;

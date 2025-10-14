const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const PasswordReset = require('../models/PasswordReset');

/**
 * @swagger
 * /api/password-reset/request:
 *   post:
 *     tags: [Đổi Mật Khẩu]
 *     summary: Yêu cầu mã đổi mật khẩu
 *     description: Gửi mã xác thực 6 số đến email (hết hạn sau 10 phút, tối đa 3 lần/5 phút)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetRequest'
 *     responses:
 *       200:
 *         description: Mã xác thực đã được gửi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PasswordResetResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         description: Quá nhiều yêu cầu (Rate limit)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau 5 phút.
 *                 data:
 *                   type: object
 *                   properties:
 *                     request_count:
 *                       type: integer
 *                     max_requests:
 *                       type: integer
 *                     time_window_minutes:
 *                       type: integer
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/request', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ'
      });
    }

    // Kiểm tra rate limit (chống spam)
    const rateLimitCheck = await PasswordReset.checkRateLimit(email, 5, 3);
    if (rateLimitCheck.is_limited) {
      return res.status(429).json({
        success: false,
        message: rateLimitCheck.message,
        data: {
          request_count: rateLimitCheck.request_count,
          max_requests: rateLimitCheck.max_requests,
          time_window_minutes: rateLimitCheck.time_window_minutes
        }
      });
    }

    // Tạo yêu cầu đổi mật khẩu
    const result = await PasswordReset.createResetRequest(email, 10); // 10 phút

    // TODO: Gửi email chứa mã xác thực
    // await sendResetCodeEmail(email, result.data.reset_code);

    res.json({
      success: true,
      message: 'Mã xác thực đã được gửi đến email của bạn',
      data: {
        email: result.data.email,
        expires_in_minutes: result.data.expires_in_minutes,
        // CHỈ trả về reset_code trong môi trường development
        ...(process.env.NODE_ENV === 'development' && { 
          reset_code: result.data.reset_code 
        })
      }
    });

  } catch (error) {
    console.error('Error in password reset request:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo yêu cầu đổi mật khẩu'
    });
  }
});

/**
 * @swagger
 * /api/password-reset/verify:
 *   post:
 *     tags: [Đổi Mật Khẩu]
 *     summary: Xác thực mã đổi mật khẩu
 *     description: Kiểm tra mã xác thực có hợp lệ, chưa hết hạn và chưa sử dụng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyResetCodeRequest'
 *     responses:
 *       200:
 *         description: Mã xác thực hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     expiration_time:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Mã không hợp lệ/hết hạn/đã sử dụng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 reason:
 *                   type: string
 *                   enum: [expired, used, invalid]
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/verify', async (req, res) => {
  try {
    const { email, reset_code } = req.body;

    if (!email || !reset_code) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email và mã xác thực'
      });
    }

    // Kiểm tra mã xác thực
    const verification = await PasswordReset.verifyResetCode(email, reset_code);

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: verification.message,
        reason: verification.reason
      });
    }

    res.json({
      success: true,
      message: verification.message,
      data: {
        email: verification.data.email,
        expiration_time: verification.data.expiration_time
      }
    });

  } catch (error) {
    console.error('Error in verify reset code:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi xác thực mã'
    });
  }
});

/**
 * @swagger
 * /api/password-reset/reset:
 *   post:
 *     tags: [Đổi Mật Khẩu]
 *     summary: Đổi mật khẩu mới
 *     description: Cập nhật mật khẩu mới sau khi xác thực mã thành công
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     user_id:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/reset', async (req, res) => {
  try {
    const { email, reset_code, new_password } = req.body;

    if (!email || !reset_code || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: email, reset_code, new_password'
      });
    }

    // Validate password strength
    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Đổi mật khẩu
    const result = await PasswordReset.resetPassword(email, reset_code, hashedPassword);

    res.json({
      success: true,
      message: result.message,
      data: {
        email: result.data.email,
        user_id: result.data.user_id
      }
    });

  } catch (error) {
    console.error('Error in reset password:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi đổi mật khẩu'
    });
  }
});

/**
 * @swagger
 * /api/password-reset/history/{email}:
 *   get:
 *     tags: [Đổi Mật Khẩu]
 *     summary: Lấy lịch sử yêu cầu đổi mật khẩu (Admin)
 *     description: Xem lịch sử các lần yêu cầu đổi mật khẩu của một email
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email cần xem lịch sử
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số bản ghi tối đa
 *     responses:
 *       200:
 *         description: Lấy lịch sử thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PasswordResetHistory'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/history/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    const history = await PasswordReset.getResetHistory(email, limit);

    res.json({
      success: true,
      message: 'Lấy lịch sử thành công',
      data: history
    });

  } catch (error) {
    console.error('Error getting reset history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy lịch sử'
    });
  }
});

/**
 * @swagger
 * /api/password-reset/cleanup:
 *   post:
 *     tags: [Đổi Mật Khẩu]
 *     summary: Xóa các mã hết hạn (Admin)
 *     description: Dọn dẹp các mã xác thực đã hết hạn
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               older_than_hours:
 *                 type: integer
 *                 default: 24
 *                 description: Xóa mã cũ hơn X giờ
 *     responses:
 *       200:
 *         description: Dọn dẹp thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     deleted_count:
 *                       type: integer
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/cleanup', async (req, res) => {
  try {
    const olderThanHours = req.body.older_than_hours || 24;

    const result = await PasswordReset.cleanupExpiredCodes(olderThanHours);

    res.json({
      success: true,
      message: result.message,
      data: {
        deleted_count: result.deleted_count
      }
    });

  } catch (error) {
    console.error('Error in cleanup:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi dọn dẹp'
    });
  }
});

/**
 * @swagger
 * /api/password-reset/check-rate-limit/{email}:
 *   get:
 *     tags: [Đổi Mật Khẩu]
 *     summary: Kiểm tra rate limit cho email
 *     description: Kiểm tra xem email có bị giới hạn số lần yêu cầu không
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email cần kiểm tra
 *       - in: query
 *         name: minutes
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Khoảng thời gian kiểm tra (phút)
 *       - in: query
 *         name: max_requests
 *         schema:
 *           type: integer
 *           default: 3
 *         description: Số yêu cầu tối đa
 *     responses:
 *       200:
 *         description: Kiểm tra thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/RateLimitStatus'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/check-rate-limit/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const minutes = req.query.minutes ? parseInt(req.query.minutes) : 5;
    const maxRequests = req.query.max_requests ? parseInt(req.query.max_requests) : 3;

    const result = await PasswordReset.checkRateLimit(email, minutes, maxRequests);

    res.json({
      success: true,
      message: 'Kiểm tra rate limit thành công',
      data: result
    });

  } catch (error) {
    console.error('Error checking rate limit:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi kiểm tra rate limit'
    });
  }
});

module.exports = router;

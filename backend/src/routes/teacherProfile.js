const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const TeacherProfileController = require('../controllers/TeacherProfileController');

/**
 * @swagger
 * /api/teacher-profile/info:
 *   get:
 *     tags: [Teacher Profile]
 *     summary: Lấy thông tin chi tiết giảng viên
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin giảng viên thành công
 */
router.get('/info', authenticateToken, requireRole(['giang-vien']), TeacherProfileController.getInfo);

/**
 * @swagger
 * /api/teacher-profile/dashboard:
 *   get:
 *     tags: [Teacher Profile]
 *     summary: Lấy thống kê dashboard cho giảng viên
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê dashboard thành công
 */
router.get('/dashboard', authenticateToken, requireRole(['giang-vien']), TeacherProfileController.getDashboardStats);

module.exports = router;
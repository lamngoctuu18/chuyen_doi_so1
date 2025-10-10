const express = require('express');
const router = express.Router();
const InternshipReportsController = require('../controllers/InternshipReportsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/internship-reports/students:
 *   get:
 *     summary: Lấy danh sách báo cáo thực tập sinh viên
 *     tags: [Internship Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: class
 *         schema:
 *           type: string
 *         description: Tên lớp cần lọc
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, da-hoan-thanh, chua-hoan-thanh]
 *         description: Trạng thái báo cáo
 *     responses:
 *       200:
 *         description: Danh sách sinh viên và báo cáo
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/students', authenticateToken, requireRole(['admin']), InternshipReportsController.getStudentReports);

/**
 * @swagger
 * /api/internship-reports/class-stats:
 *   get:
 *     summary: Lấy thống kê báo cáo theo lớp
 *     tags: [Internship Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê theo từng lớp
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/class-stats', authenticateToken, requireRole(['admin']), InternshipReportsController.getClassStats);

/**
 * @swagger
 * /api/internship-reports/overview-stats:
 *   get:
 *     summary: Lấy thống kê tổng quan
 *     tags: [Internship Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê tổng quan toàn bộ
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/overview-stats', authenticateToken, requireRole(['admin']), InternshipReportsController.getOverviewStats);

/**
 * @swagger
 * /api/internship-reports/classes:
 *   get:
 *     summary: Lấy danh sách lớp
 *     tags: [Internship Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách tên lớp
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/classes', authenticateToken, requireRole(['admin']), InternshipReportsController.getClasses);

module.exports = router;

const express = require('express');
const router = express.Router();
const AutoAssignmentController = require('../controllers/AutoAssignmentController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   POST /api/auto-assignment
 * @desc    Phân công tự động Giảng viên và Doanh nghiệp cho sinh viên
 * @access  Private (Admin recommended)
 */
router.post('/', authenticateToken, AutoAssignmentController.autoAssign);

module.exports = router;

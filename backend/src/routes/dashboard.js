const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/DashboardController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * @route   GET /api/dashboard/stats
 * @desc    Lấy thống kê dashboard
 * @access  Private (Admin)
 */
router.get('/stats', 
  authenticateToken,
  requireAdmin,
  DashboardController.getStats
);

/**
 * @route   GET /api/dashboard/stats-public
 * @desc    Lấy thống kê dashboard (public cho testing)
 * @access  Public
 */
router.get('/stats-public', 
  DashboardController.getStats
);

module.exports = router;
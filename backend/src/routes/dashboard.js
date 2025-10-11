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

/**
 * @route   GET /api/dashboard/overview
 * @desc    Lấy thống kê tổng quan cho admin
 * @access  Private (Admin)
 */
router.get('/overview', 
  authenticateToken,
  requireAdmin,
  DashboardController.getOverview
);

/**
 * @route   GET /api/dashboard/overview-public
 * @desc    Lấy thống kê tổng quan (public cho testing)
 * @access  Public
 */
router.get('/overview-public', 
  DashboardController.getOverview
);

/**
 * @route   GET /api/dashboard/summary
 * @desc    Lấy tóm tắt hệ thống
 * @access  Private (Admin)
 */
router.get('/summary', 
  authenticateToken,
  requireAdmin,
  DashboardController.getSummary
);

/**
 * @route   GET /api/dashboard/summary-public
 * @desc    Lấy tóm tắt hệ thống (public cho testing)
 * @access  Public
 */
router.get('/summary-public', 
  DashboardController.getSummary
);

module.exports = router;
const express = require('express');
const router = express.Router();
const TeacherCompanyEvaluationsController = require('../controllers/TeacherCompanyEvaluationsController');
const { authenticateToken } = require('../middleware/auth');

// Middleware to check teacher role
const teacherOnly = (req, res, next) => {
  if (req.user.role !== 'giang-vien') {
    return res.status(403).json({
      success: false,
      message: 'Chỉ giảng viên mới có quyền truy cập'
    });
  }
  next();
};

// Apply authentication and teacher check to all routes
router.use(authenticateToken);
router.use(teacherOnly);

// Get company evaluations for teacher's students
router.get('/evaluations', TeacherCompanyEvaluationsController.getCompanyEvaluations);

// Get evaluation statistics
router.get('/stats', TeacherCompanyEvaluationsController.getEvaluationStats);

// Mark evaluation as reviewed
router.put('/students/:studentId/mark-reviewed', TeacherCompanyEvaluationsController.markAsReviewed);

module.exports = router;
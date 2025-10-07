const express = require('express');
const router = express.Router();
const CompaniesInternshipController = require('../controllers/CompaniesInternshipController');
const { authenticateToken } = require('../middleware/auth');

// Middleware to check company role
const companyOnly = (req, res, next) => {
  if (req.user.role !== 'doanh-nghiep') {
    return res.status(403).json({
      success: false,
      message: 'Chỉ doanh nghiệp mới có quyền truy cập'
    });
  }
  next();
};

// Apply authentication and company check to all routes
router.use(authenticateToken);
router.use(companyOnly);

// Get company's own information
router.get('/my-info', CompaniesInternshipController.getMyInfo);

// Get students assigned to this company
router.get('/my-interns', CompaniesInternshipController.getMyInterns);

// Update student evaluation
router.put('/students/:studentId/evaluation', CompaniesInternshipController.updateStudentEvaluation);

// Get internship statistics for company
router.get('/my-internship-stats', CompaniesInternshipController.getMyInternshipStats);

// Submit all evaluations to teachers
router.post('/submit-all-evaluations', CompaniesInternshipController.submitAllEvaluations);

module.exports = router;
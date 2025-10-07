const express = require('express');
const router = express.Router();
const StudentRegistrationController = require('../controllers/StudentRegistrationController');
const { authenticateToken } = require('../middleware/auth');

// Lấy danh sách đợt thực tập khả dụng
router.get('/batches', authenticateToken, StudentRegistrationController.getAvailableBatches);

// Lấy danh sách doanh nghiệp trong đợt
router.get('/batches/:id/companies', authenticateToken, StudentRegistrationController.getCompaniesInBatch);

// Đăng ký với doanh nghiệp
router.post('/', authenticateToken, StudentRegistrationController.registerWithCompany);

// Lấy danh sách đăng ký của sinh viên
router.get('/my-registrations', authenticateToken, StudentRegistrationController.getMyRegistrations);

// Đăng ký thực tập form mới
router.post('/internship-form', authenticateToken, StudentRegistrationController.submitInternshipForm);

module.exports = router;
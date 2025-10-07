const express = require('express');
const router = express.Router();
const CompanyRegistrationController = require('../controllers/CompanyRegistrationController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// POST /api/company-registrations - Đăng ký tham gia đợt thực tập
router.post('/', 
  authenticateToken,
  requireRole(['doanh-nghiep']),
  CompanyRegistrationController.registerForBatch
);

// GET /api/company-registrations - Lấy danh sách đăng ký của doanh nghiệp
router.get('/',
  authenticateToken,
  requireRole(['doanh-nghiep']),
  CompanyRegistrationController.getCompanyRegistrations
);

// PUT /api/company-registrations/:id - Cập nhật thông tin đăng ký
router.put('/:id',
  authenticateToken,
  requireRole(['doanh-nghiệp']),
  CompanyRegistrationController.updateRegistration
);

// DELETE /api/company-registrations/:id - Hủy đăng ký
router.delete('/:id',
  authenticateToken,
  requireRole(['doanh-nghiep']),
  CompanyRegistrationController.cancelRegistration
);

module.exports = router;
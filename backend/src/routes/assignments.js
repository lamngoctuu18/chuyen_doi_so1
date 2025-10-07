const express = require('express');
const AssignmentsController = require('../controllers/AssignmentsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/assignments - Lấy danh sách phân công thực tập
router.get('/', authenticateToken, AssignmentsController.getAllAssignments);

// POST /api/assignments - Tạo phân công thực tập mới (Admin)
router.post('/', authenticateToken, requireRole(['admin']), AssignmentsController.createAssignment);

// POST /api/assignments/register - Sinh viên đăng ký thực tập
router.post('/register', authenticateToken, requireRole(['sinh-vien']), AssignmentsController.registerInternship);

// PUT /api/assignments/:id - Cập nhật phân công thực tập
router.put('/:id', authenticateToken, AssignmentsController.updateAssignment);

// DELETE /api/assignments/:id - Xóa phân công thực tập (Admin)
router.delete('/:id', authenticateToken, requireRole(['admin']), AssignmentsController.deleteAssignment);

module.exports = router;
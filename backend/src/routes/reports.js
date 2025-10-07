const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/ReportController');

// === ROUTES CHO BÁO CÁO HÀNG TUẦN ===

/**
 * @route   GET /api/reports/weekly
 * @desc    Lấy danh sách báo cáo hàng tuần với phân trang và lọc
 * @query   page, limit, sinh_vien_id, assignment_id, trang_thai, tuan_from, tuan_to
 * @access  Private (Admin, Giảng viên, Sinh viên chỉ xem báo cáo của mình)
 */
router.get('/weekly', ReportController.getWeeklyReports);

/**
 * @route   GET /api/reports/weekly/:id
 * @desc    Lấy chi tiết báo cáo hàng tuần
 * @params  id
 * @access  Private (Admin, Giảng viên, Sinh viên chỉ xem báo cáo của mình)
 */
router.get('/weekly/:id', ReportController.getWeeklyReportById);

/**
 * @route   POST /api/reports/weekly
 * @desc    Tạo báo cáo hàng tuần mới
 * @body    sinh_vien_id, assignment_id, tuan, noi_dung, file_dinh_kem
 * @access  Private (Sinh viên)
 */
router.post('/weekly', ReportController.createWeeklyReport);

/**
 * @route   PUT /api/reports/weekly/:id
 * @desc    Cập nhật báo cáo hàng tuần
 * @params  id
 * @body    Các trường cần cập nhật
 * @access  Private (Sinh viên chỉ sửa báo cáo của mình, Giảng viên có thể chấm điểm)
 */
router.put('/weekly/:id', ReportController.updateWeeklyReport);

/**
 * @route   POST /api/reports/weekly/:id/grade
 * @desc    Chấm điểm báo cáo hàng tuần
 * @params  id
 * @body    nhan_xet_giang_vien, diem
 * @access  Private (Giảng viên)
 */
router.post('/weekly/:id/grade', ReportController.gradeWeeklyReport);

// === ROUTES CHO BÁO CÁO CUỐI KỲ ===

/**
 * @route   GET /api/reports/final
 * @desc    Lấy danh sách báo cáo cuối kỳ với phân trang và lọc
 * @query   page, limit, sinh_vien_id, assignment_id, trang_thai
 * @access  Private (Admin, Giảng viên, Doanh nghiệp, Sinh viên chỉ xem báo cáo của mình)
 */
router.get('/final', ReportController.getFinalReports);

/**
 * @route   GET /api/reports/final/:id
 * @desc    Lấy chi tiết báo cáo cuối kỳ
 * @params  id
 * @access  Private (Admin, Giảng viên, Doanh nghiệp, Sinh viên chỉ xem báo cáo của mình)
 */
router.get('/final/:id', ReportController.getFinalReportById);

/**
 * @route   POST /api/reports/final
 * @desc    Tạo báo cáo cuối kỳ mới
 * @body    sinh_vien_id, assignment_id, tieu_de, tom_tat, file_bao_cao
 * @access  Private (Sinh viên)
 */
router.post('/final', ReportController.createFinalReport);

/**
 * @route   PUT /api/reports/final/:id
 * @desc    Cập nhật báo cáo cuối kỳ
 * @params  id
 * @body    Các trường cần cập nhật
 * @access  Private (Sinh viên chỉ sửa báo cáo của mình trước khi nộp)
 */
router.put('/final/:id', ReportController.updateFinalReport);

/**
 * @route   POST /api/reports/final/:id/grade-teacher
 * @desc    Chấm điểm báo cáo cuối kỳ (bởi giảng viên)
 * @params  id
 * @body    nhan_xet_giang_vien, diem_giang_vien
 * @access  Private (Giảng viên)
 */
router.post('/final/:id/grade-teacher', ReportController.gradeFinalReportByTeacher);

/**
 * @route   POST /api/reports/final/:id/grade-company
 * @desc    Chấm điểm báo cáo cuối kỳ (bởi doanh nghiệp)
 * @params  id
 * @body    nhan_xet_doanh_nghiep, diem_doanh_nghiep
 * @access  Private (Doanh nghiệp)
 */
router.post('/final/:id/grade-company', ReportController.gradeFinalReportByCompany);

// === ROUTES THỐNG KÊ ===

/**
 * @route   GET /api/reports/statistics
 * @desc    Thống kê báo cáo (hàng tuần và cuối kỳ)
 * @access  Private (Admin, Giảng viên)
 */
router.get('/statistics', ReportController.getReportStatistics);

module.exports = router;
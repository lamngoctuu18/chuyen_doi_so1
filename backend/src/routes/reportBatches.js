const express = require('express');
const router = express.Router();
const ReportBatchController = require('../controllers/ReportBatchController');

/**
 * @swagger
 * components:
 *   schemas:
 *     ReportBatch:
 *       type: object
 *       required:
 *         - ten_dot
 *         - dot_thuc_tap_id
 *         - loai_bao_cao
 *         - han_nop
 *       properties:
 *         id:
 *           type: string
 *           description: ID của đợt báo cáo
 *         ten_dot:
 *           type: string
 *           description: Tên đợt báo cáo
 *         dot_thuc_tap_id:
 *           type: string
 *           description: ID đợt thực tập
 *         loai_bao_cao:
 *           type: string
 *           enum: [weekly, final]
 *           description: Loại báo cáo
 *         han_nop:
 *           type: string
 *           format: date-time
 *           description: Hạn nộp báo cáo
 *         mo_ta:
 *           type: string
 *           description: Mô tả đợt báo cáo
 *         trang_thai:
 *           type: string
 *           enum: [chua-mo, dang-mo, da-dong]
 *           description: Trạng thái đợt báo cáo
 *         tong_so_sinh_vien:
 *           type: integer
 *           description: Tổng số sinh viên trong đợt
 *         so_da_nop:
 *           type: integer
 *           description: Số sinh viên đã nộp báo cáo
 *         so_da_duyet:
 *           type: integer
 *           description: Số báo cáo đã được duyệt
 *         ngay_tao:
 *           type: string
 *           format: date-time
 *           description: Ngày tạo
 *         ngay_cap_nhat:
 *           type: string
 *           format: date-time
 *           description: Ngày cập nhật
 *     ReportBatchStats:
 *       type: object
 *       properties:
 *         totalBatches:
 *           type: integer
 *           description: Tổng số đợt báo cáo
 *         activeBatches:
 *           type: integer
 *           description: Số đợt đang hoạt động
 *         weeklyReports:
 *           type: integer
 *           description: Tổng số báo cáo tuần
 *         finalReports:
 *           type: integer
 *           description: Tổng số báo cáo cuối kỳ
 *         pendingReviews:
 *           type: integer
 *           description: Số báo cáo chờ duyệt
 *         approvedReports:
 *           type: integer
 *           description: Số báo cáo đã duyệt
 */

/**
 * @swagger
 * /api/report-batches:
 *   get:
 *     summary: Lấy danh sách đợt báo cáo
 *     tags: [Report Batches]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng bản ghi mỗi trang
 *       - in: query
 *         name: trang_thai
 *         schema:
 *           type: string
 *           enum: [chua-mo, dang-mo, da-dong]
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: loai_bao_cao
 *         schema:
 *           type: string
 *           enum: [weekly, final]
 *         description: Lọc theo loại báo cáo
 *       - in: query
 *         name: dot_thuc_tap_id
 *         schema:
 *           type: string
 *         description: Lọc theo đợt thực tập
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReportBatch'
 *                 pagination:
 *                   type: object
 *       500:
 *         description: Lỗi server
 */
router.get('/', ReportBatchController.getReportBatches);

/**
 * @swagger
 * /api/report-batches/stats:
 *   get:
 *     summary: Lấy thống kê đợt báo cáo
 *     tags: [Report Batches]
 *     responses:
 *       200:
 *         description: Lấy thống kê thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ReportBatchStats'
 *       500:
 *         description: Lỗi server
 */
router.get('/stats', ReportBatchController.getReportBatchStats);

/**
 * @swagger
 * /api/report-batches/{id}:
 *   get:
 *     summary: Lấy chi tiết đợt báo cáo
 *     tags: [Report Batches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đợt báo cáo
 *     responses:
 *       200:
 *         description: Lấy chi tiết thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ReportBatch'
 *       404:
 *         description: Không tìm thấy đợt báo cáo
 *       500:
 *         description: Lỗi server
 */
router.get('/:id', ReportBatchController.getReportBatchById);

/**
 * @swagger
 * /api/report-batches:
 *   post:
 *     summary: Tạo đợt báo cáo mới
 *     tags: [Report Batches]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ten_dot
 *               - dot_thuc_tap_id
 *               - loai_bao_cao
 *               - han_nop
 *             properties:
 *               ten_dot:
 *                 type: string
 *               dot_thuc_tap_id:
 *                 type: string
 *               loai_bao_cao:
 *                 type: string
 *                 enum: [weekly, final]
 *               han_nop:
 *                 type: string
 *                 format: date-time
 *               mo_ta:
 *                 type: string
 *               trang_thai:
 *                 type: string
 *                 enum: [chua-mo, dang-mo, da-dong]
 *                 default: chua-mo
 *     responses:
 *       201:
 *         description: Tạo đợt báo cáo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ReportBatch'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       409:
 *         description: Đợt báo cáo đã tồn tại
 *       500:
 *         description: Lỗi server
 */
router.post('/', ReportBatchController.createReportBatch);

/**
 * @swagger
 * /api/report-batches/{id}:
 *   put:
 *     summary: Cập nhật đợt báo cáo
 *     tags: [Report Batches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đợt báo cáo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ten_dot:
 *                 type: string
 *               han_nop:
 *                 type: string
 *                 format: date-time
 *               mo_ta:
 *                 type: string
 *               trang_thai:
 *                 type: string
 *                 enum: [chua-mo, dang-mo, da-dong]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ReportBatch'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy đợt báo cáo
 *       500:
 *         description: Lỗi server
 */
router.put('/:id', ReportBatchController.updateReportBatch);

/**
 * @swagger
 * /api/report-batches/{id}:
 *   delete:
 *     summary: Xóa đợt báo cáo
 *     tags: [Report Batches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đợt báo cáo
 *     responses:
 *       200:
 *         description: Xóa thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Không thể xóa đợt báo cáo này
 *       404:
 *         description: Không tìm thấy đợt báo cáo
 *       500:
 *         description: Lỗi server
 */
router.delete('/:id', ReportBatchController.deleteReportBatch);

/**
 * @swagger
 * /api/report-batches/{id}/export:
 *   get:
 *     summary: Xuất báo cáo Excel cho một đợt
 *     tags: [Report Batches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đợt báo cáo
 *     responses:
 *       200:
 *         description: File Excel
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Không tìm thấy đợt báo cáo
 *       500:
 *         description: Lỗi server
 */
router.get('/:id/export', ReportBatchController.exportReportBatch);

/**
 * @swagger
 * /api/report-batches/{id}/toggle-status:
 *   post:
 *     summary: Chuyển đổi trạng thái đợt báo cáo
 *     tags: [Report Batches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đợt báo cáo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trang_thai
 *             properties:
 *               trang_thai:
 *                 type: string
 *                 enum: [chua-mo, dang-mo, da-dong]
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ReportBatch'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy đợt báo cáo
 *       500:
 *         description: Lỗi server
 */
router.post('/:id/toggle-status', ReportBatchController.toggleBatchStatus);

module.exports = router;
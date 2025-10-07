const express = require('express');
const router = express.Router();
const { uploadExcel, handleUploadError, validateExcelFile } = require('../middleware/uploadExcel');
const SinhVienHuongDanController = require('../controllers/SinhVienHuongDanController');

/**
 * @route   POST /api/sinh-vien-huong-dan/import
 * @desc    Import danh sách sinh viên hướng dẫn từ Excel
 * @access  Private (Admin)
 */
router.post('/import', 
  uploadExcel,
  handleUploadError,
  validateExcelFile,
  SinhVienHuongDanController.importFromExcel
);

/**
 * @route   GET /api/sinh-vien-huong-dan/:maGiangVien
 * @desc    Lấy danh sách sinh viên hướng dẫn của một giảng viên
 * @access  Private
 */
router.get('/:maGiangVien', SinhVienHuongDanController.getByGiangVien);

/**
 * @route   POST /api/sinh-vien-huong-dan/update-counts
 * @desc    Cập nhật số lượng sinh viên hướng dẫn cho tất cả giảng viên
 * @access  Private (Admin)
 */
router.post('/update-counts', SinhVienHuongDanController.updateAllCounts);

module.exports = router;
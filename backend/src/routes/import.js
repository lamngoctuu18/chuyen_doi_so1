const express = require('express');
const router = express.Router();
const ImportController = require('../controllers/ImportController');
const { uploadExcel, handleUploadError, validateExcelFile } = require('../middleware/uploadExcel');

/**
 * @route   GET /api/import/guide
 * @desc    Hướng dẫn sử dụng import Excel
 * @access  Public
 */
router.get('/guide', ImportController.getImportGuide);

/**
 * @route   GET /api/import/template
 * @desc    Download template Excel cho import sinh viên
 * @access  Private (Admin)
 */
router.get('/template', ImportController.downloadTemplate);

/**
 * @route   POST /api/import/validate
 * @desc    Validate file Excel trước khi import
 * @body    excelFile (multipart/form-data)
 * @access  Private (Admin)
 */
router.post('/validate', 
  uploadExcel,
  handleUploadError,
  validateExcelFile,
  ImportController.validateExcel
);

/**
 * @route   POST /api/import/students
 * @desc    Import danh sách sinh viên từ file Excel
 * @body    excelFile (multipart/form-data), updateExisting (boolean), createUsers (boolean)
 * @access  Private (Admin)
 * @example
 * FormData:
 * - excelFile: File Excel (.xls/.xlsx)
 * - updateExisting: "true" hoặc "false" (mặc định false)
 * - createUsers: "true" hoặc "false" (mặc định true)
 */
router.post('/students',
  uploadExcel,
  handleUploadError,
  validateExcelFile,
  ImportController.importStudents
);

module.exports = router;
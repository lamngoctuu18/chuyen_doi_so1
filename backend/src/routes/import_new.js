const express = require('express');
const router = express.Router();
const ImportController = require('../controllers/ImportController_new');
const { uploadExcel, handleUploadError, validateExcelFile } = require('../middleware/uploadExcel');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /api/import/sinh-vien:
 *   post:
 *     tags: [Import/Export]
 *     summary: Import danh sách sinh viên từ file Excel
 *     description: |
 *       Upload và import danh sách sinh viên từ file Excel (.xlsx/.xls)
 *       
 *       **Cấu trúc file Excel yêu cầu:**
 *       - Sheet đầu tiên sẽ được đọc
 *       - Dòng đầu tiên là header
 *       - Các cột bắt buộc: Mã SV, Họ tên, Email, Lớp, Khoa
 *       - Các cột tùy chọn: Số điện thoại, Năm học, Vị trí thực tập, Đơn vị thực tập
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File Excel chứa danh sách sinh viên
 *               overwrite:
 *                 type: boolean
 *                 default: false
 *                 description: Có ghi đè dữ liệu sinh viên đã tồn tại không
 *               validateOnly:
 *                 type: boolean
 *                 default: false
 *                 description: Chỉ validate không import
 *     responses:
 *       200:
 *         description: Import thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Import thành công 25 sinh viên"
 *                 data:
 *                   type: object
 *                   properties:
 *                     imported:
 *                       type: integer
 *                       description: Số sinh viên đã import
 *                       example: 25
 *                     updated:
 *                       type: integer
 *                       description: Số sinh viên đã cập nhật
 *                       example: 5
 *                     errors:
 *                       type: array
 *                       description: Danh sách lỗi (nếu có)
 *                       items:
 *                         type: object
 *                         properties:
 *                           row:
 *                             type: integer
 *                           field:
 *                             type: string
 *                           message:
 *                             type: string
 *                     preview:
 *                       type: array
 *                       description: Preview 5 bản ghi đầu
 *                       items:
 *                         $ref: '#/components/schemas/SinhVien'
 *       400:
 *         description: File không hợp lệ hoặc lỗi validation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "File Excel không hợp lệ"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       413:
 *         description: File quá lớn (max 10MB)
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Chỉ admin mới có quyền import
 */
// Import tài khoản sinh viên (với validation đầy đủ)
router.post('/sinh-vien', 
  // authenticateToken,  // Tạm thời bỏ để test
  // requireAdmin,       // Tạm thời bỏ để test
  uploadExcel,
  handleUploadError,
  validateExcelFile,
  ImportController.importSinhVien
);

/**
 * @route   POST /api/import/sinh-vien-profile
 * @desc    Import profile sinh viên (không tạo tài khoản, chỉ cập nhật thông tin)
 * @access  Private (Admin/GiangVien)
 */
// Import profile sinh viên từ Quản lý Sinh viên (không validation)
router.post('/sinh-vien-profile', 
  // authenticateToken,  // Tạm thời bỏ để test
  // requireAdmin,       // Tạm thời bỏ để test
  uploadExcel,
  handleUploadError,
  validateExcelFile,
  ImportController.importSinhVienProfile
);

/**
 * @route   POST /api/import/giang-vien
 * @desc    Import danh sách giảng viên từ Excel
 * @body    excelFile (multipart/form-data)
 * @access  Private (Admin)
 */
router.post('/giang-vien', 
  authenticateToken,
  requireAdmin,
  uploadExcel,
  handleUploadError,
  validateExcelFile,
  ImportController.importGiangVien
);

/**
 * @route   POST /api/import/doanh-nghiep
 * @desc    Import danh sách doanh nghiệp từ Excel
 * @body    excelFile (multipart/form-data)
 * @access  Private (Admin)
 */
router.post('/doanh-nghiep', 
  authenticateToken,
  requireAdmin,
  uploadExcel,
  handleUploadError,
  validateExcelFile,
  ImportController.importDoanhNghiep
);

/**
 * @route   POST /api/import/admin
 * @desc    Import danh sách admin từ Excel
 * @body    excelFile (multipart/form-data)
 * @access  Private (Super Admin)
 */
router.post('/admin', 
  authenticateToken,
  requireAdmin,
  uploadExcel,
  handleUploadError,
  validateExcelFile,
  ImportController.importAdmin
);

/**
 * @route   POST /api/import/phan-cong
 * @desc    Import phân công thực tập từ Excel (ghép SV - GV - DN)
 * @body    excelFile (multipart/form-data)
 * @access  Private (Admin)
 */
router.post('/phan-cong',
  authenticateToken,
  requireAdmin,
  uploadExcel,
  handleUploadError,
  validateExcelFile,
  ImportController.importPhanCong
);

/**
 * @route   GET /api/import/templates/:type
 * @desc    Tải template Excel theo loại (sinh-vien, giang-vien, doanh-nghiep, admin)
 * @access  Private (Admin)
 */
router.get('/templates/:type', 
  // authenticateToken,  // Tạm thời bỏ để test
  // requireAdmin,       // Tạm thời bỏ để test
  ImportController.downloadTemplate
);

/**
 * @route   GET /api/import/stats
 * @desc    Lấy thống kê import
 * @access  Private (Admin)
 */
router.get('/stats', 
  authenticateToken,
  requireAdmin,
  ImportController.getImportStats
);

/**
 * @route   POST /api/import/thuc-tap-google-form
 * @desc    Import đăng ký thực tập từ Google Form Excel
 * @body    excelFile (multipart/form-data)
 * @access  Private (Admin)
 */
router.post('/thuc-tap-google-form', 
  authenticateToken,
  requireAdmin,
  uploadExcel,
  handleUploadError,
  validateExcelFile,
  ImportController.importThucTapGoogleForm
);

/**
 * @route   POST /api/import/preview/:type
 * @desc    Preview nội dung file Excel trước khi import
 * @body    file (multipart/form-data)
 * @access  Private (Admin)
 */
router.post('/preview/:type', 
  // authenticateToken,  // Tạm thời bỏ để test
  // requireAdmin,       // Tạm thời bỏ để test
  uploadExcel,
  handleUploadError,
  validateExcelFile,
  ImportController.previewFile
);

/**
 * @route   GET /api/import/export/sinh-vien
 * @desc    Xuất danh sách sinh viên ra Excel với bộ lọc
 * @access  Private (Admin)
 * @query   search - Tìm kiếm theo tên, mã SV
 * @query   status - Lọc theo trạng thái (da-phan-cong, chua-phan-cong, khoa_gioi_thieu, tu_lien_he)
 */
router.get('/export/sinh-vien', async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const SinhVien = require('../models/SinhVien');
    const { search = '', status = '' } = req.query;
    
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('SinhVien');
    ws.columns = [
      { header: 'Mã SV', key: 'ma_sinh_vien', width: 15 },
      { header: 'Họ tên', key: 'ho_ten', width: 25 },
      { header: 'Email cá nhân', key: 'email_ca_nhan', width: 28 },
      { header: 'Số ĐT', key: 'so_dien_thoai', width: 15 },
      { header: 'Lớp', key: 'lop', width: 12 },
      { header: 'Khoa', key: 'khoa', width: 18 },
      { header: 'Nguyện vọng TT', key: 'nguyen_vong_thuc_tap', width: 18 },
      { header: 'Vị trí mong muốn', key: 'vi_tri_muon_ung_tuyen_thuc_tap', width: 22 },
      { header: 'Đơn vị thực tập', key: 'don_vi_thuc_tap', width: 22 },
      { header: 'Giảng viên hướng dẫn', key: 'giang_vien_huong_dan', width: 24 },
      { header: 'Trạng thái', key: 'trang_thai_phan_cong', width: 20 },
    ];

    // Lấy tất cả dữ liệu với bộ lọc server-side
    const serverSideStatus = (status === 'khoa_gioi_thieu' || status === 'tu_lien_he') ? status : '';
    const { data } = await SinhVien.getAllWithPagination(1, 10000, search, serverSideStatus);
    
    // Helper function để kiểm tra sinh viên có đủ thông tin phân công không
    const hasCompleteInfo = (student) => {
      const viTri = student.vi_tri_muon_ung_tuyen_thuc_tap;
      const doanhNghiep = student.don_vi_thuc_tap;
      const giangVien = student.giang_vien_huong_dan;
      const nguyenVong = student.nguyen_vong_thuc_tap;
      
      return viTri && viTri.trim() !== '' &&
             doanhNghiep && doanhNghiep.trim() !== '' &&
             giangVien && giangVien.trim() !== '' &&
             nguyenVong && nguyenVong.trim() !== '';
    };

    // Apply client-side filtering for assignment status
    let filteredData = data;
    if (status === 'da-phan-cong') {
      filteredData = data.filter(student => hasCompleteInfo(student));
    } else if (status === 'chua-phan-cong') {
      filteredData = data.filter(student => !hasCompleteInfo(student));
    }

    // Helper function để format các giá trị đặc biệt
    const formatDisplayValue = (value) => {
      if (!value) return '';
      const strValue = value.toString().toLowerCase();
      switch (strValue) {
        case 'khoa_gioi_thieu':
          return 'Khoa giới thiệu';
        case 'tu_lien_he':
          return 'Tự liên hệ';
        case 'da-phan-cong':
          return 'Đã phân công';
        case 'chua-phan-cong':
          return 'Chưa phân công';
        default:
          return value;
      }
    };

    // Thêm dữ liệu vào worksheet
    for (const sv of filteredData) {
      const actualStatus = hasCompleteInfo(sv) ? 'Đã phân công' : 'Chưa phân công';
      
      ws.addRow({
        ma_sinh_vien: sv.ma_sinh_vien || '',
        ho_ten: sv.ho_ten || '',
        email_ca_nhan: sv.email_ca_nhan || '',
        so_dien_thoai: sv.so_dien_thoai || '',
        lop: sv.lop || '',
        khoa: sv.khoa || '',
        nguyen_vong_thuc_tap: formatDisplayValue(sv.nguyen_vong_thuc_tap || ''),
        vi_tri_muon_ung_tuyen_thuc_tap: formatDisplayValue(sv.vi_tri_muon_ung_tuyen_thuc_tap || ''),
        don_vi_thuc_tap: formatDisplayValue(sv.don_vi_thuc_tap || ''),
        giang_vien_huong_dan: formatDisplayValue(sv.giang_vien_huong_dan || ''),
        trang_thai_phan_cong: actualStatus
      });
    }

    // Tạo tên file có chứa thông tin bộ lọc
    let filename = 'sinh-vien';
    if (status === 'da-phan-cong') filename += '-da-phan-cong';
    else if (status === 'chua-phan-cong') filename += '-chua-phan-cong';
    else if (status === 'khoa_gioi_thieu') filename += '-khoa-gioi-thieu';
    else if (status === 'tu_lien_he') filename += '-tu-lien-he';
    if (search) filename += `-tim-kiem`;
    filename += '.xlsx';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export sinh viên lỗi:', err);
    res.status(500).json({ success: false, message: 'Lỗi xuất Excel sinh viên' });
  }
});

/**
 * @route   POST /api/import/export/sinh-vien-sorted
 * @desc    Xuất danh sách sinh viên ra Excel với sắp xếp từ client
 * @access  Private (Admin)
 * @body    students - Mảng sinh viên đã được sắp xếp từ client
 * @body    sortInfo - Thông tin về cách sắp xếp
 */
router.post('/export/sinh-vien-sorted', async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const { students = [], sortInfo = {} } = req.body;
    
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Không có dữ liệu sinh viên để xuất' 
      });
    }
    
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('SinhVien');
    
    // Định nghĩa cột trước khi thêm data
    const columns = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Mã SV', key: 'ma_sinh_vien', width: 15 },
      { header: 'Họ tên', key: 'ho_ten', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Số ĐT', key: 'so_dien_thoai', width: 15 },
      { header: 'Lớp', key: 'lop', width: 12 },
      { header: 'Ngày sinh', key: 'ngay_sinh', width: 12 },
      { header: 'Vị trí mong muốn', key: 'vi_tri_muon_ung_tuyen_thuc_tap', width: 25 },
      { header: 'Giảng viên hướng dẫn', key: 'giang_vien_huong_dan', width: 25 },
      { header: 'Nguyện vọng thực tập', key: 'nguyen_vong_thuc_tap', width: 25 },
      { header: 'Doanh nghiệp thực tập', key: 'don_vi_thuc_tap', width: 25 }
    ];
    
    ws.columns = columns;
    
    // Tạo tiêu đề với thông tin sắp xếp
    let titleInfo = '';
    if (sortInfo.teacherSort) {
      titleInfo = `Sắp xếp theo giảng viên (${sortInfo.teacherSort.includes('asc') ? 'A→Z' : 'Z→A'})`;
    } else if (sortInfo.companySort) {
      titleInfo = `Sắp xếp theo doanh nghiệp (${sortInfo.companySort.includes('asc') ? 'A→Z' : 'Z→A'})`;
    } else if (sortInfo.nameSort) {
      titleInfo = `Sắp xếp theo tên (${sortInfo.nameSort === 'asc' ? 'A→Z' : 'Z→A'})`;
    } else if (sortInfo.classSort) {
      titleInfo = `Sắp xếp theo lớp (${sortInfo.classSort === 'asc' ? '1→9' : '9→1'})`;
    }
    if (sortInfo.groupByPosition) {
      titleInfo += titleInfo ? ' - Gộp theo vị trí' : 'Gộp theo vị trí';
    }
    
    // Chèn tiêu đề nếu có thông tin sắp xếp
    if (titleInfo) {
      ws.insertRow(1, {});
      ws.mergeCells(1, 1, 1, columns.length);
      const titleCell = ws.getCell(1, 1);
      titleCell.value = `DANH SÁCH SINH VIÊN - ${titleInfo}`;
      titleCell.font = { bold: true, size: 14 };
      titleCell.alignment = { horizontal: 'center' };
      
      // Thêm dòng trống
      ws.insertRow(2, {});
    }
    
    // Format header row (sẽ là row 3 nếu có title, row 1 nếu không)
    const headerRowIndex = titleInfo ? 3 : 1;
    const headerRow = ws.getRow(headerRowIndex);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F3FF' }
    };
    
    // Add borders to header
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    // Helper function để format các giá trị đặc biệt
    const formatDisplayValue = (value) => {
      if (!value) return '';
      const strValue = value.toString().toLowerCase();
      switch (strValue) {
        case 'khoa_gioi_thieu':
          return 'Khoa giới thiệu';
        case 'tu_lien_he':
          return 'Tự liên hệ';
        case 'da-phan-cong':
          return 'Đã phân công';
        case 'chua-phan-cong':
          return 'Chưa phân công';
        default:
          return value;
      }
    };

    // Thêm dữ liệu sinh viên
    students.forEach((sv, index) => {
      const row = ws.addRow({
        stt: index + 1,
        ma_sinh_vien: sv.maSinhVien || sv.ma_sinh_vien || '',
        ho_ten: sv.hoTen || sv.ho_ten || '',
        email: sv.email || sv.email_ca_nhan || '',
        so_dien_thoai: sv.soDienThoai || sv.so_dien_thoai || '',
        lop: sv.lop || sv.class || sv.lop_hoc || '',
        ngay_sinh: sv.ngaySinh || sv.ngay_sinh ? 
          new Date(sv.ngaySinh || sv.ngay_sinh).toLocaleDateString('vi-VN') : '',
        vi_tri_muon_ung_tuyen_thuc_tap: formatDisplayValue(sv.viTriMongMuon || sv.vi_tri_muon_ung_tuyen_thuc_tap || ''),
        giang_vien_huong_dan: formatDisplayValue(sv.giangVienHuongDan || sv.giang_vien_huong_dan || ''),
        nguyen_vong_thuc_tap: formatDisplayValue(sv.nguyenVongThucTap || sv.nguyen_vong_thuc_tap || ''),
        don_vi_thuc_tap: formatDisplayValue(sv.donViThucTap || sv.don_vi_thuc_tap || sv.doanhNghiepThucTap || '')
      });
      
      // Add borders to data rows
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
    
    // Auto-fit columns (optional enhancement)
    ws.columns.forEach(column => {
      if (column.eachCell) {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(maxLength + 2, 50); // Max width 50
      }
    });
    
    // Tạo tên file
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '-');
    let filename = `sinh-vien-${timestamp}`;
    
    if (sortInfo.teacherSort) {
      filename += `-gv-${sortInfo.teacherSort.includes('asc') ? 'az' : 'za'}`;
    } else if (sortInfo.nameSort) {
      filename += `-ten-${sortInfo.nameSort === 'asc' ? 'az' : 'za'}`;
    } else if (sortInfo.classSort) {
      filename += `-lop-${sortInfo.classSort === 'asc' ? '19' : '91'}`;
    }
    
    if (sortInfo.groupByPosition) filename += '-theo-vi-tri';
    filename += '.xlsx';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    await wb.xlsx.write(res);
    res.end();
    
  } catch (err) {
    console.error('Export sinh viên sorted lỗi:', err);
    res.status(500).json({ success: false, message: 'Lỗi xuất Excel sinh viên đã sắp xếp' });
  }
});

/**
 * @route   GET /api/import/export/doanh-nghiep
 * @desc    Xuất danh sách doanh nghiệp ra Excel
 * @access  Private (Admin)
 */
router.get('/export/doanh-nghiep', async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const DoanhNghiep = require('../models/DoanhNghiep');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('DoanhNghiep');

    ws.columns = [
      { header: 'Mã DN', key: 'ma_doanh_nghiep', width: 15 },
      { header: 'Tên công ty', key: 'ten_cong_ty', width: 28 },
      { header: 'Người liên hệ', key: 'ten_nguoi_lien_he', width: 22 },
      { header: 'Chức vụ LH', key: 'chuc_vu_nguoi_lien_he', width: 18 },
      { header: 'Email', key: 'email_cong_ty', width: 28 },
      { header: 'Số ĐT', key: 'so_dien_thoai', width: 16 },
      { header: 'Địa chỉ', key: 'dia_chi_cong_ty', width: 30 },
      { header: 'Lĩnh vực', key: 'linh_vuc_hoat_dong', width: 22 },
      { header: 'Quy mô', key: 'quy_mo_nhan_su', width: 12 },
      { header: 'Website', key: 'website', width: 30 },
      { header: 'Mô tả', key: 'mo_ta_cong_ty', width: 40 }
    ];

    const { doanhNghieps } = await DoanhNghiep.getAll(1, 5000, {});
    for (const dn of doanhNghieps) {
      ws.addRow({
        ma_doanh_nghiep: dn.maDoanhNghiep || dn.ma_doanh_nghiep || '',
        ten_cong_ty: dn.tenCongTy || dn.ten_cong_ty || '',
        ten_nguoi_lien_he: dn.tenNguoiLienHe || dn.ten_nguoi_lien_he || '',
        chuc_vu_nguoi_lien_he: dn.chucVuNguoiLienHe || dn.chuc_vu_nguoi_lien_he || '',
        email_cong_ty: dn.emailCongTy || dn.email_cong_ty || '',
        so_dien_thoai: dn.soDienThoai || dn.so_dien_thoai || '',
        dia_chi_cong_ty: dn.diaChiCongTy || dn.dia_chi_cong_ty || '',
        linh_vuc_hoat_dong: dn.linhVucHoatDong || dn.linh_vuc_hoat_dong || '',
        quy_mo_nhan_su: dn.quyMoNhanSu || dn.quy_mo_nhan_su || '',
        website: dn.website || '',
        mo_ta_cong_ty: dn.moTaCongTy || dn.mo_ta_cong_ty || ''
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="doanh-nghiep.xlsx"');
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export doanh nghiệp lỗi:', err);
    res.status(500).json({ success: false, message: 'Lỗi xuất Excel doanh nghiệp' });
  }
});

/**
 * @route   GET /api/import/export/giang-vien
 * @desc    Xuất danh sách giảng viên ra Excel
 * @access  Private (Admin)
 */
router.get('/export/giang-vien', async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const GiangVien = require('../models/GiangVien');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('GiangVien');

    ws.columns = [
      { header: 'Mã GV', key: 'ma_giang_vien', width: 12 },
      { header: 'Họ tên', key: 'ho_ten', width: 24 },
      { header: 'Email', key: 'email_ca_nhan', width: 28 },
      { header: 'Số ĐT', key: 'so_dien_thoai', width: 16 },
      { header: 'Khoa', key: 'khoa', width: 18 },
      { header: 'Bộ môn', key: 'bo_mon', width: 18 },
      { header: 'Chức vụ', key: 'chuc_vu', width: 16 },
      { header: 'Học vị', key: 'hoc_vi', width: 14 }
    ];

    const { giangViens } = await GiangVien.getAll(1, 5000, {});
    for (const gv of giangViens) {
      ws.addRow({
        ma_giang_vien: gv.maGiangVien || gv.ma_giang_vien || '',
        ho_ten: gv.hoTen || gv.ho_ten || '',
        email_ca_nhan: gv.emailCaNhan || gv.email_ca_nhan || '',
        so_dien_thoai: gv.soDienThoai || gv.so_dien_thoai || '',
        khoa: gv.khoa || '',
        bo_mon: gv.boMon || gv.bo_mon || '',
        chuc_vu: gv.chucVu || gv.chuc_vu || '',
        hoc_vi: gv.hocVi || gv.hoc_vi || ''
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="giang-vien.xlsx"');
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export giang vien lỗi:', err);
    res.status(500).json({ success: false, message: 'Lỗi xuất Excel giảng viên' });
  }
});

module.exports = router;
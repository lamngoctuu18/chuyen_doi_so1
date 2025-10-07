// Script tạo template Excel cho các loại tài khoản
// File: create-templates.js

const ExcelJS = require('exceljs');
const path = require('path');

async function createTemplates() {
  try {
    console.log('🚀 Tạo template Excel...');

    // 1. Template Sinh viên
    console.log('📄 Tạo template sinh viên...');
    const sinhVienWorkbook = new ExcelJS.Workbook();
    const sinhVienSheet = sinhVienWorkbook.addWorksheet('Danh sách sinh viên');
    
    // Header cho sinh viên
    sinhVienSheet.addRow([
      'Mã sinh viên', 'Họ tên', 'Email', 'Mật khẩu', 'Lớp', 'Khoa', 'Ngành', 
      'Khóa học', 'Ngày sinh', 'Giới tính', 'Địa chỉ', 'Số điện thoại', 
      'Email cá nhân', 'GPA', 'Tình trạng học tập'
    ]);
    
    // Thêm dữ liệu mẫu
    sinhVienSheet.addRow([
      'SV001', 'Nguyễn Văn A', 'sv001@dainam.edu.vn', '123456', 'CNTT01', 
      'Công nghệ thông tin', 'Công nghệ thông tin', 'K18', '2000-01-15', 'Nam', 
      'Hà Nội', '0123456789', 'nguyenvana@gmail.com', '3.5', 'Đang học'
    ]);
    
    // Style header
    sinhVienSheet.getRow(1).font = { bold: true };
    sinhVienSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } };
    
    await sinhVienWorkbook.xlsx.writeFile(path.join(__dirname, 'src/templates/template-sinh-vien.xlsx'));

    // 2. Template Giảng viên
    console.log('📄 Tạo template giảng viên...');
    const giangVienWorkbook = new ExcelJS.Workbook();
    const giangVienSheet = giangVienWorkbook.addWorksheet('Danh sách giảng viên');
    
    // Header cho giảng viên
    giangVienSheet.addRow([
      'Mã giảng viên', 'Họ tên', 'Email', 'Mật khẩu', 'Khoa', 'Bộ môn', 
      'Chức vụ', 'Học vị', 'Chuyên môn', 'Số điện thoại', 'Email cá nhân', 
      'Địa chỉ', 'Kinh nghiệm làm việc', 'Bằng cấp'
    ]);
    
    // Thêm dữ liệu mẫu
    giangVienSheet.addRow([
      'GV001', 'TS. Trần Thị B', 'gv001@dainam.edu.vn', '123456', 
      'Công nghệ thông tin', 'Khoa học máy tính', 'Giảng viên', 'Tiến sĩ', 
      'Trí tuệ nhân tạo, Machine Learning', '0987654321', 'tranthib@gmail.com', 
      'Hà Nội', '5 năm giảng dạy', 'Tiến sĩ CNTT'
    ]);
    
    // Style header
    giangVienSheet.getRow(1).font = { bold: true };
    giangVienSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
    
    await giangVienWorkbook.xlsx.writeFile(path.join(__dirname, 'src/templates/template-giang-vien.xlsx'));

    // 3. Template Doanh nghiệp
    console.log('📄 Tạo template doanh nghiệp...');
    const doanhNghiepWorkbook = new ExcelJS.Workbook();
    const doanhNghiepSheet = doanhNghiepWorkbook.addWorksheet('Danh sách doanh nghiệp');
    
    // Header cho doanh nghiệp
    doanhNghiepSheet.addRow([
      'Mã doanh nghiệp', 'Tên công ty', 'Tên người liên hệ', 'Email', 'Mật khẩu',
      'Chức vụ người liên hệ', 'Địa chỉ công ty', 'Số điện thoại', 'Email công ty',
      'Website', 'Lĩnh vực hoạt động', 'Quy mô nhân sự', 'Mô tả công ty',
      'Yêu cầu thực tập', 'Số lượng nhận thực tập', 'Thời gian thực tập',
      'Địa chỉ thực tập', 'Trạng thái hợp tác'
    ]);
    
    // Thêm dữ liệu mẫu
    doanhNghiepSheet.addRow([
      'DN001', 'Công ty ABC', 'Lê Văn C', 'dn001@dainam.edu.vn', '123456',
      'Giám đốc nhân sự', '123 Nguyễn Trãi, Hà Nội', '0912345678', 'hr@abc.com',
      'https://abc.com', 'Phần mềm', '50-100', 'Công ty phát triển phần mềm',
      'Sinh viên CNTT năm 3, 4', '5', '3 tháng', '123 Nguyễn Trãi, Hà Nội', 'Đang hợp tác'
    ]);
    
    // Style header
    doanhNghiepSheet.getRow(1).font = { bold: true };
    doanhNghiepSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
    
    await doanhNghiepWorkbook.xlsx.writeFile(path.join(__dirname, 'src/templates/template-doanh-nghiep.xlsx'));

    // 4. Template Admin
    console.log('📄 Tạo template admin...');
    const adminWorkbook = new ExcelJS.Workbook();
    const adminSheet = adminWorkbook.addWorksheet('Danh sách admin');
    
    // Header cho admin
    adminSheet.addRow([
      'User ID', 'Họ tên', 'Email', 'Mật khẩu', 'Số điện thoại', 'Chức vụ'
    ]);
    
    // Thêm dữ liệu mẫu
    adminSheet.addRow([
      'admin002', 'Phạm Văn D', 'admin002@dainam.edu.vn', '123456', 
      '0901234567', 'Phó trưởng khoa'
    ]);
    
    // Style header
    adminSheet.getRow(1).font = { bold: true };
    adminSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFF0' } };
    
    await adminWorkbook.xlsx.writeFile(path.join(__dirname, 'src/templates/template-admin.xlsx'));

    console.log('✅ Tạo template thành công!');
    
  } catch (error) {
    console.error('❌ Lỗi tạo template:', error);
  }
}

// Chạy tạo templates
createTemplates();
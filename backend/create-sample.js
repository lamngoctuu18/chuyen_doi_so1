const ExcelJS = require('exceljs');
const path = require('path');

async function createSampleExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('SinhVien');
  
  // Thêm header
  worksheet.addRow(['Mã sinh viên', 'Họ tên', 'Email', 'Mật khẩu', 'Lớp', 'Khoa']);
  
  // Thêm dữ liệu mẫu
  worksheet.addRow(['SV001', 'Nguyễn Văn A', 'sva@example.com', '123456', 'CNTT01', 'Công nghệ thông tin']);
  worksheet.addRow(['SV002', 'Trần Thị B', 'ttb@example.com', '123456', 'CNTT01', 'Công nghệ thông tin']);
  worksheet.addRow(['SV003', 'Lê Văn C', 'lvc@example.com', '123456', 'CNTT02', 'Công nghệ thông tin']);
  
  // Lưu file
  const filePath = path.join(__dirname, 'uploads', 'sinh-vien-sample.xlsx');
  await workbook.xlsx.writeFile(filePath);
  console.log('Sample Excel file created:', filePath);
}

createSampleExcel().catch(console.error);
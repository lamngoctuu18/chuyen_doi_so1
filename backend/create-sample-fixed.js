const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function createSampleExcel() {
  try {
    // Tạo thư mục uploads nếu chưa có
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('SinhVien');
    
    // Thêm header
    worksheet.addRow(['Mã sinh viên', 'Họ tên', 'Email', 'Mật khẩu', 'Lớp', 'Khoa']);
    
    // Thêm dữ liệu mẫu
    worksheet.addRow(['SV001', 'Nguyễn Văn A', 'sva@example.com', '123456', 'CNTT01', 'Công nghệ thông tin']);
    worksheet.addRow(['SV002', 'Trần Thị B', 'ttb@example.com', '123456', 'CNTT01', 'Công nghệ thông tin']);
    worksheet.addRow(['SV003', 'Lê Văn C', 'lvc@example.com', '123456', 'CNTT02', 'Công nghệ thông tin']);
    
    // Lưu file
    const filePath = path.join(uploadsDir, 'sinh-vien-sample.xlsx');
    await workbook.xlsx.writeFile(filePath);
    console.log('Sample Excel file created at:', filePath);
    return filePath;
  } catch (error) {
    console.error('Error creating sample file:', error);
    throw error;
  }
}

createSampleExcel().then(filePath => {
  console.log('File created successfully:', filePath);
}).catch(console.error);
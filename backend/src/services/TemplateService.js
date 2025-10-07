// Service để tạo template Excel mới với 2 cột bổ sung
const ExcelJS = require('exceljs');
const path = require('path');

class TemplateService {
  static async createSinhVienTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sinh viên');
    
    // Headers đầy đủ bao gồm 2 cột mới
    const headers = [
      'Mã sinh viên',
      'Họ tên', 
      'Email',
      'Mật khẩu',
      'Lớp',
      'Khoa',
      'Ngành',
      'Khóa học',
      'Ngày sinh',
      'Giới tính',
      'Địa chỉ',
      'Số điện thoại',
      'Email cá nhân',
      'GPA',
      'Tình trạng học tập',
      'Vị trí muốn ứng tuyển thực tập',    // Cột mới 1
      'Đơn vị thực tập'                    // Cột mới 2
    ];
    
    worksheet.addRow(headers);
    
    // Style cho header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    
    // Auto width cho các cột
    headers.forEach((header, i) => {
      const col = worksheet.getColumn(i + 1);
      col.width = Math.max(header.length + 2, 15);
      
      // Highlight 2 cột mới
      if (i >= 15) { // 2 cột cuối
        col.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFEB9C' } // Màu vàng nhạt
        };
      }
    });
    
    // Border cho header
    headerRow.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    
    // Thêm data mẫu
    worksheet.addRow([
      'SV001', 'Nguyễn Văn A', 'sv001@student.edu.vn', 'SV001', 'CNTT01', 
      'Khoa CNTT', 'Công nghệ thông tin', '2021-2025', '2003-01-15', 'Nam',
      'Hà Nội', '0123456789', 'nguyenvana@gmail.com', '3.5', 'Đang học',
      'Lập trình viên (Developer)', 'Công ty ABC Tech'
    ]);
    
    worksheet.addRow([
      'SV002', 'Nguyễn Thị B', 'sv002@student.edu.vn', 'SV002', 'CNTT02', 
      'Khoa CNTT', 'Công nghệ thông tin', '2021-2025', '2003-05-20', 'Nữ',
      'Hồ Chí Minh', '0987654321', 'nguyenthib@gmail.com', '3.7', 'Đang học',
      'Thiết kế website', 'Công ty XYZ Design'
    ]);
    
    return workbook;
  }
  
  static async saveTemplate() {
    try {
      const workbook = await this.createSinhVienTemplate();
      const templatePath = path.join(__dirname, '..', 'templates', 'template-sinh-vien-updated.xlsx');
      await workbook.xlsx.writeFile(templatePath);
      console.log('✅ Template mới đã được lưu:', templatePath);
      return templatePath;
    } catch (error) {
      console.error('❌ Lỗi tạo template:', error);
      throw error;
    }
  }
}

module.exports = TemplateService;
const ExcelJS = require('exceljs');
const path = require('path');

async function createDoanhNghiepTemplate() {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('DoanhNghiep');

    // Tạo headers
    const headers = [
      'Mã doanh nghiệp',
      'Tên công ty', 
      'Tên người liên hệ',
      'Email',
      'Mật khẩu',
      'Chức vụ người liên hệ',
      'Địa chỉ công ty',
      'Số điện thoại',
      'Email công ty',
      'Website',
      'Lĩnh vực hoạt động',
      'Quy mô nhân sự',
      'Mô tả công ty',
      'Yêu cầu thực tập',
      'Số lượng nhận thực tập',
      'Thời gian thực tập',
      'Địa chỉ thực tập',
      'Trạng thái hợp tác'
    ];

    // Thêm headers vào worksheet
    worksheet.addRow(headers);

    // Thêm dữ liệu mẫu
    const sampleData = [
      [
        'DN001',
        'Công ty TNHH ABC',
        'Nguyễn Văn A',
        'nguyenvana@abc.com',
        'DN001',
        'Trưởng phòng',
        '123 Đường ABC, Hà Nội',
        '0987654321',
        'info@abc.com',
        'https://abc.com',
        'Công nghệ thông tin',
        '100-500 nhân viên',
        'Công ty chuyên về phát triển phần mềm',
        'Sinh viên năm 3, năm 4',
        5,
        '3 tháng',
        '123 Đường ABC, Hà Nội',
        'Đang hợp tác'
      ]
    ];

    sampleData.forEach(row => {
      worksheet.addRow(row);
    });

    // Style cho headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 20;
    });

    // Save file
    const filePath = path.join(__dirname, 'template-doanh-nghiep.xlsx');
    await workbook.xlsx.writeFile(filePath);
    
    console.log('✅ Template doanh nghiệp được tạo tại:', filePath);
    return filePath;

  } catch (error) {
    console.error('❌ Lỗi tạo template:', error.message);
    throw error;
  }
}

// Chạy script
createDoanhNghiepTemplate().catch(console.error);
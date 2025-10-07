// Controller: GiangVien (Teacher) 
// File: src/controllers/GiangVienController.js

const GiangVien = require('../models/GiangVien');
const ExcelJS = require('exceljs');

// Xuất Excel danh sách giảng viên với số lượng sinh viên hướng dẫn
const exportToExcel = async (req, res) => {
  try {
    console.log('📊 Xuất Excel danh sách giảng viên...');
    
    // Lấy tất cả giảng viên (không phân trang)
    const result = await GiangVien.getAll(1, 1000);
    const teachers = result.giangViens;
    
    // Tạo workbook mới
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách Giảng viên');
    
    // Thiết lập header
    worksheet.columns = [
      { header: 'STT', key: 'stt', width: 10 },
      { header: 'Mã GV', key: 'maGiangVien', width: 15 },
      { header: 'Họ tên', key: 'hoTen', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Số ĐT', key: 'soDienThoai', width: 15 },
      { header: 'Khoa', key: 'khoa', width: 20 },
      { header: 'Bộ môn', key: 'boMon', width: 25 },
      { header: 'Số SV hướng dẫn', key: 'soSinhVienHuongDan', width: 20 }
    ];
    
    // Style cho header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Thêm dữ liệu
    teachers.forEach((teacher, index) => {
      worksheet.addRow({
        stt: index + 1,
        maGiangVien: teacher.maGiangVien,
        hoTen: teacher.hoTen,
        email: teacher.email,
        soDienThoai: teacher.soDienThoai,
        khoa: teacher.khoa,
        boMon: teacher.boMon,
        soSinhVienHuongDan: teacher.soSinhVienHuongDan || teacher.so_sinh_vien_huong_dan || 0
      });
    });
    
    // Thiết lập response header
    const filename = `danh-sach-giang-vien-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Ghi workbook vào response
    await workbook.xlsx.write(res);
    res.end();
    
    console.log(`✅ Xuất Excel giảng viên thành công: ${teachers.length} giảng viên`);
  } catch (error) {
    console.error('❌ Lỗi xuất Excel giảng viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xuất file Excel'
    });
  }
};

module.exports = {
  exportToExcel
};
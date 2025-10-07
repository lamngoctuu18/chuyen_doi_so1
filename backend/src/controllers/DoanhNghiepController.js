// Controller: DoanhNghiep (Company)
// File: src/controllers/DoanhNghiepController.js

const DoanhNghiep = require('../models/DoanhNghiep');
const SinhVienHuongDan = require('../models/SinhVienHuongDan');
const ExcelJS = require('exceljs');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Lấy danh sách doanh nghiệp với số lượng sinh viên thực tập
const getAllDoanhNghiep = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filters = {
      linhVucHoatDong: req.query.linhVucHoatDong,
      trangThaiHopTac: req.query.trangThaiHopTac,
      quyMoNhanSu: req.query.quyMoNhanSu
    };

    // Loại bỏ các filter undefined
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );

    const result = await DoanhNghiep.getAll(page, limit, filters);
    
    res.json({
      success: true,
      data: result.doanhNghieps,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error getting doanh nghiep list:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách doanh nghiệp'
    });
  }
};

// Đồng bộ doanh nghiệp từ sinh viên hướng dẫn
const syncFromSinhVienHuongDan = async (req, res) => {
  try {
    console.log('🔄 API: Đồng bộ doanh nghiệp từ sinh viên hướng dẫn');
    const result = await DoanhNghiep.syncFromSinhVienHuongDan();
    
    res.json({
      success: true,
      message: result.message,
      data: { created: result.created }
    });
  } catch (error) {
    console.error('❌ Lỗi API đồng bộ doanh nghiệp:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đồng bộ doanh nghiệp từ sinh viên hướng dẫn'
    });
  }
};

// Xuất Excel danh sách doanh nghiệp với số lượng sinh viên
const exportToExcel = async (req, res) => {
  try {
    console.log('📊 Xuất Excel danh sách doanh nghiệp...');
    
    const { search, groupBy, sortBy, sortDir } = req.query;
    console.log('📋 Export filters:', { search, groupBy, sortBy, sortDir });
    
    // Lấy tất cả doanh nghiệp (không phân trang) với filters
    const filters = {};
    const result = await DoanhNghiep.getAll(1, 1000, filters);
    let companies = result.doanhNghieps;
    
    // Áp dụng search filter nếu có
    if (search) {
      const searchLower = search.toLowerCase();
      companies = companies.filter(company => {
        const name = (company.tenCongTy || '').toLowerCase();
        const contact = (company.tenNguoiLienHe || '').toLowerCase();
        const email = (company.emailCongTy || '').toLowerCase();
        const field = (company.linhVucHoatDong || '').toLowerCase();
        const address = (company.diaChiCongTy || '').toLowerCase();
        
        return name.includes(searchLower) || 
               contact.includes(searchLower) || 
               email.includes(searchLower) ||
               field.includes(searchLower) ||
               address.includes(searchLower);
      });
    }
    
    // Áp dụng sắp xếp
    if (groupBy === 'company' || sortBy) {
      const nameKey = (c) => (c.tenCongTy || '').toLowerCase();
      const sizeKey = (c) => {
        const size = c.quyMoNhanSu || '';
        const m = size.toString().match(/(\d+)/);
        return m ? parseInt(m[1], 10) : 0;
      };
      
      if (groupBy === 'company') {
        // Nhóm theo doanh nghiệp (sắp xếp theo tên)
        companies.sort((a, b) => nameKey(a).localeCompare(nameKey(b)));
      } else if (sortBy === 'name') {
        companies.sort((a, b) => sortDir === 'desc' ? 
          nameKey(b).localeCompare(nameKey(a)) : nameKey(a).localeCompare(nameKey(b)));
      } else if (sortBy === 'size') {
        companies.sort((a, b) => sortDir === 'desc' ? 
          sizeKey(b) - sizeKey(a) : sizeKey(a) - sizeKey(b));
      }
    }
    
    // Tạo workbook mới
    const workbook = new ExcelJS.Workbook();
    
    // Tạo tên worksheet phản ánh bộ lọc
    let worksheetName = 'Danh sách Doanh nghiệp';
    if (groupBy === 'company') {
      worksheetName += ' - Theo DN';
    }
    if (search) {
      worksheetName += ' - Tìm kiếm';
    }
    
    const worksheet = workbook.addWorksheet(worksheetName);
    
    // Thiết lập header
    worksheet.columns = [
      { header: 'STT', key: 'stt', width: 10 },
      { header: 'Mã DN', key: 'maDoanhNghiep', width: 15 },
      { header: 'Tên công ty', key: 'tenCongTy', width: 30 },
      { header: 'Người liên hệ', key: 'tenNguoiLienHe', width: 25 },
      { header: 'Email', key: 'emailCongTy', width: 30 },
      { header: 'Số ĐT', key: 'soDienThoai', width: 15 },
      { header: 'Địa chỉ', key: 'diaChiCongTy', width: 40 },
      { header: 'Lĩnh vực', key: 'linhVucHoatDong', width: 25 },
      { header: 'Số lượng SV thực tập', key: 'soSinhVienThucTap', width: 20 }
    ];
    
    // Style cho header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Thêm dữ liệu
    companies.forEach((company, index) => {
      worksheet.addRow({
        stt: index + 1,
        maDoanhNghiep: company.maDoanhNghiep,
        tenCongTy: company.tenCongTy,
        tenNguoiLienHe: company.tenNguoiLienHe,
        emailCongTy: company.emailCongTy,
        soDienThoai: company.soDienThoai,
        diaChiCongTy: company.diaChiCongTy,
        linhVucHoatDong: company.linhVucHoatDong,
        soSinhVienThucTap: company.soSinhVienThucTap || 0
      });
    });
    
    // Thiết lập response header
    const filename = `danh-sach-doanh-nghiep-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Ghi workbook vào response
    await workbook.xlsx.write(res);
    res.end();
    
    console.log(`✅ Xuất Excel thành công: ${companies.length} doanh nghiệp`);
  } catch (error) {
    console.error('❌ Lỗi xuất Excel doanh nghiệp:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xuất file Excel'
    });
  }
};

// Import Excel sinh viên thực tập để cập nhật số lượng sinh viên cho doanh nghiệp
const importFromExcel = async (req, res) => {
  try {
    console.log('📁 Đang xử lý file import doanh nghiệp từ sinh viên:', req.file?.originalname);
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy file upload'
      });
    }

    const filePath = req.file.path;
    console.log('📁 File path:', filePath);

    // Sử dụng logic import từ SinhVienHuongDanController nhưng chỉ tập trung vào doanh nghiệp
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error('Không tìm thấy worksheet trong file Excel');
    }

    console.log('📊 Worksheet loaded, total rows:', worksheet.actualRowCount);

    let headerRowIndex = -1;
    const headerMap = {};

    // Tìm header row tương tự như SinhVienHuongDanController
    worksheet.eachRow((row, rowNumber) => {
      const rawVals = row.values;
      let vals;
      
      if (rawVals.length > 0 && rawVals[0] === null) {
        vals = rawVals.slice(1).map(v => (v ? v.toString().trim() : ''));
      } else {
        vals = rawVals.map(v => (v ? v.toString().trim() : ''));
      }
      
      console.log(`🔍 Row ${rowNumber}: [${vals.join(', ')}]`);
      
      // Kiểm tra header row
      const hasSTT = vals.some(v => v && v.toLowerCase().trim() === 'stt');
      const hasMaSV = vals.some(v => v && (v.toLowerCase().includes('mã sv') || v.toLowerCase().includes('mã sinh viên')));
      const hasHoTen = vals.some(v => v && v.toLowerCase().includes('họ tên'));
      const hasDoanhNghiep = vals.some(v => v && v.toLowerCase().includes('doanh nghiệp'));
      
      const isHeaderRow = hasSTT && hasMaSV && hasHoTen && hasDoanhNghiep;
      
      if (headerRowIndex === -1 && isHeaderRow) {
        headerRowIndex = rowNumber;
        console.log(`✅ Found header row at ${rowNumber}`);
        
        vals.forEach((h, idx) => {
          if (!h) return;
          const hs = h.toLowerCase().trim();
          const actualIdx = rawVals[0] === null ? idx + 1 : idx;
          
          if (hs.includes('mã sv') || hs.includes('mã sinh viên')) {
            headerMap.maSinhVien = actualIdx;
          }
          if (hs.includes('họ tên') && !hs.includes('giảng viên')) {
            headerMap.hoTen = actualIdx;
          }
          if (hs.includes('doanh nghiệp')) {
            headerMap.doanhNghiep = actualIdx;
          }
        });
      }
    });

    if (headerRowIndex === -1 || !headerMap.doanhNghiep) {
      throw new Error('Không xác định được dòng tiêu đề hoặc cột Doanh nghiệp thực tập');
    }

    // Thu thập thông tin doanh nghiệp từ Excel
    const companyData = {};
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowIndex) return;
      
      const v = row.values;
      const get = (idx) => (idx && v[idx] ? v[idx].toString().trim() : '');
      
      const companyName = get(headerMap.doanhNghiep);
      const studentCode = get(headerMap.maSinhVien);
      const studentName = get(headerMap.hoTen);
      
      if (companyName && studentCode) {
        if (!companyData[companyName]) {
          companyData[companyName] = [];
        }
        companyData[companyName].push({
          maSinhVien: studentCode,
          hoTen: studentName
        });
      }
    });

    console.log(`📊 Tìm thấy ${Object.keys(companyData).length} doanh nghiệp với sinh viên thực tập`);

    // Đồng bộ doanh nghiệp thiếu trước
    await DoanhNghiep.syncFromSinhVienHuongDan();

    // Xóa file tạm
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: `Import thành công! Tìm thấy ${Object.keys(companyData).length} doanh nghiệp với sinh viên thực tập.`,
      data: {
        totalCompanies: Object.keys(companyData).length,
        totalStudents: Object.values(companyData).reduce((sum, students) => sum + students.length, 0),
        companies: Object.keys(companyData).map(name => ({
          name,
          studentCount: companyData[name].length
        }))
      }
    });

  } catch (error) {
    console.error('❌ Lỗi import Excel doanh nghiệp:', error);
    
    // Xóa file tạm nếu có lỗi
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi import file Excel: ' + error.message
    });
  }
};

module.exports = {
  getAllDoanhNghiep,
  syncFromSinhVienHuongDan,
  exportToExcel,
  importFromExcel
};
// Service: Excel Import với cấu trúc bảng mới
// File: src/services\ExcelImportService.js

const ExcelJS = require('exceljs');
const bcrypt = require('bcryptjs');
const Account = require('../models/Account');
const SinhVien = require('../models/SinhVien');
const GiangVien = require('../models/GiangVien');
const DoanhNghiep = require('../models/DoanhNghiep');
const Admin = require('../models/Admin');

class ExcelImportService {
  
  // Đọc và parse file Excel theo loại tài khoản
  static async parseExcelFile(filePath, accountType) {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // Cấu hình để đọc file Excel với encoding đúng
      const options = {
        ignoreEmpty: false,
        sheetStubs: false,
        bookSST: false
      };
      
      await workbook.xlsx.readFile(filePath, options);
      
      // Lấy worksheet đầu tiên
      const worksheet = workbook.worksheets[0];
      
      if (!worksheet) {
        throw new Error('File Excel không có worksheet nào hoặc file bị lỗi');
      }
      
      // Kiểm tra worksheet có dữ liệu không
      if (worksheet.rowCount === 0) {
        throw new Error('File Excel không có dữ liệu');
      }
      
      console.log(`📋 Đọc file Excel: ${worksheet.rowCount} hàng, ${worksheet.columnCount} cột`);
      
      // Debug: In ra header row
      const headerRow = worksheet.getRow(1);
      console.log('📝 Headers found:');
      headerRow.eachCell((cell, colNumber) => {
        console.log(`  ${colNumber}: "${cell.value}"`);
      });
      
      let results = [];
      const errors = [];
      
      // Parse dữ liệu theo loại tài khoản
      switch (accountType) {
        case 'sinh-vien':
          results = await this.parseSinhVienData(worksheet, errors);
          break;
        case 'sinh-vien-profile':
          results = await this.parseSinhVienProfileData(worksheet, errors);
          break;
        case 'giang-vien':
          results = await this.parseGiangVienData(worksheet, errors);
          break;
        case 'doanh-nghiep':
          results = await this.parseDoanhNghiepData(worksheet, errors);
          break;
        case 'admin':
          results = await this.parseAdminData(worksheet, errors);
          break;
        default:
          throw new Error('Loại tài khoản không hợp lệ');
      }
      
      return {
        success: true,
        data: results,
        errors: errors,
        totalRows: results.length,
        errorCount: errors.length
      };
      
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      throw new Error(`Lỗi đọc file Excel: ${error.message}`);
    }
  }

  // Parse dữ liệu sinh viên
  static async parseSinhVienData(worksheet, errors) {
    const sinhViens = [];
    
    // Đọc header để xác định cột
    const headerRow = worksheet.getRow(1);
    const headers = this.mapSinhVienHeaders(headerRow);
    
    // Kiểm tra các cột bắt buộc cho import tài khoản
    if (!headers.maSinhVien || !headers.hoTen || !headers.email) {
      throw new Error('File Excel thiếu các cột bắt buộc: Mã sinh viên, Họ tên, Email');
    }
    
    // Đọc dữ liệu từ hàng thứ 2 trở đi
    const rowCount = worksheet.rowCount;
    
    for (let rowNumber = 2; rowNumber <= rowCount; rowNumber++) {
      try {
        const row = worksheet.getRow(rowNumber);
        
        // Kiểm tra hàng rỗng
        if (this.isEmptyRow(row)) {
          continue;
        }
        
        const sinhVienData = {
          maSinhVien: this.getCellValue(row, headers.maSinhVien),
          hoTen: this.getCellValue(row, headers.hoTen),
          email: this.getCellValue(row, headers.email),
          password: this.getCellValue(row, headers.matKhau) || this.getCellValue(row, headers.maSinhVien), // Mặc định password = mã sinh viên
          lop: this.getCellValue(row, headers.lop),
          khoa: this.getCellValue(row, headers.khoa),
          nganh: this.getCellValue(row, headers.nganh),
          khoaHoc: this.getCellValue(row, headers.khoaHoc),
          ngaySinh: this.getCellValue(row, headers.ngaySinh),
          gioiTinh: this.getCellValue(row, headers.gioiTinh),
          diaChi: this.getCellValue(row, headers.diaChi),
          soDienThoai: this.getCellValue(row, headers.soDienThoai),
          emailCaNhan: this.getCellValue(row, headers.emailCaNhan),
          gpa: this.getCellValue(row, headers.gpa),
          tinhTrangHocTap: this.getCellValue(row, headers.tinhTrangHocTap) || 'Đang học',
          viTriMuonUngTuyenThucTap: this.getCellValue(row, headers.viTriMuonUngTuyen),
          donViThucTap: this.getCellValue(row, headers.donViThucTap),
          nguyenVongThucTap: this.getCellValue(row, headers.nguyenVongThucTap),
          giangVienHuongDan: this.getCellValue(row, headers.giangVienHuongDan)
        };
        
        // Debug log để kiểm tra các cột mới
        if (rowNumber === 2) { // Chỉ log row đầu tiên để tránh spam
          console.log('Debug - Headers found:', headers);
          console.log('Debug - New fields:', {
            viTriMuonUngTuyen: headers.viTriMuonUngTuyen,
            donViThucTap: headers.donViThucTap,
            nguyenVongThucTap: headers.nguyenVongThucTap,
            giangVienHuongDan: headers.giangVienHuongDan,
            data: {
              viTriMuonUngTuyenThucTap: sinhVienData.viTriMuonUngTuyenThucTap,
              donViThucTap: sinhVienData.donViThucTap,
              nguyenVongThucTap: sinhVienData.nguyenVongThucTap,
              giangVienHuongDan: sinhVienData.giangVienHuongDan
            }
          });
        }
        
        // Validate dữ liệu
        this.validateSinhVienData(sinhVienData, rowNumber);
        
        sinhViens.push(sinhVienData);
        
      } catch (error) {
        errors.push({
          row: rowNumber,
          error: error.message
        });
      }
    }
    
    return sinhViens;
  }

  // Parse dữ liệu sinh viên profile (không validation nghiêm ngặt)
  static async parseSinhVienProfileData(worksheet, errors) {
    const sinhViens = [];
    
    // Đọc header để xác định cột
    const headerRow = worksheet.getRow(1);
    const headers = this.mapSinhVienHeaders(headerRow);
    
    // Không kiểm tra cột bắt buộc - cho phép import linh hoạt
    
    // Đọc dữ liệu từ hàng thứ 2 trở đi
    const rowCount = worksheet.rowCount;
    
    for (let rowNumber = 2; rowNumber <= rowCount; rowNumber++) {
      try {
        const row = worksheet.getRow(rowNumber);
        
        // Kiểm tra hàng rỗng
        if (this.isEmptyRow(row)) {
          continue;
        }
        
        const sinhVienData = {
          maSinhVien: this.getCellValue(row, headers.maSinhVien),
          hoTen: this.getCellValue(row, headers.hoTen),
          email: this.getCellValue(row, headers.email),
          password: this.getCellValue(row, headers.matKhau) || this.getCellValue(row, headers.maSinhVien), // Mặc định password = mã sinh viên
          lop: this.getCellValue(row, headers.lop),
          khoa: this.getCellValue(row, headers.khoa),
          nganh: this.getCellValue(row, headers.nganh),
          khoaHoc: this.getCellValue(row, headers.khoaHoc),
          ngaySinh: this.getCellValue(row, headers.ngaySinh),
          gioiTinh: this.getCellValue(row, headers.gioiTinh),
          diaChi: this.getCellValue(row, headers.diaChi),
          soDienThoai: this.getCellValue(row, headers.soDienThoai),
          emailCaNhan: this.getCellValue(row, headers.emailCaNhan),
          gpa: this.getCellValue(row, headers.gpa),
          tinhTrangHocTap: this.getCellValue(row, headers.tinhTrangHocTap) || 'Đang học',
          viTriMuonUngTuyenThucTap: this.getCellValue(row, headers.viTriMuonUngTuyen),
          donViThucTap: this.getCellValue(row, headers.donViThucTap),
          nguyenVongThucTap: this.getCellValue(row, headers.nguyenVongThucTap),
          giangVienHuongDan: this.getCellValue(row, headers.giangVienHuongDan)
        };
        
        // Validate email format (nếu có email)
        this.validateSinhVienProfileData(sinhVienData, rowNumber);
        
        sinhViens.push(sinhVienData);
        
      } catch (error) {
        errors.push({
          row: rowNumber,
          error: error.message
        });
      }
    }
    
    return sinhViens;
  }

  // Parse dữ liệu giảng viên
  static async parseGiangVienData(worksheet, errors) {
    const giangViens = [];
    
    // Đọc header để xác định cột
    const headerRow = worksheet.getRow(1);
    const headers = this.mapGiangVienHeaders(headerRow);
    
    // Kiểm tra các cột bắt buộc
    if (!headers.maGiangVien || !headers.hoTen || !headers.email || !headers.khoa) {
      throw new Error('File Excel thiếu các cột bắt buộc: Mã giảng viên, Họ tên, Email, Khoa');
    }
    
    // Đọc dữ liệu từ hàng thứ 2 trở đi
    const rowCount = worksheet.rowCount;
    
    for (let rowNumber = 2; rowNumber <= rowCount; rowNumber++) {
      try {
        const row = worksheet.getRow(rowNumber);
        
        // Kiểm tra hàng rỗng
        if (this.isEmptyRow(row)) {
          continue;
        }
        
        const giangVienData = {
          maGiangVien: this.getCellValue(row, headers.maGiangVien),
          hoTen: this.getCellValue(row, headers.hoTen),
          email: this.getCellValue(row, headers.email),
          password: this.getCellValue(row, headers.matKhau) || this.getCellValue(row, headers.maGiangVien), // Mặc định password = mã giảng viên
          khoa: this.getCellValue(row, headers.khoa),
          boMon: this.getCellValue(row, headers.boMon),
          chucVu: this.getCellValue(row, headers.chucVu),
          hocVi: this.getCellValue(row, headers.hocVi),
          chuyenMon: this.getCellValue(row, headers.chuyenMon),
          soDienThoai: this.getCellValue(row, headers.soDienThoai),
          emailCaNhan: this.getCellValue(row, headers.emailCaNhan),
          diaChi: this.getCellValue(row, headers.diaChi),
          kinhNghiemLamViec: this.getCellValue(row, headers.kinhNghiemLamViec),
          bangCap: this.getCellValue(row, headers.bangCap)
        };
        
        // Validate dữ liệu
        this.validateGiangVienData(giangVienData, rowNumber);
        
        giangViens.push(giangVienData);
        
      } catch (error) {
        errors.push({
          row: rowNumber,
          error: error.message
        });
      }
    }
    
    return giangViens;
  }

  // Parse dữ liệu doanh nghiệp
  static async parseDoanhNghiepData(worksheet, errors) {
    const doanhNghieps = [];
    
    // Đọc header để xác định cột
    const headerRow = worksheet.getRow(1);
    const headers = this.mapDoanhNghiepHeaders(headerRow);
    
    // Kiểm tra các cột bắt buộc
    if (!headers.maDoanhNghiep || !headers.tenCongTy || !headers.tenNguoiLienHe || !headers.email || !headers.diaChiCongTy || !headers.soDienThoai) {
      throw new Error('File Excel thiếu các cột bắt buộc: Mã doanh nghiệp, Tên công ty, Tên người liên hệ, Email, Địa chỉ, Số điện thoại');
    }
    
    // Đọc dữ liệu từ hàng thứ 2 trở đi
    const rowCount = worksheet.rowCount;
    
    for (let rowNumber = 2; rowNumber <= rowCount; rowNumber++) {
      try {
        const row = worksheet.getRow(rowNumber);
        
        // Kiểm tra hàng rỗng
        if (this.isEmptyRow(row)) {
          continue;
        }
        
        const doanhNghiepData = {
          maDoanhNghiep: this.getCellValue(row, headers.maDoanhNghiep),
          tenCongTy: this.getCellValue(row, headers.tenCongTy),
          tenNguoiLienHe: this.getCellValue(row, headers.tenNguoiLienHe),
          email: this.getCellValue(row, headers.email),
          password: this.getCellValue(row, headers.matKhau) || this.getCellValue(row, headers.maDoanhNghiep), // Mặc định password = mã doanh nghiệp
          chucVuNguoiLienHe: this.getCellValue(row, headers.chucVuNguoiLienHe),
          diaChiCongTy: this.getCellValue(row, headers.diaChiCongTy),
          soDienThoai: this.getCellValue(row, headers.soDienThoai),
          emailCongTy: this.getCellValue(row, headers.emailCongTy),
          website: this.getCellValue(row, headers.website),
          linhVucHoatDong: this.getCellValue(row, headers.linhVucHoatDong),
          quyMoNhanSu: this.getCellValue(row, headers.quyMoNhanSu),
          moTaCongTy: this.getCellValue(row, headers.moTaCongTy),
          yeuCauThucTap: this.getCellValue(row, headers.yeuCauThucTap),
          soLuongNhanThucTap: parseInt(this.getCellValue(row, headers.soLuongNhanThucTap)) || 0,
          thoiGianThucTap: this.getCellValue(row, headers.thoiGianThucTap),
          diaChiThucTap: this.getCellValue(row, headers.diaChiThucTap),
          trangThaiHopTac: this.getCellValue(row, headers.trangThaiHopTac) || 'Đang hợp tác'
        };
        
        // Validate dữ liệu
        this.validateDoanhNghiepData(doanhNghiepData, rowNumber);
        
        doanhNghieps.push(doanhNghiepData);
        
      } catch (error) {
        errors.push({
          row: rowNumber,
          error: error.message
        });
      }
    }
    
    return doanhNghieps;
  }

  // Parse dữ liệu admin
  static async parseAdminData(worksheet, errors) {
    const admins = [];
    
    // Đọc header để xác định cột
    const headerRow = worksheet.getRow(1);
    const headers = this.mapAdminHeaders(headerRow);
    
    // Kiểm tra các cột bắt buộc
    if (!headers.userId || !headers.fullName || !headers.email) {
      throw new Error('File Excel thiếu các cột bắt buộc: User ID, Họ tên, Email');
    }
    
    // Đọc dữ liệu từ hàng thứ 2 trở đi
    const rowCount = worksheet.rowCount;
    
    for (let rowNumber = 2; rowNumber <= rowCount; rowNumber++) {
      try {
        const row = worksheet.getRow(rowNumber);
        
        // Kiểm tra hàng rỗng
        if (this.isEmptyRow(row)) {
          continue;
        }
        
        const adminData = {
          userId: this.getCellValue(row, headers.userId),
          fullName: this.getCellValue(row, headers.fullName),
          email: this.getCellValue(row, headers.email),
          password: this.getCellValue(row, headers.matKhau) || this.getCellValue(row, headers.userId), // Mặc định password = user ID
          phone: this.getCellValue(row, headers.phone),
          position: this.getCellValue(row, headers.position)
        };
        
        // Validate dữ liệu
        this.validateAdminData(adminData, rowNumber);
        
        admins.push(adminData);
        
      } catch (error) {
        errors.push({
          row: rowNumber,
          error: error.message
        });
      }
    }
    
    return admins;
  }

  // Import dữ liệu vào database
  static async importToDatabase(accountType, data, options = {}) {
    try {
      console.log('ImportToDatabase called with:', { accountType, dataCount: data.length });
      console.log('First data item:', data[0]);
      
      const results = {
        accountsCreated: 0,
        accountsUpdated: 0,
        profilesCreated: 0,
        profilesUpdated: 0,
        errors: []
      };

  const fillEmptyOnly = options.fillEmptyOnly === true; // only fill empty fields for profiles

  for (const item of data) {
        // Khai báo userId ngoài try block để có thể dùng trong catch
        let accountId;
        let userId;
        
        try {
          console.log('Processing item:', item);
          
          switch (accountType) {
            case 'sinh-vien':
              userId = item.maSinhVien;
              break;
            case 'giang-vien':
              userId = item.maGiangVien;
              break;
            case 'doanh-nghiep':
              userId = item.maDoanhNghiep;
              break;
            case 'admin':
              userId = item.userId;
              break;
          }
          
          console.log('UserID extracted:', userId);
          
          // Đối với sinh viên, cho phép import mà không cần mã sinh viên (chỉ cập nhật profile)
          if (!userId && accountType !== 'sinh-vien') {
            throw new Error(`Không tìm thấy mã định danh cho ${accountType}. Dữ liệu: ${JSON.stringify(item)}`);
          }
          
          // Nếu là sinh viên và không có mã sinh viên, bỏ qua việc tạo/cập nhật account
          if (accountType === 'sinh-vien' && !userId) {
            console.log('Bỏ qua sinh viên không có mã sinh viên');
            continue;
          }
          
          // Kiểm tra account đã tồn tại
          const existingAccount = await Account.findByUserId(userId);
          
          if (existingAccount) {
            // Cập nhật password nếu có
            if (item.password) {
              await Account.updatePassword(userId, item.password);
            }
            accountId = existingAccount.id;
            results.accountsUpdated++;
          } else {
            // Tạo account mới
            const accountResult = await Account.create({
              userId: userId,
              email: item.email,
              password: item.password,
              role: accountType
            });
            accountId = accountResult.insertId;
            results.accountsCreated++;
          }
          
          // Tạo hoặc cập nhật profile theo loại
          await this.createOrUpdateProfile(accountType, accountId, item, results, { fillEmptyOnly });
          
        } catch (error) {
          results.errors.push({
            userId: userId,
            error: error.message
          });
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('Error importing to database:', error);
      throw error;
    }
  }

  // Import chỉ profile (không tạo tài khoản)
  static async importProfileOnly(accountType, data, options = {}) {
    try {
      console.log('ImportProfileOnly called with:', { accountType, dataCount: data.length });
      
      const results = {
        profilesUpdated: 0,
        profilesSkipped: 0,
        errors: []
      };

      const fillEmptyOnly = options.fillEmptyOnly === true;

      for (const item of data) {
        try {
          console.log('Processing profile item:', item);
          
          // Chỉ xử lý sinh viên có mã sinh viên
          if (accountType === 'sinh-vien' && item.maSinhVien) {
            // Tìm sinh viên theo mã sinh viên
            const existingSV = await SinhVien.findByMaSinhVien(item.maSinhVien);
            if (existingSV) {
              if (fillEmptyOnly) {
                await SinhVien.fillEmptyColumnsByMaSinhVien(item.maSinhVien, item);
              } else {
                await SinhVien.updateByMaSinhVien(item.maSinhVien, item);
              }
              results.profilesUpdated++;
            } else {
              console.log(`Sinh viên ${item.maSinhVien} không tồn tại, bỏ qua`);
              results.profilesSkipped++;
            }
          } else {
            console.log('Bỏ qua dòng không có mã sinh viên');
            results.profilesSkipped++;
          }
          
        } catch (error) {
          results.errors.push({
            maSinhVien: item.maSinhVien || 'N/A',
            error: error.message
          });
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('Error importing profile only:', error);
      throw error;
    }
  }

  // Tạo hoặc cập nhật profile theo loại tài khoản
  static async createOrUpdateProfile(accountType, accountId, data, results, options = {}) {
    switch (accountType) {
      case 'sinh-vien':
        // Ưu tiên tìm theo mã SV để tránh tạo trùng, vì có thể account_id mới
        const existingByCode = await SinhVien.findByMaSinhVien(data.maSinhVien);
        const existingSV = existingByCode || (await SinhVien.findByAccountId(accountId));
        if (existingSV) {
          if (options.fillEmptyOnly) {
            await SinhVien.fillEmptyColumnsByMaSinhVien(data.maSinhVien, data);
          } else {
            await SinhVien.updateByMaSinhVien(data.maSinhVien, data);
          }
          results.profilesUpdated++;
        } else {
          await SinhVien.create({ ...data, accountId });
          results.profilesCreated++;
        }
        break;
        
      case 'giang-vien':
        console.log('🔍 Processing giang-vien for accountId:', accountId, 'data:', JSON.stringify(data, null, 2));
        const existingGV = await GiangVien.findByAccountId(accountId);
        console.log('🔍 Existing GV result:', JSON.stringify(existingGV, null, 2));
        if (existingGV && existingGV.success) {
          console.log('🔄 Updating existing GV with maGiangVien:', data.maGiangVien);
          const updateResult = await GiangVien.updateByMaGiangVien(data.maGiangVien, data);
          console.log('✅ Update result:', JSON.stringify(updateResult, null, 2));
          results.profilesUpdated++;
        } else {
          console.log('➕ Creating new GV with data:', JSON.stringify({ ...data, accountId }, null, 2));
          const createResult = await GiangVien.create({ ...data, accountId });
          console.log('✅ Create result:', JSON.stringify(createResult, null, 2));
          results.profilesCreated++;
        }
        break;
        
      case 'doanh-nghiep':
        const existingDN = await DoanhNghiep.findByAccountId(accountId);
        if (existingDN) {
          await DoanhNghiep.updateByMaDoanhNghiep(data.maDoanhNghiep, data);
          results.profilesUpdated++;
        } else {
          await DoanhNghiep.create({ ...data, accountId });
          results.profilesCreated++;
        }
        break;
        
      case 'admin':
        const existingAdmin = await Admin.findByAccountId(accountId);
        if (existingAdmin) {
          await Admin.update(accountId, data);
          results.profilesUpdated++;
        } else {
          await Admin.create({ ...data, accountId });
          results.profilesCreated++;
        }
        break;
    }
  }

  /* HELPER METHODS */
  
  // Map headers cho sinh viên
  static mapSinhVienHeaders(headerRow) {
    const headers = {};
    
    headerRow.eachCell((cell, colNumber) => {
      const cellValue = cell.value ? cell.value.toString().toLowerCase().trim() : '';
      
      if (cellValue.includes('mã') && (cellValue.includes('sinh viên') || cellValue.includes('sv'))) {
        headers.maSinhVien = colNumber;
      } else if (cellValue.includes('tên') || cellValue.includes('họ tên')) {
        headers.hoTen = colNumber;
      } else if (cellValue.includes('email') && !cellValue.includes('cá nhân')) {
        headers.email = colNumber;
      } else if (cellValue.includes('email') && cellValue.includes('cá nhân')) {
        headers.emailCaNhan = colNumber;
      } else if (cellValue.includes('mật khẩu') || cellValue.includes('password')) {
        headers.matKhau = colNumber;
      } else if (cellValue.includes('lớp') || cellValue.includes('class')) {
        headers.lop = colNumber;
      } else if (cellValue.includes('khoa') && !cellValue.includes('khóa')) {
        headers.khoa = colNumber;
      } else if (cellValue.includes('ngành')) {
        headers.nganh = colNumber;
      } else if (cellValue.includes('khóa') && cellValue.includes('học')) {
        headers.khoaHoc = colNumber;
      } else if (cellValue.includes('ngày sinh') || cellValue.includes('sinh nhật')) {
        headers.ngaySinh = colNumber;
      } else if (cellValue.includes('giới tính') || cellValue.includes('gender')) {
        headers.gioiTinh = colNumber;
      } else if (cellValue.includes('địa chỉ') || cellValue.includes('address')) {
        headers.diaChi = colNumber;
      } else if (cellValue.includes('điện thoại') || cellValue.includes('phone') || cellValue.includes('sdt')) {
        headers.soDienThoai = colNumber;
      } else if (cellValue.includes('gpa') || cellValue.includes('điểm')) {
        headers.gpa = colNumber;
      } else if (cellValue.includes('tình trạng') || cellValue.includes('trạng thái')) {
        headers.tinhTrangHocTap = colNumber;
      } else if (cellValue.includes('vị trí') && (cellValue.includes('ứng tuyển') || cellValue.includes('muốn') || cellValue.includes('thực tập'))) {
        headers.viTriMuonUngTuyen = colNumber;
        console.log('🔍 Found vị trí column at:', colNumber, 'with value:', cellValue);
      } else if (cellValue.includes('đơn vị') && cellValue.includes('thực tập')) {
        headers.donViThucTap = colNumber;
        console.log('🔍 Found đơn vị column at:', colNumber, 'with value:', cellValue);
      } else if (cellValue.includes('nguyện vọng') && cellValue.includes('tt')) {
        headers.nguyenVongThucTap = colNumber;
        console.log('🔍 Found nguyện vọng column at:', colNumber, 'with value:', cellValue);
      } else if (cellValue.includes('giảng viên') && cellValue.includes('hướng dẫn')) {
        headers.giangVienHuongDan = colNumber;
        console.log('🔍 Found giảng viên column at:', colNumber, 'with value:', cellValue);
      }
    });
    
    return headers;
  }

  // Map headers cho giảng viên
  static mapGiangVienHeaders(headerRow) {
    const headers = {};
    
    headerRow.eachCell((cell, colNumber) => {
      const cellValue = cell.value ? cell.value.toString().toLowerCase().trim() : '';
      
      if (cellValue.includes('mã') && cellValue.includes('giảng viên')) {
        headers.maGiangVien = colNumber;
      } else if (cellValue.includes('tên') || cellValue.includes('họ tên')) {
        headers.hoTen = colNumber;
      } else if (cellValue.includes('email') && !cellValue.includes('cá nhân')) {
        headers.email = colNumber;
      } else if (cellValue.includes('email') && cellValue.includes('cá nhân')) {
        headers.emailCaNhan = colNumber;
      } else if (cellValue.includes('mật khẩu') || cellValue.includes('password')) {
        headers.matKhau = colNumber;
      } else if (cellValue.includes('khoa') && !cellValue.includes('khóa')) {
        headers.khoa = colNumber;
      } else if (cellValue.includes('bộ môn') || cellValue.includes('bo mon')) {
        headers.boMon = colNumber;
      } else if (cellValue.includes('chức vụ') || cellValue.includes('position')) {
        headers.chucVu = colNumber;
      } else if (cellValue.includes('học vị') || cellValue.includes('degree')) {
        headers.hocVi = colNumber;
      } else if (cellValue.includes('chuyên môn') || cellValue.includes('specialty')) {
        headers.chuyenMon = colNumber;
      } else if (cellValue.includes('điện thoại') || cellValue.includes('phone') || cellValue.includes('sdt')) {
        headers.soDienThoai = colNumber;
      } else if (cellValue.includes('địa chỉ') || cellValue.includes('address')) {
        headers.diaChi = colNumber;
      } else if (cellValue.includes('kinh nghiệm') || cellValue.includes('experience')) {
        headers.kinhNghiemLamViec = colNumber;
      } else if (cellValue.includes('bằng cấp') || cellValue.includes('certificate')) {
        headers.bangCap = colNumber;
      }
    });
    
    return headers;
  }

  // Map headers cho doanh nghiệp
  static mapDoanhNghiepHeaders(headerRow) {
    const headers = {};
    
    console.log('🔍 Mapping doanh nghiep headers...');
    
    headerRow.eachCell((cell, colNumber) => {
      const rawValue = this.getCellValue(headerRow, colNumber);
      if (!rawValue) return;
      
      // Normalize và lowercase để so sánh
      const cellValue = rawValue.toLowerCase()
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
      
      console.log(`  Column ${colNumber}: "${rawValue}" -> "${cellValue}"`);
      
      // Mapping với nhiều pattern khác nhau - ưu tiên exact match trước
      if (this.matchesAny(cellValue, ['mã doanh nghiệp', 'ma doanh nghiep', 'mã dn', 'ma dn', 'company code'])) {
        headers.maDoanhNghiep = colNumber;
        console.log(`    ✅ Mapped to maDoanhNghiep`);
      } else if (cellValue === 'tên công ty' || cellValue === 'ten cong ty') {
        headers.tenCongTy = colNumber;
        console.log(`    ✅ Mapped to tenCongTy`);
      } else if (cellValue === 'tên người liên hệ' || cellValue === 'ten nguoi lien he') {
        headers.tenNguoiLienHe = colNumber;
        console.log(`    ✅ Mapped to tenNguoiLienHe`);
      } else if (cellValue === 'email' && !cellValue.includes('công ty') && !cellValue.includes('cong ty')) {
        headers.email = colNumber;
        console.log(`    ✅ Mapped to email`);
      } else if (cellValue === 'email công ty' || cellValue === 'email cong ty') {
        headers.emailCongTy = colNumber;
        console.log(`    ✅ Mapped to emailCongTy`);
      } else if (this.matchesAny(cellValue, ['mật khẩu', 'mat khau', 'password', 'pass'])) {
        headers.matKhau = colNumber;
        console.log(`    ✅ Mapped to matKhau`);
      } else if (cellValue === 'chức vụ người liên hệ' || cellValue === 'chuc vu nguoi lien he') {
        headers.chucVuNguoiLienHe = colNumber;
        console.log(`    ✅ Mapped to chucVuNguoiLienHe`);
      } else if (cellValue === 'địa chỉ công ty' || cellValue === 'dia chi cong ty') {
        headers.diaChiCongTy = colNumber;
        console.log(`    ✅ Mapped to diaChiCongTy`);
      } else if (this.matchesAny(cellValue, ['số điện thoại', 'so dien thoai', 'điện thoại', 'dien thoai', 'phone', 'sdt', 'tel'])) {
        headers.soDienThoai = colNumber;
        console.log(`    ✅ Mapped to soDienThoai`);
      } else if (this.matchesAny(cellValue, ['website', 'web site', 'web', 'url'])) {
        headers.website = colNumber;
        console.log(`    ✅ Mapped to website`);
      } else if (this.matchesAny(cellValue, ['lĩnh vực hoạt động', 'linh vuc hoat dong', 'lĩnh vực', 'linh vuc', 'field', 'business field'])) {
        headers.linhVucHoatDong = colNumber;
        console.log(`    ✅ Mapped to linhVucHoatDong`);
      } else if (this.matchesAny(cellValue, ['quy mô nhân sự', 'quy mo nhan su', 'quy mô', 'quy mo', 'nhân sự', 'nhan su', 'size', 'staff size'])) {
        headers.quyMoNhanSu = colNumber;
        console.log(`    ✅ Mapped to quyMoNhanSu`);
      } else if (cellValue === 'mô tả công ty' || cellValue === 'mo ta cong ty') {
        headers.moTaCongTy = colNumber;
        console.log(`    ✅ Mapped to moTaCongTy`);
      } else if (this.matchesAny(cellValue, ['yêu cầu thực tập', 'yeu cau thuc tap', 'yêu cầu', 'yeu cau', 'requirements'])) {
        headers.yeuCauThucTap = colNumber;
        console.log(`    ✅ Mapped to yeuCauThucTap`);
      } else if (this.matchesAny(cellValue, ['số lượng nhận thực tập', 'so luong nhan thuc tap', 'số lượng', 'so luong', 'quantity'])) {
        headers.soLuongNhanThucTap = colNumber;
        console.log(`    ✅ Mapped to soLuongNhanThucTap`);
      } else if (this.matchesAny(cellValue, ['thời gian thực tập', 'thoi gian thuc tap', 'thời gian', 'thoi gian', 'duration'])) {
        headers.thoiGianThucTap = colNumber;
        console.log(`    ✅ Mapped to thoiGianThucTap`);
      } else if ((cellValue.includes('địa chỉ') || cellValue.includes('dia chi')) && (cellValue.includes('thực tập') || cellValue.includes('thuc tap'))) {
        headers.diaChiThucTap = colNumber;
        console.log(`    ✅ Mapped to diaChiThucTap`);
      } else if (this.matchesAny(cellValue, ['trạng thái hợp tác', 'trang thai hop tac', 'trạng thái', 'trang thai', 'status'])) {
        headers.trangThaiHopTac = colNumber;
        console.log(`    ✅ Mapped to trangThaiHopTac`);
      } else {
        console.log(`    ❌ No mapping found`);
      }
    });
    
    console.log('📋 Final header mapping:', headers);
    return headers;
  }

  // Helper method để check multiple patterns
  static matchesAny(text, patterns) {
    return patterns.some(pattern => text.includes(pattern));
  }

  // Map headers cho admin
  static mapAdminHeaders(headerRow) {
    const headers = {};
    
    headerRow.eachCell((cell, colNumber) => {
      const cellValue = cell.value ? cell.value.toString().toLowerCase().trim() : '';
      
      if (cellValue.includes('user') && cellValue.includes('id') || cellValue.includes('mã')) {
        headers.userId = colNumber;
      } else if (cellValue.includes('tên') || cellValue.includes('họ tên')) {
        headers.fullName = colNumber;
      } else if (cellValue.includes('email')) {
        headers.email = colNumber;
      } else if (cellValue.includes('mật khẩu') || cellValue.includes('password')) {
        headers.matKhau = colNumber;
      } else if (cellValue.includes('điện thoại') || cellValue.includes('phone') || cellValue.includes('sdt')) {
        headers.phone = colNumber;
      } else if (cellValue.includes('chức vụ') || cellValue.includes('position')) {
        headers.position = colNumber;
      }
    });
    
    return headers;
  }

  // Validate dữ liệu sinh viên
  static validateSinhVienData(data, rowNumber) {
    if (!data.maSinhVien) {
      throw new Error(`Hàng ${rowNumber}: Thiếu mã sinh viên`);
    }
    if (!data.hoTen) {
      throw new Error(`Hàng ${rowNumber}: Thiếu họ tên`);
    }
    if (!data.email) {
      throw new Error(`Hàng ${rowNumber}: Thiếu email`);
    }
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error(`Hàng ${rowNumber}: Email không hợp lệ`);
    }
  }

  // Validate dữ liệu sinh viên profile (không nghiêm ngặt)
  static validateSinhVienProfileData(data, rowNumber) {
    // Chỉ validate email format nếu có email
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error(`Hàng ${rowNumber}: Email không hợp lệ`);
    }
    // Không bắt buộc mã sinh viên, họ tên để cho phép import linh hoạt
  }

  // Validate dữ liệu giảng viên
  static validateGiangVienData(data, rowNumber) {
    if (!data.maGiangVien) {
      throw new Error(`Hàng ${rowNumber}: Thiếu mã giảng viên`);
    }
    if (!data.hoTen) {
      throw new Error(`Hàng ${rowNumber}: Thiếu họ tên`);
    }
    if (!data.email) {
      throw new Error(`Hàng ${rowNumber}: Thiếu email`);
    }
    if (!data.khoa) {
      throw new Error(`Hàng ${rowNumber}: Thiếu thông tin khoa`);
    }
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error(`Hàng ${rowNumber}: Email không hợp lệ`);
    }
  }

  // Validate dữ liệu doanh nghiệp
  static validateDoanhNghiepData(data, rowNumber) {
    if (!data.maDoanhNghiep) {
      throw new Error(`Hàng ${rowNumber}: Thiếu mã doanh nghiệp`);
    }
    if (!data.tenCongTy) {
      throw new Error(`Hàng ${rowNumber}: Thiếu tên công ty`);
    }
    if (!data.tenNguoiLienHe) {
      throw new Error(`Hàng ${rowNumber}: Thiếu tên người liên hệ`);
    }
    if (!data.email) {
      throw new Error(`Hàng ${rowNumber}: Thiếu email`);
    }
    if (!data.diaChiCongTy) {
      throw new Error(`Hàng ${rowNumber}: Thiếu địa chỉ công ty`);
    }
    if (!data.soDienThoai) {
      throw new Error(`Hàng ${rowNumber}: Thiếu số điện thoại`);
    }
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error(`Hàng ${rowNumber}: Email không hợp lệ`);
    }
  }

  // Validate dữ liệu admin
  static validateAdminData(data, rowNumber) {
    if (!data.userId) {
      throw new Error(`Hàng ${rowNumber}: Thiếu User ID`);
    }
    if (!data.fullName) {
      throw new Error(`Hàng ${rowNumber}: Thiếu họ tên`);
    }
    if (!data.email) {
      throw new Error(`Hàng ${rowNumber}: Thiếu email`);
    }
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error(`Hàng ${rowNumber}: Email không hợp lệ`);
    }
  }

  // Utility methods
  static getCellValue(row, columnNumber) {
    if (!columnNumber) return null;
    
    try {
      const cell = row.getCell(columnNumber);
      
      if (!cell.value) return null;
      
      // Xử lý các kiểu dữ liệu khác nhau
      let value = cell.value;
      
      // Nếu là object (có thể là date hoặc formula)
      if (typeof value === 'object') {
        if (value.result !== undefined) {
          // Formula result
          value = value.result;
        } else if (value instanceof Date) {
          // Date object
          value = value.toISOString().split('T')[0]; // Format YYYY-MM-DD
        } else {
          // Other objects, convert to string
          value = JSON.stringify(value);
        }
      }
      
      // Convert to string and clean up
      const stringValue = value.toString().trim();
      
      // Remove any non-printable characters and normalize Unicode
      return stringValue.replace(/[\x00-\x1F\x7F-\x9F]/g, '').normalize('NFC');
      
    } catch (error) {
      console.warn(`Warning: Could not read cell at column ${columnNumber}:`, error.message);
      return null;
    }
  }

  static isEmptyRow(row) {
    let isEmpty = true;
    
    try {
      row.eachCell((cell) => {
        const value = this.getCellValue(row, cell.col);
        if (value && value !== '') {
          isEmpty = false;
        }
      });
    } catch (error) {
      console.warn('Warning: Could not check if row is empty:', error.message);
      return false; // Assume not empty if can't check
    }
    
    return isEmpty;
  }

  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Parse file Excel từ Google Form
  static async parseGoogleFormFile(filePath) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('File Excel không có worksheet nào');
      }

      const result = {
        data: [],
        errors: [],
        totalRows: 0
      };

      // Mapping cột từ Google Form (dựa vào header row)
      const headerRow = worksheet.getRow(1);
      const columnMapping = this.createGoogleFormColumnMapping(headerRow);
      
      if (!columnMapping.isValid) {
        return {
          data: [],
          errors: ['File Excel không đúng định dạng từ Google Form'],
          totalRows: 0
        };
      }

      // Đọc dữ liệu từ row 2 trở đi
      let rowIndex = 2;
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        try {
          const rowData = this.parseGoogleFormRow(row, columnMapping, rowNumber);
          if (rowData) {
            result.data.push(rowData);
          }
          result.totalRows++;
        } catch (error) {
          result.errors.push(`Dòng ${rowNumber}: ${error.message}`);
          result.totalRows++;
        }
      });

      return result;
    } catch (error) {
      console.error('Error parsing Google Form file:', error);
      throw new Error(`Lỗi khi đọc file Google Form: ${error.message}`);
    }
  }

  // Tạo mapping cột từ header của Google Form
  static createGoogleFormColumnMapping(headerRow) {
    const headers = [];
    headerRow.eachCell((cell, colNumber) => {
      headers.push(cell.value ? cell.value.toString().toLowerCase() : '');
    });

    // Mapping các cột cần thiết
    const mapping = {
      timestamp: this.findColumnIndex(headers, ['timestamp', 'dấu thời gian']),
      maSinhVien: this.findColumnIndex(headers, ['mã sinh viên']),
      hoTen: this.findColumnIndex(headers, ['họ và tên', 'họ tên']),
      ngaySinh: this.findColumnIndex(headers, ['ngày sinh']),
      soDienThoai: this.findColumnIndex(headers, ['số điện thoại', 'điện thoại']),
      email: this.findColumnIndex(headers, ['email']),
      lop: this.findColumnIndex(headers, ['lớp theo học', 'lớp']),
      nguyenVong: this.findColumnIndex(headers, ['em lựa chọn nguyện vọng', 'nguyện vọng']),
      tenCongTy: this.findColumnIndex(headers, ['tên công ty', 'công ty']),
      diaChiCongTy: this.findColumnIndex(headers, ['địa chỉ công ty']),
      nguoiLienHe: this.findColumnIndex(headers, ['người liên hệ']),
      viTriMongMuon: this.findColumnIndex(headers, ['vị trí', 'ngành nghề mong muốn']),
      ghiChu: this.findColumnIndex(headers, ['ghi chú'])
    };

    // Kiểm tra các cột bắt buộc
    const requiredFields = ['maSinhVien', 'hoTen', 'email', 'nguyenVong', 'viTriMongMuon'];
    const missingFields = requiredFields.filter(field => mapping[field] === -1);

    return {
      ...mapping,
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  // Tìm index của cột dựa vào các từ khóa
  static findColumnIndex(headers, keywords) {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      for (const keyword of keywords) {
        if (header.includes(keyword.toLowerCase())) {
          return i + 1; // Excel columns are 1-based
        }
      }
    }
    return -1;
  }

  // Parse một row từ Google Form
  static parseGoogleFormRow(row, mapping, rowNumber) {
    const getValue = (colIndex) => {
      if (colIndex === -1) return null;
      const cell = row.getCell(colIndex);
      return cell.value ? cell.value.toString().trim() : null;
    };

    const maSinhVien = getValue(mapping.maSinhVien);
    if (!maSinhVien || !/^\d{10}$/.test(maSinhVien)) {
      throw new Error('Mã sinh viên không hợp lệ (phải là 10 chữ số)');
    }

    const hoTen = getValue(mapping.hoTen);
    if (!hoTen) {
      throw new Error('Họ tên không được để trống');
    }

    const email = getValue(mapping.email);
    if (!email || !this.isValidEmail(email)) {
      throw new Error('Email không hợp lệ');
    }

    const nguyenVong = getValue(mapping.nguyenVong);
    const nguyenVongValue = nguyenVong && nguyenVong.toLowerCase().includes('tự liên hệ') 
      ? 'tu-lien-he' 
      : 'khoa-gioi-thieu';

    // Parse ngày sinh
    let ngaySinh = null;
    const ngaySinhRaw = getValue(mapping.ngaySinh);
    if (ngaySinhRaw) {
      try {
        // Handle multiple date formats
        if (ngaySinhRaw instanceof Date) {
          ngaySinh = ngaySinhRaw.toISOString().split('T')[0];
        } else if (typeof ngaySinhRaw === 'string') {
          // Try DD/MM/YYYY format
          const dateParts = ngaySinhRaw.split('/');
          if (dateParts.length === 3) {
            const day = dateParts[0].padStart(2, '0');
            const month = dateParts[1].padStart(2, '0');
            const year = dateParts[2];
            ngaySinh = `${year}-${month}-${day}`;
          }
        }
      } catch (error) {
        console.warn(`Không thể parse ngày sinh: ${ngaySinhRaw}`);
      }
    }

    return {
      ma_sinh_vien: maSinhVien,
      ho_ten: hoTen,
      ngay_sinh: ngaySinh,
      so_dien_thoai: getValue(mapping.soDienThoai),
      email: email,
      lop: getValue(mapping.lop),
      nguyen_vong_thuc_tap: nguyenVongValue,
      ten_cong_ty: nguyenVongValue === 'tu-lien-he' ? getValue(mapping.tenCongTy) : null,
      dia_chi_cong_ty: nguyenVongValue === 'tu-lien-he' ? getValue(mapping.diaChiCongTy) : null,
      nguoi_lien_he: nguyenVongValue === 'tu-lien-he' ? getValue(mapping.nguoiLienHe) : null,
      vi_tri_mong_muon: getValue(mapping.viTriMongMuon),
      ghi_chu_thuc_tap: getValue(mapping.ghiChu),
      ngay_dang_ky_thuc_tap: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };
  }

  // Cập nhật thông tin thực tập cho sinh viên
  static async updateInternshipInfo(data, importerId) {
    const connection = require('../database/connection');
    
    const result = {
      successful: 0,
      failed: 0,
      errors: [],
      updated: [],
      notFound: []
    };

    for (const item of data) {
      try {
        // Tìm sinh viên theo mã sinh viên
        const findQuery = 'SELECT id FROM sinh_vien WHERE ma_sinh_vien = ?';
        
        await new Promise((resolve, reject) => {
          connection.query(findQuery, [item.ma_sinh_vien], (error, results) => {
            if (error) {
              reject(error);
              return;
            }

            if (results.length === 0) {
              result.notFound.push(item.ma_sinh_vien);
              result.failed++;
              resolve();
              return;
            }

            const sinhVienId = results[0].id;
            
            // Cập nhật thông tin thực tập
            const updateQuery = `
              UPDATE sinh_vien 
              SET nguyen_vong_thuc_tap = ?,
                  ten_cong_ty = ?,
                  dia_chi_cong_ty = ?,
                  nguoi_lien_he = ?,
                  vi_tri_mong_muon = ?,
                  ghi_chu_thuc_tap = ?,
                  ngay_dang_ky_thuc_tap = ?,
                  trang_thai_phan_cong = 'chua-phan-cong'
              WHERE id = ?
            `;

            const updateValues = [
              item.nguyen_vong_thuc_tap,
              item.ten_cong_ty,
              item.dia_chi_cong_ty,
              item.nguoi_lien_he,
              item.vi_tri_mong_muon,
              item.ghi_chu_thuc_tap,
              item.ngay_dang_ky_thuc_tap,
              sinhVienId
            ];

            connection.query(updateQuery, updateValues, (updateError, updateResults) => {
              if (updateError) {
                result.errors.push(`Lỗi cập nhật sinh viên ${item.ma_sinh_vien}: ${updateError.message}`);
                result.failed++;
              } else {
                result.updated.push(item.ma_sinh_vien);
                result.successful++;
              }
              resolve();
            });
          });
        });
      } catch (error) {
        result.errors.push(`Lỗi xử lý sinh viên ${item.ma_sinh_vien}: ${error.message}`);
        result.failed++;
      }
    }

    // Lưu lịch sử import
    try {
      const historyQuery = `
        INSERT INTO lich_su_import_thuc_tap 
        (ten_file, so_ban_ghi_thanh_cong, so_ban_ghi_loi, chi_tiet_loi, nguoi_import_id)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const historyValues = [
        'Google Form Import',
        result.successful,
        result.failed,
        JSON.stringify({
          errors: result.errors,
          notFound: result.notFound
        }),
        importerId
      ];

      await new Promise((resolve, reject) => {
        connection.query(historyQuery, historyValues, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    } catch (error) {
      console.warn('Không thể lưu lịch sử import:', error.message);
    }

    return result;
  }

  // Tự động phân loại sinh viên theo vị trí mong muốn
  static async autoClassifyStudents() {
    const connection = require('../database/connection');

    const result = {
      totalClassified: 0,
      classifications: {},
      errors: []
    };

    try {
      // Lấy danh sách sinh viên chưa phân công và có vị trí mong muốn
      const getStudentsQuery = `
        SELECT id, ma_sinh_vien, ho_ten, vi_tri_mong_muon
        FROM sinh_vien 
        WHERE trang_thai_phan_cong = 'chua-phan-cong' 
        AND vi_tri_mong_muon IS NOT NULL
        AND vi_tri_mong_muon != ''
      `;

      const students = await new Promise((resolve, reject) => {
        connection.query(getStudentsQuery, (error, results) => {
          if (error) reject(error);
          else resolve(results);
        });
      });

      // Phân loại theo vị trí
      for (const student of students) {
        const viTri = student.vi_tri_mong_muon;
        const nhomThucTap = this.generateGroupName(viTri);

        try {
          const updateQuery = `
            UPDATE sinh_vien 
            SET nhom_thuc_tap = ?, trang_thai_phan_cong = 'da-xep-nhom'
            WHERE id = ?
          `;

          await new Promise((resolve, reject) => {
            connection.query(updateQuery, [nhomThucTap, student.id], (error) => {
              if (error) reject(error);
              else resolve();
            });
          });

          // Thống kê
          if (!result.classifications[viTri]) {
            result.classifications[viTri] = [];
          }
          result.classifications[viTri].push({
            maSinhVien: student.ma_sinh_vien,
            hoTen: student.ho_ten,
            nhomThucTap: nhomThucTap
          });

          result.totalClassified++;
        } catch (error) {
          result.errors.push(`Lỗi phân loại sinh viên ${student.ma_sinh_vien}: ${error.message}`);
        }
      }

    } catch (error) {
      result.errors.push(`Lỗi tổng quát khi phân loại: ${error.message}`);
    }

    return result;
  }

  // Tạo tên nhóm thực tập dựa vào vị trí
  static generateGroupName(viTri) {
    const mapping = {
      'Lập trình viên (Developer)': 'DEV',
      'Thiết kế website': 'DESIGN',
      'Phân tích & thiết kế hệ thống': 'ANALYST',
      'Quản trị mạng': 'NETWORK',
      'Quản trị cơ sở dữ liệu': 'DATABASE',
      'Tester': 'QA',
      'Hỗ trợ kỹ thuật (IT Support)': 'SUPPORT',
      'AI & IoT': 'AI_IOT',
      'Khác': 'OTHER'
    };

    const prefix = mapping[viTri] || 'OTHER';
    const timestamp = new Date().getFullYear().toString().slice(-2);
    return `${prefix}_${timestamp}`;
  }
}

module.exports = ExcelImportService;
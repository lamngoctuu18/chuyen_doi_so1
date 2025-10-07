const ExcelJS = require('exceljs');
const SinhVienHuongDan = require('../models/SinhVienHuongDan');
const GiangVien = require('../models/GiangVien');
const { deleteFile } = require('../middleware/uploadExcel');
const db = require('../database/connection');

class SinhVienHuongDanController {

  /**
   * POST /api/sinh-vien-huong-dan/import
   * Import danh sách sinh viên hướng dẫn từ Excel
   */
  static async importFromExcel(req, res) {
    let filePath = null;
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Không có file Excel được upload'
        });
      }

      filePath = req.file.path;
      console.log('📁 Đang xử lý file sinh viên hướng dẫn:', req.file.originalname);
      console.log('📁 File path:', filePath);

      // Parse Excel file
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.getWorksheet(1);

      if (!worksheet) {
        throw new Error('Không tìm thấy worksheet trong file Excel');
      }

      console.log('📊 Worksheet loaded, total rows:', worksheet.actualRowCount);

      // Strategy: detect header row with likely labels, map indices, then build records per row
      const teacherCounts = {};
      const data = [];
      let headerRowIndex = -1;
      const headerMap = {};

      // find header row with detailed logging
      worksheet.eachRow((row, rowNumber) => {
        // Try different approaches to get row values
        const rawVals = row.values || [];
        let vals = [];
        
        // Handle different Excel structures
        if (rawVals.length > 0 && rawVals[0] === null) {
          // Case: first cell is null, skip it
          vals = rawVals.slice(1).map(v => (v ? v.toString().trim() : ''));
        } else {
          // Case: no leading null
          vals = rawVals.map(v => (v ? v.toString().trim() : ''));
        }
        
        const rowText = vals.join(' ').toLowerCase();
        
        console.log(`🔍 Row ${rowNumber}: [${vals.join(', ')}]`);
        console.log(`🔍 Row text: "${rowText}"`);
        
        // Check if this row contains header indicators - more specific detection
        const hasSTT = vals.some(v => v && v.toLowerCase().trim() === 'stt');
        const hasMaSV = vals.some(v => v && (v.toLowerCase().includes('mã sv') || v.toLowerCase().includes('mã sinh viên')));
        const hasHoTen = vals.some(v => v && v.toLowerCase().includes('họ tên'));
        const hasGiangVien = vals.some(v => v && v.toLowerCase().includes('giảng viên hướng dẫn'));
        
        const isHeaderRow = hasSTT && hasMaSV && hasHoTen && hasGiangVien;
        
        console.log(`🔍 Header check for row ${rowNumber}: STT=${hasSTT}, MaSV=${hasMaSV}, HoTen=${hasHoTen}, GiangVien=${hasGiangVien}, IsHeader=${isHeaderRow}`);
        
        if (headerRowIndex === -1 && isHeaderRow) {
          headerRowIndex = rowNumber;
          console.log(`✅ Found header row at ${rowNumber}`);
          
          vals.forEach((h, idx) => {
            if (!h) return;
            const hs = h.toLowerCase().trim();
            console.log(`🔍 Column ${idx}: "${h}" -> "${hs}"`);
            // Use idx directly since we already handled the offset above
            const actualIdx = rawVals[0] === null ? idx + 1 : idx;
            
            // student code
            if (hs.includes('mã sv') || hs.includes('mã sinh viên') || hs.includes('mssv') || hs.includes('msv')) {
              headerMap.maSinhVien = actualIdx;
              console.log(`  ✅ Mapped maSinhVien to column ${actualIdx}`);
            }
            // student name
            if ((hs.includes('họ tên') || hs.includes('họ và tên') || hs === 'họ tên') && !hs.includes('giảng viên')) {
              headerMap.hoTen = actualIdx;
              console.log(`  ✅ Mapped hoTen to column ${actualIdx}`);
            }
            // email phone class
            if (hs.includes('email') && !hs.includes('giảng viên')) {
              headerMap.email = actualIdx;
              console.log(`  ✅ Mapped email to column ${actualIdx}`);
            }
            if (hs.includes('số đt') || hs.includes('điện thoại') || hs.includes('sđt')) {
              headerMap.soDienThoai = actualIdx;
              console.log(`  ✅ Mapped soDienThoai to column ${actualIdx}`);
            }
            if (hs.includes('lớp')) {
              headerMap.lop = actualIdx;
              console.log(`  ✅ Mapped lop to column ${actualIdx}`);
            }
            if (hs.includes('ngày sinh') || hs.includes('dob')) {
              headerMap.ngaySinh = actualIdx;
              console.log(`  ✅ Mapped ngaySinh to column ${actualIdx}`);
            }
            // internship prefs
            if (hs.includes('vị trí') && (hs.includes('mong muốn') || hs.includes('thực tập'))) {
              headerMap.viTri = actualIdx;
              console.log(`  ✅ Mapped viTri to column ${actualIdx}`);
            }
            if (hs.includes('nguyện vọng')) {
              headerMap.nguyenVong = actualIdx;
              console.log(`  ✅ Mapped nguyenVong to column ${actualIdx}`);
            }
            if (hs.includes('doanh nghiệp') || (hs.includes('thực tập') && !hs.includes('vị trí'))) {
              headerMap.doanhNghiep = actualIdx;
              console.log(`  ✅ Mapped doanhNghiep to column ${actualIdx}`);
            }
            // teacher - more flexible matching
            if (hs.includes('giảng viên') && hs.includes('hướng dẫn')) {
              headerMap.giangVien = actualIdx;
              console.log(`  ✅ Mapped giangVien to column ${actualIdx}`);
            } else if (hs === 'giảng viên hướng dẫn') {
              headerMap.giangVien = actualIdx;
              console.log(`  ✅ Mapped giangVien (exact match) to column ${actualIdx}`);
            } else if (/(^|\b)gvhd(\b|$)/.test(hs) || hs === 'gv' || hs.startsWith('gv ')) {
              headerMap.giangVien = actualIdx;
              console.log(`  ✅ Mapped giangVien (code match) to column ${actualIdx}`);
            }
          });
          
          console.log('📋 Final header mapping:', headerMap);
        }
      });

      if (headerRowIndex === -1 || !headerMap.giangVien) {
        throw new Error('Không xác định được dòng tiêu đề hoặc cột Giảng viên hướng dẫn');
      }

      // First pass: collect all teacher names to look up their codes
      const teacherNames = new Set();
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber <= headerRowIndex) return;
        const v = row.values;
        const get = (idx) => (idx && v[idx] ? v[idx].toString().trim() : '');
        const teacherCell = get(headerMap.giangVien);
        if (teacherCell) {
          teacherNames.add(teacherCell);
        }
      });

      // Look up teacher codes from database based on names
      const teacherLookup = {};
      const missingTeachers = [];
      
      if (teacherNames.size > 0) {
        console.log('🔍 Looking up teacher codes for names:', Array.from(teacherNames));
        
        for (const teacherName of teacherNames) {
          try {
            // Try to find teacher by exact name match or partial match
            const searchQuery = `
              SELECT ma_giang_vien, ho_ten FROM giang_vien 
              WHERE ho_ten LIKE ? OR ho_ten = ?
              LIMIT 1
            `;
            const results = await db.query(searchQuery, [`%${teacherName}%`, teacherName]);
            
            if (results && results.length > 0) {
              teacherLookup[teacherName] = results[0].ma_giang_vien;
              console.log(`✅ Found: "${teacherName}" -> ${results[0].ma_giang_vien} (${results[0].ho_ten})`);
            } else {
              // Fallback: try to extract number from name and create GV code
              const m = teacherName.match(/(\d+)$/);
              if (m) {
                const generatedCode = `GV${m[1].padStart(3, '0')}`;
                teacherLookup[teacherName] = generatedCode;
                
                // Add to missing teachers list for creation
                missingTeachers.push({
                  ma_giang_vien: generatedCode,
                  ho_ten: teacherName,
                  email: `${generatedCode.toLowerCase()}@university.edu.vn`,
                  so_dien_thoai: '',
                  khoa: 'CNTT',
                  bo_mon: 'Công nghệ thông tin'
                });
                
                console.log(`⚠️ Not found in DB, will create: "${teacherName}" -> ${generatedCode}`);
              } else {
                console.log(`❌ Cannot resolve teacher: "${teacherName}"`);
                teacherLookup[teacherName] = null;
              }
            }
          } catch (error) {
            console.error(`❌ Error looking up teacher "${teacherName}":`, error);
            teacherLookup[teacherName] = null;
          }
        }
        
        // Create missing teachers in database
        if (missingTeachers.length > 0) {
          console.log(`🏗️ Creating ${missingTeachers.length} missing teachers...`);
          for (const teacher of missingTeachers) {
            try {
              await db.query(
                'INSERT INTO giang_vien (ma_giang_vien, ho_ten, email, so_dien_thoai, khoa, bo_mon, so_sinh_vien_huong_dan) VALUES (?, ?, ?, ?, ?, ?, 0)',
                [teacher.ma_giang_vien, teacher.ho_ten, teacher.email, teacher.so_dien_thoai, teacher.khoa, teacher.bo_mon]
              );
              console.log(`✅ Created teacher: ${teacher.ma_giang_vien} - ${teacher.ho_ten}`);
            } catch (error) {
              console.error(`❌ Error creating teacher ${teacher.ma_giang_vien}:`, error.message);
              // If creation fails, remove from lookup to prevent foreign key error
              teacherLookup[teacher.ho_ten] = null;
            }
          }
        }
      }

      // Second pass: build records with resolved teacher codes
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber <= headerRowIndex) return;
        const v = row.values;
        const get = (idx) => (idx && v[idx] ? v[idx].toString().trim() : '');
        const maSinhVien = get(headerMap.maSinhVien);
        const hoTen = get(headerMap.hoTen);
        const teacherCell = get(headerMap.giangVien);
        if (!maSinhVien && !hoTen && !teacherCell) return;
        if (!teacherCell) return; // ignore rows without teacher

        const maGiangVien = teacherLookup[teacherCell];
        if (!maGiangVien) {
          console.log(`⚠️ Skipping row ${rowNumber}: Cannot resolve teacher "${teacherCell}"`);
          return;
        }

        const record = {
          ma_giang_vien: maGiangVien,
          ten_giang_vien: teacherCell, // Save original teacher name
          ma_sinh_vien: maSinhVien || '',
          ho_ten_sinh_vien: hoTen || '',
          email_sinh_vien: get(headerMap.email),
          so_dien_thoai_sinh_vien: get(headerMap.soDienThoai),
          lop_sinh_vien: get(headerMap.lop),
          ngay_sinh_sinh_vien: headerMap.ngaySinh ? SinhVienHuongDanController.parseDate(v[headerMap.ngaySinh]) : null,
          vi_tri_thuc_tap: get(headerMap.viTri),
          doanh_nghiep_thuc_tap: get(headerMap.doanhNghiep),
          nguyen_vong_thuc_tap: get(headerMap.nguyenVong)
        };

        data.push(record);
        teacherCounts[maGiangVien] = (teacherCounts[maGiangVien] || 0) + 1;
      });

      console.log('📊 Prepared records:', { rows: data.length, teacherCounts });

      if (data.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Không tìm thấy thông tin hợp lệ trong file Excel. Hãy kiểm tra lại định dạng file.'
        });
      }

      // Import vào bảng sinh_vien_huong_dan và cập nhật đếm theo transaction
      const importResult = await SinhVienHuongDan.importBatch(data);

      // Clean up file
      if (filePath) {
        deleteFile(filePath);
      }

      return res.json({
        success: true,
        message: importResult.message,
        data: {
          teacherCounts: importResult.teacherCounts,
          totalProcessed: importResult.totalProcessed
        }
      });

    } catch (error) {
      console.error('❌ Import sinh viên hướng dẫn lỗi:', error);
      
      // Clean up file on error
      if (filePath) {
        deleteFile(filePath);
      }

      return res.status(500).json({
        success: false,
        message: 'Lỗi import file Excel: ' + error.message
      });
    }
  }

  /**
   * GET /api/sinh-vien-huong-dan/:maGiangVien
   * Lấy danh sách sinh viên hướng dẫn của một giảng viên
   */
  static async getByGiangVien(req, res) {
    try {
      const { maGiangVien } = req.params;
      const students = await SinhVienHuongDan.getByGiangVien(maGiangVien);
      
      return res.json({
        success: true,
        data: students
      });
    } catch (error) {
      console.error('❌ Get sinh viên hướng dẫn lỗi:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi lấy danh sách sinh viên hướng dẫn'
      });
    }
  }

  /**
   * POST /api/sinh-vien-huong-dan/update-counts
   * Cập nhật số lượng sinh viên hướng dẫn cho tất cả giảng viên
   */
  static async updateAllCounts(req, res) {
    try {
      await SinhVienHuongDan.updateAllTeacherCounts();
      
      return res.json({
        success: true,
        message: 'Đã cập nhật số lượng sinh viên hướng dẫn cho tất cả giảng viên'
      });
    } catch (error) {
      console.error('❌ Update counts lỗi:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi cập nhật số lượng sinh viên hướng dẫn'
      });
    }
  }

  /**
   * Helper method to parse date from various formats
   */
  static parseDate(value) {
    if (!value) return null;
    
    try {
      // Handle Excel date serial number
      if (typeof value === 'number') {
        const date = new Date((value - 25569) * 86400 * 1000);
        return date.toISOString().split('T')[0];
      }
      
      // Handle string date
      const dateStr = value.toString().trim();
      if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // Try to parse as ISO date
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
}

module.exports = SinhVienHuongDanController;
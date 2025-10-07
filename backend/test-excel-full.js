const ExcelJS = require('exceljs');
const path = require('path');

// Copy the parseDate method from controller
function parseDate(value) {
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

async function testExcelParsing() {
  try {
    // Test with the latest uploaded file
    const testFile = path.join(__dirname, 'uploads', 'excel', 'excelFile-1759623486547-344934204.xlsx');
    console.log('📁 Testing file:', testFile);
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(testFile);
    const worksheet = workbook.getWorksheet(1);
    
    if (!worksheet) {
      console.log('❌ No worksheet found');
      return;
    }
    
    console.log('📊 Worksheet loaded, total rows:', worksheet.actualRowCount);
    
    const data = [];
    const teacherCounts = {};
    let headerRowIndex = -1;
    const headerMap = {};

    // find header row with detailed logging
    worksheet.eachRow((row, rowNumber) => {
      const vals = row.values.slice(1).map(v => (v ? v.toString().trim() : '')); // Skip first empty cell
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
          const actualIdx = idx + 1; // Adjust for skipped first cell
          
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
      console.log('❌ Error: Không xác định được dòng tiêu đề hoặc cột Giảng viên hướng dẫn');
      return;
    }

    // Process data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowIndex) return;
      const v = row.values;
      const get = (idx) => (idx && v[idx] ? v[idx].toString().trim() : '');
      const maSinhVien = get(headerMap.maSinhVien);
      const hoTen = get(headerMap.hoTen);
      const teacherCell = get(headerMap.giangVien);
      if (!maSinhVien && !hoTen && !teacherCell) return;
      if (!teacherCell) return; // ignore rows without teacher

      console.log(`🔍 Processing row ${rowNumber}: SV=${maSinhVien}, Name=${hoTen}, Teacher=${teacherCell}`);

      // For now, generate simple teacher code
      let maGiangVien = teacherCell;
      const m = teacherCell.match(/(\d+)$/);
      if (m) maGiangVien = `GV${m[1].padStart(3, '0')}`;

      const record = {
        ma_giang_vien: maGiangVien,
        ten_giang_vien: teacherCell, // Save original teacher name
        ma_sinh_vien: maSinhVien || '',
        ho_ten_sinh_vien: hoTen || '',
        email_sinh_vien: get(headerMap.email),
        so_dien_thoai_sinh_vien: get(headerMap.soDienThoai),
        lop_sinh_vien: get(headerMap.lop),
        ngay_sinh_sinh_vien: headerMap.ngaySinh ? parseDate(v[headerMap.ngaySinh]) : null,
        vi_tri_thuc_tap: get(headerMap.viTri),
        doanh_nghiep_thuc_tap: get(headerMap.doanhNghiep),
        nguyen_vong_thuc_tap: get(headerMap.nguyenVong)
      };

      data.push(record);
      teacherCounts[maGiangVien] = (teacherCounts[maGiangVien] || 0) + 1;
    });

    console.log('📊 Final results:', { 
      totalRecords: data.length, 
      teacherCounts,
      sampleRecord: data[0] 
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testExcelParsing();
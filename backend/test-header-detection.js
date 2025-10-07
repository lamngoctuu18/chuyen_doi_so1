const ExcelJS = require('exceljs');
const path = require('path');

async function testExcelHeaderDetection() {
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
    
    let headerRowIndex = -1;
    const headerMap = {};
    
    // Check each row for headers with improved logic
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
      
      console.log(`🔍 Row ${rowNumber}: [${vals.join(', ')}]`);
      
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
          
          // teacher - more flexible matching
          if (hs.includes('giảng viên') && hs.includes('hướng dẫn')) {
            headerMap.giangVien = actualIdx;
            console.log(`  ✅ Mapped giangVien to column ${actualIdx}`);
          }
        });
        
        console.log('📋 Final header mapping:', headerMap);
      }
    });
    
    if (headerRowIndex === -1 || !headerMap.giangVien) {
      console.log('❌ Error: Không xác định được dòng tiêu đề hoặc cột Giảng viên hướng dẫn');
    } else {
      console.log(`✅ Success: Header found at row ${headerRowIndex}, teacher column at index ${headerMap.giangVien}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testExcelHeaderDetection();
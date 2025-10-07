const ExcelJS = require('exceljs');
const path = require('path');

async function testExcelHeaders() {
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
    
    // Check first few rows
    for (let rowNum = 1; rowNum <= Math.min(5, worksheet.actualRowCount); rowNum++) {
      const row = worksheet.getRow(rowNum);
      const vals = row.values.map(v => (v ? v.toString().trim() : ''));
      console.log(`🔍 Row ${rowNum}: [${vals.join(', ')}]`);
      
      // Check for header indicators
      const rowText = vals.join(' ').toLowerCase();
      if (rowText.includes('giảng viên') || rowText.includes('mã sv') || rowText.includes('họ tên')) {
        console.log(`✅ Potential header row at ${rowNum}: "${rowText}"`);
        
        vals.forEach((h, idx) => {
          if (!h) return;
          const hs = h.toLowerCase().trim();
          if (hs.includes('giảng viên') && hs.includes('hướng dẫn')) {
            console.log(`  🎯 Found teacher column at index ${idx}: "${h}"`);
          }
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testExcelHeaders();
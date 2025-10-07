const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function debugExcelFile(filePath) {
  try {
    console.log('🔍 DEBUG EXCEL FILE');
    console.log('File path:', filePath);
    
    // Kiểm tra file tồn tại
    if (!fs.existsSync(filePath)) {
      console.error('❌ File không tồn tại!');
      return;
    }
    
    // Kiểm tra kích thước file
    const stats = fs.statSync(filePath);
    console.log('📁 File size:', stats.size, 'bytes');
    
    if (stats.size === 0) {
      console.error('❌ File rỗng!');
      return;
    }
    
    // Thử đọc file với các cách khác nhau
    console.log('\n🔄 Thử đọc file...');
    
    const workbook = new ExcelJS.Workbook();
    
    try {
      // Cách 1: Đọc trực tiếp
      await workbook.xlsx.readFile(filePath);
      console.log('✅ Đọc file thành công với readFile');
    } catch (error1) {
      console.log('❌ Lỗi với readFile:', error1.message);
      
      try {
        // Cách 2: Đọc từ buffer
        const buffer = fs.readFileSync(filePath);
        console.log('📦 Buffer size:', buffer.length);
        
        await workbook.xlsx.load(buffer);
        console.log('✅ Đọc file thành công với load buffer');
      } catch (error2) {
        console.log('❌ Lỗi với buffer:', error2.message);
        
        try {
          // Cách 3: Đọc từ stream
          const stream = fs.createReadStream(filePath);
          await workbook.xlsx.read(stream);
          console.log('✅ Đọc file thành công với stream');
        } catch (error3) {
          console.log('❌ Lỗi với stream:', error3.message);
          return;
        }
      }
    }
    
    // Hiển thị thông tin workbook
    console.log('\n📊 THÔNG TIN WORKBOOK:');
    console.log('Số worksheets:', workbook.worksheets.length);
    
    workbook.worksheets.forEach((worksheet, index) => {
      console.log(`\n📋 Worksheet ${index + 1}:`);
      console.log('  Name:', worksheet.name);
      console.log('  Row count:', worksheet.rowCount);
      console.log('  Column count:', worksheet.columnCount);
      console.log('  Actual row count:', worksheet.actualRowCount);
      console.log('  Actual column count:', worksheet.actualColumnCount);
      
      if (worksheet.rowCount > 0) {
        console.log('\n📝 Headers (Row 1):');
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell, colNumber) => {
          console.log(`    ${colNumber}: "${cell.value}" (type: ${typeof cell.value})`);
        });
        
        if (worksheet.rowCount > 1) {
          console.log('\n📝 Sample data (Row 2):');
          const dataRow = worksheet.getRow(2);
          dataRow.eachCell((cell, colNumber) => {
            console.log(`    ${colNumber}: "${cell.value}" (type: ${typeof cell.value})`);
          });
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Lỗi debug:', error);
  }
}

// Test với file template-giang-vien.xlsx
const testFile = 'C:\\Users\\84916\\Downloads\\template-giang-vien.xlsx';
debugExcelFile(testFile);
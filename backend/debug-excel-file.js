const ExcelJS = require('exceljs');
const path = require('path');

// Script debug để kiểm tra file Excel thực tế
async function debugExcelFile(filePath) {
  console.log('🔍 Debugging Excel file:', filePath);
  
  try {
    // Kiểm tra file tồn tại
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      console.error('❌ File không tồn tại:', filePath);
      return;
    }
    
    console.log('✅ File tồn tại, kích thước:', fs.statSync(filePath).size, 'bytes');
    
    // Khởi tạo workbook
    const workbook = new ExcelJS.Workbook();
    
    console.log('📖 Đang đọc file Excel...');
    await workbook.xlsx.readFile(filePath);
    
    console.log('✅ Đọc file thành công!');
    console.log('📊 Số worksheet:', workbook.worksheets.length);
    
    // Lặp qua tất cả worksheet
    workbook.worksheets.forEach((worksheet, index) => {
      console.log(`\n📋 Worksheet ${index + 1}: "${worksheet.name}"`);
      console.log('   Số hàng thực tế:', worksheet.actualRowCount);
      console.log('   Số cột thực tế:', worksheet.actualColumnCount);
      console.log('   Số hàng có dữ liệu:', worksheet.rowCount);
      console.log('   Số cột có dữ liệu:', worksheet.columnCount);
      
      // Hiển thị vài hàng đầu
      console.log('   📝 Nội dung 5 hàng đầu:');
      for (let rowNum = 1; rowNum <= Math.min(5, worksheet.actualRowCount); rowNum++) {
        const row = worksheet.getRow(rowNum);
        const rowData = [];
        
        for (let colNum = 1; colNum <= worksheet.actualColumnCount; colNum++) {
          const cell = row.getCell(colNum);
          let value = '';
          
          if (cell.value !== null && cell.value !== undefined) {
            if (typeof cell.value === 'object' && cell.value.text) {
              value = cell.value.text;
            } else if (typeof cell.value === 'object' && cell.value.result) {
              value = cell.value.result;
            } else {
              value = String(cell.value);
            }
          }
          
          rowData.push(value);
        }
        
        console.log(`   Hàng ${rowNum}:`, rowData);
      }
    });
    
    // Test với worksheet đầu tiên
    const worksheet = workbook.worksheets[0];
    if (worksheet) {
      console.log('\n🧪 Testing data extraction from first worksheet:');
      
      // Thử các cách khác nhau để lấy headers
      console.log('\n📍 Method 1 - Using getRow(1):');
      const headerRow = worksheet.getRow(1);
      const headers1 = [];
      headerRow.eachCell((cell, colNumber) => {
        let cellValue = '';
        if (cell.value !== null && cell.value !== undefined) {
          if (typeof cell.value === 'object' && cell.value.text) {
            cellValue = cell.value.text;
          } else if (typeof cell.value === 'object' && cell.value.result) {
            cellValue = cell.value.result;
          } else {
            cellValue = String(cell.value);
          }
        }
        headers1.push(cellValue.toLowerCase().trim());
      });
      console.log('Headers method 1:', headers1);
      
      console.log('\n📍 Method 2 - Using values array:');
      const headers2 = [];
      const values = headerRow.values;
      if (Array.isArray(values)) {
        for (let i = 1; i < values.length; i++) { // Skip index 0
          let cellValue = '';
          if (values[i] !== null && values[i] !== undefined) {
            if (typeof values[i] === 'object' && values[i].text) {
              cellValue = values[i].text;
            } else if (typeof values[i] === 'object' && values[i].result) {
              cellValue = values[i].result;
            } else {
              cellValue = String(values[i]);
            }
          }
          headers2.push(cellValue.toLowerCase().trim());
        }
      }
      console.log('Headers method 2:', headers2);
      
      // Test data rows
      console.log('\n📍 Testing data rows:');
      for (let rowNum = 2; rowNum <= Math.min(4, worksheet.actualRowCount); rowNum++) {
        const dataRow = worksheet.getRow(rowNum);
        const rowData = {};
        
        dataRow.eachCell((cell, colNumber) => {
          const header = headers1[colNumber - 1] || `col_${colNumber}`;
          
          let cellValue = '';
          if (cell.value !== null && cell.value !== undefined) {
            if (typeof cell.value === 'object' && cell.value.text) {
              cellValue = cell.value.text;
            } else if (typeof cell.value === 'object' && cell.value.result) {
              cellValue = cell.value.result;
            } else {
              cellValue = String(cell.value);
            }
          }
          
          rowData[header] = cellValue.trim();
        });
        
        console.log(`Data row ${rowNum}:`, rowData);
      }
    }
    
  } catch (error) {
    console.error('❌ Lỗi khi đọc file Excel:', error);
    console.error('Chi tiết lỗi:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Chạy debug với file thực tế
const excelFilePath = 'c:\\Users\\84916\\Downloads\\template-giang-vien.xlsx';
debugExcelFile(excelFilePath);
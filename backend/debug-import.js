const ExcelImportService = require('./src/services/ExcelImportService');
const path = require('path');

async function testImport() {
  try {
    // Thay đổi path này thành file Excel thực tế của bạn
    const filePath = path.join(__dirname, 'uploads', 'sinh-vien-sample.xlsx');
    
    console.log('Testing file:', filePath);
    
    // Test parse file
    const parseResult = await ExcelImportService.parseExcelFile(filePath, 'sinh-vien');
    console.log('Parse result:', JSON.stringify(parseResult, null, 2));
    
    if (parseResult.success && parseResult.data.length > 0) {
      console.log('\nFirst data item keys:', Object.keys(parseResult.data[0]));
      console.log('First data item:', parseResult.data[0]);
      
      // Test import to database
      console.log('\nTesting import to database...');
      const importResult = await ExcelImportService.importToDatabase('sinh-vien', parseResult.data);
      console.log('Import result:', importResult);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testImport();
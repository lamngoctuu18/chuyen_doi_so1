const ExcelImportService = require('./src/services/ExcelImportService');

async function debugDoanhNghiepFile() {
  try {
    console.log('🔍 Debug file doanh nghiệp...');
    
    const filePath = 'C:\\Users\\84916\\Downloads\\template-doanh-nghiep.xlsx';
    
    // Test parseExcelFile với accountType
    console.log('\n📋 Test parseExcelFile với accountType = doanh-nghiep');
    const result = await ExcelImportService.parseExcelFile(filePath, 'doanh-nghiep');
    
    console.log('\n✅ Kết quả parse:');
    console.log('- Total rows:', result.totalRows);
    console.log('- Errors:', result.errors.length);
    
    if (result.doanhNghieps) {
      console.log('- Doanh nghiệp data:', result.doanhNghieps.length);
      if (result.doanhNghieps.length > 0) {
        console.log('- Sample:', result.doanhNghieps[0]);
      }
    }
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(error => {
        console.log(`  Row ${error.row}: ${error.error}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

debugDoanhNghiepFile();
require('dotenv').config();
const connection = require('./src/database/connection');

async function checkTables() {
  try {
    console.log('🔍 Kiểm tra cấu trúc bảng accounts:');
    const accounts = await connection.query('DESCRIBE accounts');
    console.log('Raw result:', accounts);
    
    // Thử cách khác để parse kết quả
    if (accounts && accounts[0] && Array.isArray(accounts[0])) {
      console.log('Cấu trúc bảng accounts:');
      accounts[0].forEach(col => {
        console.log(`- ${col.Field} (${col.Type})`);
      });
    }
    
    console.log('\n🔍 Kiểm tra cấu trúc bảng doanh_nghiep:');
    const doanhNghiep = await connection.query('DESCRIBE doanh_nghiep');
    if (doanhNghiep && doanhNghiep[0] && Array.isArray(doanhNghiep[0])) {
      console.log('Cấu trúc bảng doanh_nghiep:');
      doanhNghiep[0].forEach(col => {
        console.log(`- ${col.Field} (${col.Type})`);
      });
    }
    
    console.log('\n🔍 Kiểm tra cấu trúc bảng doanh_nghiep:');
    
    const doanhNghiepResult = await connection.query('DESCRIBE doanh_nghiep');
    console.log('Raw result:', doanhNghiepResult);
    
    if (Array.isArray(doanhNghiepResult) && doanhNghiepResult.length > 0) {
      const doanhNghiepColumns = doanhNghiepResult[0] || doanhNghiepResult;
      
      console.log('\n📋 Cấu trúc bảng doanh_nghiep:');
      doanhNghiepColumns.forEach(col => {
        console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
      });
    } else {
      console.log('⚠️ Không thể lấy cấu trúc bảng doanh_nghiep');
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    process.exit(0);
  }
}

checkTables();
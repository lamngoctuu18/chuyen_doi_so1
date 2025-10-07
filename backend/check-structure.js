const connection = require('./src/database/connection');

async function checkTablesStructure() {
  try {
    console.log('🔍 Kiểm tra cấu trúc bảng accounts...');
    
    // Kiểm tra cấu trúc bảng accounts
    const accountsStructure = await connection.query('DESCRIBE accounts');
    console.log('📋 Accounts columns:');
    accountsStructure.forEach(col => console.log(`- ${col.Field} (${col.Type})`));
    
    console.log('\n🔍 Kiểm tra dữ liệu accounts doanh nghiệp...');
    
    // Lấy dữ liệu mẫu để xem
    const sampleAccounts = await connection.query(`
      SELECT * FROM accounts 
      WHERE role = 'doanh-nghiep' 
      LIMIT 3
    `);
    
    console.log('📋 Sample company accounts:');
    sampleAccounts.forEach(acc => {
      console.log(`- ID: ${acc.id}, Role: ${acc.role}`);
      console.log(`  Fields:`, Object.keys(acc));
    });
    
    console.log('\n🔍 Kiểm tra bảng doanh_nghiep...');
    const companies = await connection.query('SELECT id, account_id, ma_doanh_nghiep, ten_cong_ty FROM doanh_nghiep LIMIT 5');
    console.log('📋 Existing companies:');
    companies.forEach(comp => {
      console.log(`- ID: ${comp.id}, Account ID: ${comp.account_id}, Mã: ${comp.ma_doanh_nghiep}, Tên: ${comp.ten_cong_ty}`);
    });
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    process.exit(0);
  }
}

checkTablesStructure();
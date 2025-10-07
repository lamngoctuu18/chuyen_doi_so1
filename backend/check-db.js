const { query } = require('./src/database/connection');

async function checkTables() {
  try {
    console.log('🔍 Kiểm tra các bảng trong database...');
    
    // Liệt kê tất cả bảng
    const tables = await query('SHOW TABLES');
    console.log('📋 Các bảng hiện có:', tables.map(t => Object.values(t)[0]));
    
    // Kiểm tra cấu trúc bảng sinh_vien
    try {
      const svStructure = await query('DESCRIBE sinh_vien');
      console.log('🏗️ Cấu trúc bảng sinh_vien:');
      svStructure.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key ? `(${col.Key})` : ''}`);
      });
    } catch (error) {
      console.log('❌ Bảng sinh_vien không tồn tại');
    }
    
    // Kiểm tra cấu trúc bảng accounts
    try {
      const accStructure = await query('DESCRIBE accounts');
      console.log('🏗️ Cấu trúc bảng accounts:');
      accStructure.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key ? `(${col.Key})` : ''}`);
      });
    } catch (error) {
      console.log('❌ Bảng accounts không tồn tại');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

checkTables();
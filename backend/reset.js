const { createDatabaseConnection, query, closeConnections } = require('./src/database/connection');

const resetDatabase = async () => {
  try {
    console.log('🔄 ===== RESET DATABASE =====');
    console.log('⚠️  Cảnh báo: Tất cả dữ liệu sẽ bị xóa!');
    
    // Kết nối đến MySQL server (không cần database)
    await createDatabaseConnection();
    
    // Drop database nếu tồn tại
    const databaseName = process.env.DB_NAME || 'quanly_thuctap';
    console.log(`🗑️ Xóa database: ${databaseName}...`);
    
    // Kết nối trực tiếp để drop database
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      charset: 'utf8mb4'
    });
    
    await connection.execute(`DROP DATABASE IF EXISTS \`${databaseName}\``);
    console.log(`✅ Database ${databaseName} đã được xóa!`);
    
    await connection.end();
    
    console.log('🎯 Database đã được reset hoàn toàn!');
    console.log('▶️  Bây giờ chạy: npm run setup');
    
  } catch (error) {
    console.error('❌ Lỗi reset database:', error.message);
    throw error;
  }
};

// Chạy reset
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('🎉 Reset hoàn thành!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Reset thất bại:', error);
      process.exit(1);
    });
}

module.exports = { resetDatabase };
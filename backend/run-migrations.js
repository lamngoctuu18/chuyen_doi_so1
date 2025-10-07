const fs = require('fs');
const path = require('path');
const { testConnection } = require('./src/database/connection');
const mysql = require('mysql2/promise');

async function runMigrations() {
  console.log('🚀 Bắt đầu chạy migrations...');

  try {
    // Test connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Không thể kết nối database');
    }

    // Tạo connection mới để chạy migration
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'quanly_thuctap',
      charset: 'utf8mb4',
      timezone: '+07:00'
    });

    // Đọc và chạy migration file
    const migrationPath = path.join(__dirname, 'migrations', '003_create_accounts_table.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file không tồn tại: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Tách các câu lệnh SQL
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📄 Đang chạy migration: 003_create_accounts_table.sql`);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
      }
    }

    console.log('✅ Migration hoàn thành thành công!');
    console.log('📊 Bảng accounts đã được tạo và tài khoản admin đã được thêm');
    
    // Hiển thị thống kê
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM accounts');
    console.log(`👥 Tổng số tài khoản trong hệ thống: ${rows[0].count}`);

    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Lỗi khi chạy migration:', error.message);
    process.exit(1);
  }
}

// Chạy migrations
runMigrations();
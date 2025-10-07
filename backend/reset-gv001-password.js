const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetGV001Password() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123',
      database: process.env.DB_NAME || 'quanly_thuctap'
    });

    console.log('🔐 Đang reset mật khẩu GV001...');

    // Mật khẩu mới cho GV001
    const newPassword = 'GV001';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu cho account có user_id = 'GV001'
    const [result] = await connection.execute(
      'UPDATE accounts SET password_hash = ? WHERE user_id = ? AND role = ?',
      [hashedPassword, 'GV001', 'giang-vien']
    );

    if (result.affectedRows > 0) {
      console.log('✅ Reset mật khẩu GV001 thành công!');
      console.log('📝 Thông tin đăng nhập:');
      console.log('   - Mã giảng viên: GV001');
      console.log('   - Mật khẩu: GV001');
    } else {
      console.log('❌ Không tìm thấy tài khoản GV001');
    }

    // Kiểm tra lại thông tin account
    console.log('\n📊 Thông tin tài khoản GV001:');
    const [accounts] = await connection.execute(
      'SELECT user_id, role, email, is_active FROM accounts WHERE user_id = ?',
      ['GV001']
    );
    console.table(accounts);

    // Test xác thực với mật khẩu mới
    console.log('\n🧪 Test xác thực mật khẩu mới...');
    if (accounts.length > 0) {
      const isValid = await bcrypt.compare(newPassword, hashedPassword);
      console.log(`🔍 Xác thực mật khẩu: ${isValid ? '✅ THÀNH CÔNG' : '❌ THẤT BẠI'}`);
    }

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

resetGV001Password();
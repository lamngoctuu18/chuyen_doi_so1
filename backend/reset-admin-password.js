const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetAdminPassword() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123',
      database: process.env.DB_NAME || 'quanly_thuctap'
    });

    console.log('🔐 Đang reset mật khẩu admin...');

    // Mật khẩu mới cho admin
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu cho admin001
    const [result] = await connection.execute(
      'UPDATE accounts SET password_hash = ? WHERE user_id = ? AND role = ?',
      [hashedPassword, 'admin001', 'admin']
    );

    if (result.affectedRows > 0) {
      console.log('✅ Reset mật khẩu admin thành công!');
      console.log('📝 Thông tin đăng nhập admin:');
      console.log('   - Tên người dùng: admin001');
      console.log('   - Mật khẩu: admin123');
    } else {
      console.log('❌ Không tìm thấy tài khoản admin001');
    }

    // Kiểm tra lại tài khoản admin
    console.log('\n📊 Danh sách tài khoản admin:');
    const [admins] = await connection.execute(
      'SELECT id, user_id, email, role, is_active, created_at FROM accounts WHERE role = ?',
      ['admin']
    );
    console.table(admins);

    // Test xác thực với mật khẩu mới
    console.log('\n🧪 Test xác thực mật khẩu mới...');
    const [adminAccount] = await connection.execute(
      'SELECT * FROM accounts WHERE user_id = ? AND role = ?',
      ['admin001', 'admin']
    );

    if (adminAccount.length > 0) {
      const isValid = await bcrypt.compare(newPassword, adminAccount[0].password_hash);
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

resetAdminPassword();
const Account = require('./src/models/Account');
const bcrypt = require('bcryptjs');
const { query } = require('./src/database/connection');

async function resetStudentPassword() {
  try {
    console.log('=== RESETTING SV001 PASSWORD ===\n');
    
    // 1. Tìm sinh viên SV001
    const sinhVienData = await query('SELECT * FROM sinh_vien WHERE ma_sinh_vien = ?', ['SV001']);
    
    if (sinhVienData.length === 0) {
      console.log('❌ Không tìm thấy sinh viên SV001');
      return;
    }
    
    console.log('✅ Tìm thấy sinh viên:', sinhVienData[0].ho_ten);
    const accountId = sinhVienData[0].account_id;
    
    // 2. Cập nhật password thành 'SV001'
    const newPassword = 'SV001';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await query('UPDATE accounts SET password_hash = ? WHERE id = ?', [hashedPassword, accountId]);
    console.log(`✅ Đã cập nhật password thành "${newPassword}" cho SV001`);
    
    // 3. Kiểm tra lại
    const updatedAccount = await query('SELECT * FROM accounts WHERE id = ?', [accountId]);
    const isMatch = await bcrypt.compare(newPassword, updatedAccount[0].password_hash);
    console.log('✅ Kiểm tra password:', isMatch ? 'CORRECT' : 'INCORRECT');
    
    // 4. Test đăng nhập
    console.log('\n=== TESTING LOGIN ===');
    const loginResult = await Account.authenticateBySinhVien('SV001', 'SV001');
    console.log('Login test:', loginResult ? '✅ SUCCESS' : '❌ FAILED');
    
    if (loginResult) {
      console.log('Student info:', loginResult.sinhVien);
    }
    
  } catch (error) {
    console.error('❌ Reset error:', error);
  }
}

resetStudentPassword();
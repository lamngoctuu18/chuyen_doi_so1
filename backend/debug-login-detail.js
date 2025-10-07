const { query } = require('./src/database/connection');
const bcrypt = require('bcryptjs');
const Account = require('./src/models/Account');

async function debugLogin() {
  try {
    console.log('=== DEBUGGING LOGIN PROCESS ===\n');
    
    // 1. Kiểm tra dữ liệu trong database
    console.log('1. Checking database data...');
    const joinData = await query(`
      SELECT 
        a.id as account_id,
        a.user_id,
        a.email,
        a.password_hash,
        a.role,
        a.is_active,
        sv.id as sinh_vien_id,
        sv.ma_sinh_vien,
        sv.ho_ten
      FROM accounts a
      INNER JOIN sinh_vien sv ON a.id = sv.account_id
      WHERE sv.ma_sinh_vien = ?
    `, ['SV001']);
    
    console.log('Database result:', joinData);
    
    if (joinData.length === 0) {
      console.log('❌ Không tìm thấy sinh viên SV001 trong database');
      return;
    }
    
    const accountData = joinData[0];
    console.log('\n2. Account details:');
    console.log('- Account ID:', accountData.account_id);
    console.log('- User ID:', accountData.user_id);
    console.log('- Email:', accountData.email);
    console.log('- Role:', accountData.role);
    console.log('- Is Active:', accountData.is_active);
    console.log('- Student Code:', accountData.ma_sinh_vien);
    console.log('- Student Name:', accountData.ho_ten);
    
    // 2. Kiểm tra password hash
    console.log('\n3. Testing password...');
    const testPasswords = ['SV001', '123456', 'sv001'];
    
    for (const pwd of testPasswords) {
      const isMatch = await bcrypt.compare(pwd, accountData.password_hash);
      console.log(`- Password "${pwd}":`, isMatch ? '✅ MATCH' : '❌ No match');
    }
    
    // 3. Test method authenticateBySinhVien từng bước
    console.log('\n4. Testing authenticateBySinhVien method...');
    
    try {
      // Kiểm tra query trong method
      const methodQuery = `
        SELECT a.*, sv.ma_sinh_vien, sv.ho_ten 
        FROM accounts a
        INNER JOIN sinh_vien sv ON a.id = sv.account_id
        WHERE sv.ma_sinh_vien = ? AND a.is_active = TRUE AND a.role = 'sinh-vien'
      `;
      
      const methodResult = await query(methodQuery, ['SV001']);
      console.log('Method query result:', methodResult);
      
      if (methodResult.length === 0) {
        console.log('❌ Method query returns no results');
        console.log('Checking conditions:');
        console.log('- ma_sinh_vien = SV001: OK');
        console.log('- is_active = TRUE:', accountData.is_active === 1 ? 'OK' : 'FAIL');
        console.log('- role = sinh-vien:', accountData.role === 'sinh-vien' ? 'OK' : 'FAIL');
      } else {
        console.log('✅ Method query returns data');
        
        // Test password comparison
        const pwd = 'SV001';
        const isPasswordValid = await bcrypt.compare(pwd, methodResult[0].password_hash);
        console.log(`Password comparison for "${pwd}":`, isPasswordValid ? '✅ VALID' : '❌ INVALID');
      }
      
    } catch (error) {
      console.error('❌ Method test error:', error);
    }
    
    // 4. Test full method
    console.log('\n5. Testing full method...');
    try {
      const loginResult = await Account.authenticateBySinhVien('SV001', 'SV001');
      console.log('Full method result:', loginResult ? '✅ SUCCESS' : '❌ FAILED');
      
      if (loginResult) {
        console.log('Login details:', {
          accountId: loginResult.account.id,
          userId: loginResult.account.userId,
          role: loginResult.account.role,
          studentCode: loginResult.sinhVien.maSinhVien,
          studentName: loginResult.sinhVien.hoTen
        });
      }
    } catch (error) {
      console.error('❌ Full method error:', error);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugLogin();
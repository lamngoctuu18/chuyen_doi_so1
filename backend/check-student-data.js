const { query } = require('./src/database/connection');
const bcrypt = require('bcryptjs');

async function checkStudentData() {
  try {
    console.log('Checking student SV001 data in database...');
    
    // 1. Kiểm tra dữ liệu trong bảng sinh_vien
    const sinhVienData = await query('SELECT * FROM sinh_vien WHERE ma_sinh_vien = ?', ['SV001']);
    console.log('📋 Sinh vien data:', sinhVienData);
    
    if (sinhVienData.length > 0) {
      const accountId = sinhVienData[0].account_id;
      
      // 2. Kiểm tra dữ liệu trong bảng accounts
      const accountData = await query('SELECT * FROM accounts WHERE id = ?', [accountId]);
      console.log('🔐 Account data:', accountData);
      
      if (accountData.length > 0) {
        // 3. Test password với các giá trị có thể
        const passwords = ['SV001', '123456', 'sv001'];
        
        for (const pwd of passwords) {
          const isMatch = await bcrypt.compare(pwd, accountData[0].password_hash);
          console.log(`🔍 Password "${pwd}":`, isMatch ? '✅ MATCH' : '❌ No match');
        }
        
        // 4. Kiểm tra join query
        const joinData = await query(`
          SELECT a.*, sv.ma_sinh_vien, sv.ho_ten 
          FROM accounts a
          INNER JOIN sinh_vien sv ON a.id = sv.account_id
          WHERE sv.ma_sinh_vien = ?
        `, ['SV001']);
        console.log('🔗 Join data:', joinData);
      }
    }
    
  } catch (error) {
    console.error('❌ Check error:', error);
  }
}

checkStudentData();
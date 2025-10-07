require('dotenv').config();
const bcrypt = require('bcryptjs');
const connection = require('./src/database/connection');

async function resetDoanhNghiepPassword() {
  try {
    console.log('🔧 Bắt đầu reset mật khẩu doanh nghiệp...');
    
    // Mật khẩu mới
    const newPassword = '123456';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Lấy danh sách tất cả doanh nghiệp
    const [doanhNghieps] = await connection.query(
      'SELECT id, account_id, ma_doanh_nghiep, ten_cong_ty FROM doanh_nghiep LIMIT 10'
    );
    
    console.log(`📋 Tìm thấy ${doanhNghieps.length} doanh nghiệp`);
    
    for (const dn of doanhNghieps) {
      // Reset mật khẩu trong bảng accounts (dùng account_id)
      await connection.query(
        'UPDATE accounts SET password_hash = ? WHERE id = ?',
        [hashedPassword, dn.account_id]
      );
      
      console.log(`✅ Reset mật khẩu cho ${dn.ma_doanh_nghiep} - ${dn.ten_cong_ty}`);
    }
    
    console.log('🎉 Hoàn thành reset mật khẩu tất cả doanh nghiệp!');
    console.log(`🔑 Mật khẩu mới: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Lỗi reset mật khẩu:', error);
  } finally {
    process.exit(0);
  }
}

// Reset mật khẩu cho một doanh nghiệp cụ thể
async function resetSpecificDoanhNghiep(maDN) {
  try {
    console.log(`🔧 Reset mật khẩu cho doanh nghiệp: ${maDN}`);
    
    const newPassword = '123456';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Kiểm tra doanh nghiệp có tồn tại không
    const [doanhNghiepResult] = await connection.query(
      'SELECT id, account_id, ten_cong_ty, email_cong_ty FROM doanh_nghiep WHERE ma_doanh_nghiep = ?',
      [maDN]
    );
    
    console.log('🔍 Query result:', doanhNghiepResult);
    console.log('🔍 Type of result:', typeof doanhNghiepResult);
    console.log('🔍 Is array:', Array.isArray(doanhNghiepResult));
    
    if (!doanhNghiepResult || doanhNghiepResult.length === 0) {
      console.log(`❌ Không tìm thấy doanh nghiệp với mã: ${maDN}`);
      
      // Liệt kê các doanh nghiệp có sẵn
      const [allDN] = await connection.query('SELECT ma_doanh_nghiep, ten_cong_ty FROM doanh_nghiep LIMIT 5');
      console.log('📋 Các doanh nghiệp có sẵn:');
      allDN.forEach(dn => {
        console.log(`  - ${dn.ma_doanh_nghiep}: ${dn.ten_cong_ty}`);
      });
      return;
    }
    
    // Nếu doanhNghiepResult là array, lấy phần tử đầu tiên
    // Nếu là object, sử dụng trực tiếp
    const dn = Array.isArray(doanhNghiepResult) ? doanhNghiepResult[0] : doanhNghiepResult;
    
    // Reset mật khẩu trong bảng accounts (dùng account_id)
    await connection.query(
      'UPDATE accounts SET password_hash = ? WHERE id = ?',
      [hashedPassword, dn.account_id]
    );
    
    console.log(`✅ Reset thành công cho ${maDN} - ${dn.ten_cong_ty}`);
    console.log(`🔑 Mật khẩu mới: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Lỗi reset mật khẩu:', error);
  } finally {
    process.exit(0);
  }
}

// Kiểm tra argument từ command line
const maDN = process.argv[2];

if (maDN) {
  console.log(`🎯 Reset mật khẩu cho doanh nghiệp cụ thể: ${maDN}`);
  resetSpecificDoanhNghiep(maDN);
} else {
  console.log('🔄 Reset mật khẩu cho tất cả doanh nghiệp');
  resetDoanhNghiepPassword();
}
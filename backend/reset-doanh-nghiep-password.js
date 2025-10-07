require('dotenv').config();
const bcrypt = require('bcryptjs');    // Reset mật khẩu trong bảng accounts (sử dụng user_id)
    await connection.query(
      'UPDATE accounts SET password_hash = ? WHERE user_id = ? AND role = "doanh-nghiep"',
      [hashedPassword, maDN]
    );
    
    // Reset mật khẩu trong bảng doanh_nghiep
    await connection.query(
      'UPDATE doanh_nghiep SET password = ? WHERE ma_doanh_nghiep = ?',
      [hashedPassword, maDN]
    );ection = require('./src/database/connection');

async function resetDoanhNghiepPassword() {
  try {
    console.log('🔧 Bắt đầu reset mật khẩu doanh nghiệp...');
    
    // Mật khẩu mới
    const newPassword = '123456';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Lấy danh sách tất cả doanh nghiệp
    const [doanhNghieps] = await connection.query(
      'SELECT id, ma_doanh_nghiep, ten_cong_ty, email FROM doanh_nghiep LIMIT 10'
    );
    
    console.log(`📋 Tìm thấy ${doanhNghieps.length} doanh nghiệp`);
    
    for (const dn of doanhNghieps) {
      // Reset mật khẩu trong bảng accounts (sử dụng user_id)
      await connection.query(
        'UPDATE accounts SET password_hash = ? WHERE user_id = ? AND role = "doanh-nghiep"',
        [hashedPassword, dn.ma_doanh_nghiep]
      );
      
      // Reset mật khẩu trong bảng doanh_nghiep
      await connection.query(
        'UPDATE doanh_nghiep SET password = ? WHERE id = ?',
        [hashedPassword, dn.id]
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
    const [doanhNghiep] = await connection.query(
      'SELECT id, ten_cong_ty FROM doanh_nghiep WHERE ma_doanh_nghiep = ?',
      [maDN]
    );
    
    if (doanhNghiep.length === 0) {
      console.log(`❌ Không tìm thấy doanh nghiệp với mã: ${maDN}`);
      return;
    }
    
    // Lấy email của doanh nghiệp
    const email = `${maDN}@company.dainam.edu.vn`;
    
    // Reset mật khẩu trong bảng accounts
    await connection.query(
      'UPDATE accounts SET password = ? WHERE email = ? AND role = "doanh_nghiep"',
      [hashedPassword, email]
    );
    
    // Reset mật khẩu trong bảng doanh_nghiep
    await connection.query(
      'UPDATE doanh_nghiep SET password = ? WHERE ma_doanh_nghiep = ?',
      [hashedPassword, maDN]
    );
    
    console.log(`✅ Reset thành công cho ${maDN} - ${doanhNghiep[0].ten_cong_ty}`);
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
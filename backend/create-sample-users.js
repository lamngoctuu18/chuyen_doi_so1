require('dotenv').config();
const bcrypt = require('bcryptjs');
const connection = require('./src/database/connection');

async function createSampleUsers() {
  try {
    console.log('👥 Tạo dữ liệu mẫu cho users...');

    const hashedPassword = await bcrypt.hash('123456', 10);

    // 1. Tạo tài khoản và sinh viên mẫu
    console.log('📚 Tạo sinh viên mẫu...');
    
    // Sinh viên 1
    const [account1] = await connection.query(`
      INSERT INTO accounts (user_id, email, password_hash, role) 
      VALUES ('SV001', 'sv001@dainam.edu.vn', ?, 'sinh-vien')
    `, [hashedPassword]);
    
    await connection.query(`
      INSERT INTO sinh_vien (account_id, ma_sinh_vien, ho_ten, ngay_sinh, lop, khoa, so_dien_thoai, trang_thai_thuc_tap) 
      VALUES (?, 'SV001', 'Nguyễn Văn A', '2002-01-15', 'CNTT2021A', 'Công nghệ Thông tin', '0987654321', 'chua-dang-ky')
    `, [account1.insertId]);

    // Sinh viên 2
    const [account2] = await connection.query(`
      INSERT INTO accounts (user_id, email, password_hash, role) 
      VALUES ('SV002', 'sv002@dainam.edu.vn', ?, 'sinh-vien')
    `, [hashedPassword]);
    
    await connection.query(`
      INSERT INTO sinh_vien (account_id, ma_sinh_vien, ho_ten, ngay_sinh, lop, khoa, so_dien_thoai, trang_thai_thuc_tap) 
      VALUES (?, 'SV002', 'Trần Thị B', '2002-05-20', 'CNTT2021A', 'Công nghệ Thông tin', '0987654322', 'da-dang-ky')
    `, [account2.insertId]);

    // Sinh viên 3
    const [account3] = await connection.query(`
      INSERT INTO accounts (user_id, email, password_hash, role) 
      VALUES ('SV003', 'sv003@dainam.edu.vn', ?, 'sinh-vien')
    `, [hashedPassword]);
    
    await connection.query(`
      INSERT INTO sinh_vien (account_id, ma_sinh_vien, ho_ten, ngay_sinh, lop, khoa, so_dien_thoai, trang_thai_thuc_tap) 
      VALUES (?, 'SV003', 'Lê Văn C', '2002-03-10', 'CNTT2021B', 'Công nghệ Thông tin', '0987654323', 'dang-thuc-tap')
    `, [account3.insertId]);

    // 2. Tạo tài khoản và giảng viên mẫu
    console.log('👨‍🏫 Tạo giảng viên mẫu...');
    
    // Giảng viên 1
    const [accountGV1] = await connection.query(`
      INSERT INTO accounts (user_id, email, password_hash, role) 
      VALUES ('GV001', 'gv001@dainam.edu.vn', ?, 'giang-vien')
    `, [hashedPassword]);
    
    await connection.query(`
      INSERT INTO giang_vien (account_id, ma_giang_vien, ho_ten, khoa, bo_mon, chuc_vu, hoc_vi, chuyen_mon, so_dien_thoai) 
      VALUES (?, 'GV001', 'TS. Nguyễn Văn Giảng', 'Công nghệ Thông tin', 'Công nghệ Phần mềm', 'Giảng viên', 'Tiến sĩ', 'React.js, Node.js', '0901234567')
    `, [accountGV1.insertId]);

    // Giảng viên 2
    const [accountGV2] = await connection.query(`
      INSERT INTO accounts (user_id, email, password_hash, role) 
      VALUES ('GV002', 'gv002@dainam.edu.vn', ?, 'giang-vien')
    `, [hashedPassword]);
    
    await connection.query(`
      INSERT INTO giang_vien (account_id, ma_giang_vien, ho_ten, khoa, bo_mon, chuc_vu, hoc_vi, chuyen_mon, so_dien_thoai) 
      VALUES (?, 'GV002', 'ThS. Trần Thị Hướng', 'Công nghệ Thông tin', 'Trí tuệ Nhân tạo', 'Giảng viên', 'Thạc sĩ', 'Python, Machine Learning', '0907654321')
    `, [accountGV2.insertId]);

    // 3. Tạo tài khoản và doanh nghiệp mẫu (sử dụng DN001 đã có)
    console.log('🏢 Kiểm tra doanh nghiệp...');
    
    const [existingCompanies] = await connection.query('SELECT COUNT(*) as count FROM doanh_nghiep');
    
    if (existingCompanies.count === 0) {
      // Tạo doanh nghiệp mẫu nếu chưa có
      const [accountDN1] = await connection.query(`
        INSERT INTO accounts (user_id, email, password_hash, role) 
        VALUES ('DN002', 'dn002@company.com', ?, 'doanh-nghiep')
      `, [hashedPassword]);
      
      await connection.query(`
        INSERT INTO doanh_nghiep (account_id, ma_doanh_nghiep, ten_cong_ty, ten_nguoi_lien_he, dia_chi_cong_ty, so_dien_thoai, email_cong_ty, linh_vuc_hoat_dong, trang_thai_hop_tac) 
        VALUES (?, 'DN002', 'Công ty TNHH XYZ Technology', 'Nguyễn Văn Manager', '456 Đường DEF, Quận 3, TP.HCM', '0909876543', 'hr@xyz-tech.com', 'Phần mềm', 'Đang hợp tác')
      `, [accountDN1.insertId]);
    }

    console.log('✅ Tạo dữ liệu mẫu user thành công!');
    console.log('📋 Thông tin đăng nhập:');
    console.log('  Sinh viên: SV001, SV002, SV003 - Mật khẩu: 123456');
    console.log('  Giảng viên: GV001, GV002 - Mật khẩu: 123456');
    console.log('  Doanh nghiệp: DN001, DN002 - Mật khẩu: 123456');

  } catch (error) {
    console.error('❌ Lỗi tạo dữ liệu mẫu:', error);
  } finally {
    process.exit(0);
  }
}

createSampleUsers();
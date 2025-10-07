const connection = require('./src/database/connection');

async function checkAndCreateTables() {
  try {
    console.log('🔍 Kiểm tra bảng dot_thuc_tap...');
    
    // Kiểm tra bảng dot_thuc_tap
    try {
      const result = await connection.query('DESCRIBE dot_thuc_tap');
      console.log('✅ Bảng dot_thuc_tap đã tồn tại:', result.length, 'columns');
    } catch (error) {
      console.log('❌ Bảng dot_thuc_tap chưa tồn tại, đang tạo...');
      
      await connection.query(`
        CREATE TABLE dot_thuc_tap (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ten_dot VARCHAR(255) NOT NULL,
          thoi_gian_bat_dau DATE NOT NULL,
          thoi_gian_ket_thuc DATE NOT NULL,
          mo_ta TEXT,
          trang_thai ENUM('sap-mo', 'dang-mo', 'dang-dien-ra', 'ket-thuc') DEFAULT 'sap-mo',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Đã tạo bảng dot_thuc_tap');
    }

    // Kiểm tra bảng phan_cong_thuc_tap
    try {
      const result = await connection.query('DESCRIBE phan_cong_thuc_tap');
      console.log('✅ Bảng phan_cong_thuc_tap đã tồn tại:', result.length, 'columns');
    } catch (error) {
      console.log('❌ Bảng phan_cong_thuc_tap chưa tồn tại, đang tạo...');
      
      await connection.query(`
        CREATE TABLE phan_cong_thuc_tap (
          id INT AUTO_INCREMENT PRIMARY KEY,
          dot_thuc_tap_id INT NOT NULL,
          sinh_vien_id INT NOT NULL,
          doanh_nghiep_id INT NOT NULL,
          giang_vien_id INT NOT NULL,
          ngay_bat_dau DATE NOT NULL,
          ngay_ket_thuc DATE NOT NULL,
          trang_thai ENUM('chua-bat-dau', 'dang-dien-ra', 'hoan-thanh', 'huy') DEFAULT 'chua-bat-dau',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (dot_thuc_tap_id) REFERENCES dot_thuc_tap(id),
          FOREIGN KEY (sinh_vien_id) REFERENCES sinh_vien(id),
          FOREIGN KEY (doanh_nghiep_id) REFERENCES doanh_nghiep(id),
          FOREIGN KEY (giang_vien_id) REFERENCES giang_vien(id)
        )
      `);
      console.log('✅ Đã tạo bảng phan_cong_thuc_tap');
    }

    // Thêm một số dữ liệu mẫu cho dot_thuc_tap
    const existingBatches = await connection.query('SELECT COUNT(*) as count FROM dot_thuc_tap');
    if (existingBatches[0].count === 0) {
      console.log('📝 Thêm dữ liệu mẫu cho dot_thuc_tap...');
      
      await connection.query(`
        INSERT INTO dot_thuc_tap (ten_dot, thoi_gian_bat_dau, thoi_gian_ket_thuc, mo_ta, trang_thai) VALUES
        ('Đợt thực tập Xuân 2025', '2025-02-01', '2025-05-31', 'Đợt thực tập học kỳ II năm học 2024-2025', 'dang-dien-ra'),
        ('Đợt thực tập Hè 2025', '2025-06-01', '2025-08-31', 'Đợt thực tập hè năm 2025', 'sap-mo')
      `);
      console.log('✅ Đã thêm dữ liệu mẫu');
    }

    console.log('🎉 Tất cả bảng đã sẵn sàng!');
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    process.exit(0);
  }
}

checkAndCreateTables();
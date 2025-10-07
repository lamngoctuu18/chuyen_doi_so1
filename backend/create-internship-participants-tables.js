const connection = require('./src/database/connection');

async function createInternshipParticipantsTables() {
  try {
    console.log('🔧 Creating internship participants tables...');

    // Tạo bảng sinh_vien_thuc_tap - quan hệ nhiều-nhiều giữa sinh viên và đợt thực tập
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sinh_vien_thuc_tap (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ma_sinh_vien VARCHAR(20) NOT NULL,
        dot_thuc_tap_id INT NOT NULL,
        ngay_dang_ky TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        trang_thai ENUM('dang-ky', 'duoc-phan-cong', 'hoan-thanh', 'huy') DEFAULT 'dang-ky',
        INDEX idx_ma_sinh_vien (ma_sinh_vien),
        INDEX idx_dot_thuc_tap (dot_thuc_tap_id),
        UNIQUE KEY unique_sinh_vien_dot (ma_sinh_vien, dot_thuc_tap_id),
        FOREIGN KEY (dot_thuc_tap_id) REFERENCES dot_thuc_tap(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created sinh_vien_thuc_tap table');

    // Tạo bảng giang_vien_huong_dan - quan hệ nhiều-nhiều giữa giảng viên và đợt thực tập
    await connection.query(`
      CREATE TABLE IF NOT EXISTS giang_vien_huong_dan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ma_giang_vien VARCHAR(20) NOT NULL,
        dot_thuc_tap_id INT NOT NULL,
        ngay_phan_cong TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        so_sinh_vien_huong_dan INT DEFAULT 0,
        trang_thai ENUM('hoat-dong', 'nghi', 'chuyen-doi') DEFAULT 'hoat-dong',
        INDEX idx_ma_giang_vien (ma_giang_vien),
        INDEX idx_dot_thuc_tap (dot_thuc_tap_id),
        UNIQUE KEY unique_giang_vien_dot (ma_giang_vien, dot_thuc_tap_id),
        FOREIGN KEY (dot_thuc_tap_id) REFERENCES dot_thuc_tap(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created giang_vien_huong_dan table');

    // Tạo bảng doanh_nghiep_thuc_tap - quan hệ nhiều-nhiều giữa doanh nghiệp và đợt thực tập
    await connection.query(`
      CREATE TABLE IF NOT EXISTS doanh_nghiep_thuc_tap (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ma_doanh_nghiep VARCHAR(20) NOT NULL,
        dot_thuc_tap_id INT NOT NULL,
        ngay_tham_gia TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        so_vi_tri_thuc_tap INT DEFAULT 0,
        so_sinh_vien_tiep_nhan INT DEFAULT 0,
        trang_thai ENUM('hoat-dong', 'tam-nghi', 'dung-hop-tac') DEFAULT 'hoat-dong',
        INDEX idx_ma_doanh_nghiep (ma_doanh_nghiep),
        INDEX idx_dot_thuc_tap (dot_thuc_tap_id),
        UNIQUE KEY unique_doanh_nghiep_dot (ma_doanh_nghiep, dot_thuc_tap_id),
        FOREIGN KEY (dot_thuc_tap_id) REFERENCES dot_thuc_tap(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created doanh_nghiep_thuc_tap table');

    // Thêm các cột đếm vào bảng dot_thuc_tap nếu chưa có
    const columns = await connection.query(`
      SHOW COLUMNS FROM dot_thuc_tap 
      WHERE Field IN ('so_sinh_vien_tham_gia', 'so_giang_vien_huong_dan', 'so_doanh_nghiep_tham_gia')
    `);

    if (!columns.find(col => col.Field === 'so_sinh_vien_tham_gia')) {
      await connection.query(`
        ALTER TABLE dot_thuc_tap 
        ADD COLUMN so_sinh_vien_tham_gia INT DEFAULT 0
      `);
      console.log('✅ Added so_sinh_vien_tham_gia column');
    }

    if (!columns.find(col => col.Field === 'so_giang_vien_huong_dan')) {
      await connection.query(`
        ALTER TABLE dot_thuc_tap 
        ADD COLUMN so_giang_vien_huong_dan INT DEFAULT 0
      `);
      console.log('✅ Added so_giang_vien_huong_dan column');
    }

    if (!columns.find(col => col.Field === 'so_doanh_nghiep_tham_gia')) {
      await connection.query(`
        ALTER TABLE dot_thuc_tap 
        ADD COLUMN so_doanh_nghiep_tham_gia INT DEFAULT 0
      `);
      console.log('✅ Added so_doanh_nghiep_tham_gia column');
    }

    console.log('🎉 All internship participants tables created successfully!');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
}

// Chạy script
if (require.main === module) {
  createInternshipParticipantsTables()
    .then(() => {
      console.log('✅ Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createInternshipParticipantsTables };
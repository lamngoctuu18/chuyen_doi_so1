const mysql = require('mysql2/promise');

async function createInternshipRegistrationTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'quanly_thuctap'
  });

  try {
    console.log('🔄 Creating internship registration table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS dang_ky_thuc_tap_sinh_vien (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sinh_vien_id INT NOT NULL,
        nguyen_vong_thuc_tap ENUM('khoa-gioi-thieu', 'tu-lien-he') NOT NULL,
        vi_tri_thuc_tap_mong_muon VARCHAR(255) NOT NULL,
        ten_cong_ty VARCHAR(255) NULL,
        dia_chi_cong_ty TEXT NULL,
        nguoi_lien_he VARCHAR(255) NULL,
        so_dien_thoai_lien_he VARCHAR(20) NULL,
        ghi_chu TEXT NULL,
        trang_thai ENUM('cho-duyet', 'da-duyet', 'tu-choi') DEFAULT 'cho-duyet',
        ly_do_tu_choi TEXT NULL,
        nguoi_duyet_id INT NULL,
        ngay_duyet DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (sinh_vien_id) REFERENCES sinh_vien(id) ON DELETE CASCADE,
        
        INDEX idx_sinh_vien_id (sinh_vien_id),
        INDEX idx_trang_thai (trang_thai),
        INDEX idx_nguyen_vong (nguyen_vong_thuc_tap)
      )
    `;

    await connection.execute(createTableSQL);
    console.log('✅ Table dang_ky_thuc_tap_sinh_vien created successfully!');

  } catch (error) {
    console.error('❌ Error creating table:', error);
  } finally {
    await connection.end();
  }
}

createInternshipRegistrationTable();
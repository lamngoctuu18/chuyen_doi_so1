const connection = require('./src/database/connection');

async function createCompanyRegistrationTable() {
  try {
    console.log('🔍 Tạo bảng dang_ky_doanh_nghiep...');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS dang_ky_doanh_nghiep (
        id INT AUTO_INCREMENT PRIMARY KEY,
        dot_thuc_tap_id INT NOT NULL,
        doanh_nghiep_id INT NOT NULL,
        vi_tri_tuyen VARCHAR(255) NOT NULL,
        so_luong_tuyen INT NOT NULL DEFAULT 1,
        yeu_cau_ky_nang TEXT NOT NULL,
        mo_ta_cong_viec TEXT NOT NULL,
        luong_khoang VARCHAR(255),
        dia_chi_lam_viec VARCHAR(500) NOT NULL,
        ghi_chu TEXT,
        trang_thai ENUM('cho-duyet', 'da-duyet', 'tu-choi') DEFAULT 'cho-duyet',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (dot_thuc_tap_id) REFERENCES dot_thuc_tap(id) ON DELETE CASCADE,
        FOREIGN KEY (doanh_nghiep_id) REFERENCES doanh_nghiep(id) ON DELETE CASCADE,
        UNIQUE KEY unique_company_batch (dot_thuc_tap_id, doanh_nghiep_id)
      )
    `);
    
    console.log('✅ Đã tạo bảng dang_ky_doanh_nghiep');
    
    // Kiểm tra bảng đã tạo
    const result = await connection.query('DESCRIBE dang_ky_doanh_nghiep');
    console.log('📋 Cấu trúc bảng:', result.length, 'columns');
    
  } catch (error) {
    console.error('❌ Lỗi tạo bảng:', error);
  } finally {
    process.exit(0);
  }
}

createCompanyRegistrationTable();
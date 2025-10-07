const db = require('./src/database/connection');

async function createBaoCaoTable() {
  try {
    // Drop existing table if exists
    await db.query('DROP TABLE IF EXISTS bao_cao');
    console.log('✓ Dropped existing table');

    // Create bao_cao table
    const createTableSQL = `
      CREATE TABLE bao_cao (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        ten_dot VARCHAR(255) NOT NULL COMMENT 'Tên đợt báo cáo',
        dot_thuc_tap_id INT NOT NULL COMMENT 'ID đợt thực tập',
        loai_bao_cao ENUM('weekly', 'final') NOT NULL COMMENT 'Loại báo cáo',
        han_nop DATETIME NOT NULL COMMENT 'Hạn nộp báo cáo',
        mo_ta TEXT COMMENT 'Mô tả đợt báo cáo',
        trang_thai ENUM('chua-mo', 'dang-mo', 'da-dong') DEFAULT 'chua-mo' COMMENT 'Trạng thái đợt báo cáo',
        ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo',
        ngay_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Ngày cập nhật',
        
        FOREIGN KEY (dot_thuc_tap_id) REFERENCES dot_thuc_tap(id) ON DELETE CASCADE,
        
        INDEX idx_bao_cao_dot_thuc_tap (dot_thuc_tap_id),
        INDEX idx_bao_cao_loai_bao_cao (loai_bao_cao),
        INDEX idx_bao_cao_trang_thai (trang_thai),
        INDEX idx_bao_cao_han_nop (han_nop),
        
        UNIQUE KEY uk_bao_cao_unique (dot_thuc_tap_id, loai_bao_cao, ten_dot)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng quản lý đợt báo cáo'
    `;

    await db.query(createTableSQL);
    console.log('✓ Created bao_cao table');

    // Insert sample data
    const insertSQL = `
      INSERT INTO bao_cao (id, ten_dot, dot_thuc_tap_id, loai_bao_cao, han_nop, mo_ta, trang_thai) VALUES
      ('rb001', 'Báo cáo tuần 1-4 Đợt thực tập 2025', 1, 'weekly', '2025-03-15 23:59:59', 'Báo cáo hàng tuần từ tuần 1 đến tuần 4 của đợt thực tập năm 2025', 'dang-mo'),
      ('rb002', 'Báo cáo cuối kỳ Đợt thực tập 2025', 1, 'final', '2025-06-30 23:59:59', 'Báo cáo tổng kết thực tập cuối khóa', 'chua-mo'),
      ('rb003', 'Báo cáo tuần 5-8 Đợt thực tập 2025', 1, 'weekly', '2025-04-15 23:59:59', 'Báo cáo hàng tuần từ tuần 5 đến tuần 8 của đợt thực tập năm 2025', 'chua-mo')
      ON DUPLICATE KEY UPDATE 
      ten_dot = VALUES(ten_dot),
      mo_ta = VALUES(mo_ta)
    `;

    await db.query(insertSQL);
    console.log('✓ Inserted sample data');

    console.log('🎉 Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

createBaoCaoTable();
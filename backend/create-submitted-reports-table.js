const db = require('./src/database/connection');

async function createSubmittedReportsTable() {
  try {
    // First, let's create a table for submitted reports (different from report batches)
    await db.query(`
      CREATE TABLE IF NOT EXISTS bao_cao_da_nop (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        tieu_de VARCHAR(500) NOT NULL,
        loai_nguoi_nop ENUM('giang_vien', 'doanh_nghiep') NOT NULL,
        ma_nguoi_nop VARCHAR(50) NOT NULL,
        ten_nguoi_nop VARCHAR(255) NOT NULL,
        ngay_nop DATE,
        trang_thai ENUM('da_nop', 'da_duyet', 'tu_choi') DEFAULT 'da_nop',
        so_sinh_vien INT DEFAULT 0,
        ky_thuc_tap VARCHAR(100),
        dot_thuc_tap_id INT,
        noi_dung TEXT,
        file_url VARCHAR(500),
        ghi_chu TEXT,
        nguoi_duyet VARCHAR(50),
        ngay_duyet DATETIME,
        ly_do_tu_choi TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_loai_nguoi_nop (loai_nguoi_nop),
        INDEX idx_ma_nguoi_nop (ma_nguoi_nop),
        INDEX idx_trang_thai (trang_thai),
        INDEX idx_dot_thuc_tap (dot_thuc_tap_id)
      )
    `);
    
    console.log('✅ Created bao_cao_da_nop table successfully');
    
    // Now add some sample data
    await db.query(`
      INSERT INTO bao_cao_da_nop (
        tieu_de, 
        loai_nguoi_nop, 
        ma_nguoi_nop, 
        ten_nguoi_nop,
        ngay_nop,
        trang_thai,
        so_sinh_vien,
        ky_thuc_tap,
        dot_thuc_tap_id,
        noi_dung,
        ghi_chu
      ) VALUES 
      ('Báo cáo hướng dẫn thực tập tuần 1-4', 'giang_vien', 'GV001', 'TS. Nguyễn Văn An', '2025-01-15', 'da_duyet', 8, 'Kỳ 1 - 2025', 1, 'Báo cáo chi tiết về quá trình hướng dẫn sinh viên', 'Báo cáo hoàn thiện'),
      ('Báo cáo đánh giá sinh viên thực tập', 'doanh_nghiep', 'DN001', 'Công ty TNHH ABC Tech', '2025-01-20', 'da_nop', 5, 'Kỳ 1 - 2025', 1, 'Đánh giá kết quả thực tập của sinh viên', NULL),
      ('Báo cáo tiến độ hướng dẫn', 'giang_vien', 'GV002', 'ThS. Trần Thị Bình', '2025-01-18', 'da_nop', 6, 'Kỳ 1 - 2025', 1, 'Báo cáo tiến độ và đánh giá sinh viên', NULL),
      ('Báo cáo cuối kỳ thực tập', 'giang_vien', 'GV003', 'PGS. Lê Văn Cường', '2025-01-22', 'tu_choi', 4, 'Kỳ 1 - 2025', 1, 'Báo cáo tổng kết hoạt động thực tập', 'Cần bổ sung thêm thông tin'),
      ('Đánh giá kết quả thực tập', 'doanh_nghiep', 'DN002', 'Công ty CP XYZ Solutions', '2025-01-25', 'da_duyet', 3, 'Kỳ 1 - 2025', 1, 'Báo cáo đánh giá chi tiết sinh viên', 'Sinh viên có kết quả tốt')
    `);
    
    console.log('✅ Sample submitted reports added successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating submitted reports table:', error);
    process.exit(1);
  }
}

createSubmittedReportsTable();
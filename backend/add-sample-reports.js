const db = require('./src/database/connection');

async function addSampleReports() {
  try {
    await db.query(`
      INSERT INTO bao_cao (
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
      ('Báo cáo tiến độ hướng dẫn', 'giang_vien', 'GV002', 'ThS. Trần Thị Bình', '2025-01-18', 'da_nop', 6, 'Kỳ 1 - 2025', 1, 'Báo cáo tiến độ và đánh giá sinh viên', NULL)
    `);
    
    console.log('✅ Sample reports added successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding sample reports:', error);
    console.error(error);
    process.exit(1);
  }
}

addSampleReports();
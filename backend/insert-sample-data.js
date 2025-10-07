require('dotenv').config();
const connection = require('./src/database/connection');

async function insertSampleData() {
  try {
    console.log('🌱 Thêm dữ liệu mẫu...');

    // 1. Thêm đợt thực tập
    await connection.query(`
      INSERT IGNORE INTO dot_thuc_tap (id, ten_dot, thoi_gian_bat_dau, thoi_gian_ket_thuc, mo_ta, trang_thai) VALUES
      (1, 'Đợt thực tập Xuân 2025', '2025-02-01', '2025-05-31', 'Đợt thực tập học kỳ II năm học 2024-2025', 'dang-dien-ra'),
      (2, 'Đợt thực tập Hè 2025', '2025-06-01', '2025-08-31', 'Đợt thực tập hè năm 2025', 'sap-mo'),
      (3, 'Đợt thực tập Thu 2024', '2024-09-01', '2024-12-31', 'Đợt thực tập học kỳ I năm học 2024-2025', 'ket-thuc')
    `);

    // 2. Kiểm tra có sinh viên và doanh nghiệp không
    const [students] = await connection.query('SELECT id FROM sinh_vien LIMIT 5');
    const [companies] = await connection.query('SELECT id FROM doanh_nghiep LIMIT 3');
    const [teachers] = await connection.query('SELECT id FROM giang_vien LIMIT 3');

    if (students.length > 0 && companies.length > 0) {
      // 3. Thêm phân công thực tập
      await connection.query(`
        INSERT IGNORE INTO phan_cong_thuc_tap (id, sinh_vien_id, doanh_nghiep_id, dot_thuc_tap_id, giang_vien_id, ngay_bat_dau, ngay_ket_thuc, trang_thai) VALUES
        (1, ${students[0].id}, ${companies[0].id}, 1, ${teachers[0]?.id || 'NULL'}, '2025-02-01', '2025-05-31', 'dang-dien-ra'),
        (2, ${students[1]?.id || students[0].id}, ${companies[0].id}, 1, ${teachers[1]?.id || 'NULL'}, '2025-02-01', '2025-05-31', 'dang-dien-ra'),
        (3, ${students[2]?.id || students[0].id}, ${companies[1]?.id || companies[0].id}, 3, ${teachers[2]?.id || 'NULL'}, '2024-09-01', '2024-12-31', 'hoan-thanh')
      `);

      // 4. Thêm tin tuyển dụng
      await connection.query(`
        INSERT IGNORE INTO tin_tuyen_dung (id, doanh_nghiep_id, tieu_de, mo_ta_cong_viec, yeu_cau, so_luong_tuyen, muc_luong, hinh_thuc_lam_viec, dia_diem, han_ung_tuyen, trang_thai) VALUES
        (1, ${companies[0].id}, 'Tuyển Developer React.js', 'Phát triển ứng dụng web với React.js', 'Kinh nghiệm 1-2 năm React.js, HTML, CSS, JavaScript', 2, '10-15 triệu', 'Full-time', 'TP.HCM', '2025-03-31', 'dang-tuyen'),
        (2, ${companies[0].id}, 'Tuyển Backend Developer', 'Phát triển API và xử lý backend', 'Kinh nghiệm Node.js, MongoDB/MySQL', 1, '12-18 triệu', 'Full-time', 'TP.HCM', '2025-04-15', 'dang-tuyen'),
        (3, ${companies[1]?.id || companies[0].id}, 'Tuyển Mobile Developer', 'Phát triển ứng dụng di động', 'Kinh nghiệm React Native hoặc Flutter', 1, '15-20 triệu', 'Full-time', 'Hà Nội', '2025-04-30', 'dang-tuyen')
      `);

      console.log('✅ Thêm dữ liệu mẫu thành công!');
    } else {
      console.log('⚠️ Chưa có đủ dữ liệu sinh viên/doanh nghiệp để tạo mẫu');
    }

  } catch (error) {
    console.error('❌ Lỗi thêm dữ liệu mẫu:', error);
  } finally {
    process.exit(0);
  }
}

insertSampleData();
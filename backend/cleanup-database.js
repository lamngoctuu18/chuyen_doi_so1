const mysql = require('mysql2/promise');
require('dotenv').config();

async function cleanupDatabase() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123',
      database: process.env.DB_NAME || 'quanly_thuctap'
    });

    console.log('🗂️ Đang kiểm tra và xóa các bảng thừa...');

    // Danh sách bảng cần giữ lại (bảng chính)
    const keepTables = [
      'accounts',        // Bảng tài khoản chính
      'admin',          // Thông tin admin
      'sinh_vien',      // Thông tin sinh viên
      'giang_vien',     // Thông tin giảng viên
      'doanh_nghiep',   // Thông tin doanh nghiệp
      'internship_assignments',  // Phân công thực tập
      'internship_batches',      // Đợt thực tập
      'job_postings',           // Tin tuyển dụng
      'applications',           // Đơn ứng tuyển
      'weekly_reports',         // Báo cáo tuần
      'final_reports'           // Báo cáo cuối kỳ
    ];

    // Danh sách bảng cần xóa (bảng trùng lặp/không dùng)
    const tablesToDrop = [
      'users',         // Trùng với accounts
      'students',      // Trùng với sinh_vien
      'teachers',      // Trùng với giang_vien
      'companies'      // Trùng với doanh_nghiep
    ];

    console.log('\n📋 Bảng sẽ được giữ lại:');
    keepTables.forEach(table => console.log(`  ✅ ${table}`));

    console.log('\n🗑️ Bảng sẽ được xóa:');
    tablesToDrop.forEach(table => console.log(`  ❌ ${table}`));

    // Kiểm tra bảng nào tồn tại
    const [tables] = await connection.execute('SHOW TABLES');
    const existingTables = tables.map(row => Object.values(row)[0]);

    console.log('\n🔄 Đang xóa các bảng thừa...');
    
    for (const table of tablesToDrop) {
      if (existingTables.includes(table)) {
        try {
          await connection.execute(`DROP TABLE IF EXISTS \`${table}\``);
          console.log(`  ✅ Đã xóa bảng: ${table}`);
        } catch (error) {
          console.log(`  ❌ Lỗi khi xóa bảng ${table}: ${error.message}`);
        }
      } else {
        console.log(`  ℹ️ Bảng ${table} không tồn tại`);
      }
    }

    // Hiển thị danh sách bảng sau khi cleanup
    console.log('\n📊 Danh sách bảng sau khi cleanup:');
    const [finalTables] = await connection.execute('SHOW TABLES');
    console.table(finalTables);

    console.log('\n✅ Cleanup database hoàn tất!');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

cleanupDatabase();
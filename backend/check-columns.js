const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'quanly_thuctap',
  charset: 'utf8mb4',
  timezone: '+07:00'
};

async function checkColumns() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    console.log('=== Kiểm tra cấu trúc bảng sinh_vien ===');
    const [columns] = await connection.execute('DESCRIBE sinh_vien');
    
    console.log('Các cột trong bảng sinh_vien:');
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n=== Kiểm tra dữ liệu sinh viên ===');
    const [students] = await connection.execute('SELECT * FROM sinh_vien LIMIT 3');
    
    if (students.length > 0) {
      console.log(`Tìm thấy ${students.length} sinh viên:`);
      students.forEach((student, index) => {
        console.log(`\nSinh viên ${index + 1}:`);
        console.log(`- ID: ${student.id}`);
        console.log(`- Mã SV: ${student.ma_sinh_vien}`);
        console.log(`- Họ tên: ${student.ho_ten}`);
        console.log(`- Vị trí muốn ứng tuyển: ${student.vi_tri_muon_ung_tuyen_thuc_tap || 'NULL'}`);
        console.log(`- Đơn vị thực tập: ${student.don_vi_thuc_tap || 'NULL'}`);
      });
    } else {
      console.log('Không có dữ liệu sinh viên nào');
    }
    
  } catch (error) {
    console.error('Lỗi:', error.message);
  } finally {
    await connection.end();
  }
}

checkColumns();
const { query } = require('./src/database/connection');

async function ensureBatchCountColumns() {
  try {
    const tableName = 'dot_thuc_tap';
    const columns = [
      { name: 'so_sinh_vien_excel', type: 'INT DEFAULT 0' },
      { name: 'so_giang_vien_excel', type: 'INT DEFAULT 0' },
      { name: 'so_doanh_nghiep_excel', type: 'INT DEFAULT 0' },
    ];

    const missing = [];
    for (const col of columns) {
      const rows = await query(`SHOW COLUMNS FROM ${tableName} LIKE ?`, [col.name]);
      if (!rows || rows.length === 0) {
        missing.push(`ADD COLUMN ${col.name} ${col.type}`);
      }
    }

    if (missing.length > 0) {
      await query(`ALTER TABLE ${tableName} ${missing.join(', ')}`);
      console.log('✅ Đã thêm các cột đếm vào dot_thuc_tap:', missing.map(m => m.split(' ')[2]).join(', '));
    } else {
      console.log('✅ Các cột đếm đã tồn tại trong dot_thuc_tap');
    }
  } catch (e) {
    console.error('❌ Lỗi khi đảm bảo các cột đếm:', e.message);
    throw e;
  }
}

module.exports = { ensureBatchCountColumns };

// Cho phép chạy trực tiếp bằng node để migrate một lần
if (require.main === module) {
  ensureBatchCountColumns()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

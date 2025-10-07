const db = require('./connection');

async function columnExists(table, column) {
  const sql = `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`;
  const rows = await db.query(sql, [table, column]);
  return rows && rows[0] && rows[0].cnt > 0;
}

async function ensureSinhVienColumns() {
  const col = 'giang_vien_huong_dan';
  const exists = await columnExists('sinh_vien', col);
  if (!exists) {
    await db.query(`ALTER TABLE sinh_vien ADD COLUMN ${col} VARCHAR(255) NULL AFTER don_vi_thuc_tap`);
    console.log(`✅ Đã thêm cột ${col} vào bảng sinh_vien`);
  }
}

async function ensureDotThucTapColumns() {
  const defs = [
    { name: 'so_sinh_vien_tham_gia', ddl: 'INT DEFAULT 0' },
    { name: 'so_giang_vien_huong_dan', ddl: 'INT DEFAULT 0' },
    { name: 'so_doanh_nghiep_tham_gia', ddl: 'INT DEFAULT 0' },
  ];
  for (const c of defs) {
    const exists = await columnExists('dot_thuc_tap', c.name);
    if (!exists) {
      await db.query(`ALTER TABLE dot_thuc_tap ADD COLUMN ${c.name} ${c.ddl}`);
      console.log(`✅ Đã thêm cột ${c.name} vào bảng dot_thuc_tap`);
    }
  }
}

async function ensurePhanCongThucTapTeacherEvalColumns() {
  const defs = [
    { name: 'diem_giang_vien', ddl: 'DECIMAL(4,2) NULL' },
    { name: 'nhan_xet_giang_vien', ddl: 'TEXT NULL' },
    { name: 'ngay_nop_danh_gia', ddl: 'DATETIME NULL' }
  ];
  for (const c of defs) {
    const exists = await columnExists('phan_cong_thuc_tap', c.name);
    if (!exists) {
      await db.query(`ALTER TABLE phan_cong_thuc_tap ADD COLUMN ${c.name} ${c.ddl}`);
      console.log(`✅ Đã thêm cột ${c.name} vào bảng phan_cong_thuc_tap`);
    }
  }
}

async function ensureColumns() {
  try {
    await ensureSinhVienColumns();
    await ensureDotThucTapColumns();
    await ensurePhanCongThucTapTeacherEvalColumns();
  } catch (e) {
    console.error('❌ Lỗi khi đảm bảo cột DB:', e);
    throw e;
  }
}

module.exports = { ensureColumns };

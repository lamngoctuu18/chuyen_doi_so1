const { query, initializePool, closeConnections } = require('../src/database/connection');

(async () => {
  try {
    console.log('Starting migration: add internship columns to sinh_vien');

    const sqls = [
      `ALTER TABLE sinh_vien ADD COLUMN nguyen_vong_thuc_tap ENUM('khoa_gioi_thieu','tu_lien_he') DEFAULT NULL COMMENT 'Nguyen vong thuc tap'`,
      `ALTER TABLE sinh_vien ADD COLUMN cong_ty_tu_lien_he VARCHAR(255) DEFAULT NULL COMMENT 'Cong ty tu lien he'`,
      `ALTER TABLE sinh_vien ADD COLUMN dia_chi_cong_ty VARCHAR(500) DEFAULT NULL COMMENT 'Dia chi cong ty'`,
      `ALTER TABLE sinh_vien ADD COLUMN nguoi_lien_he_cong_ty VARCHAR(255) DEFAULT NULL COMMENT 'Nguoi lien he cong ty'`,
      `ALTER TABLE sinh_vien ADD COLUMN sdt_nguoi_lien_he VARCHAR(20) DEFAULT NULL COMMENT 'SDT nguoi lien he'
      `
    ];

    for (const sql of sqls) {
      try {
        console.log('Running:', sql);
        await query(sql);
        console.log('OK');
      } catch (err) {
        // If column exists, MySQL will throw - catch and continue
        console.warn('Warning (continuing):', err.message || err);
      }
    }

    console.log('Migration finished. Please verify in DB.');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await closeConnections();
  }
})();

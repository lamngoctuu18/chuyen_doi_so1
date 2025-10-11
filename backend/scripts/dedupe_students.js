const SinhVien = require('../src/models/SinhVien');

(async () => {
  try {
    const res = await SinhVien.deduplicateByMaSinhVien();
    console.log('Deduplicated sinh_vien by ma_sinh_vien, removed rows:', res.affectedRows || 0);
    process.exit(0);
  } catch (e) {
    console.error('Dedupe failed:', e);
    process.exit(1);
  }
})();

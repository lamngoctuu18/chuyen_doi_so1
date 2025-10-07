const db = require('../database/connection');

async function computeCountsFromProfiles() {
  const [svCountRow] = await db.query(`SELECT COUNT(*) AS c FROM sinh_vien WHERE COALESCE(don_vi_thuc_tap,'') <> ''`);
  const [gvCountRow] = await db.query(`SELECT COUNT(DISTINCT TRIM(LOWER(giang_vien_huong_dan))) AS c FROM sinh_vien WHERE COALESCE(giang_vien_huong_dan,'') <> ''`);
  const [dnCountRow] = await db.query(`SELECT COUNT(DISTINCT TRIM(LOWER(don_vi_thuc_tap))) AS c FROM sinh_vien WHERE COALESCE(don_vi_thuc_tap,'') <> ''`);
  return {
    so_sinh_vien_tham_gia: svCountRow.c || 0,
    so_giang_vien_huong_dan: gvCountRow.c || 0,
    so_doanh_nghiep_tham_gia: dnCountRow.c || 0,
  };
}

async function updateLatestActiveBatchCounts() {
  const [latest] = await db.query(`SELECT id FROM dot_thuc_tap WHERE trang_thai IN ('sap-mo','dang-dien-ra') ORDER BY thoi_gian_bat_dau DESC LIMIT 1`);
  if (!latest || !latest.id) return null;
  const counts = await computeCountsFromProfiles();
  await db.query(
    `UPDATE dot_thuc_tap SET so_sinh_vien_tham_gia=?, so_giang_vien_huong_dan=?, so_doanh_nghiep_tham_gia=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    [counts.so_sinh_vien_tham_gia, counts.so_giang_vien_huong_dan, counts.so_doanh_nghiep_tham_gia, latest.id]
  );
  return { id: latest.id, ...counts };
}

module.exports = { computeCountsFromProfiles, updateLatestActiveBatchCounts };

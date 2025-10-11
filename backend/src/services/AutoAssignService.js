// Service: Tự động phân công giảng viên hướng dẫn theo chỉ tiêu
// - Trưởng khoa: 2 SV, Phó khoa: 2 SV, Khác: 4 SV

const db = require('../database/connection');

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function capacityForPosition(chucVuRaw) {
  const s = (chucVuRaw || '').toLowerCase();
  if (s.includes('trưởng khoa') || s.includes('truong khoa')) return 2;
  if (s.includes('phó khoa') || s.includes('pho khoa')) return 2;
  return 4;
}

async function getLecturers() {
  const rows = await db.query(
    `SELECT id, ma_giang_vien, ho_ten, chuc_vu, COALESCE(so_sinh_vien_huong_dan, 0) AS so_sinh_vien_huong_dan
     FROM giang_vien`
  );
  return rows || [];
}

async function getAssignedCountsByName() {
  const rows = await db.query(
    `SELECT giang_vien_huong_dan AS ten, COUNT(*) AS cnt
     FROM sinh_vien
     WHERE giang_vien_huong_dan IS NOT NULL AND giang_vien_huong_dan <> ''
     GROUP BY giang_vien_huong_dan`
  );
  const map = new Map();
  for (const r of rows) map.set((r.ten || '').trim(), Number(r.cnt) || 0);
  return map;
}

async function getUnassignedStudentIds(limit = 100000) {
  const rows = await db.query(
    `SELECT id
     FROM sinh_vien
     WHERE (giang_vien_huong_dan IS NULL OR giang_vien_huong_dan = '')
     ORDER BY id ASC
     LIMIT ?`,
    [limit]
  );
  return rows.map(r => r.id);
}

async function assignStudentToLecturer(studentId, lecturerName) {
  await db.query(
    `UPDATE sinh_vien SET giang_vien_huong_dan = ?, updated_at = NOW() WHERE id = ?`,
    [lecturerName, studentId]
  );
}

async function recalcTeacherCounts() {
  // Cập nhật so_sinh_vien_huong_dan theo số lượng sinh viên có tên khớp
  await db.query(
    `UPDATE giang_vien gv
     LEFT JOIN (
       SELECT giang_vien_huong_dan AS ten, COUNT(*) AS so_luong
       FROM sinh_vien
       WHERE giang_vien_huong_dan IS NOT NULL AND giang_vien_huong_dan <> ''
       GROUP BY giang_vien_huong_dan
     ) sv ON sv.ten = gv.ho_ten
     SET gv.so_sinh_vien_huong_dan = COALESCE(sv.so_luong, 0), gv.updated_at = NOW()`
  );
}

/**
 * Tự động phân công giảng viên cho các sinh viên chưa có giảng viên
 * theo quota dựa trên chức vụ và random thứ tự giảng viên.
 * @returns summary object
 */
async function autoAssignLecturersByQuota() {
  const summary = {
    totalLecturers: 0,
    totalCapacity: 0,
    totalAssignedBefore: 0,
    availableSlots: 0,
    studentsNeedingAssignment: 0,
    assignedNow: 0,
    leftoverStudents: 0,
    details: [] // {hoTen, chucVu, capacity, before, assigned}
  };

  const [lecturers, countMap, unassigned] = await Promise.all([
    getLecturers(),
    getAssignedCountsByName(),
    getUnassignedStudentIds()
  ]);

  summary.totalLecturers = lecturers.length;
  summary.studentsNeedingAssignment = unassigned.length;

  // Chuẩn bị slots
  let slots = [];
  for (const gv of lecturers) {
    const cap = capacityForPosition(gv.chuc_vu);
    const before = countMap.get((gv.ho_ten || '').trim()) || 0;
    const avail = Math.max(0, cap - before);
    summary.totalCapacity += cap;
    summary.totalAssignedBefore += before;
    summary.availableSlots += avail;
    if (avail > 0) {
      for (let i = 0; i < avail; i++) slots.push(gv.ho_ten);
    }
    summary.details.push({ hoTen: gv.ho_ten, chucVu: gv.chuc_vu, capacity: cap, before, assigned: 0 });
  }

  if (slots.length === 0 || unassigned.length === 0) {
    // Không còn slot hoặc không có SV cần phân công
    await recalcTeacherCounts();
    return { ...summary, leftoverStudents: unassigned.length };
  }

  shuffle(slots);

  let assigned = 0;
  for (let i = 0; i < unassigned.length && i < slots.length; i++) {
    const studentId = unassigned[i];
    const lecturerName = slots[i];
    await assignStudentToLecturer(studentId, lecturerName);
    assigned++;
  }

  summary.assignedNow = assigned;
  summary.leftoverStudents = Math.max(0, unassigned.length - assigned);

  // Recalculate counts in giang_vien
  await recalcTeacherCounts();

  return summary;
}

module.exports = {
  autoAssignLecturersByQuota,
  capacityForPosition,
};

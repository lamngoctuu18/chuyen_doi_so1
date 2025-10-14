const path = require('path');
const fs = require('fs');
const TeacherSubmissions = require('../models/TeacherSubmissions');
const db = require('../database/connection');

// Try to decode multipart filename (often latin1) to utf8 to keep Vietnamese characters correct
const decodeFilename = (name) => {
  try {
    if (!name) return name;
    return Buffer.from(name, 'latin1').toString('utf8');
  } catch {
    return name;
  }
};

const sanitizeFilename = (name) => {
  if (!name) return 'file';
  // keep unicode letters; remove reserved characters and trim
  const base = path.basename(name);
  const cleaned = base
    .replace(/[\\/:*?"<>|]/g, '') // windows reserved
    .replace(/\s+/g, ' ')           // collapse spaces
    .trim();
  return cleaned || 'file';
};

// Ensure tables on first use
TeacherSubmissions.ensureTables().catch((e) => {
  console.error('Failed ensuring submission tables:', e.message);
});

module.exports = {
  // Teacher endpoints
  async createSlot(req, res) {
    try {
      const maGiangVien = req.user?.maGiangVien || req.user?.userId;
      if (!maGiangVien) return res.status(401).json({ message: 'Thiếu thông tin giảng viên' });
      const { tieu_de, loai_bao_cao = 'tuan', mo_ta, start_at, end_at } = req.body || {};
      if (!tieu_de || !start_at || !end_at) {
        return res.status(400).json({ message: 'Thiếu tieu_de/start_at/end_at' });
      }
      const { id } = await TeacherSubmissions.createSlot(maGiangVien, { tieu_de, loai_bao_cao, mo_ta, start_at, end_at });
      return res.json({ id });
    } catch (err) {
      console.error('createSlot error:', err);
      return res.status(500).json({ message: 'Lỗi tạo đợt nộp' });
    }
  },

  async listTeacherSlots(req, res) {
    try {
      const maGiangVien = req.user?.maGiangVien || req.user?.userId;
      const rows = await TeacherSubmissions.listSlotsByTeacher(maGiangVien);
      return res.json(rows);
    } catch (err) {
      console.error('listTeacherSlots error:', err);
      return res.status(500).json({ message: 'Lỗi lấy danh sách đợt nộp' });
    }
  },

  async getSlotStatuses(req, res) {
    try {
      const maGiangVien = req.user?.maGiangVien || req.user?.userId;
      const { slotId } = req.params;
      const data = await TeacherSubmissions.getSlotWithStatuses(Number(slotId), maGiangVien);
      return res.json(data);
    } catch (err) {
      console.error('getSlotStatuses error:', err);
      return res.status(500).json({ message: err.message || 'Lỗi lấy trạng thái bài nộp' });
    }
  },

  async commentSubmission(req, res) {
    try {
      const maGiangVien = req.user?.maGiangVien || req.user?.userId;
      const { submissionId } = req.params;
      const { comment, trang_thai } = req.body || {};
      await TeacherSubmissions.addTeacherComment(Number(submissionId), maGiangVien, comment || '', trang_thai);
      return res.json({ success: true });
    } catch (err) {
      console.error('commentSubmission error:', err);
      return res.status(500).json({ message: err.message || 'Lỗi cập nhật nhận xét' });
    }
  },

  async updateSlotTimes(req, res) {
    try {
      const maGiangVien = req.user?.maGiangVien || req.user?.userId;
      const { slotId } = req.params;
      const { start_at, end_at } = req.body || {};
      if (!start_at || !end_at) return res.status(400).json({ message: 'Thiếu start_at/end_at' });
      const start = new Date(start_at);
      const end = new Date(end_at);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return res.status(400).json({ message: 'Thời gian không hợp lệ' });
      if (start > end) return res.status(400).json({ message: 'start_at phải trước end_at' });

      // Ensure slot belongs to teacher
      const [slot] = await db.query(`SELECT id FROM dot_nop_bao_cao_theo_tuan WHERE id = ? AND ma_giang_vien = ?`, [Number(slotId), maGiangVien]);
      if (!slot) return res.status(404).json({ message: 'Không tìm thấy đợt nộp' });

      const r = await TeacherSubmissions.updateSlotTimes(maGiangVien, Number(slotId), { start_at, end_at });
      return res.json({ success: true, updated: r.affectedRows });
    } catch (err) {
      console.error('updateSlotTimes error:', err);
      return res.status(500).json({ message: 'Lỗi cập nhật thời gian' });
    }
  },

  // Student endpoints
  async listOpenSlotsForStudent(req, res) {
    try {
      const maSinhVien = req.user?.maSinhVien || req.user?.userId;
      if (!maSinhVien) return res.status(401).json({ message: 'Thiếu thông tin sinh viên' });
      const rows = await TeacherSubmissions.listOpenSlotsForStudent(maSinhVien);
      return res.json(rows);
    } catch (err) {
      console.error('listOpenSlotsForStudent error:', err);
      return res.status(500).json({ message: 'Lỗi lấy đợt nộp' });
    }
  },

  async listAllSlotsForStudent(req, res) {
    try {
      const maSinhVien = req.user?.maSinhVien || req.user?.userId;
      if (!maSinhVien) return res.status(401).json({ message: 'Thiếu thông tin sinh viên' });
      const rows = await TeacherSubmissions.listAllSlotsForStudent(maSinhVien);
      return res.json(rows);
    } catch (err) {
      console.error('listAllSlotsForStudent error:', err);
      return res.status(500).json({ message: 'Lỗi lấy danh sách đợt nộp' });
    }
  },

  async uploadSubmission(req, res) {
    try {
      const maSinhVien = req.user?.maSinhVien || req.user?.userId;
      const { slotId } = req.params;
      if (!maSinhVien) return res.status(401).json({ message: 'Thiếu thông tin sinh viên' });
      if (!req.file) return res.status(400).json({ message: 'Không có file tải lên' });

      // Enforce time window
      const [slot] = await db.query('SELECT * FROM dot_nop_bao_cao_theo_tuan WHERE id = ? LIMIT 1', [Number(slotId)]);
      if (!slot) return res.status(404).json({ message: 'Không tìm thấy đợt nộp' });
      const now = new Date();
      const start = new Date(slot.start_at);
      const end = new Date(slot.end_at);
      if (now < start) return res.status(400).json({ message: 'Đợt nộp chưa mở' });
      if (now > end) return res.status(400).json({ message: 'Đã hết thời gian nộp' });

      const uploadsRoot = path.join(process.cwd(), 'uploads', 'submissions', String(slotId));
      if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot, { recursive: true });
  const originalDecoded = sanitizeFilename(decodeFilename(req.file.originalname));
  const safeName = `${maSinhVien}-${Date.now()}-${originalDecoded}`;
      const destPath = path.join(uploadsRoot, safeName);
      fs.renameSync(req.file.path, destPath);

      const info = {
        file_path: destPath,
  original_name: originalDecoded,
        mime_type: req.file.mimetype,
        file_size: req.file.size
      };
      const { id } = await TeacherSubmissions.saveStudentSubmission(Number(slotId), maSinhVien, info);
      return res.json({ id, file: `/uploads/submissions/${slotId}/${safeName}` });
    } catch (err) {
      console.error('uploadSubmission error:', err);
      return res.status(500).json({ message: 'Lỗi nộp bài' });
    }
  }
  ,

  async uploadMultipleSubmissions(req, res) {
    try {
      const maSinhVien = req.user?.maSinhVien || req.user?.userId;
      const { slotId } = req.params;
      const files = Array.isArray(req.files) ? req.files : [];
      if (!maSinhVien) return res.status(401).json({ message: 'Thiếu thông tin sinh viên' });
      if (files.length === 0) return res.status(400).json({ message: 'Không có file tải lên' });

      const [slot] = await db.query('SELECT * FROM dot_nop_bao_cao_theo_tuan WHERE id = ? LIMIT 1', [Number(slotId)]);
      if (!slot) return res.status(404).json({ message: 'Không tìm thấy đợt nộp' });
      const now = new Date();
      const start = new Date(slot.start_at);
      const end = new Date(slot.end_at);
      if (now < start) return res.status(400).json({ message: 'Đợt nộp chưa mở' });
      if (now > end) return res.status(400).json({ message: 'Đã hết thời gian nộp' });

      const uploadsRoot = path.join(process.cwd(), 'uploads', 'submissions', String(slotId));
      if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot, { recursive: true });

      const results = [];
      for (const file of files) {
        const originalDecoded = sanitizeFilename(decodeFilename(file.originalname));
        const safeName = `${maSinhVien}-${Date.now()}-${originalDecoded}`;
        const destPath = path.join(uploadsRoot, safeName);
        fs.renameSync(file.path, destPath);
        const info = {
          file_path: destPath,
          original_name: originalDecoded,
          mime_type: file.mimetype,
          file_size: file.size
        };
        const { id } = await TeacherSubmissions.saveStudentSubmission(Number(slotId), maSinhVien, info);
        results.push({ id, file: `/uploads/submissions/${slotId}/${safeName}` });
      }

      return res.json({ success: true, uploaded: results.length, files: results });
    } catch (err) {
      console.error('uploadMultipleSubmissions error:', err);
      return res.status(500).json({ message: 'Lỗi nộp nhiều file' });
    }
  },

  async getAdvisorInfo(req, res) {
    try {
      const maSinhVien = req.user?.maSinhVien || req.user?.userId;
      if (!maSinhVien) return res.status(401).json({ message: 'Thiếu thông tin sinh viên' });
      const [row] = await db.query(
        `SELECT 
            svhd.ma_giang_vien,
            COALESCE(svhd.ten_giang_vien, gv.ho_ten) AS ten_giang_vien,
            svhd.doanh_nghiep_thuc_tap
         FROM sinh_vien_huong_dan svhd
         LEFT JOIN giang_vien gv ON gv.ma_giang_vien = svhd.ma_giang_vien
         WHERE svhd.ma_sinh_vien = ?
         LIMIT 1`,
        [maSinhVien]
      );
      return res.json(row || {});
    } catch (err) {
      console.error('getAdvisorInfo error:', err);
      return res.status(500).json({ message: 'Lỗi lấy thông tin giảng viên hướng dẫn' });
    }
  },

  async listMySubmissions(req, res) {
    try {
      const maSinhVien = req.user?.maSinhVien || req.user?.userId;
      const { slotId } = req.params;
      if (!maSinhVien) return res.status(401).json({ message: 'Thiếu thông tin sinh viên' });
      const rows = await TeacherSubmissions.listStudentSubmissions(Number(slotId), maSinhVien);
      return res.json(rows);
    } catch (err) {
      console.error('listMySubmissions error:', err);
      return res.status(500).json({ message: 'Lỗi lấy danh sách bài đã nộp' });
    }
  }
};

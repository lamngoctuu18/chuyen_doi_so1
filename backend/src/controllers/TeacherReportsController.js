const TeacherReports = require('../models/TeacherReports');

class TeacherReportsController {
  // GET /api/teacher-reports/supervision-overview - Admin: Lấy overview giảng viên hướng dẫn
  static async getSupervisionOverview(req, res) {
    try {
      const { status } = req.query; // 'da_cham_xong' | 'chua_cham_xong'

      const conn = require('../database/connection');

      // Compose overview using sinh_vien_huong_dan as the primary source
      // and derive grading status strictly from teacher-saved grades in phan_cong_thuc_tap
      const query = [
        'SELECT * FROM (',
        '  SELECT',
        '    gv.id AS giang_vien_id,',
        '    gv.ma_giang_vien,',
        '    gv.ho_ten AS ten_giang_vien,',
        '    gv.email_ca_nhan AS email,',
        '    gv.khoa,',
        '    gv.bo_mon,',
        '    COALESCE(svhd_counts.total_sv, 0) AS so_sinh_vien_huong_dan,',
        '    COALESCE(graded_counts.graded_sv, 0) AS so_sinh_vien_da_cham,',
        "    CASE WHEN COALESCE(svhd_counts.total_sv, 0) > 0 AND COALESCE(graded_counts.graded_sv, 0) = COALESCE(svhd_counts.total_sv, 0)",
        "         THEN 'da_cham_xong' ELSE 'chua_cham_xong' END AS trang_thai_cham_diem",
        '  FROM giang_vien gv',
        '  LEFT JOIN (',
        '    SELECT gv2.id AS giang_vien_id, COUNT(*) AS total_sv',
        '    FROM sinh_vien_huong_dan svhd',
        '    JOIN giang_vien gv2 ON gv2.ma_giang_vien = svhd.ma_giang_vien',
        '    GROUP BY gv2.id',
        '  ) AS svhd_counts ON svhd_counts.giang_vien_id = gv.id',
        '  LEFT JOIN (',
        '    SELECT pct.giang_vien_id, COUNT(DISTINCT pct.sinh_vien_id) AS graded_sv',
        '    FROM phan_cong_thuc_tap pct',
        '    WHERE pct.giang_vien_id IS NOT NULL',
        '      AND (pct.diem_giang_vien IS NOT NULL OR pct.diem_so IS NOT NULL)',
        '      AND (pct.nhan_xet_giang_vien IS NOT NULL OR pct.nhan_xet IS NOT NULL)',
        '    GROUP BY pct.giang_vien_id',
        '  ) AS graded_counts ON graded_counts.giang_vien_id = gv.id',
        ') AS t',
        'WHERE t.so_sinh_vien_huong_dan > 0',
        status === 'da_cham_xong' ? "AND t.trang_thai_cham_diem = 'da_cham_xong'" : '',
        status === 'chua_cham_xong' ? "AND t.trang_thai_cham_diem = 'chua_cham_xong'" : '',
        'ORDER BY t.ten_giang_vien ASC'
      ].filter(Boolean).join('\n');

  // Our DB helper returns rows directly, not [rows, fields]
  const teachers = await conn.query(query);
      
      res.json({
        success: true,
        data: teachers
      });
    } catch (error) {
      console.error('❌ Get supervision overview error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi lấy thông tin giám sát giảng viên: ' + error.message 
      });
    }
  }

  // GET /api/teacher-reports/teacher/:maGiangVien/students - Admin: Lấy chi tiết sinh viên của giảng viên
  static async getTeacherStudentDetails(req, res) {
    try {
      const { maGiangVien } = req.params;
      
      const conn = require('../database/connection');
      // Base the list on sinh_vien_huong_dan (thực tế phân công theo import)
      // Join the latest phan_cong_thuc_tap (if any) to get grading info saved by the teacher
      const query = `
        SELECT 
          sv.ma_sinh_vien,
          sv.ho_ten AS ten_sinh_vien,
          sv.lop,
          sv.email,
          COALESCE(dn.ten_cong_ty, svhd.doanh_nghiep_thuc_tap) AS ten_doanh_nghiep,
          dn.dia_chi_cong_ty AS dia_chi_doanh_nghiep,
          svhd.vi_tri_thuc_tap,
          pct.ngay_bat_dau,
          pct.ngay_ket_thuc,
          COALESCE(pct.diem_giang_vien, pct.diem_so) AS diem_giang_vien,
          COALESCE(pct.nhan_xet_giang_vien, pct.nhan_xet) AS nhan_xet_giang_vien,
          pct.trang_thai,
          CASE 
            WHEN (pct.diem_giang_vien IS NOT NULL OR pct.diem_so IS NOT NULL)
             AND (pct.nhan_xet_giang_vien IS NOT NULL OR pct.nhan_xet IS NOT NULL)
            THEN 'da_cham' ELSE 'chua_cham' END AS trang_thai_cham_diem
        FROM sinh_vien_huong_dan svhd
        JOIN giang_vien gv ON gv.ma_giang_vien = svhd.ma_giang_vien
        JOIN sinh_vien sv ON sv.ma_sinh_vien = svhd.ma_sinh_vien
        LEFT JOIN (
          SELECT p1.* FROM phan_cong_thuc_tap p1
          JOIN (
            SELECT sinh_vien_id, MAX(updated_at) AS max_updated
            FROM phan_cong_thuc_tap
            GROUP BY sinh_vien_id
          ) p2 ON p1.sinh_vien_id = p2.sinh_vien_id AND p1.updated_at = p2.max_updated
        ) pct ON pct.sinh_vien_id = sv.id AND (pct.giang_vien_id = gv.id OR pct.giang_vien_id IS NULL)
        LEFT JOIN doanh_nghiep dn ON dn.id = pct.doanh_nghiep_id
        WHERE svhd.ma_giang_vien = ?
        ORDER BY sv.ho_ten ASC
      `;

  // Our DB helper returns rows directly, not [rows, fields]
  const students = await conn.query(query, [maGiangVien]);
      
      res.json({
        success: true,
        data: students
      });
    } catch (error) {
      console.error('❌ Get teacher student details error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi lấy chi tiết sinh viên: ' + error.message 
      });
    }
  }

  // GET /api/teacher-reports/students - Lấy danh sách sinh viên hướng dẫn
  static async getStudents(req, res) {
    try {
  // Token payload uses camelCase keys in AuthController
  const maGiangVien = req.user?.maGiangVien || req.user?.userId;
      
      if (!maGiangVien) {
        return res.status(401).json({ 
          success: false, 
          message: 'Không tìm thấy thông tin giảng viên' 
        });
      }

      const students = await TeacherReports.getStudentsByTeacher(maGiangVien);
      
      res.json({
        success: true,
        data: students,
        total: students.length
      });
    } catch (error) {
      console.error('❌ Get students error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi lấy danh sách sinh viên: ' + error.message 
      });
    }
  }

  // POST /api/teacher-reports/students/:maSinhVien/grade
  static async gradeStudent(req, res) {
    try {
      const maGiangVien = req.user?.maGiangVien || req.user?.userId;
      const { maSinhVien } = req.params;
      const { diem_giang_vien, nhan_xet_giang_vien } = req.body || {};

      if (diem_giang_vien !== undefined && (Number(diem_giang_vien) < 0 || Number(diem_giang_vien) > 10)) {
        return res.status(400).json({ success: false, message: 'Điểm phải từ 0 đến 10' });
      }

      // Resolve ids
      const [sv] = await require('../database/connection').query(`SELECT id FROM sinh_vien WHERE ma_sinh_vien = ?`, [maSinhVien]);
      if (!sv) return res.status(404).json({ success: false, message: 'Không tìm thấy sinh viên' });
      const [gv] = await require('../database/connection').query(`SELECT id FROM giang_vien WHERE ma_giang_vien = ?`, [maGiangVien]);
      if (!gv) return res.status(403).json({ success: false, message: 'Không tìm thấy giảng viên' });

      // Find latest assignment for this student with this teacher; if not exists create minimal row
      const conn = require('../database/connection');
      let [pct] = await conn.query(`SELECT id FROM phan_cong_thuc_tap WHERE sinh_vien_id = ? AND giang_vien_id = ? ORDER BY updated_at DESC, id DESC LIMIT 1`, [sv.id, gv.id]);
      if (!pct) {
        // Try to infer current company and batch for a minimal insert
        const [companyRow] = await conn.query(`SELECT id FROM doanh_nghiep ORDER BY id DESC LIMIT 1`);
        const [batchRow] = await conn.query(`SELECT id, thoi_gian_bat_dau, thoi_gian_ket_thuc FROM dot_thuc_tap ORDER BY thoi_gian_bat_dau DESC LIMIT 1`);
        await conn.query(
          `INSERT INTO phan_cong_thuc_tap (sinh_vien_id, doanh_nghiep_id, dot_thuc_tap_id, giang_vien_id, ngay_bat_dau, ngay_ket_thuc, trang_thai, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 'dang-dien-ra', NOW(), NOW())`,
          [sv.id, companyRow?.id || null, batchRow?.id || null, gv.id, batchRow?.thoi_gian_bat_dau || null, batchRow?.thoi_gian_ket_thuc || null]
        );
        [pct] = await conn.query(`SELECT id FROM phan_cong_thuc_tap WHERE sinh_vien_id = ? AND giang_vien_id = ? ORDER BY updated_at DESC, id DESC LIMIT 1`, [sv.id, gv.id]);
      }

      // Try to update teacher-specific columns; if not present, fallback to diem_so/nhan_xet
      try {
        await conn.query(
          `UPDATE phan_cong_thuc_tap SET diem_giang_vien = COALESCE(?, diem_giang_vien), nhan_xet_giang_vien = COALESCE(?, nhan_xet_giang_vien), updated_at = NOW() WHERE id = ?`,
          [diem_giang_vien ?? null, nhan_xet_giang_vien ?? null, pct.id]
        );
      } catch (err) {
        if (err && err.code === 'ER_BAD_FIELD_ERROR') {
          await conn.query(
            `UPDATE phan_cong_thuc_tap SET diem_so = COALESCE(?, diem_so), nhan_xet = COALESCE(?, nhan_xet), updated_at = NOW() WHERE id = ?`,
            [diem_giang_vien ?? null, nhan_xet_giang_vien ?? null, pct.id]
          );
        } else {
          throw err;
        }
      }

      // Return latest evaluation for this student
      let [result] = await conn.query(
        `SELECT pct.diem_giang_vien, pct.nhan_xet_giang_vien, pct.updated_at AS updated_at FROM phan_cong_thuc_tap pct WHERE pct.id = ?`,
        [pct.id]
      );
      if (!result || (result.diem_giang_vien === undefined && result.nhan_xet_giang_vien === undefined)) {
        const [fallback] = await conn.query(
          `SELECT pct.diem_so AS diem_giang_vien, pct.nhan_xet AS nhan_xet_giang_vien, pct.updated_at AS updated_at FROM phan_cong_thuc_tap pct WHERE pct.id = ?`,
          [pct.id]
        );
        result = fallback;
      }
      res.json({ success: true, message: 'Đã lưu chấm điểm', data: result });
    } catch (error) {
      console.error('❌ Grade student error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server khi chấm điểm' });
    }
  }

  // GET /api/teacher-reports/students/:maSinhVien/evaluation
  static async getStudentEvaluation(req, res) {
    try {
      const maGiangVien = req.user?.maGiangVien || req.user?.userId;
      const { maSinhVien } = req.params;
      const conn = require('../database/connection');
      const [sv] = await conn.query(`SELECT id FROM sinh_vien WHERE ma_sinh_vien = ?`, [maSinhVien]);
      if (!sv) return res.status(404).json({ success: false, message: 'Không tìm thấy sinh viên' });
      let rows = await conn.query(
        `SELECT pct.diem_giang_vien, pct.nhan_xet_giang_vien, pct.updated_at AS updated_at FROM phan_cong_thuc_tap pct
         LEFT JOIN giang_vien gv ON gv.id = pct.giang_vien_id
         WHERE pct.sinh_vien_id = ? AND gv.ma_giang_vien = ? ORDER BY pct.updated_at DESC LIMIT 1`,
        [sv.id, maGiangVien]
      );
      if (rows && rows.length && rows[0].diem_giang_vien === undefined) {
        rows = await conn.query(
          `SELECT pct.diem_so AS diem_giang_vien, pct.nhan_xet AS nhan_xet_giang_vien, pct.updated_at AS updated_at FROM phan_cong_thuc_tap pct
           LEFT JOIN giang_vien gv ON gv.id = pct.giang_vien_id
           WHERE pct.sinh_vien_id = ? AND gv.ma_giang_vien = ? ORDER BY pct.updated_at DESC LIMIT 1`,
          [sv.id, maGiangVien]
        );
      }
      res.json({ success: true, data: rows?.[0] || null });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // GET /api/teacher-reports/student/evaluation (student self-view)
  static async getMyEvaluation(req, res) {
    try {
      const maSinhVien = req.user?.maSinhVien || req.user?.userId;
      const conn = require('../database/connection');
      const [sv] = await conn.query(`SELECT id FROM sinh_vien WHERE ma_sinh_vien = ?`, [maSinhVien]);
      if (!sv) return res.json({ success: true, data: null });
      let rows = await conn.query(
        `SELECT pct.diem_giang_vien, pct.nhan_xet_giang_vien, pct.updated_at AS updated_at FROM phan_cong_thuc_tap pct WHERE pct.sinh_vien_id = ? ORDER BY pct.updated_at DESC LIMIT 1`,
        [sv.id]
      );
      if (rows && rows.length && rows[0].diem_giang_vien === undefined) {
        rows = await conn.query(
          `SELECT pct.diem_so AS diem_giang_vien, pct.nhan_xet AS nhan_xet_giang_vien, pct.updated_at AS updated_at FROM phan_cong_thuc_tap pct WHERE pct.sinh_vien_id = ? ORDER BY pct.updated_at DESC LIMIT 1`,
          [sv.id]
        );
      }
      res.json({ success: true, data: rows?.[0] || null });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // GET /api/teacher-reports/export-evaluations - CSV export
  static async exportEvaluations(req, res) {
    try {
      const maGiangVien = req.user?.maGiangVien || req.user?.userId;
      const conn = require('../database/connection');
      let rows = await conn.query(
        `SELECT sv.ma_sinh_vien, sv.ho_ten, sv.lop, COALESCE(dn.ten_cong_ty,'') AS ten_cong_ty,
                pct.diem_giang_vien, pct.nhan_xet_giang_vien
         FROM phan_cong_thuc_tap pct
         JOIN sinh_vien sv ON sv.id = pct.sinh_vien_id
         LEFT JOIN giang_vien gv ON gv.id = pct.giang_vien_id
         LEFT JOIN doanh_nghiep dn ON dn.id = pct.doanh_nghiep_id
         WHERE gv.ma_giang_vien = ?
         ORDER BY sv.lop, sv.ma_sinh_vien`,
        [maGiangVien]
      );
      if (rows && rows.length && rows[0].diem_giang_vien === undefined) {
        rows = await conn.query(
          `SELECT sv.ma_sinh_vien, sv.ho_ten, sv.lop, COALESCE(dn.ten_cong_ty,'') AS ten_cong_ty,
                  pct.diem_so AS diem_giang_vien, pct.nhan_xet AS nhan_xet_giang_vien
           FROM phan_cong_thuc_tap pct
           JOIN sinh_vien sv ON sv.id = pct.sinh_vien_id
           LEFT JOIN giang_vien gv ON gv.id = pct.giang_vien_id
           LEFT JOIN doanh_nghiep dn ON dn.id = pct.doanh_nghiep_id
           WHERE gv.ma_giang_vien = ?
           ORDER BY sv.lop, sv.ma_sinh_vien`,
          [maGiangVien]
        );
      }
      const header = 'ma_sinh_vien,ho_ten,lop,ten_cong_ty,diem_giang_vien,nhan_xet_giang_vien\n';
      const body = rows.map(r => [r.ma_sinh_vien, r.ho_ten, r.lop, r.ten_cong_ty, r.diem_giang_vien ?? '', (r.nhan_xet_giang_vien || '').replace(/\n/g,' ')]
        .map(x => typeof x === 'string' && x.includes(',') ? `"${x.replace(/"/g,'""')}"` : x)
        .join(',')).join('\n');
      const csv = header + body;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="teacher-evaluations.csv"');
      res.send('\ufeff' + csv);
    } catch (e) {
      res.status(500).json({ success: false, message: 'Lỗi xuất file' });
    }
  }

  // GET /api/teacher-reports/stats - Lấy thống kê báo cáo
  static async getStats(req, res) {
    try {
  const maGiangVien = req.user?.maGiangVien || req.user?.userId;
      
      if (!maGiangVien) {
        return res.status(401).json({ 
          success: false, 
          message: 'Không tìm thấy thông tin giảng viên' 
        });
      }

      const stats = await TeacherReports.getTeacherReportsStats(maGiangVien);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ Get teacher stats error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi lấy thống kê: ' + error.message 
      });
    }
  }

  // POST /api/teacher-reports - Tạo báo cáo mới
  static async createReport(req, res) {
    try {
  const maGiangVien = req.user?.maGiangVien || req.user?.userId;
      
      if (!maGiangVien) {
        return res.status(401).json({ 
          success: false, 
          message: 'Không tìm thấy thông tin giảng viên' 
        });
      }

      const reportData = {
        ...req.body,
        nguoi_nop_id: maGiangVien
      };

      const result = await TeacherReports.createReport(reportData);
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'Tạo báo cáo thành công'
      });
    } catch (error) {
      console.error('❌ Create report error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi tạo báo cáo: ' + error.message 
      });
    }
  }

  // GET /api/teacher-reports - Lấy danh sách báo cáo đã nộp
  static async getReports(req, res) {
    try {
  const maGiangVien = req.user?.maGiangVien || req.user?.userId;
      
      if (!maGiangVien) {
        return res.status(401).json({ 
          success: false, 
          message: 'Không tìm thấy thông tin giảng viên' 
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await TeacherReports.getSubmittedReports(maGiangVien, page, limit);
      
      res.json({
        success: true,
        data: result.reports,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('❌ Get reports error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi lấy danh sách báo cáo: ' + error.message 
      });
    }
  }
}

module.exports = TeacherReportsController;
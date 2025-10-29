const db = require('../database/connection');

class AdminReports {
  // Get reports statistics for admin dashboard
  static async getReportsStats() {
    try {
      const [stats] = await db.query(`
        SELECT 
          (SELECT COUNT(*) FROM bao_cao WHERE loai_bao_cao = 'tuan') as total_weekly_reports,
          (SELECT COUNT(*) FROM bao_cao WHERE loai_bao_cao = 'cuoi-ky') as total_final_reports,
          (SELECT COUNT(*) FROM bao_cao WHERE trang_thai = 'da-nop') as submitted_reports,
          (SELECT COUNT(*) FROM bao_cao WHERE trang_thai = 'chua-nop') as pending_reports,
          (SELECT COUNT(*) FROM bai_nop_cua_sinh_vien) as total_submissions,
          (SELECT AVG(diem) FROM bao_cao WHERE diem IS NOT NULL) as average_score
      `);

      return stats[0];
    } catch (error) {
      throw new Error(`Lỗi khi lấy thống kê báo cáo: ${error.message}`);
    }
  }

  // Get all submitted reports with pagination and filtering
  static async getSubmittedReports(page = 1, limit = 20, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      let whereConditions = [];
      let params = [];

      // Build WHERE conditions
      if (filters.submitterType) {
        whereConditions.push('bncsv.loai_bai_nop = ?');
        params.push(filters.submitterType);
      }

      if (filters.status) {
        whereConditions.push('bncsv.trang_thai = ?');
        params.push(filters.status);
      }

      if (filters.search) {
        whereConditions.push('(sv.ho_ten LIKE ? OR sv.ma_sinh_vien LIKE ?)');
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      // Count total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM bai_nop_cua_sinh_vien bncsv
        LEFT JOIN sinh_vien sv ON bncsv.sinh_vien_id = sv.id
        ${whereClause}
      `;
      
      const [countResult] = await db.query(countQuery, params);
      const total = countResult[0].total;

      // Get paginated data
      const dataQuery = `
        SELECT 
          bncsv.*,
          sv.ho_ten as ten_sinh_vien,
          sv.ma_sinh_vien,
          sv.email as email_sinh_vien,
          dt.ten_dot,
          dt.nam_hoc
        FROM bai_nop_cua_sinh_vien bncsv
        LEFT JOIN sinh_vien sv ON bncsv.sinh_vien_id = sv.id
        LEFT JOIN dot_thuc_tap dt ON bncsv.dot_thuc_tap_id = dt.id
        ${whereClause}
        ORDER BY bncsv.ngay_nop DESC
        LIMIT ? OFFSET ?
      `;

      params.push(limit, offset);
      const [reports] = await db.query(dataQuery, params);

      return {
        reports,
        pagination: {
          currentPage: page,
          pageSize: limit,
          totalPages: Math.ceil(total / limit),
          totalItems: total
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy danh sách báo cáo đã nộp: ${error.message}`);
    }
  }

  // Get report details by ID
  static async getReportDetails(reportId) {
    try {
      const query = `
        SELECT 
          bc.*,
          sv.ho_ten as ten_sinh_vien,
          sv.ma_sinh_vien,
          sv.email as email_sinh_vien,
          gv.ho_ten as ten_giang_vien,
          gv.email as email_giang_vien,
          dn.ten_doanh_nghiep,
          dt.ten_dot,
          dt.nam_hoc
        FROM bao_cao bc
        LEFT JOIN phan_cong_thuc_tap pct ON bc.phan_cong_thuc_tap_id = pct.id
        LEFT JOIN sinh_vien sv ON pct.sinh_vien_id = sv.id
        LEFT JOIN giang_vien gv ON pct.giang_vien_id = gv.id
        LEFT JOIN doanh_nghiep dn ON pct.doanh_nghiep_id = dn.id
        LEFT JOIN dot_thuc_tap dt ON pct.dot_thuc_tap_id = dt.id
        WHERE bc.id = ?
      `;

      const [reports] = await db.query(query, [reportId]);

      if (reports.length === 0) {
        throw new Error('Không tìm thấy báo cáo');
      }

      return reports[0];
    } catch (error) {
      throw new Error(`Lỗi khi lấy chi tiết báo cáo: ${error.message}`);
    }
  }

  // Get reports by student
  static async getReportsByStudent(studentId, filters = {}) {
    try {
      const { page = 1, limit = 20, loai_bao_cao, dot_thuc_tap_id } = filters;
      const offset = (page - 1) * limit;

      let whereConditions = ['pct.sinh_vien_id = ?'];
      let params = [studentId];

      if (loai_bao_cao) {
        whereConditions.push('bc.loai_bao_cao = ?');
        params.push(loai_bao_cao);
      }

      if (dot_thuc_tap_id) {
        whereConditions.push('pct.dot_thuc_tap_id = ?');
        params.push(dot_thuc_tap_id);
      }

      const whereClause = 'WHERE ' + whereConditions.join(' AND ');

      // Count total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM bao_cao bc
        LEFT JOIN phan_cong_thuc_tap pct ON bc.phan_cong_thuc_tap_id = pct.id
        ${whereClause}
      `;

      const [countResult] = await db.query(countQuery, params);
      const total = countResult[0].total;

      // Get data
      const dataQuery = `
        SELECT 
          bc.*,
          dt.ten_dot,
          dt.nam_hoc,
          gv.ho_ten as ten_giang_vien,
          dn.ten_doanh_nghiep
        FROM bao_cao bc
        LEFT JOIN phan_cong_thuc_tap pct ON bc.phan_cong_thuc_tap_id = pct.id
        LEFT JOIN dot_thuc_tap dt ON pct.dot_thuc_tap_id = dt.id
        LEFT JOIN giang_vien gv ON pct.giang_vien_id = gv.id
        LEFT JOIN doanh_nghiep dn ON pct.doanh_nghiep_id = dn.id
        ${whereClause}
        ORDER BY bc.created_at DESC
        LIMIT ? OFFSET ?
      `;

      params.push(limit, offset);
      const [reports] = await db.query(dataQuery, params);

      return {
        reports,
        pagination: {
          currentPage: page,
          pageSize: limit,
          totalPages: Math.ceil(total / limit),
          totalItems: total
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy báo cáo của sinh viên: ${error.message}`);
    }
  }

  // Get reports by internship batch
  static async getReportsByBatch(batchId, filters = {}) {
    try {
      const { page = 1, limit = 20, loai_bao_cao, trang_thai } = filters;
      const offset = (page - 1) * limit;

      let whereConditions = ['pct.dot_thuc_tap_id = ?'];
      let params = [batchId];

      if (loai_bao_cao) {
        whereConditions.push('bc.loai_bao_cao = ?');
        params.push(loai_bao_cao);
      }

      if (trang_thai) {
        whereConditions.push('bc.trang_thai = ?');
        params.push(trang_thai);
      }

      const whereClause = 'WHERE ' + whereConditions.join(' AND ');

      // Count total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM bao_cao bc
        LEFT JOIN phan_cong_thuc_tap pct ON bc.phan_cong_thuc_tap_id = pct.id
        ${whereClause}
      `;

      const [countResult] = await db.query(countQuery, params);
      const total = countResult[0].total;

      // Get data
      const dataQuery = `
        SELECT 
          bc.*,
          sv.ho_ten as ten_sinh_vien,
          sv.ma_sinh_vien,
          gv.ho_ten as ten_giang_vien,
          dn.ten_doanh_nghiep
        FROM bao_cao bc
        LEFT JOIN phan_cong_thuc_tap pct ON bc.phan_cong_thuc_tap_id = pct.id
        LEFT JOIN sinh_vien sv ON pct.sinh_vien_id = sv.id
        LEFT JOIN giang_vien gv ON pct.giang_vien_id = gv.id
        LEFT JOIN doanh_nghiep dn ON pct.doanh_nghiep_id = dn.id
        ${whereClause}
        ORDER BY bc.created_at DESC
        LIMIT ? OFFSET ?
      `;

      params.push(limit, offset);
      const [reports] = await db.query(dataQuery, params);

      return {
        reports,
        pagination: {
          currentPage: page,
          pageSize: limit,
          totalPages: Math.ceil(total / limit),
          totalItems: total
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy báo cáo theo đợt: ${error.message}`);
    }
  }

  // Update report score and feedback
  static async updateReportGrade(reportId, gradeData) {
    try {
      const { diem, nhan_xet } = gradeData;

      const query = `
        UPDATE bao_cao 
        SET diem = ?, nhan_xet = ?, updated_at = NOW()
        WHERE id = ?
      `;

      const [result] = await db.query(query, [diem, nhan_xet, reportId]);

      if (result.affectedRows === 0) {
        throw new Error('Không tìm thấy báo cáo để cập nhật');
      }

      return await this.getReportDetails(reportId);
    } catch (error) {
      throw new Error(`Lỗi khi chấm điểm báo cáo: ${error.message}`);
    }
  }

  // Delete a report
  static async deleteReport(reportId) {
    try {
      const query = 'DELETE FROM bao_cao WHERE id = ?';
      const [result] = await db.query(query, [reportId]);

      if (result.affectedRows === 0) {
        throw new Error('Không tìm thấy báo cáo để xóa');
      }

      return { success: true, message: 'Xóa báo cáo thành công' };
    } catch (error) {
      throw new Error(`Lỗi khi xóa báo cáo: ${error.message}`);
    }
  }

  // Get submission statistics by batch
  static async getSubmissionStatsByBatch(batchId) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT pct.sinh_vien_id) as total_students,
          COUNT(bc.id) as total_reports,
          SUM(CASE WHEN bc.trang_thai = 'da-nop' THEN 1 ELSE 0 END) as submitted_count,
          SUM(CASE WHEN bc.trang_thai = 'chua-nop' THEN 1 ELSE 0 END) as pending_count,
          SUM(CASE WHEN bc.loai_bao_cao = 'tuan' THEN 1 ELSE 0 END) as weekly_count,
          SUM(CASE WHEN bc.loai_bao_cao = 'cuoi-ky' THEN 1 ELSE 0 END) as final_count,
          AVG(bc.diem) as average_score
        FROM phan_cong_thuc_tap pct
        LEFT JOIN bao_cao bc ON bc.phan_cong_thuc_tap_id = pct.id
        WHERE pct.dot_thuc_tap_id = ?
      `;

      const [stats] = await db.query(query, [batchId]);

      return stats[0];
    } catch (error) {
      throw new Error(`Lỗi khi lấy thống kê nộp báo cáo: ${error.message}`);
    }
  }
}

module.exports = AdminReports;

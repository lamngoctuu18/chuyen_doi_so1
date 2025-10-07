const db = require('../database/connection');

class AdminReportsModel {
  // Get statistics for admin dashboard
  static async getReportsStats() {
    try {
      // Get total teachers
      const [teachersResult] = await db.query(
        'SELECT COUNT(*) as total FROM giang_vien WHERE trang_thai = "active"'
      );
      const totalTeachers = teachersResult[0].total;

      // Get teachers who have submitted reports (from bao_cao_da_nop table)
      const [submittedTeachersResult] = await db.query(`
        SELECT COUNT(DISTINCT ma_nguoi_nop) as submitted 
        FROM bao_cao_da_nop 
        WHERE loai_nguoi_nop = 'giang_vien' 
        AND trang_thai IN ('da_nop', 'da_duyet')
      `);
      const submittedTeacherReports = submittedTeachersResult[0].submitted;

      // Get total companies that have students
      const [companiesResult] = await db.query(`
        SELECT COUNT(DISTINCT doanh_nghiep_id) as total 
        FROM phan_cong_thuc_tap 
        WHERE doanh_nghiep_id IS NOT NULL
      `);
      const totalCompanies = companiesResult[0].total;

      // Get companies who have submitted reports
      const [submittedCompaniesResult] = await db.query(`
        SELECT COUNT(DISTINCT ma_doanh_nghiep) as submitted 
        FROM bao_cao 
        WHERE loai_nguoi_nop = 'doanh_nghiep' 
        AND trang_thai IN ('da_nop', 'da_duyet')
      `);
      const submittedCompanyReports = submittedCompaniesResult[0].submitted;

      // Get total students and completed internships
      const [studentsResult] = await db.query(
        'SELECT COUNT(*) as total FROM sinh_vien WHERE trang_thai = "active"'
      );
      const totalStudents = studentsResult[0].total;

      const [completedResult] = await db.query(`
        SELECT COUNT(*) as completed 
        FROM phan_cong_thuc_tap 
        WHERE trang_thai = 'hoan_thanh'
      `);
      const completedInternships = completedResult[0].completed;

      return {
        totalTeachers,
        submittedTeacherReports,
        totalCompanies,
        submittedCompanyReports,
        totalStudents,
        completedInternships
      };
    } catch (error) {
      console.error('Error getting reports stats:', error);
      throw error;
    }
  }

  // Get all submitted reports with pagination and filtering
  static async getSubmittedReports(page = 1, limit = 20, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const queryParams = [];

      // Apply filters
      if (filters.submitterType) {
        whereClause += ' AND loai_nguoi_nop = ?';
        queryParams.push(filters.submitterType);
      }

      if (filters.status) {
        whereClause += ' AND trang_thai = ?';
        queryParams.push(filters.status);
      }

      if (filters.search) {
        whereClause += ' AND (tieu_de LIKE ? OR ten_nguoi_nop LIKE ? OR ma_nguoi_nop LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }

      // Get reports with pagination
      const query = `
        SELECT 
          id,
          tieu_de as title,
          loai_nguoi_nop as submitterType,
          ma_nguoi_nop as submitterCode,
          ten_nguoi_nop as submitterName,
          ngay_nop as submittedDate,
          trang_thai as status,
          file_url as fileUrl,
          so_sinh_vien as studentCount,
          ky_thuc_tap as internshipPeriod,
          ghi_chu as notes,
          created_at as createdAt,
          updated_at as updatedAt
        FROM bao_cao_da_nop 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      queryParams.push(limit, offset);
      const reports = await db.query(query, queryParams);

      // Get total count for pagination
      const countQuery = `SELECT COUNT(*) as total FROM bao_cao_da_nop ${whereClause}`;
      const [countResult] = await db.query(countQuery, queryParams.slice(0, -2));
      const total = countResult[0].total;

      return {
        reports,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting submitted reports:', error);
      throw error;
    }
  }

  // Get detailed report by ID
  static async getReportById(id) {
    try {
      const [report] = await db.query(`
        SELECT 
          id,
          tieu_de as title,
          loai_nguoi_nop as submitterType,
          ma_nguoi_nop as submitterCode,
          ten_nguoi_nop as submitterName,
          ngay_nop as submittedDate,
          trang_thai as status,
          file_url as fileUrl,
          so_sinh_vien as studentCount,
          ky_thuc_tap as internshipPeriod,
          noi_dung as content,
          ghi_chu as notes,
          nguoi_duyet as approvedBy,
          ngay_duyet as approvedDate,
          ly_do_tu_choi as rejectionReason,
          created_at as createdAt,
          updated_at as updatedAt
        FROM bao_cao_da_nop 
        WHERE id = ?
      `, [id]);

      if (!report) {
        throw new Error('Report not found');
      }

      return report;
    } catch (error) {
      console.error('Error getting report by ID:', error);
      throw error;
    }
  }

  // Approve a report
  static async approveReport(id, approvedBy) {
    try {
      const result = await db.query(`
        UPDATE bao_cao_da_nop 
        SET 
          trang_thai = 'da_duyet',
          nguoi_duyet = ?,
          ngay_duyet = NOW(),
          updated_at = NOW()
        WHERE id = ?
      `, [approvedBy, id]);

      if (result.affectedRows === 0) {
        throw new Error('Report not found');
      }

      return { success: true, message: 'Report approved successfully' };
    } catch (error) {
      console.error('Error approving report:', error);
      throw error;
    }
  }

  // Reject a report
  static async rejectReport(id, rejectedBy, reason) {
    try {
      const result = await db.query(`
        UPDATE bao_cao_da_nop 
        SET 
          trang_thai = 'tu_choi',
          nguoi_duyet = ?,
          ngay_duyet = NOW(),
          ly_do_tu_choi = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [rejectedBy, reason, id]);

      if (result.affectedRows === 0) {
        throw new Error('Report not found');
      }

      return { success: true, message: 'Report rejected successfully' };
    } catch (error) {
      console.error('Error rejecting report:', error);
      throw error;
    }
  }

  // Get teachers who haven't submitted reports
  static async getTeachersWithoutReports(dotThucTapId) {
    try {
      const query = `
        SELECT 
          gv.ma_giang_vien,
          gv.ho_ten,
          gv.email,
          gv.so_sinh_vien_huong_dan,
          COALESCE(bc.trang_thai, 'chua_nop') as report_status
        FROM giang_vien gv
        LEFT JOIN bao_cao_da_nop bc ON gv.ma_giang_vien = bc.ma_nguoi_nop 
          AND bc.loai_nguoi_nop = 'giang_vien'
          AND bc.dot_thuc_tap_id = ?
        WHERE gv.trang_thai = 'active'
          AND gv.so_sinh_vien_huong_dan > 0
        ORDER BY gv.ho_ten
      `;

      const teachers = await db.query(query, [dotThucTapId]);
      return teachers;
    } catch (error) {
      console.error('Error getting teachers without reports:', error);
      throw error;
    }
  }

  // Get companies who haven't submitted reports
  static async getCompaniesWithoutReports(dotThucTapId) {
    try {
      const query = `
        SELECT DISTINCT
          dn.ma_doanh_nghiep,
          dn.ten_doanh_nghiep,
          dn.email,
          COUNT(pct.sinh_vien_id) as student_count,
          COALESCE(bc.trang_thai, 'chua_nop') as report_status
        FROM doanh_nghiep dn
        INNER JOIN phan_cong_thuc_tap pct ON dn.id = pct.doanh_nghiep_id
        LEFT JOIN bao_cao_da_nop bc ON dn.ma_doanh_nghiep = bc.ma_nguoi_nop 
          AND bc.loai_nguoi_nop = 'doanh_nghiep'
          AND bc.dot_thuc_tap_id = ?
        WHERE dn.trang_thai = 'active'
          AND pct.dot_thuc_tap_id = ?
        GROUP BY dn.id, dn.ma_doanh_nghiep, dn.ten_doanh_nghiep, dn.email, bc.trang_thai
        ORDER BY dn.ten_doanh_nghiep
      `;

      const companies = await db.query(query, [dotThucTapId, dotThucTapId]);
      return companies;
    } catch (error) {
      console.error('Error getting companies without reports:', error);
      throw error;
    }
  }
}

module.exports = AdminReportsModel;
const mysql = require('mysql2/promise');
const dbConfig = require('../database/config');

class CompanyInternshipService {
  constructor() {
    this.dbConfig = dbConfig;
  }

  async createConnection() {
    return await mysql.createConnection(this.dbConfig);
  }

  // Lấy thông tin doanh nghiệp từ user ID
  async getCompanyByUserId(userId) {
    const connection = await this.createConnection();
    try {
      const [rows] = await connection.execute(
  `SELECT dn.*, acc.user_id as username, acc.email 
   FROM doanh_nghiep dn 
   JOIN accounts acc ON dn.account_id = acc.id 
   WHERE acc.id = ?`,
        [userId]
      );
      return rows[0] || null;
    } finally {
      await connection.end();
    }
  }

  // Lấy danh sách sinh viên được phân công cho doanh nghiệp
  async getAssignedStudents(companyId, filters = {}) {
    const connection = await this.createConnection();
    try {
      let whereConditions = ['pct.doanh_nghiep_id = ?'];
      let params = [companyId];
      
      // Thêm điều kiện tìm kiếm
      if (filters.search) {
        whereConditions.push(`(sv.ho_ten LIKE ? OR sv.ma_sinh_vien LIKE ? OR sv.email LIKE ?)`);
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (filters.batchId) {
        whereConditions.push('pct.dot_thuc_tap_id = ?');
        params.push(filters.batchId);
      }

      if (filters.status) {
        whereConditions.push('sv.trang_thai_thuc_tap = ?');
        params.push(filters.status);
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      const query = `
        SELECT 
          sv.*,
          pct.id as assignment_id,
          pct.ngay_phan_cong,
          pct.ghi_chu as assignment_note,
          pct.diem_so AS diem_danh_gia,
          pct.nhan_xet AS nhan_xet_doanh_nghiep,
          dtt.ten_dot,
          dtt.ngay_bat_dau,
          dtt.ngay_ket_thuc,
          dtt.so_tuan_thuc_tap,
          dn.ten_doanh_nghiep,
          gv.ho_ten as ten_giang_vien
        FROM phan_cong_thuc_tap pct
        JOIN sinh_vien sv ON pct.sinh_vien_id = sv.id
        JOIN dot_thuc_tap dtt ON pct.dot_thuc_tap_id = dtt.id
        JOIN doanh_nghiep dn ON pct.doanh_nghiep_id = dn.id
        LEFT JOIN giang_vien gv ON sv.giang_vien_id = gv.id
        ${whereClause}
        ORDER BY pct.ngay_phan_cong DESC, sv.ho_ten ASC
      `;

      const [rows] = await connection.execute(query, params);
      return rows;
    } finally {
      await connection.end();
    }
  }

  // Cập nhật đánh giá sinh viên từ doanh nghiệp
  async updateStudentEvaluation(assignmentId, companyId, evaluationData) {
    const connection = await this.createConnection();
    try {
      // Kiểm tra quyền của doanh nghiệp
      const [checkRows] = await connection.execute(
        'SELECT id FROM phan_cong_thuc_tap WHERE id = ? AND doanh_nghiep_id = ?',
        [assignmentId, companyId]
      );

      if (checkRows.length === 0) {
        throw new Error('Không có quyền cập nhật đánh giá cho sinh viên này');
      }

      // Cập nhật đánh giá
      const [result] = await connection.execute(
        `UPDATE phan_cong_thuc_tap 
         SET diem_so = ?, nhan_xet = ?, updated_at = NOW()
         WHERE id = ? AND doanh_nghiep_id = ?`,
        [
          evaluationData.diem_danh_gia,
          evaluationData.nhan_xet_doanh_nghiep,
          assignmentId,
          companyId
        ]
      );

      return result.affectedRows > 0;
    } finally {
      await connection.end();
    }
  }

  // Lấy thống kê thực tập của doanh nghiệp
  async getInternshipStats(companyId) {
    const connection = await this.createConnection();
    try {
      // Thống kê tổng quan
      const [overallStats] = await connection.execute(
        `SELECT 
          COUNT(*) as total_students,
          COUNT(CASE WHEN sv.trang_thai_thuc_tap = 'dang_thuc_tap' THEN 1 END) as active_students,
          COUNT(CASE WHEN sv.trang_thai_thuc_tap = 'hoan_thanh' THEN 1 END) as completed_students,
          COUNT(CASE WHEN sv.trang_thai_thuc_tap = 'dang_cho' THEN 1 END) as pending_students,
          AVG(pct.diem_so) as avg_rating
         FROM phan_cong_thuc_tap pct
         JOIN sinh_vien sv ON pct.sinh_vien_id = sv.id
         WHERE pct.doanh_nghiep_id = ?`,
        [companyId]
      );

      // Thống kê theo đợt thực tập
      const [batchStats] = await connection.execute(
        `SELECT 
          dtt.ten_dot,
          dtt.ngay_bat_dau,
          dtt.ngay_ket_thuc,
          COUNT(pct.id) as student_count,
          COUNT(CASE WHEN sv.trang_thai_thuc_tap = 'hoan_thanh' THEN 1 END) as completed_count,
          AVG(pct.diem_so) as avg_rating
         FROM phan_cong_thuc_tap pct
         JOIN sinh_vien sv ON pct.sinh_vien_id = sv.id
         JOIN dot_thuc_tap dtt ON pct.dot_thuc_tap_id = dtt.id
         WHERE pct.doanh_nghiep_id = ?
         GROUP BY dtt.id, dtt.ten_dot, dtt.ngay_bat_dau, dtt.ngay_ket_thuc
         ORDER BY dtt.ngay_bat_dau DESC`,
        [companyId]
      );

      // Thống kê theo vị trí mong muốn
      const [positionStats] = await connection.execute(
        `SELECT 
          sv.vi_tri_mong_muon,
          COUNT(*) as student_count,
          AVG(pct.diem_so) as avg_rating
         FROM phan_cong_thuc_tap pct
         JOIN sinh_vien sv ON pct.sinh_vien_id = sv.id
         WHERE pct.doanh_nghiep_id = ? AND sv.vi_tri_mong_muon IS NOT NULL
         GROUP BY sv.vi_tri_mong_muon
         ORDER BY student_count DESC`,
        [companyId]
      );

      return {
        overall: overallStats[0],
        byBatch: batchStats,
        byPosition: positionStats
      };
    } finally {
      await connection.end();
    }
  }

  // Lấy danh sách đợt thực tập có sinh viên được phân công
  async getActiveBatches(companyId) {
    const connection = await this.createConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT DISTINCT dtt.*, COUNT(pct.id) as student_count
         FROM dot_thuc_tap dtt
         JOIN phan_cong_thuc_tap pct ON dtt.id = pct.dot_thuc_tap_id
         WHERE pct.doanh_nghiep_id = ?
         GROUP BY dtt.id
         ORDER BY dtt.ngay_bat_dau DESC`,
        [companyId]
      );
      return rows;
    } finally {
      await connection.end();
    }
  }

  // Lấy chi tiết một sinh viên cụ thể
  async getStudentDetail(studentId, companyId) {
    const connection = await this.createConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT 
          sv.*,
          pct.id as assignment_id,
          pct.ngay_phan_cong,
          pct.ghi_chu as assignment_note,
          pct.diem_so AS diem_danh_gia,
          pct.nhan_xet AS nhan_xet_doanh_nghiep,
          dtt.ten_dot,
          dtt.ngay_bat_dau,
          dtt.ngay_ket_thuc,
          dtt.so_tuan_thuc_tap,
          dn.ten_doanh_nghiep,
          gv.ho_ten as ten_giang_vien,
          gv.email as email_giang_vien,
          gv.so_dien_thoai as sdt_giang_vien
        FROM phan_cong_thuc_tap pct
        JOIN sinh_vien sv ON pct.sinh_vien_id = sv.id
        JOIN dot_thuc_tap dtt ON pct.dot_thuc_tap_id = dtt.id
        JOIN doanh_nghiep dn ON pct.doanh_nghiep_id = dn.id
        LEFT JOIN giang_vien gv ON sv.giang_vien_id = gv.id
        WHERE sv.id = ? AND pct.doanh_nghiep_id = ?`,
        [studentId, companyId]
      );

      return rows[0] || null;
    } finally {
      await connection.end();
    }
  }
}

module.exports = new CompanyInternshipService();
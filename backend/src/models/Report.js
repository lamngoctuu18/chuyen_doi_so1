const db = require('../database/connection');

class Report {
  // === BÁO CÁO HÀNG TUẦN ===
  
  static async getWeeklyReports(filters = {}) {
    try {
      const { page = 1, limit = 10, sinh_vien_id, assignment_id, trang_thai, tuan_from, tuan_to } = filters;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          bc.*,
          sv.ho_ten as ten_sinh_vien,
          sv.ma_sinh_vien,
          gv.ho_ten as ten_giang_vien,
          dn.ten_doanh_nghiep,
          dt.ten_dot
        FROM bao_cao bc
        LEFT JOIN phan_cong_thuc_tap pct ON bc.phan_cong_thuc_tap_id = pct.id
        LEFT JOIN sinh_vien sv ON pct.sinh_vien_id = sv.id
        LEFT JOIN giang_vien gv ON pct.giang_vien_id = gv.id
        LEFT JOIN doanh_nghiep dn ON pct.doanh_nghiep_id = dn.id
        LEFT JOIN dot_thuc_tap dt ON pct.dot_thuc_tap_id = dt.id
        WHERE bc.loai_bao_cao = 'tuan'
      `;

      const params = [];

      if (sinh_vien_id) {
        query += ' AND pct.sinh_vien_id = ?';
        params.push(sinh_vien_id);
      }

      if (assignment_id) {
        query += ' AND bc.phan_cong_thuc_tap_id = ?';
        params.push(assignment_id);
      }

      if (trang_thai) {
        query += ' AND bc.trang_thai = ?';
        params.push(trang_thai);
      }

      if (tuan_from) {
        query += ' AND bc.tuan_so >= ?';
        params.push(tuan_from);
      }

      if (tuan_to) {
        query += ' AND bc.tuan_so <= ?';
        params.push(tuan_to);
      }

      // Count total
      const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
      const [countResult] = await db.query(countQuery, params);
      const total = countResult[0].total;

      // Get paginated data
      query += ' ORDER BY bc.created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [reports] = await db.query(query, params);

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
      throw new Error(`Lỗi khi lấy danh sách báo cáo: ${error.message}`);
    }
  }

  static async getWeeklyReportById(id) {
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
          dn.email as email_doanh_nghiep,
          dt.ten_dot,
          dt.nam_hoc,
          dt.hoc_ky
        FROM bao_cao bc
        LEFT JOIN phan_cong_thuc_tap pct ON bc.phan_cong_thuc_tap_id = pct.id
        LEFT JOIN sinh_vien sv ON pct.sinh_vien_id = sv.id
        LEFT JOIN giang_vien gv ON pct.giang_vien_id = gv.id
        LEFT JOIN doanh_nghiep dn ON pct.doanh_nghiep_id = dn.id
        LEFT JOIN dot_thuc_tap dt ON pct.dot_thuc_tap_id = dt.id
        WHERE bc.id = ? AND bc.loai_bao_cao = 'tuan'
      `;

      const [reports] = await db.query(query, [id]);

      if (reports.length === 0) {
        throw new Error('Không tìm thấy báo cáo hàng tuần');
      }

      return reports[0];
    } catch (error) {
      throw new Error(`Lỗi khi lấy chi tiết báo cáo: ${error.message}`);
    }
  }

  static async createWeeklyReport(reportData) {
    try {
      const {
        sinh_vien_id,
        assignment_id,
        tuan,
        noi_dung,
        file_path = null,
        trang_thai = 'chua-nop'
      } = reportData;

      const query = `
        INSERT INTO bao_cao (
          phan_cong_thuc_tap_id,
          loai_bao_cao,
          tuan_so,
          tieu_de,
          noi_dung,
          file_path,
          trang_thai,
          ngay_nop,
          created_at,
          updated_at
        ) VALUES (?, 'tuan', ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
      `;

      const tieu_de = `Báo cáo tuần ${tuan}`;
      const ngay_nop = trang_thai === 'da-nop' ? new Date() : null;

      const [result] = await db.query(query, [
        assignment_id,
        tuan,
        tieu_de,
        noi_dung,
        file_path,
        trang_thai,
        ngay_nop
      ]);

      return await this.getWeeklyReportById(result.insertId);
    } catch (error) {
      throw new Error(`Lỗi khi tạo báo cáo hàng tuần: ${error.message}`);
    }
  }

  static async updateWeeklyReport(id, updateData) {
    try {
      const allowedFields = ['noi_dung', 'file_path', 'trang_thai', 'diem', 'nhan_xet'];
      const updates = [];
      const params = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = ?`);
          params.push(value);
        }
      }

      if (updates.length === 0) {
        throw new Error('Không có trường nào để cập nhật');
      }

      // Nếu cập nhật trạng thái thành 'da-nop', cập nhật ngày nộp
      if (updateData.trang_thai === 'da-nop') {
        updates.push('ngay_nop = NOW()');
      }

      updates.push('updated_at = NOW()');

      const query = `
        UPDATE bao_cao 
        SET ${updates.join(', ')}
        WHERE id = ? AND loai_bao_cao = 'tuan'
      `;

      params.push(id);

      const [result] = await db.query(query, params);

      if (result.affectedRows === 0) {
        throw new Error('Không tìm thấy báo cáo hàng tuần để cập nhật');
      }

      return await this.getWeeklyReportById(id);
    } catch (error) {
      throw new Error(`Lỗi khi cập nhật báo cáo hàng tuần: ${error.message}`);
    }
  }

  static async deleteWeeklyReport(id) {
    try {
      const query = 'DELETE FROM bao_cao WHERE id = ? AND loai_bao_cao = ?';
      const [result] = await db.query(query, [id, 'tuan']);

      if (result.affectedRows === 0) {
        throw new Error('Không tìm thấy báo cáo hàng tuần để xóa');
      }

      return { success: true, message: 'Xóa báo cáo hàng tuần thành công' };
    } catch (error) {
      throw new Error(`Lỗi khi xóa báo cáo hàng tuần: ${error.message}`);
    }
  }

  // === BÁO CÁO CUỐI KỲ ===

  static async getFinalReports(filters = {}) {
    try {
      const { page = 1, limit = 10, sinh_vien_id, assignment_id, trang_thai } = filters;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          bc.*,
          sv.ho_ten as ten_sinh_vien,
          sv.ma_sinh_vien,
          gv.ho_ten as ten_giang_vien,
          dn.ten_doanh_nghiep,
          dt.ten_dot
        FROM bao_cao bc
        LEFT JOIN phan_cong_thuc_tap pct ON bc.phan_cong_thuc_tap_id = pct.id
        LEFT JOIN sinh_vien sv ON pct.sinh_vien_id = sv.id
        LEFT JOIN giang_vien gv ON pct.giang_vien_id = gv.id
        LEFT JOIN doanh_nghiep dn ON pct.doanh_nghiep_id = dn.id
        LEFT JOIN dot_thuc_tap dt ON pct.dot_thuc_tap_id = dt.id
        WHERE bc.loai_bao_cao = 'cuoi-ky'
      `;

      const params = [];

      if (sinh_vien_id) {
        query += ' AND pct.sinh_vien_id = ?';
        params.push(sinh_vien_id);
      }

      if (assignment_id) {
        query += ' AND bc.phan_cong_thuc_tap_id = ?';
        params.push(assignment_id);
      }

      if (trang_thai) {
        query += ' AND bc.trang_thai = ?';
        params.push(trang_thai);
      }

      // Count total
      const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
      const [countResult] = await db.query(countQuery, params);
      const total = countResult[0].total;

      // Get paginated data
      query += ' ORDER BY bc.created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [reports] = await db.query(query, params);

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
      throw new Error(`Lỗi khi lấy danh sách báo cáo cuối kỳ: ${error.message}`);
    }
  }

  static async getFinalReportById(id) {
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
          dt.ten_dot
        FROM bao_cao bc
        LEFT JOIN phan_cong_thuc_tap pct ON bc.phan_cong_thuc_tap_id = pct.id
        LEFT JOIN sinh_vien sv ON pct.sinh_vien_id = sv.id
        LEFT JOIN giang_vien gv ON pct.giang_vien_id = gv.id
        LEFT JOIN doanh_nghiep dn ON pct.doanh_nghiep_id = dn.id
        LEFT JOIN dot_thuc_tap dt ON pct.dot_thuc_tap_id = dt.id
        WHERE bc.id = ? AND bc.loai_bao_cao = 'cuoi-ky'
      `;

      const [reports] = await db.query(query, [id]);

      if (reports.length === 0) {
        throw new Error('Không tìm thấy báo cáo cuối kỳ');
      }

      return reports[0];
    } catch (error) {
      throw new Error(`Lỗi khi lấy chi tiết báo cáo cuối kỳ: ${error.message}`);
    }
  }

  static async createFinalReport(reportData) {
    try {
      const {
        assignment_id,
        tieu_de,
        noi_dung,
        file_path = null,
        trang_thai = 'chua-nop'
      } = reportData;

      const query = `
        INSERT INTO bao_cao (
          phan_cong_thuc_tap_id,
          loai_bao_cao,
          tieu_de,
          noi_dung,
          file_path,
          trang_thai,
          ngay_nop,
          created_at,
          updated_at
        ) VALUES (?, 'cuoi-ky', ?, ?, ?, ?, NOW(), NOW(), NOW())
      `;

      const ngay_nop = trang_thai === 'da-nop' ? new Date() : null;

      const [result] = await db.query(query, [
        assignment_id,
        tieu_de,
        noi_dung,
        file_path,
        trang_thai,
        ngay_nop
      ]);

      return await this.getFinalReportById(result.insertId);
    } catch (error) {
      throw new Error(`Lỗi khi tạo báo cáo cuối kỳ: ${error.message}`);
    }
  }

  static async updateFinalReport(id, updateData) {
    try {
      const allowedFields = ['tieu_de', 'noi_dung', 'file_path', 'trang_thai', 'diem', 'nhan_xet'];
      const updates = [];
      const params = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = ?`);
          params.push(value);
        }
      }

      if (updates.length === 0) {
        throw new Error('Không có trường nào để cập nhật');
      }

      if (updateData.trang_thai === 'da-nop') {
        updates.push('ngay_nop = NOW()');
      }

      updates.push('updated_at = NOW()');

      const query = `
        UPDATE bao_cao 
        SET ${updates.join(', ')}
        WHERE id = ? AND loai_bao_cao = 'cuoi-ky'
      `;

      params.push(id);

      const [result] = await db.query(query, params);

      if (result.affectedRows === 0) {
        throw new Error('Không tìm thấy báo cáo cuối kỳ để cập nhật');
      }

      return await this.getFinalReportById(id);
    } catch (error) {
      throw new Error(`Lỗi khi cập nhật báo cáo cuối kỳ: ${error.message}`);
    }
  }

  static async deleteFinalReport(id) {
    try {
      const query = 'DELETE FROM bao_cao WHERE id = ? AND loai_bao_cao = ?';
      const [result] = await db.query(query, [id, 'cuoi-ky']);

      if (result.affectedRows === 0) {
        throw new Error('Không tìm thấy báo cáo cuối kỳ để xóa');
      }

      return { success: true, message: 'Xóa báo cáo cuối kỳ thành công' };
    } catch (error) {
      throw new Error(`Lỗi khi xóa báo cáo cuối kỳ: ${error.message}`);
    }
  }

  // === THỐNG KÊ BÁO CÁO ===

  static async getReportStatistics(filters = {}) {
    try {
      const { dot_thuc_tap_id, sinh_vien_id } = filters;

      let query = `
        SELECT 
          COUNT(*) as total_reports,
          SUM(CASE WHEN trang_thai = 'da-nop' THEN 1 ELSE 0 END) as submitted_reports,
          SUM(CASE WHEN trang_thai = 'chua-nop' THEN 1 ELSE 0 END) as pending_reports,
          SUM(CASE WHEN loai_bao_cao = 'tuan' THEN 1 ELSE 0 END) as weekly_reports,
          SUM(CASE WHEN loai_bao_cao = 'cuoi-ky' THEN 1 ELSE 0 END) as final_reports,
          AVG(diem) as average_score
        FROM bao_cao bc
        LEFT JOIN phan_cong_thuc_tap pct ON bc.phan_cong_thuc_tap_id = pct.id
        WHERE 1=1
      `;

      const params = [];

      if (dot_thuc_tap_id) {
        query += ' AND pct.dot_thuc_tap_id = ?';
        params.push(dot_thuc_tap_id);
      }

      if (sinh_vien_id) {
        query += ' AND pct.sinh_vien_id = ?';
        params.push(sinh_vien_id);
      }

      const [stats] = await db.query(query, params);

      return stats[0];
    } catch (error) {
      throw new Error(`Lỗi khi lấy thống kê báo cáo: ${error.message}`);
    }
  }
}

module.exports = Report;

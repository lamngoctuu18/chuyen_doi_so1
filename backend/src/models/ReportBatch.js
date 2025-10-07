const db = require('../database/connection');

class ReportBatchModel {
  // Lấy danh sách các đợt báo cáo
  static async getReportBatches(filters = {}) {
    try {
      const { page = 1, limit = 10, trang_thai, loai_bao_cao, dot_thuc_tap_id } = filters;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      let params = [];

      if (trang_thai) {
        whereClause += ' AND rb.trang_thai = ?';
        params.push(trang_thai);
      }

      if (loai_bao_cao) {
        whereClause += ' AND rb.loai_bao_cao = ?';
        params.push(loai_bao_cao);
      }

      if (dot_thuc_tap_id) {
        whereClause += ' AND rb.dot_thuc_tap_id = ?';
        params.push(dot_thuc_tap_id);
      }

      // Lấy danh sách đợt báo cáo với thông tin thống kê
      const batchesQuery = `
        SELECT 
          rb.*,
          dt.ten_dot as ten_dot_thuc_tap,
          COUNT(DISTINCT pa.sinh_vien_id) as tong_so_sinh_vien,
          COALESCE(stats.so_da_nop, 0) as so_da_nop,
          COALESCE(stats.so_da_duyet, 0) as so_da_duyet
        FROM bao_cao rb
        LEFT JOIN dot_thuc_tap dt ON rb.dot_thuc_tap_id = dt.id
        LEFT JOIN phan_cong_thuc_tap pa ON rb.dot_thuc_tap_id = pa.dot_thuc_tap_id
        LEFT JOIN (
          SELECT 
            rb2.id as batch_id,
            COUNT(CASE WHEN wr.trang_thai IN ('da-nop', 'da-duyet') THEN 1 END) +
            COUNT(CASE WHEN fr.trang_thai IN ('da-nop', 'da-cham-diem') THEN 1 END) as so_da_nop,
            COUNT(CASE WHEN wr.trang_thai = 'da-duyet' THEN 1 END) +
            COUNT(CASE WHEN fr.trang_thai = 'da-cham-diem' THEN 1 END) as so_da_duyet
          FROM bao_cao rb2
          LEFT JOIN weekly_reports wr ON rb2.dot_thuc_tap_id = wr.dot_thuc_tap_id AND rb2.loai_bao_cao = 'weekly'
          LEFT JOIN final_reports fr ON rb2.dot_thuc_tap_id = fr.dot_thuc_tap_id AND rb2.loai_bao_cao = 'final'
          GROUP BY rb2.id
        ) stats ON rb.id = stats.batch_id
        ${whereClause}
        GROUP BY rb.id
        ORDER BY rb.ngay_tao DESC
        LIMIT ? OFFSET ?
      `;

      // Đếm tổng số
      const countQuery = `
        SELECT COUNT(DISTINCT rb.id) as total
        FROM bao_cao rb
        ${whereClause}
      `;

      const [batches, countResult] = await Promise.all([
        db.query(batchesQuery, [...params, limit, offset]),
        db.query(countQuery, params)
      ]);

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      return {
        batches,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy danh sách đợt báo cáo: ${error.message}`);
    }
  }

  // Lấy chi tiết một đợt báo cáo
  static async getReportBatchById(id) {
    try {
      const batchQuery = `
        SELECT 
          rb.*,
          ib.ten_dot as ten_dot_thuc_tap,
          COUNT(DISTINCT ia.sinh_vien_id) as tong_so_sinh_vien
        FROM bao_cao rb
        LEFT JOIN internship_batches ib ON rb.dot_thuc_tap_id = ib.id
        LEFT JOIN internship_assignments ia ON rb.dot_thuc_tap_id = ia.dot_thuc_tap_id
        WHERE rb.id = ?
        GROUP BY rb.id
      `;

      const batches = await db.query(batchQuery, [id]);

      if (batches.length === 0) {
        throw new Error('Không tìm thấy đợt báo cáo');
      }

      return batches[0];
    } catch (error) {
      throw new Error(`Lỗi khi lấy chi tiết đợt báo cáo: ${error.message}`);
    }
  }

  // Tạo đợt báo cáo mới
  static async createReportBatch(batchData) {
    try {
      const {
        ten_dot,
        dot_thuc_tap_id,
        loai_bao_cao,
        han_nop,
        mo_ta,
        trang_thai = 'chua-mo'
      } = batchData;

      // Kiểm tra đợt thực tập có tồn tại không
      const internshipBatch = await db.query('SELECT id FROM internship_batches WHERE id = ?', [dot_thuc_tap_id]);
      if (internshipBatch.length === 0) {
        throw new Error('Không tìm thấy đợt thực tập');
      }

      // Kiểm tra không trùng lặp đợt báo cáo
      const existingBatch = await db.query(
        'SELECT id FROM bao_cao WHERE dot_thuc_tap_id = ? AND loai_bao_cao = ? AND ten_dot = ?',
        [dot_thuc_tap_id, loai_bao_cao, ten_dot]
      );

      if (existingBatch.length > 0) {
        throw new Error('Đã tồn tại đợt báo cáo với tên này cho đợt thực tập và loại báo cáo tương ứng');
      }

      const insertQuery = `
        INSERT INTO bao_cao 
        (ten_dot, dot_thuc_tap_id, loai_bao_cao, han_nop, mo_ta, trang_thai, ngay_tao, ngay_cap_nhat)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const result = await db.query(insertQuery, [
        ten_dot,
        dot_thuc_tap_id,
        loai_bao_cao,
        han_nop,
        mo_ta,
        trang_thai
      ]);

      return await this.getReportBatchById(result.insertId);
    } catch (error) {
      throw new Error(`Lỗi khi tạo đợt báo cáo: ${error.message}`);
    }
  }

  // Cập nhật đợt báo cáo
  static async updateReportBatch(id, batchData) {
    try {
      // Kiểm tra đợt báo cáo có tồn tại không
      const existingBatch = await this.getReportBatchById(id);

      const updateFields = [];
      const updateParams = [];

      if (batchData.ten_dot !== undefined) {
        updateFields.push('ten_dot = ?');
        updateParams.push(batchData.ten_dot);
      }

      if (batchData.han_nop !== undefined) {
        updateFields.push('han_nop = ?');
        updateParams.push(batchData.han_nop);
      }

      if (batchData.mo_ta !== undefined) {
        updateFields.push('mo_ta = ?');
        updateParams.push(batchData.mo_ta);
      }

      if (batchData.trang_thai !== undefined) {
        updateFields.push('trang_thai = ?');
        updateParams.push(batchData.trang_thai);
      }

      if (updateFields.length === 0) {
        return existingBatch;
      }

      updateFields.push('ngay_cap_nhat = NOW()');
      updateParams.push(id);

      const updateQuery = `
        UPDATE bao_cao 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;

      await db.query(updateQuery, updateParams);

      return await this.getReportBatchById(id);
    } catch (error) {
      throw new Error(`Lỗi khi cập nhật đợt báo cáo: ${error.message}`);
    }
  }

  // Xóa đợt báo cáo
  static async deleteReportBatch(id) {
    try {
      const batch = await this.getReportBatchById(id);

      // Chỉ cho phép xóa đợt báo cáo chưa mở
      if (batch.trang_thai !== 'chua-mo') {
        throw new Error('Chỉ có thể xóa đợt báo cáo chưa mở');
      }

      await db.query('DELETE FROM bao_cao WHERE id = ?', [id]);

      return { success: true, message: 'Xóa đợt báo cáo thành công' };
    } catch (error) {
      throw new Error(`Lỗi khi xóa đợt báo cáo: ${error.message}`);
    }
  }

  // Lấy thống kê đợt báo cáo
  static async getReportBatchStats() {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_batches,
          COUNT(CASE WHEN trang_thai = 'dang-mo' THEN 1 END) as active_batches,
          COUNT(CASE WHEN loai_bao_cao = 'weekly' THEN 1 END) as weekly_batches,
          COUNT(CASE WHEN loai_bao_cao = 'final' THEN 1 END) as final_batches
        FROM bao_cao
      `;

      const reportStatsQuery = `
        SELECT 
          COUNT(CASE WHEN wr.trang_thai IN ('da-nop', 'da-duyet') THEN 1 END) +
          COUNT(CASE WHEN fr.trang_thai IN ('da-nop', 'da-cham-diem') THEN 1 END) as total_reports,
          COUNT(CASE WHEN wr.trang_thai = 'da-nop' THEN 1 END) +
          COUNT(CASE WHEN fr.trang_thai = 'da-nop' THEN 1 END) as pending_reviews,
          COUNT(CASE WHEN wr.trang_thai = 'da-duyet' THEN 1 END) +
          COUNT(CASE WHEN fr.trang_thai = 'da-cham-diem' THEN 1 END) as approved_reports
        FROM weekly_reports wr
        FULL OUTER JOIN final_reports fr ON 1=1
      `;

      const [batchStats, reportStats] = await Promise.all([
        db.query(statsQuery),
        db.query(reportStatsQuery)
      ]);

      return {
        totalBatches: batchStats[0].total_batches,
        activeBatches: batchStats[0].active_batches,
        weeklyReports: reportStats[0].total_reports || 0,
        finalReports: batchStats[0].final_batches,
        pendingReviews: reportStats[0].pending_reviews || 0,
        approvedReports: reportStats[0].approved_reports || 0
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy thống kê đợt báo cáo: ${error.message}`);
    }
  }

  // Xuất báo cáo Excel cho một đợt
  static async exportReportBatch(id) {
    try {
      const batch = await this.getReportBatchById(id);

      let reportQuery;
      if (batch.loai_bao_cao === 'weekly') {
        reportQuery = `
          SELECT 
            sv.ma_sinh_vien,
            sv.ho_ten as ho_ten_sinh_vien,
            wr.tuan,
            wr.noi_dung,
            wr.ngay_nop,
            wr.trang_thai,
            wr.diem,
            wr.nhan_xet_giang_vien,
            gv.ho_ten as ho_ten_giang_vien,
            dn.ten_doanh_nghiep
          FROM weekly_reports wr
          JOIN internship_assignments ia ON wr.assignment_id = ia.id
          JOIN sinh_vien sv ON ia.sinh_vien_id = sv.id
          JOIN giang_vien gv ON ia.giang_vien_huong_dan_id = gv.id
          JOIN doanh_nghiep dn ON ia.doanh_nghiep_id = dn.id
          WHERE ia.dot_thuc_tap_id = ?
          ORDER BY sv.ma_sinh_vien, wr.tuan
        `;
      } else {
        reportQuery = `
          SELECT 
            sv.ma_sinh_vien,
            sv.ho_ten as ho_ten_sinh_vien,
            fr.tieu_de,
            fr.tom_tat,
            fr.ngay_nop,
            fr.trang_thai,
            fr.diem_giang_vien,
            fr.diem_doanh_nghiep,
            fr.nhan_xet_giang_vien,
            fr.nhan_xet_doanh_nghiep,
            gv.ho_ten as ho_ten_giang_vien,
            dn.ten_doanh_nghiep
          FROM final_reports fr
          JOIN internship_assignments ia ON fr.assignment_id = ia.id
          JOIN sinh_vien sv ON ia.sinh_vien_id = sv.id
          JOIN giang_vien gv ON ia.giang_vien_huong_dan_id = gv.id
          JOIN doanh_nghiep dn ON ia.doanh_nghiep_id = dn.id
          WHERE ia.dot_thuc_tap_id = ?
          ORDER BY sv.ma_sinh_vien
        `;
      }

      const reports = await db.query(reportQuery, [batch.dot_thuc_tap_id]);

      return {
        batch,
        reports
      };
    } catch (error) {
      throw new Error(`Lỗi khi xuất báo cáo: ${error.message}`);
    }
  }
}

module.exports = ReportBatchModel;
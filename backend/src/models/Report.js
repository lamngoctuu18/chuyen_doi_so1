const { query } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

class ReportModel {
  // === QUẢN LÝ BÁO CÁO HÀNG TUẦN ===

  // Lấy danh sách báo cáo hàng tuần
  static async getWeeklyReports(filters = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sinh_vien_id, 
        assignment_id, 
        trang_thai, 
        tuan_from, 
        tuan_to 
      } = filters;
      
      const offset = (page - 1) * limit;
      let whereClause = '1=1';
      let params = [];

      // Lọc theo sinh viên
      if (sinh_vien_id) {
        whereClause += ' AND wr.sinh_vien_id = ?';
        params.push(sinh_vien_id);
      }

      // Lọc theo assignment
      if (assignment_id) {
        whereClause += ' AND wr.assignment_id = ?';
        params.push(assignment_id);
      }

      // Lọc theo trạng thái
      if (trang_thai) {
        whereClause += ' AND wr.trang_thai = ?';
        params.push(trang_thai);
      }

      // Lọc theo tuần
      if (tuan_from) {
        whereClause += ' AND wr.tuan >= ?';
        params.push(tuan_from);
      }

      if (tuan_to) {
        whereClause += ' AND wr.tuan <= ?';
        params.push(tuan_to);
      }

      const reportsQuery = `
        SELECT 
          wr.*,
          s.ma_sv,
          s.ho_ten as sinh_vien_ten,
          c.ten_dn as doanh_nghiep_ten,
          t.ho_ten as giang_vien_ten,
          ib.ten_dot as dot_thuc_tap_ten
        FROM weekly_reports wr
        LEFT JOIN students s ON wr.sinh_vien_id = s.id
        LEFT JOIN internship_assignments ia ON wr.assignment_id = ia.id
        LEFT JOIN companies c ON ia.doanh_nghiep_id = c.id
        LEFT JOIN teachers t ON ia.giang_vien_huong_dan_id = t.id
        LEFT JOIN internship_batches ib ON ia.dot_thuc_tap_id = ib.id
        WHERE ${whereClause}
        ORDER BY wr.created_at DESC, wr.tuan DESC
        LIMIT ? OFFSET ?
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM weekly_reports wr
        WHERE ${whereClause}
      `;

      const reports = await query(reportsQuery, [...params, limit, offset]);
      const countResult = await query(countQuery, params);
      const total = countResult[0].total;

      return {
        reports,
        pagination: {
          current_page: page,
          per_page: limit,
          total: total,
          total_pages: Math.ceil(total / limit),
        }
      };
    } catch (error) {
      throw new Error(`Lỗi lấy danh sách báo cáo hàng tuần: ${error.message}`);
    }
  }

  // Lấy chi tiết báo cáo hàng tuần
  static async getWeeklyReportById(id) {
    try {
      const reportQuery = `
        SELECT 
          wr.*,
          s.ma_sv,
          s.ho_ten as sinh_vien_ten,
          s.email as sinh_vien_email,
          c.ten_dn as doanh_nghiep_ten,
          t.ho_ten as giang_vien_ten,
          t.email as giang_vien_email,
          ib.ten_dot as dot_thuc_tap_ten,
          ia.ngay_bat_dau as thuc_tap_bat_dau,
          ia.ngay_ket_thuc as thuc_tap_ket_thuc
        FROM weekly_reports wr
        LEFT JOIN students s ON wr.sinh_vien_id = s.id
        LEFT JOIN internship_assignments ia ON wr.assignment_id = ia.id
        LEFT JOIN companies c ON ia.doanh_nghiep_id = c.id
        LEFT JOIN teachers t ON ia.giang_vien_huong_dan_id = t.id
        LEFT JOIN internship_batches ib ON ia.dot_thuc_tap_id = ib.id
        WHERE wr.id = ?
      `;

      const reports = await query(reportQuery, [id]);
      if (reports.length === 0) {
        throw new Error('Không tìm thấy báo cáo');
      }

      return reports[0];
    } catch (error) {
      throw new Error(`Lỗi lấy chi tiết báo cáo: ${error.message}`);
    }
  }

  // Tạo báo cáo hàng tuần mới
  static async createWeeklyReport(reportData) {
    try {
      const id = uuidv4();
      
      // Kiểm tra báo cáo tuần này đã tồn tại chưa
      const existingReport = await query(
        'SELECT id FROM weekly_reports WHERE sinh_vien_id = ? AND assignment_id = ? AND tuan = ?',
        [reportData.sinh_vien_id, reportData.assignment_id, reportData.tuan]
      );

      if (existingReport.length > 0) {
        throw new Error('Báo cáo tuần này đã tồn tại');
      }

      const insertQuery = `
        INSERT INTO weekly_reports (
          id, sinh_vien_id, assignment_id, tuan, noi_dung, 
          file_dinh_kem, trang_thai
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      await query(insertQuery, [
        id,
        reportData.sinh_vien_id,
        reportData.assignment_id,
        reportData.tuan,
        reportData.noi_dung,
        reportData.file_dinh_kem || null,
        reportData.trang_thai || 'da-nop'
      ]);

      return await this.getWeeklyReportById(id);
    } catch (error) {
      throw new Error(`Lỗi tạo báo cáo hàng tuần: ${error.message}`);
    }
  }

  // Cập nhật báo cáo hàng tuần
  static async updateWeeklyReport(id, reportData) {
    try {
      const existingReport = await this.getWeeklyReportById(id);
      if (!existingReport) {
        throw new Error('Không tìm thấy báo cáo');
      }

      const updateQuery = `
        UPDATE weekly_reports SET 
          noi_dung = ?, file_dinh_kem = ?, trang_thai = ?,
          nhan_xet_giang_vien = ?, diem = ?, 
          ngay_cham_diem = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await query(updateQuery, [
        reportData.noi_dung || existingReport.noi_dung,
        reportData.file_dinh_kem || existingReport.file_dinh_kem,
        reportData.trang_thai || existingReport.trang_thai,
        reportData.nhan_xet_giang_vien || existingReport.nhan_xet_giang_vien,
        reportData.diem || existingReport.diem,
        reportData.diem ? new Date() : existingReport.ngay_cham_diem,
        id
      ]);

      return await this.getWeeklyReportById(id);
    } catch (error) {
      throw new Error(`Lỗi cập nhật báo cáo hàng tuần: ${error.message}`);
    }
  }

  // Chấm điểm báo cáo hàng tuần
  static async gradeWeeklyReport(id, gradeData) {
    try {
      const existingReport = await this.getWeeklyReportById(id);
      if (!existingReport) {
        throw new Error('Không tìm thấy báo cáo');
      }

      const updateQuery = `
        UPDATE weekly_reports SET 
          nhan_xet_giang_vien = ?, diem = ?, trang_thai = 'da-duyet',
          ngay_cham_diem = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await query(updateQuery, [
        gradeData.nhan_xet_giang_vien,
        gradeData.diem,
        id
      ]);

      return await this.getWeeklyReportById(id);
    } catch (error) {
      throw new Error(`Lỗi chấm điểm báo cáo: ${error.message}`);
    }
  }

  // === QUẢN LÝ BÁO CÁO CUỐI KỲ ===

  // Lấy danh sách báo cáo cuối kỳ
  static async getFinalReports(filters = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sinh_vien_id, 
        assignment_id, 
        trang_thai 
      } = filters;
      
      const offset = (page - 1) * limit;
      let whereClause = '1=1';
      let params = [];

      if (sinh_vien_id) {
        whereClause += ' AND fr.sinh_vien_id = ?';
        params.push(sinh_vien_id);
      }

      if (assignment_id) {
        whereClause += ' AND fr.assignment_id = ?';
        params.push(assignment_id);
      }

      if (trang_thai) {
        whereClause += ' AND fr.trang_thai = ?';
        params.push(trang_thai);
      }

      const reportsQuery = `
        SELECT 
          fr.*,
          s.ma_sv,
          s.ho_ten as sinh_vien_ten,
          c.ten_dn as doanh_nghiep_ten,
          t.ho_ten as giang_vien_ten,
          ib.ten_dot as dot_thuc_tap_ten
        FROM final_reports fr
        LEFT JOIN students s ON fr.sinh_vien_id = s.id
        LEFT JOIN internship_assignments ia ON fr.assignment_id = ia.id
        LEFT JOIN companies c ON ia.doanh_nghiep_id = c.id
        LEFT JOIN teachers t ON ia.giang_vien_huong_dan_id = t.id
        LEFT JOIN internship_batches ib ON ia.dot_thuc_tap_id = ib.id
        WHERE ${whereClause}
        ORDER BY fr.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM final_reports fr
        WHERE ${whereClause}
      `;

      const reports = await query(reportsQuery, [...params, limit, offset]);
      const countResult = await query(countQuery, params);
      const total = countResult[0].total;

      return {
        reports,
        pagination: {
          current_page: page,
          per_page: limit,
          total: total,
          total_pages: Math.ceil(total / limit),
        }
      };
    } catch (error) {
      throw new Error(`Lỗi lấy danh sách báo cáo cuối kỳ: ${error.message}`);
    }
  }

  // Lấy chi tiết báo cáo cuối kỳ
  static async getFinalReportById(id) {
    try {
      const reportQuery = `
        SELECT 
          fr.*,
          s.ma_sv,
          s.ho_ten as sinh_vien_ten,
          s.email as sinh_vien_email,
          c.ten_dn as doanh_nghiep_ten,
          c.nguoi_lien_he as doanh_nghiep_nguoi_lien_he,
          t.ho_ten as giang_vien_ten,
          t.email as giang_vien_email,
          ib.ten_dot as dot_thuc_tap_ten,
          ia.ngay_bat_dau as thuc_tap_bat_dau,
          ia.ngay_ket_thuc as thuc_tap_ket_thuc
        FROM final_reports fr
        LEFT JOIN students s ON fr.sinh_vien_id = s.id
        LEFT JOIN internship_assignments ia ON fr.assignment_id = ia.id
        LEFT JOIN companies c ON ia.doanh_nghiep_id = c.id
        LEFT JOIN teachers t ON ia.giang_vien_huong_dan_id = t.id
        LEFT JOIN internship_batches ib ON ia.dot_thuc_tap_id = ib.id
        WHERE fr.id = ?
      `;

      const reports = await query(reportQuery, [id]);
      if (reports.length === 0) {
        throw new Error('Không tìm thấy báo cáo cuối kỳ');
      }

      return reports[0];
    } catch (error) {
      throw new Error(`Lỗi lấy chi tiết báo cáo cuối kỳ: ${error.message}`);
    }
  }

  // Tạo báo cáo cuối kỳ mới
  static async createFinalReport(reportData) {
    try {
      const id = uuidv4();
      
      // Kiểm tra báo cáo cuối kỳ đã tồn tại chưa
      const existingReport = await query(
        'SELECT id FROM final_reports WHERE sinh_vien_id = ? AND assignment_id = ?',
        [reportData.sinh_vien_id, reportData.assignment_id]
      );

      if (existingReport.length > 0) {
        throw new Error('Báo cáo cuối kỳ cho assignment này đã tồn tại');
      }

      const insertQuery = `
        INSERT INTO final_reports (
          id, sinh_vien_id, assignment_id, tieu_de, tom_tat, 
          file_bao_cao, trang_thai
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      await query(insertQuery, [
        id,
        reportData.sinh_vien_id,
        reportData.assignment_id,
        reportData.tieu_de,
        reportData.tom_tat || null,
        reportData.file_bao_cao,
        reportData.trang_thai || 'da-nop'
      ]);

      return await this.getFinalReportById(id);
    } catch (error) {
      throw new Error(`Lỗi tạo báo cáo cuối kỳ: ${error.message}`);
    }
  }

  // Cập nhật báo cáo cuối kỳ
  static async updateFinalReport(id, reportData) {
    try {
      const existingReport = await this.getFinalReportById(id);
      if (!existingReport) {
        throw new Error('Không tìm thấy báo cáo cuối kỳ');
      }

      const updateQuery = `
        UPDATE final_reports SET 
          tieu_de = ?, tom_tat = ?, file_bao_cao = ?, trang_thai = ?,
          diem_giang_vien = ?, diem_doanh_nghiep = ?,
          nhan_xet_giang_vien = ?, nhan_xet_doanh_nghiep = ?,
          ngay_cham_diem = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await query(updateQuery, [
        reportData.tieu_de || existingReport.tieu_de,
        reportData.tom_tat || existingReport.tom_tat,
        reportData.file_bao_cao || existingReport.file_bao_cao,
        reportData.trang_thai || existingReport.trang_thai,
        reportData.diem_giang_vien || existingReport.diem_giang_vien,
        reportData.diem_doanh_nghiep || existingReport.diem_doanh_nghiep,
        reportData.nhan_xet_giang_vien || existingReport.nhan_xet_giang_vien,
        reportData.nhan_xet_doanh_nghiep || existingReport.nhan_xet_doanh_nghiep,
        (reportData.diem_giang_vien || reportData.diem_doanh_nghiep) ? new Date() : existingReport.ngay_cham_diem,
        id
      ]);

      return await this.getFinalReportById(id);
    } catch (error) {
      throw new Error(`Lỗi cập nhật báo cáo cuối kỳ: ${error.message}`);
    }
  }

  // Chấm điểm báo cáo cuối kỳ (giảng viên)
  static async gradeFinalReportByTeacher(id, gradeData) {
    try {
      const existingReport = await this.getFinalReportById(id);
      if (!existingReport) {
        throw new Error('Không tìm thấy báo cáo cuối kỳ');
      }

      const updateQuery = `
        UPDATE final_reports SET 
          diem_giang_vien = ?, nhan_xet_giang_vien = ?,
          trang_thai = 'da-cham-diem', ngay_cham_diem = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await query(updateQuery, [
        gradeData.diem_giang_vien,
        gradeData.nhan_xet_giang_vien,
        id
      ]);

      return await this.getFinalReportById(id);
    } catch (error) {
      throw new Error(`Lỗi chấm điểm báo cáo cuối kỳ: ${error.message}`);
    }
  }

  // Chấm điểm báo cáo cuối kỳ (doanh nghiệp)
  static async gradeFinalReportByCompany(id, gradeData) {
    try {
      const existingReport = await this.getFinalReportById(id);
      if (!existingReport) {
        throw new Error('Không tìm thấy báo cáo cuối kỳ');
      }

      const updateQuery = `
        UPDATE final_reports SET 
          diem_doanh_nghiep = ?, nhan_xet_doanh_nghiep = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await query(updateQuery, [
        gradeData.diem_doanh_nghiep,
        gradeData.nhan_xet_doanh_nghiep,
        id
      ]);

      return await this.getFinalReportById(id);
    } catch (error) {
      throw new Error(`Lỗi chấm điểm báo cáo cuối kỳ (doanh nghiệp): ${error.message}`);
    }
  }

  // Thống kê báo cáo
  static async getReportStatistics() {
    try {
      // Thống kê báo cáo hàng tuần
      const weeklyStatsQuery = `
        SELECT 
          trang_thai,
          COUNT(*) as so_luong
        FROM weekly_reports 
        GROUP BY trang_thai
      `;

      // Thống kê báo cáo cuối kỳ
      const finalStatsQuery = `
        SELECT 
          trang_thai,
          COUNT(*) as so_luong
        FROM final_reports 
        GROUP BY trang_thai
      `;

      // Điểm trung bình báo cáo hàng tuần
      const avgWeeklyGradeQuery = `
        SELECT AVG(diem) as diem_trung_binh
        FROM weekly_reports 
        WHERE diem IS NOT NULL
      `;

      // Điểm trung bình báo cáo cuối kỳ
      const avgFinalGradeQuery = `
        SELECT 
          AVG(diem_giang_vien) as diem_gv_trung_binh,
          AVG(diem_doanh_nghiep) as diem_dn_trung_binh
        FROM final_reports 
        WHERE diem_giang_vien IS NOT NULL OR diem_doanh_nghiep IS NOT NULL
      `;

      const [weeklyStats, finalStats, avgWeeklyGrade, avgFinalGrade] = await Promise.all([
        query(weeklyStatsQuery),
        query(finalStatsQuery),
        query(avgWeeklyGradeQuery),
        query(avgFinalGradeQuery)
      ]);

      return {
        weekly_reports: {
          by_status: weeklyStats.reduce((acc, item) => {
            acc[item.trang_thai] = item.so_luong;
            return acc;
          }, {}),
          average_grade: avgWeeklyGrade[0].diem_trung_binh || 0
        },
        final_reports: {
          by_status: finalStats.reduce((acc, item) => {
            acc[item.trang_thai] = item.so_luong;
            return acc;
          }, {}),
          average_teacher_grade: avgFinalGrade[0].diem_gv_trung_binh || 0,
          average_company_grade: avgFinalGrade[0].diem_dn_trung_binh || 0
        }
      };
    } catch (error) {
      throw new Error(`Lỗi thống kê báo cáo: ${error.message}`);
    }
  }
}

module.exports = ReportModel;
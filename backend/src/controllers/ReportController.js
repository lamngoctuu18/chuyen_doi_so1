const ReportModel = require('../models/Report');

class ReportController {
  // === CONTROLLER CHO BÁO CÁO HÀNG TUẦN ===

  // GET /api/reports/weekly - Lấy danh sách báo cáo hàng tuần
  static async getWeeklyReports(req, res) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sinh_vien_id: req.query.sinh_vien_id,
        assignment_id: req.query.assignment_id,
        trang_thai: req.query.trang_thai,
        tuan_from: req.query.tuan_from ? parseInt(req.query.tuan_from) : null,
        tuan_to: req.query.tuan_to ? parseInt(req.query.tuan_to) : null
      };

      const result = await ReportModel.getWeeklyReports(filters);

      res.json({
        success: true,
        message: 'Lấy danh sách báo cáo hàng tuần thành công',
        data: result.reports,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // GET /api/reports/weekly/:id - Lấy chi tiết báo cáo hàng tuần
  static async getWeeklyReportById(req, res) {
    try {
      const { id } = req.params;
      const report = await ReportModel.getWeeklyReportById(id);

      res.json({
        success: true,
        message: 'Lấy chi tiết báo cáo hàng tuần thành công',
        data: report
      });
    } catch (error) {
      const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // POST /api/reports/weekly - Tạo báo cáo hàng tuần mới
  static async createWeeklyReport(req, res) {
    try {
      const reportData = req.body;

      // Validate dữ liệu bắt buộc
      const requiredFields = ['sinh_vien_id', 'assignment_id', 'tuan', 'noi_dung'];
      const missingFields = requiredFields.filter(field => !reportData[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Thiếu thông tin bắt buộc: ${missingFields.join(', ')}`,
          data: null
        });
      }

      // Validate tuần (phải là số dương)
      if (reportData.tuan <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Tuần phải là số dương',
          data: null
        });
      }

      // Validate trạng thái
      const validStatuses = ['chua-nop', 'da-nop', 'da-duyet'];
      if (reportData.trang_thai && !validStatuses.includes(reportData.trang_thai)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái không hợp lệ',
          data: null
        });
      }

      const newReport = await ReportModel.createWeeklyReport(reportData);

      res.status(201).json({
        success: true,
        message: 'Tạo báo cáo hàng tuần thành công',
        data: newReport
      });
    } catch (error) {
      const statusCode = error.message.includes('đã tồn tại') ? 409 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // PUT /api/reports/weekly/:id - Cập nhật báo cáo hàng tuần
  static async updateWeeklyReport(req, res) {
    try {
      const { id } = req.params;
      const reportData = req.body;

      // Validate trạng thái nếu có
      const validStatuses = ['chua-nop', 'da-nop', 'da-duyet'];
      if (reportData.trang_thai && !validStatuses.includes(reportData.trang_thai)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái không hợp lệ',
          data: null
        });
      }

      // Validate điểm nếu có (0-10)
      if (reportData.diem !== undefined && (reportData.diem < 0 || reportData.diem > 10)) {
        return res.status(400).json({
          success: false,
          message: 'Điểm phải trong khoảng 0-10',
          data: null
        });
      }

      const updatedReport = await ReportModel.updateWeeklyReport(id, reportData);

      res.json({
        success: true,
        message: 'Cập nhật báo cáo hàng tuần thành công',
        data: updatedReport
      });
    } catch (error) {
      const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // POST /api/reports/weekly/:id/grade - Chấm điểm báo cáo hàng tuần
  static async gradeWeeklyReport(req, res) {
    try {
      const { id } = req.params;
      const { nhan_xet_giang_vien, diem } = req.body;

      // Validate dữ liệu
      if (!nhan_xet_giang_vien && diem === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Cần có nhận xét hoặc điểm để chấm',
          data: null
        });
      }

      if (diem !== undefined && (diem < 0 || diem > 10)) {
        return res.status(400).json({
          success: false,
          message: 'Điểm phải trong khoảng 0-10',
          data: null
        });
      }

      const gradedReport = await ReportModel.gradeWeeklyReport(id, {
        nhan_xet_giang_vien,
        diem
      });

      res.json({
        success: true,
        message: 'Chấm điểm báo cáo hàng tuần thành công',
        data: gradedReport
      });
    } catch (error) {
      const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // === CONTROLLER CHO BÁO CÁO CUỐI KỲ ===

  // GET /api/reports/final - Lấy danh sách báo cáo cuối kỳ
  static async getFinalReports(req, res) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sinh_vien_id: req.query.sinh_vien_id,
        assignment_id: req.query.assignment_id,
        trang_thai: req.query.trang_thai
      };

      const result = await ReportModel.getFinalReports(filters);

      res.json({
        success: true,
        message: 'Lấy danh sách báo cáo cuối kỳ thành công',
        data: result.reports,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // GET /api/reports/final/:id - Lấy chi tiết báo cáo cuối kỳ
  static async getFinalReportById(req, res) {
    try {
      const { id } = req.params;
      const report = await ReportModel.getFinalReportById(id);

      res.json({
        success: true,
        message: 'Lấy chi tiết báo cáo cuối kỳ thành công',
        data: report
      });
    } catch (error) {
      const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // POST /api/reports/final - Tạo báo cáo cuối kỳ mới
  static async createFinalReport(req, res) {
    try {
      const reportData = req.body;

      // Validate dữ liệu bắt buộc
      const requiredFields = ['sinh_vien_id', 'assignment_id', 'tieu_de', 'file_bao_cao'];
      const missingFields = requiredFields.filter(field => !reportData[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Thiếu thông tin bắt buộc: ${missingFields.join(', ')}`,
          data: null
        });
      }

      // Validate trạng thái
      const validStatuses = ['chua-nop', 'da-nop', 'da-cham-diem'];
      if (reportData.trang_thai && !validStatuses.includes(reportData.trang_thai)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái không hợp lệ',
          data: null
        });
      }

      const newReport = await ReportModel.createFinalReport(reportData);

      res.status(201).json({
        success: true,
        message: 'Tạo báo cáo cuối kỳ thành công',
        data: newReport
      });
    } catch (error) {
      const statusCode = error.message.includes('đã tồn tại') ? 409 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // PUT /api/reports/final/:id - Cập nhật báo cáo cuối kỳ
  static async updateFinalReport(req, res) {
    try {
      const { id } = req.params;
      const reportData = req.body;

      // Validate trạng thái nếu có
      const validStatuses = ['chua-nop', 'da-nop', 'da-cham-diem'];
      if (reportData.trang_thai && !validStatuses.includes(reportData.trang_thai)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái không hợp lệ',
          data: null
        });
      }

      // Validate điểm nếu có (0-10)
      if (reportData.diem_giang_vien !== undefined && (reportData.diem_giang_vien < 0 || reportData.diem_giang_vien > 10)) {
        return res.status(400).json({
          success: false,
          message: 'Điểm giảng viên phải trong khoảng 0-10',
          data: null
        });
      }

      if (reportData.diem_doanh_nghiep !== undefined && (reportData.diem_doanh_nghiep < 0 || reportData.diem_doanh_nghiep > 10)) {
        return res.status(400).json({
          success: false,
          message: 'Điểm doanh nghiệp phải trong khoảng 0-10',
          data: null
        });
      }

      const updatedReport = await ReportModel.updateFinalReport(id, reportData);

      res.json({
        success: true,
        message: 'Cập nhật báo cáo cuối kỳ thành công',
        data: updatedReport
      });
    } catch (error) {
      const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // POST /api/reports/final/:id/grade-teacher - Chấm điểm báo cáo cuối kỳ (giảng viên)
  static async gradeFinalReportByTeacher(req, res) {
    try {
      const { id } = req.params;
      const { nhan_xet_giang_vien, diem_giang_vien } = req.body;

      // Validate dữ liệu
      if (!nhan_xet_giang_vien && diem_giang_vien === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Cần có nhận xét hoặc điểm để chấm',
          data: null
        });
      }

      if (diem_giang_vien !== undefined && (diem_giang_vien < 0 || diem_giang_vien > 10)) {
        return res.status(400).json({
          success: false,
          message: 'Điểm phải trong khoảng 0-10',
          data: null
        });
      }

      const gradedReport = await ReportModel.gradeFinalReportByTeacher(id, {
        nhan_xet_giang_vien,
        diem_giang_vien
      });

      res.json({
        success: true,
        message: 'Chấm điểm báo cáo cuối kỳ (giảng viên) thành công',
        data: gradedReport
      });
    } catch (error) {
      const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // POST /api/reports/final/:id/grade-company - Chấm điểm báo cáo cuối kỳ (doanh nghiệp)
  static async gradeFinalReportByCompany(req, res) {
    try {
      const { id } = req.params;
      const { nhan_xet_doanh_nghiep, diem_doanh_nghiep } = req.body;

      // Validate dữ liệu
      if (!nhan_xet_doanh_nghiep && diem_doanh_nghiep === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Cần có nhận xét hoặc điểm để chấm',
          data: null
        });
      }

      if (diem_doanh_nghiep !== undefined && (diem_doanh_nghiep < 0 || diem_doanh_nghiep > 10)) {
        return res.status(400).json({
          success: false,
          message: 'Điểm phải trong khoảng 0-10',
          data: null
        });
      }

      const gradedReport = await ReportModel.gradeFinalReportByCompany(id, {
        nhan_xet_doanh_nghiep,
        diem_doanh_nghiep
      });

      res.json({
        success: true,
        message: 'Chấm điểm báo cáo cuối kỳ (doanh nghiệp) thành công',
        data: gradedReport
      });
    } catch (error) {
      const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  // GET /api/reports/statistics - Thống kê báo cáo
  static async getReportStatistics(req, res) {
    try {
      const statistics = await ReportModel.getReportStatistics();

      res.json({
        success: true,
        message: 'Lấy thống kê báo cáo thành công',
        data: statistics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }
}

module.exports = ReportController;
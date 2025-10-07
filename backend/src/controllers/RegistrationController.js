const RegistrationPeriod = require('../models/RegistrationPeriod');

class RegistrationController {
  // GET /api/registration/period - Lấy thông tin đợt đăng ký hiện tại
  static async getCurrentPeriod(req, res) {
    try {
      const status = await RegistrationPeriod.getRegistrationStatus();
      
      res.json({
        success: true,
        data: status,
        message: 'Lấy thông tin đợt đăng ký thành công'
      });
    } catch (error) {
      console.error('Error getting registration period:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống',
        data: null
      });
    }
  }

  // POST /api/registration/period - Tạo đợt đăng ký mới (Admin only)
  static async createPeriod(req, res) {
    try {
      const { title, start_time, end_time, description } = req.body;

      // Validate input
      if (!title || !start_time || !end_time) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin bắt buộc: title, start_time, end_time',
          data: null
        });
      }

      // Validate time logic
      const startDate = new Date(start_time);
      const endDate = new Date(end_time);
      
      if (startDate >= endDate) {
        return res.status(400).json({
          success: false,
          message: 'Thời gian bắt đầu phải trước thời gian kết thúc',
          data: null
        });
      }

      const periodId = await RegistrationPeriod.createOrUpdate({
        title,
        start_time,
        end_time,
        description
      });

      res.status(201).json({
        success: true,
        message: 'Tạo đợt đăng ký thành công',
        data: { id: periodId }
      });
    } catch (error) {
      console.error('Error creating registration period:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống',
        data: null
      });
    }
  }

  // GET /api/registration/history - Lấy lịch sử các đợt đăng ký (Admin only)
  static async getHistory(req, res) {
    try {
      const history = await RegistrationPeriod.getHistory();
      
      res.json({
        success: true,
        data: history,
        message: 'Lấy lịch sử đăng ký thành công'
      });
    } catch (error) {
      console.error('Error getting registration history:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống',
        data: null
      });
    }
  }

  // DELETE /api/registration/period/:id - Xóa đợt đăng ký (Admin only)
  static async deletePeriod(req, res) {
    try {
      const { id } = req.params;
      const deleted = await RegistrationPeriod.deletePeriod(id);
      
      if (deleted) {
        res.json({
          success: true,
          message: 'Xóa đợt đăng ký thành công',
          data: null
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy đợt đăng ký',
          data: null
        });
      }
    } catch (error) {
      console.error('Error deleting registration period:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống',
        data: null
      });
    }
  }

  // PUT /api/registration/period/:id/status - Cập nhật trạng thái hoạt động (Admin only)
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      
      const updated = await RegistrationPeriod.updateActiveStatus(id, is_active);
      
      if (updated) {
        res.json({
          success: true,
          message: 'Cập nhật trạng thái thành công',
          data: null
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy đợt đăng ký',
          data: null
        });
      }
    } catch (error) {
      console.error('Error updating registration status:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống',
        data: null
      });
    }
  }

  // GET /api/registration/check - Kiểm tra có thể đăng ký không
  static async checkRegistrationStatus(req, res) {
    try {
      const isOpen = await RegistrationPeriod.isRegistrationOpen();
      const status = await RegistrationPeriod.getRegistrationStatus();
      
      res.json({
        success: true,
        data: {
          is_open: isOpen,
          ...status
        },
        message: 'Kiểm tra trạng thái đăng ký thành công'
      });
    } catch (error) {
      console.error('Error checking registration status:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống',
        data: null
      });
    }
  }
}

module.exports = RegistrationController;
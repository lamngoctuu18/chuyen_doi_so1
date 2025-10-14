const express = require('express');
const router = express.Router();
const RegistrationPeriodService = require('../services/RegistrationPeriodService');

/**
 * @route   GET /api/registration-periods/status
 * @desc    Kiểm tra trạng thái đăng ký hiện tại (public)
 * @access  Public
 */
router.get('/status', async (req, res) => {
  try {
    const status = await RegistrationPeriodService.checkRegistrationStatus();

    return res.json({
      success: true,
      data: {
        isOpen: status.isOpen,
        period: status.period,
        message: status.message,
        timeRemaining: status.timeRemaining || null,
        reason: status.reason || null
      }
    });

  } catch (error) {
    console.error('❌ Error in check registration status:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra trạng thái đăng ký',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/registration-periods
 * @desc    Lấy danh sách tất cả các đợt đăng ký
 * @access  Admin/Teacher
 */
router.get('/', async (req, res) => {
  try {
    const { is_active, from_date, to_date } = req.query;

    const filters = {};
    if (is_active !== undefined) {
      filters.is_active = is_active === 'true' || is_active === '1';
    }
    if (from_date) filters.from_date = from_date;
    if (to_date) filters.to_date = to_date;

    const periods = await RegistrationPeriodService.getAllRegistrationPeriods(filters);

    return res.json({
      success: true,
      message: 'Lấy danh sách đợt đăng ký thành công',
      data: {
        periods,
        total: periods.length
      }
    });

  } catch (error) {
    console.error('❌ Error in get registration periods:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đợt đăng ký',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/registration-periods
 * @desc    Tạo đợt đăng ký mới
 * @access  Admin
 */
router.post('/', async (req, res) => {
  try {
    const { title, start_time, end_time, description } = req.body;

    // Validation
    if (!title || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: title, start_time, end_time'
      });
    }

    // Validate format datetime
    if (isNaN(Date.parse(start_time)) || isNaN(Date.parse(end_time))) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng thời gian không hợp lệ'
      });
    }

    const result = await RegistrationPeriodService.createRegistrationPeriod({
      title,
      start_time,
      end_time,
      description
    });

    return res.status(201).json({
      success: true,
      message: result.message,
      data: result.data
    });

  } catch (error) {
    console.error('❌ Error in create registration period:', error);

    if (error.message.includes('trùng')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('phải trước')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo đợt đăng ký',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/registration-periods/:periodId/close
 * @desc    Đóng đợt đăng ký
 * @access  Admin
 */
router.put('/:periodId/close', async (req, res) => {
  try {
    const { periodId } = req.params;

    if (!periodId || isNaN(periodId)) {
      return res.status(400).json({
        success: false,
        message: 'ID đợt đăng ký không hợp lệ'
      });
    }

    const result = await RegistrationPeriodService.closeRegistrationPeriod(Number(periodId));

    return res.json({
      success: true,
      message: result.message,
      data: result.data
    });

  } catch (error) {
    console.error('❌ Error in close registration period:', error);

    if (error.message.includes('Không tìm thấy')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('đã được đóng')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Lỗi khi đóng đợt đăng ký',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/registration-periods/:periodId/reopen
 * @desc    Mở lại đợt đăng ký
 * @access  Admin
 */
router.put('/:periodId/reopen', async (req, res) => {
  try {
    const { periodId } = req.params;

    if (!periodId || isNaN(periodId)) {
      return res.status(400).json({
        success: false,
        message: 'ID đợt đăng ký không hợp lệ'
      });
    }

    const result = await RegistrationPeriodService.reopenRegistrationPeriod(Number(periodId));

    return res.json({
      success: true,
      message: result.message,
      data: result.data
    });

  } catch (error) {
    console.error('❌ Error in reopen registration period:', error);

    if (error.message.includes('Không tìm thấy')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('quá thời gian')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Lỗi khi mở lại đợt đăng ký',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/registration-periods/:periodId/extend
 * @desc    Gia hạn thời gian đăng ký
 * @access  Admin
 */
router.put('/:periodId/extend', async (req, res) => {
  try {
    const { periodId } = req.params;
    const { new_end_time } = req.body;

    if (!periodId || isNaN(periodId)) {
      return res.status(400).json({
        success: false,
        message: 'ID đợt đăng ký không hợp lệ'
      });
    }

    if (!new_end_time) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin thời gian kết thúc mới (new_end_time)'
      });
    }

    if (isNaN(Date.parse(new_end_time))) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng thời gian không hợp lệ'
      });
    }

    const result = await RegistrationPeriodService.extendRegistrationPeriod(
      Number(periodId),
      new_end_time
    );

    return res.json({
      success: true,
      message: result.message,
      data: result.data
    });

  } catch (error) {
    console.error('❌ Error in extend registration period:', error);

    if (error.message.includes('Không tìm thấy')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('phải sau')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Lỗi khi gia hạn đợt đăng ký',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

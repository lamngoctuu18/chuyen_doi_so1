const express = require('express');
const router = express.Router();
// Use the existing auth middleware instead of a non-existent verifyJWT
const { authenticateToken } = require('../middleware/auth');
// Backward-compat alias so existing code below stays readable
const verifyJWT = authenticateToken;

// Get notifications for the current user (role-aware)
router.get('/', verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role; // expected: 'sinh-vien' | 'giang-vien' | 'doanh-nghiep' | 'admin'

    // NOTE: This endpoint currently returns mocked data to unblock UI work.
    // Replace with real DB queries (notifications table) when available.
    const now = Date.now();

    /**
     * Build role-specific notifications
     */
    /** @type {any[]} */
    let notifications = [];

    if (userRole === 'sinh-vien') {
      notifications = [
        {
          id: 'sv_deadline_created',
          title: 'Có đợt nộp báo cáo mới',
          message:
            'Giảng viên TS. Nguyễn Văn A đã tạo đợt nộp báo cáo tuần 5. Hạn nộp: 15/12/2025',
          type: 'info',
          isRead: false,
          createdAt: new Date(now - 1000 * 60 * 30).toISOString(),
          userId,
          userRole,
          actionType: 'report_deadline',
          actionUrl: '/student/submissions',
          metadata: {
            weekNumber: 5,
            deadlineDate: new Date('2025-12-15'),
            teacherName: 'TS. Nguyễn Văn A',
          },
        },
        {
          id: 'sv_deadline_warning',
          title: 'Sắp hết hạn nộp báo cáo',
          message: 'Báo cáo tuần 4 sắp hết hạn nộp vào 10/12/2025',
          type: 'warning',
          isRead: false,
          createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
          userId,
          userRole,
          actionType: 'report_deadline',
          actionUrl: '/student/submissions',
          metadata: {
            weekNumber: 4,
            deadlineDate: new Date('2025-12-10'),
            teacherName: 'TS. Trần Thị B',
          },
        },
        {
          id: 'sv_registration_success',
          title: 'Đăng ký thực tập thành công',
          message: 'Đăng ký thực tập đã được xử lý thành công',
          type: 'success',
          isRead: true,
          createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
          userId,
          userRole,
          actionType: 'registration',
        },
        {
          id: 'sv_report_submitted',
          title: 'Nộp báo cáo thành công',
          message: 'Bạn đã nộp báo cáo tuần 3 thành công',
          type: 'success',
          isRead: true,
          createdAt: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
          userId,
          userRole,
          actionType: 'report_submission',
          actionUrl: '/student/submissions',
          metadata: { weekNumber: 3, teacherName: 'TS. Nguyễn Văn A' },
        },
      ];
    } else if (userRole === 'giang-vien') {
      notifications = [
        {
          id: 'gv_student_submitted_1',
          title: 'Sinh viên đã nộp báo cáo',
          message: 'SV001 - Nguyễn Văn B đã nộp báo cáo tuần 5',
          type: 'info',
          isRead: false,
          createdAt: new Date(now - 1000 * 60 * 20).toISOString(),
          userId,
          userRole,
          actionType: 'report_submission',
          actionUrl: '/teacher-submissions',
          metadata: { weekNumber: 5, studentName: 'Nguyễn Văn B' },
        },
        {
          id: 'gv_student_submitted_2',
          title: 'Sinh viên đã nộp báo cáo',
          message: 'SV002 - Trần Thị C đã nộp báo cáo tuần 5',
          type: 'info',
          isRead: false,
          createdAt: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
          userId,
          userRole,
          actionType: 'report_submission',
          actionUrl: '/teacher-submissions',
          metadata: { weekNumber: 5, studentName: 'Trần Thị C' },
        },
      ];
    } else if (userRole === 'doanh-nghiep') {
      notifications = [
        {
          id: 'dn_evaluation_sent',
          title: 'Gửi nhận xét thành công',
          message: 'Nhận xét của bạn đã được gửi tới giảng viên hướng dẫn',
          type: 'success',
          isRead: true,
          createdAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
          userId,
          userRole,
          actionType: 'system',
          actionUrl: '/company-evaluations',
        },
      ];
    } else {
      // Admin: no notifications (UI will hide the bell for admin)
      notifications = [];
    }

    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách thông báo',
    });
  }
});

// Create a new notification
router.post('/', verifyJWT, async (req, res) => {
  try {
    const notification = req.body;
    
    // For now, just return success - in real implementation, save to database
    console.log('Saving notification:', notification);
    
    res.json({
      success: true,
      message: 'Thông báo đã được tạo'
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo thông báo'
    });
  }
});

// Bulk update notifications (must be defined BEFORE `/:id` to avoid route conflicts)
router.patch('/bulk-update', verifyJWT, async (req, res) => {
  try {
    const { notificationIds = [], isRead } = req.body;
    // For now, just return success - in real implementation, update database
    console.log(
      `Bulk updating notifications: ${Array.isArray(notificationIds) ? notificationIds.join(', ') : ''} as ${isRead ? 'read' : 'unread'}`
    );

    res.json({
      success: true,
      message: 'Cập nhật trạng thái thông báo thành công'
    });
  } catch (error) {
    console.error('Error bulk updating notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông báo'
    });
  }
});

// Mark notification as read (single)
router.patch('/:id', verifyJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { isRead } = req.body;
    
    // For now, just return success - in real implementation, update database
    console.log(`Marking notification ${id} as ${isRead ? 'read' : 'unread'}`);
    
    res.json({
      success: true,
      message: 'Cập nhật trạng thái thông báo thành công'
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông báo'
    });
  }
});

// (Note) bulk-update route is now defined above to prevent shadowing by `/:id`.

// Delete notification
router.delete('/:id', verifyJWT, async (req, res) => {
  try {
    const { id } = req.params;
    
    // For now, just return success - in real implementation, delete from database
    console.log(`Deleting notification ${id}`);
    
    res.json({
      success: true,
      message: 'Xóa thông báo thành công'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa thông báo'
    });
  }
});

module.exports = router;
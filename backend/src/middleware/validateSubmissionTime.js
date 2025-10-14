const db = require('../database/connection');

/**
 * Middleware kiểm tra thời gian hợp lệ để nộp bài
 * Kiểm tra:
 * 1. Đợt thực tập có tồn tại không
 * 2. Thời gian nộp bài có hợp lệ không (trong khoảng start_at và end_at)
 * 3. Sinh viên có thuộc đợt thực tập không
 */
async function validateSubmissionTime(req, res, next) {
  try {
    const { slotId } = req.params;
    const maSinhVien = req.user?.ma_sinh_vien || req.body?.ma_sinh_vien;

    if (!maSinhVien) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin sinh viên. Vui lòng đăng nhập lại.'
      });
    }

    if (!slotId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin đợt nộp bài'
      });
    }

    // Lấy thông tin đợt nộp bài
    const [slot] = await db.query(
      `SELECT 
        bccsv.id,
        bccsv.tieu_de,
        bccsv.loai_bao_cao,
        bccsv.start_at,
        bccsv.end_at,
        bccsv.ma_giang_vien,
        bccsv.mo_ta
       FROM dot_nop_bao_cao_theo_tuan bccsv
       WHERE bccsv.id = ?
       LIMIT 1`,
      [slotId]
    );

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đợt nộp bài này'
      });
    }

    // Kiểm tra thời gian
    const now = new Date();
    const startTime = new Date(slot.start_at);
    const endTime = new Date(slot.end_at);

    if (now < startTime) {
      return res.status(400).json({
        success: false,
        message: `Đợt nộp bài chưa mở. Thời gian bắt đầu: ${startTime.toLocaleString('vi-VN')}`,
        data: {
          start_at: slot.start_at,
          end_at: slot.end_at,
          current_time: now.toISOString()
        }
      });
    }

    if (now > endTime) {
      return res.status(400).json({
        success: false,
        message: `Hết hạn nộp bài. Thời gian kết thúc: ${endTime.toLocaleString('vi-VN')}`,
        data: {
          start_at: slot.start_at,
          end_at: slot.end_at,
          current_time: now.toISOString()
        }
      });
    }

    // Kiểm tra sinh viên có thuộc giảng viên quản lý đợt này không
    const [studentTeacher] = await db.query(
      `SELECT ma_giang_vien 
       FROM sinh_vien_huong_dan 
       WHERE ma_sinh_vien = ? 
       LIMIT 1`,
      [maSinhVien]
    );

    if (!studentTeacher || studentTeacher.ma_giang_vien !== slot.ma_giang_vien) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền nộp bài vào đợt này'
      });
    }

    // Gắn thông tin slot vào request để sử dụng ở controller
    req.slot = slot;
    req.validatedSinhVien = maSinhVien;
    
    next();
  } catch (error) {
    console.error('❌ Error in validateSubmissionTime middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi kiểm tra thời gian nộp bài',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = { validateSubmissionTime };

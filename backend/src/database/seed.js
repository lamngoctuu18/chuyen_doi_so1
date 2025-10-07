const { query } = require('./connection');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const seedData = async () => {
  try {
    console.log('🌱 Bắt đầu tạo dữ liệu mẫu...');

    // Xóa dữ liệu cũ theo thứ tự (child tables trước)
    console.log('🗑️ Xóa dữ liệu cũ...');
    await query('DELETE FROM final_reports');
    await query('DELETE FROM weekly_reports');
    await query('DELETE FROM applications');
    await query('DELETE FROM job_postings');
    await query('DELETE FROM internship_assignments');
    await query('DELETE FROM internship_batches');
    await query('DELETE FROM companies');
    await query('DELETE FROM teachers');
    await query('DELETE FROM students');
    await query('DELETE FROM users');
    console.log('✅ Đã xóa dữ liệu cũ!');

    // Hash password
    const hashedPassword = await bcrypt.hash('123456', 12);

    // 1. Tạo users
    const adminId = uuidv4();
    const studentId = uuidv4();
    const teacherId = uuidv4();
    const companyId = uuidv4();

    await query(`
      INSERT INTO users (id, email, password, name, role, phone, is_active, email_verified) VALUES
      (?, 'admin@dainam.edu.vn', ?, 'Quản trị viên', 'admin', '0123456789', TRUE, TRUE),
      (?, 'sv001@student.dainam.edu.vn', ?, 'Nguyễn Văn An', 'sinh-vien', '0987654321', TRUE, TRUE),
      (?, 'gv001@dainam.edu.vn', ?, 'PGS.TS Trần Thị Hoa', 'giang-vien', '0912345678', TRUE, TRUE),
      (?, 'contact@techcorp.com', ?, 'Công ty TechCorp', 'doanh-nghiep', '0901234567', TRUE, TRUE)
    `, [adminId, hashedPassword, studentId, hashedPassword, teacherId, hashedPassword, companyId, hashedPassword]);

    // 2. Tạo students
    const studentDbId = uuidv4();
    await query(`
      INSERT INTO students (id, user_id, ma_sv, ho_ten, ngay_sinh, email, sdt, lop, khoa, trang_thai_thuc_tap) VALUES
      (?, ?, 'SV2023001', 'Nguyễn Văn An', '2001-05-15', 'sv001@student.dainam.edu.vn', '0987654321', 'CNTT2023A', 'Công nghệ thông tin', 'chua-dang-ky'),
      (?, NULL, 'SV2023002', 'Trần Thị Bình', '2001-08-20', 'sv002@student.dainam.edu.vn', '0987654322', 'CNTT2023A', 'Công nghệ thông tin', 'da-dang-ky'),
      (?, NULL, 'SV2023003', 'Lê Hoàng Cường', '2001-12-10', 'sv003@student.dainam.edu.vn', '0987654323', 'CNTT2023B', 'Công nghệ thông tin', 'dang-thuc-tap'),
      (?, NULL, 'SV2023004', 'Phạm Minh Đức', '2001-03-25', 'sv004@student.dainam.edu.vn', '0987654324', 'CNTT2023B', 'Công nghệ thông tin', 'hoan-thanh')
    `, [studentDbId, studentId, uuidv4(), uuidv4(), uuidv4()]);

    // 3. Tạo teachers
    const teacherDbId = uuidv4();
    await query(`
      INSERT INTO teachers (id, user_id, ma_gv, ho_ten, email, sdt, noi_cong_tac, chuyen_mon) VALUES
      (?, ?, 'GV001', 'PGS.TS Trần Thị Hoa', 'gv001@dainam.edu.vn', '0912345678', 'Khoa CNTT - Đại học Đại Nam', 'Phát triển phần mềm'),
      (?, NULL, 'GV002', 'TS. Nguyễn Văn Minh', 'gv002@dainam.edu.vn', '0912345679', 'Khoa CNTT - Đại học Đại Nam', 'Trí tuệ nhân tạo'),
      (?, NULL, 'GV003', 'ThS. Lê Thị Mai', 'gv003@dainam.edu.vn', '0912345680', 'Khoa CNTT - Đại học Đại Nam', 'Hệ thống thông tin')
    `, [teacherDbId, teacherId, uuidv4(), uuidv4()]);

    // 4. Tạo companies
    const companyDbId = uuidv4();
    await query(`
      INSERT INTO companies (id, user_id, ten_dn, nguoi_lien_he, email, sdt, dia_chi, mo_ta, website, is_verified) VALUES
      (?, ?, 'Công ty TNHH TechCorp', 'Nguyễn Văn Manager', 'contact@techcorp.com', '0901234567', 'Tầng 15, Tòa nhà ABC, Hà Nội', 'Công ty phát triển phần mềm hàng đầu', 'https://techcorp.com', TRUE),
      (?, NULL, 'Công ty CP SoftDev', 'Trần Thị Director', 'hr@softdev.vn', '0901234568', 'Số 123 Đường XYZ, TP.HCM', 'Chuyên về phát triển ứng dụng di động', 'https://softdev.vn', TRUE),
      (?, NULL, 'Công ty TNHH DataMining', 'Lê Văn Lead', 'contact@datamining.vn', '0901234569', 'Tầng 8, Tòa nhà DEF, Đà Nẵng', 'Phân tích dữ liệu và AI', 'https://datamining.vn', FALSE)
    `, [companyDbId, companyId, uuidv4(), uuidv4()]);

    // 5. Tạo internship_batches
    const batchId = uuidv4();
    await query(`
      INSERT INTO internship_batches (id, ten_dot, thoi_gian_bat_dau, thoi_gian_ket_thuc, mo_ta, trang_thai, created_by) VALUES
      (?, 'Đợt thực tập Hè 2024', '2024-06-01', '2024-08-31', 'Đợt thực tập hè dành cho sinh viên năm 3', 'ket-thuc', ?),
      (?, 'Đợt thực tập Thu Đông 2024', '2024-09-01', '2024-12-31', 'Đợt thực tập cuối năm', 'dang-dien-ra', ?),
      (?, 'Đợt thực tập Xuân 2025', '2025-02-01', '2025-05-31', 'Đợt thực tập xuân 2025', 'sap-mo', ?)
    `, [batchId, adminId, uuidv4(), adminId, uuidv4(), adminId]);

    // 6. Tạo job_postings
    const jobId = uuidv4();
    await query(`
      INSERT INTO job_postings (id, doanh_nghiep_id, tieu_de, mo_ta_cong_viec, so_luong, ky_nang_yeu_cau, thoi_gian_thuc_tap, muc_luong, dia_diem, trang_thai, ngay_het_han) VALUES
      (?, ?, 'Thực tập sinh Lập trình Web', 'Phát triển ứng dụng web với ReactJS và Node.js', 3, '["JavaScript", "ReactJS", "Node.js", "MySQL"]', '3 tháng', '3,000,000 - 5,000,000 VNĐ', 'Hà Nội', 'mo', '2024-12-31')
    `, [jobId, companyDbId]);

    // 7. Tạo internship_assignments
    const assignmentId = uuidv4();
    await query(`
      INSERT INTO internship_assignments (id, sinh_vien_id, doanh_nghiep_id, dot_thuc_tap_id, giang_vien_huong_dan_id, ngay_bat_dau, ngay_ket_thuc, trang_thai, ghi_chu) VALUES
      (?, ?, ?, ?, ?, '2024-09-15', '2024-12-15', 'dang-dien-ra', 'Thực tập tại phòng R&D')
    `, [assignmentId, studentDbId, companyDbId, batchId, teacherDbId]);

    // 8. Tạo applications
    const jobId2 = uuidv4();
    await query(`
      INSERT INTO job_postings (id, doanh_nghiep_id, tieu_de, mo_ta_cong_viec, so_luong, ky_nang_yeu_cau, thoi_gian_thuc_tap, muc_luong, dia_diem, trang_thai, ngay_het_han) VALUES
      (?, ?, 'Thực tập sinh Mobile App', 'Phát triển ứng dụng di động với React Native', 2, '["React Native", "JavaScript", "Firebase"]', '4 tháng', '4,000,000 - 6,000,000 VNĐ', 'TP.HCM', 'mo', '2024-12-25')
    `, [jobId2, companyDbId]);

    await query(`
      INSERT INTO applications (id, sinh_vien_id, job_posting_id, thu_xin_viec, trang_thai, ngay_ung_tuyen) VALUES
      (?, ?, ?, 'Em rất mong muốn được thực tập tại công ty để học hỏi kinh nghiệm thực tế.', 'duyet', NOW()),
      (?, ?, ?, 'Em có kinh nghiệm về React Native và muốn phát triển thêm kỹ năng mobile.', 'cho-duyet', NOW())
    `, [uuidv4(), studentDbId, jobId, uuidv4(), studentDbId, jobId2]);

    // 9. Tạo weekly_reports
    await query(`
      INSERT INTO weekly_reports (id, sinh_vien_id, assignment_id, tuan, noi_dung, ngay_nop, trang_thai, nhan_xet_giang_vien, diem) VALUES
      (?, ?, ?, 1, 'Tuần đầu tiên: Làm quen với môi trường làm việc, tìm hiểu về dự án được giao.', NOW(), 'da-duyet', 'Sinh viên thích ứng tốt với môi trường mới.', 8.5),
      (?, ?, ?, 2, 'Tuần thứ hai: Học về React hooks và state management, bắt đầu code component đầu tiên.', NOW(), 'da-duyet', 'Tiến độ học tập tốt, cần cải thiện kỹ năng debug.', 8.0),
      (?, ?, ?, 3, 'Tuần thứ ba: Hoàn thành module đăng nhập, tích hợp API authentication.', NOW(), 'da-nop', NULL, NULL)
    `, [uuidv4(), studentDbId, assignmentId, uuidv4(), studentDbId, assignmentId, uuidv4(), studentDbId, assignmentId]);

    // 10. Tạo final_reports
    await query(`
      INSERT INTO final_reports (id, sinh_vien_id, assignment_id, tieu_de, tom_tat, file_bao_cao, ngay_nop, trang_thai) VALUES
      (?, ?, ?, 'Báo cáo thực tập: Phát triển hệ thống quản lý bán hàng', 'Trong quá trình thực tập, em đã tham gia phát triển hệ thống quản lý bán hàng sử dụng ReactJS và Node.js...', '/uploads/reports/final_report_sv001.pdf', NOW(), 'da-nop')
    `, [uuidv4(), studentDbId, assignmentId]);

    console.log('✅ Tạo dữ liệu mẫu thành công!');
    console.log('📊 Dữ liệu demo:');
    console.log('   👤 Admin: admin@dainam.edu.vn / 123456');
    console.log('   🎓 Sinh viên: sv001@student.dainam.edu.vn / 123456');
    console.log('   👨‍🏫 Giảng viên: gv001@dainam.edu.vn / 123456');
    console.log('   🏢 Doanh nghiệp: contact@techcorp.com / 123456');

  } catch (error) {
    console.error('❌ Lỗi tạo dữ liệu mẫu:', error);
    throw error;
  }
};

// Chạy seeding
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('🎉 Seeding hoàn thành!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding thất bại:', error);
      process.exit(1);
    });
}

module.exports = { seedData };
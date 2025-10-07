-- Create some simple sample assignments to test the supervision overview
INSERT IGNORE INTO phan_cong_thuc_tap (
  dot_thuc_tap_id, sinh_vien_id, doanh_nghiep_id, giang_vien_id,
  ngay_bat_dau, ngay_ket_thuc, trang_thai,
  diem_giang_vien, nhan_xet_giang_vien
) VALUES 
(1, 1, 1, 1, '2025-02-01', '2025-05-31', 'dang-dien-ra', 8.5, 'Sinh viên thực tập tốt'),
(1, 2, 1, 1, '2025-02-01', '2025-05-31', 'dang-dien-ra', NULL, NULL),
(1, 3, 1, 2, '2025-02-01', '2025-05-31', 'dang-dien-ra', 9.0, 'Sinh viên xuất sắc'),
(1, 4, 1, 2, '2025-02-01', '2025-05-31', 'dang-dien-ra', 8.0, 'Sinh viên hoàn thành tốt'),
(1, 5, 1, 3, '2025-02-01', '2025-05-31', 'dang-dien-ra', NULL, NULL);
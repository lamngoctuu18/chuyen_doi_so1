-- Chạy lệnh này trong MySQL Workbench hoặc phpMyAdmin
-- Để tạo các cột mới cho đăng ký thực tập

USE quanly_thuctap;

-- Kiểm tra cấu trúc hiện tại
DESCRIBE sinh_vien;

-- Thêm cột nguyen_vong_thuc_tap
ALTER TABLE sinh_vien 
ADD COLUMN nguyen_vong_thuc_tap ENUM('khoa_gioi_thieu', 'tu_lien_he') DEFAULT NULL COMMENT 'Nguyện vọng thực tập: khoa giới thiệu hoặc tự liên hệ';

-- Thêm các cột cho trường hợp sinh viên tự liên hệ
ALTER TABLE sinh_vien 
ADD COLUMN cong_ty_tu_lien_he VARCHAR(255) DEFAULT NULL COMMENT 'Tên công ty khi sinh viên tự liên hệ';

ALTER TABLE sinh_vien 
ADD COLUMN dia_chi_cong_ty VARCHAR(500) DEFAULT NULL COMMENT 'Địa chỉ công ty khi sinh viên tự liên hệ';

ALTER TABLE sinh_vien 
ADD COLUMN nguoi_lien_he_cong_ty VARCHAR(255) DEFAULT NULL COMMENT 'Tên người liên hệ tại công ty';

ALTER TABLE sinh_vien 
ADD COLUMN sdt_nguoi_lien_he VARCHAR(20) DEFAULT NULL COMMENT 'Số điện thoại người liên hệ tại công ty';

-- Kiểm tra lại cấu trúc sau khi thêm
DESCRIBE sinh_vien;

SELECT 'Hoàn thành tạo cột mới cho đăng ký thực tập!' as status;
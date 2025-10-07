-- To be run manually in your MySQL database
-- Add nguyen_vong_thuc_tap column to sinh_vien table

USE quanly_thuctap;

ALTER TABLE sinh_vien 
ADD COLUMN nguyen_vong_thuc_tap ENUM('khoa_gioi_thieu', 'tu_lien_he') DEFAULT NULL COMMENT 'Nguyện vọng thực tập: khoa_gioi_thieu hoặc tu_lien_he';

ALTER TABLE sinh_vien 
ADD COLUMN cong_ty_tu_lien_he VARCHAR(255) DEFAULT NULL COMMENT 'Tên công ty khi sinh viên tự liên hệ';

ALTER TABLE sinh_vien 
ADD COLUMN dia_chi_cong_ty VARCHAR(500) DEFAULT NULL COMMENT 'Địa chỉ công ty khi sinh viên tự liên hệ';

ALTER TABLE sinh_vien 
ADD COLUMN nguoi_lien_he_cong_ty VARCHAR(255) DEFAULT NULL COMMENT 'Tên người liên hệ tại công ty';

ALTER TABLE sinh_vien 
ADD COLUMN sdt_nguoi_lien_he VARCHAR(20) DEFAULT NULL COMMENT 'Số điện thoại người liên hệ tại công ty';

-- Verify the changes
DESCRIBE sinh_vien;
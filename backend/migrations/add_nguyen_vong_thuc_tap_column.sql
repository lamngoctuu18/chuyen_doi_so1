-- Add nguyen_vong_thuc_tap column to sinh_vien table
ALTER TABLE sinh_vien 
ADD COLUMN nguyen_vong_thuc_tap ENUM('khoa_gioi_thieu', 'tu_lien_he') DEFAULT NULL;

-- Add columns for company information when student chooses 'tu_lien_he'
ALTER TABLE sinh_vien 
ADD COLUMN cong_ty_tu_lien_he VARCHAR(255) DEFAULT NULL,
ADD COLUMN dia_chi_cong_ty VARCHAR(500) DEFAULT NULL,
ADD COLUMN nguoi_lien_he_cong_ty VARCHAR(255) DEFAULT NULL,
ADD COLUMN sdt_nguoi_lien_he VARCHAR(20) DEFAULT NULL;

-- Add comment to explain the columns
ALTER TABLE sinh_vien 
MODIFY COLUMN nguyen_vong_thuc_tap ENUM('khoa_gioi_thieu', 'tu_lien_he') DEFAULT NULL COMMENT 'Nguyện vọng thực tập: khoa_gioi_thieu hoặc tu_lien_he',
MODIFY COLUMN cong_ty_tu_lien_he VARCHAR(255) DEFAULT NULL COMMENT 'Tên công ty khi sinh viên tự liên hệ',
MODIFY COLUMN dia_chi_cong_ty VARCHAR(500) DEFAULT NULL COMMENT 'Địa chỉ công ty khi sinh viên tự liên hệ',
MODIFY COLUMN nguoi_lien_he_cong_ty VARCHAR(255) DEFAULT NULL COMMENT 'Tên người liên hệ tại công ty',
MODIFY COLUMN sdt_nguoi_lien_he VARCHAR(20) DEFAULT NULL COMMENT 'Số điện thoại người liên hệ tại công ty';
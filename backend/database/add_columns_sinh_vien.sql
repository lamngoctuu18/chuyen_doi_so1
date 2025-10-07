-- Script để thêm 2 cột mới vào bảng sinh_vien
USE quanly_thuctap;

-- Thêm cột vi_tri_muon_ung_tuyen_thuc_tap
ALTER TABLE sinh_vien 
ADD COLUMN vi_tri_muon_ung_tuyen_thuc_tap VARCHAR(255) DEFAULT NULL 
COMMENT 'Vị trí muốn ứng tuyển thực tập';

-- Thêm cột don_vi_thuc_tap
ALTER TABLE sinh_vien 
ADD COLUMN don_vi_thuc_tap VARCHAR(255) DEFAULT NULL 
COMMENT 'Đơn vị thực tập';

-- Kiểm tra cấu trúc bảng sau khi thêm
DESCRIBE sinh_vien;
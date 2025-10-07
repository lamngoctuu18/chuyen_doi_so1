-- Chạy các lệnh SQL này trong MySQL để tạo cột mới cho bảng sinh_vien

USE quanly_thuctap;

-- Thêm cột nguyện vọng thực tập
ALTER TABLE sinh_vien 
ADD COLUMN nguyen_vong_thuc_tap ENUM('khoa_gioi_thieu', 'tu_lien_he') DEFAULT NULL COMMENT 'Nguyện vọng thực tập';

-- Thêm các cột thông tin công ty khi sinh viên tự liên hệ
ALTER TABLE sinh_vien 
ADD COLUMN cong_ty_tu_lien_he VARCHAR(255) DEFAULT NULL COMMENT 'Tên công ty tự liên hệ';

ALTER TABLE sinh_vien 
ADD COLUMN dia_chi_cong_ty VARCHAR(500) DEFAULT NULL COMMENT 'Địa chỉ công ty';

ALTER TABLE sinh_vien 
ADD COLUMN nguoi_lien_he_cong_ty VARCHAR(255) DEFAULT NULL COMMENT 'Người liên hệ tại công ty';

ALTER TABLE sinh_vien 
ADD COLUMN sdt_nguoi_lien_he VARCHAR(20) DEFAULT NULL COMMENT 'SĐT người liên hệ';

-- Kiểm tra kết quả
DESCRIBE sinh_vien;
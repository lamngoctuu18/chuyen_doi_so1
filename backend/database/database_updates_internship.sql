-- Cập nhật bảng sinh_vien để hỗ trợ thông tin từ Google Form
ALTER TABLE sinh_vien 
ADD COLUMN nguyen_vong_thuc_tap ENUM('tu-lien-he', 'khoa-gioi-thieu') DEFAULT 'khoa-gioi-thieu' COMMENT 'Nguyện vọng thực tập',
ADD COLUMN ten_cong_ty VARCHAR(255) NULL COMMENT 'Tên công ty tự liên hệ',
ADD COLUMN dia_chi_cong_ty TEXT NULL COMMENT 'Địa chỉ công ty tự liên hệ', 
ADD COLUMN nguoi_lien_he VARCHAR(255) NULL COMMENT 'Người liên hệ tại công ty + SĐT',
ADD COLUMN vi_tri_mong_muon VARCHAR(100) NULL COMMENT 'Vị trí mong muốn thực tập',
ADD COLUMN ghi_chu_thuc_tap TEXT NULL COMMENT 'Ghi chú thêm về thực tập',
ADD COLUMN ngay_dang_ky_thuc_tap DATETIME NULL COMMENT 'Ngày đăng ký thực tập qua form',
ADD COLUMN trang_thai_phan_cong ENUM('chua-phan-cong', 'da-phan-cong', 'da-xep-nhom') DEFAULT 'chua-phan-cong' COMMENT 'Trạng thái phân công thực tập',
ADD COLUMN nhom_thuc_tap VARCHAR(50) NULL COMMENT 'Nhóm thực tập được phân công';

-- Tạo bảng phân loại vị trí thực tập
CREATE TABLE vi_tri_thuc_tap (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ten_vi_tri VARCHAR(100) NOT NULL UNIQUE COMMENT 'Tên vị trí thực tập',
  mo_ta TEXT COMMENT 'Mô tả vị trí',
  mau_sac VARCHAR(7) DEFAULT '#3B82F6' COMMENT 'Màu sắc hiển thị (hex code)',
  thu_tu_hien_thi INT DEFAULT 0 COMMENT 'Thứ tự hiển thị',
  trang_thai ENUM('active', 'inactive') DEFAULT 'active',
  ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
  ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert các vị trí thực tập mặc định
INSERT INTO vi_tri_thuc_tap (ten_vi_tri, mo_ta, mau_sac, thu_tu_hien_thi) VALUES
('Lập trình viên (Developer)', 'Phát triển ứng dụng web, mobile, desktop', '#10B981', 1),
('Thiết kế website', 'Thiết kế giao diện người dùng, UX/UI', '#F59E0B', 2),
('Phân tích & thiết kế hệ thống', 'Phân tích nghiệp vụ, thiết kế kiến trúc hệ thống', '#8B5CF6', 3),
('Quản trị mạng', 'Quản lý hạ tầng mạng, bảo mật', '#EF4444', 4),
('Quản trị cơ sở dữ liệu', 'Thiết kế, quản lý và tối ưu database', '#3B82F6', 5),
('Tester', 'Kiểm thử phần mềm, đảm bảo chất lượng', '#06B6D4', 6),
('Hỗ trợ kỹ thuật (IT Support)', 'Hỗ trợ người dùng, bảo trì hệ thống', '#84CC16', 7),
('AI & IoT', 'Trí tuệ nhân tạo, Internet of Things', '#F97316', 8),
('Khác', 'Các vị trí khác không thuộc danh mục trên', '#6B7280', 9);

-- Tạo bảng lịch sử import
CREATE TABLE lich_su_import_thuc_tap (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ten_file VARCHAR(255) NOT NULL,
  so_ban_ghi_thanh_cong INT DEFAULT 0,
  so_ban_ghi_loi INT DEFAULT 0,
  chi_tiet_loi TEXT COMMENT 'Chi tiết các lỗi khi import (JSON)',
  nguoi_import_id INT,
  ngay_import DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (nguoi_import_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Cập nhật chỉ mục cho tìm kiếm nhanh
CREATE INDEX idx_sinh_vien_vi_tri_mong_muon ON sinh_vien(vi_tri_mong_muon);
CREATE INDEX idx_sinh_vien_nguyen_vong ON sinh_vien(nguyen_vong_thuc_tap);
CREATE INDEX idx_sinh_vien_trang_thai_phan_cong ON sinh_vien(trang_thai_phan_cong);
CREATE INDEX idx_sinh_vien_nhom_thuc_tap ON sinh_vien(nhom_thuc_tap);

-- View để thống kê sinh viên theo vị trí
CREATE VIEW v_thong_ke_vi_tri_thuc_tap AS
SELECT 
  vtt.ten_vi_tri,
  vtt.mau_sac,
  COUNT(sv.id) as so_luong_sinh_vien,
  COUNT(CASE WHEN sv.trang_thai_phan_cong = 'chua-phan-cong' THEN 1 END) as chua_phan_cong,
  COUNT(CASE WHEN sv.trang_thai_phan_cong = 'da-phan-cong' THEN 1 END) as da_phan_cong,
  COUNT(CASE WHEN sv.trang_thai_phan_cong = 'da-xep-nhom' THEN 1 END) as da_xep_nhom
FROM vi_tri_thuc_tap vtt
LEFT JOIN sinh_vien sv ON vtt.ten_vi_tri = sv.vi_tri_mong_muon
WHERE vtt.trang_thai = 'active'
GROUP BY vtt.id, vtt.ten_vi_tri, vtt.mau_sac, vtt.thu_tu_hien_thi
ORDER BY vtt.thu_tu_hien_thi;
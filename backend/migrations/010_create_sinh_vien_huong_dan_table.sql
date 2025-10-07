-- Migration: Tạo bảng sinh_vien_huong_dan
-- Mục đích: Lưu trữ mối quan hệ giảng viên - sinh viên hướng dẫn

CREATE TABLE IF NOT EXISTS sinh_vien_huong_dan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ma_giang_vien VARCHAR(20) NOT NULL COMMENT 'Mã giảng viên (foreign key)',
    ma_sinh_vien VARCHAR(20) NOT NULL COMMENT 'Mã sinh viên',
    ho_ten_sinh_vien VARCHAR(255) NOT NULL COMMENT 'Họ tên sinh viên',
    email_sinh_vien VARCHAR(255) NULL COMMENT 'Email sinh viên',
    so_dien_thoai_sinh_vien VARCHAR(20) NULL COMMENT 'Số điện thoại sinh viên',
    lop_sinh_vien VARCHAR(100) NULL COMMENT 'Lớp sinh viên',
    ngay_sinh_sinh_vien DATE NULL COMMENT 'Ngày sinh sinh viên',
    vi_tri_thuc_tap VARCHAR(255) NULL COMMENT 'Vị trí thực tập',
    doanh_nghiep_thuc_tap VARCHAR(255) NULL COMMENT 'Doanh nghiệp thực tập',
    nguyen_vong_thuc_tap VARCHAR(255) NULL COMMENT 'Nguyện vọng thực tập',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
    
    -- Indexes
    INDEX idx_ma_giang_vien (ma_giang_vien),
    INDEX idx_ma_sinh_vien (ma_sinh_vien),
    
    -- Unique constraint để tránh trùng lặp
    UNIQUE KEY unique_gv_sv (ma_giang_vien, ma_sinh_vien),
    
    -- Foreign key constraint
    FOREIGN KEY (ma_giang_vien) REFERENCES giang_vien(ma_giang_vien) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu trữ mối quan hệ giảng viên - sinh viên hướng dẫn';

-- Thêm cột số lượng sinh viên hướng dẫn vào bảng giang_vien nếu chưa có
ALTER TABLE giang_vien 
ADD COLUMN so_sinh_vien_huong_dan INT DEFAULT 0 COMMENT 'Số lượng sinh viên hướng dẫn' 
AFTER bang_cap;
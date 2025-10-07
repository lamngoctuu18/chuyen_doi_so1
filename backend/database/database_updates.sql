-- Bảng đăng ký thực tập của sinh viên
CREATE TABLE IF NOT EXISTS dang_ky_sinh_vien (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sinh_vien_id INT NOT NULL,
    dang_ky_doanh_nghiep_id INT NOT NULL,
    ngay_dang_ky TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    trang_thai ENUM('cho-duyet', 'da-duyet', 'bi-tu-choi') DEFAULT 'cho-duyet',
    ly_do_tu_choi TEXT NULL,
    ghi_chu TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sinh_vien_id) REFERENCES sinh_vien(id) ON DELETE CASCADE,
    FOREIGN KEY (dang_ky_doanh_nghiep_id) REFERENCES dang_ky_doanh_nghiep(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_registration (sinh_vien_id, dang_ky_doanh_nghiep_id)
);

-- Thêm cột trạng thái duyệt cho đăng ký doanh nghiệp  
ALTER TABLE dang_ky_doanh_nghiep 
ADD COLUMN trang_thai_duyet ENUM('cho-duyet', 'da-duyet', 'bi-tu-choi') DEFAULT 'cho-duyet',
ADD COLUMN ly_do_tu_choi TEXT NULL,
ADD COLUMN ngay_duyet TIMESTAMP NULL,
ADD COLUMN nguoi_duyet INT NULL;
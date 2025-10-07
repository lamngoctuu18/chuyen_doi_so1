-- Tạo bảng để lưu mã xác minh reset password
CREATE TABLE IF NOT EXISTS password_reset_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used BOOLEAN DEFAULT FALSE,
    INDEX idx_email_code (email, code),
    INDEX idx_expires_at (expires_at),
    UNIQUE KEY unique_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm comment cho bảng
ALTER TABLE password_reset_codes COMMENT = 'Lưu trữ mã xác minh để reset password';

-- Hiển thị cấu trúc bảng
DESCRIBE password_reset_codes;
-- Migration: Create accounts table
-- File: migrations/003_create_accounts_table.sql

CREATE TABLE IF NOT EXISTS accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã đăng nhập (mã sinh viên, mã giảng viên, mã doanh nghiệp)',
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'sinh-vien', 'giang-vien', 'doanh-nghiep') NOT NULL,
    phone VARCHAR(20) NULL,
    department VARCHAR(100) NULL COMMENT 'Khoa/Phòng ban (dành cho giảng viên)',
    class VARCHAR(50) NULL COMMENT 'Lớp (dành cho sinh viên)',
    company_name VARCHAR(255) NULL COMMENT 'Tên công ty (dành cho doanh nghiệp)',
    company_address TEXT NULL COMMENT 'Địa chỉ công ty',
    position VARCHAR(100) NULL COMMENT 'Chức vụ',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng tài khoản người dùng';

-- Insert admin account
INSERT INTO accounts (user_id, email, password_hash, full_name, role, is_active) 
VALUES ('admin001', 'admin@dainam.edu.vn', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Quản trị viên hệ thống', 'admin', TRUE)
ON DUPLICATE KEY UPDATE 
    email = VALUES(email),
    full_name = VALUES(full_name),
    role = VALUES(role),
    is_active = VALUES(is_active);
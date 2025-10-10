-- Migration: Add cv_path column to sinh_vien table
-- Created: 2025-10-10
-- Description: Add CV file path column for internship registration

USE quan_ly_thuc_tap;

-- Add cv_path column to sinh_vien table
ALTER TABLE sinh_vien 
ADD COLUMN cv_path VARCHAR(255) NULL COMMENT 'Path to uploaded CV file' 
AFTER sdt_nguoi_lien_he;

-- Create index for cv_path column (optional, for performance)
CREATE INDEX idx_sinh_vien_cv_path ON sinh_vien(cv_path);

-- Update existing records to have NULL cv_path (already default)
-- No need to update as NULL is the default

COMMIT;
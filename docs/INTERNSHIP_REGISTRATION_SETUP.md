# Student Internship Registration Setup Instructions

## Database Setup
Run the following SQL commands in your MySQL database to add the required columns:

```sql
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
```

## Features Added

### Frontend:
1. **Student Internship Registration Form** (`/internship-registration`)
   - Auto-fills student information from API
   - Two registration options:
     - "Khoa giới thiệu" (School introduction)
     - "Tự liên hệ" (Self-contact)
   - When selecting "Tự liên hệ", additional company fields appear:
     - Company name
     - Company address  
     - Contact person
     - Contact phone number
   - Position selection with predefined options
   - Beautiful responsive design with improved header

2. **Navigation**
   - Added "Đăng ký thực tập" menu item for students
   - Only visible to users with 'sinh-vien' role

### Backend:
1. **New API Endpoints**:
   - `POST /api/sinh-vien/register-internship` - Submit internship registration
   - `GET /api/sinh-vien/my-registration` - Get current student's registration info

2. **Database Schema**:
   - Added new columns to `sinh_vien` table for internship preferences
   - Uses existing columns `vi_tri_muon_ung_tuyen_thuc_tap` and `don_vi_thuc_tap`

3. **Business Logic**:
   - Validates required fields based on registration type
   - Updates student record directly (no separate table needed)
   - Proper error handling and validation

## How to Test

1. Run the SQL migration above
2. Start your backend server
3. Start your frontend development server  
4. Login as a student account
5. Navigate to "Đăng ký thực tập" in the menu
6. Fill out the form and test both registration options

## File Structure

### Frontend Files:
- `src/pages/StudentInternshipRegistrationForm.tsx` - Main registration form component
- `src/hooks/useStudentInternship.ts` - API hook for registration calls

### Backend Files:
- `backend/src/controllers/StudentController.js` - Added registration methods
- `backend/src/models/SinhVien.js` - Added database methods
- `backend/src/routes/SinhVien.js` - Added new routes

### Database Migration:
- `MANUAL_DB_UPDATE.sql` - SQL commands to add new columns
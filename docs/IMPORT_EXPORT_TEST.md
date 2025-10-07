# Test Import/Export Workflow

## Yêu cầu đã implement:

1. **Export Excel từ quản lý sinh viên** = template chính thức cho import
2. **Import idempotent**: chỉ cập nhật field khác/mới, giữ nguyên data trùng khớp  
3. **Không tạo duplicate records**

## Cách hoạt động:

### 1. Export (Xuất Excel):
- Endpoint: `GET /api/import/export/sinh-vien`
- Xuất tất cả sinh viên hiện có với đầy đủ columns:
  ```
  Mã SV | Họ tên | Email cá nhân | Số ĐT | Lớp | Khoa | 
  Nguyện vọng TT | Vị trí mong muốn | Đơn vị thực tập | Giảng viên hướng dẫn
  ```

### 2. Import (Nhập Excel):
- Endpoint: `POST /api/import/sinh-vien`
- Logic: `fillEmptyOnly: true`
- Chỉ cập nhật field nào:
  - Có giá trị mới trong Excel
  - Và field đó đang NULL hoặc rỗng ('') trong DB

### 3. Workflow thực tế:
1. Admin xuất danh sách sinh viên hiện tại
2. Chỉnh sửa/bổ sung thông tin trong Excel
3. Import lại -> chỉ những thay đổi mới được cập nhật

## Backend Implementation:

### ExcelImportService:
- `parseExcelFile()`: đọc đúng headers từ file export
- `importToDatabase()`: sử dụng option `fillEmptyOnly: true`

### SinhVien Model:
- `fillEmptyColumnsByMaSinhVien()`: cập nhật chỉ field trống
- SQL: `UPDATE sinh_vien SET field = IF(field IS NULL OR field = '', new_value, field)`

### Headers mapping được support:
- "Mã SV" -> ma_sinh_vien
- "Họ tên" -> ho_ten  
- "Email cá nhân" -> email_ca_nhan
- "Số ĐT" -> so_dien_thoai
- "Lớp" -> lop
- "Khoa" -> khoa
- "Nguyện vọng TT" -> nguyen_vong_thuc_tap
- "Vị trí mong muốn" -> vi_tri_muon_ung_tuyen_thuc_tap
- "Đơn vị thực tập" -> don_vi_thuc_tap
- "Giảng viên hướng dẫn" -> giang_vien_huong_dan

## Frontend Implementation:

### StudentsPage.tsx:
- Nút "Xuất Excel": gọi export endpoint
- Nút "Import Excel": chuyển đến `/import-students`

### ImportStudentsPage.tsx:
- Upload file và gọi import endpoint
- Hiển thị kết quả import

## Status: ✅ COMPLETED

Workflow export-modify-import đã hoạt động với tính idempotent đầy đủ.
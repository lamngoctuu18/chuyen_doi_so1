# Cập nhật: Thêm cột "Vị trí tuyển dụng" cho Doanh nghiệp

## Tổng quan
Đã thêm cột **Vị trí tuyển dụng** vào hệ thống quản lý doanh nghiệp, cho phép lưu trữ và quản lý thông tin các vị trí tuyển dụng của từng doanh nghiệp.

## Thay đổi

### 1. Database
**File:** `backend/scripts/add_vi_tri_tuyen_dung_column.js`
- ✅ Thêm cột `vi_tri_tuyen_dung` (TEXT) vào bảng `doanh_nghiep`
- Migration đã chạy thành công cho 51 doanh nghiệp hiện có

### 2. Backend

#### Model DoanhNghiep
**File:** `backend/src/models/DoanhNghiep.js`
- ✅ Thêm field `viTriTuyenDung` vào constructor
- ✅ Thêm `vi_tri_tuyen_dung` vào INSERT query trong method `create()`
- ✅ Thêm `vi_tri_tuyen_dung` vào danh sách `allowedFields` trong method `updateByMaDoanhNghiep()`
- **Logic update:** Chỉ update các trường có giá trị mới (khác undefined), giữ nguyên giá trị cũ nếu không có thay đổi

#### Import/Export Service
**File:** `backend/src/services/ExcelImportService.js`
- ✅ Thêm mapping header cho "Vị trí tuyển dụng" (hỗ trợ nhiều pattern: 'vị trí tuyển dụng', 'vi tri tuyen dung', 'position', 'job position', 'recruitment position')
- ✅ Thêm `viTriTuyenDung` vào `parseDoanhNghiepData()`

**File:** `backend/src/controllers/DoanhNghiepController.js`
- ✅ Thêm cột "Vị trí tuyển dụng" vào export Excel (width: 30)
- ✅ Thêm `viTriTuyenDung` vào data mapping khi export

**File:** `backend/src/routes/import_new.js`
- ✅ Thêm cột "Vị trí tuyển dụng" vào template export (route `/api/import/export/doanh-nghiep`)

#### Routes
**File:** `backend/src/routes/DoanhNghiep.js`
- ✅ **Fix route order:** Di chuyển specific routes (`/export`, `/sync`, `/import`) lên trước generic route `/:id` để tránh conflict
- Giải quyết lỗi 404 khi gọi `/api/doanh-nghiep/export`

### 3. Frontend

#### UI - CompaniesPage
**File:** `quanly-thuctap/src/pages/CompaniesPage.tsx`
- ✅ Thêm cột "Vị trí tuyển dụng" vào table header (width: 200px)
- ✅ Thêm cell hiển thị `viTriTuyenDung` trong tbody
- ✅ Hỗ trợ cả camelCase và snake_case: `company.viTriTuyenDung || company.vi_tri_tuyen_dung`
- ✅ Cập nhật `tableMinWidth` từ 2320px → 2520px để phù hợp với cột mới

## Cách sử dụng

### 1. Import doanh nghiệp từ Excel
Khi import file Excel doanh nghiệp, template sẽ có cột **"Vị trí tuyển dụng"**:

**Ví dụ dữ liệu:**
| Mã DN | Tên công ty | ... | Vị trí tuyển dụng |
|-------|-------------|-----|-------------------|
| DN001 | Công ty ABC | ... | Thực tập sinh CNTT, Lập trình viên Web |
| DN002 | Công ty XYZ | ... | Tester, BA |

### 2. Export danh sách doanh nghiệp
- File export sẽ bao gồm cột "Vị trí tuyển dụng"
- Endpoint: `GET /api/doanh-nghiep/export` (đã fix lỗi 404)

### 3. Hiển thị trên giao diện
- Trang **Quản lý Doanh nghiệp** hiển thị cột "Vị trí tuyển dụng" sau cột "Lĩnh vực"
- Dữ liệu được truncate nếu quá dài, hover để xem đầy đủ

## Testing

### Kiểm tra migration
```bash
cd backend
node scripts/add_vi_tri_tuyen_dung_column.js
```
**Kết quả:** ✅ Đã chạy thành công (51 doanh nghiệp)

### Kiểm tra import
1. Tải template từ trang Import Tài Khoản → chọn "Doanh nghiệp"
2. Điền cột "Vị trí tuyển dụng" (ví dụ: "Thực tập sinh IT, Developer")
3. Import file
4. Kiểm tra dữ liệu đã lưu đúng

### Kiểm tra export
1. Vào trang Quản lý Doanh nghiệp
2. Click "Xuất Excel"
3. Mở file, kiểm tra cột "Vị trí tuyển dụng" có dữ liệu

### Kiểm tra update logic
1. Import file có doanh nghiệp đã tồn tại
2. Chỉ thay đổi cột "Vị trí tuyển dụng", giữ nguyên các cột khác
3. Kiểm tra: các trường khác không bị thay đổi, chỉ "Vị trí tuyển dụng" được update

## Notes
- Trường này là **optional**, không bắt buộc khi import
- Hỗ trợ text tự do, có thể liệt kê nhiều vị trí cách nhau bằng dấu phẩy
- Logic update: **selective update** - chỉ thay đổi các trường có giá trị mới, giữ nguyên giá trị cũ nếu không có thay đổi

## Completed ✨
- [x] Migration database
- [x] Model update
- [x] Import/Export logic
- [x] UI display
- [x] Route fix (404 error resolved)
- [x] Selective update logic

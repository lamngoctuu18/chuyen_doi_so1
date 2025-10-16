# Chức năng Phân công Tự động

## Tổng quan
Phân công tự động Giảng viên và Doanh nghiệp cho sinh viên chưa được phân công, dựa trên:
- **Giảng viên**: Cân bằng số lượng sinh viên cho mỗi giảng viên
- **Doanh nghiệp**: Match theo vị trí mong muốn và giới hạn số lượng nhận thực tập

## Thành phần

### 1. Backend API

**File:** `backend/src/controllers/AutoAssignmentController.js`

#### Endpoint
```
POST /api/auto-assignment
Authorization: Bearer <token>
Role: Admin only
```

#### Thuật toán

**Bước 1: Lấy dữ liệu**
- Sinh viên: Lấy tất cả, kể cả đã/chưa phân công
- Giảng viên: Lấy toàn bộ danh sách
- Doanh nghiệp: Lấy toàn bộ danh sách với thông tin:
  - `vi_tri_tuyen_dung`: Vị trí tuyển dụng
  - `so_luong_nhan_thuc_tap`: Số lượng tối đa

**Bước 2: Phân công Giảng viên**
- Đếm số SV hiện tại của mỗi GV
- Với mỗi SV chưa có GV:
  - Chọn GV có số SV ít nhất
  - Cập nhật `sinh_vien_huong_dan.giang_vien_huong_dan`
  - Tăng counter của GV đó

**Bước 3: Phân công Doanh nghiệp**
- Đếm số SV hiện tại của mỗi DN
- Với mỗi SV chưa có DN:
  - Lấy `vi_tri_mong_muon` của SV
  - Tìm DN có `vi_tri_tuyen_dung` match với vị trí mong muốn
  - Kiểm tra DN còn chỗ (currentStudents < maxStudents)
  - Nếu không match, lấy DN bất kỳ còn chỗ
  - Random chọn 1 DN từ danh sách phù hợp
  - Cập nhật `sinh_vien_huong_dan.doanh_nghiep_thuc_tap`
  - Tăng counter của DN đó

**Logic matching Doanh nghiệp:**
```javascript
// Ưu tiên 1: Match vị trí mong muốn
if (viTriMongMuon) {
  matchedCompanies = companies.filter(c =>
    c.viTri.includes(viTriMongMuon) || 
    viTriMongMuon.includes(c.viTri)
  );
}

// Ưu tiên 2: Kiểm tra số lượng
matchedCompanies = matchedCompanies.filter(c =>
  c.maxStudents === 0 || c.currentStudents < c.maxStudents
);

// Ưu tiên 3: Random từ danh sách phù hợp
const randomIndex = Math.floor(Math.random() * matchedCompanies.length);
```

#### Response
```json
{
  "success": true,
  "message": "Phân công tự động hoàn tất",
  "data": {
    "teachers": {
      "assigned": 10,
      "skipped": 40,
      "errors": []
    },
    "companies": {
      "assigned": 35,
      "skipped": 15,
      "errors": [
        {
          "studentId": "SV001",
          "error": "Không có doanh nghiệp còn chỗ trống"
        }
      ]
    },
    "totalStudents": 50
  }
}
```

### 2. Frontend UI

**File:** `quanly-thuctap/src/pages/StudentsPage.tsx`

#### Vị trí
Nút "🤖 Phân công tự động" nằm trên header trang Quản lý Sinh viên, bên cạnh:
- "Quản lý thời gian ĐK"
- "Xuất Excel"
- "Import Danh sách Giảng viên"

#### Giao diện
```tsx
<button className="bg-gradient-to-r from-purple-600 to-pink-600">
  🤖 Phân công tự động
</button>
```

#### Flow
1. **Click nút** → Hiện confirm dialog
2. **Confirm** → Gọi API `/api/auto-assignment`
3. **Nhận kết quả** → Hiện alert với thống kê:
   - Tổng sinh viên
   - GV: đã phân công / đã có / lỗi
   - DN: đã phân công / đã có / lỗi
4. **Refresh** → Reload danh sách sinh viên và dashboard

## Cách sử dụng

### Điều kiện tiên quyết
1. ✅ Có ít nhất 1 Giảng viên trong hệ thống
2. ✅ Có ít nhất 1 Doanh nghiệp trong hệ thống
3. ✅ Doanh nghiệp đã cấu hình:
   - Cột `vi_tri_tuyen_dung` (optional)
   - Cột `so_luong_nhan_thuc_tap` (0 = không giới hạn)

### Quy trình

**1. Chuẩn bị dữ liệu Doanh nghiệp**
- Import hoặc thêm doanh nghiệp
- Điền cột "Vị trí tuyển dụng" (ví dụ: "Developer, Tester")
- Điền cột "Số lượng nhận thực tập" (ví dụ: 5)

**2. Chuẩn bị dữ liệu Sinh viên**
- Sinh viên đã có cột `vi_tri_mong_muon` trong bảng `sinh_vien_huong_dan`
- Ví dụ: "Lập trình viên (Developer)", "Tester"

**3. Thực hiện phân công**
- Vào trang **Quản lý Sinh viên**
- Click **"🤖 Phân công tự động"**
- Xác nhận trong dialog
- Đợi kết quả (thường < 5 giây)

**4. Kiểm tra kết quả**
- Xem thống kê trong alert
- Kiểm tra danh sách sinh viên:
  - Cột "Giảng viên hướng dẫn" đã có tên GV
  - Cột "Doanh nghiệp thực tập" đã có tên DN
- Vào trang **Quản lý Doanh nghiệp**:
  - Cột "SL SV thực tập" đã tăng

## Ví dụ thực tế

### Tình huống
- **Giảng viên**: 3 GV (GV01, GV02, GV03)
- **Doanh nghiệp**:
  - Công ty A: Vị trí "Developer", Max 5 SV
  - Công ty B: Vị trí "Tester", Max 3 SV
  - Công ty C: Vị trí "Designer", Max 2 SV
- **Sinh viên**: 50 SV, chưa phân công

### Kết quả sau phân công

**Giảng viên:**
- GV01: 17 SV
- GV02: 17 SV  
- GV03: 16 SV

**Doanh nghiệp:**
- Công ty A: 5 SV (có vị trí mong muốn "Developer")
- Công ty B: 3 SV (có vị trí mong muốn "Tester")
- Công ty C: 2 SV (có vị trí mong muốn "Designer")
- Các công ty khác (hoặc SV không rõ vị trí): 40 SV còn lại

## Lưu ý quan trọng

### ⚠️ Giới hạn
- Chỉ phân công cho SV **chưa có** GV/DN
- SV đã có GV/DN sẽ bị skip
- Nếu tất cả DN đều đầy, SV sẽ không được phân công DN

### 🔄 Xử lý lỗi
- DN hết chỗ: Ghi vào `companies.errors`
- Không có GV/DN: API trả về 400 Bad Request
- Lỗi database: Ghi log, tiếp tục phân công SV khác

### 📊 Cập nhật số lượng
- Cột `soSinhVienThucTap` trên UI được tính từ:
  ```sql
  SELECT doanh_nghiep_thuc_tap, COUNT(*) as so_sinh_vien_thuc_tap
  FROM sinh_vien_huong_dan 
  WHERE doanh_nghiep_thuc_tap IS NOT NULL
  GROUP BY doanh_nghiep_thuc_tap
  ```

## Testing

### Test case 1: Phân công thành công
1. Tạo 3 GV, 5 DN, 20 SV
2. Chạy phân công tự động
3. Kiểm tra: 20 SV có GV và DN

### Test case 2: DN hết chỗ
1. DN có max = 2, nhưng có 5 SV
2. Chạy phân công
3. Kiểm tra: 2 SV vào DN này, 3 SV vào DN khác hoặc báo lỗi

### Test case 3: SV đã phân công
1. 10 SV đã có GV/DN, 10 SV chưa có
2. Chạy phân công
3. Kiểm tra: 10 SV cũ không thay đổi, 10 SV mới được phân công

### Test case 4: Không có DN
1. Xóa hết DN
2. Chạy phân công
3. Kiểm tra: API trả về 400, message "Không có doanh nghiệp..."

## Cải tiến tương lai

- [ ] Phân công theo nguyện vọng ưu tiên (1, 2, 3)
- [ ] Xem trước kết quả trước khi confirm
- [ ] Export báo cáo phân công
- [ ] Hoàn tác phân công (undo)
- [ ] Phân công lại (re-assign) cho SV đã có
- [ ] Phân công thủ công từng SV (drag & drop)

## Files changed

- ✅ `backend/src/controllers/AutoAssignmentController.js` (new)
- ✅ `backend/src/routes/auto-assignment.js` (new)
- ✅ `backend/server.js` (register route)
- ✅ `quanly-thuctap/src/pages/StudentsPage.tsx` (add button)

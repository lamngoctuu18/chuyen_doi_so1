Để kiểm tra và sửa lỗi 2 cột mới không được cập nhật, tôi đã thực hiện các bước sau:

## ✅ Đã sửa các vấn đề:

### 1. **Cập nhật ExcelImportService.js**
- ✅ Thêm mapping cho 2 cột mới trong `mapSinhVienHeaders()`:
  - `vị trí muốn ứng tuyển thực tập` → `headers.viTriMuonUngTuyen`
  - `đơn vị thực tập` → `headers.donViThucTap`

### 2. **Cập nhật SinhVien Model**
- ✅ Thêm 2 field mới vào constructor
- ✅ Cập nhật `create()` method với 2 cột mới
- ✅ Cập nhật `createMany()` method với 2 cột mới  
- ✅ **Quan trọng**: Sửa `updateByMaSinhVien()` method - đây là nguyên nhân chính!

### 3. **Thêm Debug Logs**
- ✅ Thêm debug để kiểm tra headers và values của 2 cột mới

## 🔍 **Nguyên nhân chính:**
Hàm `updateByMaSinhVien()` trong SinhVien model **không bao gồm 2 cột mới** trong câu UPDATE SQL, dẫn đến khi import file Excel cập nhật sinh viên đã tồn tại, 2 cột mới không được cập nhật.

## 📋 **Template Excel cần có đúng tên cột:**

Để 2 cột mới được nhận diện đúng, file Excel cần có header như sau:

| Mã sinh viên | Họ tên | Email | ... | **Vị trí muốn ứng tuyển thực tập** | **Đơn vị thực tập** |
|--------------|---------|-------|-----|-----------------------------------|-------------------|

**Các từ khóa được nhận diện:**
- Cột 1: "vị trí" + ("ứng tuyển" hoặc "muốn" hoặc "thực tập")  
- Cột 2: "đơn vị" + "thực tập"

## 🚀 **Cách test:**

1. **Tạo file Excel test** với các cột:
   ```
   Mã sinh viên | Họ tên | Email | Vị trí muốn ứng tuyển thực tập | Đơn vị thực tập
   SV001       | Test   | test@ | Lập trình viên (Developer)     | Công ty ABC
   ```

2. **Import qua giao diện** và kiểm tra database

3. **Kiểm tra backend logs** để xem debug info về headers

## 📝 **Tóm tắt thay đổi:**
- ExcelImportService: ✅ Parse 2 cột mới  
- SinhVien Model: ✅ Create/Update với 2 cột mới
- Database: ✅ Đã có 2 cột mới  
- Template: ❓ Cần đảm bảo đúng tên cột

**Vấn đề chính đã được sửa** - hàm updateByMaSinhVien() giờ đã bao gồm 2 cột mới!

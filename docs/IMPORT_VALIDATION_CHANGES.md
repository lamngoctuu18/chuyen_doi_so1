# Thay đổi điều kiện import sinh viên

## Yêu cầu:
Bỏ các điều kiện bắt buộc CHỈ ở phần import quản lý sinh viên, giữ nguyên các điều kiện này ở import tài khoản khác.

## Những gì đã thay đổi:

### 1. ExcelImportService.js - parseSinhVienData():
**TRƯỚC:**
```javascript
// Kiểm tra các cột bắt buộc
if (!headers.maSinhVien || !headers.hoTen || !headers.email) {
  throw new Error('File Excel thiếu các cột bắt buộc: Mã sinh viên, Họ tên, Email');
}
```

**SAU:**
```javascript
// Không cần kiểm tra cột bắt buộc cho import sinh viên - cho phép import linh hoạt
```

### 2. ExcelImportService.js - validateSinhVienData():
**TRƯỚC:**
```javascript
static validateSinhVienData(data, rowNumber) {
  if (!data.maSinhVien) {
    throw new Error(`Hàng ${rowNumber}: Thiếu mã sinh viên`);
  }
  if (!data.hoTen) {
    throw new Error(`Hàng ${rowNumber}: Thiếu họ tên`);
  }
  if (!data.email) {
    throw new Error(`Hàng ${rowNumber}: Thiếu email`);
  }
  if (data.email && !this.isValidEmail(data.email)) {
    throw new Error(`Hàng ${rowNumber}: Email không hợp lệ`);
  }
}
```

**SAU:**
```javascript
static validateSinhVienData(data, rowNumber) {
  // Chỉ validate email format nếu có email
  if (data.email && !this.isValidEmail(data.email)) {
    throw new Error(`Hàng ${rowNumber}: Email không hợp lệ`);
  }
  // Bỏ validation bắt buộc cho mã sinh viên, họ tên để cho phép import linh hoạt
}
```

### 3. ExcelImportService.js - importToDatabase():
**TRƯỚC:**
```javascript
if (!userId) {
  throw new Error(`Không tìm thấy mã định danh cho ${accountType}. Dữ liệu: ${JSON.stringify(item)}`);
}
```

**SAU:**
```javascript
// Đối với sinh viên, cho phép import mà không cần mã sinh viên (chỉ cập nhật profile)
if (!userId && accountType !== 'sinh-vien') {
  throw new Error(`Không tìm thấy mã định danh cho ${accountType}. Dữ liệu: ${JSON.stringify(item)}`);
}

// Nếu là sinh viên và không có mã sinh viên, bỏ qua việc tạo/cập nhật account
if (accountType === 'sinh-vien' && !userId) {
  console.log('Bỏ qua sinh viên không có mã sinh viên');
  continue;
}
```

## Các validation KHÔNG THAY ĐỔI:

✅ **validateGiangVienData()** - vẫn yêu cầu: mã giảng viên, họ tên, email, khoa
✅ **validateDoanhNghiepData()** - vẫn yêu cầu: mã doanh nghiệp, tên công ty, người liên hệ, email, địa chỉ, SĐT  
✅ **validateAdminData()** - vẫn yêu cầu: userId, họ tên, email

## Kết quả:
- Import sinh viên: linh hoạt, không bắt buộc các field
- Import tài khoản khác: giữ nguyên validation nghiêm ngặt
- File Excel có thể thiếu một số cột vẫn import được cho sinh viên
- Chỉ validate email format nếu có email trong file sinh viên
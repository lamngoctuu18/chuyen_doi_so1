# Tách riêng logic import sinh viên

## Yêu cầu:
- **Quản lý Sinh viên - Import Excel**: Không validate, import linh hoạt (chỉ cập nhật profile)
- **Import Tài Khoản - Sinh viên**: Giữ nguyên validate nghiêm ngặt (tạo tài khoản + profile)

## Giải pháp: Tạo 2 endpoint riêng biệt

### 1. Backend Routes (`import_new.js`):

#### Endpoint cũ (Import Tài Khoản):
```javascript
POST /api/import/sinh-vien
- Validation đầy đủ: Mã SV, Họ tên, Email bắt buộc
- Tạo tài khoản + profile
- Dành cho trang "Import Tài Khoản"
```

#### Endpoint mới (Import Profile):
```javascript
POST /api/import/sinh-vien-profile  
- Không validation nghiêm ngặt
- Chỉ cập nhật profile sinh viên đã tồn tại
- Dành cho trang "Quản lý Sinh viên"
```

### 2. Backend Controllers (`ImportController_new.js`):

#### Method cũ:
```javascript
importSinhVien() {
  // Parse với validation đầy đủ
  parseExcelFile(filePath, 'sinh-vien')
  // Import tạo account + profile
  importToDatabase(accountType, data, options)
}
```

#### Method mới:
```javascript
importSinhVienProfile() {
  // Parse không validation nghiêm ngặt  
  parseExcelFile(filePath, 'sinh-vien-profile')
  // Chỉ cập nhật profile
  importProfileOnly(accountType, data, options)
}
```

### 3. Backend Services (`ExcelImportService.js`):

#### Parse Methods:
```javascript
// Cho Import Tài Khoản (validation đầy đủ)
parseSinhVienData() {
  // Kiểm tra cột bắt buộc: Mã SV, Họ tên, Email  
  if (!headers.maSinhVien || !headers.hoTen || !headers.email) {
    throw new Error('File Excel thiếu các cột bắt buộc...')
  }
}

// Cho Import Profile (không validation)
parseSinhVienProfileData() {
  // Không kiểm tra cột bắt buộc - cho phép import linh hoạt
}
```

#### Validation Methods:
```javascript
// Validation nghiêm ngặt (Import Tài Khoản)
validateSinhVienData() {
  if (!data.maSinhVien) throw new Error('Thiếu mã sinh viên')
  if (!data.hoTen) throw new Error('Thiếu họ tên')  
  if (!data.email) throw new Error('Thiếu email')
}

// Validation linh hoạt (Import Profile)
validateSinhVienProfileData() {
  // Chỉ validate email format nếu có email
  if (data.email && !this.isValidEmail(data.email)) {
    throw new Error('Email không hợp lệ')
  }
}
```

#### Import Methods:
```javascript
// Import đầy đủ (Account + Profile)
importToDatabase() {
  // Tạo/cập nhật account
  // Tạo/cập nhật profile
}

// Import chỉ profile
importProfileOnly() {
  // Chỉ cập nhật profile sinh viên đã tồn tại
  // Bỏ qua nếu không tìm thấy sinh viên
}
```

### 4. Frontend (`ImportStudentsPage.tsx`):

```javascript
// Endpoint cũ: /api/import/sinh-vien  
// Endpoint mới: /api/import/sinh-vien-profile
```

## Kết quả:

### 🎯 Import từ "Quản lý Sinh viên":
- ✅ Không yêu cầu Mã SV, Họ tên, Email bắt buộc
- ✅ Chỉ cập nhật sinh viên đã tồn tại  
- ✅ Bỏ qua dòng không có mã sinh viên
- ✅ Chỉ validate email format nếu có

### 🔒 Import từ "Import Tài Khoản":  
- ✅ Vẫn yêu cầu Mã SV, Họ tên, Email bắt buộc
- ✅ Tạo tài khoản + profile mới
- ✅ Validation đầy đủ như cũ

## Flow sử dụng:

1. **Quản lý Sinh viên** → **Import Excel** → `/sinh-vien-profile` → Cập nhật linh hoạt
2. **Import Tài Khoản** → **Sinh viên** → `/sinh-vien` → Validation nghiêm ngặt
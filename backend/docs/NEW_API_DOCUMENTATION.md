# 📚 API Documentation - Student Reports & Password Reset

## 🎯 Tổng quan

Tài liệu này mô tả chi tiết 2 nhóm API mới được bổ sung vào hệ thống:

1. **Student Reports API** (`/api/student-reports`) - Quản lý báo cáo thực tập của sinh viên
2. **Password Reset API** (`/api/password-reset`) - Quản lý đổi mật khẩu

---

## 📊 Student Reports API

### Base URL
```
/api/student-reports
```

### Database Table
- **Table**: `bao_cao_da_nop`
- **Foreign Keys**: 
  - `ma_sinh_vien` → `sinh_vien(ma_sinh_vien)`
  - `dot_thuc_tap_id` → `dot_thuc_tap(id)`

---

### 1. Upload Báo Cáo

**Endpoint**: `POST /api/student-reports/upload`

**Description**: Sinh viên nộp báo cáo thực tập

**Content-Type**: `multipart/form-data`

**Request Body**:
```javascript
{
  ma_sinh_vien: "SV001",
  dot_thuc_tap_id: 1,
  loai_bao_cao: "tuan", // 'tuan' | 'thang' | 'cuoi_ky' | 'tong_ket'
  ghi_chu: "Báo cáo tuần 1",
  report_file: File // PDF, Word, Excel, PowerPoint (max 10MB)
}
```

**Response Success (201)**:
```json
{
  "success": true,
  "message": "Nộp báo cáo thành công",
  "data": {
    "id": 1,
    "ma_sinh_vien": "SV001",
    "dot_thuc_tap_id": 1,
    "loai_bao_cao": "tuan",
    "file_name": "bao-cao-tuan-1.pdf",
    "file_size": 1024567,
    "trang_thai_duyet": "cho_duyet",
    "ngay_nop": "2025-10-14T10:30:00.000Z"
  }
}
```

**Response Error (400)**:
```json
{
  "success": false,
  "message": "Thiếu thông tin bắt buộc: ma_sinh_vien, dot_thuc_tap_id, loai_bao_cao"
}
```

**Validation Rules**:
- File types: PDF, Word (.doc, .docx), Excel (.xls, .xlsx), PowerPoint (.ppt, .pptx)
- Max file size: 10MB
- Required fields: `ma_sinh_vien`, `dot_thuc_tap_id`, `loai_bao_cao`
- `ma_sinh_vien` must exist in `sinh_vien` table
- `dot_thuc_tap_id` must exist in `dot_thuc_tap` table

**cURL Example**:
```bash
curl -X POST http://localhost:3001/api/student-reports/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "ma_sinh_vien=SV001" \
  -F "dot_thuc_tap_id=1" \
  -F "loai_bao_cao=tuan" \
  -F "ghi_chu=Báo cáo tuần 1" \
  -F "report_file=@/path/to/report.pdf"
```

---

### 2. Lấy Danh Sách Báo Cáo

**Endpoint**: `GET /api/student-reports`

**Description**: Lấy danh sách báo cáo với filter (dành cho giảng viên/admin)

**Query Parameters**:
```javascript
{
  ma_sinh_vien?: string,          // Filter theo mã sinh viên
  dot_thuc_tap_id?: number,       // Filter theo đợt thực tập
  trang_thai_duyet?: string,      // 'cho_duyet' | 'da_duyet' | 'tu_choi'
  loai_bao_cao?: string,          // 'tuan' | 'thang' | 'cuoi_ky' | 'tong_ket'
  ngay_nop_tu?: string,           // Ngày nộp từ (YYYY-MM-DD)
  ngay_nop_den?: string,          // Ngày nộp đến (YYYY-MM-DD)
  ma_giang_vien?: string,         // Filter theo giảng viên hướng dẫn
  page?: number,                  // Trang (default: 1)
  limit?: number                  // Số bản ghi/trang (default: 20)
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Lấy danh sách báo cáo thành công",
  "data": [
    {
      "id": 1,
      "ma_sinh_vien": "SV001",
      "ten_sinh_vien": "Nguyễn Văn A",
      "lop": "CNTT15A",
      "dot_thuc_tap_id": 1,
      "ten_dot_thuc_tap": "Thực tập 2025",
      "ma_giang_vien": "GV001",
      "ten_giang_vien": "Trần Thị B",
      "loai_bao_cao": "tuan",
      "file_name": "bao-cao-tuan-1.pdf",
      "file_size": 1024567,
      "trang_thai_duyet": "cho_duyet",
      "nguoi_duyet": null,
      "ngay_duyet": null,
      "nhan_xet": null,
      "ngay_nop": "2025-10-14T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

**cURL Example**:
```bash
curl -X GET "http://localhost:3001/api/student-reports?ma_sinh_vien=SV001&trang_thai_duyet=cho_duyet&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Lấy Chi Tiết Báo Cáo

**Endpoint**: `GET /api/student-reports/:id`

**Description**: Lấy thông tin chi tiết một báo cáo

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Lấy thông tin báo cáo thành công",
  "data": {
    "id": 1,
    "ma_sinh_vien": "SV001",
    "ten_sinh_vien": "Nguyễn Văn A",
    "lop": "CNTT15A",
    "dot_thuc_tap_id": 1,
    "ten_dot_thuc_tap": "Thực tập 2025",
    "loai_bao_cao": "tuan",
    "file_name": "bao-cao-tuan-1.pdf",
    "file_path": "/uploads/student-reports/bao-cao-tuan-1-1234567890.pdf",
    "file_size": 1024567,
    "mime_type": "application/pdf",
    "trang_thai_duyet": "cho_duyet",
    "ghi_chu": "Báo cáo tuần 1",
    "ngay_nop": "2025-10-14T10:30:00.000Z"
  }
}
```

**Response Error (404)**:
```json
{
  "success": false,
  "message": "Không tìm thấy báo cáo"
}
```

---

### 4. Duyệt/Từ Chối Báo Cáo

**Endpoint**: `POST /api/student-reports/:id/review`

**Description**: Giảng viên duyệt hoặc từ chối báo cáo

**Request Body**:
```json
{
  "nguoi_duyet": "GV001",
  "trang_thai_duyet": "da_duyet",  // 'da_duyet' | 'tu_choi'
  "nhan_xet": "Báo cáo chi tiết, đầy đủ thông tin"
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Duyệt báo cáo thành công",
  "data": {
    "id": 1,
    "ma_sinh_vien": "SV001",
    "trang_thai_duyet": "da_duyet",
    "nguoi_duyet": "GV001",
    "ngay_duyet": "2025-10-14T11:00:00.000Z",
    "nhan_xet": "Báo cáo chi tiết, đầy đủ thông tin"
  }
}
```

**Response Error (400)**:
```json
{
  "success": false,
  "message": "Trạng thái không hợp lệ. Chỉ chấp nhận: da_duyet hoặc tu_choi"
}
```

**Validation Rules**:
- Only reports with status `cho_duyet` can be reviewed
- `trang_thai_duyet` must be either `da_duyet` or `tu_choi`
- `nguoi_duyet` is required (teacher code)
- If `tu_choi`, `nhan_xet` should contain reason

**cURL Example (Approve)**:
```bash
curl -X POST http://localhost:3001/api/student-reports/1/review \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "nguoi_duyet": "GV001",
    "trang_thai_duyet": "da_duyet",
    "nhan_xet": "Báo cáo tốt"
  }'
```

**cURL Example (Reject)**:
```bash
curl -X POST http://localhost:3001/api/student-reports/1/review \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "nguoi_duyet": "GV001",
    "trang_thai_duyet": "tu_choi",
    "nhan_xet": "Báo cáo thiếu phần phân tích. Vui lòng bổ sung."
  }'
```

---

### 5. Lấy Thống Kê Báo Cáo

**Endpoint**: `GET /api/student-reports/statistics/:ma_sinh_vien`

**Description**: Lấy thống kê báo cáo của sinh viên

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Lấy thống kê thành công",
  "data": {
    "tong_so_bao_cao": 10,
    "cho_duyet": 2,
    "da_duyet": 7,
    "tu_choi": 1,
    "thong_ke_theo_loai": [
      {
        "loai_bao_cao": "tuan",
        "so_luong": 6
      },
      {
        "loai_bao_cao": "thang",
        "so_luong": 3
      },
      {
        "loai_bao_cao": "cuoi_ky",
        "so_luong": 1
      }
    ]
  }
}
```

---

### 6. Xóa Báo Cáo

**Endpoint**: `DELETE /api/student-reports/:id`

**Description**: Xóa báo cáo (chỉ cho phép xóa báo cáo chờ duyệt)

**Request Body**:
```json
{
  "ma_sinh_vien": "SV001"
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Xóa báo cáo thành công",
  "data": {
    "id": 1,
    "ma_sinh_vien": "SV001",
    "file_name": "bao-cao-tuan-1.pdf"
  }
}
```

**Response Error (403)**:
```json
{
  "success": false,
  "message": "Không thể xóa báo cáo đã được duyệt hoặc từ chối"
}
```

**Validation Rules**:
- Only owner (`ma_sinh_vien`) can delete
- Can only delete reports with status `cho_duyet`
- Physical file will be deleted from filesystem

---

### 7. Download Báo Cáo

**Endpoint**: `GET /api/student-reports/download/:id`

**Description**: Download file báo cáo

**Response**: File download

**Response Error (404)**:
```json
{
  "success": false,
  "message": "File không tồn tại"
}
```

**cURL Example**:
```bash
curl -X GET http://localhost:3001/api/student-reports/download/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -O -J
```

---

## 🔐 Password Reset API

### Base URL
```
/api/password-reset
```

### Database Table
- **Table**: `doi_mat_khau`
- **Fields**: email, reset_code (6 digits), expiration_time, used_flag

---

### 1. Yêu Cầu Mã Đổi Mật Khẩu

**Endpoint**: `POST /api/password-reset/request`

**Description**: Gửi yêu cầu mã xác thực để đổi mật khẩu

**Request Body**:
```json
{
  "email": "student@dainam.edu.vn"
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Mã xác thực đã được gửi đến email của bạn",
  "data": {
    "email": "student@dainam.edu.vn",
    "expires_in_minutes": 10,
    "reset_code": "123456"  // Only in development mode
  }
}
```

**Response Error (429) - Rate Limit**:
```json
{
  "success": false,
  "message": "Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau 5 phút.",
  "data": {
    "request_count": 3,
    "max_requests": 3,
    "time_window_minutes": 5
  }
}
```

**Validation Rules**:
- Valid email format required
- Email must exist in `accounts` table
- Rate limit: 3 requests per 5 minutes
- Previous unused codes will be deleted
- Reset code expires in 10 minutes

**cURL Example**:
```bash
curl -X POST http://localhost:3001/api/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email": "student@dainam.edu.vn"}'
```

---

### 2. Xác Thực Mã

**Endpoint**: `POST /api/password-reset/verify`

**Description**: Kiểm tra mã xác thực có hợp lệ không

**Request Body**:
```json
{
  "email": "student@dainam.edu.vn",
  "reset_code": "123456"
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Mã xác thực hợp lệ",
  "data": {
    "email": "student@dainam.edu.vn",
    "expiration_time": "2025-10-14T11:00:00.000Z"
  }
}
```

**Response Error (400) - Expired**:
```json
{
  "success": false,
  "message": "Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.",
  "reason": "expired"
}
```

**Response Error (400) - Used**:
```json
{
  "success": false,
  "message": "Mã xác thực đã được sử dụng",
  "reason": "used"
}
```

**Response Error (400) - Invalid**:
```json
{
  "success": false,
  "message": "Mã xác thực không hợp lệ",
  "reason": "invalid"
}
```

---

### 3. Đổi Mật Khẩu

**Endpoint**: `POST /api/password-reset/reset`

**Description**: Đổi mật khẩu mới với mã xác thực

**Request Body**:
```json
{
  "email": "student@dainam.edu.vn",
  "reset_code": "123456",
  "new_password": "NewPassword123!"
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Đổi mật khẩu thành công",
  "data": {
    "email": "student@dainam.edu.vn",
    "user_id": "SV001"
  }
}
```

**Response Error (400)**:
```json
{
  "success": false,
  "message": "Mật khẩu phải có ít nhất 6 ký tự"
}
```

**Validation Rules**:
- Reset code must be valid, not expired, and not used
- Password must be at least 6 characters
- Password will be hashed using bcrypt (10 rounds)
- Reset code will be marked as used after successful reset
- Updates password in `accounts` table

**cURL Example**:
```bash
curl -X POST http://localhost:3001/api/password-reset/reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@dainam.edu.vn",
    "reset_code": "123456",
    "new_password": "NewPassword123!"
  }'
```

---

### 4. Lấy Lịch Sử Đổi Mật Khẩu

**Endpoint**: `GET /api/password-reset/history/:email`

**Description**: Xem lịch sử yêu cầu đổi mật khẩu (Admin only)

**Query Parameters**:
```javascript
{
  limit?: number  // Số bản ghi (default: 10)
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Lấy lịch sử thành công",
  "data": [
    {
      "id": 1,
      "email": "student@dainam.edu.vn",
      "reset_code": "123456",
      "expiration_time": "2025-10-14T11:00:00.000Z",
      "used_flag": 1,
      "created_at": "2025-10-14T10:50:00.000Z",
      "trang_thai": "Đã sử dụng"
    },
    {
      "id": 2,
      "email": "student@dainam.edu.vn",
      "reset_code": "789012",
      "expiration_time": "2025-10-13T15:30:00.000Z",
      "used_flag": 0,
      "created_at": "2025-10-13T15:20:00.000Z",
      "trang_thai": "Hết hạn"
    }
  ]
}
```

---

### 5. Dọn Dẹp Mã Hết Hạn

**Endpoint**: `POST /api/password-reset/cleanup`

**Description**: Xóa các mã hết hạn (Admin only)

**Request Body**:
```json
{
  "older_than_hours": 24  // Optional, default: 24
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Đã xóa 15 mã hết hạn",
  "data": {
    "deleted_count": 15
  }
}
```

**Note**: Có thể schedule cron job để tự động cleanup:
```javascript
// Add to server.js
const cron = require('node-cron');
const PasswordReset = require('./src/models/PasswordReset');

// Chạy mỗi ngày lúc 2:00 AM
cron.schedule('0 2 * * *', async () => {
  console.log('🧹 Running password reset cleanup...');
  await PasswordReset.cleanupExpiredCodes(24);
});
```

---

### 6. Kiểm Tra Rate Limit

**Endpoint**: `GET /api/password-reset/check-rate-limit/:email`

**Description**: Kiểm tra xem email có bị giới hạn request không

**Query Parameters**:
```javascript
{
  minutes?: number,        // Time window (default: 5)
  max_requests?: number    // Max requests (default: 3)
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Kiểm tra rate limit thành công",
  "data": {
    "is_limited": false,
    "request_count": 1,
    "max_requests": 3,
    "time_window_minutes": 5,
    "message": "Có thể yêu cầu"
  }
}
```

---

## 🔒 Security Features

### Student Reports API:
1. **File Validation**:
   - Whitelist MIME types
   - File size limit (10MB)
   - Unique filename generation

2. **Permission Control**:
   - Only owner can delete reports
   - Only pending reports can be deleted
   - Teacher approval required

3. **Data Integrity**:
   - Foreign key constraints
   - Transaction-based operations
   - Cascading deletes for files

### Password Reset API:
1. **Rate Limiting**:
   - 3 requests per 5 minutes per email
   - Prevents brute force attacks

2. **Code Security**:
   - 6-digit random codes
   - 10-minute expiration
   - One-time use only
   - Auto-cleanup of old codes

3. **Password Security**:
   - Bcrypt hashing (10 rounds)
   - Minimum 6 characters
   - Validation before update

---

## 📝 Integration Checklist

### Backend Integration:
- [x] Create `StudentReportSubmission.js` model
- [x] Create `PasswordReset.js` model
- [x] Create `studentReports.js` routes
- [x] Create `passwordReset.js` routes
- [x] Register routes in `server.js`
- [x] Create API documentation

### TODO:
- [ ] Add authentication middleware
- [ ] Implement email sending for reset codes
- [ ] Add authorization checks (role-based)
- [ ] Setup cron job for auto-cleanup
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Setup file cleanup for orphaned files
- [ ] Add logging middleware

---

## 🧪 Testing Examples

### Testing Student Report Upload:
```javascript
// Using Postman or cURL
const formData = new FormData();
formData.append('ma_sinh_vien', 'SV001');
formData.append('dot_thuc_tap_id', '1');
formData.append('loai_bao_cao', 'tuan');
formData.append('ghi_chu', 'Báo cáo tuần 1');
formData.append('report_file', fileInput.files[0]);

fetch('http://localhost:3001/api/student-reports/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
})
.then(res => res.json())
.then(data => console.log(data));
```

### Testing Password Reset Flow:
```javascript
// Step 1: Request reset code
await fetch('http://localhost:3001/api/password-reset/request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'student@dainam.edu.vn' })
});

// Step 2: Verify code
await fetch('http://localhost:3001/api/password-reset/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'student@dainam.edu.vn',
    reset_code: '123456'
  })
});

// Step 3: Reset password
await fetch('http://localhost:3001/api/password-reset/reset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'student@dainam.edu.vn',
    reset_code: '123456',
    new_password: 'NewPassword123!'
  })
});
```

---

## 📊 Database Schema Reference

### bao_cao_da_nop Table:
```sql
CREATE TABLE bao_cao_da_nop (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ma_sinh_vien VARCHAR(20) NOT NULL,
  dot_thuc_tap_id INT NOT NULL,
  loai_bao_cao ENUM('tuan', 'thang', 'cuoi_ky', 'tong_ket') NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  trang_thai_duyet ENUM('cho_duyet', 'da_duyet', 'tu_choi') DEFAULT 'cho_duyet',
  nguoi_duyet VARCHAR(20),
  ngay_duyet DATETIME,
  nhan_xet TEXT,
  ly_do_tu_choi TEXT,
  ghi_chu TEXT,
  ngay_nop TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (ma_sinh_vien) REFERENCES sinh_vien(ma_sinh_vien),
  FOREIGN KEY (dot_thuc_tap_id) REFERENCES dot_thuc_tap(id),
  
  INDEX idx_ma_sinh_vien (ma_sinh_vien),
  INDEX idx_dot_thuc_tap (dot_thuc_tap_id),
  INDEX idx_trang_thai (trang_thai_duyet),
  INDEX idx_ngay_nop (ngay_nop)
);
```

### doi_mat_khau Table:
```sql
CREATE TABLE doi_mat_khau (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  reset_code VARCHAR(6) NOT NULL,
  expiration_time DATETIME NOT NULL,
  used_flag TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_reset_code (reset_code),
  INDEX idx_expiration (expiration_time),
  INDEX idx_used_flag (used_flag)
);
```

---

## 🎉 Kết Luận

Hai nhóm API này cung cấp đầy đủ chức năng:

✅ **Student Reports**: Upload, review, statistics, download  
✅ **Password Reset**: Request, verify, reset with security  
✅ **Security**: Rate limiting, validation, transactions  
✅ **Error Handling**: Comprehensive error messages  
✅ **Documentation**: Complete API reference  

**Next Steps**: Add authentication middleware và email integration!

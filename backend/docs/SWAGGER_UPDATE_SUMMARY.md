# 📚 Swagger API Documentation - Cập Nhật Hoàn Chỉnh

## ✅ Đã Hoàn Thành

Swagger UI đã được cập nhật với **14 API endpoints mới** cho 2 module:
1. **Nộp Báo Cáo** (Student Reports) - 8 endpoints
2. **Đổi Mật Khẩu** (Password Reset) - 6 endpoints

---

## 🌐 Truy Cập Swagger UI

### URL:
```
http://localhost:3001/api/docs
```

### Tính năng:
- ✅ Interactive API testing (Try it out)
- ✅ Authentication support (JWT Bearer token)
- ✅ Request/Response examples
- ✅ Schema validation
- ✅ Filter & search endpoints
- ✅ Persistent authorization
- ✅ Custom styling (Đại Nam theme)

---

## 📊 Các Tags Mới Được Thêm

### 1. **Nộp Báo Cáo** (`/api/student-reports`)
📤 Upload và quản lý báo cáo thực tập
- Upload báo cáo (PDF, Word, Excel, PPT)
- Lấy danh sách với filter
- Chi tiết báo cáo
- Duyệt/từ chối báo cáo
- Thống kê
- Xóa báo cáo
- Download file

### 2. **Đổi Mật Khẩu** (`/api/password-reset`)
🔑 Quản lý đổi mật khẩu
- Yêu cầu mã xác thực
- Xác thực mã
- Đổi mật khẩu
- Lịch sử yêu cầu (Admin)
- Cleanup mã hết hạn (Admin)
- Kiểm tra rate limit

---

## 📝 Chi Tiết Endpoints

### **Nộp Báo Cáo** (8 endpoints)

#### 1. POST `/api/student-reports/upload`
**Upload báo cáo thực tập**
```yaml
Tag: Nộp Báo Cáo
Auth: Bearer token
Content-Type: multipart/form-data
Body:
  - ma_sinh_vien: string (required)
  - dot_thuc_tap_id: integer (required)
  - loai_bao_cao: enum [tuan, thang, cuoi_ky, tong_ket] (required)
  - ghi_chu: string (optional)
  - report_file: file (required, max 10MB)
Responses:
  201: Success
  400: Validation error
  500: Server error
```

#### 2. GET `/api/student-reports`
**Lấy danh sách báo cáo với filter**
```yaml
Tag: Nộp Báo Cáo
Auth: Bearer token
Query Parameters:
  - ma_sinh_vien: string
  - dot_thuc_tap_id: integer
  - trang_thai_duyet: enum [cho_duyet, da_duyet, tu_choi]
  - loai_bao_cao: enum [tuan, thang, cuoi_ky, tong_ket]
  - ngay_nop_tu: date (YYYY-MM-DD)
  - ngay_nop_den: date (YYYY-MM-DD)
  - ma_giang_vien: string
  - page: integer (default: 1)
  - limit: integer (default: 20)
Responses:
  200: Success with pagination
  500: Server error
```

#### 3. GET `/api/student-reports/{id}`
**Lấy chi tiết một báo cáo**
```yaml
Tag: Nộp Báo Cáo
Auth: Bearer token
Path Parameters:
  - id: integer (required)
Responses:
  200: Success
  404: Not found
  500: Server error
```

#### 4. POST `/api/student-reports/{id}/review`
**Giảng viên duyệt/từ chối báo cáo**
```yaml
Tag: Nộp Báo Cáo
Auth: Bearer token
Path Parameters:
  - id: integer (required)
Body:
  - nguoi_duyet: string (required) - Mã giảng viên
  - trang_thai_duyet: enum [da_duyet, tu_choi] (required)
  - nhan_xet: string (optional)
Responses:
  200: Success
  400: Validation error
  500: Server error
```

#### 5. GET `/api/student-reports/statistics/{ma_sinh_vien}`
**Lấy thống kê báo cáo của sinh viên**
```yaml
Tag: Nộp Báo Cáo
Auth: Bearer token
Path Parameters:
  - ma_sinh_vien: string (required)
Responses:
  200: Success with statistics
    - tong_so_bao_cao: integer
    - cho_duyet: integer
    - da_duyet: integer
    - tu_choi: integer
    - thong_ke_theo_loai: array
  500: Server error
```

#### 6. DELETE `/api/student-reports/{id}`
**Xóa báo cáo (chỉ báo cáo chờ duyệt)**
```yaml
Tag: Nộp Báo Cáo
Auth: Bearer token
Path Parameters:
  - id: integer (required)
Body:
  - ma_sinh_vien: string (required)
Responses:
  200: Success
  400: Validation error
  403: Cannot delete approved/rejected report
  500: Server error
```

#### 7. GET `/api/student-reports/download/{id}`
**Download file báo cáo**
```yaml
Tag: Nộp Báo Cáo
Auth: Bearer token
Path Parameters:
  - id: integer (required)
Responses:
  200: File download (binary)
  404: File not found
  500: Server error
```

---

### **Đổi Mật Khẩu** (6 endpoints)

#### 1. POST `/api/password-reset/request`
**Yêu cầu mã đổi mật khẩu**
```yaml
Tag: Đổi Mật Khẩu
Auth: None (Public)
Body:
  - email: string (required, format: email)
Responses:
  200: Success - mã đã gửi
    - email: string
    - expires_in_minutes: 10
    - reset_code: string (only in development)
  400: Invalid email
  429: Rate limit exceeded (3 requests per 5 minutes)
  500: Server error
```

#### 2. POST `/api/password-reset/verify`
**Xác thực mã đổi mật khẩu**
```yaml
Tag: Đổi Mật Khẩu
Auth: None (Public)
Body:
  - email: string (required)
  - reset_code: string (required, pattern: 6 digits)
Responses:
  200: Code valid
  400: Code invalid/expired/used
    - reason: enum [expired, used, invalid]
  500: Server error
```

#### 3. POST `/api/password-reset/reset`
**Đổi mật khẩu mới**
```yaml
Tag: Đổi Mật Khẩu
Auth: None (Public)
Body:
  - email: string (required)
  - reset_code: string (required)
  - new_password: string (required, minLength: 6)
Responses:
  200: Password reset successful
    - email: string
    - user_id: string
  400: Validation error
  500: Server error
```

#### 4. GET `/api/password-reset/history/{email}`
**Lấy lịch sử yêu cầu đổi mật khẩu (Admin)**
```yaml
Tag: Đổi Mật Khẩu
Auth: Bearer token (Admin only)
Path Parameters:
  - email: string (required)
Query Parameters:
  - limit: integer (default: 10)
Responses:
  200: Success with history array
    - id, email, reset_code, expiration_time, used_flag
    - created_at, trang_thai
  500: Server error
```

#### 5. POST `/api/password-reset/cleanup`
**Xóa các mã hết hạn (Admin)**
```yaml
Tag: Đổi Mật Khẩu
Auth: Bearer token (Admin only)
Body:
  - older_than_hours: integer (optional, default: 24)
Responses:
  200: Success
    - deleted_count: integer
  500: Server error
```

#### 6. GET `/api/password-reset/check-rate-limit/{email}`
**Kiểm tra rate limit cho email**
```yaml
Tag: Đổi Mật Khẩu
Auth: None (Public)
Path Parameters:
  - email: string (required)
Query Parameters:
  - minutes: integer (default: 5)
  - max_requests: integer (default: 3)
Responses:
  200: Success with rate limit status
    - is_limited: boolean
    - request_count: integer
    - max_requests: integer
    - time_window_minutes: integer
    - message: string
  500: Server error
```

---

## 🎨 Schemas Mới Được Thêm

### Student Report Schemas:

1. **StudentReportUpload**
   - Upload request schema with file

2. **StudentReport**
   - Complete report object with all fields

3. **ReviewReportRequest**
   - Review request (approve/reject)

4. **ReportStatistics**
   - Statistics by status and type

### Password Reset Schemas:

1. **PasswordResetRequest**
   - Email for reset request

2. **PasswordResetResponse**
   - Reset code response

3. **VerifyResetCodeRequest**
   - Code verification request

4. **ResetPasswordRequest**
   - Password reset with code

5. **PasswordResetHistory**
   - History record object

6. **RateLimitStatus**
   - Rate limit check result

---

## 🔧 Cách Sử Dụng Swagger UI

### 1. **Truy cập Swagger UI**
```
http://localhost:3001/api/docs
```

### 2. **Xác thực (Authentication)**
- Click nút **"Authorize"** ở góc phải trên
- Nhập JWT token (không cần thêm "Bearer ")
- Token sẽ tự động được thêm vào tất cả request

### 3. **Test API**
- Chọn endpoint cần test
- Click **"Try it out"**
- Nhập parameters/body
- Click **"Execute"**
- Xem response

### 4. **Filter Endpoints**
- Sử dụng ô search ở trên
- Tìm theo tag, method, hoặc path
- Click tag để collapse/expand

---

## 📋 Danh Sách Tất Cả Tags

| Tag | Description | Số Endpoints |
|-----|-------------|--------------|
| Authentication | 🔐 Xác thực và phân quyền | Existing |
| Admin | 👨‍💼 Quản lý hệ thống | Existing |
| Sinh Viên | 👨‍🎓 Quản lý sinh viên | Existing |
| Giảng Viên | 👨‍🏫 Quản lý giảng viên | Existing |
| Doanh Nghiệp | 🏢 Quản lý doanh nghiệp | Existing |
| Đợt Thực Tập | 📅 Quản lý đợt thực tập | Existing |
| Phân Công Thực Tập | 📋 Phân công sinh viên - giảng viên | Existing |
| Đăng Ký Thực Tập | ✍️ Đăng ký thực tập | Existing |
| Báo Cáo Thực Tập | 📊 Báo cáo thực tập | Existing |
| Báo Cáo Sinh Viên | 📝 Báo cáo nộp bởi sinh viên | Existing |
| **Nộp Báo Cáo** | **📤 Upload và quản lý báo cáo** | **8** |
| Đánh Giá Doanh Nghiệp | ⭐ Đánh giá doanh nghiệp | Existing |
| **Đổi Mật Khẩu** | **🔑 Quản lý đổi mật khẩu** | **6** |
| Tài Khoản | 👤 Quản lý tài khoản | Existing |
| Import/Export | 📁 Import/Export dữ liệu Excel | Existing |
| Thông Báo | 🔔 Quản lý thông báo | Existing |
| Dashboard | 📈 Thống kê và báo cáo | Existing |
| Files | 📎 Quản lý files | Existing |
| Utilities | 🔧 Tiện ích hệ thống | Existing |

---

## 🧪 Testing Examples

### Test Upload Report:
```bash
# 1. Get token from login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId": "SV001", "password": "123456", "role": "sinh-vien"}'

# 2. Upload report
curl -X POST http://localhost:3001/api/student-reports/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "ma_sinh_vien=SV001" \
  -F "dot_thuc_tap_id=1" \
  -F "loai_bao_cao=tuan" \
  -F "report_file=@report.pdf"
```

### Test Password Reset Flow:
```bash
# 1. Request reset code
curl -X POST http://localhost:3001/api/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email": "student@dainam.edu.vn"}'

# 2. Verify code
curl -X POST http://localhost:3001/api/password-reset/verify \
  -H "Content-Type: application/json" \
  -d '{"email": "student@dainam.edu.vn", "reset_code": "123456"}'

# 3. Reset password
curl -X POST http://localhost:3001/api/password-reset/reset \
  -H "Content-Type: application/json" \
  -d '{"email": "student@dainam.edu.vn", "reset_code": "123456", "new_password": "NewPass123!"}'
```

---

## 🎯 Features Swagger UI

### ✅ Đã Có:
- Interactive testing
- JWT authentication support
- Request/Response examples
- Schema validation
- Auto-complete
- Filter & search
- Custom Đại Nam styling
- Persistent authorization
- Error response examples

### 📝 Response Status Codes:
- **200**: Success
- **201**: Created
- **400**: Bad Request / Validation Error
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **429**: Too Many Requests (Rate Limit)
- **500**: Internal Server Error

---

## 🔐 Security Features Documented

### Student Reports:
- ✅ JWT authentication required
- ✅ File type validation (whitelist)
- ✅ File size limit (10MB)
- ✅ Permission checks (owner only delete)
- ✅ Status validation (only pending can be deleted)

### Password Reset:
- ✅ Rate limiting (3 requests per 5 minutes)
- ✅ Email validation
- ✅ Code expiration (10 minutes)
- ✅ One-time use codes
- ✅ Bcrypt password hashing
- ✅ Admin-only endpoints

---

## 📚 Documentation Files

All documentation updated in:
```
backend/
├── src/
│   ├── config/
│   │   └── swagger.js ✅ UPDATED
│   └── routes/
│       ├── studentReports.js ✅ UPDATED (8 endpoints documented)
│       └── passwordReset.js ✅ UPDATED (6 endpoints documented)
└── docs/
    ├── NEW_API_DOCUMENTATION.md
    ├── QUICK_START_GUIDE.md
    ├── BUSINESS_LOGIC_SUMMARY.md
    ├── TESTING_CHECKLIST.md
    └── SWAGGER_UPDATE_SUMMARY.md ✅ THIS FILE
```

---

## ✨ Summary

**Tổng cộng đã cập nhật:**
- ✅ 2 tags mới
- ✅ 14 API endpoints với full documentation
- ✅ 10 schemas mới
- ✅ 19 tags tổng cộng
- ✅ Interactive examples cho tất cả endpoints
- ✅ Authentication flow documented
- ✅ Error responses standardized

**Swagger UI sẵn sàng sử dụng tại:**
```
🌐 http://localhost:3001/api/docs
```

**Server đang chạy:**
```
🚀 http://localhost:3001
✅ Database connected
📚 All routes loaded
```

---

## 🎉 Hoàn Thành!

Swagger documentation đã được cập nhật hoàn chỉnh cho tất cả API endpoints hiện tại!

# ✅ Testing Checklist

## 🎯 Pre-Testing Setup

### 1. Create Database Tables
```bash
cd backend
node scripts/create-new-business-logic-tables.js
```

**Expected Output:**
```
🚀 Starting table creation process...
📊 Creating bao_cao_da_nop table...
✅ Table bao_cao_da_nop created successfully
🔐 Creating doi_mat_khau table...
✅ Table doi_mat_khau created successfully
🎉 All tables created successfully!
```

### 2. Verify Tables in Database
```sql
USE quanly_thuctap;

-- Check table structure
DESC bao_cao_da_nop;
DESC doi_mat_khau;

-- Verify foreign keys
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'quanly_thuctap'
  AND TABLE_NAME IN ('bao_cao_da_nop', 'doi_mat_khau')
  AND REFERENCED_TABLE_NAME IS NOT NULL;
```

### 3. Create Upload Directory
```bash
mkdir -p backend/uploads/student-reports
```

### 4. Start Server
```bash
cd backend
node server.js
```

**Expected Output:**
```
🚀 Server đang chạy tại http://localhost:3001
✅ Database connection established
📊 Swagger docs tại http://localhost:3001/api/docs
```

---

## 📊 Student Reports API Testing

### Test 1: Upload Báo Cáo ✅

**Request:**
```bash
curl -X POST http://localhost:3001/api/student-reports/upload \
  -F "ma_sinh_vien=SV001" \
  -F "dot_thuc_tap_id=1" \
  -F "loai_bao_cao=tuan" \
  -F "ghi_chu=Báo cáo tuần 1" \
  -F "report_file=@test.pdf"
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Nộp báo cáo thành công",
  "data": {
    "id": 1,
    "ma_sinh_vien": "SV001",
    "dot_thuc_tap_id": 1,
    "loai_bao_cao": "tuan",
    "file_name": "test.pdf",
    "file_size": 12345,
    "trang_thai_duyet": "cho_duyet",
    "ngay_nop": "2025-10-14T..."
  }
}
```

**Verify:**
- [ ] File created in `backend/uploads/student-reports/`
- [ ] Record inserted in `bao_cao_da_nop` table
- [ ] Status is `cho_duyet`

---

### Test 2: Upload with Invalid Student ❌

**Request:**
```bash
curl -X POST http://localhost:3001/api/student-reports/upload \
  -F "ma_sinh_vien=INVALID_STUDENT" \
  -F "dot_thuc_tap_id=1" \
  -F "loai_bao_cao=tuan" \
  -F "report_file=@test.pdf"
```

**Expected Response (500):**
```json
{
  "success": false,
  "message": "Sinh viên không tồn tại"
}
```

**Verify:**
- [ ] No file created
- [ ] No record inserted
- [ ] Error message clear

---

### Test 3: List All Reports 📋

**Request:**
```bash
curl -X GET "http://localhost:3001/api/student-reports?page=1&limit=10"
```

**Expected Response (200):**
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
      "loai_bao_cao": "tuan",
      "trang_thai_duyet": "cho_duyet",
      "ngay_nop": "..."
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

**Verify:**
- [ ] Returns array of reports
- [ ] Includes pagination info
- [ ] JOINed data from related tables

---

### Test 4: Filter by Student 🔍

**Request:**
```bash
curl -X GET "http://localhost:3001/api/student-reports?ma_sinh_vien=SV001"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    // Only reports from SV001
  ]
}
```

**Verify:**
- [ ] Only SV001's reports returned
- [ ] Filter working correctly

---

### Test 5: Get Report Detail 📄

**Request:**
```bash
curl -X GET "http://localhost:3001/api/student-reports/1"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Lấy thông tin báo cáo thành công",
  "data": {
    "id": 1,
    "ma_sinh_vien": "SV001",
    "file_path": "...",
    "file_name": "test.pdf",
    "trang_thai_duyet": "cho_duyet",
    ...
  }
}
```

**Verify:**
- [ ] Returns single report
- [ ] All fields present
- [ ] Correct report ID

---

### Test 6: Approve Report ✅

**Request:**
```bash
curl -X POST http://localhost:3001/api/student-reports/1/review \
  -H "Content-Type: application/json" \
  -d '{
    "nguoi_duyet": "GV001",
    "trang_thai_duyet": "da_duyet",
    "nhan_xet": "Báo cáo tốt, đầy đủ thông tin"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Duyệt báo cáo thành công",
  "data": {
    "id": 1,
    "trang_thai_duyet": "da_duyet",
    "nguoi_duyet": "GV001",
    "ngay_duyet": "2025-10-14T...",
    "nhan_xet": "Báo cáo tốt, đầy đủ thông tin"
  }
}
```

**Verify:**
- [ ] Status changed to `da_duyet`
- [ ] `nguoi_duyet` set
- [ ] `ngay_duyet` recorded
- [ ] Comment saved

---

### Test 7: Reject Report ❌

**Request:**
```bash
curl -X POST http://localhost:3001/api/student-reports/2/review \
  -H "Content-Type: application/json" \
  -d '{
    "nguoi_duyet": "GV001",
    "trang_thai_duyet": "tu_choi",
    "nhan_xet": "Báo cáo thiếu phần phân tích"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Từ chối báo cáo thành công",
  "data": {
    "id": 2,
    "trang_thai_duyet": "tu_choi",
    "ly_do_tu_choi": "Báo cáo thiếu phần phân tích"
  }
}
```

**Verify:**
- [ ] Status changed to `tu_choi`
- [ ] Rejection reason saved

---

### Test 8: Get Statistics 📊

**Request:**
```bash
curl -X GET "http://localhost:3001/api/student-reports/statistics/SV001"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Lấy thống kê thành công",
  "data": {
    "tong_so_bao_cao": 3,
    "cho_duyet": 1,
    "da_duyet": 1,
    "tu_choi": 1,
    "thong_ke_theo_loai": [
      {
        "loai_bao_cao": "tuan",
        "so_luong": 2
      },
      {
        "loai_bao_cao": "thang",
        "so_luong": 1
      }
    ]
  }
}
```

**Verify:**
- [ ] Counts match database
- [ ] Grouped by status
- [ ] Grouped by type

---

### Test 9: Delete Pending Report 🗑️

**Request:**
```bash
curl -X DELETE http://localhost:3001/api/student-reports/3 \
  -H "Content-Type: application/json" \
  -d '{"ma_sinh_vien": "SV001"}'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Xóa báo cáo thành công",
  "data": {
    "id": 3,
    "ma_sinh_vien": "SV001",
    "file_name": "test.pdf"
  }
}
```

**Verify:**
- [ ] Record deleted from database
- [ ] Physical file deleted
- [ ] Only works for `cho_duyet` status

---

### Test 10: Try Delete Approved Report ❌

**Request:**
```bash
curl -X DELETE http://localhost:3001/api/student-reports/1 \
  -H "Content-Type: application/json" \
  -d '{"ma_sinh_vien": "SV001"}'
```

**Expected Response (403):**
```json
{
  "success": false,
  "message": "Không thể xóa báo cáo đã được duyệt hoặc từ chối"
}
```

**Verify:**
- [ ] Delete blocked
- [ ] Record still in database
- [ ] Error message clear

---

### Test 11: Download Report 📥

**Request:**
```bash
curl -X GET http://localhost:3001/api/student-reports/download/1 -o downloaded_report.pdf
```

**Expected Response:**
- File downloaded successfully

**Verify:**
- [ ] File downloaded
- [ ] Correct filename
- [ ] File opens correctly

---

## 🔐 Password Reset API Testing

### Test 12: Request Reset Code 📧

**Request:**
```bash
curl -X POST http://localhost:3001/api/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email": "test@dainam.edu.vn"}'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Mã xác thực đã được gửi đến email của bạn",
  "data": {
    "email": "test@dainam.edu.vn",
    "expires_in_minutes": 10,
    "reset_code": "123456"  // Only in development
  }
}
```

**Verify:**
- [ ] Record created in `doi_mat_khau`
- [ ] 6-digit code generated
- [ ] Expiration time set (10 minutes)
- [ ] Code returned in development mode

---

### Test 13: Request with Invalid Email ❌

**Request:**
```bash
curl -X POST http://localhost:3001/api/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email"}'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Email không hợp lệ"
}
```

**Verify:**
- [ ] Validation working
- [ ] No record created

---

### Test 14: Rate Limiting 🚫

**Request (4th request within 5 minutes):**
```bash
# Run this 4 times quickly
for i in {1..4}; do
  curl -X POST http://localhost:3001/api/password-reset/request \
    -H "Content-Type: application/json" \
    -d '{"email": "test@dainam.edu.vn"}'
  echo ""
done
```

**Expected Response on 4th request (429):**
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

**Verify:**
- [ ] Rate limit enforced
- [ ] 3 requests allowed
- [ ] 4th request blocked

---

### Test 15: Verify Valid Code ✅

**Request:**
```bash
curl -X POST http://localhost:3001/api/password-reset/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@dainam.edu.vn",
    "reset_code": "123456"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Mã xác thực hợp lệ",
  "data": {
    "email": "test@dainam.edu.vn",
    "expiration_time": "2025-10-14T11:00:00.000Z"
  }
}
```

**Verify:**
- [ ] Code validated
- [ ] Not expired
- [ ] Not used

---

### Test 16: Verify Invalid Code ❌

**Request:**
```bash
curl -X POST http://localhost:3001/api/password-reset/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@dainam.edu.vn",
    "reset_code": "999999"
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Mã xác thực không hợp lệ",
  "reason": "invalid"
}
```

**Verify:**
- [ ] Invalid code rejected
- [ ] Reason provided

---

### Test 17: Reset Password ✅

**Request:**
```bash
curl -X POST http://localhost:3001/api/password-reset/reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@dainam.edu.vn",
    "reset_code": "123456",
    "new_password": "NewPassword123!"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Đổi mật khẩu thành công",
  "data": {
    "email": "test@dainam.edu.vn",
    "user_id": "SV001"
  }
}
```

**Verify:**
- [ ] Password updated in `accounts` table
- [ ] Password is bcrypt hashed
- [ ] Reset code marked as used (`used_flag = 1`)

**Verify in Database:**
```sql
-- Check password was hashed
SELECT password FROM accounts WHERE email = 'test@dainam.edu.vn';
-- Should start with $2b$ (bcrypt)

-- Check code marked as used
SELECT used_flag FROM doi_mat_khau WHERE reset_code = '123456';
-- Should be 1
```

---

### Test 18: Try Reuse Code ❌

**Request (same code as Test 17):**
```bash
curl -X POST http://localhost:3001/api/password-reset/reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@dainam.edu.vn",
    "reset_code": "123456",
    "new_password": "AnotherPassword"
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Mã xác thực đã được sử dụng",
  "reason": "used"
}
```

**Verify:**
- [ ] Used code rejected
- [ ] Password not changed again

---

### Test 19: Check Rate Limit Status 🔍

**Request:**
```bash
curl -X GET "http://localhost:3001/api/password-reset/check-rate-limit/test@dainam.edu.vn"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Kiểm tra rate limit thành công",
  "data": {
    "is_limited": false,
    "request_count": 2,
    "max_requests": 3,
    "time_window_minutes": 5,
    "message": "Có thể yêu cầu"
  }
}
```

**Verify:**
- [ ] Current count shown
- [ ] Limit status correct

---

### Test 20: Get Reset History 📜

**Request:**
```bash
curl -X GET "http://localhost:3001/api/password-reset/history/test@dainam.edu.vn?limit=5"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Lấy lịch sử thành công",
  "data": [
    {
      "id": 1,
      "email": "test@dainam.edu.vn",
      "reset_code": "123456",
      "expiration_time": "2025-10-14T11:00:00.000Z",
      "used_flag": 1,
      "created_at": "2025-10-14T10:50:00.000Z",
      "trang_thai": "Đã sử dụng"
    }
  ]
}
```

**Verify:**
- [ ] Returns history
- [ ] Status calculated correctly
- [ ] Ordered by created_at DESC

---

### Test 21: Cleanup Expired Codes 🧹

**Request:**
```bash
curl -X POST http://localhost:3001/api/password-reset/cleanup \
  -H "Content-Type: application/json" \
  -d '{"older_than_hours": 1}'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Đã xóa 5 mã hết hạn",
  "data": {
    "deleted_count": 5
  }
}
```

**Verify:**
- [ ] Old codes deleted
- [ ] Count returned
- [ ] Only expired codes deleted

---

## 🔄 Integration Testing

### Test 22: Complete Password Reset Flow 🔄

**Step 1: Request Code**
```bash
curl -X POST http://localhost:3001/api/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email": "integration@test.com"}'
```
Save the `reset_code` from response.

**Step 2: Verify Code**
```bash
curl -X POST http://localhost:3001/api/password-reset/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "integration@test.com",
    "reset_code": "SAVED_CODE"
  }'
```

**Step 3: Reset Password**
```bash
curl -X POST http://localhost:3001/api/password-reset/reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "integration@test.com",
    "reset_code": "SAVED_CODE",
    "new_password": "NewIntegrationPass123!"
  }'
```

**Verify:**
- [ ] All 3 steps succeed
- [ ] Code works only once
- [ ] Password actually changed

---

### Test 23: Complete Report Submission Flow 📝

**Step 1: Upload Report**
```bash
curl -X POST http://localhost:3001/api/student-reports/upload \
  -F "ma_sinh_vien=SV999" \
  -F "dot_thuc_tap_id=1" \
  -F "loai_bao_cao=tuan" \
  -F "report_file=@test.pdf"
```
Save the `id` from response.

**Step 2: List and Verify**
```bash
curl -X GET "http://localhost:3001/api/student-reports?ma_sinh_vien=SV999"
```

**Step 3: Teacher Review**
```bash
curl -X POST http://localhost:3001/api/student-reports/SAVED_ID/review \
  -H "Content-Type: application/json" \
  -d '{
    "nguoi_duyet": "GV001",
    "trang_thai_duyet": "da_duyet",
    "nhan_xet": "Integration test passed!"
  }'
```

**Step 4: Check Statistics**
```bash
curl -X GET "http://localhost:3001/api/student-reports/statistics/SV999"
```

**Verify:**
- [ ] Upload successful
- [ ] Report appears in list
- [ ] Review updates status
- [ ] Statistics accurate

---

## 📊 Database Verification

### Check Foreign Key Constraints:
```sql
-- Try to insert invalid student
INSERT INTO bao_cao_da_nop 
(ma_sinh_vien, dot_thuc_tap_id, loai_bao_cao, file_path, file_name, file_size, mime_type)
VALUES ('INVALID', 1, 'tuan', '/test.pdf', 'test.pdf', 100, 'application/pdf');
-- Should FAIL with FK constraint error

-- Try to delete student with reports
DELETE FROM sinh_vien WHERE ma_sinh_vien = 'SV001';
-- Should CASCADE delete reports OR fail depending on FK setting
```

### Check Indexes:
```sql
SHOW INDEX FROM bao_cao_da_nop;
SHOW INDEX FROM doi_mat_khau;
```

Expected indexes:
- [ ] `idx_ma_sinh_vien`
- [ ] `idx_dot_thuc_tap`
- [ ] `idx_trang_thai`
- [ ] `idx_ngay_nop`
- [ ] `idx_email`
- [ ] `idx_reset_code`
- [ ] `idx_expiration`
- [ ] `idx_used_flag`

---

## 🎯 Summary Checklist

### Student Reports (11 tests):
- [ ] Test 1: Upload valid report
- [ ] Test 2: Upload with invalid student
- [ ] Test 3: List all reports
- [ ] Test 4: Filter by student
- [ ] Test 5: Get report detail
- [ ] Test 6: Approve report
- [ ] Test 7: Reject report
- [ ] Test 8: Get statistics
- [ ] Test 9: Delete pending report
- [ ] Test 10: Try delete approved report (should fail)
- [ ] Test 11: Download report

### Password Reset (10 tests):
- [ ] Test 12: Request reset code
- [ ] Test 13: Invalid email (should fail)
- [ ] Test 14: Rate limiting (4th request should fail)
- [ ] Test 15: Verify valid code
- [ ] Test 16: Verify invalid code (should fail)
- [ ] Test 17: Reset password
- [ ] Test 18: Try reuse code (should fail)
- [ ] Test 19: Check rate limit status
- [ ] Test 20: Get reset history
- [ ] Test 21: Cleanup expired codes

### Integration (2 tests):
- [ ] Test 22: Complete password reset flow
- [ ] Test 23: Complete report submission flow

### Total: 23 Tests

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module"
**Solution:**
```bash
cd backend
npm install multer bcrypt
```

### Issue: "Table doesn't exist"
**Solution:**
```bash
node scripts/create-new-business-logic-tables.js
```

### Issue: "File upload failed - ENOENT"
**Solution:**
```bash
mkdir -p backend/uploads/student-reports
chmod 755 backend/uploads
```

### Issue: "Foreign key constraint fails"
**Solution:**
```sql
-- Check if referenced tables exist
SHOW TABLES LIKE 'sinh_vien';
SHOW TABLES LIKE 'dot_thuc_tap';
SHOW TABLES LIKE 'accounts';
```

### Issue: "Connection refused"
**Solution:**
- Check MySQL is running
- Verify .env database credentials
- Check server is started

---

## ✅ Success Criteria

All tests pass when:
- [ ] All 23 tests complete successfully
- [ ] No console errors in server
- [ ] Database records correct
- [ ] Files upload/download properly
- [ ] Foreign keys enforced
- [ ] Rate limiting works
- [ ] Transactions rollback on error
- [ ] Security validations active

---

## 🎉 Testing Complete!

Once all tests pass:
1. Document any issues found
2. Update API documentation if needed
3. Consider adding automated tests
4. Ready for production deployment!

**Happy Testing! 🚀**

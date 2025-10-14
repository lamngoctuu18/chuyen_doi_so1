# 📚 Hệ thống Quản lý Bài nộp & Báo cáo Thực tập - API Documentation

## 🎯 Mục đích
Hệ thống quản lý nghiệp vụ nộp bài, duyệt báo cáo và quản lý thời gian đăng ký thực tập của sinh viên.

---

## 📦 Cấu trúc Database

### 1. **bai_nop_cua_sinh_vien**
Lưu trữ các bài nộp của sinh viên
```sql
- id: INT (PK)
- slot_id: INT (FK -> dot_nop_bao_cao_theo_tuan)
- ma_sinh_vien: VARCHAR(20)
- file_path: VARCHAR(512)
- original_name: VARCHAR(255)
- mime_type: VARCHAR(100)
- file_size: INT
- submitted_at: TIMESTAMP
- teacher_comment: TEXT
- trang_thai: ENUM('da_nop','da_duyet','tu_choi')
```

### 2. **dot_nop_bao_cao_theo_tuan**
Quản lý các đợt nộp bài/báo cáo theo tuần
```sql
- id: INT (PK)
- ma_giang_vien: VARCHAR(20)
- tieu_de: VARCHAR(255)
- loai_bao_cao: ENUM('tuan','thang','cuoi_ky','tong_ket')
- mo_ta: TEXT
- start_at: DATETIME
- end_at: DATETIME
- created_at: TIMESTAMP
```

### 3. **bao_cao_da_nop**
Nhật ký tất cả báo cáo đã nộp (log)
```sql
- id: VARCHAR(36) (PK, UUID)
- tieu_de: VARCHAR(500)
- loai_nguoi_nop: ENUM('giang_vien', 'doanh_nghiep', 'sinh_vien')
- ma_nguoi_nop: VARCHAR(50)
- ten_nguoi_nop: VARCHAR(255)
- ngay_nop: DATE
- trang_thai: ENUM('da_nop', 'da_duyet', 'tu_choi')
- nguoi_duyet: VARCHAR(50)
- ngay_duyet: DATETIME
- ly_do_tu_choi: TEXT
```

### 4. **thoi_gian_dang_ky_dot_thuc_tap**
Quản lý thời gian mở/đóng đăng ký thực tập
```sql
- id: INT (PK)
- title: VARCHAR(255)
- start_time: DATETIME
- end_time: DATETIME
- description: TEXT
- is_active: TINYINT(1)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

---

## 🔧 Cài đặt

### 1. Cài đặt Dependencies
```bash
cd backend
npm install express multer mysql2
```

### 2. Đăng ký Routes trong server.js
```javascript
const submissionsRouter = require('./src/routes/submissions');
const registrationPeriodsRouter = require('./src/routes/registrationPeriods');

// ... trong app setup
app.use('/api/submissions', submissionsRouter);
app.use('/api/registration-periods', registrationPeriodsRouter);
```

---

## 📡 API Endpoints

### **A. QUẢN LÝ BÀI NỘP** (`/api/submissions`)

#### 1. **Nộp bài** (Sinh viên)
```http
POST /api/submissions/:slotId/upload
Content-Type: multipart/form-data
Authorization: Bearer <student_token>

Body (form-data):
- file: <file> (required)
- ma_sinh_vien: <string> (nếu không có trong token)

Response Success (201):
{
  "success": true,
  "message": "Nộp bài thành công",
  "data": {
    "submission": { ... },
    "file": {
      "name": "report.pdf",
      "size": 1024000,
      "type": "application/pdf"
    }
  }
}

Response Error (400):
{
  "success": false,
  "message": "Hết hạn nộp bài. Thời gian kết thúc: 01/01/2025, 23:59:59"
}
```

**Nghiệp vụ kiểm tra:**
- ✅ Đợt nộp bài có tồn tại
- ✅ Trong thời gian cho phép (start_at <= now <= end_at)
- ✅ Sinh viên thuộc giảng viên quản lý đợt này
- ✅ Sinh viên đang trong trạng thái thực tập hợp lệ
- ✅ File không trùng tên (trong cùng đợt)
- ✅ Tự động ghi log vào `bao_cao_da_nop`

---

#### 2. **Lấy danh sách bài nộp của sinh viên**
```http
GET /api/submissions/student/:maSinhVien?slot_id=<id>&trang_thai=<status>

Response (200):
{
  "success": true,
  "message": "Lấy danh sách bài nộp thành công",
  "data": {
    "submissions": [ ... ],
    "statistics": {
      "tong_bai_nop": 10,
      "cho_duyet": 3,
      "da_duyet": 6,
      "tu_choi": 1
    },
    "total": 10
  }
}
```

---

#### 3. **Duyệt/Từ chối bài nộp** (Giảng viên)
```http
POST /api/submissions/:submissionId/review
Content-Type: application/json
Authorization: Bearer <teacher_token>

Body:
{
  "trang_thai": "da_duyet", // hoặc "tu_choi"
  "teacher_comment": "Bài làm tốt, đạt yêu cầu",
  "ly_do_tu_choi": null // bắt buộc nếu trang_thai = "tu_choi"
}

Response Success (200):
{
  "success": true,
  "message": "Đã duyệt bài nộp thành công",
  "data": {
    "submissionId": 123,
    "trang_thai": "da_duyet"
  }
}

Response Error (403):
{
  "success": false,
  "message": "Bạn không có quyền đánh giá bài nộp này"
}
```

**Nghiệp vụ kiểm tra:**
- ✅ Bài nộp tồn tại
- ✅ Giảng viên có quyền duyệt (quản lý đợt này)
- ✅ Nếu từ chối, phải có lý do
- ✅ Tự động cập nhật log trong `bao_cao_da_nop`

---

#### 4. **Lấy tất cả bài nộp trong đợt** (Giảng viên)
```http
GET /api/submissions/slot/:slotId?trang_thai=<status>

Response (200):
{
  "success": true,
  "data": {
    "submissions": [ ... ],
    "statistics": {
      "tong_bai_nop": 25,
      "cho_duyet": 10,
      "da_duyet": 12,
      "tu_choi": 3
    },
    "total": 25
  }
}
```

---

#### 5. **Xóa bài nộp** (Sinh viên)
```http
DELETE /api/submissions/:submissionId
Authorization: Bearer <student_token>

Response Success (200):
{
  "success": true,
  "message": "Xóa bài nộp thành công"
}

Response Error (400):
{
  "success": false,
  "message": "Không thể xóa bài nộp đã được duyệt hoặc đã bị từ chối"
}
```

**Nghiệp vụ:**
- ✅ Chỉ xóa được bài của mình
- ✅ Chỉ xóa được khi `trang_thai = 'da_nop'`
- ✅ Tự động xóa file vật lý

---

### **B. QUẢN LÝ THỜI GIAN ĐĂNG KÝ** (`/api/registration-periods`)

#### 1. **Kiểm tra trạng thái đăng ký** (Public)
```http
GET /api/registration-periods/status

Response (200):
{
  "success": true,
  "data": {
    "isOpen": true,
    "period": {
      "id": 1,
      "title": "Đợt đăng ký thực tập Học kỳ 1 - 2024/2025",
      "start_time": "2024-01-01T00:00:00.000Z",
      "end_time": "2024-01-31T23:59:59.000Z",
      "description": "...",
      "is_active": 1
    },
    "message": "Đợt đăng ký đang mở",
    "timeRemaining": 2592000000 // milliseconds
  }
}
```

**Các trạng thái:**
- `isOpen: true` - Đang mở, cho phép đăng ký
- `isOpen: false, reason: 'not_started'` - Chưa đến thời gian
- `isOpen: false, reason: 'ended'` - Đã hết hạn

---

#### 2. **Lấy danh sách đợt đăng ký**
```http
GET /api/registration-periods?is_active=true&from_date=2024-01-01&to_date=2024-12-31

Response (200):
{
  "success": true,
  "data": {
    "periods": [
      {
        "id": 1,
        "title": "...",
        "start_time": "...",
        "end_time": "...",
        "is_active": 1,
        "current_status": "active" // upcoming, active, expired, inactive
      }
    ],
    "total": 5
  }
}
```

---

#### 3. **Tạo đợt đăng ký mới** (Admin)
```http
POST /api/registration-periods
Content-Type: application/json

Body:
{
  "title": "Đợt đăng ký thực tập Học kỳ 2 - 2024/2025",
  "start_time": "2025-06-01T00:00:00",
  "end_time": "2025-06-30T23:59:59",
  "description": "Mô tả đợt đăng ký"
}

Response Success (201):
{
  "success": true,
  "message": "Tạo đợt đăng ký thành công",
  "data": { ... }
}

Response Error (400):
{
  "success": false,
  "message": "Thời gian bị trùng với đợt đăng ký \"Đợt 1\" (01/01/2025 - 31/01/2025)"
}
```

**Nghiệp vụ:**
- ✅ `start_time` phải trước `end_time`
- ✅ Không trùng thời gian với đợt đang active khác
- ✅ Tự động set `is_active = 1`

---

#### 4. **Đóng đợt đăng ký** (Admin)
```http
PUT /api/registration-periods/:periodId/close

Response (200):
{
  "success": true,
  "message": "Đã đóng đợt đăng ký và tất cả các đợt nộp bài liên quan",
  "data": {
    "periodId": 1,
    "closedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Nghiệp vụ:**
- ✅ Set `is_active = 0`
- ✅ Tự động đóng tất cả đợt nộp bài trong khoảng thời gian này
- ✅ Sinh viên không thể nộp bài mới

---

#### 5. **Mở lại đợt đăng ký** (Admin)
```http
PUT /api/registration-periods/:periodId/reopen

Response (200):
{
  "success": true,
  "message": "Đã mở lại đợt đăng ký",
  "data": {
    "periodId": 1,
    "reopenedAt": "..."
  }
}

Response Error (400):
{
  "success": false,
  "message": "Không thể mở lại đợt đã quá thời gian kết thúc"
}
```

**Nghiệp vụ:**
- ✅ Không mở lại nếu đã quá `end_time`
- ✅ Tự động đóng tất cả đợt khác
- ✅ Set `is_active = 1`

---

#### 6. **Gia hạn đợt đăng ký** (Admin)
```http
PUT /api/registration-periods/:periodId/extend
Content-Type: application/json

Body:
{
  "new_end_time": "2025-02-15T23:59:59"
}

Response (200):
{
  "success": true,
  "message": "Đã gia hạn đợt đến 15/02/2025, 23:59:59",
  "data": {
    "periodId": 1,
    "old_end_time": "2025-01-31T23:59:59.000Z",
    "new_end_time": "2025-02-15T23:59:59.000Z"
  }
}
```

**Nghiệp vụ:**
- ✅ `new_end_time` phải sau `end_time` hiện tại
- ✅ Cho phép gia hạn nhiều lần

---

## 🔒 Middleware & Validation

### 1. **validateSubmissionTime**
Tự động kiểm tra:
- Đợt nộp bài có tồn tại
- Thời gian hợp lệ (start_at <= now <= end_at)
- Sinh viên thuộc giảng viên quản lý

### 2. **File Upload Validation**
- **Loại file cho phép:**
  - PDF: `application/pdf`
  - Word: `.doc`, `.docx`
  - Excel: `.xls`, `.xlsx`
  - PowerPoint: `.ppt`, `.pptx`
  - Hình ảnh: `.jpg`, `.jpeg`, `.png`
- **Kích thước tối đa:** 10MB
- **Tên file tự động:** `{maSinhVien}_{timestamp}_{originalName}`

---

## 🚀 Sử dụng trong Frontend

### Example: Nộp bài (React)
```javascript
const handleSubmit = async (slotId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch(`/api/submissions/${slotId}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(result.message);
    } else {
      alert(`Lỗi: ${result.message}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Example: Kiểm tra thời gian đăng ký
```javascript
const checkRegistrationStatus = async () => {
  const response = await fetch('/api/registration-periods/status');
  const { data } = await response.json();
  
  if (data.isOpen) {
    console.log('Đang mở đăng ký!');
    console.log(`Còn: ${data.timeRemaining / 1000 / 60 / 60} giờ`);
  } else {
    console.log(data.message);
  }
};
```

---

## 📊 Luồng nghiệp vụ

### Luồng Nộp bài:
1. Sinh viên chọn file
2. **Frontend** gọi `/api/registration-periods/status` → kiểm tra đợt mở chưa
3. **Frontend** gọi `/api/submissions/:slotId/upload` với file
4. **Middleware** `validateSubmissionTime` kiểm tra:
   - Đợt tồn tại
   - Trong thời gian
   - Sinh viên có quyền
5. **Service** `SubmissionService.checkSubmissionPermission`:
   - Sinh viên tồn tại
   - Trạng thái thực tập hợp lệ
   - Không trùng file
6. **Service** lưu vào DB + ghi log
7. **Response** thành công

### Luồng Duyệt bài:
1. Giảng viên xem danh sách: `/api/submissions/slot/:slotId`
2. Chọn bài → duyệt/từ chối: `/api/submissions/:id/review`
3. **Service** kiểm tra quyền
4. Cập nhật `trang_thai` trong `bai_nop_cua_sinh_vien`
5. Cập nhật log trong `bao_cao_da_nop`

---

## ⚠️ Lỗi thường gặp & Giải pháp

| Lỗi | Nguyên nhân | Giải pháp |
|------|------------|-----------|
| `"Hết hạn nộp bài"` | Đã quá `end_at` | Gia hạn đợt hoặc tạo đợt mới |
| `"Không tìm thấy sinh viên"` | Chưa tồn tại trong DB | Import sinh viên vào hệ thống |
| `"File đã được nộp"` | Trùng `original_name` | Đổi tên file hoặc xóa bài cũ |
| `"Không có quyền"` | Không thuộc giảng viên | Kiểm tra `sinh_vien_huong_dan` |
| `"Thời gian trùng"` | Overlap với đợt khác | Điều chỉnh thời gian |

---

## 📝 Notes
- Tất cả thời gian sử dụng **UTC** trong DB, hiển thị cần convert sang `vi-VN`
- File upload được lưu tại: `uploads/submissions/{slotId}/{fileName}`
- Log tự động ghi vào `bao_cao_da_nop` mỗi khi có action
- Transaction được sử dụng để đảm bảo data consistency

---

## 🔄 Cập nhật trong tương lai
- [ ] Thêm notification khi bài được duyệt
- [ ] Export báo cáo Excel
- [ ] Tự động đóng đợt khi hết hạn (cron job)
- [ ] Upload multiple files cùng lúc
- [ ] Preview file trước khi nộp

---

**Version:** 1.0  
**Last Updated:** 2025-01-15  
**Author:** Development Team

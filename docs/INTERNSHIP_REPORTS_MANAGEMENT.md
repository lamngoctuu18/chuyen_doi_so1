# Hệ thống Quản lý Báo cáo Thực tập

## Tổng quan

Hệ thống quản lý báo cáo thực tập theo lớp giúp admin theo dõi tiến độ hoàn thành báo cáo thực tập của sinh viên.

## Tính năng chính

### 1. Thống kê tổng quan
- **Tổng sinh viên**: Hiển thị tổng số sinh viên đang thực tập
- **Đã hoàn thành**: Số sinh viên đã được giảng viên chấm điểm (điểm >= 5)
- **Chưa hoàn thành**: Số sinh viên chưa được chấm điểm hoặc điểm < 5
- **Tỷ lệ hoàn thành**: Phần trăm sinh viên đã hoàn thành

### 2. Thống kê theo lớp
- Hiển thị chi tiết từng lớp với:
  - Tổng số sinh viên
  - Số sinh viên đã/chưa hoàn thành
  - Tỷ lệ hoàn thành (%)
  - Thanh tiến độ trực quan
  - Nút xuất Excel riêng cho từng lớp

### 3. Bảng danh sách sinh viên
Hiển thị thông tin chi tiết bao gồm:
- **STT**: Số thứ tự
- **Sinh viên**: Họ tên, mã SV, email
- **Lớp**: Lớp học của sinh viên
- **Giảng viên hướng dẫn**: Tên giảng viên
- **Doanh nghiệp**: Tên công ty thực tập
- **Vị trí**: Vị trí thực tập
- **Điểm GV**: Điểm giảng viên chấm (hoặc "Chưa chấm")
- **Trạng thái**: Đã hoàn thành / Chưa hoàn thành
- **Thao tác**: Nút xem chi tiết

### 4. Bộ lọc và tìm kiếm
- **Tìm kiếm**: Tìm theo tên SV, mã SV, lớp, GV, doanh nghiệp
- **Lọc theo lớp**: Chọn lớp cụ thể hoặc tất cả
- **Lọc theo trạng thái**: Đã hoàn thành / Chưa hoàn thành / Tất cả

### 5. Xuất Excel
- **Xuất từng lớp**: Click nút Download ở mỗi thẻ lớp
- **Xuất tất cả**: Click nút "Xuất tất cả" ở header

Dữ liệu xuất bao gồm:
- STT
- Mã sinh viên
- Họ và tên
- Lớp
- Email
- Số điện thoại
- Giảng viên hướng dẫn
- Doanh nghiệp thực tập
- Vị trí thực tập
- Ngày bắt đầu
- Ngày kết thúc
- Điểm GV chấm
- Trạng thái
- Nhận xét

## API Endpoints

### Backend Routes (`/api/internship-reports`)

#### 1. GET `/students`
Lấy danh sách báo cáo sinh viên

**Query Parameters:**
- `class`: Tên lớp (optional)
- `status`: Trạng thái - `da-hoan-thanh`, `chua-hoan-thanh`, `all` (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "maSinhVien": "SV001",
      "hoTen": "Nguyễn Văn An",
      "lop": "CNTT01",
      "email": "sv001@gmail.com",
      "soDienThoai": "0912345678",
      "giangVienHuongDan": "TS. Trần Thị B",
      "doanhNghiepThucTap": "Công ty ABC",
      "viTriThucTap": "Web Developer",
      "diemGiangVien": 8.5,
      "trangThaiBaoCao": "da-hoan-thanh",
      "ngayBatDauThucTap": "2024-01-15",
      "ngayKetThucThucTap": "2024-05-15",
      "nhanXetGiangVien": "Sinh viên tốt"
    }
  ]
}
```

#### 2. GET `/class-stats`
Lấy thống kê theo lớp

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "tenLop": "CNTT01",
      "tongSinhVien": 30,
      "daHoanThanh": 25,
      "chuaHoanThanh": 5,
      "tyLeHoanThanh": 83
    }
  ]
}
```

#### 3. GET `/overview-stats`
Lấy thống kê tổng quan

**Response:**
```json
{
  "success": true,
  "data": {
    "tongSinhVien": 145,
    "daHoanThanh": 98,
    "chuaHoanThanh": 47,
    "tyLeHoanThanh": 68
  }
}
```

#### 4. GET `/classes`
Lấy danh sách lớp

**Response:**
```json
{
  "success": true,
  "data": ["CNTT01", "CNTT02", "CNTT03"]
}
```

## Cài đặt

### Backend
```bash
cd backend
npm install
```

File đã được tạo:
- `src/controllers/InternshipReportsController.js`
- `src/routes/internship-reports.js`

Đã thêm route vào `server.js`:
```javascript
app.use('/api/internship-reports', require('./src/routes/internship-reports'));
```

### Frontend
```bash
cd quanly-thuctap
npm install
```

File đã được tạo:
- `src/pages/InternshipReportsManagementPage.tsx`
- `src/services/internshipReportsAPI.ts`

Đã cập nhật route trong `App.tsx`:
```tsx
<Route 
  path="/admin/reports" 
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <InternshipReportsManagementPage />
    </ProtectedRoute>
  } 
/>
```

## Chạy ứng dụng

1. Start backend:
```bash
cd backend
node server.js
```

2. Start frontend:
```bash
cd quanly-thuctap
npm run dev
```

3. Truy cập: http://localhost:5173/admin/reports

## Lưu ý

- Chỉ admin mới có quyền truy cập trang báo cáo
- Trạng thái "Đã hoàn thành" được tính khi sinh viên có điểm GV >= 5
- File Excel được đặt tên theo format: `BaoCaoThucTap_[TenLop]_[NgayThang].xlsx`
- Dữ liệu được lấy từ bảng `sinh_vien`, `phan_cong_thuc_tap`, `giang_vien`, `doanh_nghiep`, `sinh_vien_huong_dan`

## Màn hình

### 1. Thống kê tổng quan
- 4 card thống kê với gradient đẹp mắt
- Icon trực quan cho từng loại thống kê

### 2. Thống kê lớp
- Grid responsive 3 cột
- Mỗi card hiển thị:
  - Tên lớp
  - Số liệu chi tiết
  - Thanh tiến độ
  - Nút xuất Excel

### 3. Bảng danh sách
- Table responsive với scroll ngang
- Phân trang thông tin ở footer
- Highlight khi hover row
- Badge màu sắc cho trạng thái

## Công nghệ sử dụng

### Frontend
- React + TypeScript
- Tailwind CSS
- XLSX library (xuất Excel)
- Lucide React (icons)
- Axios (HTTP client)

### Backend
- Node.js + Express
- MySQL
- JWT authentication

## Tác giả

Phát triển bởi GitHub Copilot - AI Assistant

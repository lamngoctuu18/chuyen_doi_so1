<h2 align="center">
    <a href="https://dainam.edu.vn/vi/khoa-cong-nghe-thong-tin">
    🎓 Faculty of Information Technology (DaiNam University)
    </a>
</h2>
<h2 align="center">
   Hệ thống Quản lý Thực tập Sinh viên
</h2>
<div align="center">
    <p align="center">
        <img width="170" alt="aiotlab_logo" src="https://github.com/user-attachments/assets/41ef702b-3d6e-4ac4-beac-d8c9a874bca9" />
        <img width="180" alt="fitdnu_logo" src="https://github.com/user-attachments/assets/ec4815af-e477-480b-b9fa-c490b74772b8" />
        <img width="200" alt="dnu_logo" src="https://github.com/user-attachments/assets/2bcb1a6c-774c-4e7d-b14d-8c53dbb4067f" />
    </p>

[![AIoTLab](https://img.shields.io/badge/AIoTLab-green?style=for-the-badge)](https://www.facebook.com/DNUAIoTLab)
[![Faculty of Information Technology](https://img.shields.io/badge/Faculty%20of%20Information%20Technology-blue?style=for-the-badge)](https://dainam.edu.vn/vi/khoa-cong-nghe-thong-tin)
[![DaiNam University](https://img.shields.io/badge/DaiNam%20University-orange?style=for-the-badge)](https://dainam.edu.vn)

</div>

## 1. Giới thiệu hệ thống

🎓 **Đề tài:** Hệ thống Quản lý Thực tập Sinh viên

Hệ thống quản lý thực tập sinh viên được xây dựng nhằm hỗ trợ toàn bộ quy trình thực tập từ đăng ký, phân công đến đánh giá và báo cáo.  
Hệ thống kết nối 4 đối tượng chính: Admin, Sinh viên, Giảng viên và Doanh nghiệp thông qua giao diện web hiện đại, đảm bảo quy trình minh bạch và hiệu quả.

### 🎯 **Mục tiêu hệ thống**
- Số hóa toàn bộ quy trình quản lý thực tập sinh viên từ đăng ký đến đánh giá.
- Hỗ trợ phân công tự động sinh viên - giảng viên - doanh nghiệp theo vị trí mong muốn.
- Quản lý báo cáo thực tập hàng tuần và cuối kỳ với hệ thống chấm điểm.
- Cung cấp dashboard và thống kê theo thời gian thực cho từng vai trò.

### 🖥️ **Chức năng Backend (Node.js + Express)**
- 🗄️ Quản lý dữ liệu sinh viên, giảng viên, doanh nghiệp, đợt thực tập.
- � RESTful API với Swagger documentation cho tất cả endpoints.
- 🔒 Xác thực JWT và phân quyền theo vai trò (Admin, SV, GV, DN).
- � Auto-assignment algorithm: phân công thông minh theo vị trí mong muốn.
- � Upload và quản lý file báo cáo thực tập với validation.
- � Import/Export Excel với header mapping thông minh.
- � Bcrypt password hashing và rate limiting bảo mật.
- 📧 Hệ thống thông báo và email notification.
- 💾 Migration scripts và database backup tự động.

### 👤 **Chức năng Frontend (React + TypeScript)**
- 🔑 Đăng nhập/đăng ký với xác thực JWT và quên mật khẩu.
- � Dashboard riêng biệt cho từng vai trò với thống kê real-time.
- 👥 Quản lý dữ liệu: CRUD đầy đủ cho sinh viên, giảng viên, doanh nghiệp.
- � Quản lý đợt thực tập và phân công thông minh.
- � Hệ thống báo cáo: upload file, chấm điểm, nhận xét.
- 🎯 Auto-assignment: phân công tự động theo vị trí và khả năng.
- � Import/Export Excel với template và validation.
- 🔍 Search, filter và pagination cho tất cả danh sách.
- 🎨 UI/UX hiện đại với TailwindCSS và Lucide icons.
- 📱 Responsive design, mobile-friendly.
- 🌟 Loading states, error handling và user feedback.

### ⚙️ **Kiến trúc hệ thống**
- 🏗️ **Backend**: Node.js + Express + MySQL với RESTful API
- 🎨 **Frontend**: React + TypeScript + Vite + TailwindCSS  
- �️ **Database**: MySQL với 11 bảng chính và quan hệ chuẩn hóa
- � **Bảo mật**: JWT authentication, bcrypt hashing, rate limiting
- 📁 **File Management**: Upload/download báo cáo với validation
- 📊 **Reports**: ExcelJS cho import/export dữ liệu
- 🎯 **Auto-Assignment**: Algorithm phân công thông minh
- 🔄 **Database**: Migration scripts và backup tự động
- � **Notifications**: Email và in-app notifications
- 🎪 **Documentation**: Swagger API docs và user guides

## 2. Công nghệ sử dụng

### 🚀 **Frontend**
- ⚛️ React 19+ với TypeScript
- ⚡ Vite (build tool)
- � TailwindCSS (styling)
- 🔗 React Router (navigation)
- 📊 Lucide React (icons)
- 📄 ExcelJS (Excel processing)

### 🖥️ **Backend**
- � Node.js + Express.js
- 🗄️ MySQL 8.0+ với connection pooling
- 🔐 JWT (JsonWebToken) authentication
- 🔒 bcrypt (password hashing)
- 📁 Multer (file upload)
- 📊 ExcelJS (import/export)
- 📝 Swagger (API documentation)

### 🛠️ **DevOps & Tools**
- 📦 NPM package management
- 🔧 ESLint + TypeScript config
- 🗂️ Migration scripts
- 📋 CORS và rate limiting

## 3. Tính năng chính

### 👥 **Phân quyền người dùng**
- **🔧 Admin**: Quản lý toàn bộ hệ thống, tạo đợt thực tập, import dữ liệu
- **🎓 Sinh viên**: Đăng ký thực tập, nộp báo cáo hàng tuần, xem kết quả
- **👨‍🏫 Giảng viên**: Quản lý sinh viên hướng dẫn, chấm điểm, đánh giá
- **🏢 Doanh nghiệp**: Xem sinh viên được phân công, đánh giá thực tập sinh

### 📊 **Dashboard theo vai trò**
- Thống kê tổng quan với biểu đồ real-time
- Hoạt động gần đây và thông báo
- Shortcut nhanh đến các chức năng chính
- Progress tracking cho từng đối tượng

### 🎯 **Auto-Assignment System**
- Phân công tự động sinh viên - giảng viên theo capacity
- Matching thông minh theo vị trí mong muốn
- Load balancing để đảm bảo công bằng
- Import doanh nghiệp với vị trí tuyển dụng

### 📝 **Quản lý báo cáo**
- Upload báo cáo hàng tuần theo lô
- Chấm điểm và nhận xét từ giảng viên
- Đánh giá chất lượng từ doanh nghiệp
- Export báo cáo Excel với thống kê

## 4. Hướng dẫn cài đặt và sử dụng

### 📋 Yêu cầu hệ thống

- 💻 Node.js 18+ 
- 🗃️ MySQL 8.0+
- 📦 NPM hoặc Yarn
- 🖥️ Hệ điều hành: Windows/Linux/macOS

### 🚀 Cài đặt và khởi động

#### 1. Clone repository
```bash
git clone https://github.com/your-username/chuyen_doi_so1.git
cd chuyen_doi_so1
```

#### 2. Cấu hình Backend
```bash
cd backend
npm install
cp .env.example .env  # Cấu hình database
npm run setup         # Khởi tạo database và seed data
npm start            # Chạy server (port 3001)
```

#### 3. Cấu hình Frontend
```bash
cd quanly-thuctap
npm install
npm run dev          # Chạy development server (port 5173)
```

### 🎯 Tài khoản demo

| **Vai trò** | **Email** | **Mật khẩu** | **Mô tả** |
|-------------|-----------|--------------|-----------|
| 👨‍💼 Admin | admin@dainam.edu.vn | admin123 | Quản trị viên hệ thống |
| 🎓 Sinh viên | sv001@dainam.edu.vn | sv123 | Tài khoản sinh viên mẫu |
| 👨‍🏫 Giảng viên | gv001@dainam.edu.vn | gv123 | Tài khoản giảng viên |
| 🏢 Doanh nghiệp | dn001@company.com | dn123 | Tài khoản doanh nghiệp |

## 📁 Cấu trúc dự án

```
chuyen_doi_so1/
├── backend/                 # Node.js API Server
│   ├── src/
│   │   ├── controllers/     # API Controllers
│   │   ├── models/         # Database Models
│   │   ├── routes/         # API Routes
│   │   ├── config/         # Database & App Config
│   │   └── utils/          # Helper Functions
│   ├── uploads/            # File Uploads
│   └── package.json
├── quanly-thuctap/         # React Frontend
│   ├── src/
│   │   ├── components/     # React Components
│   │   ├── pages/          # Page Components
│   │   ├── hooks/          # Custom Hooks
│   │   └── utils/          # Frontend Utilities
│   └── package.json
├── docs/                   # Documentation
└── scripts/                # Setup Scripts
```

## 📚 Tài liệu

- 📖 [Backend API Documentation](backend/SWAGGER_API_DOCS.md)
- 🎨 [Frontend Component Guide](quanly-thuctap/README.md)
- 🔄 [Database Schema](backend/CLEANUP_SUMMARY.md)
- 🚀 [Deployment Guide](docs/INTEGRATION_GUIDE.md)

## 🌐 Truy cập hệ thống

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Swagger Docs**: http://localhost:3001/api-docs

## 🤝 Đóng góp

1. Fork repository này
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📧 Liên hệ

- **👤 Họ tên:** Lâm Ngọc Tú
- **🏫 Lớp:** CNTT 16-01
- **✉️ Email:** lamngoctuk55@gmail.com
- **🏛️ Trường:** Đại học Đại Nam - Khoa Công nghệ Thông tin

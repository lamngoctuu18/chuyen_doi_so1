# 🎓 Hệ thống Quản lý Thực tập - Khoa CNTT Đại Nam

Hệ thống quản lý thực tập sinh viên và hợp tác doanh nghiệp được phát triển với React + Node.js + MySQL.

## 📁 Cấu trúc Dự án

```
📦 chuyendoiso1/
├── 🗂️ backend/              # Backend API & Database
│   ├── 📂 src/              # Source code
│   ├── 📂 database/         # SQL Scripts  
│   ├── 📂 migrations/       # Database Migrations
│   ├── server.js            # Main server
│   └── package.json         # Dependencies
│
├── 🗂️ quanly-thuctap/      # Frontend React App
│   ├── 📂 src/              # React source
│   ├── 📂 public/           # Static assets
│   ├── package.json         # Frontend deps
│   └── vite.config.ts       # Vite config
│
├── 🚀 start.bat             # Quick start
├── 🔧 setup.bat             # First time setup
└── 🧹 clean.bat             # Clean project
```

## 🚀 Khởi động nhanh

### Lần đầu tiên:
```bash
# 1. Setup dependencies
setup.bat

# 2. Cấu hình database trong backend\.env
# 3. Import SQL từ backend\database\

# 4. Khởi động hệ thống
start.bat
```

### Những lần sau:
```bash
start.bat
```

## 🌐 Truy cập hệ thống

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api/docs

## 👥 Phân quyền người dùng

- **Admin**: Quản lý toàn hệ thống
- **Giảng viên**: Quản lý sinh viên, chấm điểm
- **Doanh nghiệp**: Xem sinh viên được phân công
- **Sinh viên**: Nộp báo cáo, xem kết quả

## 🔧 Yêu cầu hệ thống

- Node.js 18+
- MySQL 8.0+  
- NPM hoặc Yarn
- Windows/Linux/macOS

## 📝 Tài liệu

- [📊 Cấu trúc dự án](PROJECT_STRUCTURE.md)
- [🔄 Backend API](backend/README.md)
- [🎨 Frontend Guide](quanly-thuctap/README.md)

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch
3. Commit changes
4. Push và tạo Pull Request

## 📧 Liên hệ

**Khoa CNTT - Đại học Đại Nam**
- Email: admin@dainam.edu.vn
- Website: https://dainam.edu.vn

---
*Được phát triển với ❤️ bởi Khoa CNTT*
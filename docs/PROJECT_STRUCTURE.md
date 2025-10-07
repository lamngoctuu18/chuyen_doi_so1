# CẤU TRÚC DỰ ÁN QUẢN LÝ THỰC TẬP

## 📁 Cấu trúc thư mục

```
c:\ReactJS\chuyendoiso1\
├── 📂 backend/              # Backend API & Database
│   ├── 📂 src/              # Source code
│   │   ├── 📂 controllers/  # Controllers
│   │   ├── 📂 routes/       # API Routes  
│   │   ├── 📂 models/       # Database Models
│   │   ├── 📂 middleware/   # Middleware
│   │   ├── 📂 services/     # Business Logic
│   │   └── 📂 database/     # Database config
│   ├── 📂 database/         # SQL Scripts
│   │   ├── database_updates_internship.sql
│   │   ├── database_updates.sql  
│   │   └── add_columns_sinh_vien.sql
│   ├── 📂 migrations/       # Database Migrations
│   ├── 📂 uploads/          # File uploads
│   ├── server.js            # Main server file
│   ├── package.json         # Backend dependencies
│   └── .env                 # Environment variables
│
├── 📂 quanly-thuctap/       # Frontend (React + TypeScript)
│   ├── 📂 src/              # Frontend source
│   │   ├── 📂 components/   # React Components
│   │   ├── 📂 pages/        # Pages
│   │   ├── 📂 hooks/        # Custom Hooks
│   │   ├── 📂 utils/        # Utilities
│   │   └── 📂 api/          # API Calls
│   ├── 📂 public/           # Static assets
│   ├── package.json         # Frontend dependencies
│   ├── vite.config.ts       # Vite config
│   └── tailwind.config.js   # Tailwind config
│
└── start.bat                # Quick start script
```

## 🚀 Cách chạy dự án

### Backend:
```bash
cd backend
npm install
npm start
# Server: http://localhost:3001
```

### Frontend:
```bash
cd quanly-thuctap  
npm install
npm run dev
# Client: http://localhost:5173
```

### Hoặc sử dụng script:
```bash
start.bat
```

## 🗄️ Database

- **Host**: localhost:3306
- **Database**: quanly_thuctap
- **Scripts**: Trong thư mục `backend/database/`
- **Migrations**: Trong thư mục `backend/migrations/`

## 📝 Lưu ý

- Backend port: 3001
- Frontend port: 5173
- Database: MySQL
- Cấu hình trong file `.env`
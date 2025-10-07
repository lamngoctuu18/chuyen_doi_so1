@echo off
chcp 65001 >nul
echo ========================================
echo    HE THONG QUAN LY THUC TAP
echo    Khoa CNTT - Dai hoc Dai Nam
echo ========================================
echo.

echo [1/3] Kiem tra cau hinh...
if not exist backend\.env (
    echo ❌ Khong tim thay file .env trong backend!
    echo    Vui long copy tu .env.example
    pause
    exit /b 1
)

echo [2/3] Khoi dong Backend API...
echo 🚀 Starting Backend on http://localhost:3001
cd backend
start "Backend Server" cmd /k "echo Backend đang chạy... & node server.js"
cd ..

timeout /t 3 /nobreak >nul

echo [3/3] Khoi dong Frontend...  
echo 🎨 Starting Frontend on http://localhost:5173
cd quanly-thuctap
start "Frontend Dev" cmd /k "echo Frontend đang chạy... & npm run dev"
cd ..

echo.
echo ✅ He thong da khoi dong thanh cong!
echo 📡 Backend API: http://localhost:3001
echo 🎨 Frontend:    http://localhost:5173
echo.
echo Nhan phim bat ky de dong cua so nay...
pause >nul
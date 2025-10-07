@echo off
chcp 65001 >nul
echo ========================================
echo    SETUP DU AN QUAN LY THUC TAP
echo    Khoa CNTT - Dai hoc Dai Nam  
echo ========================================
echo.

echo [1/5] Cai dat dependencies cho Backend...
cd backend
if not exist node_modules (
    echo 📦 Installing backend packages...
    npm install
) else (
    echo ✅ Backend packages already installed
)
cd ..

echo.
echo [2/5] Cai dat dependencies cho Frontend...
cd quanly-thuctap
if not exist node_modules (
    echo 📦 Installing frontend packages...
    npm install
) else (
    echo ✅ Frontend packages already installed
)
cd ..

echo.
echo [3/5] Kiem tra file cau hinh...
if not exist backend\.env (
    echo 📋 Creating .env file from example...
    copy backend\.env.example backend\.env
    echo ⚠️  Vui long cap nhat thong tin database trong file backend\.env
) else (
    echo ✅ .env file exists
)

echo.
echo [4/5] Kiem tra database...
echo 💾 Vui long dam bao MySQL dang chay va database 'quanly_thuctap' da duoc tao
echo    SQL scripts trong: backend\database\

echo.
echo [5/5] Hoan thanh setup!
echo ========================================
echo    SETUP HOAN TAT!
echo ========================================
echo.
echo 📝 Buoc tiep theo:
echo    1. Cap nhat thong tin database trong backend\.env
echo    2. Chay SQL scripts trong backend\database\
echo    3. Chay start.bat de khoi dong he thong
echo.
echo 🚀 De khoi dong ngay: start.bat
echo.
pause
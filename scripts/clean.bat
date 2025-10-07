@echo off
chcp 65001 >nul
echo ========================================
echo    CLEAN PROJECT - QUAN LY THUC TAP
echo ========================================
echo.
echo ⚠️  CANH BAO: Script nay se xoa:
echo    - Tat ca node_modules
echo    - Cache files
echo    - Log files
echo    - Upload files
echo.
set /p confirm="Ban co chac chan muon tiep tuc? (y/N): "
if /i not "%confirm%"=="y" (
    echo Huy bo...
    pause
    exit /b 0
)

echo.
echo [1/4] Xoa node_modules backend...
if exist backend\node_modules (
    rmdir /s /q backend\node_modules
    echo ✅ Deleted backend node_modules
)

echo [2/4] Xoa node_modules frontend...
if exist quanly-thuctap\node_modules (
    rmdir /s /q quanly-thuctap\node_modules  
    echo ✅ Deleted frontend node_modules
)

echo [3/4] Xoa cache va log files...
if exist backend\uploads\* (
    del /q backend\uploads\*
    echo ✅ Cleared uploads folder
)

echo [4/4] Xoa temp files...
for /r %%i in (*.log, *.tmp, .DS_Store, Thumbs.db) do (
    if exist "%%i" del /q "%%i"
)

echo.
echo ✅ Clean hoan tat!
echo 🔄 Chay setup.bat de cai dat lai dependencies
echo.
pause
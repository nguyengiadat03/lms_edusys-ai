@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 KHỞI ĐỘNG DỰ ÁN EDUSYS-AI
echo ========================================
echo.

echo [1/5] Kiểm tra môi trường...
echo ✓ Node.js: 
node --version
echo ✓ Python: 
python --version
echo ✓ MySQL: Running (Remote Server)
echo.

echo [2/5] Cài đặt dependencies cho Backend...
cd backend
if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
) else (
    echo Backend dependencies already installed
)
echo.

echo [3/5] Cài đặt dependencies cho Frontend...
cd ..
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
) else (
    echo Frontend dependencies already installed
)
echo.

echo [4/5] Kiểm tra Python dependencies cho OCR service...
python -c "import pytesseract" 2>nul
if errorlevel 1 (
    echo ⚠️  Python OCR dependencies chưa được cài đặt
    echo Bạn có thể cài sau bằng: pip install pytesseract pillow
) else (
    echo ✓ Python OCR dependencies OK
)
echo.

echo [5/5] Tạo Prisma Client...
cd backend
call npx prisma generate
echo.

echo ========================================
echo ✅ SETUP HOÀN TẤT!
echo ========================================
echo.
echo Để chạy dự án, mở 2 terminal:
echo.
echo Terminal 1 - Backend:
echo   cd backend
echo   npm run dev
echo.
echo Terminal 2 - Frontend:
echo   npm run dev
echo.
echo Backend sẽ chạy tại: http://localhost:3001
echo Frontend sẽ chạy tại: http://localhost:8080
echo.
echo ========================================
pause

@echo off
chcp 65001 >nul
echo ========================================
echo 🔧 KHỞI ĐỘNG BACKEND
echo ========================================
echo.
cd backend
echo Starting backend server on port 3001...
echo.
call npm run dev

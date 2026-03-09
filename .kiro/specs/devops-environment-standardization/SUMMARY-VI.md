# Tóm Tắt: Chuẩn Hóa Môi Trường DevOps

## Vấn Đề Phát Hiện

### 🔴 Nghiêm Trọng (CRITICAL)

1. **Thông tin đăng nhập database bị lộ trong repository**
   - File: `backend/.env`, `backend/.env.example`
   - Vấn đề: Mật khẩu database thật đang được commit vào Git
   - Rủi ro: Database có thể bị tấn công nếu repository bị lộ

2. **JWT Secret yếu**
   - Không có secret mặc định an toàn
   - Cần tạo secret ngẫu nhiên mạnh cho production

### 🟠 Cao (HIGH)

3. **8 địa chỉ CORS được hardcode trong code**
   - File: `backend/src/server.ts` (dòng 66-75)
   - Vấn đề: Phải sửa code mỗi khi thay đổi môi trường
   - Giải pháp: Chuyển sang biến môi trường

4. **Đường dẫn FFmpeg được hardcode**
   - File: `backend/ocr_service.py` (dòng 186)
   - Vấn đề: `E:\edusys-ai3\backend\ffmpeg\...` chỉ chạy trên máy cụ thể
   - Giải pháp: Dùng biến môi trường `FFMPEG_PATH`

### 🟡 Trung Bình (MEDIUM)

5. **Timezone được hardcode**
   - File: `backend/src/config/database.ts` (dòng 30, 42)
   - Vấn đề: `+07:00` chỉ phù hợp với Việt Nam
   - Giải pháp: Dùng biến `DB_TIMEZONE`

### 🟢 Thấp (LOW)

6. **Port được hardcode** (đã có fallback nhưng cần document)
   - Frontend: 8080
   - Backend: 3001
   - OCR: 8000

## Giải Pháp Đề Xuất

### 1. Tạo File Cấu Hình Chuẩn

#### `.env` (Frontend)

```bash
VITE_API_URL=http://localhost:3001
```

#### `backend/.env` (Backend)

```bash
# Server
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:8080
CORS_ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173

# Database
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=edusys_ai_local
DB_USERNAME=root
DB_PASSWORD=your_password_here
DB_TIMEZONE=+07:00

# Security
JWT_SECRET=your_strong_secret_here
JWT_EXPIRES_IN=24h

# Services
OCR_SERVICE_URL=http://localhost:8000
GEMINI_API_KEY=your_api_key_here
```

#### `backend/.env.ocr` (OCR Service)

```bash
OCR_PORT=8000
OCR_HOST=localhost
GEMINI_API_KEY=your_api_key_here
FFMPEG_PATH=./ffmpeg/bin
WHISPER_ENABLED=true
```

### 2. Script Khởi Động Thống Nhất

#### Windows: `start-dev.bat`

```batch
@echo off
echo 🚀 Khởi động EduSys AI...

REM Kiểm tra Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Chưa cài Node.js
    exit /b 1
)

REM Cài đặt dependencies
npm install --silent
cd backend && npm install --silent && cd ..

REM Khởi động services
start "Frontend" cmd /c "npm run dev"
start "Backend" cmd /c "cd backend && npm run dev"
start "OCR" cmd /c "cd backend && python ocr_service.py"

echo ✅ Đã khởi động tất cả services!
echo Frontend:  http://localhost:8080
echo Backend:   http://localhost:3001
echo OCR:       http://localhost:8000
pause
```

#### Linux/Mac: `start-dev.sh`

```bash
#!/bin/bash
echo "🚀 Khởi động EduSys AI..."

# Kiểm tra Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Chưa cài Node.js"
    exit 1
fi

# Cài đặt dependencies
npm install --silent
cd backend && npm install --silent && cd ..

# Khởi động services
npm run dev &
cd backend && npm run dev &
python ocr_service.py &

echo "✅ Đã khởi động tất cả services!"
echo "Frontend:  http://localhost:8080"
echo "Backend:   http://localhost:3001"
echo "OCR:       http://localhost:8000"
wait
```

### 3. Thay Đổi Code

#### A. CORS Configuration (backend/src/server.ts)

**Trước:**

```typescript
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
  // ... 6 địa chỉ khác hardcode
];
```

**Sau:**

```typescript
const allowedOrigins = getAllowedOrigins();

// Tự động thêm dev origins nếu không phải production
if (!isProduction) {
  const devOrigins = ["http://localhost:5173", "http://localhost:8080"];
  devOrigins.forEach((origin) => {
    if (!allowedOrigins.includes(origin)) {
      allowedOrigins.push(origin);
    }
  });
}
```

#### B. Database Timezone (backend/src/config/database.ts)

**Trước:**

```typescript
timezone: '+07:00',
```

**Sau:**

```typescript
timezone: process.env.DB_TIMEZONE || '+00:00',
```

#### C. FFmpeg Path (backend/ocr_service.py)

**Trước:**

```python
ffmpeg_path = r"E:\edusys-ai3\backend\ffmpeg\ffmpeg-8.0-essentials_build\bin"
```

**Sau:**

```python
ffmpeg_path = os.getenv('FFMPEG_PATH', './ffmpeg/bin')
if not os.path.isabs(ffmpeg_path):
    ffmpeg_path = os.path.abspath(ffmpeg_path)

if os.path.exists(ffmpeg_path):
    path_separator = ';' if os.name == 'nt' else ':'
    os.environ['PATH'] = ffmpeg_path + path_separator + os.environ.get('PATH', '')
```

## Kế Hoạch Thực Hiện

### Phase 1: Sửa Lỗi Bảo Mật (2 giờ) - ƯU TIÊN CAO

1. Tạo file `.env.example` với placeholder
2. Xóa credentials thật khỏi repository
3. Cập nhật documentation về bảo mật

### Phase 2: Externalize Configuration (4 giờ)

1. Sửa CORS configuration
2. Sửa timezone configuration
3. Sửa FFmpeg path configuration
4. Test tất cả thay đổi

### Phase 3: Tạo Startup Scripts (3 giờ)

1. Tạo `start-dev.bat` (Windows)
2. Tạo `start-dev.sh` (Linux/Mac)
3. Thêm dependency checking
4. Test trên nhiều platform

### Phase 4: Cập Nhật Documentation (2 giờ)

1. Cập nhật `SETUP-GUIDE.md`
2. Cập nhật `README.md`
3. Tạo `CONFIGURATION.md`
4. Thêm troubleshooting guide

### Phase 5: Validation (1 giờ)

1. Test fresh clone
2. Đo thời gian setup
3. Test cross-platform
4. Security audit

**Tổng thời gian ước tính: 12 giờ**

## Lợi Ích

### Bảo Mật

- ✅ Không còn credentials trong code
- ✅ JWT secret mạnh bắt buộc trong production
- ✅ Dễ dàng rotate secrets

### Linh Hoạt

- ✅ Dễ dàng chuyển đổi môi trường (dev/staging/prod)
- ✅ Không cần sửa code khi thay đổi config
- ✅ Hỗ trợ nhiều platform (Windows/Linux/Mac)

### Trải Nghiệm Developer

- ✅ Setup mới < 15 phút
- ✅ Một lệnh khởi động tất cả services
- ✅ Documentation rõ ràng
- ✅ Troubleshooting dễ dàng

## Tiếp Theo

Sau khi hoàn thành spec này, bạn có thể:

1. **Review design document** - Kiểm tra xem giải pháp có phù hợp không
2. **Approve và implement** - Bắt đầu thực hiện các thay đổi
3. **Request changes** - Yêu cầu điều chỉnh nếu cần

Bạn muốn tôi tiếp tục với implementation không?

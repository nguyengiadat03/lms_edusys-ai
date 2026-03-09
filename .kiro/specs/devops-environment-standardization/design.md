# DevOps Environment Standardization - Design Document

## Executive Summary

This design addresses critical configuration and security issues in the EduSys AI project by externalizing all hardcoded values, securing credentials, and creating a unified development environment setup.

## Current State Analysis

### Critical Issues Identified

#### 1. Security Vulnerabilities (CRITICAL)

**Location:** `backend/.env`, `backend/.env.example`

```
DB_HOST=45.32.100.86
DB_USERNAME=edu
DB_PASSWORD=EduStrongPass!2025
```

- **Issue:** Actual production credentials committed to repository
- **Risk:** Database compromise if repository is exposed
- **Impact:** HIGH - immediate security risk

#### 2. Hardcoded CORS Origins (HIGH)

**Location:** `backend/src/server.ts:66-75`

```typescript
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000",
  "http://localhost:8081",
  "http://localhost:8082",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:8082",
  ...getAllowedOrigins(),
];
```

- **Issue:** 8 hardcoded localhost variations in source code
- **Impact:** MEDIUM - requires code changes for different environments

#### 3. Hardcoded Timezone (MEDIUM)

**Location:** `backend/src/config/database.ts:30,42`

```typescript
timezone: '+07:00', // Asia/Ho_Chi_Minh
```

- **Issue:** Timezone hardcoded to Vietnam timezone
- **Impact:** MEDIUM - breaks for international deployments

#### 4. Hardcoded FFmpeg Path (HIGH)

**Location:** `backend/ocr_service.py:186`

```python
ffmpeg_path = r"E:\edusys-ai3\backend\ffmpeg\ffmpeg-8.0-essentials_build\bin"
```

- **Issue:** Absolute Windows path hardcoded
- **Impact:** HIGH - OCR service fails on other machines/platforms

#### 5. Hardcoded Ports (LOW)

**Locations:**

- Frontend: `vite.config.ts:8` → port 8080
- Backend: `backend/src/server.ts:44` → port 3001
- OCR: `backend/ocr_service.py:1547` → port 8000
- **Issue:** Port conflicts possible, not configurable
- **Impact:** LOW - but reduces flexibility

#### 6. Weak JWT Secret Handling (CRITICAL)

**Location:** `backend/src/middleware/auth.ts:48`

```typescript
const secret = process.env.JWT_SECRET;
if (!secret) {
  throw createError(
    "Server misconfiguration: JWT secret not set",
    "SERVER_CONFIG_ERROR",
    500,
  );
}
```

- **Issue:** No default in production, but validation only at runtime
- **Impact:** HIGH - authentication security risk

### Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     EduSys AI System                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Frontend   │  │   Backend    │  │  OCR Service │    │
│  │              │  │              │  │              │    │
│  │  React+Vite  │  │  Express+TS  │  │  FastAPI+Py  │    │
│  │  Port: 8080  │  │  Port: 3001  │  │  Port: 8000  │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                  │             │
│         │                 │                  │             │
│         └────────┬────────┴──────────────────┘             │
│                  │                                         │
│         ┌────────▼────────┐                               │
│         │  MySQL Database │                               │
│         │  Port: 3306     │                               │
│         └─────────────────┘                               │
│                                                             │
│  Optional Services:                                        │
│  ┌──────────────┐  ┌──────────────┐                      │
│  │    Redis     │  │   FFmpeg     │                      │
│  │  (Bull Queue)│  │  (Whisper)   │                      │
│  └──────────────┘  └──────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

## Proposed Solution

### 1. Environment Variable Standardization

#### Frontend Environment Variables (.env)

```bash
# API Configuration
VITE_API_URL=http://localhost:3001

# Optional: Frontend-specific settings
VITE_APP_NAME=EduSys AI
VITE_APP_VERSION=1.0.0
```

#### Backend Environment Variables (backend/.env)

```bash
# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:8080

# CORS Configuration (comma-separated)
CORS_ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173,http://127.0.0.1:8080

# Database Configuration
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=edusys_ai_local
DB_USERNAME=root
DB_PASSWORD=
DB_CONNECTION_LIMIT=10
DB_TIMEZONE=+07:00

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# OCR Service Configuration
OCR_SERVICE_URL=http://localhost:8000
OCR_SERVICE_ENABLED=true

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here

# Redis Configuration (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email Configuration (optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=

# Development Flags
SKIP_DB_TEST=false
SKIP_AUTH=false

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

#### OCR Service Environment Variables (backend/.env.ocr)

```bash
# OCR Service Configuration
OCR_PORT=8000
OCR_HOST=localhost

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key-here

# FFmpeg Configuration (for Whisper audio processing)
FFMPEG_PATH=./ffmpeg/bin
FFMPEG_ENABLED=true

# Model Configuration
EASYOCR_ENABLED=true
WHISPER_ENABLED=true
WHISPER_MODEL=base

# Memory Management
MAX_MEMORY_PERCENT=85
ENABLE_AGGRESSIVE_GC=true

# CORS Configuration
CORS_ORIGINS=*
```

### 2. Code Changes Required

#### A. Backend CORS Configuration (backend/src/server.ts)

**Current (lines 66-75):**

```typescript
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
  // ... 6 more hardcoded origins
  ...getAllowedOrigins(),
];
```

**Proposed:**

```typescript
const allowedOrigins = getAllowedOrigins();

// Add common development origins if not in production
if (!isProduction) {
  const devOrigins = [
    "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:3000",
    "http://127.0.0.1:8080",
  ];
  devOrigins.forEach((origin) => {
    if (!allowedOrigins.includes(origin)) {
      allowedOrigins.push(origin);
    }
  });
}
```

#### B. Database Timezone Configuration (backend/src/config/database.ts)

**Current (line 30):**

```typescript
timezone: '+07:00',
```

**Proposed:**

```typescript
timezone: process.env.DB_TIMEZONE || '+00:00',
```

#### C. Port Configuration (backend/src/server.ts)

**Current (line 44):**

```typescript
const PORT = process.env.PORT || 3001;
```

**Keep as is** - already configurable, just document it.

#### D. OCR Service Configuration (backend/ocr_service.py)

**Current (lines 186-190):**

```python
ffmpeg_path = r"E:\edusys-ai3\backend\ffmpeg\ffmpeg-8.0-essentials_build\bin"
current_path = os.environ.get('PATH', '')
if ffmpeg_path not in current_path:
    os.environ['PATH'] = ffmpeg_path + ';' + current_path
```

**Proposed:**

```python
# Get FFmpeg path from environment or use default
ffmpeg_path = os.getenv('FFMPEG_PATH', './ffmpeg/bin')
ffmpeg_enabled = os.getenv('FFMPEG_ENABLED', 'true').lower() == 'true'

if ffmpeg_enabled and ffmpeg_path:
    # Convert to absolute path if relative
    if not os.path.isabs(ffmpeg_path):
        ffmpeg_path = os.path.abspath(ffmpeg_path)

    # Add to PATH if exists
    if os.path.exists(ffmpeg_path):
        current_path = os.environ.get('PATH', '')
        path_separator = ';' if os.name == 'nt' else ':'
        if ffmpeg_path not in current_path:
            os.environ['PATH'] = ffmpeg_path + path_separator + current_path
            logger.info(f"Added FFmpeg to PATH: {ffmpeg_path}")
    else:
        logger.warning(f"FFmpeg path not found: {ffmpeg_path}")
```

**Current (line 1547):**

```python
uvicorn.run(app, host="localhost", port=8000)
```

**Proposed:**

```python
port = int(os.getenv('OCR_PORT', '8000'))
host = os.getenv('OCR_HOST', 'localhost')
uvicorn.run(app, host=host, port=port)
```

#### E. Frontend API URL (already configurable via VITE_API_URL)

**No changes needed** - already using environment variable.

### 3. Startup Scripts

#### A. Unified Startup Script (start-dev.sh - Linux/Mac)

```bash
#!/bin/bash

echo "🚀 Starting EduSys AI Development Environment"
echo "=============================================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check Python (optional for OCR)
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo "⚠️  Python not found. OCR service will not be available."
    OCR_AVAILABLE=false
else
    OCR_AVAILABLE=true
fi

# Check environment files
if [ ! -f ".env" ]; then
    echo "⚠️  Frontend .env not found. Creating from example..."
    cp .env.example .env 2>/dev/null || echo "VITE_API_URL=http://localhost:3001" > .env
fi

if [ ! -f "backend/.env" ]; then
    echo "❌ Backend .env not found. Please copy backend/.env.example and configure it."
    exit 1
fi

# Start services
echo ""
echo "📦 Installing dependencies..."
npm install --silent
cd backend && npm install --silent && cd ..

echo ""
echo "🎨 Starting Frontend (port 8080)..."
npm run dev &
FRONTEND_PID=$!

echo "🔧 Starting Backend (port 3001)..."
cd backend && npm run dev &
BACKEND_PID=$!
cd ..

if [ "$OCR_AVAILABLE" = true ] && [ -f "backend/ocr_service.py" ]; then
    echo "🤖 Starting OCR Service (port 8000)..."
    cd backend
    if [ -f "requirements-ocr.txt" ]; then
        pip install -q -r requirements-ocr.txt 2>/dev/null || true
    fi
    python ocr_service.py &
    OCR_PID=$!
    cd ..
fi

echo ""
echo "✅ All services started!"
echo "=============================================="
echo "Frontend:  http://localhost:8080"
echo "Backend:   http://localhost:3001"
echo "API Docs:  http://localhost:3001/api/v1/"
if [ "$OCR_AVAILABLE" = true ]; then
    echo "OCR:       http://localhost:8000"
fi
echo ""
echo "Press Ctrl+C to stop all services"

# Trap Ctrl+C and cleanup
trap "echo ''; echo '🛑 Stopping services...'; kill $FRONTEND_PID $BACKEND_PID $OCR_PID 2>/dev/null; exit 0" INT

# Wait for all processes
wait
```

#### B. Unified Startup Script (start-dev.bat - Windows)

```batch
@echo off
echo 🚀 Starting EduSys AI Development Environment
echo ==============================================

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found. Please install Node.js 18+
    exit /b 1
)

REM Check Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Python not found. OCR service will not be available.
    set OCR_AVAILABLE=false
) else (
    set OCR_AVAILABLE=true
)

REM Check environment files
if not exist ".env" (
    echo ⚠️  Frontend .env not found. Creating from example...
    if exist ".env.example" (
        copy .env.example .env >nul
    ) else (
        echo VITE_API_URL=http://localhost:3001 > .env
    )
)

if not exist "backend\.env" (
    echo ❌ Backend .env not found. Please copy backend\.env.example and configure it.
    exit /b 1
)

echo.
echo 📦 Installing dependencies...
call npm install --silent
cd backend
call npm install --silent
cd ..

echo.
echo 🎨 Starting Frontend (port 8080)...
start "Frontend" cmd /c "npm run dev"

echo 🔧 Starting Backend (port 3001)...
start "Backend" cmd /c "cd backend && npm run dev"

if "%OCR_AVAILABLE%"=="true" (
    if exist "backend\ocr_service.py" (
        echo 🤖 Starting OCR Service (port 8000)...
        if exist "backend\requirements-ocr.txt" (
            pip install -q -r backend\requirements-ocr.txt >nul 2>nul
        )
        start "OCR Service" cmd /c "cd backend && python ocr_service.py"
    )
)

echo.
echo ✅ All services started!
echo ==============================================
echo Frontend:  http://localhost:8080
echo Backend:   http://localhost:3001
echo API Docs:  http://localhost:3001/api/v1/
if "%OCR_AVAILABLE%"=="true" (
    echo OCR:       http://localhost:8000
)
echo.
echo Close the terminal windows to stop services
pause
```

### 4. Updated .env.example Files

#### Root .env.example

```bash
# Frontend Configuration
VITE_API_URL=http://localhost:3001
```

#### backend/.env.example

```bash
# =============================================================================
# EduSys AI Backend Configuration
# =============================================================================
# IMPORTANT: Copy this file to .env and fill in your actual values
# NEVER commit .env file with real credentials to version control
# =============================================================================

# Environment
NODE_ENV=development

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:8080

# CORS Configuration (comma-separated origins)
CORS_ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173

# Database Configuration
# For local development, use localhost
# For remote database, use actual host IP
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=edusys_ai_local
DB_USERNAME=root
DB_PASSWORD=your_database_password_here
DB_CONNECTION_LIMIT=10
DB_TIMEZONE=+07:00

# Authentication
# CRITICAL: Generate a strong random secret for production
# Example: openssl rand -base64 32
JWT_SECRET=CHANGE_THIS_TO_A_STRONG_RANDOM_SECRET
JWT_EXPIRES_IN=24h

# OCR Service Configuration
OCR_SERVICE_URL=http://localhost:8000
OCR_SERVICE_ENABLED=true

# Gemini AI Configuration
# Get your API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Redis Configuration (optional - for background jobs)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email Configuration (optional - for notifications)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@edusys.ai

# Development Flags (set to false in production)
SKIP_DB_TEST=false
SKIP_AUTH=false

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# =============================================================================
# Security Notes:
# - Never use default passwords in production
# - Generate strong JWT_SECRET: openssl rand -base64 32
# - Use environment-specific .env files
# - Keep .env file out of version control
# =============================================================================
```

#### backend/.env.ocr.example

```bash
# =============================================================================
# OCR Service Configuration
# =============================================================================

# Server Configuration
OCR_PORT=8000
OCR_HOST=localhost

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# FFmpeg Configuration (for Whisper audio processing)
# Relative path from backend directory or absolute path
# Windows example: ./ffmpeg/bin or C:/ffmpeg/bin
# Linux/Mac example: ./ffmpeg/bin or /usr/local/bin
FFMPEG_PATH=./ffmpeg/bin
FFMPEG_ENABLED=true

# Model Configuration
EASYOCR_ENABLED=true
WHISPER_ENABLED=true
WHISPER_MODEL=base

# Memory Management
MAX_MEMORY_PERCENT=85
ENABLE_AGGRESSIVE_GC=true

# CORS Configuration
# Use * for development, specific origins for production
CORS_ORIGINS=*
```

### 5. Documentation Updates

#### Update SETUP-GUIDE.md

Add new sections:

1. **Environment Configuration** - detailed explanation of all variables
2. **Quick Start** - using the new startup scripts
3. **Service-by-Service Setup** - for advanced users
4. **Troubleshooting** - common configuration issues
5. **Security Best Practices** - credential management

## Implementation Plan

### Phase 1: Security Fixes (CRITICAL - 2 hours)

1. ✅ Create proper `.env.example` files with placeholders
2. ✅ Remove actual credentials from all committed files
3. ✅ Add `.env` to `.gitignore` (verify)
4. ✅ Update documentation with security warnings

### Phase 2: Configuration Externalization (4 hours)

1. ✅ Update `backend/src/server.ts` - CORS configuration
2. ✅ Update `backend/src/config/database.ts` - timezone
3. ✅ Update `backend/ocr_service.py` - FFmpeg path and ports
4. ✅ Add environment validation to startup
5. ✅ Test all configuration changes

### Phase 3: Startup Scripts (3 hours)

1. ✅ Create `start-dev.sh` (Linux/Mac)
2. ✅ Create `start-dev.bat` (Windows)
3. ✅ Add dependency checking
4. ✅ Add service health checks
5. ✅ Test on multiple platforms

### Phase 4: Documentation (2 hours)

1. ✅ Update `SETUP-GUIDE.md`
2. ✅ Update `README.md`
3. ✅ Create `CONFIGURATION.md` reference
4. ✅ Add troubleshooting guide

### Phase 5: Validation (1 hour)

1. ✅ Fresh clone test
2. ✅ Setup time measurement
3. ✅ Cross-platform testing
4. ✅ Security audit

**Total Estimated Time: 12 hours**

## Risk Assessment

### High Risk

- **Database credential exposure**: Mitigated by immediate removal from repository
- **Breaking existing deployments**: Mitigated by backward compatibility in code

### Medium Risk

- **Developer confusion**: Mitigated by clear documentation and examples
- **Platform-specific issues**: Mitigated by cross-platform testing

### Low Risk

- **Performance impact**: Configuration loading is minimal
- **Maintenance overhead**: Reduced by standardization

## Success Criteria

1. ✅ Zero credentials in source code or `.env.example` files
2. ✅ All services start with single command
3. ✅ Setup time < 15 minutes for new developer
4. ✅ All configuration externalized to environment variables
5. ✅ Cross-platform compatibility (Windows/Linux/Mac)
6. ✅ Clear documentation with examples

## Future Enhancements

1. **Docker Compose** - containerized development environment
2. **Environment Templates** - pre-configured for common scenarios
3. **Configuration Validation** - startup checks with helpful error messages
4. **Secret Management** - integration with vault services
5. **Auto-configuration** - interactive setup wizard

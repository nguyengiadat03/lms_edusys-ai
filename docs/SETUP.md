# Complete Setup Guide

This guide will walk you through setting up the EduSys AI platform from scratch.

## Prerequisites Installation

### 1. Install Node.js 18+

**Windows:**

```bash
# Download from https://nodejs.org/
# Or use Chocolatey
choco install nodejs-lts
```

**macOS:**

```bash
brew install node@18
```

**Linux:**

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Verify installation:**

```bash
node --version  # Should be v18.x.x or higher
npm --version   # Should be 9.x.x or higher
```

### 2. Install MySQL 8.0+

**Windows:**

```bash
# Download from https://dev.mysql.com/downloads/mysql/
# Or use Chocolatey
choco install mysql
```

**macOS:**

```bash
brew install mysql@8.0
brew services start mysql@8.0
```

**Linux:**

```bash
sudo apt-get update
sudo apt-get install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

**Verify installation:**

```bash
mysql --version  # Should be 8.0.x or higher
```

**Secure MySQL installation:**

```bash
sudo mysql_secure_installation
```

### 3. Install Python 3.8+ (Optional - for OCR service)

**Windows:**

```bash
# Download from https://www.python.org/downloads/
# Or use Chocolatey
choco install python
```

**macOS:**

```bash
brew install python@3.11
```

**Linux:**

```bash
sudo apt-get install python3 python3-pip
```

**Verify installation:**

```bash
python --version  # Should be 3.8.x or higher
pip --version
```

## Project Setup

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd edusys-ai
```

### Step 2: Database Setup

#### Create Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE edusys_ai_2025_v1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create user (optional, for security)
CREATE USER 'edusys'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON edusys_ai_2025_v1.* TO 'edusys'@'localhost';
FLUSH PRIVILEGES;

# Exit MySQL
EXIT;
```

#### Verify Database

```bash
mysql -u root -p -e "SHOW DATABASES LIKE 'edusys%';"
```

### Step 3: Backend Setup

#### Install Dependencies

```bash
cd backend
npm install
```

#### Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
# Windows: notepad .env
# macOS/Linux: nano .env
```

**Required environment variables:**

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
DB_DATABASE=edusys_ai_2025_v1

# Database URL for Prisma
DATABASE_URL="mysql://root:your_mysql_password@localhost:3306/edusys_ai_2025_v1"

# JWT Secrets (generate strong secrets!)
JWT_SECRET=your_generated_secret_here
JWT_REFRESH_SECRET=your_generated_refresh_secret_here

# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:8080
```

**Generate strong JWT secrets:**

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 64
```

#### Setup Database Schema

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (creates tables)
npx prisma migrate deploy

# Or push schema directly (for development)
npx prisma db push
```

#### Verify Backend Setup

```bash
# Start backend
npm run dev

# In another terminal, test health endpoint
curl http://localhost:3001/health
```

**Expected response:**

```json
{
  "status": "healthy",
  "timestamp": "2026-03-09T...",
  "version": "1.0.0",
  "environment": "development"
}
```

### Step 4: Frontend Setup

#### Install Dependencies

```bash
# From project root
cd ..
npm install
```

#### Configure Environment

```bash
# Create .env file
echo "VITE_API_URL=http://localhost:3001" > .env
```

#### Start Frontend

```bash
npm run dev
```

**Expected output:**

```
VITE v6.3.4  ready in 1234 ms

➜  Local:   http://localhost:8080/
➜  Network: use --host to expose
```

### Step 5: Verify Installation

#### Test Backend

```bash
# Health check
curl http://localhost:3001/health

# Test login (with test user)
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

#### Test Frontend

1. Open browser: http://localhost:8080
2. You should see the login page
3. Try logging in with test credentials:
   - Email: `test@example.com`
   - Password: `password123`

## Optional Services

### Redis Setup (for background jobs)

**Windows:**

```bash
# Download from https://github.com/microsoftarchive/redis/releases
# Or use WSL and install Linux version
```

**macOS:**

```bash
brew install redis
brew services start redis
```

**Linux:**

```bash
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**Add to backend .env:**

```bash
REDIS_URL=redis://localhost:6379
```

### OCR Service Setup (Python)

#### Install Python Dependencies

```bash
cd backend
pip install -r requirements-ocr.txt
```

#### Configure OCR Service

```bash
# Create .env file for OCR service
cat > .env.ocr << EOF
OCR_PORT=8000
OCR_HOST=localhost
GEMINI_API_KEY=your_gemini_api_key_here
FFMPEG_PATH=./ffmpeg/bin
WHISPER_ENABLED=false
EOF
```

#### Start OCR Service

```bash
python ocr_service.py
```

**Expected output:**

```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://localhost:8000
```

#### Test OCR Service

```bash
curl http://localhost:8000/health
```

## Seed Test Data (Optional)

```bash
cd backend

# Create test user
node scripts/seed/create-test-user.js

# Seed sample curriculum data
node scripts/seed/seed-sample-data.js
```

## Troubleshooting Setup

### MySQL Connection Failed

**Error:** `ER_ACCESS_DENIED_ERROR` or `ECONNREFUSED`

**Solutions:**

```bash
# Check MySQL is running
# Windows
sc query MySQL80

# macOS
brew services list | grep mysql

# Linux
sudo systemctl status mysql

# Test connection
mysql -u root -p -e "SELECT 1;"

# Check credentials in .env match MySQL user
```

### Prisma Generate Failed

**Error:** `Prisma schema not found` or `Cannot find module '@prisma/client'`

**Solutions:**

```bash
cd backend

# Ensure schema exists
ls prisma/schema.prisma

# Regenerate client
npx prisma generate

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3001`

**Solutions:**

```bash
# Windows - Find and kill process
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux - Find and kill process
lsof -ti:3001 | xargs kill -9

# Or change port in backend/.env
PORT=3002
```

### Frontend Can't Connect to Backend

**Error:** Network errors or CORS errors in browser console

**Solutions:**

```bash
# 1. Verify backend is running
curl http://localhost:3001/health

# 2. Check frontend .env
cat .env
# Should have: VITE_API_URL=http://localhost:3001

# 3. Restart frontend after changing .env
npm run dev

# 4. Check browser console for specific error
```

### TypeScript Compilation Errors

**Error:** `Cannot find module` or type errors

**Solutions:**

```bash
cd backend

# Regenerate Prisma client
npx prisma generate

# Clear TypeScript cache
rm -rf dist/
rm -rf node_modules/.cache/

# Rebuild
npm run build
```

## Next Steps

After successful setup:

1. **Read [Architecture Guide](./ARCHITECTURE.md)** - Understand the system
2. **Review [API Documentation](./API.md)** - Learn the endpoints
3. **Check [Development Guide](./DEVELOPMENT.md)** - Start developing
4. **Explore [Database Schema](./DATABASE.md)** - Understand data models

## Getting Help

If you encounter issues not covered here:

1. Check [Troubleshooting Guide](./TROUBLESHOOTING.md)
2. Search existing GitHub issues
3. Ask in team chat
4. Create a new GitHub issue with:
   - Your operating system
   - Node.js version (`node --version`)
   - MySQL version (`mysql --version`)
   - Complete error message
   - Steps to reproduce

---

**Setup Time:** ~30-45 minutes for first-time setup  
**Last Updated:** March 9, 2026

# Quick Start Guide

Get EduSys AI running in 15 minutes.

## Prerequisites Check

Before starting, ensure you have:

```bash
# Check Node.js (need 18+)
node --version

# Check npm
npm --version

# Check MySQL (need 8.0+)
mysql --version

# Check MySQL is running
mysql -u root -p -e "SELECT 1;"
```

If any are missing, see [Setup Guide](./SETUP.md#prerequisites-installation).

## 5-Minute Setup

### 1. Clone and Install (2 minutes)

```bash
# Clone repository
git clone <repository-url>
cd edusys-ai

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Database Setup (2 minutes)

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE edusys_ai_2025_v1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Configure backend
cd backend
cp .env.example .env

# Edit .env - Update these lines:
# DB_PASSWORD=your_mysql_password
# DATABASE_URL="mysql://root:your_mysql_password@localhost:3306/edusys_ai_2025_v1"
# JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">

# Generate Prisma client and run migrations
npx prisma generate
npx prisma db push
```

### 3. Start Services (1 minute)

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd ..
npm run dev
```

### 4. Access Application

Open browser: **http://localhost:8080**

Login with test credentials:

- Email: `test@example.com`
- Password: `password123`

## Verify Installation

### Check Backend

```bash
# Health check
curl http://localhost:3001/health

# Expected response:
# {"status":"healthy","timestamp":"...","version":"1.0.0","environment":"development"}
```

### Check Frontend

1. Open http://localhost:8080
2. Should see login page
3. Login with test credentials
4. Should see dashboard

## Common Quick Start Issues

### Issue: MySQL connection failed

```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1;"

# Check credentials in backend/.env
cat backend/.env | grep DB_
```

### Issue: Port already in use

```bash
# Kill process on port 3001 (backend)
# Windows: netstat -ano | findstr :3001 && taskkill /PID <PID> /F
# macOS/Linux: lsof -ti:3001 | xargs kill -9

# Kill process on port 8080 (frontend)
# Windows: netstat -ano | findstr :8080 && taskkill /PID <PID> /F
# macOS/Linux: lsof -ti:8080 | xargs kill -9
```

### Issue: Prisma client not found

```bash
cd backend
npx prisma generate
npm run dev
```

### Issue: Frontend can't connect to backend

```bash
# Check backend is running
curl http://localhost:3001/health

# Check frontend .env
echo "VITE_API_URL=http://localhost:3001" > .env

# Restart frontend
npm run dev
```

## Next Steps

After successful setup:

1. **Explore the application**
   - Create a curriculum framework
   - Add courses and units
   - Upload documents
   - Try the AI features

2. **Read documentation**
   - [Architecture Overview](./ARCHITECTURE.md)
   - [API Documentation](./API.md)
   - [Development Guide](./DEVELOPMENT.md)

3. **Start developing**
   - Make a small change
   - See hot reload in action
   - Commit your first change

## Development Workflow

```bash
# Daily workflow
git pull origin main
cd backend && npm run dev  # Terminal 1
npm run dev                # Terminal 2 (from root)

# Make changes
# Test changes
# Commit and push
```

## Useful Commands

```bash
# Backend
cd backend
npm run dev              # Start dev server
npx prisma studio        # Open database GUI
npx prisma generate      # Regenerate Prisma client

# Frontend
npm run dev              # Start dev server
npm run build            # Build for production

# Database
mysql -u root -p edusys_ai_2025_v1  # Open MySQL CLI
npx prisma migrate dev   # Create migration
npx prisma db push       # Push schema changes
```

## Getting Help

- **Troubleshooting:** [Troubleshooting Guide](./TROUBLESHOOTING.md)
- **Detailed Setup:** [Setup Guide](./SETUP.md)
- **Architecture:** [Architecture Guide](./ARCHITECTURE.md)
- **Issues:** GitHub Issues
- **Team:** Ask in team chat

## Quick Reference

| Service       | URL                   | Port |
| ------------- | --------------------- | ---- |
| Frontend      | http://localhost:8080 | 8080 |
| Backend API   | http://localhost:3001 | 3001 |
| MySQL         | localhost             | 3306 |
| Prisma Studio | http://localhost:5555 | 5555 |

| Credentials    | Value            |
| -------------- | ---------------- |
| Test Email     | test@example.com |
| Test Password  | password123      |
| MySQL User     | root             |
| MySQL Password | (your password)  |

---

**Setup Time:** ~15 minutes  
**Last Updated:** March 9, 2026  
**Need Help?** See [Troubleshooting Guide](./TROUBLESHOOTING.md)

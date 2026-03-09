# Troubleshooting Guide

Common issues and their solutions.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Database Issues](#database-issues)
- [Backend Issues](#backend-issues)
- [Frontend Issues](#frontend-issues)
- [Authentication Issues](#authentication-issues)
- [Performance Issues](#performance-issues)
- [Development Issues](#development-issues)

## Installation Issues

### Node.js Version Mismatch

**Problem:** `error: The engine "node" is incompatible with this module`

**Solution:**

```bash
# Check your Node.js version
node --version

# Should be 18.x.x or higher
# If not, install Node.js 18+
# Windows: Download from nodejs.org
# macOS: brew install node@18
# Linux: Use nvm or package manager
```

### npm install Fails

**Problem:** `npm ERR! code ERESOLVE` or dependency conflicts

**Solution:**

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If still fails, try legacy peer deps
npm install --legacy-peer-deps
```

### Python Dependencies Fail

**Problem:** `pip install` fails for OCR service

**Solution:**

```bash
# Upgrade pip
python -m pip install --upgrade pip

# Install build tools (Windows)
# Download Visual Studio Build Tools

# Install build tools (macOS)
xcode-select --install

# Install build tools (Linux)
sudo apt-get install python3-dev build-essential

# Retry installation
pip install -r requirements-ocr.txt
```

## Database Issues

### MySQL Connection Refused

**Problem:** `ECONNREFUSED 127.0.0.1:3306` or `Can't connect to MySQL server`

**Solution:**

```bash
# Check if MySQL is running
# Windows
sc query MySQL80

# macOS
brew services list | grep mysql

# Linux
sudo systemctl status mysql

# Start MySQL if not running
# Windows
net start MySQL80

# macOS
brew services start mysql

# Linux
sudo systemctl start mysql

# Test connection
mysql -u root -p -e "SELECT 1;"
```

### Access Denied for User

**Problem:** `ER_ACCESS_DENIED_ERROR: Access denied for user 'root'@'localhost'`

**Solution:**

```bash
# 1. Verify credentials
mysql -u root -p
# Enter your password

# 2. Check .env file
cat backend/.env | grep DB_

# 3. Reset MySQL password if needed
# Stop MySQL
# Start MySQL with skip-grant-tables
# Reset password
# Restart MySQL normally

# 4. Grant privileges
mysql -u root -p
GRANT ALL PRIVILEGES ON edusys_ai_2025_v1.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### Database Does Not Exist

**Problem:** `ER_BAD_DB_ERROR: Unknown database 'edusys_ai_2025_v1'`

**Solution:**

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE edusys_ai_2025_v1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Verify
mysql -u root -p -e "SHOW DATABASES LIKE 'edusys%';"

# Run migrations
cd backend
npx prisma migrate deploy
```

### Prisma Client Not Generated

**Problem:** `Cannot find module '@prisma/client'` or `PrismaClient is not a constructor`

**Solution:**

```bash
cd backend

# Generate Prisma client
npx prisma generate

# If still fails, reinstall
npm uninstall @prisma/client
npm install @prisma/client

# Regenerate
npx prisma generate

# Restart backend
npm run dev
```

### Migration Fails

**Problem:** `Migration failed` or `Schema drift detected`

**Solution:**

```bash
cd backend

# Check migration status
npx prisma migrate status

# Reset database (DEVELOPMENT ONLY - deletes all data!)
npx prisma migrate reset

# Or push schema without migration
npx prisma db push

# Or create new migration
npx prisma migrate dev --name fix_schema
```

## Backend Issues

### Port Already in Use

**Problem:** `EADDRINUSE: address already in use :::3001`

**Solution:**

```bash
# Windows - Find and kill process
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux - Find and kill process
lsof -ti:3001 | xargs kill -9

# Or change port in .env
echo "PORT=3002" >> backend/.env
```

### Backend Won't Start

**Problem:** Backend crashes on startup

**Solution:**

```bash
# 1. Check logs
cd backend
npm run dev
# Read error message carefully

# 2. Common causes:
# - Database not running
# - Wrong credentials in .env
# - Prisma client not generated
# - Port in use

# 3. Verify environment
node --version  # Should be 18+
npm --version
mysql --version

# 4. Regenerate Prisma client
npx prisma generate

# 5. Test database connection
node -e "require('dotenv').config(); const mysql = require('mysql2'); const conn = mysql.createConnection(process.env.DATABASE_URL); conn.connect(err => { if (err) console.error(err); else console.log('✅ Connected'); conn.end(); });"
```

### TypeScript Compilation Errors

**Problem:** `TS2307: Cannot find module` or type errors

**Solution:**

```bash
cd backend

# Regenerate Prisma client
npx prisma generate

# Clear TypeScript cache
rm -rf dist/
rm -rf node_modules/.cache/

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try building
npm run build
```

### Memory Issues

**Problem:** `JavaScript heap out of memory`

**Solution:**

```bash
# Increase Node.js memory limit
# Already configured in package.json scripts

# If still fails, increase further
NODE_OPTIONS="--max-old-space-size=8192" npm run dev

# Or update package.json
"dev": "cross-env NODE_OPTIONS=\"--max-old-space-size=8192\" ts-node-dev ..."
```

## Frontend Issues

### Frontend Won't Start

**Problem:** `npm run dev` fails

**Solution:**

```bash
# 1. Check Node.js version
node --version  # Should be 18+

# 2. Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# 3. Check for port conflicts
# Kill process on port 8080
# Windows: netstat -ano | findstr :8080
# macOS/Linux: lsof -ti:8080 | xargs kill -9

# 4. Try different port
# Edit vite.config.ts
server: {
  port: 8081
}
```

### Can't Connect to Backend

**Problem:** Network errors or CORS errors in browser console

**Solution:**

```bash
# 1. Verify backend is running
curl http://localhost:3001/health

# 2. Check frontend .env
cat .env
# Should have: VITE_API_URL=http://localhost:3001

# 3. Check backend CORS configuration
cat backend/.env | grep FRONTEND_URL
# Should have: FRONTEND_URL=http://localhost:8080

# 4. Restart both services
# Backend: Ctrl+C, npm run dev
# Frontend: Ctrl+C, npm run dev

# 5. Check browser console for specific error
# Open DevTools (F12) -> Console tab
```

### Build Fails

**Problem:** `npm run build` fails

**Solution:**

```bash
# 1. Check for TypeScript errors
npm run build
# Read error messages

# 2. Fix type errors in code

# 3. Clear cache
rm -rf node_modules/.vite
rm -rf dist/

# 4. Rebuild
npm run build
```

### White Screen / Blank Page

**Problem:** Frontend loads but shows blank page

**Solution:**

```bash
# 1. Check browser console (F12)
# Look for JavaScript errors

# 2. Check network tab
# Look for failed API requests

# 3. Verify backend is running
curl http://localhost:3001/health

# 4. Check .env configuration
cat .env

# 5. Clear browser cache
# Ctrl+Shift+Delete -> Clear cache

# 6. Try incognito/private mode
```

## Authentication Issues

### Login Fails

**Problem:** Login returns error or doesn't work

**Solution:**

```bash
# 1. Check if user exists
cd backend
mysql -u root -p edusys_ai_2025_v1 -e "SELECT id, email FROM users WHERE email='test@example.com';"

# 2. Create test user if missing
node scripts/seed/create-test-user.js

# 3. Test login API directly
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 4. Check JWT_SECRET is set
cat backend/.env | grep JWT_SECRET

# 5. Check browser console for errors
```

### Token Expired

**Problem:** `Token expired` or `Invalid token` errors

**Solution:**

```bash
# 1. Clear localStorage
# Browser console: localStorage.clear()

# 2. Login again

# 3. Check token expiration in .env
cat backend/.env | grep JWT_EXPIRES_IN
# Default: 24h

# 4. Increase expiration if needed
echo "JWT_EXPIRES_IN=7d" >> backend/.env
```

### Unauthorized Errors

**Problem:** API returns 401 Unauthorized

**Solution:**

```bash
# 1. Check if logged in
# Browser console: localStorage.getItem('access_token')

# 2. Login again if no token

# 3. Check token is being sent
# Browser DevTools -> Network -> Request Headers
# Should have: Authorization: Bearer <token>

# 4. Verify token is valid
# Decode at jwt.io

# 5. Check backend JWT_SECRET matches
```

## Performance Issues

### Slow Page Load

**Problem:** Pages take long to load

**Solution:**

```bash
# 1. Check network tab in browser DevTools
# Identify slow requests

# 2. Check backend logs
cd backend
tail -f logs/combined.log

# 3. Optimize database queries
# Add indexes to frequently queried fields

# 4. Enable caching
# Add Redis for caching

# 5. Optimize frontend bundle
npm run build
# Check bundle size
```

### High Memory Usage

**Problem:** Application uses too much memory

**Solution:**

```bash
# Backend
# 1. Check for memory leaks
# Use Node.js profiler

# 2. Increase memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run dev

# 3. Optimize Prisma queries
# Use select to fetch only needed fields

# Frontend
# 1. Check for memory leaks
# Use Chrome DevTools Memory profiler

# 2. Optimize component re-renders
# Use React.memo, useMemo, useCallback

# 3. Implement virtualization for large lists
```

### Slow Database Queries

**Problem:** Database queries are slow

**Solution:**

```bash
# 1. Enable MySQL slow query log
mysql -u root -p -e "SET GLOBAL slow_query_log = 'ON';"
mysql -u root -p -e "SET GLOBAL long_query_time = 1;"

# 2. Check slow queries
tail -f /var/log/mysql/slow-query.log

# 3. Add indexes
# Edit prisma/schema.prisma
@@index([field_name])

# 4. Optimize queries
# Use select, include wisely
# Avoid N+1 queries

# 5. Analyze query performance
mysql -u root -p edusys_ai_2025_v1
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';
```

## Development Issues

### Hot Reload Not Working

**Problem:** Changes don't reflect automatically

**Solution:**

```bash
# Backend
# 1. Check ts-node-dev is running
# Should see "Restarting..." on file changes

# 2. Restart backend
# Ctrl+C, npm run dev

# Frontend
# 1. Check Vite HMR is working
# Should see "hmr update" in console

# 2. Restart frontend
# Ctrl+C, npm run dev

# 3. Clear browser cache
# Hard refresh: Ctrl+Shift+R
```

### Git Issues

**Problem:** Git conflicts or merge issues

**Solution:**

```bash
# 1. Pull latest changes
git pull origin main

# 2. Resolve conflicts
# Edit conflicted files
# Remove conflict markers (<<<<, ====, >>>>)

# 3. Stage resolved files
git add .

# 4. Continue merge/rebase
git merge --continue
# or
git rebase --continue

# 5. If stuck, abort and try again
git merge --abort
# or
git rebase --abort
```

### Environment Variables Not Loading

**Problem:** Environment variables not being read

**Solution:**

```bash
# 1. Check file exists
ls -la .env
ls -la backend/.env

# 2. Check file format
# No spaces around =
# Good: KEY=value
# Bad:  KEY = value

# 3. Restart server after changing .env
# Ctrl+C, npm run dev

# 4. Check for typos
cat .env | grep VITE_API_URL
cat backend/.env | grep DATABASE_URL

# 5. Verify loading
# Backend: console.log(process.env.DATABASE_URL)
# Frontend: console.log(import.meta.env.VITE_API_URL)
```

## Getting More Help

If your issue isn't covered here:

1. **Check logs:**
   - Backend: `backend/logs/`
   - Browser console (F12)
   - Terminal output

2. **Search existing issues:**
   - GitHub Issues
   - Stack Overflow

3. **Ask for help:**
   - Team chat
   - Create GitHub issue with:
     - Operating system
     - Node.js version
     - Complete error message
     - Steps to reproduce

4. **Provide context:**

   ```bash
   # System info
   node --version
   npm --version
   mysql --version

   # Environment
   cat backend/.env | grep -v PASSWORD
   cat .env

   # Logs
   tail -n 50 backend/logs/error.log
   ```

---

**Last Updated:** March 9, 2026  
**See Also:** [Setup Guide](./SETUP.md) | [Development Guide](./DEVELOPMENT.md)

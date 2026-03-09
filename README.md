# EduSys AI - Education Management Platform

A comprehensive full-stack education platform with curriculum management, AI-powered document processing, assignments, and analytics.

## 🚀 Quick Start

```bash
# 1. Clone and install
git clone <repository-url>
cd edusys-ai

# 2. Setup backend
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npx prisma generate
npm run dev

# 3. Setup frontend (new terminal)
cd ..
npm install
npm run dev
```

**Access the application:**

- Frontend: http://localhost:8080
- Backend API: http://localhost:3001
- API Health: http://localhost:3001/health

## 📋 Prerequisites

### Required

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MySQL** 8.0+ ([Download](https://dev.mysql.com/downloads/mysql/))
- **npm** or **pnpm** (comes with Node.js)

### Optional

- **Python** 3.8+ (for OCR service)
- **Redis** (for background jobs)
- **FFmpeg** (for audio/video processing)

## 📚 Documentation

### Getting Started

- **[Setup Guide](./docs/SETUP.md)** - Complete installation instructions
- **[Environment Variables](./docs/ENVIRONMENT.md)** - Configuration reference
- **[Development Guide](./docs/DEVELOPMENT.md)** - Local development workflow

### Architecture

- **[System Architecture](./docs/ARCHITECTURE.md)** - High-level overview
- **[API Documentation](./docs/API.md)** - REST API reference
- **[Database Schema](./docs/DATABASE.md)** - Prisma schema guide

### Services

- **[Backend Setup](./docs/BACKEND.md)** - Node.js/Express/Prisma backend
- **[Frontend Setup](./docs/FRONTEND.md)** - React/Vite/TypeScript frontend
- **[OCR Service](./docs/OCR-SERVICE.md)** - Python FastAPI OCR service

### Operations

- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Deployment](./docs/DEPLOYMENT.md)** - Production deployment guide

## 🏗️ Project Structure

```
edusys-ai/
├── backend/              # Node.js backend (Express + Prisma)
│   ├── src/             # TypeScript source code
│   ├── prisma/          # Database schema and migrations
│   ├── tests/           # Test files
│   ├── scripts/         # Utility scripts
│   ├── docs/            # Backend documentation
│   └── ocr_service.py   # Python OCR service
├── src/                 # React frontend
│   ├── components/      # React components
│   ├── pages/           # Page components
│   ├── services/        # API client services
│   └── lib/             # Utilities and helpers
├── docs/                # Project documentation
└── public/              # Static assets
```

## 🔧 Technology Stack

### Backend

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** MySQL 8.0+
- **Authentication:** JWT
- **Queues:** Bull + Redis (optional)

### Frontend

- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **UI Library:** shadcn/ui + Radix UI
- **Styling:** Tailwind CSS
- **State Management:** TanStack Query
- **Routing:** React Router

### AI/OCR Service

- **Runtime:** Python 3.8+
- **Framework:** FastAPI
- **OCR:** EasyOCR, PyMuPDF, Tesseract
- **AI:** Google Gemini API
- **Speech:** Whisper (optional)

## 🎯 Key Features

- **Curriculum Management** - Create and manage curriculum frameworks
- **Course Builder** - Design courses with units and resources
- **Document Processing** - AI-powered OCR and document analysis
- **Assignment System** - Create and grade assignments
- **Gamification** - Points, badges, and leaderboards
- **Analytics** - Comprehensive reporting and insights
- **Multi-tenant** - Support for multiple organizations
- **Role-based Access** - Granular permissions system

## 🔐 Default Credentials

For local development, use these test credentials:

```
Email: test@example.com
Password: password123
```

**⚠️ Change these in production!**

## 🐛 Common Issues

### Backend won't start

```bash
# Check if MySQL is running
mysql -u root -p

# Regenerate Prisma client
cd backend
npx prisma generate
```

### Frontend can't connect to backend

```bash
# Verify backend is running
curl http://localhost:3001/health

# Check frontend .env
cat .env | grep VITE_API_URL
# Should be: VITE_API_URL=http://localhost:3001
```

### Port already in use

```bash
# Find and kill process on port 3001 (backend)
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Find and kill process on port 8080 (frontend)
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

See [Troubleshooting Guide](./docs/TROUBLESHOOTING.md) for more solutions.

## 📖 Learning Path

### For New Developers

1. **Day 1:** Read [Setup Guide](./docs/SETUP.md) and get the app running
2. **Day 2:** Review [Architecture](./docs/ARCHITECTURE.md) to understand the system
3. **Day 3:** Explore [API Documentation](./docs/API.md) and make test requests
4. **Day 4:** Read [Development Guide](./docs/DEVELOPMENT.md) and make your first change
5. **Day 5:** Review [Database Schema](./docs/DATABASE.md) and understand data models

### For Backend Developers

1. [Backend Setup](./docs/BACKEND.md) - Setup and architecture
2. [Database Schema](./docs/DATABASE.md) - Prisma models
3. [API Documentation](./docs/API.md) - Endpoints and contracts
4. [Development Guide](./docs/DEVELOPMENT.md) - Coding standards

### For Frontend Developers

1. [Frontend Setup](./docs/FRONTEND.md) - Setup and architecture
2. [API Documentation](./docs/API.md) - Backend integration
3. [Development Guide](./docs/DEVELOPMENT.md) - Component patterns

## 🤝 Contributing

1. Read the [Development Guide](./docs/DEVELOPMENT.md)
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is proprietary software. All rights reserved.

## 🆘 Support

- **Documentation:** See `/docs` directory
- **Issues:** GitHub Issues
- **Email:** support@edusys.ai

---

**Version:** 1.0.0  
**Last Updated:** March 9, 2026  
**Status:** Active Development

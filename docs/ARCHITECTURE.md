# System Architecture

## Overview

EduSys AI is a full-stack education management platform built with modern web technologies. The system follows a three-tier architecture with clear separation of concerns.

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│              React + Vite + TypeScript                       │
│                   Port: 8080                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST
                       │ JSON
┌──────────────────────▼──────────────────────────────────────┐
│                      Backend API                             │
│           Express + TypeScript + Prisma                      │
│                   Port: 3001                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │ SQL
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    MySQL Database                            │
│                   Port: 3306                                 │
└──────────────────────────────────────────────────────────────┘

Optional Services:
┌──────────────────────┐  ┌──────────────────────┐
│   OCR Service        │  │   Redis Queue        │
│   Python FastAPI     │  │   Port: 6379         │
│   Port: 8000         │  └──────────────────────┘
└──────────────────────┘
```

## Technology Stack

### Frontend Layer

**Framework:** React 18

- **Build Tool:** Vite 6 (fast HMR, optimized builds)
- **Language:** TypeScript (type safety)
- **UI Components:** shadcn/ui + Radix UI (accessible components)
- **Styling:** Tailwind CSS (utility-first CSS)
- **State Management:** TanStack Query (server state)
- **Routing:** React Router v6 (client-side routing)
- **Forms:** React Hook Form + Zod (validation)

**Key Features:**

- Hot Module Replacement (HMR) for fast development
- Code splitting and lazy loading
- Optimized production builds
- TypeScript for type safety
- Responsive design with Tailwind

### Backend Layer

**Runtime:** Node.js 18+

- **Framework:** Express.js (web framework)
- **Language:** TypeScript (compiled to JavaScript)
- **ORM:** Prisma (type-safe database client)
- **Database:** MySQL 8.0+ (relational database)
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** express-validator + Joi
- **Logging:** Winston (structured logging)
- **Security:** Helmet + CORS + Rate Limiting

**Key Features:**

- RESTful API design
- Role-based access control (RBAC)
- Request validation and sanitization
- Error handling middleware
- Audit logging
- Background job processing (Bull + Redis)

### Database Layer

**Database:** MySQL 8.0+

- **ORM:** Prisma (schema-first approach)
- **Migrations:** Prisma Migrate
- **Character Set:** UTF8MB4 (full Unicode support)
- **Collation:** utf8mb4_unicode_ci

**Key Features:**

- 240+ models (comprehensive schema)
- Foreign key constraints
- Indexes for performance
- Soft deletes (where applicable)
- Audit trails

### Optional Services

**OCR Service:** Python FastAPI

- **OCR:** EasyOCR, PyMuPDF, Tesseract
- **AI:** Google Gemini API
- **Speech:** Whisper (audio transcription)
- **Media:** FFmpeg (video/audio processing)

**Background Jobs:** Bull + Redis

- Export generation (PDF, DOCX, SCORM)
- Validation jobs
- Email notifications
- Scheduled tasks

## Application Architecture

### Frontend Architecture

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (shadcn)
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components (Header, Sidebar)
│   └── curriculum/     # Domain-specific components
├── pages/              # Page components (routes)
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   └── CurriculumPage.tsx
├── services/           # API client services
│   ├── api.ts          # Base API client
│   ├── authService.ts  # Authentication API
│   └── curriculumService.ts
├── lib/                # Utilities and helpers
│   ├── utils.ts
│   └── constants.ts
├── hooks/              # Custom React hooks
└── types/              # TypeScript type definitions
```

**Data Flow:**

1. User interacts with UI component
2. Component calls service function
3. Service makes HTTP request to backend
4. Response updates component state (via TanStack Query)
5. UI re-renders with new data

**State Management:**

- **Server State:** TanStack Query (caching, refetching)
- **Local State:** React useState/useReducer
- **Form State:** React Hook Form
- **Auth State:** localStorage + Context (to be improved)

### Backend Architecture

```
backend/src/
├── config/             # Configuration
│   ├── database.ts     # Database connection
│   ├── env.ts          # Environment validation
│   └── prisma.ts       # Prisma client
├── middleware/         # Express middleware
│   ├── auth.ts         # JWT authentication
│   ├── errorHandler.ts # Error handling
│   ├── validation.ts   # Request validation
│   └── maintenance.ts  # Maintenance mode
├── routes/             # API route handlers
│   ├── auth.ts         # /api/v1/auth/*
│   ├── curriculum.ts   # /api/v1/kct/*
│   ├── courses.ts      # /api/v1/courses/*
│   └── ...             # Other routes
├── services/           # Business logic
│   ├── authService.ts
│   ├── curriculumService.ts
│   ├── emailService.ts
│   └── queueService.ts
├── utils/              # Utilities
│   ├── logger.ts       # Winston logger
│   └── sanitize.ts     # Input sanitization
└── server.ts           # Express app entry point
```

**Request Flow:**

1. HTTP request arrives at Express
2. Security middleware (Helmet, CORS, Rate Limiting)
3. Request logging
4. Route matching
5. Authentication middleware (if protected)
6. Validation middleware
7. Route handler (calls service)
8. Service executes business logic (via Prisma)
9. Response sent to client
10. Error handling (if error occurs)

**Layered Architecture:**

- **Routes:** HTTP handling, request/response
- **Services:** Business logic, data access
- **Prisma:** Database queries
- **Middleware:** Cross-cutting concerns

## Data Flow

### Authentication Flow

```
1. User submits login form
   ↓
2. Frontend sends POST /api/v1/auth/login
   ↓
3. Backend validates credentials
   ↓
4. Backend generates JWT tokens
   ↓
5. Frontend stores tokens in localStorage
   ↓
6. Frontend includes token in Authorization header
   ↓
7. Backend validates token on each request
```

### Curriculum Management Flow

```
1. User creates curriculum framework
   ↓
2. Frontend sends POST /api/v1/kct
   ↓
3. Backend validates data
   ↓
4. Backend creates framework in database
   ↓
5. Backend returns created framework
   ↓
6. Frontend updates UI (TanStack Query cache)
   ↓
7. User adds courses to framework
   ↓
8. Repeat for units and resources
```

### Document Processing Flow

```
1. User uploads document
   ↓
2. Frontend sends file to backend
   ↓
3. Backend saves file to uploads/
   ↓
4. Backend sends file to OCR service
   ↓
5. OCR service processes document
   ↓
6. OCR service returns extracted text
   ↓
7. Backend sends text to Gemini AI
   ↓
8. Gemini AI analyzes and structures data
   ↓
9. Backend saves results to database
   ↓
10. Frontend displays processed document
```

## Security Architecture

### Authentication & Authorization

**JWT-based Authentication:**

- Access token (24h expiry)
- Refresh token (longer expiry)
- Tokens stored in localStorage (frontend)
- Tokens validated on each request (backend)

**Role-Based Access Control (RBAC):**

- Roles: viewer, curriculum_designer, qa, program_owner, bgh, admin
- Permissions checked at route level
- Fine-grained access control

**Security Measures:**

- Password hashing (bcrypt)
- JWT secret rotation
- Rate limiting (prevent brute force)
- CORS configuration (restrict origins)
- Helmet (security headers)
- Input validation and sanitization
- SQL injection prevention (Prisma)
- XSS prevention (sanitization)

### Data Security

**Database:**

- Encrypted connections (SSL/TLS)
- Parameterized queries (Prisma)
- Foreign key constraints
- Audit logging

**API:**

- HTTPS in production
- API rate limiting
- Request size limits
- CORS restrictions

## Performance Considerations

### Frontend Optimization

- **Code Splitting:** Lazy loading of routes
- **Bundle Optimization:** Vite's optimized builds
- **Caching:** TanStack Query caching
- **Debouncing:** Search inputs
- **Virtualization:** Large lists (if needed)

### Backend Optimization

- **Database Indexing:** Foreign keys, frequently queried fields
- **Query Optimization:** Prisma select, include
- **Caching:** Redis for frequently accessed data
- **Connection Pooling:** MySQL connection pool
- **Compression:** gzip compression
- **Rate Limiting:** Prevent abuse

### Database Optimization

- **Indexes:** On foreign keys and search fields
- **Query Optimization:** Avoid N+1 queries
- **Connection Pooling:** Reuse connections
- **Read Replicas:** For analytics (future)

## Scalability

### Horizontal Scaling

**Frontend:**

- Static files served via CDN
- Multiple frontend instances behind load balancer

**Backend:**

- Stateless API (JWT tokens)
- Multiple backend instances behind load balancer
- Session data in Redis (if needed)

**Database:**

- Read replicas for analytics
- Sharding (future consideration)

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Add caching layers

## Monitoring & Logging

### Application Logging

**Winston Logger:**

- Structured JSON logs
- Log levels: error, warn, info, debug
- File rotation
- Console output (development)
- File output (production)

**Logged Events:**

- HTTP requests
- Authentication events
- Database queries (errors)
- Background jobs
- System errors

### Audit Logging

**Audit Trail:**

- User actions (create, update, delete)
- Before/after states
- Timestamps and user IDs
- IP addresses
- Compliance-ready

### Health Monitoring

**Health Endpoints:**

- `/health` - Basic health check
- `/api/v1/system/info` - System information

**Metrics to Monitor:**

- Response times
- Error rates
- Database connection pool
- Memory usage
- CPU usage

## Deployment Architecture

### Development Environment

```
Developer Machine
├── Frontend (localhost:8080)
├── Backend (localhost:3001)
├── MySQL (localhost:3306)
├── OCR Service (localhost:8000) [optional]
└── Redis (localhost:6379) [optional]
```

### Production Environment (Recommended)

```
Load Balancer
├── Frontend Servers (multiple instances)
│   └── Nginx + Static Files
├── Backend Servers (multiple instances)
│   └── Node.js + PM2
├── Database Cluster
│   ├── Primary (writes)
│   └── Replicas (reads)
├── Redis Cluster
│   └── Background Jobs
└── OCR Service
    └── Python FastAPI
```

## Technology Decisions

### Why React?

- Large ecosystem
- Component reusability
- Strong TypeScript support
- Excellent developer experience

### Why Express?

- Mature and stable
- Large middleware ecosystem
- Flexible and unopinionated
- Good TypeScript support

### Why Prisma?

- Type-safe database access
- Excellent TypeScript integration
- Schema-first approach
- Migration management
- Auto-generated client

### Why MySQL?

- Proven reliability
- ACID compliance
- Good performance
- Wide hosting support
- Familiar to team

### Why Vite?

- Fast HMR (Hot Module Replacement)
- Optimized builds
- Modern tooling
- Better than Create React App

## Future Improvements

### Short-term

- Implement AuthContext (centralized auth state)
- Add error boundaries
- Improve loading states
- Add E2E tests

### Medium-term

- Microservices architecture
- GraphQL API (optional)
- Real-time features (WebSockets)
- Advanced caching strategies

### Long-term

- Multi-region deployment
- Event sourcing
- CQRS pattern
- Kubernetes orchestration

---

**Last Updated:** March 9, 2026  
**Version:** 1.0.0

# Backend Architecture Refactor - Design Document

## Executive Summary

This design addresses critical architectural issues in the backend codebase:

- **97+ test/debug/utility scripts** cluttering the backend root directory
- **Duplicate service files** (courseService.js + courseService.ts, curriculumService.js + curriculumService.ts)
- **Weak domain separation** with flat route/service structure
- **Mixed production and development code** in the same directories

The refactor will organize code into clear domains, remove duplicates, and separate concerns without breaking functionality.

## Current State Analysis

### Critical Issues Found

#### 1. Backend Root Directory Pollution (CRITICAL)

**Location:** `backend/` root directory
**Issue:** 97+ utility files cluttering the root:

- 50+ test files (test-\*.js)
- 20+ check/debug files (check-_.js, debug-_.js)
- 15+ migration/setup files (run-_.js, setup-_.js, migrate-\*.js)
- 10+ validation files (validate-\*.js)
- Multiple report files (.md, .json)

**Impact:**

- Extremely difficult to navigate
- Hard to distinguish production from development code
- Risk of accidentally deploying test files
- Poor developer experience

**Example Files:**

```
backend/test-login.js
backend/test-courses-api.js
backend/check-user-password.js
backend/debug-kct.js
backend/validate-database-expansion.js
backend/run-migration.bat
```

#### 2. Duplicate Service Files (CRITICAL)

**Location:** `backend/src/services/`

**Duplicate #1: courseService**

- `backend/src/services/courseService.js` (385 lines, CommonJS)
- `backend/src/services/courseService.ts` (367 lines, ES6 modules)

**Duplicate #2: curriculumService**

- `backend/src/services/curriculumService.js` (386 lines, CommonJS)
- `backend/src/services/curriculumService.ts` (448 lines, ES6 modules)

**Impact:**

- Confusion about which file is authoritative
- Risk of divergent implementations
- Maintenance nightmare (changes must be duplicated)
- TypeScript benefits lost with .js versions

**Analysis:**
The .ts versions are more recent and complete:

- Better type safety
- More methods implemented
- Consistent with other services
- Proper ES6 module exports

**Recommendation:** Delete .js versions, keep .ts versions

#### 3. Flat Route/Service Structure (MEDIUM)

**Location:** `backend/src/routes/`, `backend/src/services/`

**Current Structure:**

```
backend/src/
├── routes/
│   ├── advancedAuth.ts
│   ├── advancedFramework.ts
│   ├── ai.ts
│   ├── approvals.ts
│   ├── assignments.ts
│   ├── audit.ts
│   ├── auth.ts
│   ├── comments.ts
│   ├── courses.ts
│   ├── curriculum.ts
│   ├── documents.ts
│   ├── exports.ts
│   ├── games.ts
│   ├── mappings.ts
│   ├── permissions.ts
│   ├── reports.ts
│   ├── resources.ts
│   ├── roles.ts
│   ├── savedViews.ts
│   ├── scopes.ts
│   ├── system.ts
│   ├── tags.ts
│   ├── units.ts
│   ├── users.ts
│   └── versions.ts
└── services/
    ├── advancedAuthService.ts
    ├── advancedCourseService.ts
    ├── advancedFrameworkService.ts
    ├── aiService.ts
    ├── assignmentsService.ts
    ├── authService.ts
    ├── courseService.js (DUPLICATE)
    ├── courseService.ts
    ├── curriculumService.js (DUPLICATE)
    ├── curriculumService.ts
    ├── documentService.ts
    ├── emailService.ts
    ├── gamesService.ts
    ├── googleDriveService.ts
    ├── ocrService.ts
    ├── queueService.ts
    ├── rolesService.ts
    └── systemService.ts
```

**Issues:**

- 25 route files in flat structure
- 20 service files in flat structure
- No clear domain grouping
- Hard to understand relationships
- Difficult to enforce domain boundaries

#### 4. Inconsistent Export Patterns (LOW)

**Location:** Various service files

**Pattern 1: Class + Instance Export**

```typescript
export class AuthService {}
export const authService = new AuthService();
```

**Pattern 2: Class + Default Export**

```typescript
export class DocumentService {}
export default DocumentService;
```

**Pattern 3: Class + Instance + Default**

```typescript
export class EmailService {}
export const emailService = new EmailService();
export default EmailService;
```

**Pattern 4: CommonJS (in .js files)**

```javascript
module.exports = { curriculumService, CurriculumService };
```

**Impact:**

- Inconsistent import patterns across codebase
- Confusion about which export to use
- Harder to refactor

**Recommendation:** Standardize on Pattern 1 (class + instance export)

## Proposed Solution

### 1. New Backend Folder Structure

```
backend/
├── src/                          # Production code only
│   ├── config/                   # Configuration
│   │   ├── database.ts
│   │   ├── env.ts
│   │   └── prisma.ts
│   ├── middleware/               # Express middleware
│   │   ├── auditLog.ts
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── maintenance.ts
│   │   └── validation.ts
│   ├── domains/                  # Domain-organized code
│   │   ├── auth/                 # Authentication & Authorization
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── users.routes.ts
│   │   │   │   ├── roles.routes.ts
│   │   │   │   ├── permissions.routes.ts
│   │   │   │   └── scopes.routes.ts
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── advancedAuth.service.ts
│   │   │   │   └── roles.service.ts
│   │   │   └── index.ts          # Domain exports
│   │   ├── curriculum/           # Curriculum Management
│   │   │   ├── routes/
│   │   │   │   ├── curriculum.routes.ts
│   │   │   │   ├── courses.routes.ts
│   │   │   │   ├── units.routes.ts
│   │   │   │   ├── resources.routes.ts
│   │   │   │   ├── mappings.routes.ts
│   │   │   │   ├── versions.routes.ts
│   │   │   │   └── advancedFramework.routes.ts
│   │   │   ├── services/
│   │   │   │   ├── curriculum.service.ts
│   │   │   │   ├── course.service.ts
│   │   │   │   ├── advancedCourse.service.ts
│   │   │   │   └── advancedFramework.service.ts
│   │   │   └── index.ts
│   │   ├── documents/            # Document Management
│   │   │   ├── routes/
│   │   │   │   └── documents.routes.ts
│   │   │   ├── services/
│   │   │   │   ├── document.service.ts
│   │   │   │   ├── ocr.service.ts
│   │   │   │   └── googleDrive.service.ts
│   │   │   └── index.ts
│   │   ├── assignments/          # Assignment Management
│   │   │   ├── routes/
│   │   │   │   └── assignments.routes.ts
│   │   │   ├── services/
│   │   │   │   └── assignments.service.ts
│   │   │   └── index.ts
│   │   ├── games/                # Gamification
│   │   │   ├── routes/
│   │   │   │   └── games.routes.ts
│   │   │   ├── services/
│   │   │   │   └── games.service.ts
│   │   │   └── index.ts
│   │   ├── analytics/            # Reports & Analytics
│   │   │   ├── routes/
│   │   │   │   ├── reports.routes.ts
│   │   │   │   └── exports.routes.ts
│   │   │   └── index.ts
│   │   ├── collaboration/        # Comments, Approvals, Tags
│   │   │   ├── routes/
│   │   │   │   ├── comments.routes.ts
│   │   │   │   ├── approvals.routes.ts
│   │   │   │   ├── tags.routes.ts
│   │   │   │   └── savedViews.routes.ts
│   │   │   └── index.ts
│   │   ├── ai/                   # AI Services
│   │   │   ├── routes/
│   │   │   │   └── ai.routes.ts
│   │   │   ├── services/
│   │   │   │   └── ai.service.ts
│   │   │   └── index.ts
│   │   └── system/               # System Management
│   │       ├── routes/
│   │       │   ├── system.routes.ts
│   │       │   └── audit.routes.ts
│   │       ├── services/
│   │       │   ├── system.service.ts
│   │       │   ├── email.service.ts
│   │       │   └── queue.service.ts
│   │       └── index.ts
│   ├── utils/                    # Shared utilities
│   │   ├── logger.ts
│   │   ├── sanitize.ts
│   │   └── schemaInitializer.ts
│   └── server.ts                 # Main server file
├── tests/                        # All test files
│   ├── integration/
│   │   ├── auth/
│   │   │   ├── login.test.js
│   │   │   └── advanced-auth.test.js
│   │   ├── curriculum/
│   │   │   ├── curriculum.test.js
│   │   │   ├── courses.test.js
│   │   │   └── kct-mapping.test.js
│   │   ├── documents/
│   │   │   └── documents.test.js
│   │   ├── assignments/
│   │   │   └── assignments.test.js
│   │   ├── games/
│   │   │   └── games.test.js
│   │   └── system/
│   │       └── system.test.js
│   ├── e2e/
│   │   ├── full-apis.test.js
│   │   ├── frontend-backend-integration.test.js
│   │   └── comprehensive-api-validation.test.js
│   └── fixtures/
│       ├── test_sample.pdf
│       └── test_sample.txt
├── scripts/                      # Development utilities
│   ├── db/
│   │   ├── check-tables.js
│   │   ├── check-collections.js
│   │   ├── check-users.js
│   │   ├── compare-schema-database.js
│   │   ├── database-summary.js
│   │   └── final-schema-check.js
│   ├── debug/
│   │   ├── debug-kct.js
│   │   ├── debug-kct-count.js
│   │   └── check-document-157.js
│   ├── migrations/
│   │   ├── run-advanced-auth-migration.js
│   │   ├── run-class-migration.js
│   │   ├── run-kct-mapping-migration.js
│   │   ├── run-database-expansion.js
│   │   └── migrate-db.js
│   ├── seed/
│   │   ├── seed-course-blueprints.js
│   │   ├── seed-sample-data.js
│   │   ├── create-test-user.js
│   │   └── setup-test-user.js
│   ├── validation/
│   │   ├── validate-advanced-auth-implementation.js
│   │   ├── validate-advanced-framework-implementation.js
│   │   ├── validate-database-expansion.js
│   │   ├── validate-document-implementation.js
│   │   └── validate-system-implementation.js
│   └── cleanup/
│       ├── clear-collections-data.js
│       ├── clear-course-blueprints.js
│       └── clear-document-collections.js
├── migrations/                   # SQL migrations (keep as is)
├── prisma/                       # Prisma schema (keep as is)
├── uploads/                      # File uploads (keep as is)
├── logs/                         # Application logs (keep as is)
├── backups/                      # Database backups (keep as is)
├── docs/                         # Documentation & reports
│   ├── api/
│   │   ├── ADVANCED-AUTH-API-REPORT.md
│   │   ├── ADVANCED-FRAMEWORK-API-REPORT.md
│   │   ├── DOCUMENT-MANAGEMENT-API-REPORT.md
│   │   └── SYSTEM-MANAGEMENT-API-REPORT.md
│   ├── implementation/
│   │   ├── ADVANCED-FRAMEWORK-IMPLEMENTATION-STATUS.md
│   │   └── DATABASE-EXPANSION-SUCCESS-REPORT.md
│   └── reports/
│       ├── database-expansion-report.json
│       └── prisma-update-report.json
├── plans/                        # Architecture plans (keep as is)
├── ocr_service.py                # OCR microservice (keep at root)
├── requirements-ocr.txt          # OCR dependencies (keep at root)
├── package.json
├── tsconfig.json
├── .env
├── .env.example
└── README.md
```

### 2. Domain Organization Strategy

#### Domain: Auth & Identity

**Responsibility:** User authentication, authorization, roles, permissions, scopes
**Routes:** auth, users, roles, permissions, scopes, advancedAuth
**Services:** authService, advancedAuthService, rolesService

#### Domain: Curriculum

**Responsibility:** Curriculum frameworks, courses, units, resources, mappings, versions
**Routes:** curriculum, courses, units, resources, mappings, versions, advancedFramework
**Services:** curriculumService, courseService, advancedCourseService, advancedFrameworkService

#### Domain: Documents

**Responsibility:** Document management, OCR processing, file uploads, Google Drive integration
**Routes:** documents
**Services:** documentService, ocrService, googleDriveService

#### Domain: Assignments

**Responsibility:** Assignment creation, management, submissions
**Routes:** assignments
**Services:** assignmentsService

#### Domain: Games

**Responsibility:** Gamification, game management
**Routes:** games
**Services:** gamesService

#### Domain: Analytics

**Responsibility:** Reports, exports, data analytics
**Routes:** reports, exports

#### Domain: Collaboration

**Responsibility:** Comments, approvals, tags, saved views
**Routes:** comments, approvals, tags, savedViews

#### Domain: AI

**Responsibility:** AI-powered features, Gemini integration
**Routes:** ai
**Services:** aiService

#### Domain: System

**Responsibility:** System management, audit logs, maintenance, email, queues
**Routes:** system, audit
**Services:** systemService, emailService, queueService

### 3. Migration Strategy

#### Phase 1: Organize Utility Files (2 hours) - SAFE

**Goal:** Move all test/debug/utility files out of backend root

**Actions:**

1. Create new directories: `tests/`, `scripts/`, `docs/`
2. Move test files to `tests/integration/` and `tests/e2e/`
3. Move check/debug files to `scripts/db/` and `scripts/debug/`
4. Move migration runners to `scripts/migrations/`
5. Move seed files to `scripts/seed/`
6. Move validation files to `scripts/validation/`
7. Move cleanup files to `scripts/cleanup/`
8. Move documentation to `docs/`

**Risk:** LOW - These files are not imported by production code

**Validation:**

- Run `npm run build` to ensure no broken imports
- Run `npm run dev` to ensure server starts
- Test one API endpoint to ensure functionality

#### Phase 2: Remove Duplicate Services (1 hour) - MEDIUM RISK

**Goal:** Delete duplicate .js service files

**Actions:**

1. Verify .ts versions have all functionality from .js versions
2. Update any imports that reference .js files
3. Delete `courseService.js`
4. Delete `curriculumService.js`
5. Run tests to verify no breakage

**Risk:** MEDIUM - If any code imports the .js versions, it will break

**Validation:**

- Search codebase for imports of `.js` service files
- Run full test suite
- Test curriculum and course APIs manually

#### Phase 3: Create Domain Structure (3 hours) - SAFE

**Goal:** Create new domain-based folder structure

**Actions:**

1. Create `src/domains/` directory
2. Create subdirectories for each domain
3. Create `routes/`, `services/`, `index.ts` in each domain
4. Keep old structure intact (parallel structure)

**Risk:** LOW - No files moved yet, just creating structure

#### Phase 4: Migrate Routes (4 hours) - MEDIUM RISK

**Goal:** Move route files to domain structure

**Actions:**

1. Copy route files to new domain structure
2. Update imports in route files
3. Create domain index files that export routes
4. Update `server.ts` to import from domains
5. Test each domain's routes
6. Delete old route files after verification

**Risk:** MEDIUM - Import paths will change

**Validation:**

- Test each API endpoint after migration
- Run integration tests
- Check for any 404 errors

#### Phase 5: Migrate Services (4 hours) - MEDIUM RISK

**Goal:** Move service files to domain structure

**Actions:**

1. Copy service files to new domain structure
2. Update imports in service files
3. Update imports in route files
4. Test each service
5. Delete old service files after verification

**Risk:** MEDIUM - Service import paths will change

**Validation:**

- Run full test suite
- Test all API endpoints
- Check for any runtime errors

#### Phase 6: Standardize Exports (2 hours) - LOW RISK

**Goal:** Standardize service export patterns

**Actions:**

1. Update all services to use consistent export pattern
2. Update imports across codebase
3. Test functionality

**Risk:** LOW - Mechanical refactor

**Validation:**

- TypeScript compilation succeeds
- All tests pass

### 4. File Movement Plan

#### Test Files to Move (50+ files)

```
backend/test-*.js → backend/tests/integration/
backend/test-*-api.js → backend/tests/integration/
backend/test-comprehensive-*.js → backend/tests/e2e/
backend/test-frontend-backend-integration.js → backend/tests/e2e/
```

#### Check/Debug Files to Move (20+ files)

```
backend/check-*.js → backend/scripts/db/
backend/debug-*.js → backend/scripts/debug/
backend/compare-*.js → backend/scripts/db/
```

#### Migration Files to Move (15+ files)

```
backend/run-*.js → backend/scripts/migrations/
backend/migrate-*.js → backend/scripts/migrations/
backend/expand-*.js → backend/scripts/migrations/
```

#### Seed Files to Move (5+ files)

```
backend/seed-*.js → backend/scripts/seed/
backend/create-test-user.js → backend/scripts/seed/
backend/setup-test-user.js → backend/scripts/seed/
backend/populate-*.mjs → backend/scripts/seed/
```

#### Validation Files to Move (5+ files)

```
backend/validate-*.js → backend/scripts/validation/
```

#### Cleanup Files to Move (3+ files)

```
backend/clear-*.js → backend/scripts/cleanup/
```

#### Documentation Files to Move (10+ files)

```
backend/*-REPORT.md → backend/docs/api/ or backend/docs/implementation/
backend/*-report.json → backend/docs/reports/
backend/README-*.md → backend/docs/
```

#### Files to Delete (duplicates)

```
backend/src/services/courseService.js
backend/src/services/curriculumService.js
backend/2.6.0 (version file?)
backend/2.7.0 (version file?)
backend/backend/ (duplicate directory?)
```

### 5. Server.ts Updates

**Current Route Registration:**

```typescript
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/roles", rolesRoutes);
// ... 20+ more routes
```

**Proposed Route Registration (after migration):**

```typescript
import { authDomain } from "./domains/auth";
import { curriculumDomain } from "./domains/curriculum";
import { documentsDomain } from "./domains/documents";
import { assignmentsDomain } from "./domains/assignments";
import { gamesDomain } from "./domains/games";
import { analyticsDomain } from "./domains/analytics";
import { collaborationDomain } from "./domains/collaboration";
import { aiDomain } from "./domains/ai";
import { systemDomain } from "./domains/system";

// Register domain routes
authDomain.registerRoutes(app, "/api/v1");
curriculumDomain.registerRoutes(app, "/api/v1");
documentsDomain.registerRoutes(app, "/api/v1");
assignmentsDomain.registerRoutes(app, "/api/v1");
gamesDomain.registerRoutes(app, "/api/v1");
analyticsDomain.registerRoutes(app, "/api/v1");
collaborationDomain.registerRoutes(app, "/api/v1");
aiDomain.registerRoutes(app, "/api/v1");
systemDomain.registerRoutes(app, "/api/v1");
```

**Domain Index Example (auth/index.ts):**

```typescript
import { Router } from "express";
import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/users.routes";
import rolesRoutes from "./routes/roles.routes";
import permissionsRoutes from "./routes/permissions.routes";
import scopesRoutes from "./routes/scopes.routes";

export const authDomain = {
  registerRoutes(app: any, basePath: string) {
    app.use(`${basePath}/auth`, authRoutes);
    app.use(`${basePath}/users`, usersRoutes);
    app.use(`${basePath}/roles`, rolesRoutes);
    app.use(`${basePath}/permissions`, permissionsRoutes);
    app.use(`${basePath}/scopes`, scopesRoutes);
  },
};

// Export services for use by other domains
export * from "./services/auth.service";
export * from "./services/advancedAuth.service";
export * from "./services/roles.service";
```

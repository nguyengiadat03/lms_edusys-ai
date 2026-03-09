# Backend Architecture Refactor - Implementation Plan

## Overview

This document provides the detailed step-by-step implementation plan for refactoring the backend architecture.

## Phase 1: Organize Utility Files (2 hours) - SAFE

### Step 1.1: Create Directory Structure

```bash
mkdir -p backend/tests/integration/auth
mkdir -p backend/tests/integration/curriculum
mkdir -p backend/tests/integration/documents
mkdir -p backend/tests/integration/assignments
mkdir -p backend/tests/integration/games
mkdir -p backend/tests/integration/system
mkdir -p backend/tests/e2e
mkdir -p backend/tests/fixtures
mkdir -p backend/scripts/db
mkdir -p backend/scripts/debug
mkdir -p backend/scripts/migrations
mkdir -p backend/scripts/seed
mkdir -p backend/scripts/validation
mkdir -p backend/scripts/cleanup
mkdir -p backend/docs/api
mkdir -p backend/docs/implementation
mkdir -p backend/docs/reports
```

### Step 1.2: Move Test Files

```bash
# Auth tests
mv backend/test-login*.js backend/tests/integration/auth/
mv backend/test-advanced-auth-api.js backend/tests/integration/auth/
mv backend/final-login-test.js backend/tests/integration/auth/

# Curriculum tests
mv backend/test-curriculum*.js backend/tests/integration/curriculum/
mv backend/test-course*.js backend/tests/integration/curriculum/
mv backend/test-kct*.js backend/tests/integration/curriculum/
mv backend/test-crud-kct.js backend/tests/integration/curriculum/

# Document tests
mv backend/test-document*.js backend/tests/integration/documents/
mv backend/test-ocr*.js backend/tests/integration/documents/

# Assignment tests
mv backend/test-assignment*.js backend/tests/integration/assignments/
mv backend/test-start-practice.js backend/tests/integration/assignments/

# Game tests
mv backend/test-games.js backend/tests/integration/games/

# System tests
mv backend/test-system*.js backend/tests/integration/system/
mv backend/test-security-sanity.js backend/tests/integration/system/

# E2E tests
mv backend/test-comprehensive-api-validation.js backend/tests/e2e/
mv backend/test-frontend-api-integration.js backend/tests/e2e/
mv backend/test-full-apis.js backend/tests/e2e/
mv backend/test-apis.js backend/tests/e2e/
mv backend/test-endpoints.js backend/tests/e2e/

# Database tests
mv backend/test-db*.js backend/scripts/db/
mv backend/test-prisma*.js backend/scripts/db/
mv backend/test-query.js backend/scripts/db/

# AI tests
mv backend/test-ai*.js backend/tests/integration/ai/
mv backend/test-gemini*.js backend/tests/integration/ai/

# Test fixtures
mv backend/test_sample.* backend/tests/fixtures/
mv backend/test_whisper_audio.py backend/tests/fixtures/
```

### Step 1.3: Move Check/Debug Files

```bash
# Database check scripts
mv backend/check-*.js backend/scripts/db/
mv backend/check-*.sql backend/scripts/db/
mv backend/compare-*.js backend/scripts/db/
mv backend/database-summary.js backend/scripts/db/
mv backend/final-schema-check.js backend/scripts/db/

# Debug scripts
mv backend/debug-*.js backend/scripts/debug/
```

### Step 1.4: Move Migration Files

```bash
mv backend/run-*.js backend/scripts/migrations/
mv backend/run-*.bat backend/scripts/migrations/
mv backend/migrate-*.js backend/scripts/migrations/
mv backend/expand-*.js backend/scripts/migrations/
mv backend/setup-expansion-scripts.js backend/scripts/migrations/
mv backend/update-prisma-schema.js backend/scripts/migrations/
mv backend/add-collection-id-to-documents.js backend/scripts/migrations/
```

### Step 1.5: Move Seed Files

```bash
mv backend/seed-*.js backend/scripts/seed/
mv backend/create-test-user.js backend/scripts/seed/
mv backend/setup-test-user.js backend/scripts/seed/
mv backend/populate_comprehensive_tags.mjs backend/scripts/seed/
mv backend/setup_new_columns.sql backend/scripts/seed/
```

### Step 1.6: Move Validation Files

```bash
mv backend/validate-*.js backend/scripts/validation/
```

### Step 1.7: Move Cleanup Files

```bash
mv backend/clear-*.js backend/scripts/cleanup/
```

### Step 1.8: Move Documentation Files

```bash
# API documentation
mv backend/*-API-REPORT.md backend/docs/api/

# Implementation documentation
mv backend/*-IMPLEMENTATION-STATUS.md backend/docs/implementation/
mv backend/*-SUCCESS-REPORT.md backend/docs/implementation/
mv backend/README-*.md backend/docs/

# Reports
mv backend/*-report.json backend/docs/reports/
```

### Step 1.9: Delete Obsolete Files

```bash
# Version files (unclear purpose)
rm backend/2.6.0
rm backend/2.7.0

# Duplicate backend directory
rm -rf backend/backend/

# Python cache
rm -rf backend/__pycache__/
```

### Step 1.10: Validation

```bash
cd backend
npm run build
npm run dev &
# Wait for server to start
curl http://localhost:3001/health
# Test one API endpoint
curl http://localhost:3001/api/v1/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"test"}'
```

## Phase 2: Remove Duplicate Services (1 hour) - MEDIUM RISK

### Step 2.1: Analyze Duplicate Files

```bash
# Compare courseService files
diff backend/src/services/courseService.js backend/src/services/courseService.ts

# Compare curriculumService files
diff backend/src/services/curriculumService.js backend/src/services/curriculumService.ts
```

### Step 2.2: Search for .js Imports

```bash
# Search for imports of .js service files
grep -r "courseService.js" backend/src/
grep -r "curriculumService.js" backend/src/
grep -r "from.*courseService'" backend/src/
grep -r "from.*curriculumService'" backend/src/
```

### Step 2.3: Update Imports (if any found)

```typescript
// Change from:
import { courseService } from "./services/courseService.js";

// To:
import { courseService } from "./services/courseService";
```

### Step 2.4: Delete Duplicate Files

```bash
rm backend/src/services/courseService.js
rm backend/src/services/curriculumService.js
```

### Step 2.5: Validation

```bash
# TypeScript compilation
npm run build

# Run tests
npm test

# Test curriculum APIs
curl http://localhost:3001/api/v1/kct
curl http://localhost:3001/api/v1/courses
```

## Phase 3: Create Domain Structure (3 hours) - SAFE

### Step 3.1: Create Domain Directories

```bash
mkdir -p backend/src/domains/auth/{routes,services}
mkdir -p backend/src/domains/curriculum/{routes,services}
mkdir -p backend/src/domains/documents/{routes,services}
mkdir -p backend/src/domains/assignments/{routes,services}
mkdir -p backend/src/domains/games/{routes,services}
mkdir -p backend/src/domains/analytics/routes
mkdir -p backend/src/domains/collaboration/routes
mkdir -p backend/src/domains/ai/{routes,services}
mkdir -p backend/src/domains/system/{routes,services}
```

### Step 3.2: Create Domain Index Files

Create `backend/src/domains/auth/index.ts`:

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

export * from "./services/auth.service";
export * from "./services/advancedAuth.service";
export * from "./services/roles.service";
```

Repeat for other domains...

## Phase 4: Migrate Routes (4 hours) - MEDIUM RISK

### Step 4.1: Copy Route Files to Domains

```bash
# Auth domain
cp backend/src/routes/auth.ts backend/src/domains/auth/routes/auth.routes.ts
cp backend/src/routes/users.ts backend/src/domains/auth/routes/users.routes.ts
cp backend/src/routes/roles.ts backend/src/domains/auth/routes/roles.routes.ts
cp backend/src/routes/permissions.ts backend/src/domains/auth/routes/permissions.routes.ts
cp backend/src/routes/scopes.ts backend/src/domains/auth/routes/scopes.routes.ts
cp backend/src/routes/advancedAuth.ts backend/src/domains/auth/routes/advancedAuth.routes.ts

# Curriculum domain
cp backend/src/routes/curriculum.ts backend/src/domains/curriculum/routes/curriculum.routes.ts
cp backend/src/routes/courses.ts backend/src/domains/curriculum/routes/courses.routes.ts
cp backend/src/routes/units.ts backend/src/domains/curriculum/routes/units.routes.ts
cp backend/src/routes/resources.ts backend/src/domains/curriculum/routes/resources.routes.ts
cp backend/src/routes/mappings.ts backend/src/domains/curriculum/routes/mappings.routes.ts
cp backend/src/routes/versions.ts backend/src/domains/curriculum/routes/versions.routes.ts
cp backend/src/routes/advancedFramework.ts backend/src/domains/curriculum/routes/advancedFramework.routes.ts

# Documents domain
cp backend/src/routes/documents.ts backend/src/domains/documents/routes/documents.routes.ts

# Assignments domain
cp backend/src/routes/assignments.ts backend/src/domains/assignments/routes/assignments.routes.ts

# Games domain
cp backend/src/routes/games.ts backend/src/domains/games/routes/games.routes.ts

# Analytics domain
cp backend/src/routes/reports.ts backend/src/domains/analytics/routes/reports.routes.ts
cp backend/src/routes/exports.ts backend/src/domains/analytics/routes/exports.routes.ts

# Collaboration domain
cp backend/src/routes/comments.ts backend/src/domains/collaboration/routes/comments.routes.ts
cp backend/src/routes/approvals.ts backend/src/domains/collaboration/routes/approvals.routes.ts
cp backend/src/routes/tags.ts backend/src/domains/collaboration/routes/tags.routes.ts
cp backend/src/routes/savedViews.ts backend/src/domains/collaboration/routes/savedViews.routes.ts

# AI domain
cp backend/src/routes/ai.ts backend/src/domains/ai/routes/ai.routes.ts

# System domain
cp backend/src/routes/system.ts backend/src/domains/system/routes/system.routes.ts
cp backend/src/routes/audit.ts backend/src/domains/system/routes/audit.routes.ts
```

### Step 4.2: Update Imports in Route Files

Update service imports from:

```typescript
import { authService } from "../services/authService";
```

To:

```typescript
import { authService } from "../services/auth.service";
```

### Step 4.3: Update server.ts

Replace individual route imports with domain imports:

```typescript
// Old
import authRoutes from "./routes/auth";
import usersRoutes from "./routes/users";
// ... 20+ more imports

// New
import { authDomain } from "./domains/auth";
import { curriculumDomain } from "./domains/curriculum";
// ... 9 domain imports

// Old registration
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", usersRoutes);
// ... 20+ more registrations

// New registration
authDomain.registerRoutes(app, "/api/v1");
curriculumDomain.registerRoutes(app, "/api/v1");
// ... 9 domain registrations
```

### Step 4.4: Test Each Domain

```bash
# Test auth domain
curl http://localhost:3001/api/v1/auth/login
curl http://localhost:3001/api/v1/users

# Test curriculum domain
curl http://localhost:3001/api/v1/kct
curl http://localhost:3001/api/v1/courses

# Test all other domains...
```

### Step 4.5: Delete Old Route Files (after validation)

```bash
rm backend/src/routes/*.ts
```

## Phase 5: Migrate Services (4 hours) - MEDIUM RISK

### Step 5.1: Copy Service Files to Domains

```bash
# Auth domain services
cp backend/src/services/authService.ts backend/src/domains/auth/services/auth.service.ts
cp backend/src/services/advancedAuthService.ts backend/src/domains/auth/services/advancedAuth.service.ts
cp backend/src/services/rolesService.ts backend/src/domains/auth/services/roles.service.ts

# Curriculum domain services
cp backend/src/services/curriculumService.ts backend/src/domains/curriculum/services/curriculum.service.ts
cp backend/src/services/courseService.ts backend/src/domains/curriculum/services/course.service.ts
cp backend/src/services/advancedCourseService.ts backend/src/domains/curriculum/services/advancedCourse.service.ts
cp backend/src/services/advancedFrameworkService.ts backend/src/domains/curriculum/services/advancedFramework.service.ts

# Documents domain services
cp backend/src/services/documentService.ts backend/src/domains/documents/services/document.service.ts
cp backend/src/services/ocrService.ts backend/src/domains/documents/services/ocr.service.ts
cp backend/src/services/googleDriveService.ts backend/src/domains/documents/services/googleDrive.service.ts

# Assignments domain services
cp backend/src/services/assignmentsService.ts backend/src/domains/assignments/services/assignments.service.ts

# Games domain services
cp backend/src/services/gamesService.ts backend/src/domains/games/services/games.service.ts

# AI domain services
cp backend/src/services/aiService.ts backend/src/domains/ai/services/ai.service.ts

# System domain services
cp backend/src/services/systemService.ts backend/src/domains/system/services/system.service.ts
cp backend/src/services/emailService.ts backend/src/domains/system/services/email.service.ts
cp backend/src/services/queueService.ts backend/src/domains/system/services/queue.service.ts
```

### Step 5.2: Update Service Imports

Update imports in service files and route files to use new paths.

### Step 5.3: Test All Services

Run full test suite and manual API tests.

### Step 5.4: Delete Old Service Files (after validation)

```bash
rm backend/src/services/*.ts
rm backend/src/services/*.js
```

## Phase 6: Standardize Exports (2 hours) - LOW RISK

### Step 6.1: Standardize Service Exports

Update all services to use consistent pattern:

```typescript
export class AuthService {
  // ... implementation
}

export const authService = new AuthService();
```

### Step 6.2: Update Imports

Update all imports to use the standardized pattern.

### Step 6.3: Validation

```bash
npm run build
npm test
```

## Risk Mitigation

### Backup Strategy

```bash
# Before starting, create backup
git checkout -b backup-before-refactor
git commit -am "Backup before architecture refactor"
git checkout main
```

### Rollback Plan

```bash
# If something goes wrong
git checkout backup-before-refactor
```

### Testing Strategy

1. Run TypeScript compilation after each phase
2. Run unit tests after each phase
3. Test API endpoints manually after each phase
4. Keep old structure until new structure is validated

## Success Criteria

- [ ] All 97+ utility files moved to appropriate directories
- [ ] Backend root directory clean (only essential files)
- [ ] Zero duplicate service files
- [ ] All routes organized by domain
- [ ] All services organized by domain
- [ ] TypeScript compilation succeeds
- [ ] All tests pass
- [ ] All API endpoints functional
- [ ] No breaking changes to API contracts

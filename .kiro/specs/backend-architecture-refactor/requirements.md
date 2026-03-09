# Backend Architecture Refactor - Requirements

## Overview

Clean up and improve the backend architecture by organizing code into clear domains, removing duplicates, and separating production code from development utilities.

## User Stories

### 1. As a developer, I want a clean backend structure

**Acceptance Criteria:**

- Clear separation between production code and development utilities
- No duplicate service files (.js and .ts versions)
- Logical domain-based folder organization
- Easy to find and understand code organization

### 2. As a developer, I want organized development utilities

**Acceptance Criteria:**

- All test scripts in dedicated test directory
- All migration scripts in migrations directory
- All debug/check scripts in scripts directory
- Clear naming conventions for utility files

### 3. As a developer, I want clear domain boundaries

**Acceptance Criteria:**

- Routes grouped by domain (auth, curriculum, documents, etc.)
- Services grouped by domain
- Clear responsibility separation
- Minimal cross-domain dependencies

### 4. As a developer, I want maintainable service layer

**Acceptance Criteria:**

- Single source of truth for each service
- No .js/.ts duplicates
- Consistent export patterns
- Clear service interfaces

### 5. As a developer, I want safe refactoring

**Acceptance Criteria:**

- No breaking changes to existing functionality
- Incremental migration approach
- Backward compatibility maintained
- Clear migration documentation

## Technical Requirements

### Code Organization

- Separate production code from development utilities
- Group related functionality by domain
- Remove duplicate implementations
- Standardize file naming conventions

### Domain Structure

Organize code into these domains:

- **Auth & Identity**: Authentication, authorization, users, roles, permissions
- **Curriculum**: Frameworks, courses, units, resources, mappings
- **Documents**: Document management, OCR, file processing
- **Assignments**: Assignment management, submissions, grading
- **Games**: Gamification, game management
- **Analytics**: Reports, exports, analytics
- **System**: System management, audit logs, maintenance

### File Cleanup

- Move 97+ test/check/debug scripts to appropriate directories
- Archive or remove obsolete files
- Consolidate duplicate service implementations
- Remove temporary/experimental files

### Service Layer Improvements

- Resolve duplicate courseService.js/courseService.ts
- Resolve duplicate curriculumService.js/curriculumService.ts
- Standardize service export patterns
- Improve service interfaces

## Out of Scope

- Complete rewrite of business logic
- Database schema changes
- API endpoint changes (maintain backward compatibility)
- Performance optimization (separate task)

## Success Metrics

- Zero duplicate service files
- All test/debug scripts organized in dedicated directories
- Clear domain-based folder structure
- No breaking changes to existing functionality
- Improved code discoverability

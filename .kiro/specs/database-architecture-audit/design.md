# Database Architecture Audit - Design Document

## Executive Summary

The Prisma schema has grown to 240 models and 182 enums in a single 5,444-line file. This monolithic structure creates significant maintainability, performance, and scalability challenges.

This document provides a comprehensive analysis and proposes an incremental refactoring strategy to split the schema into manageable bounded contexts.

## Current State Analysis

### Schema Statistics

```
Total Lines:        5,444
Total Models:       240
Total Enums:        182
Enum/Model Ratio:   0.76 (nearly 1:1)
Average Model Size: ~23 lines
Largest Domain:     Curriculum (~40 models)
```

### Critical Issues

#### 1. Monolithic Schema File (CRITICAL)

**Problem:**

- Single 5,444-line schema.prisma file
- All 240 models in one file
- Impossible to navigate effectively
- Slow Prisma client generation (>60 seconds)
- Git merge conflicts common

**Evidence:**

```bash
$ wc -l backend/prisma/schema.prisma
5444 backend/prisma/schema.prisma

$ grep -c "^model " backend/prisma/schema.prisma
240

$ grep -c "^enum " backend/prisma/schema.prisma
182
```

**Impact:**

- Developer productivity loss
- Difficult code reviews
- High cognitive load
- Team collaboration issues

#### 2. Enum Explosion (CRITICAL)

**Problem:**

- 182 enums for 240 models (76% ratio)
- Many enums with only 2-3 values
- Enum for every status field
- Requires migration to add values

**Examples:**

```prisma
// Simple status enum - could be string
enum assignment_practice_sessions_status {
  in_progress
  completed
  abandoned
}

// Another simple enum
enum attendance_records_status {
  present
  absent
  late
  excused
}

// Overly specific enum
enum calendar_event_participants_role {
  attendee
  host
  teacher
  student
  staff
  proctor
}
```

**Impact:**

- Schema bloat
- Inflexible (requires migrations)
- Difficult to extend
- Poor developer experience

**Recommendation:**
Convert simple enums (< 5 values, rarely changing) to string fields with application-level validation.

#### 3. Weak Domain Boundaries (HIGH)

**Problem:**
All domains mixed in single schema with no clear separation:

**Domains Identified:**

1. **Core Identity** (20 models)
   - users, tenants, campuses, roles, permissions

2. **Curriculum Management** (40 models)
   - curriculum_frameworks, curriculum_framework_versions
   - courses, course_templates, units, resources
   - kct_mappings, curriculum_tags

3. **Class Management** (30 models)
   - classes, class_sessions, class_enrollments
   - class_teachers, class_policies, class_schedules

4. **Assignments** (35 models)
   - assignments, assignment_questions, assignment_submissions
   - assignment_collections, assignment_passages
   - assignment_practice_sessions

5. **Exams** (25 models)
   - exam_templates, exam_events, exam_registrations
   - exam_sections, exam_items, exam_attempts
   - proctoring_sessions, proctoring_events

6. **Documents** (15 models)
   - documents, document_collections, document_permissions
   - document_processing_jobs, document_ai_tasks

7. **Gamification** (15 models)
   - games, game_sessions, game_leaderboards
   - points_transactions, badges, streaks, quests

8. **Attendance** (12 models)
   - attendance_records, attendance_checkins
   - attendance_adjustments, attendance_summary

9. **Calendar** (10 models)
   - calendar_events, calendar_event_participants
   - recurrence_rules, external_calendars

10. **Billing** (8 models)
    - billing_plans, subscriptions, invoices, payments

11. **Communications** (8 models)
    - notifications, scheduled_notifications
    - posts, post_reactions, surveys

12. **Analytics** (8 models)
    - learning_analytics, completion_tracking
    - dropout_risk_flags, grade_adjustments

13. **Certificates** (6 models)
    - certificate_templates, certificate_issuances
    - certificate_verifications

14. **Activities** (8 models)
    - activity_templates, session_activities
    - activity_responses, activity_participation

**Impact:**

- No clear ownership
- Cross-domain coupling
- Difficult to scale teams
- Hard to extract services
- Unclear dependencies

#### 4. Missing Index Strategy (HIGH)

**Problem:**

- Inconsistent index naming conventions
- Many foreign keys without indexes
- No documented indexing strategy
- Missing composite indexes for common queries

**Examples of Missing Indexes:**

```prisma
// Foreign key without index
model assignment_submissions {
  assignment_id BigInt
  // Missing: @@index([assignment_id])
}

// Common query pattern without composite index
model class_sessions {
  class_id BigInt
  session_date DateTime
  // Missing: @@index([class_id, session_date])
}

// Frequently filtered field without index
model documents {
  status String
  // Missing: @@index([status])
}
```

**Impact:**

- Slow queries on large tables
- Full table scans
- Poor database performance
- Difficult to optimize

#### 5. Cascade Delete Risks (MEDIUM)

**Problem:**

- Extensive use of `onDelete: Cascade`
- Risk of accidental data loss
- No soft delete strategy
- Difficult to recover deleted data

**Examples:**

```prisma
model assignment_submissions {
  assignments assignments @relation(fields: [assignment_id], references: [id], onDelete: Cascade)
  // If assignment deleted, all submissions deleted!
}

model class_enrollments {
  classes classes @relation(fields: [class_id], references: [id], onDelete: Cascade)
  // If class deleted, all enrollments deleted!
}
```

**Impact:**

- Data loss risk
- No audit trail
- Difficult recovery
- Compliance issues

#### 6. Naming Inconsistencies (LOW)

**Problem:**

- Mixed naming conventions
- Inconsistent pluralization
- Unclear abbreviations

**Examples:**

```prisma
// Inconsistent pluralization
model users { }          // plural
model audit_logs { }     // plural
model kct_mappings { }   // plural

// vs

model approvals { }      // plural but singular concept

// Unclear abbreviations
model kct_mappings { }   // What is KCT?
model qa_threads { }     // QA = Quality Assurance? Question & Answer?
```

**Impact:**

- Confusion
- Difficult to search
- Poor discoverability

## Proposed Solution

### 1. Domain-Based Schema Organization

#### Strategy: Prisma Multi-Schema Feature

Prisma supports multiple schema files that can be combined. Split the monolithic schema into domain-specific files:

```
backend/prisma/
├── schema.prisma              # Main schema (datasource + generator)
├── schemas/
│   ├── core/
│   │   ├── identity.prisma    # users, tenants, roles, permissions
│   │   └── audit.prisma       # audit_logs, change_history
│   ├── curriculum/
│   │   ├── frameworks.prisma  # curriculum_frameworks, versions
│   │   ├── courses.prisma     # courses, course_templates
│   │   └── units.prisma       # units, resources, mappings
│   ├── classes/
│   │   ├── classes.prisma     # classes, class_sessions
│   │   ├── enrollments.prisma # class_enrollments, class_teachers
│   │   └── policies.prisma    # class_policies, class_schedules
│   ├── assignments/
│   │   ├── assignments.prisma # assignments, questions
│   │   ├── submissions.prisma # assignment_submissions
│   │   └── collections.prisma # assignment_collections
│   ├── exams/
│   │   ├── templates.prisma   # exam_templates, exam_sections
│   │   ├── events.prisma      # exam_events, exam_registrations
│   │   └── proctoring.prisma  # proctoring_sessions, proctoring_events
│   ├── documents/
│   │   └── documents.prisma   # documents, collections, processing
│   ├── gamification/
│   │   ├── games.prisma       # games, game_sessions
│   │   └── points.prisma      # points_transactions, badges, streaks
│   ├── attendance/
│   │   └── attendance.prisma  # attendance_records, checkins
│   ├── calendar/
│   │   └── calendar.prisma    # calendar_events, recurrence_rules
│   ├── billing/
│   │   └── billing.prisma     # billing_plans, subscriptions, invoices
│   ├── communications/
│   │   └── communications.prisma # notifications, posts, surveys
│   ├── analytics/
│   │   └── analytics.prisma   # learning_analytics, tracking
│   ├── certificates/
│   │   └── certificates.prisma # certificate_templates, issuances
│   └── activities/
│       └── activities.prisma  # activity_templates, responses
└── enums/
    ├── core.prisma            # Core enums
    ├── curriculum.prisma      # Curriculum enums
    ├── assignments.prisma     # Assignment enums
    └── ...                    # Other domain enums
```

#### Main schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// Import all domain schemas
import "schemas/core/identity.prisma"
import "schemas/core/audit.prisma"
import "schemas/curriculum/frameworks.prisma"
import "schemas/curriculum/courses.prisma"
// ... etc
```

**Benefits:**

- Each file < 500 lines
- Clear domain boundaries
- Easy to navigate
- Faster Prisma generation
- Better team collaboration
- Easier code reviews

### 2. Enum Reduction Strategy

#### Convert Simple Enums to Strings

**Criteria for Conversion:**

- Enum has < 5 values
- Values rarely change
- No complex validation needed
- Used in only 1-2 models

**Example:**

```prisma
// BEFORE: Enum (requires migration to add values)
enum assignment_practice_sessions_status {
  in_progress
  completed
  abandoned
}

model assignment_practice_sessions {
  status assignment_practice_sessions_status @default(in_progress)
}

// AFTER: String with validation
model assignment_practice_sessions {
  status String @default("in_progress") @db.VarChar(32)
  // Validation in application code:
  // const VALID_STATUSES = ['in_progress', 'completed', 'abandoned'];
}
```

**Keep Enums For:**

- Complex state machines
- Values used across many models
- Values that need database-level validation
- Values that change frequently

**Target:** Reduce from 182 enums to ~60 enums (67% reduction)

### 3. Index Optimization Strategy

#### A. Index All Foreign Keys

```prisma
model assignment_submissions {
  assignment_id BigInt
  student_user_id BigInt

  assignments assignments @relation(...)
  users users @relation(...)

  // Add indexes for foreign keys
  @@index([assignment_id])
  @@index([student_user_id])
}
```

#### B. Composite Indexes for Common Queries

```prisma
model class_sessions {
  class_id BigInt
  session_date DateTime
  status String

  // Common query: Get sessions for class by date
  @@index([class_id, session_date])

  // Common query: Get active sessions for class
  @@index([class_id, status])
}
```

#### C. Index Frequently Filtered Fields

```prisma
model documents {
  tenant_id BigInt
  status String
  created_at DateTime

  // Common filters
  @@index([tenant_id, status])
  @@index([created_at])
}
```

#### D. Unique Constraints for Business Rules

```prisma
model class_enrollments {
  class_id BigInt
  student_user_id BigInt

  // Business rule: Student can only enroll once per class
  @@unique([class_id, student_user_id])
}
```

### 4. Soft Delete Implementation

#### Add deleted_at to Critical Models

```prisma
model assignments {
  id BigInt @id @default(autoincrement())
  // ... other fields
  deleted_at DateTime? @db.Timestamp(0)

  // Index for filtering out deleted records
  @@index([deleted_at])
}

// Query pattern:
// Active: WHERE deleted_at IS NULL
// Deleted: WHERE deleted_at IS NOT NULL
// All: No filter
```

#### Models Requiring Soft Delete:

- assignments
- classes
- users
- documents
- curriculum_frameworks
- exams
- courses

### 5. Cascade Behavior Review

#### Replace Cascade with Restrict + Application Logic

```prisma
// BEFORE: Risky cascade
model assignment_submissions {
  assignments assignments @relation(fields: [assignment_id], references: [id], onDelete: Cascade)
}

// AFTER: Safer restrict
model assignment_submissions {
  assignments assignments @relation(fields: [assignment_id], references: [id], onDelete: Restrict)
}

// Application handles deletion:
// 1. Check if assignment has submissions
// 2. If yes, prevent deletion or soft delete
// 3. If no, allow deletion
```

#### Keep Cascade For:

- Truly dependent data (e.g., assignment_questions → assignment)
- Audit logs (can be cascaded)
- Temporary data (e.g., sessions, tokens)

### 6. Naming Conventions

#### Establish Clear Rules:

```prisma
// ✅ GOOD: Plural table names
model users { }
model assignments { }
model classes { }

// ✅ GOOD: Clear relationship names
model class_enrollments { }  // Many-to-many
model class_teachers { }     // Many-to-many

// ✅ GOOD: Descriptive field names
model users {
  full_name String
  email String
  created_at DateTime
}

// ❌ BAD: Abbreviations
model kct_mappings { }  // What is KCT?

// ✅ GOOD: Full names
model curriculum_framework_mappings { }
```

## Implementation Plan

### Phase 1: Assessment & Documentation (Week 1-2)

**Goal:** Understand current state and plan changes

**Tasks:**

1. Map all 240 models to domains
2. Identify all cascade delete relationships
3. Document current pain points
4. Identify top 10 slowest queries
5. Create domain ownership matrix

**Deliverables:**

- Domain mapping document
- Cascade delete audit
- Query performance report
- Schema governance rules

### Phase 2: Quick Wins (Week 3-4)

**Goal:** Immediate improvements without breaking changes

**Tasks:**

1. Add missing indexes on foreign keys
2. Add composite indexes for common queries
3. Document schema change process
4. Set up schema review checklist

**Deliverables:**

- Index optimization migration
- Schema governance document
- Review checklist

### Phase 3: Domain Separation (Month 2-3)

**Goal:** Split schema into domain files

**Tasks:**

1. Create domain-specific schema files
2. Move models to appropriate domains
3. Update imports in main schema
4. Test Prisma generation
5. Update documentation

**Deliverables:**

- Domain-separated schema files
- Updated documentation
- Migration guide

### Phase 4: Enum Reduction (Month 3-4)

**Goal:** Reduce enum count by 60%

**Tasks:**

1. Identify enums to convert
2. Create migration scripts
3. Update application code
4. Test thoroughly
5. Deploy incrementally

**Deliverables:**

- Enum conversion migrations
- Updated application code
- Test coverage

### Phase 5: Soft Delete Implementation (Month 4-5)

**Goal:** Add soft delete to critical models

**Tasks:**

1. Add deleted_at fields
2. Update queries to filter deleted
3. Create restore functionality
4. Update cascade behavior
5. Test thoroughly

**Deliverables:**

- Soft delete migrations
- Updated query patterns
- Restore functionality

### Phase 6: Cascade Review (Month 5-6)

**Goal:** Safer cascade behavior

**Tasks:**

1. Review all cascade deletes
2. Replace risky cascades with restrict
3. Implement application-level deletion logic
4. Add deletion safeguards
5. Test thoroughly

**Deliverables:**

- Cascade behavior migrations
- Deletion logic in application
- Safeguards and warnings

## Risk Assessment

| Phase   | Risk Level | Mitigation                         |
| ------- | ---------- | ---------------------------------- |
| Phase 1 | LOW        | Documentation only                 |
| Phase 2 | LOW        | Additive changes (indexes)         |
| Phase 3 | MEDIUM     | Test Prisma generation thoroughly  |
| Phase 4 | HIGH       | Incremental rollout, feature flags |
| Phase 5 | MEDIUM     | Backward compatible queries        |
| Phase 6 | HIGH       | Extensive testing, gradual rollout |

## Success Criteria

- [ ] Schema split into < 20 domain files
- [ ] Each file < 500 lines
- [ ] Prisma generation < 30 seconds
- [ ] Zero missing indexes on foreign keys
- [ ] Enum count reduced by 60%
- [ ] Soft delete on 20+ critical models
- [ ] Cascade deletes reduced by 50%
- [ ] Clear domain ownership documented
- [ ] Schema governance rules established
- [ ] Zero production incidents from changes

## Maintenance Strategy

### Schema Governance Rules

1. **New Model Checklist:**
   - [ ] Belongs to clear domain
   - [ ] Has appropriate indexes
   - [ ] Uses soft delete if critical
   - [ ] Cascade behavior reviewed
   - [ ] Naming follows conventions
   - [ ] Reviewed by team

2. **Schema Change Process:**
   - Create migration script
   - Test on staging
   - Review with team
   - Deploy during low traffic
   - Monitor for issues
   - Have rollback plan

3. **Performance Monitoring:**
   - Track slow queries
   - Monitor Prisma generation time
   - Review index usage
   - Optimize as needed

4. **Documentation:**
   - Keep domain map updated
   - Document all relationships
   - Maintain migration history
   - Update governance rules

## Conclusion

The database schema requires significant refactoring to improve maintainability and performance. The proposed incremental approach allows for safe, gradual improvements over 6 months without disrupting operations.

**Priority:** Start with Phase 1-2 immediately (assessment and quick wins), then proceed with domain separation and enum reduction.

# Database Architecture - Action Plan

## Immediate Actions (Week 1-2)

### 1. Schema Assessment

**Owner:** Database Team  
**Duration:** 3 days  
**Priority:** P0

**Tasks:**

- [ ] Count models per domain (use grep/analysis script)
- [ ] Map all 240 models to 15 domains
- [ ] Identify cross-domain dependencies
- [ ] Document current pain points from team

**Script to help:**

```bash
# Count models
grep -c "^model " backend/prisma/schema.prisma

# List all models
grep "^model " backend/prisma/schema.prisma | awk '{print $2}'

# Count enums
grep -c "^enum " backend/prisma/schema.prisma
```

**Deliverable:** `DOMAIN-MAPPING.md` with all models categorized

---

### 2. Index Audit

**Owner:** Database Team  
**Duration:** 2 days  
**Priority:** P0

**Tasks:**

- [ ] Identify all foreign keys without indexes
- [ ] Find top 10 slowest queries
- [ ] Identify missing composite indexes
- [ ] Create index optimization migration

**Query to find missing indexes:**

```sql
-- Find foreign keys without indexes
SELECT
  TABLE_NAME,
  COLUMN_NAME,
  CONSTRAINT_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE
  REFERENCED_TABLE_NAME IS NOT NULL
  AND TABLE_SCHEMA = 'your_database'
  AND COLUMN_NAME NOT IN (
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = 'your_database'
  );
```

**Deliverable:** `INDEX-OPTIMIZATION.sql` migration script

---

### 3. Cascade Delete Audit

**Owner:** Database Team  
**Duration:** 2 days  
**Priority:** P1

**Tasks:**

- [ ] List all models with `onDelete: Cascade`
- [ ] Identify risky cascades (user data, submissions, etc.)
- [ ] Document cascade behavior for each relationship
- [ ] Create risk assessment matrix

**Script to find cascades:**

```bash
grep -n "onDelete: Cascade" backend/prisma/schema.prisma | wc -l
```

**Deliverable:** `CASCADE-AUDIT.md` with risk assessment

---

### 4. Establish Governance

**Owner:** Tech Lead  
**Duration:** 2 days  
**Priority:** P0

**Tasks:**

- [ ] Create schema change checklist
- [ ] Document review process
- [ ] Set up schema change approval workflow
- [ ] Create migration testing guidelines

**Deliverable:** `SCHEMA-GOVERNANCE.md` (see below)

---

## Quick Wins (Week 3-4)

### 5. Add Missing Indexes

**Owner:** Database Team  
**Duration:** 3 days  
**Priority:** P0

**Tasks:**

- [ ] Create migration for missing FK indexes
- [ ] Add composite indexes for common queries
- [ ] Test on staging database
- [ ] Monitor query performance
- [ ] Deploy to production

**Example Migration:**

```prisma
// Add missing indexes
model assignment_submissions {
  // ... existing fields

  @@index([assignment_id])  // NEW
  @@index([student_user_id])  // NEW
  @@index([assignment_id, student_user_id])  // NEW composite
  @@index([created_at])  // NEW for sorting
}
```

**Deliverable:** Deployed index optimization

---

### 6. Document Domain Boundaries

**Owner:** Tech Lead + Team  
**Duration:** 3 days  
**Priority:** P1

**Tasks:**

- [ ] Create domain ownership matrix
- [ ] Document cross-domain dependencies
- [ ] Identify bounded contexts
- [ ] Plan domain separation strategy

**Deliverable:** `DOMAIN-BOUNDARIES.md`

---

## Medium-Term (Month 2-3)

### 7. Split Schema by Domain

**Owner:** Database Team  
**Duration:** 2 weeks  
**Priority:** P1

**Tasks:**

- [ ] Create domain-specific schema files
- [ ] Move models to appropriate files
- [ ] Update main schema with imports
- [ ] Test Prisma generation
- [ ] Update documentation
- [ ] Deploy changes

**Structure:**

```
backend/prisma/
├── schema.prisma (main)
├── schemas/
│   ├── core/
│   │   └── identity.prisma (20 models)
│   ├── curriculum/
│   │   ├── frameworks.prisma (15 models)
│   │   ├── courses.prisma (15 models)
│   │   └── units.prisma (10 models)
│   ├── assignments/
│   │   └── assignments.prisma (35 models)
│   └── ... (other domains)
```

**Deliverable:** Domain-separated schema

---

### 8. Reduce Enum Count

**Owner:** Backend Team  
**Duration:** 2 weeks  
**Priority:** P2

**Tasks:**

- [ ] Identify enums to convert (< 5 values)
- [ ] Create conversion migration
- [ ] Update application validation
- [ ] Test thoroughly
- [ ] Deploy incrementally

**Target:** Reduce from 182 to ~60 enums

**Deliverable:** Enum reduction migration

---

## Long-Term (Month 4-6)

### 9. Implement Soft Deletes

**Owner:** Backend Team  
**Duration:** 3 weeks  
**Priority:** P2

**Tasks:**

- [ ] Add deleted_at to critical models
- [ ] Update all queries to filter deleted
- [ ] Create restore functionality
- [ ] Update cascade behavior
- [ ] Test thoroughly
- [ ] Deploy incrementally

**Models requiring soft delete:**

- users
- assignments
- classes
- documents
- curriculum_frameworks
- exams
- courses

**Deliverable:** Soft delete implementation

---

### 10. Review Cascade Behavior

**Owner:** Database Team  
**Duration:** 2 weeks  
**Priority:** P2

**Tasks:**

- [ ] Replace risky cascades with restrict
- [ ] Implement application-level deletion
- [ ] Add deletion safeguards
- [ ] Test thoroughly
- [ ] Deploy incrementally

**Deliverable:** Safer cascade behavior

---

## Schema Governance Checklist

### For Every Schema Change

#### Before Making Changes

- [ ] Change belongs to clear domain
- [ ] Change reviewed by team
- [ ] Migration script created
- [ ] Rollback plan documented
- [ ] Impact assessment completed

#### Schema Quality Checks

- [ ] Model name follows conventions (plural, snake_case)
- [ ] All foreign keys have indexes
- [ ] Appropriate cascade behavior (prefer Restrict)
- [ ] Soft delete considered for critical data
- [ ] Enums justified (or use string)
- [ ] Composite indexes for common queries

#### Testing Requirements

- [ ] Migration tested on local database
- [ ] Migration tested on staging database
- [ ] Query performance tested
- [ ] Application code updated
- [ ] Tests updated
- [ ] Documentation updated

#### Deployment Checklist

- [ ] Migration reviewed by DBA
- [ ] Deployment window scheduled
- [ ] Rollback script ready
- [ ] Monitoring alerts configured
- [ ] Team notified of changes

---

## Schema Change Review Template

```markdown
## Schema Change Request

**Date:** YYYY-MM-DD
**Author:** [Name]
**Domain:** [Domain Name]
**Priority:** [P0/P1/P2/P3]

### Change Description

[Describe the change]

### Reason for Change

[Why is this change needed?]

### Models Affected

- model_name_1
- model_name_2

### Migration Strategy

[How will this be migrated?]

### Rollback Plan

[How to rollback if needed?]

### Performance Impact

[Expected impact on query performance]

### Risk Assessment

- **Risk Level:** [LOW/MEDIUM/HIGH]
- **Data Loss Risk:** [YES/NO]
- **Breaking Change:** [YES/NO]

### Testing Plan

- [ ] Local testing completed
- [ ] Staging testing completed
- [ ] Performance testing completed
- [ ] Application code updated
- [ ] Tests updated

### Approval

- [ ] Tech Lead: [Name]
- [ ] DBA: [Name]
- [ ] Domain Owner: [Name]
```

---

## Performance Monitoring

### Queries to Monitor

```sql
-- Slow queries (> 1 second)
SELECT
  query_time,
  lock_time,
  rows_examined,
  sql_text
FROM mysql.slow_log
WHERE query_time > 1
ORDER BY query_time DESC
LIMIT 20;

-- Missing indexes (high rows examined)
SELECT
  table_name,
  index_name,
  cardinality,
  rows_examined
FROM information_schema.statistics
WHERE cardinality < 100
ORDER BY rows_examined DESC;

-- Table sizes
SELECT
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'your_database'
ORDER BY size_mb DESC
LIMIT 20;
```

### Metrics to Track

- Prisma client generation time (target: < 30s)
- Average query response time (target: < 100ms)
- Slow query count (target: < 10/day)
- Database size growth (monitor monthly)
- Index usage (ensure all indexes used)

---

## Migration Testing Procedure

### 1. Local Testing

```bash
# Create test database
mysql -u root -p -e "CREATE DATABASE test_migration"

# Run migration
npx prisma migrate dev --name test_migration

# Test queries
npm run test:integration

# Rollback
npx prisma migrate reset
```

### 2. Staging Testing

```bash
# Backup staging database
mysqldump -u user -p staging_db > backup.sql

# Run migration
npx prisma migrate deploy

# Run smoke tests
npm run test:smoke

# Monitor for 24 hours

# Rollback if needed
mysql -u user -p staging_db < backup.sql
```

### 3. Production Deployment

```bash
# Schedule maintenance window
# Backup production database
# Run migration during low traffic
# Monitor closely for 1 hour
# Keep rollback script ready
```

---

## Success Metrics

### Week 1-2 (Assessment)

- [ ] All 240 models mapped to domains
- [ ] Top 10 slow queries identified
- [ ] Cascade delete audit completed
- [ ] Governance rules established

### Week 3-4 (Quick Wins)

- [ ] All foreign keys have indexes
- [ ] Composite indexes added
- [ ] Query performance improved by 30%
- [ ] Domain boundaries documented

### Month 2-3 (Domain Separation)

- [ ] Schema split into 15 domain files
- [ ] Each file < 500 lines
- [ ] Prisma generation < 30 seconds
- [ ] Zero breaking changes

### Month 4-6 (Optimization)

- [ ] Enum count reduced by 60%
- [ ] Soft delete on 20+ models
- [ ] Cascade deletes reduced by 50%
- [ ] Zero production incidents

---

## Rollback Procedures

### For Index Changes

```sql
-- Rollback: Drop added indexes
DROP INDEX idx_name ON table_name;
```

### For Schema Splits

```bash
# Rollback: Revert to monolithic schema
git revert <commit-hash>
npx prisma generate
```

### For Enum Conversions

```sql
-- Rollback: Convert string back to enum
ALTER TABLE table_name
MODIFY COLUMN status ENUM('value1', 'value2');
```

### For Soft Deletes

```sql
-- Rollback: Remove deleted_at column
ALTER TABLE table_name DROP COLUMN deleted_at;
```

---

## Communication Plan

### Weekly Updates

- Share progress with team
- Highlight any blockers
- Celebrate wins

### Monthly Reviews

- Review metrics
- Adjust plan as needed
- Gather feedback

### Stakeholder Updates

- Monthly summary to leadership
- Highlight business impact
- Request resources if needed

---

## Resources Needed

### Team

- 1 Database Architect (50% time, 6 months)
- 2 Backend Developers (25% time, 6 months)
- 1 Tech Lead (10% time, 6 months)

### Tools

- Database monitoring (already have)
- Migration testing environment (already have)
- Performance profiling tools (may need)

### Budget

- Minimal (mostly internal resources)
- Possible consulting for complex migrations

---

## Risk Mitigation

### High-Risk Changes

- Enum conversions
- Cascade behavior changes
- Soft delete implementation

**Mitigation:**

- Feature flags
- Incremental rollout
- Extensive testing
- Quick rollback capability

### Medium-Risk Changes

- Schema splitting
- Index additions

**Mitigation:**

- Thorough testing
- Staging validation
- Monitoring

### Low-Risk Changes

- Documentation
- Governance rules

**Mitigation:**

- Team review
- Continuous improvement

---

## Next Steps

1. **This Week:**
   - Review this action plan with team
   - Assign owners for each task
   - Schedule kickoff meeting
   - Begin schema assessment

2. **Next Week:**
   - Complete domain mapping
   - Complete index audit
   - Complete cascade audit
   - Establish governance

3. **Month 1:**
   - Deploy index optimizations
   - Document domain boundaries
   - Begin schema splitting

4. **Ongoing:**
   - Monitor metrics
   - Adjust plan as needed
   - Communicate progress
   - Celebrate wins

---

## Questions?

Contact the Database Team for:

- Schema change reviews
- Migration assistance
- Performance optimization
- Governance questions

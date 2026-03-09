# Database Expansion Guide: 31 → 248 Tables

This guide explains how to expand your database from the current 31 tables to 248 tables following the optimal expansion strategy.

## 📋 Overview

The expansion adds 217 new tables organized into these modules:
- **Student Management** (8 tables)
- **Class & Session Management** (12 tables) 
- **Assessment & Grading** (25 tables)
- **Exam System** (20 tables)
- **Gamification Engine** (18 tables)
- **Document Library** (15 tables)
- **Activity Bank** (12 tables)
- **Communication & QA** (8 tables)
- **Calendar & Events** (10 tables)
- **Staff Management** (12 tables)
- **Billing & CRM** (15 tables)
- **Quality Assurance** (8 tables)
- **External Integrations** (10 tables)
- **And many more...**

## 🚀 Quick Start

### Option 1: Complete Automated Expansion (Recommended)

Run the complete expansion process with one command:

```bash
cd backend
node expand-database.js
```

This will:
1. ✅ Create database backup
2. ✅ Run pre-expansion validation
3. ✅ Execute all migrations in phases
4. ✅ Run post-expansion validation
5. ✅ Update Prisma schema
6. ✅ Test database connection
7. ✅ Generate comprehensive report

### Option 2: Step-by-Step Manual Process

If you prefer more control, run each step manually:

```bash
cd backend

# 1. Run database expansion
node run-database-expansion.js

# 2. Validate the expansion
node validate-database-expansion.js

# 3. Update Prisma schema
node update-prisma-schema.js

# 4. Test the connection
node test-prisma.js
```

## 📊 Migration Phases

The expansion is organized into 13 phases for optimal dependency management:

### Phase 1: Foundation & RBAC
- `010-rbac-and-organization.sql`
- `011-add-mfa-to-users.sql`

### Phase 2: Student & Class Management  
- `040-students-enrollment-attendance.sql`
- `050-session-plans-and-materials.sql`
- `110-student-groups-and-sessions.sql`

### Phase 3: Assessment & Assignments
- `060-assessment-assignments-gradebook.sql`
- `180-assignment-question-bank.sql`
- `200-assignments-games-pivots.sql`

### Phase 4: Gamification & Engagement
- `190-games-gamification.sql`
- `600-points-economy-core.sql`
- `610-store-and-rewards.sql`
- `620-streaks-and-quests.sql`

### Phase 5: Document Library
- `400-document-library-core-extensions.sql`
- `410-document-library-ingestion-and-processing.sql`
- `420-document-library-derivatives-and-pages.sql`
- `430-document-library-sharing-permissions.sql`

### Phase 6-13: Advanced Features
- Advanced class management
- Exam system
- Business operations
- Analytics & reporting
- Staff management
- Activity bank
- External integrations

## 🔧 Prerequisites

Before running the expansion:

1. **Database Connection**: Ensure your `.env` file has correct database credentials:
   ```env
   DB_HOST=your-host
   DB_PORT=3306
   DB_USERNAME=your-username
   DB_PASSWORD=your-password
   DB_DATABASE=your-database
   ```

2. **Backup**: The script automatically creates backups, but consider manual backup for critical data:
   ```bash
   mysqldump -h host -u user -p database > backup.sql
   ```

3. **Permissions**: Ensure database user has CREATE, ALTER, DROP, INDEX permissions

4. **Disk Space**: Ensure sufficient disk space (expansion may double database size)

## 📈 Expected Results

After successful expansion:

- **Tables**: 31 → 248 (+217 tables)
- **Foreign Keys**: ~50 → ~400+ constraints
- **Indexes**: Comprehensive indexing for performance
- **Features**: Full ERP education system capabilities

## 🔍 Validation & Testing

The expansion includes comprehensive validation:

### Automatic Validation
- ✅ Table structure validation
- ✅ Foreign key integrity checks
- ✅ Index coverage analysis
- ✅ Data consistency verification

### Manual Testing
After expansion, test key functionality:

```bash
# Test basic database connection
node test-prisma.js

# Test API endpoints
node test-endpoints.js

# Test specific features
node test-assignments.js
node test-courses.js
```

## 📄 Reports & Logs

The expansion generates detailed reports:

- `database-expansion-report.json` - Migration execution details
- `database-validation-report.json` - Validation results
- `prisma-update-report.json` - Schema update details
- `database-expansion-complete-report.json` - Comprehensive summary

## 🚨 Troubleshooting

### Common Issues

**1. Connection Timeout**
```bash
# Increase timeout in .env
DB_CONNECT_TIMEOUT=30000
```

**2. Permission Denied**
```sql
GRANT ALL PRIVILEGES ON database_name.* TO 'username'@'host';
FLUSH PRIVILEGES;
```

**3. Foreign Key Constraint Errors**
- Check if referenced tables exist
- Verify data consistency before expansion

**4. Prisma Schema Issues**
```bash
# Reset and regenerate
npx prisma db pull --force
npx prisma generate
```

### Recovery Process

If expansion fails:

1. **Stop immediately** - Don't continue with partial expansion
2. **Check logs** - Review error messages in reports
3. **Restore backup** if needed:
   ```bash
   mysql -h host -u user -p database < backup.sql
   ```
4. **Fix issues** and retry

## 🎯 Post-Expansion Tasks

After successful expansion:

### 1. Update Application Code
- Review new table relationships
- Update service classes for new features
- Add API endpoints for new functionality

### 2. Update Documentation
- API documentation
- Database schema documentation
- User guides for new features

### 3. Performance Optimization
- Monitor query performance
- Add additional indexes if needed
- Optimize frequently used queries

### 4. Security Review
- Review new permissions and roles
- Update access control policies
- Test security constraints

## 📚 Additional Resources

- [Database Analysis Document](migrations-plan/database-analysis-201-tables.md)
- [Optimal Expansion Strategy](migrations-plan/optimal-expansion-strategy.md)
- [Service Integration Plan](migrations-plan/service-integration-plan.md)

## 🆘 Support

If you encounter issues:

1. Check the generated reports for detailed error information
2. Review the migration files for specific table requirements
3. Ensure all prerequisites are met
4. Consider running phases individually for better error isolation

---

**⚠️ Important**: Always test the expansion on a development/staging environment before applying to production!
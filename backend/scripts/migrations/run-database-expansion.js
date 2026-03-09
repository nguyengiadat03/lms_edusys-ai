#!/usr/bin/env node

/**
 * Database Expansion Script: 31 → 248 Tables
 * 
 * This script runs all migration files in the backend/migrations directory
 * to expand the database from 31 tables to 248 tables following the 
 * optimal expansion strategy.
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MIGRATION_PHASES = [
  {
    name: 'Phase 1: Foundation & RBAC',
    files: ['005-core-missing-tables.sql', '010-rbac-and-organization.sql', '011-add-mfa-to-users.sql'],
    description: 'Core missing tables, RBAC and organizational structure'
  },
  {
    name: 'Phase 2: Student & Class Management',
    files: [
      '040-students-enrollment-attendance.sql',
      '050-session-plans-and-materials.sql',
      '110-student-groups-and-sessions.sql'
    ],
    description: 'Student profiles, class management, and basic attendance'
  },
  {
    name: 'Phase 3: Assessment & Assignments',
    files: [
      '060-assessment-assignments-gradebook.sql',
      '180-assignment-question-bank.sql',
      '200-assignments-games-pivots.sql'
    ],
    description: 'Assessment system and assignment management'
  },
  {
    name: 'Phase 4: Gamification & Engagement',
    files: [
      '190-games-gamification.sql',
      '600-points-economy-core.sql',
      '610-store-and-rewards.sql',
      '620-streaks-and-quests.sql'
    ],
    description: 'Gamification engine and student engagement'
  },
  {
    name: 'Phase 5: Document Library',
    files: [
      '400-document-library-core-extensions.sql',
      '410-document-library-ingestion-and-processing.sql',
      '420-document-library-derivatives-and-pages.sql',
      '430-document-library-sharing-permissions.sql'
    ],
    description: 'Document management with OCR and AI processing'
  },
  {
    name: 'Phase 6: Advanced Features',
    files: [
      '100-class-assignments-and-policies.sql',
      '150-attendance-advanced.sql',
      '510-attendance-qr-and-adjustments.sql',
      '520-session-content-links.sql'
    ],
    description: 'Advanced class management and attendance features'
  },
  {
    name: 'Phase 7: Exam System',
    files: [
      '300-exam-bank.sql',
      '310-exam-events-and-organization.sql',
      '320-exam-attempts-and-logs.sql',
      '330-exam-proctoring.sql',
      '340-exam-grading.sql',
      '350-exam-policies-and-requests.sql'
    ],
    description: 'Comprehensive exam and testing system'
  },
  {
    name: 'Phase 8: Business Operations',
    files: [
      '020-billing-and-payments.sql',
      '030-admissions-and-crm.sql',
      '070-qa-and-surveys.sql',
      '080-communications-and-qa-threads.sql',
      '120-certificates.sql',
      '130-notifications.sql',
      '140-calendar-and-meetings.sql'
    ],
    description: 'Business operations, billing, and communications'
  },
  {
    name: 'Phase 9: Analytics & Reporting',
    files: [
      '090-reporting-and-tracking.sql',
      '160-import-export.sql',
      '170-engagement-and-risk.sql',
      '560-calendar-attendance-analytics.sql'
    ],
    description: 'Analytics, reporting, and data import/export'
  },
  {
    name: 'Phase 10: Staff & Operations',
    files: [
      '530-teacher-attendance-and-timesheets.sql',
      '540-staff-shifts-and-attendance.sql',
      '550-reminder-policies-and-jobs.sql'
    ],
    description: 'Staff management and operational features'
  },
  {
    name: 'Phase 11: Activity Bank & Collections',
    files: [
      '700-activity-bank.sql',
      '710-activity-curriculum-links.sql',
      '720-activity-instances-and-responses.sql',
      '220-collections-and-sharing.sql'
    ],
    description: 'Activity templates and content collections'
  },
  {
    name: 'Phase 12: External Integrations',
    files: [
      '230-external-providers-and-standards.sql',
      '240-student-portfolio.sql',
      '500-calendar-recurrence-and-events.sql'
    ],
    description: 'External integrations and student portfolios'
  },
  {
    name: 'Phase 13: Advanced Gamification',
    files: [
      '210-class-game-assignments.sql',
      '630-grading-policies-and-gamification.sql'
    ],
    description: 'Advanced gamification and grading policies'
  }
];

class DatabaseExpansion {
  constructor() {
    this.dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USERNAME || process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
      database: process.env.DB_DATABASE,
      multipleStatements: true,
      connectTimeout: 30000,
    };
    
    this.connection = null;
    this.results = {
      startTime: new Date(),
      phases: [],
      totalTables: 0,
      errors: [],
      summary: ''
    };
  }

  async connect() {
    try {
      this.connection = await mysql.createConnection(this.dbConfig);
      await this.connection.query('SET NAMES utf8mb4');
      console.log('✅ Database connection established');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      this.results.errors.push(`Connection failed: ${error.message}`);
      return false;
    }
  }

  async getTableCount() {
    try {
      const [rows] = await this.connection.query(
        'SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()'
      );
      return rows[0].count;
    } catch (error) {
      console.error('Error getting table count:', error.message);
      return 0;
    }
  }

  async runMigrationFile(filePath, fileName) {
    try {
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Extract table names from CREATE TABLE statements
      const tableMatches = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?\s*\(/gi);
      const tablesCreated = tableMatches ? 
        tableMatches.map(match => {
          const tableMatch = match.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?\s*\(/i);
          return tableMatch ? tableMatch[1] : null;
        }).filter(Boolean) : [];

      console.log(`  📄 Running ${fileName}...`);
      if (tablesCreated.length > 0) {
        console.log(`     Creating tables: ${tablesCreated.join(', ')}`);
      }

      await this.connection.query(sql);
      
      return {
        fileName,
        status: 'success',
        tablesCreated,
        error: null
      };
    } catch (error) {
      console.error(`  ❌ Error in ${fileName}:`, error.message);
      return {
        fileName,
        status: 'error',
        tablesCreated: [],
        error: error.message
      };
    }
  }

  async runPhase(phase) {
    console.log(`\n🚀 ${phase.name}`);
    console.log(`📝 ${phase.description}`);
    
    const phaseResult = {
      name: phase.name,
      description: phase.description,
      files: [],
      tablesCreated: 0,
      errors: 0,
      startTime: new Date()
    };

    const migrationsDir = path.join(__dirname, 'migrations');
    
    for (const fileName of phase.files) {
      const filePath = path.join(migrationsDir, fileName);
      
      if (!fs.existsSync(filePath)) {
        console.log(`  ⚠️  File not found: ${fileName}`);
        phaseResult.files.push({
          fileName,
          status: 'not_found',
          tablesCreated: [],
          error: 'File not found'
        });
        phaseResult.errors++;
        continue;
      }

      const fileResult = await this.runMigrationFile(filePath, fileName);
      phaseResult.files.push(fileResult);
      
      if (fileResult.status === 'success') {
        phaseResult.tablesCreated += fileResult.tablesCreated.length;
      } else {
        phaseResult.errors++;
      }
    }

    phaseResult.endTime = new Date();
    phaseResult.duration = phaseResult.endTime - phaseResult.startTime;
    
    console.log(`✅ Phase completed: ${phaseResult.tablesCreated} tables created, ${phaseResult.errors} errors`);
    
    return phaseResult;
  }

  async validateDatabase() {
    try {
      console.log('\n🔍 Validating database integrity...');
      
      // Check foreign key constraints
      const [fkRows] = await this.connection.query(`
        SELECT COUNT(*) as fk_count 
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
        WHERE CONSTRAINT_SCHEMA = DATABASE() 
        AND CONSTRAINT_TYPE = 'FOREIGN KEY'
      `);
      
      // Check indexes
      const [idxRows] = await this.connection.query(`
        SELECT COUNT(DISTINCT TABLE_NAME) as indexed_tables 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE()
      `);
      
      console.log(`📊 Foreign key constraints: ${fkRows[0].fk_count}`);
      console.log(`📊 Tables with indexes: ${idxRows[0].indexed_tables}`);
      
      return {
        foreignKeys: fkRows[0].fk_count,
        indexedTables: idxRows[0].indexed_tables
      };
    } catch (error) {
      console.error('❌ Database validation failed:', error.message);
      return null;
    }
  }

  async run() {
    console.log('🎯 Starting Database Expansion: 31 → 248 Tables');
    console.log('=' .repeat(60));

    if (!(await this.connect())) {
      return this.results;
    }

    const initialTableCount = await this.getTableCount();
    console.log(`📊 Initial table count: ${initialTableCount}`);

    // Run all phases
    for (const phase of MIGRATION_PHASES) {
      const phaseResult = await this.runPhase(phase);
      this.results.phases.push(phaseResult);
      
      if (phaseResult.errors > 0) {
        console.log(`⚠️  Phase had ${phaseResult.errors} errors, continuing...`);
      }
    }

    // Final validation
    const finalTableCount = await this.getTableCount();
    const validation = await this.validateDatabase();
    
    this.results.endTime = new Date();
    this.results.duration = this.results.endTime - this.results.startTime;
    this.results.initialTableCount = initialTableCount;
    this.results.finalTableCount = finalTableCount;
    this.results.tablesAdded = finalTableCount - initialTableCount;
    this.results.validation = validation;

    // Generate summary
    const totalErrors = this.results.phases.reduce((sum, phase) => sum + phase.errors, 0);
    const totalTablesCreated = this.results.phases.reduce((sum, phase) => sum + phase.tablesCreated, 0);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 EXPANSION SUMMARY');
    console.log('='.repeat(60));
    console.log(`⏱️  Duration: ${Math.round(this.results.duration / 1000)}s`);
    console.log(`📈 Tables: ${initialTableCount} → ${finalTableCount} (+${this.results.tablesAdded})`);
    console.log(`✅ Tables created: ${totalTablesCreated}`);
    console.log(`❌ Errors: ${totalErrors}`);
    
    if (validation) {
      console.log(`🔗 Foreign keys: ${validation.foreignKeys}`);
      console.log(`📇 Indexed tables: ${validation.indexedTables}`);
    }

    this.results.summary = totalErrors === 0 ? 'SUCCESS' : `COMPLETED_WITH_ERRORS (${totalErrors})`;
    console.log(`🎯 Status: ${this.results.summary}`);

    await this.connection.end();
    return this.results;
  }

  async generateReport() {
    const reportPath = path.join(__dirname, 'database-expansion-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`📄 Report saved to: ${reportPath}`);
  }
}

// Run the expansion
async function main() {
  const expansion = new DatabaseExpansion();
  const results = await expansion.run();
  await expansion.generateReport();
  
  // Exit with appropriate code
  const hasErrors = results.phases.some(phase => phase.errors > 0);
  process.exit(hasErrors ? 1 : 0);
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = DatabaseExpansion;
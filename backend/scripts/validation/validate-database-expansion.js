#!/usr/bin/env node

/**
 * Database Expansion Validation Script
 * 
 * Validates the database expansion by checking:
 * - Table counts and structure
 * - Foreign key integrity
 * - Index coverage
 * - Data consistency
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '.env') });

class DatabaseValidator {
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
    this.expectedTables = this.loadExpectedTables();
  }

  loadExpectedTables() {
    // Load expected tables from the CSV file
    const csvPath = path.join(__dirname, 'migrations', '_tables.csv');
    if (!fs.existsSync(csvPath)) {
      console.warn('⚠️  _tables.csv not found, using basic validation');
      return [];
    }

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').slice(1); // Skip header
    
    return lines
      .filter(line => line.trim())
      .map(line => {
        const [file, table] = line.split(',');
        return { file: file?.trim(), table: table?.trim() };
      })
      .filter(item => item.table);
  }

  async connect() {
    try {
      this.connection = await mysql.createConnection(this.dbConfig);
      await this.connection.query('SET NAMES utf8mb4');
      console.log('✅ Database connection established');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }

  async validateTableStructure() {
    console.log('\n🔍 Validating table structure...');
    
    try {
      // Get all tables in the database
      const [tables] = await this.connection.query(`
        SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME
      `);

      console.log(`📊 Total tables found: ${tables.length}`);
      
      // Check against expected tables
      const expectedTableNames = this.expectedTables.map(t => t.table);
      const actualTableNames = tables.map(t => t.TABLE_NAME);
      
      const missingTables = expectedTableNames.filter(name => !actualTableNames.includes(name));
      const extraTables = actualTableNames.filter(name => !expectedTableNames.includes(name) && 
        !['tenants', 'campuses', 'users', 'curriculum_frameworks', 'curriculum_framework_versions', 
          'course_blueprints', 'unit_blueprints', 'unit_resources', 'kct_mappings', 'tags',
          'curriculum_framework_tags', 'unit_blueprint_tags', 'comments', 'approvals', 
          'saved_views', 'audit_logs', 'kct_usage_tracking', 'learning_outcomes_tracking',
          'settings', 'assignments', 'assignment_practice_sessions', 'games', 'roles',
          'permissions', 'role_permissions', 'user_roles', 'org_units', 'user_org_units',
          'program_definitions', 'program_owners', 'kct_deployments'].includes(name));

      if (missingTables.length > 0) {
        console.log(`❌ Missing tables (${missingTables.length}):`);
        missingTables.forEach(table => console.log(`   - ${table}`));
      }

      if (extraTables.length > 0) {
        console.log(`ℹ️  Extra tables (${extraTables.length}):`);
        extraTables.forEach(table => console.log(`   + ${table}`));
      }

      return {
        totalTables: tables.length,
        expectedTables: expectedTableNames.length,
        missingTables,
        extraTables,
        tables: tables.map(t => ({
          name: t.TABLE_NAME,
          rows: t.TABLE_ROWS,
          dataSize: t.DATA_LENGTH,
          indexSize: t.INDEX_LENGTH
        }))
      };
    } catch (error) {
      console.error('❌ Table structure validation failed:', error.message);
      return null;
    }
  }

  async validateForeignKeys() {
    console.log('\n🔗 Validating foreign key constraints...');
    
    try {
      const [constraints] = await this.connection.query(`
        SELECT 
          TABLE_NAME,
          COLUMN_NAME,
          CONSTRAINT_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND REFERENCED_TABLE_NAME IS NOT NULL
        ORDER BY TABLE_NAME, COLUMN_NAME
      `);

      console.log(`📊 Foreign key constraints: ${constraints.length}`);

      // Check for broken foreign keys
      const brokenFKs = [];
      for (const fk of constraints) {
        try {
          const [rows] = await this.connection.query(`
            SELECT COUNT(*) as broken_count
            FROM \`${fk.TABLE_NAME}\` t1
            LEFT JOIN \`${fk.REFERENCED_TABLE_NAME}\` t2 
              ON t1.\`${fk.COLUMN_NAME}\` = t2.\`${fk.REFERENCED_COLUMN_NAME}\`
            WHERE t1.\`${fk.COLUMN_NAME}\` IS NOT NULL 
              AND t2.\`${fk.REFERENCED_COLUMN_NAME}\` IS NULL
          `);
          
          if (rows[0].broken_count > 0) {
            brokenFKs.push({
              table: fk.TABLE_NAME,
              column: fk.COLUMN_NAME,
              referencedTable: fk.REFERENCED_TABLE_NAME,
              brokenCount: rows[0].broken_count
            });
          }
        } catch (error) {
          console.warn(`⚠️  Could not validate FK ${fk.TABLE_NAME}.${fk.COLUMN_NAME}: ${error.message}`);
        }
      }

      if (brokenFKs.length > 0) {
        console.log(`❌ Broken foreign keys found (${brokenFKs.length}):`);
        brokenFKs.forEach(fk => {
          console.log(`   - ${fk.table}.${fk.column} → ${fk.referencedTable} (${fk.brokenCount} broken)`);
        });
      } else {
        console.log('✅ All foreign key constraints are valid');
      }

      return {
        totalConstraints: constraints.length,
        brokenConstraints: brokenFKs,
        isValid: brokenFKs.length === 0
      };
    } catch (error) {
      console.error('❌ Foreign key validation failed:', error.message);
      return null;
    }
  }

  async validateIndexes() {
    console.log('\n📇 Validating database indexes...');
    
    try {
      const [indexes] = await this.connection.query(`
        SELECT 
          TABLE_NAME,
          INDEX_NAME,
          COLUMN_NAME,
          NON_UNIQUE,
          INDEX_TYPE
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
      `);

      const indexStats = {};
      indexes.forEach(idx => {
        if (!indexStats[idx.TABLE_NAME]) {
          indexStats[idx.TABLE_NAME] = {
            total: 0,
            unique: 0,
            primary: 0
          };
        }
        
        indexStats[idx.TABLE_NAME].total++;
        if (idx.NON_UNIQUE === 0) indexStats[idx.TABLE_NAME].unique++;
        if (idx.INDEX_NAME === 'PRIMARY') indexStats[idx.TABLE_NAME].primary++;
      });

      const tablesWithoutIndexes = Object.keys(indexStats).filter(table => 
        indexStats[table].total === indexStats[table].primary
      );

      console.log(`📊 Total indexes: ${indexes.length}`);
      console.log(`📊 Tables with indexes: ${Object.keys(indexStats).length}`);
      
      if (tablesWithoutIndexes.length > 0) {
        console.log(`⚠️  Tables with only primary key (${tablesWithoutIndexes.length}):`);
        tablesWithoutIndexes.forEach(table => console.log(`   - ${table}`));
      }

      return {
        totalIndexes: indexes.length,
        indexedTables: Object.keys(indexStats).length,
        tablesWithoutIndexes,
        indexStats
      };
    } catch (error) {
      console.error('❌ Index validation failed:', error.message);
      return null;
    }
  }

  async validateDataConsistency() {
    console.log('\n🔍 Validating data consistency...');
    
    try {
      const checks = [];

      // Check tenant consistency
      try {
        const [tenantCheck] = await this.connection.query(`
          SELECT 
            (SELECT COUNT(*) FROM tenants) as tenant_count,
            (SELECT COUNT(DISTINCT tenant_id) FROM users) as user_tenants,
            (SELECT COUNT(DISTINCT tenant_id) FROM curriculum_frameworks) as framework_tenants
        `);
        
        checks.push({
          name: 'Tenant Consistency',
          status: 'success',
          details: `${tenantCheck[0].tenant_count} tenants, ${tenantCheck[0].user_tenants} user tenants, ${tenantCheck[0].framework_tenants} framework tenants`
        });
      } catch (error) {
        checks.push({
          name: 'Tenant Consistency',
          status: 'error',
          details: error.message
        });
      }

      // Check user-role consistency (if tables exist)
      try {
        const [roleCheck] = await this.connection.query(`
          SELECT COUNT(*) as count FROM user_roles ur
          LEFT JOIN users u ON ur.user_id = u.id
          LEFT JOIN roles r ON ur.role_id = r.id
          WHERE u.id IS NULL OR r.id IS NULL
        `);
        
        checks.push({
          name: 'User-Role Consistency',
          status: roleCheck[0].count === 0 ? 'success' : 'warning',
          details: roleCheck[0].count === 0 ? 'All user-role assignments valid' : `${roleCheck[0].count} orphaned assignments`
        });
      } catch (error) {
        checks.push({
          name: 'User-Role Consistency',
          status: 'skipped',
          details: 'Tables not available'
        });
      }

      // Check assignment-session consistency (if tables exist)
      try {
        const [sessionCheck] = await this.connection.query(`
          SELECT COUNT(*) as count FROM assignment_practice_sessions aps
          LEFT JOIN assignments a ON aps.assignment_id = a.id
          LEFT JOIN users u ON aps.user_id = u.id
          WHERE a.id IS NULL OR u.id IS NULL
        `);
        
        checks.push({
          name: 'Assignment-Session Consistency',
          status: sessionCheck[0].count === 0 ? 'success' : 'warning',
          details: sessionCheck[0].count === 0 ? 'All practice sessions valid' : `${sessionCheck[0].count} orphaned sessions`
        });
      } catch (error) {
        checks.push({
          name: 'Assignment-Session Consistency',
          status: 'skipped',
          details: 'Tables not available'
        });
      }

      const successCount = checks.filter(c => c.status === 'success').length;
      const errorCount = checks.filter(c => c.status === 'error').length;
      const warningCount = checks.filter(c => c.status === 'warning').length;

      console.log(`✅ Successful checks: ${successCount}`);
      console.log(`⚠️  Warning checks: ${warningCount}`);
      console.log(`❌ Failed checks: ${errorCount}`);

      checks.forEach(check => {
        const icon = check.status === 'success' ? '✅' : 
                    check.status === 'warning' ? '⚠️' : 
                    check.status === 'error' ? '❌' : 'ℹ️';
        console.log(`   ${icon} ${check.name}: ${check.details}`);
      });

      return {
        checks,
        successCount,
        warningCount,
        errorCount,
        isValid: errorCount === 0
      };
    } catch (error) {
      console.error('❌ Data consistency validation failed:', error.message);
      return null;
    }
  }

  async generateValidationReport() {
    console.log('\n📊 VALIDATION REPORT');
    console.log('='.repeat(60));

    const results = {
      timestamp: new Date().toISOString(),
      database: this.dbConfig.database,
      validations: {}
    };

    // Run all validations
    results.validations.tableStructure = await this.validateTableStructure();
    results.validations.foreignKeys = await this.validateForeignKeys();
    results.validations.indexes = await this.validateIndexes();
    results.validations.dataConsistency = await this.validateDataConsistency();

    // Overall status
    const hasErrors = Object.values(results.validations).some(v => 
      v && ((v.brokenConstraints && v.brokenConstraints.length > 0) || 
            (v.missingTables && v.missingTables.length > 0) ||
            (v.errorCount && v.errorCount > 0))
    );

    results.overallStatus = hasErrors ? 'ISSUES_FOUND' : 'VALID';
    
    console.log(`🎯 Overall Status: ${results.overallStatus}`);
    console.log('='.repeat(60));

    // Save report
    const reportPath = path.join(__dirname, 'database-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);

    return results;
  }

  async run() {
    console.log('🔍 Database Expansion Validation');
    console.log('='.repeat(60));

    if (!(await this.connect())) {
      return null;
    }

    const results = await this.generateValidationReport();
    
    await this.connection.end();
    return results;
  }
}

// Run the validation
async function main() {
  const validator = new DatabaseValidator();
  const results = await validator.run();
  
  if (!results) {
    process.exit(1);
  }

  // Exit with appropriate code
  const hasErrors = results.overallStatus !== 'VALID';
  process.exit(hasErrors ? 1 : 0);
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = DatabaseValidator;
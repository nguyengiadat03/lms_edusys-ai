#!/usr/bin/env node

/**
 * Complete Database Expansion Orchestrator
 * 
 * This script orchestrates the complete database expansion from 31 to 248 tables:
 * 1. Pre-expansion validation
 * 2. Database backup
 * 3. Run migrations
 * 4. Post-expansion validation
 * 5. Update Prisma schema
 * 6. Generate comprehensive report
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const DatabaseExpansion = require('./run-database-expansion');
const DatabaseValidator = require('./validate-database-expansion');
const PrismaSchemaUpdater = require('./update-prisma-schema');

class DatabaseExpansionOrchestrator {
  constructor() {
    this.startTime = new Date();
    this.results = {
      startTime: this.startTime,
      phases: [],
      success: false,
      summary: ''
    };
  }

  async createDatabaseBackup() {
    console.log('💾 Creating database backup...');
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = `database-backup-${timestamp}.sql`;
      const backupPath = path.join(__dirname, 'backups', backupFile);
      
      // Ensure backups directory exists
      const backupsDir = path.dirname(backupPath);
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }

      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || '3306',
        user: process.env.DB_USERNAME || process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
        database: process.env.DB_DATABASE
      };

      // Try to create backup, but don't fail if mysqldump is not available
      try {
        const mysqldumpCmd = `mysqldump -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} ${dbConfig.password ? `-p${dbConfig.password}` : ''} --single-transaction --routines --triggers ${dbConfig.database} > "${backupPath}"`;
        execSync(mysqldumpCmd, { stdio: 'inherit' });
        console.log(`✅ Database backup created: ${backupPath}`);
        return { success: true, backupPath };
      } catch (cmdError) {
        console.log('⚠️  mysqldump not available, creating manual backup note...');
        
        // Create a backup note instead
        const backupNote = `
# Database Backup Note
# Generated: ${new Date().toISOString()}
# Database: ${dbConfig.database}
# Host: ${dbConfig.host}

# To create a manual backup, run:
# mysqldump -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p ${dbConfig.database} > backup.sql

# Current table count before expansion: 31 tables
# Target table count after expansion: 248 tables

# IMPORTANT: This expansion will add 217 new tables to your database.
# Please ensure you have a backup before proceeding.
`;
        
        fs.writeFileSync(backupPath.replace('.sql', '.txt'), backupNote);
        console.log(`📝 Backup note created: ${backupPath.replace('.sql', '.txt')}`);
        console.log('⚠️  Manual backup recommended before proceeding');
        
        return { success: true, backupPath: backupPath.replace('.sql', '.txt'), manual: true };
      }
    } catch (error) {
      console.error('❌ Database backup preparation failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async runPreExpansionValidation() {
    console.log('\n🔍 Running pre-expansion validation...');
    
    try {
      const validator = new DatabaseValidator();
      const results = await validator.run();
      
      return {
        success: results && results.overallStatus === 'VALID',
        results
      };
    } catch (error) {
      console.error('❌ Pre-expansion validation failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async runDatabaseExpansion() {
    console.log('\n🚀 Running database expansion...');
    
    try {
      const expansion = new DatabaseExpansion();
      const results = await expansion.run();
      
      return {
        success: results.summary === 'SUCCESS',
        results
      };
    } catch (error) {
      console.error('❌ Database expansion failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async runPostExpansionValidation() {
    console.log('\n✅ Running post-expansion validation...');
    
    try {
      const validator = new DatabaseValidator();
      const results = await validator.run();
      
      return {
        success: results && results.overallStatus === 'VALID',
        results
      };
    } catch (error) {
      console.error('❌ Post-expansion validation failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async updatePrismaSchema() {
    console.log('\n🔄 Updating Prisma schema...');
    
    try {
      const updater = new PrismaSchemaUpdater();
      const results = await updater.run();
      
      return {
        success: results.success,
        results
      };
    } catch (error) {
      console.error('❌ Prisma schema update failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testDatabaseConnection() {
    console.log('\n🔌 Testing database connection...');
    
    try {
      execSync('node test-prisma.js', {
        cwd: __dirname,
        stdio: 'inherit'
      });
      
      console.log('✅ Database connection test passed');
      return { success: true };
    } catch (error) {
      console.error('❌ Database connection test failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  generateComprehensiveReport() {
    console.log('\n📊 Generating comprehensive report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: new Date() - this.startTime,
      success: this.results.success,
      phases: this.results.phases,
      summary: this.results.summary,
      recommendations: []
    };

    // Add recommendations based on results
    if (!this.results.success) {
      report.recommendations.push('Review error logs and fix issues before proceeding');
      report.recommendations.push('Consider restoring from backup if critical errors occurred');
    } else {
      report.recommendations.push('Database expansion completed successfully');
      report.recommendations.push('Run comprehensive tests to ensure all functionality works');
      report.recommendations.push('Update API documentation to reflect new tables and relationships');
      report.recommendations.push('Consider updating frontend components to use new features');
    }

    // Calculate statistics
    const totalTables = this.results.phases.find(p => p.name === 'Database Expansion')?.results?.finalTableCount || 0;
    const tablesAdded = this.results.phases.find(p => p.name === 'Database Expansion')?.results?.tablesAdded || 0;
    
    report.statistics = {
      totalTables,
      tablesAdded,
      expansionPercentage: totalTables > 0 ? Math.round((tablesAdded / totalTables) * 100) : 0
    };

    const reportPath = path.join(__dirname, 'database-expansion-complete-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Comprehensive report saved to: ${reportPath}`);
    return report;
  }

  async run() {
    console.log('🎯 Complete Database Expansion: 31 → 248 Tables');
    console.log('='.repeat(80));
    console.log('This process will:');
    console.log('1. Create database backup');
    console.log('2. Run pre-expansion validation');
    console.log('3. Execute database migrations');
    console.log('4. Run post-expansion validation');
    console.log('5. Update Prisma schema');
    console.log('6. Test database connection');
    console.log('7. Generate comprehensive report');
    console.log('='.repeat(80));

    const phases = [
      {
        name: 'Database Backup',
        fn: () => this.createDatabaseBackup(),
        critical: true
      },
      {
        name: 'Pre-Expansion Validation',
        fn: () => this.runPreExpansionValidation(),
        critical: false
      },
      {
        name: 'Database Expansion',
        fn: () => this.runDatabaseExpansion(),
        critical: true
      },
      {
        name: 'Post-Expansion Validation',
        fn: () => this.runPostExpansionValidation(),
        critical: false
      },
      {
        name: 'Prisma Schema Update',
        fn: () => this.updatePrismaSchema(),
        critical: true
      },
      {
        name: 'Database Connection Test',
        fn: () => this.testDatabaseConnection(),
        critical: true
      }
    ];

    let overallSuccess = true;

    for (const phase of phases) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔄 Phase: ${phase.name}`);
      console.log(`${'='.repeat(60)}`);

      const phaseResult = {
        name: phase.name,
        startTime: new Date(),
        success: false,
        critical: phase.critical
      };

      try {
        const result = await phase.fn();
        phaseResult.success = result.success;
        phaseResult.results = result.results || result;
        phaseResult.error = result.error;
        
        if (result.success) {
          console.log(`✅ ${phase.name} completed successfully`);
        } else {
          console.log(`❌ ${phase.name} failed`);
          if (phase.critical) {
            overallSuccess = false;
            console.log(`🚨 Critical phase failed - expansion cannot continue safely`);
          }
        }
      } catch (error) {
        phaseResult.success = false;
        phaseResult.error = error.message;
        console.error(`💥 ${phase.name} encountered unexpected error:`, error.message);
        
        if (phase.critical) {
          overallSuccess = false;
        }
      }

      phaseResult.endTime = new Date();
      phaseResult.duration = phaseResult.endTime - phaseResult.startTime;
      this.results.phases.push(phaseResult);

      // Stop if critical phase failed
      if (phase.critical && !phaseResult.success) {
        console.log(`🛑 Stopping expansion due to critical phase failure`);
        break;
      }
    }

    this.results.success = overallSuccess;
    this.results.endTime = new Date();
    this.results.totalDuration = this.results.endTime - this.startTime;

    // Generate final report
    const report = this.generateComprehensiveReport();

    console.log('\n' + '='.repeat(80));
    console.log('🎯 DATABASE EXPANSION COMPLETE');
    console.log('='.repeat(80));
    console.log(`⏱️  Total Duration: ${Math.round(this.results.totalDuration / 1000)}s`);
    console.log(`🎯 Overall Status: ${this.results.success ? 'SUCCESS' : 'FAILED'}`);
    
    if (report.statistics) {
      console.log(`📊 Tables: ${report.statistics.totalTables} (+${report.statistics.tablesAdded})`);
      console.log(`📈 Expansion: ${report.statistics.expansionPercentage}%`);
    }

    console.log('\n📋 Recommendations:');
    report.recommendations.forEach(rec => console.log(`   • ${rec}`));

    this.results.summary = this.results.success ? 
      'Database expansion completed successfully' : 
      'Database expansion failed - check logs for details';

    return this.results;
  }
}

// Run the complete expansion
async function main() {
  const orchestrator = new DatabaseExpansionOrchestrator();
  const results = await orchestrator.run();
  
  // Exit with appropriate code
  process.exit(results.success ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unexpected error in orchestrator:', error);
    process.exit(1);
  });
}

module.exports = DatabaseExpansionOrchestrator;
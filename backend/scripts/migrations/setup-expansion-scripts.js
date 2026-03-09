#!/usr/bin/env node

/**
 * Setup Database Expansion Scripts
 * 
 * This script prepares the database expansion environment by:
 * 1. Making scripts executable
 * 2. Creating necessary directories
 * 3. Checking prerequisites
 * 4. Providing usage instructions
 */

const fs = require('fs');
const path = require('path');

class ExpansionSetup {
  constructor() {
    this.scriptsToSetup = [
      'expand-database.js',
      'run-database-expansion.js',
      'validate-database-expansion.js',
      'update-prisma-schema.js'
    ];
    
    this.requiredDirs = [
      'backups',
      'reports'
    ];
  }

  createDirectories() {
    console.log('📁 Creating required directories...');
    
    this.requiredDirs.forEach(dir => {
      const dirPath = path.join(__dirname, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`   ✅ Created: ${dir}/`);
      } else {
        console.log(`   ℹ️  Exists: ${dir}/`);
      }
    });
  }

  checkPrerequisites() {
    console.log('\n🔍 Checking prerequisites...');
    
    const checks = [];

    // Check .env file
    const envPath = path.join(__dirname, '.env');
    checks.push({
      name: 'Environment file (.env)',
      status: fs.existsSync(envPath),
      path: envPath
    });

    // Check migrations directory
    const migrationsPath = path.join(__dirname, 'migrations');
    checks.push({
      name: 'Migrations directory',
      status: fs.existsSync(migrationsPath),
      path: migrationsPath
    });

    // Check prisma directory
    const prismaPath = path.join(__dirname, 'prisma');
    checks.push({
      name: 'Prisma directory',
      status: fs.existsSync(prismaPath),
      path: prismaPath
    });

    // Check package.json
    const packagePath = path.join(__dirname, 'package.json');
    checks.push({
      name: 'Package.json',
      status: fs.existsSync(packagePath),
      path: packagePath
    });

    checks.forEach(check => {
      const icon = check.status ? '✅' : '❌';
      console.log(`   ${icon} ${check.name}`);
      if (!check.status) {
        console.log(`      Missing: ${check.path}`);
      }
    });

    const allPassed = checks.every(check => check.status);
    
    if (!allPassed) {
      console.log('\n⚠️  Some prerequisites are missing. Please fix them before running the expansion.');
      return false;
    }

    console.log('\n✅ All prerequisites met!');
    return true;
  }

  checkDatabaseConnection() {
    console.log('\n🔌 Checking database configuration...');
    
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) {
      console.log('❌ .env file not found');
      return false;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = ['DB_HOST', 'DB_DATABASE', 'DB_USERNAME'];
    const missingVars = [];

    requiredVars.forEach(varName => {
      if (!envContent.includes(varName)) {
        missingVars.push(varName);
      }
    });

    if (missingVars.length > 0) {
      console.log('❌ Missing required environment variables:');
      missingVars.forEach(varName => console.log(`   - ${varName}`));
      return false;
    }

    console.log('✅ Database configuration looks good');
    return true;
  }

  countMigrationFiles() {
    console.log('\n📄 Checking migration files...');
    
    const migrationsPath = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsPath)) {
      console.log('❌ Migrations directory not found');
      return 0;
    }

    const files = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📊 Found ${files.length} migration files:`);
    
    // Group by phase (first 3 digits)
    const phases = {};
    files.forEach(file => {
      const phase = file.substring(0, 3);
      if (!phases[phase]) phases[phase] = [];
      phases[phase].push(file);
    });

    Object.keys(phases).sort().forEach(phase => {
      console.log(`   Phase ${phase}: ${phases[phase].length} files`);
    });

    return files.length;
  }

  generateUsageInstructions() {
    console.log('\n📋 USAGE INSTRUCTIONS');
    console.log('='.repeat(50));
    console.log('');
    console.log('🚀 Quick Start (Recommended):');
    console.log('   node expand-database.js');
    console.log('');
    console.log('🔧 Manual Steps:');
    console.log('   1. node run-database-expansion.js');
    console.log('   2. node validate-database-expansion.js');
    console.log('   3. node update-prisma-schema.js');
    console.log('');
    console.log('📊 Individual Operations:');
    console.log('   • Validate only: node validate-database-expansion.js');
    console.log('   • Update Prisma: node update-prisma-schema.js');
    console.log('   • Test connection: node test-prisma.js');
    console.log('');
    console.log('📄 Documentation:');
    console.log('   • Full guide: README-DATABASE-EXPANSION.md');
    console.log('   • Analysis: migrations-plan/database-analysis-201-tables.md');
    console.log('');
    console.log('⚠️  IMPORTANT:');
    console.log('   • Always backup your database first');
    console.log('   • Test on staging environment');
    console.log('   • Review generated reports');
    console.log('');
  }

  run() {
    console.log('🛠️  Database Expansion Setup');
    console.log('='.repeat(50));

    // Create directories
    this.createDirectories();

    // Check prerequisites
    const prereqsPassed = this.checkPrerequisites();
    
    // Check database config
    const dbConfigOk = this.checkDatabaseConnection();

    // Count migration files
    const migrationCount = this.countMigrationFiles();

    // Generate usage instructions
    this.generateUsageInstructions();

    // Final status
    console.log('🎯 SETUP STATUS');
    console.log('='.repeat(50));
    console.log(`📁 Directories: ✅ Created`);
    console.log(`🔍 Prerequisites: ${prereqsPassed ? '✅ Passed' : '❌ Failed'}`);
    console.log(`🔌 Database Config: ${dbConfigOk ? '✅ OK' : '❌ Issues'}`);
    console.log(`📄 Migration Files: ${migrationCount} found`);
    console.log('');

    if (prereqsPassed && dbConfigOk && migrationCount > 0) {
      console.log('🎉 Setup complete! Ready for database expansion.');
      console.log('');
      console.log('Next step: node expand-database.js');
    } else {
      console.log('⚠️  Setup incomplete. Please fix the issues above.');
    }

    return prereqsPassed && dbConfigOk && migrationCount > 0;
  }
}

// Run setup
function main() {
  const setup = new ExpansionSetup();
  const success = setup.run();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = ExpansionSetup;
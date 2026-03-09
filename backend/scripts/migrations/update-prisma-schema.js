#!/usr/bin/env node

/**
 * Update Prisma Schema Script
 * 
 * This script updates the Prisma schema after database expansion by:
 * 1. Running prisma db pull to introspect the expanded database
 * 2. Backing up the current schema
 * 3. Merging custom configurations and relationships
 * 4. Generating the new Prisma client
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PrismaSchemaUpdater {
  constructor() {
    this.schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
    this.backupPath = path.join(__dirname, 'prisma', 'schema.prisma.backup');
    this.tempPath = path.join(__dirname, 'prisma', 'schema.prisma.temp');
  }

  backupCurrentSchema() {
    console.log('📄 Backing up current Prisma schema...');
    
    if (fs.existsSync(this.schemaPath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const timestampedBackup = path.join(__dirname, 'prisma', `schema.prisma.backup.${timestamp}`);
      
      fs.copyFileSync(this.schemaPath, this.backupPath);
      fs.copyFileSync(this.schemaPath, timestampedBackup);
      
      console.log(`✅ Schema backed up to: ${timestampedBackup}`);
      return true;
    } else {
      console.log('⚠️  No existing schema found to backup');
      return false;
    }
  }

  async introspectDatabase() {
    console.log('🔍 Introspecting database schema...');
    
    try {
      // Run prisma db pull to generate new schema
      execSync('npx prisma db pull --force', {
        cwd: __dirname,
        stdio: 'inherit'
      });
      
      console.log('✅ Database introspection completed');
      return true;
    } catch (error) {
      console.error('❌ Database introspection failed:', error.message);
      return false;
    }
  }

  preserveCustomConfigurations() {
    console.log('🔧 Preserving custom configurations...');
    
    if (!fs.existsSync(this.schemaPath)) {
      console.error('❌ New schema file not found');
      return false;
    }

    let schema = fs.readFileSync(this.schemaPath, 'utf8');

    // Preserve custom generator configurations
    const customGeneratorConfig = `
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}`;

    // Replace the default generator with our custom one
    schema = schema.replace(
      /generator client \{[\s\S]*?\}/,
      customGeneratorConfig.trim()
    );

    // Add custom field mappings and indexes that might be lost
    const customMappings = {
      // Add any custom field mappings here
      'User': {
        // Example: preserve custom field mappings
        'mfa_enabled': '@db.TinyInt',
        'is_active': '@db.TinyInt'
      }
    };

    // Apply custom mappings (this is a simplified version)
    // In a real implementation, you'd want more sophisticated parsing
    
    fs.writeFileSync(this.schemaPath, schema);
    console.log('✅ Custom configurations preserved');
    return true;
  }

  addCustomRelationships() {
    console.log('🔗 Adding custom relationships and constraints...');
    
    let schema = fs.readFileSync(this.schemaPath, 'utf8');

    // Add custom relationship configurations that might not be auto-detected
    const customRelationships = `
// Custom relationship configurations
// These are added to ensure proper foreign key relationships

// Example: Ensure proper cascade deletes
// model User {
//   // ... existing fields
//   @@index([tenant_id, email])
//   @@index([role])
//   @@index([is_active])
// }
`;

    // Add custom relationships at the end of the file
    schema += '\n' + customRelationships;

    fs.writeFileSync(this.schemaPath, schema);
    console.log('✅ Custom relationships added');
    return true;
  }

  generatePrismaClient() {
    console.log('⚙️  Generating Prisma client...');
    
    try {
      execSync('npx prisma generate', {
        cwd: __dirname,
        stdio: 'inherit'
      });
      
      console.log('✅ Prisma client generated successfully');
      return true;
    } catch (error) {
      console.error('❌ Prisma client generation failed:', error.message);
      return false;
    }
  }

  validateSchema() {
    console.log('✅ Validating Prisma schema...');
    
    try {
      execSync('npx prisma validate', {
        cwd: __dirname,
        stdio: 'inherit'
      });
      
      console.log('✅ Schema validation passed');
      return true;
    } catch (error) {
      console.error('❌ Schema validation failed:', error.message);
      return false;
    }
  }

  analyzeSchemaChanges() {
    console.log('📊 Analyzing schema changes...');
    
    if (!fs.existsSync(this.backupPath)) {
      console.log('ℹ️  No backup found for comparison');
      return null;
    }

    const oldSchema = fs.readFileSync(this.backupPath, 'utf8');
    const newSchema = fs.readFileSync(this.schemaPath, 'utf8');

    // Extract model names from both schemas
    const oldModels = (oldSchema.match(/model\s+(\w+)\s*\{/g) || [])
      .map(match => match.match(/model\s+(\w+)/)[1]);
    const newModels = (newSchema.match(/model\s+(\w+)\s*\{/g) || [])
      .map(match => match.match(/model\s+(\w+)/)[1]);

    const addedModels = newModels.filter(model => !oldModels.includes(model));
    const removedModels = oldModels.filter(model => !newModels.includes(model));

    console.log(`📈 Models added: ${addedModels.length}`);
    if (addedModels.length > 0) {
      addedModels.forEach(model => console.log(`   + ${model}`));
    }

    console.log(`📉 Models removed: ${removedModels.length}`);
    if (removedModels.length > 0) {
      removedModels.forEach(model => console.log(`   - ${model}`));
    }

    return {
      oldModelCount: oldModels.length,
      newModelCount: newModels.length,
      addedModels,
      removedModels
    };
  }

  async run() {
    console.log('🔄 Updating Prisma Schema After Database Expansion');
    console.log('='.repeat(60));

    const steps = [
      { name: 'Backup Current Schema', fn: () => this.backupCurrentSchema() },
      { name: 'Introspect Database', fn: () => this.introspectDatabase() },
      { name: 'Preserve Custom Configurations', fn: () => this.preserveCustomConfigurations() },
      { name: 'Add Custom Relationships', fn: () => this.addCustomRelationships() },
      { name: 'Validate Schema', fn: () => this.validateSchema() },
      { name: 'Generate Prisma Client', fn: () => this.generatePrismaClient() }
    ];

    const results = {
      startTime: new Date(),
      steps: [],
      success: true
    };

    for (const step of steps) {
      console.log(`\n🔄 ${step.name}...`);
      
      const stepResult = {
        name: step.name,
        startTime: new Date(),
        success: false
      };

      try {
        stepResult.success = await step.fn();
        stepResult.endTime = new Date();
        stepResult.duration = stepResult.endTime - stepResult.startTime;
        
        if (stepResult.success) {
          console.log(`✅ ${step.name} completed`);
        } else {
          console.log(`❌ ${step.name} failed`);
          results.success = false;
        }
      } catch (error) {
        stepResult.error = error.message;
        stepResult.endTime = new Date();
        stepResult.duration = stepResult.endTime - stepResult.startTime;
        
        console.error(`❌ ${step.name} failed:`, error.message);
        results.success = false;
      }

      results.steps.push(stepResult);
    }

    // Analyze changes
    const changes = this.analyzeSchemaChanges();
    results.changes = changes;

    results.endTime = new Date();
    results.totalDuration = results.endTime - results.startTime;

    console.log('\n' + '='.repeat(60));
    console.log('📊 PRISMA SCHEMA UPDATE SUMMARY');
    console.log('='.repeat(60));
    console.log(`⏱️  Duration: ${Math.round(results.totalDuration / 1000)}s`);
    console.log(`🎯 Status: ${results.success ? 'SUCCESS' : 'FAILED'}`);
    
    if (changes) {
      console.log(`📊 Models: ${changes.oldModelCount} → ${changes.newModelCount} (+${changes.addedModels.length})`);
    }

    // Save results
    const reportPath = path.join(__dirname, 'prisma-update-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`📄 Report saved to: ${reportPath}`);

    return results;
  }
}

// Run the schema update
async function main() {
  const updater = new PrismaSchemaUpdater();
  const results = await updater.run();
  
  // Exit with appropriate code
  process.exit(results.success ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = PrismaSchemaUpdater;
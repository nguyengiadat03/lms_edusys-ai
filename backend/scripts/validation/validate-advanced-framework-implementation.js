const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function validateAdvancedFrameworkImplementation() {
  console.log('🔍 Validating Advanced Framework Implementation...\n');
  
  const results = {
    service: { exists: false, methods: [] },
    routes: { exists: false, endpoints: [] },
    database: { tables: [], relationships: [] },
    tests: { exists: false, coverage: [] }
  };
  
  try {
    // 1. Check Service File
    console.log('📋 Checking Advanced Framework Service...');
    const servicePath = path.join(__dirname, 'src/services/advancedFrameworkService.ts');
    
    if (fs.existsSync(servicePath)) {
      results.service.exists = true;
      const serviceContent = fs.readFileSync(servicePath, 'utf8');
      
      // Check for key methods
      const methods = [
        'cloneFramework',
        'createExportJob',
        'createImportJob',
        'compareFrameworks',
        'mergeFrameworks',
        'getFrameworkDependencies',
        'validateFramework',
        'getCEFRMapping',
        'updateCEFRMapping',
        'getCoverageAnalysis',
        'getAISuggestions',
        'publishVersion',
        'archiveVersion',
        'rollbackToVersion',
        'getVersionDiff',
        'createBranch',
        'getDeployments'
      ];
      
      methods.forEach(method => {
        if (serviceContent.includes(`static async ${method}`) || serviceContent.includes(`async ${method}`)) {
          results.service.methods.push(method);
        }
      });
      
      console.log(`✅ Service file exists with ${results.service.methods.length}/${methods.length} methods`);
    } else {
      console.log('❌ Service file not found');
    }
    
    // 2. Check Routes File
    console.log('\n🛣️ Checking Advanced Framework Routes...');
    const routesPath = path.join(__dirname, 'src/routes/advancedFramework.ts');
    
    if (fs.existsSync(routesPath)) {
      results.routes.exists = true;
      const routesContent = fs.readFileSync(routesPath, 'utf8');
      
      // Check for key endpoints
      const endpoints = [
        'POST /:id/clone',
        'POST /:id/export',
        'POST /import',
        'GET /:id/compare/:otherId',
        'POST /:id/merge',
        'GET /:id/dependencies',
        'POST /:id/validate',
        'GET /:id/cefr-mapping',
        'POST /:id/cefr-mapping',
        'GET /:id/coverage',
        'POST /:id/ai-suggestions',
        'POST /versions/:id/publish',
        'POST /versions/:id/archive',
        'POST /versions/:id/rollback',
        'GET /versions/:id/diff/:otherId',
        'POST /:id/branch',
        'GET /:id/deployments',
        'POST /:id/deploy'
      ];
      
      endpoints.forEach(endpoint => {
        const [method, path] = endpoint.split(' ');
        if (routesContent.includes(`router.${method.toLowerCase()}('${path}'`)) {
          results.routes.endpoints.push(endpoint);
        }
      });
      
      console.log(`✅ Routes file exists with ${results.routes.endpoints.length}/${endpoints.length} endpoints`);
    } else {
      console.log('❌ Routes file not found');
    }
    
    // 3. Check Database Tables
    console.log('\n🗄️ Checking Database Tables...');
    
    const requiredTables = [
      'curriculum_frameworks',
      'curriculum_framework_versions',
      'course_blueprints',
      'unit_blueprints',
      'kct_mappings'
    ];
    
    for (const table of requiredTables) {
      try {
        const result = await prisma.$queryRaw`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_name = ${table}
        `;
        
        if (result[0].count > 0) {
          results.database.tables.push(table);
          console.log(`✅ Table ${table} exists`);
        } else {
          console.log(`❌ Table ${table} missing`);
        }
      } catch (error) {
        console.log(`❌ Error checking table ${table}:`, error.message);
      }
    }
    
    // 4. Check Test File
    console.log('\n🧪 Checking Test Implementation...');
    const testPath = path.join(__dirname, 'test-advanced-framework-api.js');
    
    if (fs.existsSync(testPath)) {
      results.tests.exists = true;
      const testContent = fs.readFileSync(testPath, 'utf8');
      
      const testFunctions = [
        'testCloneFramework',
        'testExportFramework',
        'testImportFramework',
        'testCompareFrameworks',
        'testMergeFrameworks',
        'testGetDependencies',
        'testValidateFramework',
        'testCEFRMapping',
        'testCoverageAnalysis',
        'testAISuggestions',
        'testVersionControl',
        'testDeployment'
      ];
      
      testFunctions.forEach(testFn => {
        if (testContent.includes(`async function ${testFn}`)) {
          results.tests.coverage.push(testFn);
        }
      });
      
      console.log(`✅ Test file exists with ${results.tests.coverage.length}/${testFunctions.length} test functions`);
    } else {
      console.log('❌ Test file not found');
    }
    
    // 5. Check Server Integration
    console.log('\n🖥️ Checking Server Integration...');
    const serverPath = path.join(__dirname, 'src/server.ts');
    
    if (fs.existsSync(serverPath)) {
      const serverContent = fs.readFileSync(serverPath, 'utf8');
      
      if (serverContent.includes('advancedFrameworkRoutes')) {
        console.log('✅ Advanced Framework routes integrated in server');
      } else {
        console.log('❌ Advanced Framework routes not integrated in server');
      }
    }
    
    // 6. Sample Data Check
    console.log('\n📊 Checking Sample Data...');
    
    try {
      const frameworkCount = await prisma.curriculum_frameworks.count();
      const versionCount = await prisma.curriculum_framework_versions.count();
      const courseCount = await prisma.course_blueprints.count();
      const unitCount = await prisma.unit_blueprints.count();
      
      console.log(`📈 Data Summary:`);
      console.log(`   - Frameworks: ${frameworkCount}`);
      console.log(`   - Versions: ${versionCount}`);
      console.log(`   - Courses: ${courseCount}`);
      console.log(`   - Units: ${unitCount}`);
      
      if (frameworkCount > 0) {
        console.log('✅ Sample data available for testing');
      } else {
        console.log('⚠️ No sample data found - may need to create test data');
      }
    } catch (error) {
      console.log('❌ Error checking sample data:', error.message);
    }
    
    // 7. Generate Summary Report
    console.log('\n📋 IMPLEMENTATION SUMMARY:');
    console.log('=' .repeat(50));
    
    const serviceScore = (results.service.methods.length / 18) * 100;
    const routesScore = (results.routes.endpoints.length / 18) * 100;
    const databaseScore = (results.database.tables.length / 5) * 100;
    const testScore = (results.tests.coverage.length / 12) * 100;
    
    console.log(`🔧 Service Implementation: ${serviceScore.toFixed(1)}%`);
    console.log(`🛣️ Routes Implementation: ${routesScore.toFixed(1)}%`);
    console.log(`🗄️ Database Tables: ${databaseScore.toFixed(1)}%`);
    console.log(`🧪 Test Coverage: ${testScore.toFixed(1)}%`);
    
    const overallScore = (serviceScore + routesScore + databaseScore + testScore) / 4;
    console.log(`\n📊 Overall Implementation: ${overallScore.toFixed(1)}%`);
    
    if (overallScore >= 90) {
      console.log('🎉 Excellent implementation!');
    } else if (overallScore >= 75) {
      console.log('✅ Good implementation with minor gaps');
    } else if (overallScore >= 50) {
      console.log('⚠️ Partial implementation - needs more work');
    } else {
      console.log('❌ Implementation incomplete');
    }
    
    // 8. Missing Components
    console.log('\n🔍 MISSING COMPONENTS:');
    
    if (results.service.methods.length < 18) {
      console.log('📋 Service Methods:');
      const allMethods = [
        'cloneFramework', 'createExportJob', 'createImportJob', 'compareFrameworks',
        'mergeFrameworks', 'getFrameworkDependencies', 'validateFramework',
        'getCEFRMapping', 'updateCEFRMapping', 'getCoverageAnalysis',
        'getAISuggestions', 'publishVersion', 'archiveVersion', 'rollbackToVersion',
        'getVersionDiff', 'createBranch', 'getDeployments'
      ];
      
      const missing = allMethods.filter(method => !results.service.methods.includes(method));
      missing.forEach(method => console.log(`   - ${method}`));
    }
    
    if (results.routes.endpoints.length < 18) {
      console.log('🛣️ Route Endpoints:');
      const allEndpoints = [
        'POST /:id/clone', 'POST /:id/export', 'POST /import',
        'GET /:id/compare/:otherId', 'POST /:id/merge', 'GET /:id/dependencies',
        'POST /:id/validate', 'GET /:id/cefr-mapping', 'POST /:id/cefr-mapping',
        'GET /:id/coverage', 'POST /:id/ai-suggestions', 'POST /versions/:id/publish',
        'POST /versions/:id/archive', 'POST /versions/:id/rollback',
        'GET /versions/:id/diff/:otherId', 'POST /:id/branch',
        'GET /:id/deployments', 'POST /:id/deploy'
      ];
      
      const missing = allEndpoints.filter(endpoint => !results.routes.endpoints.includes(endpoint));
      missing.forEach(endpoint => console.log(`   - ${endpoint}`));
    }
    
    if (results.database.tables.length < 5) {
      console.log('🗄️ Database Tables:');
      const allTables = [
        'curriculum_frameworks', 'curriculum_framework_versions',
        'course_blueprints', 'unit_blueprints', 'kct_mappings'
      ];
      
      const missing = allTables.filter(table => !results.database.tables.includes(table));
      missing.forEach(table => console.log(`   - ${table}`));
    }
    
    // 9. Next Steps
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Run the test suite: node test-advanced-framework-api.js');
    console.log('2. Check API documentation with Swagger');
    console.log('3. Test individual endpoints with Postman/curl');
    console.log('4. Verify database relationships and constraints');
    console.log('5. Test error handling and edge cases');
    
    return results;
    
  } catch (error) {
    console.error('❌ Validation error:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

// Run validation
if (require.main === module) {
  validateAdvancedFrameworkImplementation()
    .then(results => {
      if (results) {
        console.log('\n✅ Validation completed successfully');
      } else {
        console.log('\n❌ Validation failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Validation error:', error);
      process.exit(1);
    });
}

module.exports = { validateAdvancedFrameworkImplementation };
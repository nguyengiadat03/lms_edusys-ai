const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function compareSchemaWithDatabase() {
  try {
    console.log('🔍 Comparing Prisma schema with actual database structure...');
    
    // Đọc schema.prisma
    const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    // Extract models từ schema
    const modelMatches = schemaContent.match(/^model\s+(\w+)\s*{[\s\S]*?^}/gm);
    const schemaModels = {};
    
    if (modelMatches) {
      modelMatches.forEach(modelBlock => {
        const modelName = modelBlock.match(/^model\s+(\w+)/)[1];
        
        // Extract fields từ model
        const fieldMatches = modelBlock.match(/^\s+(\w+)\s+([^\s]+)/gm);
        const fields = {};
        
        if (fieldMatches) {
          fieldMatches.forEach(fieldLine => {
            const match = fieldLine.trim().match(/^(\w+)\s+([^\s]+)/);
            if (match && !match[1].startsWith('@@')) {
              fields[match[1]] = match[2];
            }
          });
        }
        
        schemaModels[modelName] = fields;
      });
    }
    
    console.log(`📋 Found ${Object.keys(schemaModels).length} models in schema.prisma`);
    
    // Lấy thông tin bảng từ database
    const tablesResult = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `;
    
    const dbTables = tablesResult.map(row => row.TABLE_NAME);
    console.log(`🗄️  Found ${dbTables.length} tables in database`);
    
    // Lấy thông tin columns cho mỗi bảng
    const dbStructure = {};
    for (const tableName of dbTables) {
      const columnsResult = await prisma.$queryRaw`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          COLUMN_DEFAULT,
          COLUMN_KEY,
          EXTRA
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ${tableName}
        ORDER BY ORDINAL_POSITION
      `;
      
      dbStructure[tableName] = columnsResult.reduce((acc, col) => {
        acc[col.COLUMN_NAME] = {
          type: col.DATA_TYPE,
          nullable: col.IS_NULLABLE === 'YES',
          default: col.COLUMN_DEFAULT,
          key: col.COLUMN_KEY,
          extra: col.EXTRA
        };
        return acc;
      }, {});
    }
    
    console.log('\n📊 DETAILED COMPARISON:');
    console.log('='.repeat(80));
    
    // So sánh tables
    const missingTables = Object.keys(schemaModels).filter(model => !dbTables.includes(model));
    const extraTables = dbTables.filter(table => !Object.keys(schemaModels).includes(table));
    
    if (missingTables.length > 0) {
      console.log(`\n❌ MISSING TABLES IN DATABASE (${missingTables.length}):`);
      missingTables.forEach(table => console.log(`   - ${table}`));
    }
    
    if (extraTables.length > 0) {
      console.log(`\n⚠️  EXTRA TABLES IN DATABASE (${extraTables.length}):`);
      extraTables.forEach(table => console.log(`   - ${table}`));
    }
    
    // So sánh fields cho các bảng chung
    const commonTables = Object.keys(schemaModels).filter(model => dbTables.includes(model));
    let fieldMismatches = 0;
    
    console.log(`\n🔍 CHECKING FIELDS FOR ${commonTables.length} COMMON TABLES:`);
    
    for (const tableName of commonTables.slice(0, 10)) { // Chỉ check 10 bảng đầu để tránh quá dài
      const schemaFields = Object.keys(schemaModels[tableName]);
      const dbFields = Object.keys(dbStructure[tableName]);
      
      const missingFields = schemaFields.filter(field => !dbFields.includes(field));
      const extraFields = dbFields.filter(field => !schemaFields.includes(field));
      
      if (missingFields.length > 0 || extraFields.length > 0) {
        console.log(`\n   📋 Table: ${tableName}`);
        if (missingFields.length > 0) {
          console.log(`      ❌ Missing fields in DB: ${missingFields.join(', ')}`);
          fieldMismatches++;
        }
        if (extraFields.length > 0) {
          console.log(`      ⚠️  Extra fields in DB: ${extraFields.join(', ')}`);
        }
      }
    }
    
    console.log('\n📈 SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Schema models: ${Object.keys(schemaModels).length}`);
    console.log(`Database tables: ${dbTables.length}`);
    console.log(`Missing tables: ${missingTables.length}`);
    console.log(`Extra tables: ${extraTables.length}`);
    console.log(`Field mismatches found: ${fieldMismatches}`);
    
    if (missingTables.length === 0 && extraTables.length === 0 && fieldMismatches === 0) {
      console.log('\n✅ Schema and database are in perfect sync!');
    } else {
      console.log('\n⚠️  Schema and database have differences that need attention.');
    }
    
    return {
      schemaModels: Object.keys(schemaModels),
      dbTables,
      missingTables,
      extraTables,
      fieldMismatches
    };
    
  } catch (error) {
    console.error('❌ Error comparing schema with database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy comparison
if (require.main === module) {
  compareSchemaWithDatabase()
    .then(result => {
      if (result.missingTables.length > 0 || result.fieldMismatches > 0) {
        console.log('\n🔧 Recommendations:');
        if (result.missingTables.length > 0) {
          console.log('   - Run: npx prisma db push (to create missing tables)');
        }
        if (result.fieldMismatches > 0) {
          console.log('   - Check field definitions and run migrations if needed');
        }
        process.exit(1);
      } else {
        console.log('\n✅ No action needed - schema is up to date!');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('Failed to compare schema:', error);
      process.exit(1);
    });
}

module.exports = { compareSchemaWithDatabase };
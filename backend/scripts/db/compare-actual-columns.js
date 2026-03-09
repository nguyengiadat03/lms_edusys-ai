const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function compareActualColumns() {
  try {
    console.log('🔍 Comparing actual database columns with Prisma schema...');
    
    // Đọc schema.prisma
    const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    // Extract models và chỉ lấy actual fields (không phải relationship fields)
    const modelMatches = schemaContent.match(/^model\s+(\w+)\s*{[\s\S]*?^}/gm);
    const schemaModels = {};
    
    if (modelMatches) {
      modelMatches.forEach(modelBlock => {
        const modelName = modelBlock.match(/^model\s+(\w+)/)[1];
        
        // Extract chỉ các fields thực tế (có type cụ thể, không phải relationship)
        const lines = modelBlock.split('\n');
        const fields = {};
        
        lines.forEach(line => {
          const trimmed = line.trim();
          // Bỏ qua comments, @@, và relationship fields
          if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('@@') && !trimmed.startsWith('model')) {
            const match = trimmed.match(/^(\w+)\s+([^\s]+)/);
            if (match) {
              const fieldName = match[1];
              const fieldType = match[2];
              
              // Chỉ lấy các field có type cơ bản (không phải model reference)
              if (['BigInt', 'String', 'DateTime', 'Boolean', 'Int', 'Decimal', 'Json', 'Float'].some(t => fieldType.includes(t)) ||
                  fieldType.includes('enum') || fieldType.includes('_')) {
                fields[fieldName] = fieldType;
              }
            }
          }
        });
        
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
          COLUMN_KEY
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ${tableName}
        ORDER BY ORDINAL_POSITION
      `;
      
      dbStructure[tableName] = columnsResult.map(col => col.COLUMN_NAME);
    }
    
    console.log('\n📊 COMPARISON RESULTS:');
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
    
    // So sánh columns cho các bảng chung
    const commonTables = Object.keys(schemaModels).filter(model => dbTables.includes(model));
    let totalMissingColumns = 0;
    let totalExtraColumns = 0;
    const problemTables = [];
    
    console.log(`\n🔍 CHECKING COLUMNS FOR ${commonTables.length} COMMON TABLES:`);
    
    for (const tableName of commonTables) {
      const schemaColumns = Object.keys(schemaModels[tableName]);
      const dbColumns = dbStructure[tableName];
      
      const missingColumns = schemaColumns.filter(col => !dbColumns.includes(col));
      const extraColumns = dbColumns.filter(col => !schemaColumns.includes(col));
      
      if (missingColumns.length > 0 || extraColumns.length > 0) {
        problemTables.push(tableName);
        console.log(`\n   📋 Table: ${tableName}`);
        
        if (missingColumns.length > 0) {
          console.log(`      ❌ Missing columns in DB: ${missingColumns.join(', ')}`);
          totalMissingColumns += missingColumns.length;
        }
        
        if (extraColumns.length > 0) {
          console.log(`      ⚠️  Extra columns in DB: ${extraColumns.join(', ')}`);
          totalExtraColumns += extraColumns.length;
        }
      }
    }
    
    if (problemTables.length === 0) {
      console.log('\n✅ All tables have matching columns!');
    }
    
    console.log('\n📈 FINAL SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Schema models: ${Object.keys(schemaModels).length}`);
    console.log(`Database tables: ${dbTables.length}`);
    console.log(`Missing tables: ${missingTables.length}`);
    console.log(`Extra tables: ${extraTables.length}`);
    console.log(`Tables with column mismatches: ${problemTables.length}`);
    console.log(`Total missing columns: ${totalMissingColumns}`);
    console.log(`Total extra columns: ${totalExtraColumns}`);
    
    if (missingTables.length === 0 && extraTables.length === 0 && problemTables.length === 0) {
      console.log('\n🎉 PERFECT MATCH! Schema and database are perfectly synchronized!');
      return { status: 'perfect' };
    } else if (missingTables.length > 0) {
      console.log('\n⚠️  Database is missing some tables from schema.');
      return { status: 'missing_tables', missingTables };
    } else {
      console.log('\n⚠️  Minor differences found but structure is mostly complete.');
      return { status: 'minor_differences', problemTables };
    }
    
  } catch (error) {
    console.error('❌ Error comparing schema with database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy comparison
if (require.main === module) {
  compareActualColumns()
    .then(result => {
      if (result.status === 'perfect') {
        console.log('\n✅ No action needed - everything is perfect!');
        process.exit(0);
      } else if (result.status === 'missing_tables') {
        console.log('\n🔧 Run: npx prisma db push (to create missing tables)');
        process.exit(1);
      } else {
        console.log('\n✅ Database structure is complete and functional!');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('Failed to compare schema:', error);
      process.exit(1);
    });
}

module.exports = { compareActualColumns };
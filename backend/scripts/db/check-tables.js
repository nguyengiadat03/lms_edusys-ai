const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTables() {
  try {
    console.log('🔍 Checking database tables after Prisma migration...');
    
    // Get all table names from information_schema
    const tables = await prisma.$queryRaw`
      SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `;
    
    console.log(`\n📊 Found ${tables.length} tables in database:\n`);
    
    let totalRows = 0;
    let tablesWithData = 0;
    
    tables.forEach((table, index) => {
      const rows = Number(table.TABLE_ROWS);
      const hasData = rows > 0;
      const dataSize = (Number(table.DATA_LENGTH) / 1024).toFixed(2);
      const indexSize = (Number(table.INDEX_LENGTH) / 1024).toFixed(2);
      
      console.log(`${(index + 1).toString().padStart(2)}. ${table.TABLE_NAME.padEnd(35)} | Rows: ${rows.toString().padStart(4)} | Data: ${dataSize.padStart(8)} KB | Index: ${indexSize.padStart(8)} KB`);
      
      totalRows += rows;
      if (hasData) tablesWithData++;
    });
    
    console.log(`\n📈 Summary:`);
    console.log(`   Total tables: ${tables.length}`);
    console.log(`   Tables with data: ${tablesWithData}`);
    console.log(`   Total rows: ${totalRows}`);
    
    // Check specific Prisma models
    console.log(`\n🔍 Checking Prisma model tables:`);
    
    const modelCounts = await Promise.all([
      prisma.tenant.count().then(count => ({ model: 'Tenant', count })),
      prisma.campus.count().then(count => ({ model: 'Campus', count })),
      prisma.user.count().then(count => ({ model: 'User', count })),
      prisma.curriculumFramework.count().then(count => ({ model: 'CurriculumFramework', count })),
      prisma.curriculumFrameworkVersion.count().then(count => ({ model: 'CurriculumFrameworkVersion', count })),
      prisma.courseBlueprint.count().then(count => ({ model: 'CourseBlueprint', count })),
      prisma.unitBlueprint.count().then(count => ({ model: 'UnitBlueprint', count })),
      prisma.unitResource.count().then(count => ({ model: 'UnitResource', count })),
      prisma.tag.count().then(count => ({ model: 'Tag', count })),
      prisma.comment.count().then(count => ({ model: 'Comment', count })),
      prisma.approval.count().then(count => ({ model: 'Approval', count })),
      prisma.assignment.count().then(count => ({ model: 'Assignment', count })),
      prisma.game.count().then(count => ({ model: 'Game', count })),
      prisma.role.count().then(count => ({ model: 'Role', count })),
      prisma.permission.count().then(count => ({ model: 'Permission', count })),
      prisma.auditLog.count().then(count => ({ model: 'AuditLog', count }))
    ]);
    
    modelCounts.forEach(({ model, count }) => {
      console.log(`   ${model.padEnd(25)}: ${count.toString().padStart(4)} records`);
    });
    
    console.log(`\n✅ Database check completed!`);
    
  } catch (error) {
    console.error('❌ Error checking tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
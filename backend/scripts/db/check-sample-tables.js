const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSampleTables() {
  try {
    console.log('🔍 Checking sample tables to verify structure...');
    
    // Check activity_participation table
    const activityParticipationColumns = await prisma.$queryRaw`DESCRIBE activity_participation`;
    console.log('\n📋 activity_participation columns:');
    activityParticipationColumns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });
    
    // Check users table
    const usersColumns = await prisma.$queryRaw`DESCRIBE users`;
    console.log('\n📋 users columns:');
    usersColumns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });
    
    // Check assignments table
    const assignmentsColumns = await prisma.$queryRaw`DESCRIBE assignments`;
    console.log('\n📋 assignments columns:');
    assignmentsColumns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });
    
    // Test a simple query to verify database is working
    const tableCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_TYPE = 'BASE TABLE'
    `;
    
    console.log(`\n✅ Database has ${tableCount[0].count} tables and is working correctly!`);
    
  } catch (error) {
    console.error('❌ Error checking sample tables:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run check
if (require.main === module) {
  checkSampleTables()
    .then(() => {
      console.log('\n🎉 Database structure verification completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkSampleTables };
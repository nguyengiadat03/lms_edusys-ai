const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAssignmentTables() {
  try {
    const result = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME LIKE '%assignment%'
      ORDER BY TABLE_NAME
    `;
    
    console.log('Assignment-related tables:');
    console.log(result);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAssignmentTables();
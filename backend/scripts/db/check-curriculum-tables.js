const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTables() {
  try {
    // Get all table names from the database
    const result = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME LIKE '%curriculum%'
      ORDER BY TABLE_NAME
    `;
    
    console.log('Curriculum-related tables:');
    console.log(result);
    
    // Also check for any KCT-related tables
    const kctResult = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME LIKE '%kct%'
      ORDER BY TABLE_NAME
    `;
    
    console.log('\nKCT-related tables:');
    console.log(kctResult);
    
    // Check for framework-related tables
    const frameworkResult = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME LIKE '%framework%'
      ORDER BY TABLE_NAME
    `;
    
    console.log('\nFramework-related tables:');
    console.log(frameworkResult);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
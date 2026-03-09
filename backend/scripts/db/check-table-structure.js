const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTableStructure() {
  try {
    // Check curriculum_frameworks table structure
    const frameworkColumns = await prisma.$queryRaw`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'curriculum_frameworks'
      ORDER BY ORDINAL_POSITION
    `;
    
    console.log('curriculum_frameworks table structure:');
    console.log(frameworkColumns);
    
    // Check curriculum_framework_tags table structure
    const tagsColumns = await prisma.$queryRaw`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'curriculum_framework_tags'
      ORDER BY ORDINAL_POSITION
    `;
    
    console.log('\ncurriculum_framework_tags table structure:');
    console.log(tagsColumns);
    
    // Check if tags table exists
    const tagsTable = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'tags'
    `;
    
    console.log('\nTags table exists:');
    console.log(tagsTable);
    
    // Check if tag table exists (singular)
    const tagTable = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'tag'
    `;
    
    console.log('\nTag table exists:');
    console.log(tagTable);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTableStructure();
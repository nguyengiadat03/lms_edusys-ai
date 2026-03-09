const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCurriculumRelationships() {
  try {
    console.log('Testing curriculum_frameworks relationships...');
    
    // Try basic query first
    const basic = await prisma.curriculum_frameworks.findFirst();
    console.log('Basic query works');
    
    // Try with users relationship
    try {
      const withUsers = await prisma.curriculum_frameworks.findFirst({
        include: {
          users: true
        }
      });
      console.log('users relationship works');
    } catch (error) {
      console.log('users relationship failed:', error.message);
    }
    
    // Try with curriculum_framework_tags relationship
    try {
      const withTags = await prisma.curriculum_frameworks.findFirst({
        include: {
          curriculum_framework_tags: true
        }
      });
      console.log('curriculum_framework_tags relationship works');
    } catch (error) {
      console.log('curriculum_framework_tags relationship failed:', error.message);
    }
    
    // Try with curriculum_framework_versions relationship
    try {
      const withVersions = await prisma.curriculum_frameworks.findFirst({
        include: {
          curriculum_framework_versions: true
        }
      });
      console.log('curriculum_framework_versions relationship works');
    } catch (error) {
      console.log('curriculum_framework_versions relationship failed:', error.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCurriculumRelationships();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCurriculumData() {
  try {
    // Check if curriculum_frameworks table has any data
    const count = await prisma.curriculum_frameworks.count();
    console.log(`curriculum_frameworks table has ${count} records`);
    
    // Check if there are any records for tenant_id 1
    const tenantCount = await prisma.curriculum_frameworks.count({
      where: {
        tenant_id: BigInt(1)
      }
    });
    console.log(`curriculum_frameworks table has ${tenantCount} records for tenant_id 1`);
    
    // Check the structure by getting one record if it exists
    const sample = await prisma.curriculum_frameworks.findFirst();
    if (sample) {
      console.log('Sample record structure:');
      console.log(sample);
    } else {
      console.log('No records found in curriculum_frameworks table');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurriculumData();
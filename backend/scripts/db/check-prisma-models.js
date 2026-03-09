const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPrismaModels() {
  try {
    console.log('Available Prisma models:');
    console.log(Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_')));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPrismaModels();
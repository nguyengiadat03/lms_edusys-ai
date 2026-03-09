const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Database URL:', process.env.DATABASE_URL);
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully!');
    
    // Check users table
    const userCount = await prisma.users.count();
    console.log(`\n📊 Total users in database: ${userCount}`);
    
    if (userCount > 0) {
      const users = await prisma.users.findMany({
        take: 5,
        select: {
          id: true,
          email: true,
          full_name: true,
          role: true,
          is_active: true
        }
      });
      console.log('\n👥 Sample users:');
      console.table(users);
    } else {
      console.log('\n⚠️  No users found in database!');
      console.log('You may need to seed the database with initial users.');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

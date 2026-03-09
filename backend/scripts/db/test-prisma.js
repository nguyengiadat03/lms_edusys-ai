const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔍 Testing Prisma database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test basic query
    const tenantCount = await prisma.tenants.count();
    console.log(`📊 Found ${tenantCount} tenants in database`);
    
    // Test creating a tenant if none exist
    if (tenantCount === 0) {
      console.log('🏗️ Creating test tenant...');
      const testTenant = await prisma.tenants.create({
        data: {
          code: 'TEST_TENANT',
          name: 'Test Tenant',
          is_active: true
        }
      });
      console.log('✅ Test tenant created:', testTenant.id.toString());
    }
    
    // Test user count
    const userCount = await prisma.users.count();
    console.log(`👥 Found ${userCount} users in database`);
    
    console.log('🎉 All Prisma tests passed!');
    
  } catch (error) {
    console.error('❌ Prisma test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
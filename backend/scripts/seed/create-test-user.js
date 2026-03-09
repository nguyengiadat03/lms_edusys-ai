const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔍 Creating/updating test user for frontend login...');
    
    // Check if test user exists
    const existingUser = await prisma.users.findFirst({
      where: { email: 'admin@edusys.ai' }
    });
    
    if (existingUser) {
      console.log('👤 Test user already exists, updating password...');
      
      // Update password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await prisma.users.update({
        where: { id: existingUser.id },
        data: {
          password_hash: hashedPassword,
          is_active: true,
          updated_at: new Date()
        }
      });
      
      console.log('✅ Test user password updated');
    } else {
      console.log('👤 Creating new test user...');
      
      // Ensure we have a tenant
      let tenant = await prisma.tenants.findFirst();
      if (!tenant) {
        tenant = await prisma.tenants.create({
          data: {
            code: 'demo',
            name: 'Demo School',
            domain: 'demo.edusys.ai',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          }
        });
        console.log('🏢 Created demo tenant');
      }
      
      // Create test user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const testUser = await prisma.users.create({
        data: {
          tenant_id: tenant.id,
          email: 'admin@edusys.ai',
          full_name: 'System Administrator',
          role: 'admin',
          password_hash: hashedPassword,
          is_active: true,
          mfa_enabled: false,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      
      console.log('✅ Test user created');
    }
    
    console.log('\n🎯 LOGIN CREDENTIALS FOR FRONTEND:');
    console.log('   Email: admin@edusys.ai');
    console.log('   Password: admin123');
    
    // Test the credentials
    console.log('\n🔐 Testing credentials...');
    const user = await prisma.users.findFirst({
      where: { email: 'admin@edusys.ai' }
    });
    
    if (user && user.password_hash) {
      const isValid = await bcrypt.compare('admin123', user.password_hash);
      console.log(`   Password verification: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    }
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run creation
if (require.main === module) {
  createTestUser()
    .then(() => {
      console.log('\n✅ Test user setup completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Test user setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createTestUser };
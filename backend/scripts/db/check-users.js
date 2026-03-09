const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...');
    
    // Check if users table exists and has data
    const userCount = await prisma.users.count();
    console.log(`📊 Total users in database: ${userCount}`);
    
    if (userCount === 0) {
      console.log('\n⚠️  No users found. Creating a test user...');
      
      // Create a test user
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const testUser = await prisma.users.create({
        data: {
          tenant_id: BigInt(1),
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
      
      console.log('✅ Test user created:');
      console.log(`   Email: admin@edusys.ai`);
      console.log(`   Password: password123`);
      console.log(`   Role: admin`);
      console.log(`   ID: ${testUser.id}`);
    } else {
      // Show existing users
      const users = await prisma.users.findMany({
        select: {
          id: true,
          email: true,
          full_name: true,
          role: true,
          is_active: true,
          created_at: true
        },
        take: 5
      });
      
      console.log('\n👥 Existing users:');
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.role}) - Active: ${user.is_active}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run check
if (require.main === module) {
  checkUsers()
    .then(() => {
      console.log('\n✅ User check completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('User check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkUsers };
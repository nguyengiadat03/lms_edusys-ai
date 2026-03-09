const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkUserPassword() {
  try {
    console.log('Checking user passwords...\n');
    
    // Get test user
    const testUser = await prisma.users.findFirst({
      where: { email: 'test@example.com' }
    });
    
    if (!testUser) {
      console.log('❌ User test@example.com not found!');
      return;
    }
    
    console.log('✅ Found user:', {
      id: testUser.id.toString(),
      email: testUser.email,
      full_name: testUser.full_name,
      role: testUser.role,
      is_active: testUser.is_active,
      has_password: !!testUser.password_hash,
      password_hash_preview: testUser.password_hash ? testUser.password_hash.substring(0, 20) + '...' : 'NULL'
    });
    
    if (!testUser.password_hash) {
      console.log('\n⚠️  User has no password! Creating password...');
      
      // Hash password "password123"
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await prisma.users.update({
        where: { id: testUser.id },
        data: { password_hash: hashedPassword }
      });
      
      console.log('✅ Password set to: password123');
    } else {
      // Test if password is "password123"
      const isMatch = await bcrypt.compare('password123', testUser.password_hash);
      console.log('\n🔐 Testing password "password123":', isMatch ? '✅ MATCH' : '❌ NO MATCH');
      
      if (!isMatch) {
        console.log('\n⚠️  Resetting password to "password123"...');
        const hashedPassword = await bcrypt.hash('password123', 10);
        await prisma.users.update({
          where: { id: testUser.id },
          data: { password_hash: hashedPassword }
        });
        console.log('✅ Password reset successfully!');
      }
    }
    
    console.log('\n📝 Login credentials:');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPassword();

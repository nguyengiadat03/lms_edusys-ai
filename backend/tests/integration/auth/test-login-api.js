const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLoginAPI() {
  try {
    console.log('🔍 Testing login API...');
    
    // First, let's check the user's password hash
    const user = await prisma.users.findFirst({
      where: { email: 'test@example.com' },
      select: {
        id: true,
        email: true,
        password_hash: true,
        is_active: true,
        deleted_at: true
      }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 User found:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Active: ${user.is_active}`);
    console.log(`   Deleted: ${user.deleted_at ? 'Yes' : 'No'}`);
    console.log(`   Has password: ${user.password_hash ? 'Yes' : 'No'}`);
    
    // Test password comparison
    if (user.password_hash) {
      const testPasswords = ['password', 'password123', 'test123', 'admin'];
      
      console.log('\n🔐 Testing passwords:');
      for (const pwd of testPasswords) {
        const isValid = await bcrypt.compare(pwd, user.password_hash);
        console.log(`   "${pwd}": ${isValid ? '✅ MATCH' : '❌ No match'}`);
        
        if (isValid) {
          console.log(`\n🎉 Found working password: "${pwd}"`);
          break;
        }
      }
    }
    
    // Test API call
    console.log('\n🌐 Testing API call...');
    
    const response = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    console.log(`📡 Response status: ${response.status}`);
    
    const responseText = await response.text();
    console.log(`📄 Response body: ${responseText}`);
    
    if (!response.ok) {
      console.log('❌ API call failed');
    } else {
      console.log('✅ API call successful');
    }
    
  } catch (error) {
    console.error('❌ Error testing login API:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run test
if (require.main === module) {
  testLoginAPI()
    .then(() => {
      console.log('\n✅ Login API test completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Login API test failed:', error);
      process.exit(1);
    });
}

module.exports = { testLoginAPI };
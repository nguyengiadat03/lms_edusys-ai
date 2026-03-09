const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testEndpoints() {
  try {
    console.log('🔍 Testing API endpoints with Prisma...');
    
    // Create test tenant if not exists
    let tenant = await prisma.tenant.findFirst({
      where: { code: 'TEST_TENANT' }
    });
    
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          code: 'TEST_TENANT',
          name: 'Test Tenant',
          is_active: true
        }
      });
      console.log('✅ Test tenant created');
    }
    
    // Create test user if not exists
    let user = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });
    
    if (!user) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      user = await prisma.user.create({
        data: {
          tenant_id: tenant.id,
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'admin',
          password_hash: hashedPassword,
          is_active: true
        }
      });
      console.log('✅ Test user created');
    }
    
    // Test login endpoint
    console.log('🔐 Testing login endpoint...');
    const loginResponse = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful, got access token');
      
      // Test authenticated endpoint
      console.log('🎮 Testing games endpoint...');
      const gamesResponse = await fetch('http://localhost:3001/api/v1/games', {
        headers: {
          'Authorization': `Bearer ${loginData.access_token}`
        }
      });
      
      if (gamesResponse.ok) {
        const gamesData = await gamesResponse.json();
        console.log('✅ Games endpoint working, found', gamesData.data?.length || 0, 'games');
      } else {
        console.log('❌ Games endpoint failed:', gamesResponse.status);
      }
      
      // Test roles endpoint
      console.log('👥 Testing roles endpoint...');
      const rolesResponse = await fetch('http://localhost:3001/api/v1/roles', {
        headers: {
          'Authorization': `Bearer ${loginData.access_token}`
        }
      });
      
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        console.log('✅ Roles endpoint working, found', rolesData.roles?.length || 0, 'roles');
      } else {
        console.log('❌ Roles endpoint failed:', rolesResponse.status);
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.status);
      const errorData = await loginResponse.text();
      console.log('Error:', errorData);
    }
    
    console.log('🎉 Endpoint tests completed!');
    
  } catch (error) {
    console.error('❌ Endpoint test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEndpoints();
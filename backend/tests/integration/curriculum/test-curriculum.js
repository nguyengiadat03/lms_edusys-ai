const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testCurriculumEndpoint() {
  try {
    console.log('🔍 Testing curriculum endpoint with Prisma...');
    
    // Get or create test user
    let user = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });
    
    if (!user) {
      const tenant = await prisma.tenant.findFirst({
        where: { code: 'TEST_TENANT' }
      });
      
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
    }
    
    // Login to get token
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
    
    const loginData = await loginResponse.json();
    const token = loginData.access_token;
    
    // Test curriculum endpoint
    console.log('📚 Testing curriculum endpoint...');
    const curriculumResponse = await fetch('http://localhost:3001/api/v1/kct', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Response status:', curriculumResponse.status);
    
    if (curriculumResponse.ok) {
      const curriculumData = await curriculumResponse.json();
      console.log('✅ Curriculum endpoint working!');
      console.log('Found', curriculumData.data?.length || 0, 'curriculum frameworks');
      console.log('Pagination:', curriculumData.page, '/', curriculumData.total_pages);
    } else {
      const errorText = await curriculumResponse.text();
      console.log('❌ Curriculum endpoint failed:', curriculumResponse.status);
      console.log('Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCurriculumEndpoint();
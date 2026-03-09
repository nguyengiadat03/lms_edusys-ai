const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testCurriculumCreate() {
  try {
    console.log('🔍 Testing curriculum create with Prisma...');
    
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
    
    // Create test curriculum
    console.log('📚 Creating test curriculum...');
    const createResponse = await fetch('http://localhost:3001/api/v1/kct', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: 'TEST-CURRICULUM-001',
        name: 'Test English Curriculum',
        language: 'en',
        target_level: 'B1',
        age_group: 'adults',
        description: 'A test curriculum for English learning',
        tags: ['english', 'test', 'b1']
      })
    });
    
    console.log('Create response status:', createResponse.status);
    
    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('✅ Curriculum created successfully!');
      console.log('Created curriculum:', createData.data);
      
      // Test list again to see the new curriculum
      console.log('📚 Testing list after create...');
      const listResponse = await fetch('http://localhost:3001/api/v1/kct', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (listResponse.ok) {
        const listData = await listResponse.json();
        console.log('✅ Found', listData.data?.length || 0, 'curriculum frameworks');
        if (listData.data && listData.data.length > 0) {
          console.log('First curriculum:', listData.data[0]);
        }
      }
      
    } else {
      const errorText = await createResponse.text();
      console.log('❌ Create failed:', createResponse.status);
      console.log('Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCurriculumCreate();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAssignmentsEndpoint() {
  try {
    console.log('🔍 Testing assignments endpoint with Prisma...');
    
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
    
    // Test assignments list endpoint
    console.log('📝 Testing assignments list...');
    const listResponse = await fetch('http://localhost:3001/api/v1/assignments?page=1&pageSize=8', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('List response status:', listResponse.status);
    
    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log('✅ Assignments list working!');
      console.log('Found', listData.data?.length || 0, 'assignments');
      console.log('Pagination:', listData.pagination);
      
      // If no assignments, seed some
      if (listData.data?.length === 0) {
        console.log('📝 Seeding sample assignments...');
        const seedResponse = await fetch('http://localhost:3001/api/v1/assignments/seed', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (seedResponse.ok) {
          console.log('✅ Sample assignments seeded');
          
          // Test list again
          const listResponse2 = await fetch('http://localhost:3001/api/v1/assignments?page=1&pageSize=8', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (listResponse2.ok) {
            const listData2 = await listResponse2.json();
            console.log('✅ Found', listData2.data?.length || 0, 'assignments after seeding');
            if (listData2.data && listData2.data.length > 0) {
              console.log('First assignment:', listData2.data[0]);
            }
          }
        }
      }
      
    } else {
      const errorText = await listResponse.text();
      console.log('❌ Assignments list failed:', listResponse.status);
      console.log('Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAssignmentsEndpoint();
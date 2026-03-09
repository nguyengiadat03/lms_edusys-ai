const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAssignmentCreate() {
  try {
    console.log('🔍 Testing assignment create with Prisma...');
    
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
    
    // Create test assignment
    console.log('📝 Creating test assignment...');
    const createResponse = await fetch('http://localhost:3001/api/v1/assignments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Test Writing Assignment',
        level: 'intermediate',
        skill: 'writing',
        duration_minutes: 60,
        type: 'essay',
        description: 'Write a 300-word essay about your favorite hobby',
        tags: ['writing', 'essay', 'intermediate'],
        difficulty: 'medium',
        visibility: 'public',
        objectives: [
          'Practice essay writing skills',
          'Use appropriate vocabulary',
          'Organize ideas coherently'
        ],
        content_type: 'essay',
        content: {
          prompt: 'Write about your favorite hobby and explain why you enjoy it.',
          word_count: 300,
          time_limit: 60
        }
      })
    });
    
    console.log('Create response status:', createResponse.status);
    
    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('✅ Assignment created successfully!');
      console.log('Created assignment:', createData.data);
      
      // Test get assignment by ID
      const assignmentId = createData.data.id;
      console.log(`📝 Testing get assignment ${assignmentId}...`);
      
      const getResponse = await fetch(`http://localhost:3001/api/v1/assignments/${assignmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (getResponse.ok) {
        const getData = await getResponse.json();
        console.log('✅ Get assignment working!');
        console.log('Assignment details:', {
          id: getData.data.id,
          title: getData.data.title,
          content: getData.data.content,
          objectives: getData.data.objectives
        });
      }
      
      // Test list with filters
      console.log('📝 Testing filtered list...');
      const filteredResponse = await fetch('http://localhost:3001/api/v1/assignments?skill=writing&level=intermediate', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (filteredResponse.ok) {
        const filteredData = await filteredResponse.json();
        console.log('✅ Filtered list working!');
        console.log('Found', filteredData.data?.length || 0, 'writing assignments');
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

testAssignmentCreate();
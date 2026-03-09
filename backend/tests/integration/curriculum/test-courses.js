const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCoursesEndpoint() {
  try {
    console.log('🔍 Testing courses endpoint with Prisma...');
    
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
    
    // First, we need to create a curriculum framework version to test with
    console.log('📚 Creating test curriculum framework version...');
    
    // Get existing curriculum framework
    const framework = await prisma.curriculumFramework.findFirst({
      where: { code: 'TEST-CURRICULUM-001' }
    });
    
    if (!framework) {
      console.log('❌ No test curriculum framework found. Please run curriculum tests first.');
      return;
    }
    
    // Create a version
    let version = await prisma.curriculumFrameworkVersion.findFirst({
      where: { framework_id: framework.id }
    });
    
    if (!version) {
      version = await prisma.curriculumFrameworkVersion.create({
        data: {
          framework_id: framework.id,
          version_no: '1.0.0',
          state: 'draft',
          created_by: BigInt(1),
          updated_by: BigInt(1)
        }
      });
      console.log('✅ Created test version:', version.id.toString());
    }
    
    const versionId = version.id.toString();
    
    // Test courses by version endpoint
    console.log(`📖 Testing courses by version ${versionId}...`);
    const coursesResponse = await fetch(`http://localhost:3001/api/v1/courses/versions/${versionId}/courses`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Courses response status:', coursesResponse.status);
    
    if (coursesResponse.ok) {
      const coursesData = await coursesResponse.json();
      console.log('✅ Courses by version working!');
      console.log('Found', coursesData.data?.length || 0, 'courses');
      
      // If no courses, create one
      if (coursesData.data?.length === 0) {
        console.log('📖 Creating test course...');
        const createResponse = await fetch(`http://localhost:3001/api/v1/courses/versions/${versionId}/courses`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: 'Test English Course',
            subtitle: 'Basic English for Beginners',
            level: 'A1',
            hours: 40,
            summary: 'A comprehensive course for English beginners',
            learning_outcomes: [
              'Understand basic English vocabulary',
              'Form simple sentences',
              'Introduce yourself in English'
            ],
            assessment_types: ['quiz', 'speaking', 'writing'],
            prerequisites: 'None'
          })
        });
        
        if (createResponse.ok) {
          const createData = await createResponse.json();
          console.log('✅ Course created:', createData.data);
          
          // Test get course by ID
          const courseId = createData.data.id;
          console.log(`📖 Testing get course ${courseId}...`);
          
          const getResponse = await fetch(`http://localhost:3001/api/v1/courses/${courseId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (getResponse.ok) {
            const getData = await getResponse.json();
            console.log('✅ Get course working!');
            console.log('Course details:', {
              id: getData.data.id,
              title: getData.data.title,
              level: getData.data.level,
              hours: getData.data.hours,
              units_count: getData.data.unit_blueprints?.length || 0
            });
          }
        } else {
          const errorText = await createResponse.text();
          console.log('❌ Create course failed:', createResponse.status);
          console.log('Error:', errorText);
        }
      }
      
    } else {
      const errorText = await coursesResponse.text();
      console.log('❌ Courses by version failed:', coursesResponse.status);
      console.log('Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCoursesEndpoint();
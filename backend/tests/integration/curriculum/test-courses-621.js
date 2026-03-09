const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCourses621() {
  try {
    console.log('🔍 Testing courses endpoint with version ID 621...');
    
    // Login to get token
    const loginResponse = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@edusys.ai',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.access_token;
    
    // Test the exact endpoint that frontend is calling
    console.log('📖 Testing /api/v1/courses/versions/621/courses...');
    const coursesResponse = await fetch('http://localhost:3001/api/v1/courses/versions/621/courses', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Response status:', coursesResponse.status);
    
    if (coursesResponse.ok) {
      const coursesData = await coursesResponse.json();
      console.log('✅ Endpoint working!');
      console.log('Found', coursesData.data?.length || 0, 'courses');
    } else {
      const errorText = await coursesResponse.text();
      console.log('❌ Endpoint failed:', coursesResponse.status);
      console.log('Error:', errorText);
      
      // Check if version 621 exists
      console.log('🔍 Checking if version 621 exists...');
      const version = await prisma.curriculumFrameworkVersion.findFirst({
        where: { id: BigInt(621) },
        include: {
          framework: {
            select: {
              name: true,
              tenant_id: true
            }
          }
        }
      });
      
      if (version) {
        console.log('✅ Version 621 exists:', {
          id: version.id.toString(),
          version_no: version.version_no,
          state: version.state,
          framework_name: version.framework.name,
          tenant_id: version.framework.tenant_id.toString()
        });
      } else {
        console.log('❌ Version 621 does not exist');
        
        // List available versions
        const versions = await prisma.curriculumFrameworkVersion.findMany({
          include: {
            framework: {
              select: {
                name: true,
                tenant_id: true
              }
            }
          },
          take: 5
        });
        
        console.log('📋 Available versions:');
        versions.forEach(v => {
          console.log(`  - ID: ${v.id.toString()}, Version: ${v.version_no}, Framework: ${v.framework.name}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCourses621();
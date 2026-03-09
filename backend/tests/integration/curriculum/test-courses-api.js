// Use built-in fetch (Node.js 18+)
const fetch = globalThis.fetch;

async function testCoursesAPI() {
  try {
    console.log('🔍 Testing Courses API...');
    
    // First login to get token
    console.log('\n🔐 Logging in to get access token...');
    const loginResponse = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@edusys.ai',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed');
      return;
    }
    
    const loginData = await loginResponse.json();
    const accessToken = loginData.access_token;
    console.log('✅ Login successful, got access token');
    
    // Test Courses API
    console.log('\n📚 Testing GET /api/v1/courses/versions/621/courses...');
    const coursesResponse = await fetch('http://localhost:3001/api/v1/courses/versions/621/courses', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 Courses API status: ${coursesResponse.status}`);
    
    if (coursesResponse.ok) {
      const coursesData = await coursesResponse.json();
      console.log('✅ Courses API successful!');
      console.log(`📄 Response: ${JSON.stringify(coursesData, null, 2)}`);
    } else {
      const errorText = await coursesResponse.text();
      console.log(`❌ Courses API failed: ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing Courses API:', error);
  }
}

// Run test
if (require.main === module) {
  testCoursesAPI()
    .then(() => {
      console.log('\n✅ Courses API test completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Courses API test failed:', error);
      process.exit(1);
    });
}

module.exports = { testCoursesAPI };
// Use built-in fetch (Node.js 18+)
const fetch = globalThis.fetch;

async function testAssignmentsAPI() {
  try {
    console.log('🔍 Testing Assignments API...');
    
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
    
    // Test Assignments API
    console.log('\n📚 Testing GET /api/v1/assignments...');
    const assignmentsResponse = await fetch('http://localhost:3001/api/v1/assignments?page=1&pageSize=8', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 Assignments API status: ${assignmentsResponse.status}`);
    
    if (assignmentsResponse.ok) {
      const assignmentsData = await assignmentsResponse.json();
      console.log('✅ Assignments API successful!');
      console.log(`📄 Response: ${JSON.stringify(assignmentsData, null, 2)}`);
    } else {
      const errorText = await assignmentsResponse.text();
      console.log(`❌ Assignments API failed: ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing Assignments API:', error);
  }
}

// Run test
if (require.main === module) {
  testAssignmentsAPI()
    .then(() => {
      console.log('\n✅ Assignments API test completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Assignments API test failed:', error);
      process.exit(1);
    });
}

module.exports = { testAssignmentsAPI };
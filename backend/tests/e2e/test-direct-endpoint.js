// Test direct API call to curriculum endpoint
const fetch = globalThis.fetch;

async function testDirectEndpoint() {
  try {
    console.log('🔍 Testing direct curriculum endpoint...');
    
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
    
    // Test direct database query endpoint (we'll create this)
    console.log('\n📚 Testing direct database query...');
    
    // Create a simple test endpoint
    const testResponse = await fetch('http://localhost:3001/test-curriculum-direct', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 Test endpoint status: ${testResponse.status}`);
    
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('✅ Test endpoint successful!');
      console.log(`📄 Response: ${JSON.stringify(testData, null, 2)}`);
    } else {
      const errorText = await testResponse.text();
      console.log(`❌ Test endpoint failed: ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing direct endpoint:', error);
  }
}

testDirectEndpoint();
// Use built-in fetch (Node.js 18+)
const fetch = globalThis.fetch;

async function testKCTAPI() {
  try {
    console.log('🔍 Testing KCT API...');
    
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
    
    // Test KCT API
    console.log('\n📚 Testing GET /api/v1/kct...');
    const kctResponse = await fetch('http://localhost:3001/api/v1/kct', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 KCT API status: ${kctResponse.status}`);
    
    if (kctResponse.ok) {
      const kctData = await kctResponse.json();
      console.log('✅ KCT API successful!');
      console.log(`📄 Response: ${JSON.stringify(kctData, null, 2)}`);
    } else {
      const errorText = await kctResponse.text();
      console.log(`❌ KCT API failed: ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing KCT API:', error);
  }
}

// Run test
if (require.main === module) {
  testKCTAPI()
    .then(() => {
      console.log('\n✅ KCT API test completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('KCT API test failed:', error);
      process.exit(1);
    });
}

module.exports = { testKCTAPI };
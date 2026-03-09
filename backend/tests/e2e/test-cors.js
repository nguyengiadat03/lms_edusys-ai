// Use built-in fetch (Node.js 18+)
const fetch = globalThis.fetch;

async function testCORS() {
  try {
    console.log('🔍 Testing CORS and API from different origins...');
    
    // Test 1: Direct API call (should work)
    console.log('\n1️⃣ Testing direct API call...');
    const response1 = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    console.log(`   Status: ${response1.status}`);
    if (response1.ok) {
      console.log('   ✅ Direct API call successful');
    } else {
      const errorText = await response1.text();
      console.log(`   ❌ Direct API call failed: ${errorText}`);
    }
    
    // Test 2: API call with Origin header (simulating frontend)
    console.log('\n2️⃣ Testing API call with Origin header...');
    const response2 = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    console.log(`   Status: ${response2.status}`);
    if (response2.ok) {
      console.log('   ✅ CORS API call successful');
    } else {
      const errorText = await response2.text();
      console.log(`   ❌ CORS API call failed: ${errorText}`);
    }
    
    // Test 3: Health check
    console.log('\n3️⃣ Testing health check...');
    const response3 = await fetch('http://localhost:3001/health');
    console.log(`   Status: ${response3.status}`);
    if (response3.ok) {
      const health = await response3.json();
      console.log(`   ✅ Health check: ${health.status}`);
    } else {
      console.log('   ❌ Health check failed');
    }
    
    // Test 4: Invalid credentials
    console.log('\n4️⃣ Testing invalid credentials...');
    const response4 = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword'
      })
    });
    
    console.log(`   Status: ${response4.status}`);
    const errorResponse = await response4.text();
    console.log(`   Response: ${errorResponse}`);
    
  } catch (error) {
    console.error('❌ Error testing CORS:', error);
  }
}

// Run test
if (require.main === module) {
  testCORS()
    .then(() => {
      console.log('\n✅ CORS test completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('CORS test failed:', error);
      process.exit(1);
    });
}

module.exports = { testCORS };
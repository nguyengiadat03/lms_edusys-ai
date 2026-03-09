// Use built-in fetch (Node.js 18+)
const fetch = globalThis.fetch;

async function finalLoginTest() {
  try {
    console.log('🔍 Final login test with new credentials...');
    
    // Test with new credentials
    console.log('\n🔐 Testing login with admin@edusys.ai / admin123...');
    const response = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
      },
      body: JSON.stringify({
        email: 'admin@edusys.ai',
        password: 'admin123'
      })
    });
    
    console.log(`📡 Response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login successful!');
      console.log('📄 Response data:');
      console.log(`   - Access token: ${data.access_token ? 'Present' : 'Missing'}`);
      console.log(`   - Refresh token: ${data.refresh_token ? 'Present' : 'Missing'}`);
      console.log(`   - User ID: ${data.user?.id}`);
      console.log(`   - User email: ${data.user?.email}`);
      console.log(`   - User role: ${data.user?.role}`);
      console.log(`   - Expires in: ${data.expires_in} seconds`);
      
      // Test the access token
      console.log('\n🔑 Testing access token with /auth/me...');
      const meResponse = await fetch('http://localhost:3001/api/v1/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📡 /auth/me status: ${meResponse.status}`);
      if (meResponse.ok) {
        const meData = await meResponse.json();
        console.log('✅ Token validation successful!');
        console.log(`   - User: ${meData.user?.full_name} (${meData.user?.email})`);
      } else {
        const errorText = await meResponse.text();
        console.log(`❌ Token validation failed: ${errorText}`);
      }
      
    } else {
      const errorText = await response.text();
      console.log(`❌ Login failed: ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Error in final login test:', error);
  }
}

// Run test
if (require.main === module) {
  finalLoginTest()
    .then(() => {
      console.log('\n✅ Final login test completed!');
      console.log('\n🎯 READY FOR FRONTEND LOGIN:');
      console.log('   URL: http://localhost:5173/login');
      console.log('   Email: admin@edusys.ai');
      console.log('   Password: admin123');
      process.exit(0);
    })
    .catch(error => {
      console.error('Final login test failed:', error);
      process.exit(1);
    });
}

module.exports = { finalLoginTest };
const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login API...\n');
    
    const response = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    console.log('✅ Login successful!');
    console.log('\nResponse:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Login failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testLogin();

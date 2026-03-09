const axios = require('axios');

async function testCollectionsAPI() {
  try {
    console.log('Testing collections API...');

    // Test POST /api/v1/documents/collections (create collection)
    const createResponse = await axios.post('http://localhost:3001/api/v1/documents/collections', {
      name: 'Test Collection API',
      description: 'Created via API test',
      is_public: false
    }, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidGVuYW50X2lkIjoxLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3MzAwMDAwMDAsImV4cCI6MTc5MDAwMDAwMH0.test_token',
        'Content-Type': 'application/json'
      }
    });

    console.log('Create collection response:', createResponse.status);
    console.log('Create data:', JSON.stringify(createResponse.data, null, 2));

    // Test GET /api/v1/documents/collections
    const response = await axios.get('http://localhost:3001/api/v1/documents/collections', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidGVuYW50X2lkIjoxLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3MzAwMDAwMDAsImV4cCI6MTc5MDAwMDAwMH0.test_token'
      }
    });

    console.log('API Response:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('API Error:', error.response?.status, error.response?.data || error.message);
    console.error('Full error:', error);
  }
}

testCollectionsAPI();
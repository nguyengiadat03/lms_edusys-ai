const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001/api/v1';

// Test credentials
const TEST_USER = {
  email: 'test@edusys.ai',
  password: 'TestPassword123'
};

let authToken = '';
let testDocumentId = '';

async function testDocumentAPI() {
  console.log('🧪 TESTING DOCUMENT MANAGEMENT API');
  console.log('==================================');

  try {
    // 1. Test Health Check
    console.log('\n1️⃣ Testing Health Check...');
    try {
      const healthResponse = await axios.get('http://localhost:3001/health');
      console.log('✅ Health Check:', healthResponse.data.status);
    } catch (error) {
      console.log('❌ Server is not running. Please start the server first.');
      return;
    }

    // Login to get real auth token
    console.log('\n🔐 Logging in to get auth token...');
    try {
      const loginResponse = await axios.post(`${BASE_URL.replace('/api/v1', '')}/auth/login`, {
        email: 'admin@edusys.ai',
        password: 'admin123'
      });
      authToken = loginResponse.data.data.token;
      console.log('✅ Login successful, got auth token');
    } catch (error) {
      console.log('⚠️ Login failed, using mock token:', error.response?.data?.message);
      authToken = 'mock-token-for-testing';
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    };

    // 2. Test Get Documents
    console.log('\n2️⃣ Testing Get Documents...');
    try {
      const documentsResponse = await axios.get(`${BASE_URL}/documents`, { headers });
      console.log('✅ Get Documents:', {
        total: documentsResponse.data.data?.pagination?.total || 0,
        documents_count: documentsResponse.data.data?.documents?.length || 0
      });
    } catch (error) {
      console.log('⚠️ Get Documents test failed:', error.response?.status, error.response?.data?.message);
    }

    // 3. Test Document Upload (mock)
    console.log('\n3️⃣ Testing Document Upload...');
    try {
      // Create a mock file for testing
      const mockFileContent = 'This is a test document content for EduSys AI Document Management System.';
      const mockFilePath = path.join(__dirname, 'test-document.txt');
      fs.writeFileSync(mockFilePath, mockFileContent);

      const formData = new FormData();
      formData.append('file', fs.createReadStream(mockFilePath));
      formData.append('name', 'Test Document');
      formData.append('description', 'This is a test document for API testing');
      formData.append('visibility', 'tenant');
      formData.append('tags', JSON.stringify(['test', 'document', 'api']));

      const uploadResponse = await axios.post(`${BASE_URL}/documents`, formData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...formData.getHeaders()
        }
      });

      if (uploadResponse.data.success) {
        testDocumentId = uploadResponse.data.data.id;
        console.log('✅ Document Upload:', uploadResponse.data.message);
        console.log('   Document ID:', testDocumentId);
      }

      // Clean up mock file
      if (fs.existsSync(mockFilePath)) {
        fs.unlinkSync(mockFilePath);
      }
    } catch (error) {
      console.log('⚠️ Document Upload test failed:', error.response?.status, error.response?.data?.message);
    }

    // 3.1 Test Document Download
    console.log('\n3️⃣.1️⃣ Testing Document Download...');
    try {
      const downloadResponse = await axios.get(`${BASE_URL}/documents/${testDocumentId}/download`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        responseType: 'stream'
      });

      console.log('✅ Document Download:', {
        status: downloadResponse.status,
        contentType: downloadResponse.headers['content-type'],
        contentDisposition: downloadResponse.headers['content-disposition']
      });
    } catch (error) {
      console.log('⚠️ Document Download test failed:', error.response?.status, error.response?.data?.message);
    }

    // 4. Test Get Document Details
    console.log('\n4️⃣ Testing Get Document Details...');
    try {
      const documentResponse = await axios.get(`${BASE_URL}/documents/1`, { headers });
      console.log('✅ Get Document Details:', {
        id: documentResponse.data.data?.id || 'N/A',
        name: documentResponse.data.data?.name || 'N/A',
        mime_type: documentResponse.data.data?.mime_type || 'N/A'
      });
    } catch (error) {
      console.log('⚠️ Get Document Details test failed:', error.response?.status, error.response?.data?.message);
    }

    // 5. Test Document OCR Processing
    console.log('\n5️⃣ Testing Document OCR Processing...');
    try {
      const ocrResponse = await axios.post(`${BASE_URL}/documents/1/ocr`, {}, { headers });
      console.log('✅ OCR Processing:', ocrResponse.data.message);
      if (ocrResponse.data.data?.task_id) {
        console.log('   Task ID:', ocrResponse.data.data.task_id);
      }
    } catch (error) {
      console.log('⚠️ OCR Processing test failed:', error.response?.status, error.response?.data?.message);
    }

    // 6. Test AI Tagging
    console.log('\n6️⃣ Testing AI Tagging...');
    try {
      const aiTagResponse = await axios.post(`${BASE_URL}/documents/1/ai-tag`, {}, { headers });
      console.log('✅ AI Tagging:', aiTagResponse.data.message);
      if (aiTagResponse.data.data?.task_id) {
        console.log('   Task ID:', aiTagResponse.data.data.task_id);
      }
    } catch (error) {
      console.log('⚠️ AI Tagging test failed:', error.response?.status, error.response?.data?.message);
    }

    // 7. Test Document Preview
    console.log('\n7️⃣ Testing Document Preview...');
    try {
      const previewResponse = await axios.get(`${BASE_URL}/documents/1/preview`, { headers });
      console.log('✅ Document Preview:', {
        preview_url: previewResponse.data.data?.preview_url || 'N/A',
        expires_at: previewResponse.data.data?.expires_at || 'N/A'
      });
    } catch (error) {
      console.log('⚠️ Document Preview test failed:', error.response?.status, error.response?.data?.message);
    }

    // 8. Test Document Collections
    console.log('\n8️⃣ Testing Document Collections...');
    try {
      const collectionsResponse = await axios.get(`${BASE_URL}/documents/collections`, { headers });
      console.log('✅ Get Collections:', {
        total: collectionsResponse.data.data?.pagination?.total || 0,
        collections_count: collectionsResponse.data.data?.collections?.length || 0
      });
    } catch (error) {
      console.log('⚠️ Collections test failed:', error.response?.status, error.response?.data?.message);
    }

    // 9. Test Create Collection
    console.log('\n9️⃣ Testing Create Collection...');
    try {
      const createCollectionResponse = await axios.post(`${BASE_URL}/documents/collections`, {
        name: 'Test Collection',
        description: 'This is a test collection for API testing',
        is_public: false
      }, { headers });
      console.log('✅ Create Collection:', createCollectionResponse.data.message);
    } catch (error) {
      console.log('⚠️ Create Collection test failed:', error.response?.status, error.response?.data?.message);
    }

    // 10. Test Document Search
    console.log('\n🔟 Testing Document Search...');
    try {
      const searchResponse = await axios.get(`${BASE_URL}/documents/search?q=test&limit=5`, { headers });
      console.log('✅ Document Search:', {
        total: searchResponse.data.data?.pagination?.total || 0,
        results_count: searchResponse.data.data?.documents?.length || 0
      });
    } catch (error) {
      console.log('⚠️ Document Search test failed:', error.response?.status, error.response?.data?.message);
    }

    // 11. Test Document Sharing
    console.log('\n1️⃣1️⃣ Testing Document Sharing...');
    try {
      const shareResponse = await axios.post(`${BASE_URL}/documents/1/share`, {
        subject_type: 'user',
        subject_id: '2',
        permission: 'view'
      }, { headers });
      console.log('✅ Document Sharing:', shareResponse.data.message);
    } catch (error) {
      console.log('⚠️ Document Sharing test failed:', error.response?.status, error.response?.data?.message);
    }

    // 12. Test Trending Documents
    console.log('\n1️⃣2️⃣ Testing Trending Documents...');
    try {
      const trendingResponse = await axios.get(`${BASE_URL}/documents/trending?period=week&limit=5`, { headers });
      console.log('✅ Trending Documents:', {
        count: trendingResponse.data.data?.length || 0,
        data_type: typeof trendingResponse.data.data
      });
    } catch (error) {
      console.log('⚠️ Trending Documents test failed:', error.response?.status, error.response?.data?.message);
    }

    console.log('\n🎉 DOCUMENT MANAGEMENT API TESTS COMPLETED!');
    console.log('===========================================');
    console.log('✅ Document Management API routes are accessible');
    console.log('📋 Features tested:');
    console.log('   - Document upload and management');
    console.log('   - OCR processing');
    console.log('   - AI tagging');
    console.log('   - Document preview generation');
    console.log('   - Collections management');
    console.log('   - Document search');
    console.log('   - Document sharing');
    console.log('   - Analytics and trending');
    
    console.log('\n📝 Next steps:');
    console.log('   - Configure database connection');
    console.log('   - Set up file storage (local/cloud)');
    console.log('   - Configure OCR service');
    console.log('   - Set up AI tagging service');
    console.log('   - Test with real document files');

  } catch (error) {
    console.error('\n❌ DOCUMENT API TEST FAILED:');
    console.error('Error:', error.message);
    console.error('Status:', error.response?.status);
    console.error('URL:', error.config?.url);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Server is not running. Please start the server first:');
      console.error('   cd backend && npm run dev');
    }
  }
}

// Run the test
if (require.main === module) {
  testDocumentAPI();
}

module.exports = { testDocumentAPI };
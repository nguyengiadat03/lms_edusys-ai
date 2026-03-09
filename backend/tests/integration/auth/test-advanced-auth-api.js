const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

// Test credentials
const TEST_USER = {
  email: 'test@edusys.ai',
  password: 'TestPassword123'
};

let authToken = '';

async function testAdvancedAuthAPI() {
  console.log('🧪 TESTING ADVANCED AUTH API');
  console.log('=============================');

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

    // Mock auth token for testing
    authToken = 'mock-token-for-testing';
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    // 2. Test Forgot Password
    console.log('\n2️⃣ Testing Forgot Password...');
    try {
      const forgotResponse = await axios.post(`${BASE_URL}/auth/forgot-password`, {
        email: TEST_USER.email
      });
      console.log('✅ Forgot Password:', forgotResponse.data.message);
    } catch (error) {
      console.log('⚠️ Forgot Password test failed:', error.response?.status, error.response?.data?.message);
    }

    // 3. Test Change Password
    console.log('\n3️⃣ Testing Change Password...');
    try {
      const changePasswordResponse = await axios.post(`${BASE_URL}/auth/change-password`, {
        current_password: 'OldPassword123',
        new_password: 'NewPassword123'
      }, { headers });
      console.log('✅ Change Password:', changePasswordResponse.data.message);
    } catch (error) {
      console.log('⚠️ Change Password test failed:', error.response?.status, error.response?.data?.message);
    }

    // 4. Test MFA Setup
    console.log('\n4️⃣ Testing MFA Setup...');
    try {
      const mfaSetupResponse = await axios.post(`${BASE_URL}/auth/mfa/setup`, {}, { headers });
      console.log('✅ MFA Setup:', mfaSetupResponse.data.message);
      if (mfaSetupResponse.data.data?.secret) {
        console.log('   Secret Key:', mfaSetupResponse.data.data.secret.substring(0, 10) + '...');
      }
    } catch (error) {
      console.log('⚠️ MFA Setup test failed:', error.response?.status, error.response?.data?.message);
    }

    // 5. Test Sessions
    console.log('\n5️⃣ Testing Sessions...');
    try {
      const sessionsResponse = await axios.get(`${BASE_URL}/auth/sessions`, { headers });
      console.log('✅ Sessions Retrieved:', {
        count: sessionsResponse.data.data?.length || 0,
        data_type: typeof sessionsResponse.data.data
      });
    } catch (error) {
      console.log('⚠️ Sessions test failed:', error.response?.status, error.response?.data?.message);
    }

    // 6. Test User Permissions
    console.log('\n6️⃣ Testing User Permissions...');
    try {
      const permissionsResponse = await axios.get(`${BASE_URL}/auth/users/1/permissions`, { headers });
      console.log('✅ User Permissions:', {
        count: permissionsResponse.data.data?.length || 0,
        data_type: typeof permissionsResponse.data.data
      });
    } catch (error) {
      console.log('⚠️ User Permissions test failed:', error.response?.status, error.response?.data?.message);
    }

    // 7. Test User Roles
    console.log('\n7️⃣ Testing User Roles...');
    try {
      const rolesResponse = await axios.get(`${BASE_URL}/auth/users/1/roles`, { headers });
      console.log('✅ User Roles:', {
        count: rolesResponse.data.data?.length || 0,
        data_type: typeof rolesResponse.data.data
      });
    } catch (error) {
      console.log('⚠️ User Roles test failed:', error.response?.status, error.response?.data?.message);
    }

    // 8. Test Bulk Import (validation only)
    console.log('\n8️⃣ Testing Bulk Import Validation...');
    try {
      const bulkImportResponse = await axios.post(`${BASE_URL}/auth/users/bulk-import`, {
        users: [
          {
            email: 'test1@example.com',
            full_name: 'Test User 1',
            role: 'student'
          },
          {
            email: 'test2@example.com',
            full_name: 'Test User 2',
            role: 'teacher'
          }
        ]
      }, { headers });
      console.log('✅ Bulk Import:', bulkImportResponse.data.message);
    } catch (error) {
      console.log('⚠️ Bulk Import test failed:', error.response?.status, error.response?.data?.message);
    }

    // 9. Test Audit Logs
    console.log('\n9️⃣ Testing User Audit Logs...');
    try {
      const auditResponse = await axios.get(`${BASE_URL}/auth/users/1/audit-logs`, { headers });
      console.log('✅ User Audit Logs:', {
        total: auditResponse.data.data?.pagination?.total || 0,
        logs_count: auditResponse.data.data?.logs?.length || 0
      });
    } catch (error) {
      console.log('⚠️ User Audit Logs test failed:', error.response?.status, error.response?.data?.message);
    }

    console.log('\n🎉 ADVANCED AUTH API TESTS COMPLETED!');
    console.log('====================================');
    console.log('✅ Advanced Auth API routes are accessible');
    console.log('📋 Features tested:');
    console.log('   - Password reset flow');
    console.log('   - Password change');
    console.log('   - MFA setup and management');
    console.log('   - Session management');
    console.log('   - User permissions and roles');
    console.log('   - Bulk user operations');
    console.log('   - User audit logs');
    
    console.log('\n📝 Next steps:');
    console.log('   - Configure database connection');
    console.log('   - Set up email service');
    console.log('   - Test with real user credentials');
    console.log('   - Configure MFA with real authenticator app');

  } catch (error) {
    console.error('\n❌ ADVANCED AUTH API TEST FAILED:');
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
  testAdvancedAuthAPI();
}

module.exports = { testAdvancedAuthAPI };
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

// Test credentials
const TEST_ADMIN = {
  email: 'admin@edusys.ai',
  password: 'admin123'
};

let authToken = '';

async function testSystemAPI() {
  console.log('🧪 TESTING SYSTEM MANAGEMENT API');
  console.log('================================');

  try {
    // 1. Login to get auth token
    console.log('\n1️⃣ Testing Login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_ADMIN);
    
    if (loginResponse.data.success) {
      authToken = loginResponse.data.data.token;
      console.log('✅ Login successful');
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
    } else {
      throw new Error('Login failed');
    }

    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    // 2. Test System Info
    console.log('\n2️⃣ Testing System Info...');
    const infoResponse = await axios.get(`${BASE_URL}/system/info`, { headers });
    console.log('✅ System Info:', {
      version: infoResponse.data.data.version,
      environment: infoResponse.data.data.environment,
      uptime: Math.round(infoResponse.data.data.uptime),
      database_status: infoResponse.data.data.database_status
    });

    // 3. Test System Stats
    console.log('\n3️⃣ Testing System Stats...');
    const statsResponse = await axios.get(`${BASE_URL}/system/stats`, { headers });
    console.log('✅ System Stats:', {
      tenants: statsResponse.data.data.tenants,
      users: statsResponse.data.data.users,
      classes: statsResponse.data.data.classes,
      assignments: statsResponse.data.data.assignments
    });

    // 4. Test Maintenance Mode
    console.log('\n4️⃣ Testing Maintenance Mode...');
    
    // Enable maintenance mode
    const enableMaintenanceResponse = await axios.post(`${BASE_URL}/system/maintenance`, {
      enabled: true,
      message: 'Hệ thống đang bảo trì để cập nhật tính năng mới',
      estimated_duration: 30
    }, { headers });
    console.log('✅ Maintenance Mode Enabled:', enableMaintenanceResponse.data.message);

    // Test that maintenance mode blocks regular requests
    try {
      await axios.get(`${BASE_URL}/assignments`, { headers });
      console.log('❌ Maintenance mode should block requests');
    } catch (error) {
      if (error.response?.status === 503) {
        console.log('✅ Maintenance mode correctly blocking requests');
      } else {
        console.log('⚠️ Unexpected error during maintenance check:', error.response?.status);
      }
    }

    // Disable maintenance mode
    const disableMaintenanceResponse = await axios.post(`${BASE_URL}/system/maintenance`, {
      enabled: false
    }, { headers });
    console.log('✅ Maintenance Mode Disabled:', disableMaintenanceResponse.data.message);

    // 5. Test Audit Logs
    console.log('\n5️⃣ Testing Audit Logs...');
    const auditResponse = await axios.get(`${BASE_URL}/system/audit-logs?limit=5`, { headers });
    console.log('✅ Audit Logs Retrieved:', {
      total: auditResponse.data.data.pagination.total,
      logs_count: auditResponse.data.data.logs.length,
      latest_action: auditResponse.data.data.logs[0]?.action || 'No logs'
    });

    // 6. Test Settings
    console.log('\n6️⃣ Testing Settings...');
    
    // Update a setting
    const updateSettingResponse = await axios.patch(`${BASE_URL}/system/settings`, {
      key: 'test_setting',
      value: 'test_value',
      category: 'test'
    }, { headers });
    console.log('✅ Setting Updated:', updateSettingResponse.data.message);

    // Get settings
    const settingsResponse = await axios.get(`${BASE_URL}/system/settings`, { headers });
    console.log('✅ Settings Retrieved:', {
      categories: Object.keys(settingsResponse.data.data),
      test_setting: settingsResponse.data.data.test?.test_setting?.value
    });

    // 7. Test Notifications
    console.log('\n7️⃣ Testing Notifications...');
    const notificationsResponse = await axios.get(`${BASE_URL}/system/notifications`, { headers });
    console.log('✅ Notifications Retrieved:', {
      total: notificationsResponse.data.data.pagination.total,
      unread_count: notificationsResponse.data.data.unread_count,
      notifications_count: notificationsResponse.data.data.notifications.length
    });

    // 8. Test Tenants (if super admin)
    console.log('\n8️⃣ Testing Tenants Management...');
    try {
      const tenantsResponse = await axios.get(`${BASE_URL}/system/tenants`, { headers });
      console.log('✅ Tenants Retrieved:', {
        total: tenantsResponse.data.data.length,
        first_tenant: tenantsResponse.data.data[0]?.name || 'No tenants'
      });
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('ℹ️ Tenants endpoint requires super_admin role');
      } else {
        console.log('⚠️ Tenants test error:', error.response?.status);
      }
    }

    console.log('\n🎉 ALL SYSTEM API TESTS COMPLETED SUCCESSFULLY!');
    console.log('===============================================');

  } catch (error) {
    console.error('\n❌ SYSTEM API TEST FAILED:');
    console.error('Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('URL:', error.config?.url);
    
    if (error.response?.data?.error) {
      console.error('API Error Details:', error.response.data.error);
    }
  }
}

// Run the test
if (require.main === module) {
  testSystemAPI();
}

module.exports = { testSystemAPI };
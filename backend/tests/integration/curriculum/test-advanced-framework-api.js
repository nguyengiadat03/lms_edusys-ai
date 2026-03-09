const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

// Test credentials
const testCredentials = {
  email: 'admin@edusys.ai',
  password: 'admin123'
};

let authToken = '';
let testFrameworkId = '';
let testVersionId = '';

async function login() {
  try {
    console.log('🔐 Đăng nhập...');
    const response = await axios.post(`${BASE_URL}/auth/login`, testCredentials);
    
    console.log('📊 Login response:', response.data);
    
    if (response.data.access_token) {
      authToken = response.data.access_token;
      console.log('✅ Đăng nhập thành công');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Lỗi đăng nhập:', error.response?.data || error.message);
    return false;
  }
}

async function getAuthHeaders() {
  return {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };
}

async function testCloneFramework() {
  try {
    console.log('\n📋 Test Clone Framework...');
    
    // First get a framework to clone
    const frameworksResponse = await axios.get(`${BASE_URL}/curriculum`, {
      headers: await getAuthHeaders()
    });
    
    if (frameworksResponse.data.data.length === 0) {
      console.log('⚠️ Không có framework để clone');
      return false;
    }
    
    const sourceFramework = frameworksResponse.data.data[0];
    testFrameworkId = sourceFramework.id;
    
    const cloneData = {
      name: `Cloned Framework ${Date.now()}`,
      code: `CLONE_${Date.now()}`,
      description: 'Test cloned framework',
      copy_courses: true,
      copy_units: true,
      copy_resources: false
    };
    
    const response = await axios.post(
      `${BASE_URL}/kct/${sourceFramework.id}/clone`,
      cloneData,
      { headers: await getAuthHeaders() }
    );
    
    if (response.data.success) {
      console.log('✅ Clone framework thành công');
      console.log('📊 Cloned framework:', {
        id: response.data.data.framework.id,
        name: response.data.data.framework.name,
        cloned_courses: response.data.data.cloned_courses
      });
      return response.data.data.framework.id;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Lỗi clone framework:', error.response?.data || error.message);
    return false;
  }
}

async function testExportFramework() {
  try {
    console.log('\n📤 Test Export Framework...');
    
    if (!testFrameworkId) {
      console.log('⚠️ Không có framework để export');
      return false;
    }
    
    const exportData = {
      format: 'pdf',
      include_courses: true,
      include_units: true,
      include_resources: false,
      template: 'standard'
    };
    
    const response = await axios.post(
      `${BASE_URL}/kct/${testFrameworkId}/export`,
      exportData,
      { headers: await getAuthHeaders() }
    );
    
    if (response.data.success) {
      console.log('✅ Export job được tạo thành công');
      console.log('📊 Export job:', {
        job_id: response.data.data.job_id,
        status: response.data.data.status,
        estimated_completion: response.data.data.estimated_completion
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Lỗi export framework:', error.response?.data || error.message);
    return false;
  }
}

async function testImportFramework() {
  try {
    console.log('\n📥 Test Import Framework...');
    
    const importData = {
      merge_strategy: 'merge',
      validate_only: true
    };
    
    const response = await axios.post(
      `${BASE_URL}/kct/import`,
      importData,
      { headers: await getAuthHeaders() }
    );
    
    if (response.data.success) {
      console.log('✅ Import job được tạo thành công');
      console.log('📊 Import job:', {
        job_id: response.data.data.job_id,
        status: response.data.data.status,
        validation_results: response.data.data.validation_results
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Lỗi import framework:', error.response?.data || error.message);
    return false;
  }
}

async function testCompareFrameworks() {
  try {
    console.log('\n🔍 Test Compare Frameworks...');
    
    // Get two frameworks to compare
    const frameworksResponse = await axios.get(`${BASE_URL}/curriculum`, {
      headers: await getAuthHeaders()
    });
    
    if (frameworksResponse.data.data.length < 2) {
      console.log('⚠️ Cần ít nhất 2 frameworks để so sánh');
      return false;
    }
    
    const framework1 = frameworksResponse.data.data[0];
    const framework2 = frameworksResponse.data.data[1];
    
    const response = await axios.get(
      `${BASE_URL}/kct/${framework1.id}/compare/${framework2.id}`,
      { headers: await getAuthHeaders() }
    );
    
    if (response.data.success) {
      console.log('✅ So sánh frameworks thành công');
      console.log('📊 Comparison result:', {
        similarity_score: response.data.data.similarity_score,
        total_differences: response.data.data.summary.total_differences,
        recommendation: response.data.data.summary.recommendation
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Lỗi compare frameworks:', error.response?.data || error.message);
    return false;
  }
}

async function testMergeFrameworks() {
  try {
    console.log('\n🔄 Test Merge Frameworks...');
    
    // Get two frameworks to merge
    const frameworksResponse = await axios.get(`${BASE_URL}/curriculum`, {
      headers: await getAuthHeaders()
    });
    
    if (frameworksResponse.data.data.length < 2) {
      console.log('⚠️ Cần ít nhất 2 frameworks để merge');
      return false;
    }
    
    const targetFramework = frameworksResponse.data.data[0];
    const sourceFramework = frameworksResponse.data.data[1];
    
    const mergeData = {
      source_id: sourceFramework.id,
      conflict_resolution: 'source',
      merge_courses: true,
      merge_units: true
    };
    
    const response = await axios.post(
      `${BASE_URL}/kct/${targetFramework.id}/merge`,
      mergeData,
      { headers: await getAuthHeaders() }
    );
    
    if (response.data.success) {
      console.log('✅ Merge frameworks thành công');
      console.log('📊 Merge result:', {
        merged_courses: response.data.data.merged_courses,
        merged_units: response.data.data.merged_units,
        conflicts_count: response.data.data.conflicts.length
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Lỗi merge frameworks:', error.response?.data || error.message);
    return false;
  }
}

async function testGetDependencies() {
  try {
    console.log('\n🔗 Test Get Dependencies...');
    
    if (!testFrameworkId) {
      console.log('⚠️ Không có framework để test');
      return false;
    }
    
    const response = await axios.get(
      `${BASE_URL}/kct/${testFrameworkId}/dependencies`,
      { headers: await getAuthHeaders() }
    );
    
    if (response.data.success) {
      console.log('✅ Lấy dependencies thành công');
      console.log('📊 Dependencies:', {
        total_classes: response.data.data.classes.total,
        active_classes: response.data.data.classes.active,
        total_assignments: response.data.data.assignments.total,
        can_delete: response.data.data.can_delete
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Lỗi get dependencies:', error.response?.data || error.message);
    return false;
  }
}

async function testValidateFramework() {
  try {
    console.log('\n✅ Test Validate Framework...');
    
    if (!testFrameworkId) {
      console.log('⚠️ Không có framework để validate');
      return false;
    }
    
    const response = await axios.post(
      `${BASE_URL}/kct/${testFrameworkId}/validate`,
      {},
      { headers: await getAuthHeaders() }
    );
    
    if (response.data.success) {
      console.log('✅ Validate framework thành công');
      console.log('📊 Validation result:', {
        valid: response.data.data.valid,
        errors: response.data.data.errors.length,
        warnings: response.data.data.warnings.length,
        completeness_score: response.data.data.statistics?.completeness_score
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Lỗi validate framework:', error.response?.data || error.message);
    return false;
  }
}

async function testCEFRMapping() {
  try {
    console.log('\n🎯 Test CEFR Mapping...');
    
    if (!testFrameworkId) {
      console.log('⚠️ Không có framework để test');
      return false;
    }
    
    // Get CEFR mapping
    const getResponse = await axios.get(
      `${BASE_URL}/kct/${testFrameworkId}/cefr-mapping`,
      { headers: await getAuthHeaders() }
    );
    
    if (getResponse.data.success) {
      console.log('✅ Lấy CEFR mapping thành công');
      console.log('📊 CEFR mapping:', {
        total_mappings: getResponse.data.data.statistics.total_mappings,
        mapped_courses: getResponse.data.data.statistics.mapped_courses,
        mapped_units: getResponse.data.data.statistics.mapped_units
      });
    }
    
    // Update CEFR mapping (mock data)
    const updateData = {
      mappings: [
        {
          course_id: '1',
          cefr_level: 'A1',
          skills: ['listening', 'speaking'],
          confidence: 0.85
        }
      ]
    };
    
    const updateResponse = await axios.post(
      `${BASE_URL}/kct/${testFrameworkId}/cefr-mapping`,
      updateData,
      { headers: await getAuthHeaders() }
    );
    
    if (updateResponse.data.success) {
      console.log('✅ Cập nhật CEFR mapping thành công');
      console.log('📊 Updated mappings:', updateResponse.data.data.updated_mappings);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Lỗi CEFR mapping:', error.response?.data || error.message);
    return false;
  }
}

async function testCoverageAnalysis() {
  try {
    console.log('\n📈 Test Coverage Analysis...');
    
    if (!testFrameworkId) {
      console.log('⚠️ Không có framework để test');
      return false;
    }
    
    const response = await axios.get(
      `${BASE_URL}/kct/${testFrameworkId}/coverage`,
      { headers: await getAuthHeaders() }
    );
    
    if (response.data.success) {
      console.log('✅ Coverage analysis thành công');
      console.log('📊 Coverage:', {
        overall_score: response.data.data.overall_score,
        courses_completeness: response.data.data.courses.completeness,
        units_completeness: response.data.data.units.completeness,
        recommendations: response.data.data.recommendations.length
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Lỗi coverage analysis:', error.response?.data || error.message);
    return false;
  }
}

async function testAISuggestions() {
  try {
    console.log('\n🤖 Test AI Suggestions...');
    
    if (!testFrameworkId) {
      console.log('⚠️ Không có framework để test');
      return false;
    }
    
    const suggestionsData = {
      focus_areas: ['structure', 'content', 'cefr_alignment'],
      target_level: 'B1',
      language: 'English'
    };
    
    const response = await axios.post(
      `${BASE_URL}/kct/${testFrameworkId}/ai-suggestions`,
      suggestionsData,
      { headers: await getAuthHeaders() }
    );
    
    if (response.data.success) {
      console.log('✅ AI suggestions thành công');
      console.log('📊 Suggestions:', {
        total_suggestions: response.data.data.summary.total_suggestions,
        high_priority: response.data.data.summary.high_priority,
        average_confidence: response.data.data.summary.average_confidence
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Lỗi AI suggestions:', error.response?.data || error.message);
    return false;
  }
}

async function testVersionControl() {
  try {
    console.log('\n🔄 Test Version Control...');
    
    // Get framework versions
    const frameworkResponse = await axios.get(`${BASE_URL}/curriculum`, {
      headers: await getAuthHeaders()
    });
    
    if (frameworkResponse.data.data.length === 0) {
      console.log('⚠️ Không có framework để test');
      return false;
    }
    
    const framework = frameworkResponse.data.data[0];
    
    // Create branch
    const branchData = {
      branch_name: `test-branch-${Date.now()}`,
      source_version_id: null // Use latest version
    };
    
    const branchResponse = await axios.post(
      `${BASE_URL}/kct/${framework.id}/branch`,
      branchData,
      { headers: await getAuthHeaders() }
    );
    
    if (branchResponse.data.success) {
      console.log('✅ Tạo branch thành công');
      console.log('📊 Branch:', {
        id: branchResponse.data.data.id,
        name: branchResponse.data.data.name,
        courses_copied: branchResponse.data.data.courses_copied
      });
      
      testVersionId = branchResponse.data.data.id;
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Lỗi version control:', error.response?.data || error.message);
    return false;
  }
}

async function testDeployment() {
  try {
    console.log('\n🚀 Test Deployment...');
    
    if (!testFrameworkId) {
      console.log('⚠️ Không có framework để deploy');
      return false;
    }
    
    // Get deployments
    const getResponse = await axios.get(
      `${BASE_URL}/kct/${testFrameworkId}/deployments`,
      { headers: await getAuthHeaders() }
    );
    
    if (getResponse.data.success) {
      console.log('✅ Lấy deployment history thành công');
      console.log('📊 Deployments:', {
        total: getResponse.data.data.summary.total,
        active: getResponse.data.data.summary.active,
        environments: getResponse.data.data.summary.environments
      });
    }
    
    // Deploy framework
    const deployData = {
      target_classes: ['1', '2'],
      deployment_type: 'immediate',
      rollback_enabled: true,
      notification_enabled: true
    };
    
    const deployResponse = await axios.post(
      `${BASE_URL}/kct/${testFrameworkId}/deploy`,
      deployData,
      { headers: await getAuthHeaders() }
    );
    
    if (deployResponse.data.success) {
      console.log('✅ Deploy framework thành công');
      console.log('📊 Deployment:', {
        id: deployResponse.data.data.id,
        status: deployResponse.data.data.status,
        target_classes: deployResponse.data.data.target_classes.length
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Lỗi deployment:', error.response?.data || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Bắt đầu test Advanced Framework API...\n');
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Không thể đăng nhập. Dừng test.');
    return;
  }
  
  const tests = [
    { name: 'Clone Framework', fn: testCloneFramework },
    { name: 'Export Framework', fn: testExportFramework },
    { name: 'Import Framework', fn: testImportFramework },
    { name: 'Compare Frameworks', fn: testCompareFrameworks },
    { name: 'Merge Frameworks', fn: testMergeFrameworks },
    { name: 'Get Dependencies', fn: testGetDependencies },
    { name: 'Validate Framework', fn: testValidateFramework },
    { name: 'CEFR Mapping', fn: testCEFRMapping },
    { name: 'Coverage Analysis', fn: testCoverageAnalysis },
    { name: 'AI Suggestions', fn: testAISuggestions },
    { name: 'Version Control', fn: testVersionControl },
    { name: 'Deployment', fn: testDeployment }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ Test ${test.name} failed:`, error.message);
      failed++;
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 KẾT QUẢ TEST:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
}

// Run tests
runAllTests().catch(console.error);
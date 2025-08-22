const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function testAPIEndpoints() {
  console.log('🧪 Testing API Endpoints...');
  
  try {
    // Test 1: Health check
    console.log('\n📋 Test 1: Health check');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`);
      console.log('✅ Health check passed:', healthResponse.data);
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
    }
    
    // Test 2: API documentation
    console.log('\n📋 Test 2: API documentation');
    try {
      const docsResponse = await axios.get(`${API_BASE_URL}/`);
      console.log('✅ API docs accessible');
    } catch (error) {
      console.log('❌ API docs failed:', error.message);
    }
    
    // Test 3: Dashboard stats endpoint (without auth)
    console.log('\n📋 Test 3: Dashboard stats endpoint (without auth)');
    try {
      const statsResponse = await axios.get(`${API_BASE_URL}/api/employees/dashboard/stats`);
      console.log('✅ Dashboard stats accessible (no auth required)');
    } catch (error) {
      console.log('❌ Dashboard stats failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
    
    // Test 4: Activities endpoint (without auth)
    console.log('\n📋 Test 4: Activities endpoint (without auth)');
    try {
      const activitiesResponse = await axios.get(`${API_BASE_URL}/api/activities/recent`);
      console.log('✅ Activities endpoint accessible (no auth required)');
    } catch (error) {
      console.log('❌ Activities endpoint failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
    
    console.log('\n🎉 API endpoint testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAPIEndpoints(); 
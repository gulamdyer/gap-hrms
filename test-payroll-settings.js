// Test script for payroll settings API
const axios = require('axios');

async function testPayrollSettings() {
  try {
    console.log('🧪 Testing payroll settings API...');
    
    // Test 1: Get all settings
    console.log('\n1. Testing GET /api/payroll/settings');
    const response1 = await axios.get('http://localhost:5000/api/payroll/settings', {
      headers: {
        'Authorization': 'Bearer dummy-token'  // Will need proper auth in real usage
      }
    });
    
    console.log('✅ Status:', response1.status);
    console.log('✅ Data keys:', Object.keys(response1.data.data || {}));
    
    // Test 2: Get country-specific settings (India)
    console.log('\n2. Testing GET /api/payroll/settings?countryCode=IND');
    const response2 = await axios.get('http://localhost:5000/api/payroll/settings?countryCode=IND', {
      headers: {
        'Authorization': 'Bearer dummy-token'
      }
    });
    
    console.log('✅ Status:', response2.status);
    console.log('✅ Country:', response2.data.countryCode);
    console.log('✅ Data keys:', Object.keys(response2.data.data || {}));
    
    // Test 3: Get UAE settings
    console.log('\n3. Testing GET /api/payroll/settings?countryCode=UAE');
    const response3 = await axios.get('http://localhost:5000/api/payroll/settings?countryCode=UAE', {
      headers: {
        'Authorization': 'Bearer dummy-token'
      }
    });
    
    console.log('✅ Status:', response3.status);
    console.log('✅ Country:', response3.data.countryCode);
    console.log('✅ UAE settings found:', Object.keys(response3.data.data || {}).length > 0);
    
    console.log('\n🎉 All tests passed! Payroll settings API is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.status, error.response?.data || error.message);
    
    if (error.response?.data) {
      console.error('Error details:', error.response.data);
    }
  }
}

testPayrollSettings();

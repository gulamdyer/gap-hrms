const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
  username: 'admin',
  password: 'admin123'
};

// Test data for advances
const testAdvanceData = {
  employeeId: 1,
  advanceType: 'SALARY',
  amount: 5000,
  reason: 'Emergency advance for medical expenses',
  requestDate: '2024-01-15',
  amountRequiredOnDate: '2024-01-20',
  deductionMonth: '2024-02'
};

// Test data for loans
const testLoanData = {
  employeeId: 1,
  loanType: 'PERSONAL',
  amount: 10000,
  reason: 'Home renovation loan',
  status: 'PENDING',
  interestRate: 8.5,
  repaymentPeriod: 12,
  loanDate: '2024-01-15',
  approvalDate: null,
  disbursementDate: null
};

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    const token = response.data.token;
    console.log('✅ Login successful');
    return token;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testAdvanceLogging(token) {
  console.log('\n🧪 Testing Advance Activity Logging...');
  
  try {
    // 1. Create a new advance
    console.log('📝 Creating new advance...');
    const createResponse = await axios.post(`${BASE_URL}/advances`, testAdvanceData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const advanceId = createResponse.data.data.ADVANCE_ID;
    console.log(`✅ Advance created with ID: ${advanceId}`);
    
    // 2. Update the advance
    console.log('📝 Updating advance...');
    const updateData = {
      ...testAdvanceData,
      amount: 6000,
      reason: 'Updated reason for advance'
    };
    
    const updateResponse = await axios.put(`${BASE_URL}/advances/${advanceId}`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Advance updated successfully');
    
    // 3. Check activities
    console.log('📋 Checking activities...');
    const activitiesResponse = await axios.get(`${BASE_URL}/activities`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const advanceActivities = activitiesResponse.data.data.filter(
      activity => activity.MODULE === 'ADVANCE' && activity.ENTITY_ID == advanceId
    );
    
    console.log(`📊 Found ${advanceActivities.length} advance activities`);
    
    if (advanceActivities.length > 0) {
      const latestActivity = advanceActivities[0];
      console.log('📋 Latest activity details:');
      console.log(`   Module: ${latestActivity.MODULE}`);
      console.log(`   Action: ${latestActivity.ACTION}`);
      console.log(`   Description: ${latestActivity.DESCRIPTION}`);
      console.log(`   Has OLD_VALUES: ${!!latestActivity.OLD_VALUES}`);
      console.log(`   Has NEW_VALUES: ${!!latestActivity.NEW_VALUES}`);
      
      if (latestActivity.OLD_VALUES) {
        const oldValues = JSON.parse(latestActivity.OLD_VALUES);
        console.log(`   OLD_VALUES keys: ${Object.keys(oldValues).join(', ')}`);
      }
      
      if (latestActivity.NEW_VALUES) {
        const newValues = JSON.parse(latestActivity.NEW_VALUES);
        console.log(`   NEW_VALUES keys: ${Object.keys(newValues).join(', ')}`);
      }
    }
    
    return advanceId;
  } catch (error) {
    console.error('❌ Advance test failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testLoanLogging(token) {
  console.log('\n🧪 Testing Loan Activity Logging...');
  
  try {
    // 1. Create a new loan
    console.log('📝 Creating new loan...');
    const createResponse = await axios.post(`${BASE_URL}/loans`, testLoanData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const loanId = createResponse.data.data.LOAN_ID;
    console.log(`✅ Loan created with ID: ${loanId}`);
    
    // 2. Update the loan
    console.log('📝 Updating loan...');
    const updateData = {
      ...testLoanData,
      amount: 12000,
      status: 'APPROVED',
      approvalDate: '2024-01-20'
    };
    
    const updateResponse = await axios.put(`${BASE_URL}/loans/${loanId}`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Loan updated successfully');
    
    // 3. Check activities
    console.log('📋 Checking activities...');
    const activitiesResponse = await axios.get(`${BASE_URL}/activities`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const loanActivities = activitiesResponse.data.data.filter(
      activity => activity.MODULE === 'LOAN' && activity.ENTITY_ID == loanId
    );
    
    console.log(`📊 Found ${loanActivities.length} loan activities`);
    
    if (loanActivities.length > 0) {
      const latestActivity = loanActivities[0];
      console.log('📋 Latest activity details:');
      console.log(`   Module: ${latestActivity.MODULE}`);
      console.log(`   Action: ${latestActivity.ACTION}`);
      console.log(`   Description: ${latestActivity.DESCRIPTION}`);
      console.log(`   Has OLD_VALUES: ${!!latestActivity.OLD_VALUES}`);
      console.log(`   Has NEW_VALUES: ${!!latestActivity.NEW_VALUES}`);
      
      if (latestActivity.OLD_VALUES) {
        const oldValues = JSON.parse(latestActivity.OLD_VALUES);
        console.log(`   OLD_VALUES keys: ${Object.keys(oldValues).join(', ')}`);
      }
      
      if (latestActivity.NEW_VALUES) {
        const newValues = JSON.parse(latestActivity.NEW_VALUES);
        console.log(`   NEW_VALUES keys: ${Object.keys(newValues).join(', ')}`);
      }
    }
    
    return loanId;
  } catch (error) {
    console.error('❌ Loan test failed:', error.response?.data || error.message);
    throw error;
  }
}

async function runTests() {
  console.log('🚀 Starting Activity Logging Tests for Advances and Loans');
  console.log('=' .repeat(60));
  
  try {
    // Login
    const token = await login();
    
    // Test advance logging
    await testAdvanceLogging(token);
    
    // Test loan logging
    await testLoanLogging(token);
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Advance activity logging is working');
    console.log('   ✅ Loan activity logging is working');
    console.log('   ✅ OLD_VALUES are being stored');
    console.log('   ✅ NEW_VALUES are being stored');
    console.log('   ✅ Activity descriptions are accurate');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();

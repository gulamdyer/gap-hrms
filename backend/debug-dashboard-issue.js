const { executeQuery } = require('./config/database');
const Employee = require('./models/Employee');

async function debugDashboardIssue() {
  console.log('🔍 Debugging Dashboard Issue...');
  
  try {
    // Test 1: Database connection
    console.log('\n📋 Test 1: Database connection');
    try {
      const result = await executeQuery('SELECT 1 as test FROM DUAL');
      console.log('✅ Database connection successful');
    } catch (error) {
      console.log('❌ Database connection failed:', error.message);
      return;
    }
    
    // Test 2: Employee model
    console.log('\n📋 Test 2: Employee model');
    try {
      const employees = await Employee.getAllEmployees({});
      console.log('✅ Employee model working, found', employees.length, 'employees');
    } catch (error) {
      console.log('❌ Employee model failed:', error.message);
    }
    
    // Test 3: Leave model
    console.log('\n📋 Test 3: Leave model');
    try {
      const Leave = require('./models/Leave');
      if (typeof Leave.getLeaveStatistics === 'function') {
        const leaveStats = await Leave.getLeaveStatistics();
        console.log('✅ Leave model working, stats:', leaveStats);
      } else {
        console.log('⚠️ Leave.getLeaveStatistics method not found');
      }
    } catch (error) {
      console.log('❌ Leave model failed:', error.message);
    }
    
    // Test 4: HRMS_EMPLOYEES table
    console.log('\n📋 Test 4: HRMS_EMPLOYEES table');
    try {
      const result = await executeQuery('SELECT COUNT(*) as count FROM HRMS_EMPLOYEES');
      console.log('✅ HRMS_EMPLOYEES table exists, count:', result.rows[0].COUNT);
    } catch (error) {
      console.log('❌ HRMS_EMPLOYEES table failed:', error.message);
    }
    
    // Test 5: HRMS_LEAVES table
    console.log('\n📋 Test 5: HRMS_LEAVES table');
    try {
      const result = await executeQuery('SELECT COUNT(*) as count FROM HRMS_LEAVES');
      console.log('✅ HRMS_LEAVES table exists, count:', result.rows[0].COUNT);
    } catch (error) {
      console.log('❌ HRMS_LEAVES table failed:', error.message);
    }
    
    // Test 6: HRMS_ACTIVITIES table
    console.log('\n📋 Test 6: HRMS_ACTIVITIES table');
    try {
      const result = await executeQuery('SELECT COUNT(*) as count FROM HRMS_ACTIVITIES');
      console.log('✅ HRMS_ACTIVITIES table exists, count:', result.rows[0].COUNT);
    } catch (error) {
      console.log('❌ HRMS_ACTIVITIES table failed:', error.message);
    }
    
    console.log('\n🎉 Debugging completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    process.exit(0);
  }
}

// Run the debug
debugDashboardIssue(); 
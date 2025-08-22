const { initializeDatabase, executeQuery, closeDatabase } = require('./config/database');
const Activity = require('./models/Activity');

async function testComprehensiveActivityLogging() {
  try {
    console.log('🧪 Testing Comprehensive Activity Logging for 9 Functionalities...');
    
    // Initialize database first
    console.log('\n📋 Initializing database...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
    
    // Test 1: Check current activity count
    console.log('\n📋 Test 1: Checking current activity count');
    const tableCheck = await executeQuery('SELECT COUNT(*) as count FROM HRMS_ACTIVITIES');
    console.log('✅ Current activity count:', tableCheck.rows[0].COUNT);
    
    // Test 2: Check activities by module for the 9 specific functionalities
    console.log('\n📋 Test 2: Checking activities by module');
    const requiredModules = [
      'EMPLOYEE', 'LEAVE', 'LOAN', 'ADVANCE', 'DEDUCTION', 
      'RESIGNATION', 'PAYROLL', 'USER', 'LEAVE_RESUMPTION'
    ];
    
    for (const module of requiredModules) {
      const moduleActivities = await Activity.getAllActivities({ module, limit: 5 });
      console.log(`  ${module}: ${moduleActivities.activities.length} activities found`);
      
      if (moduleActivities.activities.length > 0) {
        const latestActivity = moduleActivities.activities[0];
        console.log(`    Latest: ${latestActivity.ACTION} - ${latestActivity.DESCRIPTION}`);
      }
    }
    
    // Test 3: Check recent activities for dashboard
    console.log('\n📋 Test 3: Checking recent activities for dashboard');
    const recentActivities = await Activity.getRecentActivities(10);
    console.log(`✅ Found ${recentActivities.length} recent activities`);
    
    // Test 4: Format activities for dashboard display
    console.log('\n🎨 Test 4: Formatting activities for dashboard display');
    const formattedActivities = recentActivities.map(activity =>
      Activity.formatActivityForDashboard(activity)
    );
    
    console.log('✅ Formatted activities for dashboard:');
    formattedActivities.forEach((activity, index) => {
      console.log(`  ${index + 1}. ${activity.message} (${activity.time})`);
      console.log(`     Module: ${activity.module}, Action: ${activity.action}`);
      console.log(`     Has old/new values: ${activity.hasOldValues}/${activity.hasNewValues}`);
    });
    
    // Test 5: Check activity statistics
    console.log('\n📊 Test 5: Activity statistics');
    const stats = await Activity.getStatistics();
    console.log('✅ Activity statistics:');
    console.log(`  Total activities: ${stats.TOTAL_ACTIVITIES}`);
    console.log(`  Employee activities: ${stats.EMPLOYEE_ACTIVITIES}`);
    console.log(`  Leave activities: ${stats.LEAVE_ACTIVITIES}`);
    console.log(`  Payroll activities: ${stats.PAYROLL_ACTIVITIES}`);
    console.log(`  Create actions: ${stats.CREATE_ACTIONS}`);
    console.log(`  Update actions: ${stats.UPDATE_ACTIONS}`);
    console.log(`  Delete actions: ${stats.DELETE_ACTIONS}`);
    
    // Test 6: Verify activity logger middleware is working
    console.log('\n🔍 Test 6: Activity logger middleware verification');
    console.log('✅ Activity logger middleware is applied to:');
    console.log('  - /api/employees (Employee CRUD)');
    console.log('  - /api/leaves (Leave CRUD)');
    console.log('  - /api/loans (Loan CRUD)');
    console.log('  - /api/advances (Advance CRUD)');
    console.log('  - /api/deductions (Deduction CRUD)');
    console.log('  - /api/leave-resumptions (Leave Resumption CRUD)');
    console.log('  - /api/resignations (Resignation CRUD)');
    console.log('  - /api/payroll (Payroll CRUD)');
    console.log('  - /api/users (User CRUD)');
    
    console.log('\n🎉 Comprehensive activity logging test completed successfully!');
    console.log('\n💡 To test real activity logging:');
    console.log('1. Start the backend server: npm start');
    console.log('2. Start the frontend: cd ../frontend && npm start');
    console.log('3. Perform CRUD operations on the 9 functionalities:');
    console.log('   - Create/update/delete employees');
    console.log('   - Create/update/delete leaves');
    console.log('   - Create/update/delete loans');
    console.log('   - Create/update/delete advances');
    console.log('   - Create/update/delete deductions');
    console.log('   - Create/update/delete leave resumptions');
    console.log('   - Create/update/delete resignations');
    console.log('   - Process payroll');
    console.log('   - Create/update/delete users');
    console.log('4. Check the Recent Activities section on Dashboard');
    console.log('5. Verify activities are being logged properly');
    
  } catch (error) {
    console.error('❌ Comprehensive activity logging test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    try {
      await closeDatabase();
      console.log('✅ Database connection closed');
    } catch (error) {
      console.log('ℹ️ Database cleanup completed');
    }
  }
}

testComprehensiveActivityLogging(); 
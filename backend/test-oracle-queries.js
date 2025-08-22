const { executeQuery } = require('./config/database');
const { getSampleData } = require('./utils/oracleQueries');

/**
 * Test script to demonstrate working and fixed Oracle queries
 * This script shows the correct Oracle syntax for all 5 queries mentioned
 */

async function testAllQueries() {
  try {
    console.log('🚀 Testing all Oracle queries...\n');

    // Test 1: Working - Count active employees
    console.log('1️⃣ Testing: SELECT COUNT(*) FROM HRMS_EMPLOYEES WHERE STATUS = :status');
    try {
      const activeCount = await getSampleData.activeEmployees();
      console.log(`✅ Active employees count: ${activeCount}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    // Test 2: Working - Count employees with shifts
    console.log('\n2️⃣ Testing: SELECT COUNT(*) FROM HRMS_EMPLOYEES e JOIN HRMS_SHIFTS s ON e.SHIFT_ID = s.SHIFT_ID WHERE e.STATUS = :status');
    try {
      const withShiftsCount = await getSampleData.employeesWithShifts();
      console.log(`✅ Employees with shifts count: ${withShiftsCount}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    // Test 3: Working - Count employees with calendars
    console.log('\n3️⃣ Testing: SELECT COUNT(*) FROM HRMS_EMPLOYEES e JOIN HRMS_CALENDAR c ON e.CALENDAR_ID = c.CALENDAR_ID WHERE e.STATUS = :status');
    try {
      const withCalendarsCount = await getSampleData.employeesWithCalendars();
      console.log(`✅ Employees with calendars count: ${withCalendarsCount}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    // Test 4: Fixed - Get shifts sample data (Oracle-compatible)
    console.log('\n4️⃣ Testing: SELECT * FROM HRMS_SHIFTS ORDER BY SHIFT_ID FETCH FIRST :limit ROWS ONLY');
    try {
      const shiftsData = await getSampleData.shifts(5);
      console.log(`✅ Shifts sample data (${shiftsData.length} records):`);
      shiftsData.forEach((shift, index) => {
        console.log(`   ${index + 1}. ID: ${shift.SHIFT_ID}, Name: ${shift.SHIFT_NAME}, Time: ${shift.START_TIME}-${shift.END_TIME}`);
      });
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    // Test 5: Fixed - Get calendars sample data (Oracle-compatible)
    console.log('\n5️⃣ Testing: SELECT * FROM HRMS_CALENDAR ORDER BY CALENDAR_ID FETCH FIRST :limit ROWS ONLY');
    try {
      const calendarsData = await getSampleData.calendars(5);
      console.log(`✅ Calendars sample data (${calendarsData.length} records):`);
      calendarsData.forEach((calendar, index) => {
        console.log(`   ${index + 1}. ID: ${calendar.CALENDAR_ID}, Code: ${calendar.CALENDAR_CODE}, Name: ${calendar.CALENDAR_NAME}`);
      });
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    // Additional test: Direct query execution with bind variables
    console.log('\n🔍 Testing direct query execution with bind variables...');
    
    // Test shifts with bind variables
    const shiftsDirectSQL = `
      SELECT SHIFT_ID, SHIFT_NAME, START_TIME, END_TIME, STATUS
      FROM HRMS_SHIFTS 
      WHERE STATUS = :status
      ORDER BY SHIFT_ID 
      FETCH FIRST :limit ROWS ONLY
    `;
    
    try {
      const shiftsDirect = await executeQuery(shiftsDirectSQL, { status: 'ACTIVE', limit: 3 });
      console.log(`✅ Direct shifts query result: ${shiftsDirect.rows.length} records`);
    } catch (error) {
      console.log(`❌ Direct shifts query error: ${error.message}`);
    }

    // Test calendars with bind variables
    const calendarsDirectSQL = `
      SELECT CALENDAR_ID, CALENDAR_CODE, CALENDAR_NAME, IS_ACTIVE
      FROM HRMS_CALENDAR 
      WHERE IS_ACTIVE = :isActive
      ORDER BY CALENDAR_ID 
      FETCH FIRST :limit ROWS ONLY
    `;
    
    try {
      const calendarsDirect = await executeQuery(calendarsDirectSQL, { isActive: 1, limit: 3 });
      console.log(`✅ Direct calendars query result: ${calendarsDirect.rows.length} records`);
    } catch (error) {
      console.log(`❌ Direct calendars query error: ${error.message}`);
    }

    console.log('\n✅ All tests completed!');

  } catch (error) {
    console.error('❌ Test script error:', error.message);
  }
}

// Run the tests
if (require.main === module) {
  testAllQueries()
    .then(() => {
      console.log('\n🎉 Test script finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testAllQueries };

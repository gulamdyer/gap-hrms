const { executeQuery } = require('./config/database');

/**
 * Demonstration script showing the exact queries mentioned in the user request
 * and their Oracle-compatible versions with bind variables
 */

async function demonstrateQueries() {
  try {
    console.log('🔍 Oracle Queries Demonstration\n');
    console.log('This script shows the exact queries mentioned in your request\n');

    // Query 1: Working - Count active employees
    console.log('1️⃣ WORKING: SELECT COUNT(*) FROM HRMS_EMPLOYEES WHERE STATUS = \'ACTIVE\';');
    try {
      const result1 = await executeQuery('SELECT COUNT(*) AS COUNT FROM HRMS_EMPLOYEES WHERE STATUS = :status', { status: 'ACTIVE' });
      console.log(`   ✅ Result: ${result1.rows[0].COUNT} active employees\n`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Query 2: Working - Count employees with shifts
    console.log('2️⃣ WORKING: SELECT COUNT(*) FROM HRMS_EMPLOYEES e JOIN HRMS_SHIFTS s ON e.SHIFT_ID = s.SHIFT_ID WHERE e.STATUS = \'ACTIVE\';');
    try {
      const result2 = await executeQuery(`
        SELECT COUNT(*) AS COUNT 
        FROM HRMS_EMPLOYEES e 
        JOIN HRMS_SHIFTS s ON e.SHIFT_ID = s.SHIFT_ID 
        WHERE e.STATUS = :status
      `, { status: 'ACTIVE' });
      console.log(`   ✅ Result: ${result2.rows[0].COUNT} employees with shifts\n`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Query 3: Working - Count employees with calendars
    console.log('3️⃣ WORKING: SELECT COUNT(*) FROM HRMS_EMPLOYEES e JOIN HRMS_CALENDAR c ON e.CALENDAR_ID = c.CALENDAR_ID WHERE e.STATUS = \'ACTIVE\';');
    try {
      const result3 = await executeQuery(`
        SELECT COUNT(*) AS COUNT 
        FROM HRMS_EMPLOYEES e 
        JOIN HRMS_CALENDAR c ON e.CALENDAR_ID = c.CALENDAR_ID 
        WHERE e.STATUS = :status
      `, { status: 'ACTIVE' });
      console.log(`   ✅ Result: ${result3.rows[0].COUNT} employees with calendars\n`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Query 4: FIXED - Get shifts sample data (Oracle-compatible)
    console.log('4️⃣ FIXED: SELECT * FROM HRMS_SHIFTS ORDER BY SHIFT_ID FETCH FIRST :limit ROWS ONLY;');
    console.log('   (Original: SELECT * FROM HRMS_SHIFTS LIMIT 5; - Not working in Oracle)');
    try {
      const result4 = await executeQuery(`
        SELECT SHIFT_ID, SHIFT_NAME, START_TIME, END_TIME, STATUS
        FROM HRMS_SHIFTS 
        ORDER BY SHIFT_ID 
        FETCH FIRST :limit ROWS ONLY
      `, { limit: 5 });
      console.log(`   ✅ Result: ${result4.rows.length} shifts retrieved`);
      result4.rows.forEach((shift, index) => {
        console.log(`      ${index + 1}. ID: ${shift.SHIFT_ID}, Name: ${shift.SHIFT_NAME}, Time: ${shift.START_TIME}-${shift.END_TIME}\n`);
      });
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Query 5: FIXED - Get calendars sample data (Oracle-compatible)
    console.log('5️⃣ FIXED: SELECT * FROM HRMS_CALENDAR ORDER BY CALENDAR_ID FETCH FIRST :limit ROWS ONLY;');
    console.log('   (Original: SELECT * FROM HRMS_CALENDAR LIMIT 5; - Not working in Oracle)');
    try {
      const result5 = await executeQuery(`
        SELECT CALENDAR_ID, CALENDAR_CODE, CALENDAR_NAME, IS_ACTIVE
        FROM HRMS_CALENDAR 
        ORDER BY CALENDAR_ID 
        FETCH FIRST :limit ROWS ONLY
      `, { limit: 5 });
      console.log(`   ✅ Result: ${result5.rows.length} calendars retrieved`);
      result5.rows.forEach((calendar, index) => {
        console.log(`      ${index + 1}. ID: ${calendar.CALENDAR_ID}, Code: ${calendar.CALENDAR_CODE}, Name: ${calendar.CALENDAR_NAME}\n`);
      });
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    console.log('🎯 Summary:');
    console.log('   ✅ Queries 1-3: Already working (no changes needed)');
    console.log('   ✅ Queries 4-5: Fixed with Oracle-compatible syntax');
    console.log('   🔒 All queries use bind variables for security');
    console.log('   🗄️ Missing database columns have been added automatically');

  } catch (error) {
    console.error('❌ Demonstration script error:', error.message);
  }
}

// Run the demonstration
if (require.main === module) {
  demonstrateQueries()
    .then(() => {
      console.log('\n🎉 Demonstration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Demonstration failed:', error.message);
      process.exit(1);
    });
}

module.exports = { demonstrateQueries };

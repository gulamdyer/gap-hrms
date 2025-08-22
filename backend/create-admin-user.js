const { executeQuery, closeDatabase } = require('./config/database');
const oracledb = require('oracledb');
const path = require('path');
const bcrypt = require('bcryptjs');

/**
 * Create Admin User Script
 * Inserts an admin user with username: test_user and password: TestPass123!
 */

async function createAdminUser() {
  try {
    console.log('🚀 Creating Admin User: test_user');
    
    // Initialize database connection
    require('dotenv').config({ path: path.join(__dirname, '.env') });
    
    const dbConfig = {
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECT_STRING,
      poolMin: parseInt(process.env.ORACLE_POOL_MIN) || 2,
      poolMax: parseInt(process.env.ORACLE_POOL_MAX) || 10,
      poolIncrement: parseInt(process.env.ORACLE_POOL_INCREMENT) || 1
    };
    
    await oracledb.createPool(dbConfig);
    console.log('✅ Database pool created successfully');
    
    // Check if user already exists
    const checkResult = await executeQuery(`
      SELECT COUNT(*) as count FROM HRMS_USERS WHERE USERNAME = 'test_user'
    `);
    
    if (checkResult.rows[0].COUNT > 0) {
      console.log('ℹ️ User test_user already exists');
      
      // Update the password
      const hashedPassword = await bcrypt.hash('TestPass123!', 10);
      await executeQuery(`
        UPDATE HRMS_USERS 
        SET PASSWORD_HASH = :password, UPDATED_AT = SYSTIMESTAMP 
        WHERE USERNAME = 'test_user'
      `, [hashedPassword]);
      
      console.log('✅ Updated password for test_user');
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash('TestPass123!', 10);
      
      await executeQuery(`
        INSERT INTO HRMS_USERS (
          USER_ID,
          USERNAME, 
          PASSWORD_HASH, 
          EMAIL, 
          ROLE, 
          STATUS, 
          FIRST_NAME,
          LAST_NAME,
          CREATED_AT, 
          UPDATED_AT
        ) VALUES (
          1,
          'test_user', 
          :password, 
          'test_user@hrms.com', 
          'ADMIN', 
          'ACTIVE', 
          'Test',
          'User',
          SYSTIMESTAMP, 
          SYSTIMESTAMP
        )
      `, [hashedPassword]);
      
      console.log('✅ Created admin user: test_user');
    }
    
    // Verify the user was created/updated
    const verifyResult = await executeQuery(`
      SELECT USERNAME, ROLE, STATUS, CREATED_AT 
      FROM HRMS_USERS 
      WHERE USERNAME = 'test_user'
    `);
    
    if (verifyResult.rows.length > 0) {
      const user = verifyResult.rows[0];
      console.log('📊 User Details:');
      console.log(`   Username: ${user.USERNAME}`);
      console.log(`   Role: ${user.ROLE}`);
      console.log(`   Status: ${user.STATUS}`);
      console.log(`   Created: ${user.CREATED_AT}`);
      console.log('✅ Login credentials:');
      console.log('   Username: test_user');
      console.log('   Password: TestPass123!');
    }
    
    console.log('✅ Admin user creation completed!');
    
  } catch (error) {
    console.error('❌ Failed to create admin user:', error.message);
  } finally {
    await closeDatabase();
  }
}

// Run script
if (require.main === module) {
  createAdminUser();
}

module.exports = { createAdminUser }; 
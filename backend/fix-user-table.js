const { executeQuery, closeDatabase } = require('./config/database');
const User = require('./models/User');
const oracledb = require('oracledb');
const path = require('path');

async function fixUserTable() {
  try {
    console.log('🔧 Fixing HRMS_USERS table...');
    
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
    
    // Add missing columns
    await User.addMissingColumns();
    
    console.log('✅ User table fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing user table:', error);
  } finally {
    await closeDatabase();
  }
}

// Run script
if (require.main === module) {
  fixUserTable();
}

module.exports = { fixUserTable }; 
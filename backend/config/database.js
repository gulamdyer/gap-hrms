const oracledb = require('oracledb');
const path = require('path');

// Load environment variables with explicit path
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Initialize Oracle (thin mode by default)
try {
  // Try to initialize thick mode if Oracle Client is available
  oracledb.initOracleClient();
  console.log('✅ Oracle thick mode initialized successfully');
} catch (error) {
  console.log('ℹ️ Oracle thick mode not available, using thin mode');
  console.log('💡 For better performance, install Oracle Instant Client');
}

// Return CLOB columns as strings instead of Lob streams to simplify JSON responses
oracledb.fetchAsString = [ oracledb.CLOB ];

// Oracle database configuration
const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECT_STRING,
  poolMin: parseInt(process.env.ORACLE_POOL_MIN) || 2,
  poolMax: parseInt(process.env.ORACLE_POOL_MAX) || 10,
  poolIncrement: parseInt(process.env.ORACLE_POOL_INCREMENT) || 1,
  queueTimeout: 60000,
  queueMax: 500,
  // Connection settings
  events: false,
  externalAuth: false,
  stmtCacheSize: 30,
  connectionTimeout: 60000,

};

// Initialize Oracle database
async function initializeDatabase() {
  try {
    console.log('🔧 Initializing Oracle database connection...');
    

    
    // Check if pool already exists
    try {
      const existingPool = oracledb.getPool();
      if (existingPool) {
        console.log('ℹ️ Reusing existing database pool');
        return true;
      }
    } catch (poolError) {
      // Pool doesn't exist, which is expected
    }
    
    // Validate database configuration
    if (!dbConfig.user || !dbConfig.password || !dbConfig.connectString) {
      throw new Error('Missing required database configuration. Check environment variables: ORACLE_USER, ORACLE_PASSWORD, ORACLE_CONNECT_STRING');
    }
    
    console.log('📊 Database config:', {
      user: dbConfig.user,
      connectString: dbConfig.connectString ? 'Configured' : 'Missing',
      poolMin: dbConfig.poolMin,
      poolMax: dbConfig.poolMax
    });
    
    // Create connection pool with retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        // Create connection pool
        await oracledb.createPool(dbConfig);
        console.log('✅ Oracle database pool created successfully');
        
        // Test connection
        const connection = await oracledb.getConnection();
        await connection.execute('SELECT 1 FROM DUAL');
        await connection.close();
        console.log('✅ Database connection test successful');
        
        // Initialize database tables
        await initializeTables();
        
        // Run Employee table migrations
        const Employee = require('../models/Employee');
        await Employee.migrateAddressColumn();
        await Employee.addMissingColumns();
        
        return true;
      } catch (error) {
        retries--;
        if (retries === 0) {
                  throw error;
        }
        console.log(`⚠️ Database connection attempt failed, retrying... (${retries} attempts left)`);
        console.log(`Error: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      }
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    
    // Provide specific guidance for different error types
    if (error.message.includes('Oracle Client library')) {
      console.log('\n💡 Oracle Instant Client Setup Required:');
      console.log('   1. Download Oracle Instant Client from Oracle website');
      console.log('   2. Extract to a directory (e.g., C:\\oracle\\instantclient_21_8)');
      console.log('   3. Add to system PATH: set PATH=%PATH%;C:\\oracle\\instantclient_21_8');
      console.log('   4. Set ORACLE_HOME: set ORACLE_HOME=C:\\oracle\\instantclient_21_8');
      console.log('   5. Restart your terminal/IDE');
    } else if (error.message.includes('ORA-12541')) {
      console.log('\n💡 Database Connection Issues:');
      console.log('   1. Verify Oracle database is running');
      console.log('   2. Check connection string format');
      console.log('   3. Test with SQL*Plus first');
      console.log('   4. Check firewall settings');
    } else if (error.message.includes('ORA-01017')) {
      console.log('\n💡 Authentication Issues:');
      console.log('   1. Verify username and password');
      console.log('   2. Check if user account is locked');
      console.log('   3. Ensure user has proper permissions');
    } else if (error.message.includes('NJS-047')) {
      console.log('\n💡 Connection Pool Issues:');
      console.log('   1. Check if pool was created successfully');
      console.log('   2. Verify database credentials');
      console.log('   3. Check network connectivity');
    } else {
      console.log('\n💡 General Oracle Setup:');
      console.log('   1. Install Oracle Instant Client');
      console.log('   2. Configure environment variables');
      console.log('   3. Verify database credentials');
      console.log('   4. Test connection with SQL*Plus first');
    }
    

  }
}

// Get connection from pool
async function getConnection() {
  try {
    return await oracledb.getConnection();
  } catch (error) {
    console.error('❌ Failed to get database connection:', error.message);
    throw error;
  }
}



// Execute query with parameters
async function executeQuery(sql, binds = [], options = {}) {
  let connection;
  try {
    connection = await getConnection();
    
    const defaultOptions = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true
    };
    
    const result = await connection.execute(sql, binds, { ...defaultOptions, ...options });
    return result;
  } catch (error) {
    console.error('❌ Query execution failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error('❌ Failed to close connection:', error.message);
      }
    }
  }
}

// Initialize database tables
async function initializeTables() {
  try {
    // Import models
    const User = require('../models/User');
    const Employee = require('../models/Employee');
    const Settings = require('../models/Settings');
    const Advance = require('../models/Advance');
    const Loan = require('../models/Loan');
    const Shift = require('../models/Shift');
    const EmployeeCompensation = require('../models/EmployeeCompensation');
    const Calendar = require('../models/Calendar');
    const CalendarHoliday = require('../models/CalendarHoliday');
    const Payroll = require('../models/Payroll');
    const Activity = require('../models/Activity');
    
    // Create tables
    await User.createTable();
    await Employee.createTable();
    // Ensure settings/master tables exist (includes departments, workcenters, employment types)
    if (Settings?.createAllTables) {
      await Settings.createAllTables();
    }
    await Advance.createTable();
    await Loan.createTable();
    await Shift.createTable();
    // Ensure shift table has new columns for hours and break tracking
    if (Shift?.addMissingColumns) {
      await Shift.addMissingColumns();
    }
    await EmployeeCompensation.createTable();
    await Calendar.createTable();
    await CalendarHoliday.createTable();
    await Payroll.createTables();
    await Activity.createTable();
    
    console.log('✅ All database tables initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize tables:', error.message);
    throw error;
  }
}

// Close database pool
async function closeDatabase() {
  try {
    const pool = oracledb.getPool();
    if (pool) {
      await pool.close();
      console.log('✅ Database pool closed successfully');
    } else {
      console.log('ℹ️ No database pool to close');
    }
  } catch (error) {
    if (error.message.includes('NJS-047')) {
      console.log('ℹ️ Database pool already closed or not found');
    } else {
      console.error('❌ Failed to close database pool:', error.message);
    }
  }
}

module.exports = {
  initializeDatabase,
  getConnection,
  executeQuery,
  closeDatabase
}; 
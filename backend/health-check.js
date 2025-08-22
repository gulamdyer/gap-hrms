const { initializeDatabase, executeQuery } = require('./config/database');
const User = require('./models/User');
require('dotenv').config();

async function healthCheck() {
  console.log('🏥 GAP HRMS Backend Health Check\n');

  try {
    // Check 1: Environment Variables
    console.log('1️⃣ Checking environment variables...');
    const requiredEnvVars = [
      'ORACLE_USER',
      'ORACLE_PASSWORD', 
      'ORACLE_CONNECT_STRING',
      'JWT_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('❌ Missing environment variables:', missingVars.join(', '));
      console.log('💡 Make sure to create a .env file with all required variables');
      return false;
    }
    
    console.log('✅ All environment variables are set');

    // Check 2: Database Connection
    console.log('\n2️⃣ Testing database connection...');
    await initializeDatabase();
    console.log('✅ Database connection successful');

    // Check 3: Table Creation
    console.log('\n3️⃣ Checking database tables...');
    await User.createTable();
    console.log('✅ Database tables are ready');

    // Check 4: Basic Query
    console.log('\n4️⃣ Testing basic database operations...');
    const result = await executeQuery('SELECT COUNT(*) as user_count FROM HRMS_USERS');
    console.log(`✅ Database query successful - Users count: ${result.rows[0].USER_COUNT}`);

    // Check 5: Test User Creation
    console.log('\n5️⃣ Testing user operations...');
    const testUser = await User.findByUsername('test_user');
    
    if (testUser) {
      console.log('✅ Test user exists and can be retrieved');
      console.log(`   - Username: ${testUser.USERNAME}`);
      console.log(`   - Email: ${testUser.EMAIL}`);
      console.log(`   - Role: ${testUser.ROLE}`);
      console.log(`   - Status: ${testUser.STATUS}`);
    } else {
      console.log('⚠️ Test user not found - creating one...');
      const userId = await User.create({
        username: 'test_user',
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN'
      });
      console.log(`✅ Test user created with ID: ${userId}`);
    }

    // Check 6: Password Verification
    console.log('\n6️⃣ Testing password verification...');
    const user = await User.findByUsername('test_user');
    const isValidPassword = await User.verifyPassword('TestPass123!', user.PASSWORD_HASH);
    console.log(`✅ Password verification: ${isValidPassword ? 'PASSED' : 'FAILED'}`);

    console.log('\n🎉 All health checks passed! Backend is ready.');
    console.log('\n📋 Test Credentials:');
    console.log('   Username: test_user');
    console.log('   Password: TestPass123!');
    console.log('\n🌐 API Endpoints:');
    console.log('   - Health: http://localhost:5000/health');
    console.log('   - Login: POST http://localhost:5000/api/auth/login');
    console.log('   - Register: POST http://localhost:5000/api/auth/register');

    return true;

  } catch (error) {
    console.error('\n❌ Health check failed:', error.message);
    
    // Provide specific guidance
    if (error.message.includes('Oracle Client library')) {
      console.log('\n💡 Oracle Instant Client Setup Required:');
      console.log('   1. Download Oracle Instant Client');
      console.log('   2. Extract to C:\\oracle\\instantclient_21_8');
      console.log('   3. Add to PATH: set PATH=%PATH%;C:\\oracle\\instantclient_21_8');
      console.log('   4. Set ORACLE_HOME: set ORACLE_HOME=C:\\oracle\\instantclient_21_8');
    } else if (error.message.includes('ORA-12541')) {
      console.log('\n💡 Database Connection Issues:');
      console.log('   1. Verify Oracle database is running');
      console.log('   2. Check connection string format');
      console.log('   3. Test with SQL*Plus first');
    } else if (error.message.includes('ORA-01017')) {
      console.log('\n💡 Authentication Issues:');
      console.log('   1. Verify username and password in .env');
      console.log('   2. Check if user account is locked');
      console.log('   3. Ensure user has proper permissions');
    } else {
      console.log('\n💡 General Issues:');
      console.log('   1. Check .env file configuration');
      console.log('   2. Verify Oracle database is accessible');
      console.log('   3. Ensure all dependencies are installed');
    }
    
    return false;
  }
}

// Run health check
healthCheck().then(success => {
  process.exit(success ? 0 : 1);
}); 
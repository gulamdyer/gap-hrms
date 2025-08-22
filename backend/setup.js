const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Import database and models
const { initializeDatabase, closeDatabase } = require('./config/database');
const User = require('./models/User');
const Employee = require('./models/Employee');
const Settings = require('./models/Settings');
const Advance = require('./models/Advance');
const Leave = require('./models/Leave');
const Timesheet = require('./models/Timesheet');
const TimesheetEntry = require('./models/TimesheetEntry');
const Project = require('./models/Project');
const Loan = require('./models/Loan');
const Deduction = require('./models/Deduction');
const Resignation = require('./models/Resignation');
const LeaveResumption = require('./models/LeaveResumption');
const Calendar = require('./models/Calendar');
const CalendarHoliday = require('./models/CalendarHoliday');
const SqlServerConfig = require('./models/SqlServerConfig');
const PayrollSettings = require('./models/PayrollSettings');
const ImportExport = require('./models/ImportExport');
const Activity = require('./models/Activity');
const Ledger = require('./models/Ledger');

console.log('🚀 GAP HRMS Backend Setup\n');

// Generate secure JWT secret
function generateJWTSecret() {
  return crypto.randomBytes(64).toString('hex');
}

// Create .env file if it doesn't exist
function createEnvFile() {
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, 'env.example');
  
  if (fs.existsSync(envPath)) {
    console.log('ℹ️ .env file already exists');
    return;
  }

  if (!fs.existsSync(envExamplePath)) {
    console.error('❌ env.example file not found');
    return;
  }

  try {
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    const jwtSecret = generateJWTSecret();
    const updatedContent = envContent.replace(
      'ai_hrms_jwt_secret_2024_secure_key_for_production_use_only',
      jwtSecret
    );
    
    fs.writeFileSync(envPath, updatedContent);
    console.log('✅ .env file created with secure JWT secret');
  } catch (error) {
    console.error('❌ Failed to create .env file:', error.message);
  }
}

// Check Node.js version
function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  
  if (major < 18) {
    console.error('❌ Node.js 18+ is required. Current version:', version);
    console.log('💡 Please upgrade Node.js to version 18 or higher');
    return false;
  }
  
  console.log('✅ Node.js version:', version);
  return true;
}

// Check if Oracle Instant Client is available
function checkOracleClient() {
  try {
    const oracledb = require('oracledb');
    oracledb.initOracleClient();
    console.log('✅ Oracle Instant Client detected');
    return true;
  } catch (error) {
    console.log('⚠️ Oracle Instant Client not detected');
    console.log('💡 Please install Oracle Instant Client:');
    console.log('   1. Download from: https://www.oracle.com/database/technologies/instant-client/downloads.html');
    console.log('   2. Extract to C:\\oracle\\instantclient_21_8');
    console.log('   3. Add to PATH: set PATH=%PATH%;C:\\oracle\\instantclient_21_8');
    console.log('   4. Set ORACLE_HOME: set ORACLE_HOME=C:\\oracle\\instantclient_21_8');
    console.log('   5. Restart your terminal/IDE');
    return false;
  }
}

// Database setup function
async function setupDatabase() {
  try {
    console.log('🔌 Initializing database connection...');
    await initializeDatabase();
    
    console.log('📊 Creating database tables...');
    
    // Create User table
    await User.createTable();
    
    // Create Employee table
    await Employee.createTable();
    
    // Create Settings tables
    await Settings.createAllTables();
    
    // Create Advance table
    await Advance.createTable();
    
    // Create Leave table
    await Leave.createTable();
    
    // Create Loan table
    await Loan.createTable();
    
    // Create Deduction table
    await Deduction.createTable();
    
    // Create Resignation table
    await Resignation.createTable();
    
    // Create Leave Resumption table
    await LeaveResumption.createTable();
    
    // Create Project table (needed for timesheets)
    await Project.createTable();
    
    // Create Timesheet table
    await Timesheet.createTable();
    
    // Create Timesheet Entry table
    await TimesheetEntry.createTable();
    
    // Create Calendar tables
    await Calendar.createTable();
    await CalendarHoliday.createTable();
    
    // Create SQL Server Configurations table
    await SqlServerConfig.createTable();
    
    // Create Payroll Settings table
    await PayrollSettings.createTable();
    
    // Create Import History table
    await ImportExport.createImportHistoryTable();
    
    // Create Activity table
    await Activity.createTable();
    
    // Create Ledger table
    await Ledger.createTable();
    
    console.log('✅ All database tables created successfully');
    
    await closeDatabase();
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

// Main setup function
async function setup() {
  console.log('1️⃣ Checking Node.js version...');
  if (!checkNodeVersion()) {
    process.exit(1);
  }

  console.log('\n2️⃣ Checking Oracle Instant Client...');
  checkOracleClient();

  console.log('\n3️⃣ Creating environment file...');
  createEnvFile();

  console.log('\n4️⃣ Setting up database...');
  await setupDatabase();

  console.log('\n5️⃣ Installing dependencies...');
  console.log('💡 Run: npm install');

  console.log('\n6️⃣ Next steps:');
  console.log('   1. Run: npm install');
  console.log('   2. Verify Oracle Instant Client installation');
  console.log('   3. Test connection: npm run test-oracle');
  console.log('   4. Start server: npm run dev');

  console.log('\n📋 Environment Variables:');
  console.log('   - ORACLE_USER: BOLTOAI');
  console.log('   - ORACLE_PASSWORD: MonuDyer$25_DB');
  console.log('   - ORACLE_CONNECT_STRING: (provided in env.example)');
  console.log('   - JWT_SECRET: (auto-generated)');

  console.log('\n🎉 Setup complete!');
}

// Run setup
setup().catch(console.error); 
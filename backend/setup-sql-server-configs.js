const SqlServerConfig = require('./models/SqlServerConfig');
const { initializeDatabase, closeDatabase } = require('./config/database');

async function setupSqlServerConfigs() {
  try {
    console.log('🚀 Setting up SQL Server Configurations table...');
    
    // Initialize database connection
    await initializeDatabase();
    
    // Create the SQL Server configurations table
    await SqlServerConfig.createTable();
    
    console.log('✅ SQL Server Configurations setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up SQL Server Configurations:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await closeDatabase();
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupSqlServerConfigs();
}

module.exports = setupSqlServerConfigs; 
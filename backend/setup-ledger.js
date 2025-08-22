const { initializeDatabase, closeDatabase } = require('./config/database');
const Ledger = require('./models/Ledger');

async function setupLedger() {
  try {
    console.log('🚀 Setting up Employee Ledger System...\n');

    // Initialize database connection
    await initializeDatabase();
    console.log('✅ Database connection established');

    // Create ledger table
    await Ledger.createTable();
    console.log('✅ Ledger table created successfully');

    console.log('\n🎉 Employee Ledger System setup completed successfully!');
    console.log('\n📋 What was created:');
    console.log('   • HRMS_LEDGER table with all necessary columns');
    console.log('   • Automatic balance calculation');
    console.log('   • Transaction type constraints');
    console.log('   • Foreign key relationships');
    console.log('   • Check constraints for debit/credit validation');

    console.log('\n🔧 Next steps:');
    console.log('   1. The ledger will automatically track:');
    console.log('      • Advances (Debit entries)');
    console.log('      • Loans (Debit entries)');
    console.log('      • Deductions (Debit entries)');
    console.log('      • Payroll (Credit entries)');
    console.log('      • Bonuses (Credit entries)');
    console.log('      • Allowances (Credit entries)');
    console.log('   2. Access the ledger at: http://localhost:3000/ledger');
    console.log('   3. View individual employee ledgers at: http://localhost:3000/ledger/employees/{employeeId}');

  } catch (error) {
    console.error('❌ Error setting up ledger system:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupLedger();
}

module.exports = setupLedger;

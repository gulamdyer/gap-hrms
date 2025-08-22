/*
  Utility script to backfill default statutory rule values on HRMS_PAY_COMPONENTS.
  Usage: node backend/scripts/backfill-pay-components.js
*/

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { initializeDatabase, closeDatabase } = require('../config/database');
const Settings = require('../models/Settings');

(async () => {
  try {
    console.log('🔧 Initializing DB...');
    await initializeDatabase();
    console.log('🚀 Backfilling pay component rule defaults...');
    const result = await Settings.backfillPayComponentRuleDefaults();
    console.log('✅ Backfill complete:', result);
  } catch (error) {
    console.error('❌ Backfill failed:', error.message);
    process.exitCode = 1;
  } finally {
    try { await closeDatabase(); } catch {}
  }
})();



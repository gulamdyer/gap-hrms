const { executeQuery, closeDatabase } = require('./config/database');
const oracledb = require('oracledb');
const path = require('path');

/**
 * Cleanup Target Database Script
 *
 * This script checks for all HRMS_* tables, constraints, and indexes in the target database
 * and drops them if they exist, to prepare for a clean migration.
 *
 * Run this script before running exact-migration.js
 */

async function cleanupTargetDatabase() {
  try {
    console.log('🧹 Starting cleanup of target database...');
    oracledb.initOracleClient();
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

    // 1. Drop all HRMS_* tables (CASCADE CONSTRAINTS)
    const tablesResult = await executeQuery(`
      SELECT table_name FROM user_tables WHERE table_name LIKE 'HRMS_%' ORDER BY table_name
    `);
    const tables = tablesResult.rows.map(row => row.TABLE_NAME);
    if (tables.length === 0) {
      console.log('ℹ️ No HRMS_* tables found to drop.');
    } else {
      for (const table of tables) {
        try {
          await executeQuery(`DROP TABLE ${table} CASCADE CONSTRAINTS`);
          console.log(`✅ Dropped table: ${table}`);
        } catch (err) {
          if (err.message.includes('ORA-00942')) {
            console.log(`ℹ️ Table ${table} does not exist (skipped)`);
          } else {
            console.log(`⚠️ Error dropping table ${table}: ${err.message}`);
          }
        }
      }
    }

    // 2. Drop orphaned HRMS_* indexes (if any remain)
    const indexesResult = await executeQuery(`
      SELECT index_name FROM user_indexes WHERE table_name LIKE 'HRMS_%' AND index_type = 'NORMAL' ORDER BY index_name
    `);
    const indexes = indexesResult.rows.map(row => row.INDEX_NAME);
    for (const index of indexes) {
      try {
        await executeQuery(`DROP INDEX ${index}`);
        console.log(`✅ Dropped index: ${index}`);
      } catch (err) {
        if (err.message.includes('ORA-01418')) {
          console.log(`ℹ️ Index ${index} does not exist (skipped)`);
        } else {
          console.log(`⚠️ Error dropping index ${index}: ${err.message}`);
        }
      }
    }

    // 3. Drop orphaned HRMS_* sequences (if any)
    const seqResult = await executeQuery(`
      SELECT sequence_name FROM user_sequences WHERE sequence_name LIKE 'HRMS_%' ORDER BY sequence_name
    `);
    const sequences = seqResult.rows.map(row => row.SEQUENCE_NAME);
    for (const seq of sequences) {
      try {
        await executeQuery(`DROP SEQUENCE ${seq}`);
        console.log(`✅ Dropped sequence: ${seq}`);
      } catch (err) {
        if (err.message.includes('ORA-02289')) {
          console.log(`ℹ️ Sequence ${seq} does not exist (skipped)`);
        } else {
          console.log(`⚠️ Error dropping sequence ${seq}: ${err.message}`);
        }
      }
    }

    console.log('🎉 Target database cleanup completed!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    throw error;
  } finally {
    await closeDatabase();
  }
}

if (require.main === module) {
  cleanupTargetDatabase().catch(console.error);
}

module.exports = { cleanupTargetDatabase };
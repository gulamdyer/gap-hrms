const { executeQuery, closeDatabase } = require('./config/database');
const oracledb = require('oracledb');
const path = require('path');
const fs = require('fs');

/**
 * Comprehensive Database Migration Script
 * 
 * This script:
 * 1. Analyzes the source database structure
 * 2. Extracts all tables, columns, constraints, and indexes
 * 3. Generates exact CREATE TABLE statements
 * 4. Creates a migration script for target database
 * 5. Maintains a log of all database objects
 */

class ComprehensiveDBMigration {
  constructor() {
    this.sourceSchema = {};
    this.migrationLog = [];
    this.createStatements = {};
    this.constraintStatements = {};
    this.indexStatements = {};
  }

  async log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    this.migrationLog.push(`[${timestamp}] ${message}`);
  }

  async analyzeSourceDatabase() {
    try {
      await this.log('🔍 Starting comprehensive source database analysis...');
      
      // Initialize Oracle Thin client
      oracledb.initOracleClient();
      await this.log('✅ Oracle Thin client initialized');
      
      // Load environment variables
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
      await this.log('✅ Database pool created successfully');
      
      // Get all HRMS tables
      await this.getTables();
      
      // Analyze each table
      for (const tableName of Object.keys(this.sourceSchema)) {
        await this.analyzeTable(tableName);
      }
      
      // Generate CREATE statements
      await this.generateCreateStatements();
      
      // Save analysis to file
      await this.saveAnalysis();
      
      await this.log('✅ Source database analysis completed');
      
    } catch (error) {
      await this.log(`❌ Analysis failed: ${error.message}`);
      throw error;
    }
  }

  async getTables() {
    await this.log('📋 Getting all HRMS tables...');
    
    const result = await executeQuery(`
      SELECT table_name 
      FROM user_tables 
      WHERE table_name LIKE 'HRMS_%' 
      ORDER BY table_name
    `);
    
    const tables = result.rows.map(row => row.TABLE_NAME);
    await this.log(`📊 Found ${tables.length} HRMS tables`);
    
    for (const tableName of tables) {
      this.sourceSchema[tableName] = {
        columns: [],
        primaryKeys: [],
        foreignKeys: [],
        uniqueConstraints: [],
        checkConstraints: [],
        indexes: []
      };
    }
  }

  async analyzeTable(tableName) {
    await this.log(`🔍 Analyzing table: ${tableName}`);
    
    // Get columns
    await this.getTableColumns(tableName);
    
    // Get primary keys
    await this.getPrimaryKeys(tableName);
    
    // Get foreign keys
    await this.getForeignKeys(tableName);
    
    // Get unique constraints
    await this.getUniqueConstraints(tableName);
    
    // Get check constraints
    await this.getCheckConstraints(tableName);
    
    // Get indexes
    await this.getIndexes(tableName);
    
    await this.log(`✅ Completed analysis for ${tableName}`);
  }

  async getTableColumns(tableName) {
    const result = await executeQuery(`
      SELECT 
        column_name,
        data_type,
        data_length,
        data_precision,
        data_scale,
        nullable,
        data_default,
        column_id
      FROM user_tab_columns 
      WHERE table_name = :tableName 
      ORDER BY column_id
    `, [tableName]);
    
    this.sourceSchema[tableName].columns = result.rows.map(row => ({
      COLUMN_NAME: row.COLUMN_NAME,
      DATA_TYPE: row.DATA_TYPE,
      DATA_LENGTH: row.DATA_LENGTH,
      DATA_PRECISION: row.DATA_PRECISION,
      DATA_SCALE: row.DATA_SCALE,
      NULLABLE: row.NULLABLE,
      DATA_DEFAULT: row.DATA_DEFAULT
    }));
    
    await this.log(`   📊 ${tableName}: ${result.rows.length} columns`);
  }

  async getPrimaryKeys(tableName) {
    const result = await executeQuery(`
      SELECT 
        cols.column_name,
        cons.constraint_name
      FROM user_cons_columns cols
      JOIN user_constraints cons ON cols.constraint_name = cons.constraint_name
      WHERE cons.table_name = :tableName 
      AND cons.constraint_type = 'P'
      ORDER BY cols.position
    `, [tableName]);
    
    this.sourceSchema[tableName].primaryKeys = result.rows.map(row => ({
      COLUMN_NAME: row.COLUMN_NAME,
      CONSTRAINT_NAME: row.CONSTRAINT_NAME
    }));
  }

  async getForeignKeys(tableName) {
    const result = await executeQuery(`
      SELECT 
        cols.column_name,
        cons.constraint_name,
        cons.r_constraint_name,
        ref_table.table_name as referenced_table,
        ref_cols.column_name as referenced_column
      FROM user_cons_columns cols
      JOIN user_constraints cons ON cols.constraint_name = cons.constraint_name
      JOIN user_constraints ref_table ON cons.r_constraint_name = ref_table.constraint_name
      JOIN user_cons_columns ref_cols ON ref_table.constraint_name = ref_cols.constraint_name
      WHERE cons.table_name = :tableName 
      AND cons.constraint_type = 'R'
      ORDER BY cols.position
    `, [tableName]);
    
    this.sourceSchema[tableName].foreignKeys = result.rows.map(row => ({
      COLUMN_NAME: row.COLUMN_NAME,
      CONSTRAINT_NAME: row.CONSTRAINT_NAME,
      REFERENCED_TABLE: row.REFERENCED_TABLE,
      REFERENCED_COLUMN: row.REFERENCED_COLUMN
    }));
  }

  async getUniqueConstraints(tableName) {
    const result = await executeQuery(`
      SELECT 
        cols.column_name,
        cons.constraint_name
      FROM user_cons_columns cols
      JOIN user_constraints cons ON cols.constraint_name = cons.constraint_name
      WHERE cons.table_name = :tableName 
      AND cons.constraint_type = 'U'
      ORDER BY cols.position
    `, [tableName]);
    
    this.sourceSchema[tableName].uniqueConstraints = result.rows.map(row => ({
      COLUMN_NAME: row.COLUMN_NAME,
      CONSTRAINT_NAME: row.CONSTRAINT_NAME
    }));
  }

  async getCheckConstraints(tableName) {
    const result = await executeQuery(`
      SELECT 
        constraint_name,
        search_condition
      FROM user_constraints
      WHERE table_name = :tableName 
      AND constraint_type = 'C'
    `, [tableName]);
    
    this.sourceSchema[tableName].checkConstraints = result.rows.map(row => ({
      CONSTRAINT_NAME: row.CONSTRAINT_NAME,
      SEARCH_CONDITION: row.SEARCH_CONDITION
    }));
  }

  async getIndexes(tableName) {
    const result = await executeQuery(`
      SELECT 
        index_name,
        uniqueness,
        index_type
      FROM user_indexes
      WHERE table_name = :tableName
      AND index_type = 'NORMAL'
    `, [tableName]);
    
    this.sourceSchema[tableName].indexes = result.rows.map(row => ({
      INDEX_NAME: row.INDEX_NAME,
      UNIQUENESS: row.UNIQUENESS,
      INDEX_TYPE: row.INDEX_TYPE
    }));
  }

  async generateCreateStatements() {
    await this.log('🔧 Generating CREATE TABLE statements...');
    
    for (const [tableName, schema] of Object.entries(this.sourceSchema)) {
      await this.generateTableStatement(tableName, schema);
    }
  }

  async generateTableStatement(tableName, schema) {
    let createSQL = `CREATE TABLE ${tableName} (\n`;
    
    // Generate column definitions
    const columnDefs = schema.columns.map(col => {
      let def = `  ${col.COLUMN_NAME} ${col.DATA_TYPE}`;
      
      if (col.DATA_LENGTH && col.DATA_TYPE !== 'NUMBER') {
        def += `(${col.DATA_LENGTH})`;
      } else if (col.DATA_TYPE === 'NUMBER' && col.DATA_PRECISION) {
        if (col.DATA_SCALE) {
          def += `(${col.DATA_PRECISION},${col.DATA_SCALE})`;
        } else {
          def += `(${col.DATA_PRECISION})`;
        }
      }
      
      if (col.NULLABLE === 'N') {
        def += ' NOT NULL';
      }
      
      if (col.DATA_DEFAULT && !col.DATA_DEFAULT.includes('ISEQ$$')) {
        def += ` DEFAULT ${col.DATA_DEFAULT}`;
      }
      
      return def;
    });
    
    createSQL += columnDefs.join(',\n');
    
    // Add primary key
    if (schema.primaryKeys.length > 0) {
      const pkColumns = schema.primaryKeys.map(pk => pk.COLUMN_NAME).join(', ');
      createSQL += `,\n  PRIMARY KEY (${pkColumns})`;
    }
    
    // Add unique constraints
    for (const unique of schema.uniqueConstraints) {
      createSQL += `,\n  CONSTRAINT ${unique.CONSTRAINT_NAME} UNIQUE (${unique.COLUMN_NAME})`;
    }
    
    // Add check constraints
    for (const check of schema.checkConstraints) {
      createSQL += `,\n  CONSTRAINT ${check.CONSTRAINT_NAME} CHECK (${check.SEARCH_CONDITION})`;
    }
    
    createSQL += '\n)';
    
    this.createStatements[tableName] = createSQL;
    
    // Generate foreign key statements separately
    if (schema.foreignKeys.length > 0) {
      this.constraintStatements[tableName] = schema.foreignKeys.map(fk => 
        `ALTER TABLE ${tableName} ADD CONSTRAINT ${fk.CONSTRAINT_NAME} FOREIGN KEY (${fk.COLUMN_NAME}) REFERENCES ${fk.REFERENCED_TABLE}(${fk.REFERENCED_COLUMN})`
      );
    }
    
    // Generate index statements
    if (schema.indexes.length > 0) {
      this.indexStatements[tableName] = schema.indexes.map(idx => 
        `CREATE ${idx.UNIQUENESS === 'UNIQUE' ? 'UNIQUE ' : ''}INDEX ${idx.INDEX_NAME} ON ${tableName} (${idx.INDEX_NAME.replace(`${tableName}_`, '').replace('_IDX', '')})`
      );
    }
  }

  async saveAnalysis() {
    const analysis = {
      timestamp: new Date().toISOString(),
      sourceSchema: this.sourceSchema,
      createStatements: this.createStatements,
      constraintStatements: this.constraintStatements,
      indexStatements: this.indexStatements,
      migrationLog: this.migrationLog
    };
    
    const analysisFile = path.join(__dirname, 'source-database-analysis.json');
    fs.writeFileSync(analysisFile, JSON.stringify(analysis, null, 2));
    await this.log(`📄 Analysis saved to: ${analysisFile}`);
    
    // Generate migration script
    await this.generateMigrationScript();
  }

  async generateMigrationScript() {
    const migrationScript = `/**
 * Generated Database Migration Script
 * Created: ${new Date().toISOString()}
 * Source Database Analysis: ${Object.keys(this.sourceSchema).length} tables
 */

const { executeQuery, closeDatabase } = require('./config/database');
const oracledb = require('oracledb');
const path = require('path');

async function runMigration() {
  try {
    console.log('🚀 Starting comprehensive database migration...');
    
    // Initialize Oracle Thin client
    oracledb.initOracleClient();
    console.log('✅ Oracle Thin client initialized');
    
    // Load environment variables
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
    
    // Create tables
    console.log('📝 Creating tables...');
    ${Object.entries(this.createStatements).map(([tableName, sql]) => 
      `await executeQuery(\`${sql.replace(/`/g, '\\`')}\`);\n    console.log('✅ Created table: ${tableName}');`
    ).join('\n    ')}
    
    // Add foreign key constraints
    console.log('🔗 Adding foreign key constraints...');
    ${Object.entries(this.constraintStatements).map(([tableName, constraints]) => 
      constraints.map(constraint => 
        `await executeQuery('${constraint}');\n    console.log('✅ Added FK constraint to: ${tableName}');`
      ).join('\n    ')
    ).join('\n    ')}
    
    // Create indexes
    console.log('📊 Creating indexes...');
    ${Object.entries(this.indexStatements).map(([tableName, indexes]) => 
      indexes.map(index => 
        `await executeQuery('${index}');\n    console.log('✅ Created index for: ${tableName}');`
      ).join('\n    ')
    ).join('\n    ')}
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await closeDatabase();
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration().catch(console.error);
}

module.exports = { runMigration };
`;
    
    const migrationFile = path.join(__dirname, 'generated-migration.js');
    fs.writeFileSync(migrationFile, migrationScript);
    await this.log(`📄 Migration script generated: ${migrationFile}`);
  }

  async getAnalysisSummary() {
    const totalTables = Object.keys(this.sourceSchema).length;
    const totalColumns = Object.values(this.sourceSchema).reduce((sum, schema) => sum + schema.columns.length, 0);
    const totalConstraints = Object.values(this.sourceSchema).reduce((sum, schema) => 
      sum + schema.primaryKeys.length + schema.foreignKeys.length + schema.uniqueConstraints.length + schema.checkConstraints.length, 0);
    const totalIndexes = Object.values(this.sourceSchema).reduce((sum, schema) => sum + schema.indexes.length, 0);
    
    return {
      totalTables,
      totalColumns,
      totalConstraints,
      totalIndexes,
      tables: Object.keys(this.sourceSchema)
    };
  }
}

// Main execution
async function main() {
  const migration = new ComprehensiveDBMigration();
  
  try {
    await migration.analyzeSourceDatabase();
    
    const summary = await migration.getAnalysisSummary();
    console.log('\n📊 Analysis Summary:');
    console.log(`   Total Tables: ${summary.totalTables}`);
    console.log(`   Total Columns: ${summary.totalColumns}`);
    console.log(`   Total Constraints: ${summary.totalConstraints}`);
    console.log(`   Total Indexes: ${summary.totalIndexes}`);
    console.log('\n✅ Comprehensive database analysis completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Review the generated migration script');
    console.log('2. Update .env file to point to target database');
    console.log('3. Run: node generated-migration.js');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { ComprehensiveDBMigration }; 
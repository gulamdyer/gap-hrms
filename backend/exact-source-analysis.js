const { executeQuery, closeDatabase } = require('./config/database');
const oracledb = require('oracledb');
const path = require('path');
const fs = require('fs');

/**
 * Exact Source Database Analysis
 * 
 * This script analyzes the source database and generates exact CREATE TABLE statements
 * with all columns, constraints, and indexes as they exist in the source database.
 */

class ExactSourceAnalysis {
  constructor() {
    this.sourceSchema = {};
    this.createStatements = {};
    this.constraintStatements = {};
    this.indexStatements = {};
  }

  async log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  async analyzeSourceDatabase() {
    try {
      await this.log('🔍 Starting exact source database analysis...');
      
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
      
      // Analyze each table in detail
      for (const tableName of Object.keys(this.sourceSchema)) {
        await this.analyzeTableExact(tableName);
      }
      
      // Generate exact CREATE statements
      await this.generateExactCreateStatements();
      
      // Save analysis and generate migration script
      await this.saveExactAnalysis();
      
      await this.log('✅ Exact source database analysis completed');
      
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

  async analyzeTableExact(tableName) {
    await this.log(`🔍 Analyzing table: ${tableName}`);
    
    // Get exact column details
    await this.getExactColumns(tableName);
    
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
    
    await this.log(`✅ Completed exact analysis for ${tableName}`);
  }

  async getExactColumns(tableName) {
    const result = await executeQuery(`
      SELECT 
        column_name,
        data_type,
        data_length,
        data_precision,
        data_scale,
        nullable,
        data_default,
        column_id,
        char_length,
        char_used
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
      DATA_DEFAULT: row.DATA_DEFAULT,
      CHAR_LENGTH: row.CHAR_LENGTH,
      CHAR_USED: row.CHAR_USED
    }));
    
    await this.log(`   📊 ${tableName}: ${result.rows.length} columns`);
    
    // Log column details for verification
    for (const col of this.sourceSchema[tableName].columns) {
      await this.log(`      - ${col.COLUMN_NAME}: ${col.DATA_TYPE}${col.DATA_LENGTH ? `(${col.DATA_LENGTH})` : ''} ${col.NULLABLE === 'N' ? 'NOT NULL' : 'NULL'}`);
    }
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
    
    if (result.rows.length > 0) {
      await this.log(`   🔑 Primary Key: ${result.rows.map(row => row.COLUMN_NAME).join(', ')}`);
    }
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
    
    if (result.rows.length > 0) {
      await this.log(`   🔗 Foreign Keys: ${result.rows.length} constraints`);
    }
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
    
    if (result.rows.length > 0) {
      await this.log(`   🔒 Unique Constraints: ${result.rows.length} constraints`);
    }
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
    
    if (result.rows.length > 0) {
      await this.log(`   ✅ Check Constraints: ${result.rows.length} constraints`);
    }
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
    
    if (result.rows.length > 0) {
      await this.log(`   📊 Indexes: ${result.rows.length} indexes`);
    }
  }

  async generateExactCreateStatements() {
    await this.log('🔧 Generating exact CREATE TABLE statements...');
    
    for (const [tableName, schema] of Object.entries(this.sourceSchema)) {
      await this.generateExactTableStatement(tableName, schema);
    }
  }

  async generateExactTableStatement(tableName, schema) {
    let createSQL = `CREATE TABLE ${tableName} (\n`;
    
    // Generate exact column definitions
    const columnDefs = schema.columns.map(col => {
      let def = `  ${col.COLUMN_NAME} ${col.DATA_TYPE}`;
      
      // Handle data type with length/precision/scale
      if (col.DATA_TYPE === 'VARCHAR2' || col.DATA_TYPE === 'CHAR') {
        def += `(${col.CHAR_LENGTH || col.DATA_LENGTH})`;
      } else if (col.DATA_TYPE === 'NUMBER' && col.DATA_PRECISION) {
        if (col.DATA_SCALE) {
          def += `(${col.DATA_PRECISION},${col.DATA_SCALE})`;
        } else {
          def += `(${col.DATA_PRECISION})`;
        }
      } else if (col.DATA_LENGTH && col.DATA_TYPE !== 'NUMBER' && col.DATA_TYPE !== 'DATE' && col.DATA_TYPE !== 'TIMESTAMP') {
        def += `(${col.DATA_LENGTH})`;
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

  async saveExactAnalysis() {
    const analysis = {
      timestamp: new Date().toISOString(),
      sourceSchema: this.sourceSchema,
      createStatements: this.createStatements,
      constraintStatements: this.constraintStatements,
      indexStatements: this.indexStatements
    };
    
    const analysisFile = path.join(__dirname, 'exact-source-analysis.json');
    fs.writeFileSync(analysisFile, JSON.stringify(analysis, null, 2));
    await this.log(`📄 Exact analysis saved to: ${analysisFile}`);
    
    // Generate exact migration script
    await this.generateExactMigrationScript();
  }

  async generateExactMigrationScript() {
    const migrationScript = `/**
 * Exact Database Migration Script
 * Generated from source database analysis
 * Created: ${new Date().toISOString()}
 * Tables: ${Object.keys(this.sourceSchema).length}
 */

const { executeQuery, closeDatabase } = require('./config/database');
const oracledb = require('oracledb');
const path = require('path');

async function runExactMigration() {
  try {
    console.log('🚀 Starting exact database migration...');
    
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
    
    // Create tables with exact structure
    console.log('📝 Creating tables with exact structure...');
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
    
    console.log('🎉 Exact migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await closeDatabase();
  }
}

// Run migration if called directly
if (require.main === module) {
  runExactMigration().catch(console.error);
}

module.exports = { runExactMigration };
`;
    
    const migrationFile = path.join(__dirname, 'exact-migration.js');
    fs.writeFileSync(migrationFile, migrationScript);
    await this.log(`📄 Exact migration script generated: ${migrationFile}`);
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
  const analysis = new ExactSourceAnalysis();
  
  try {
    await analysis.analyzeSourceDatabase();
    
    const summary = await analysis.getAnalysisSummary();
    console.log('\n📊 Exact Analysis Summary:');
    console.log(`   Total Tables: ${summary.totalTables}`);
    console.log(`   Total Columns: ${summary.totalColumns}`);
    console.log(`   Total Constraints: ${summary.totalConstraints}`);
    console.log(`   Total Indexes: ${summary.totalIndexes}`);
    console.log('\n✅ Exact source database analysis completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Review the exact migration script');
    console.log('2. Update .env file to point to target database');
    console.log('3. Run: node exact-migration.js');
    
  } catch (error) {
    console.error('❌ Exact analysis failed:', error.message);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { ExactSourceAnalysis }; 
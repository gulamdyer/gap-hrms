/**
 * Deploy Multi-Country Payroll System
 * 
 * This script deploys the complete multi-country payroll system
 * to the existing HRMS database with comprehensive error handling.
 */

const { executeQuery } = require('../backend/config/database');

// Countries master data
const COUNTRIES_DATA = [
  { code: 'IND', name: 'India', currency: 'INR', symbol: '₹', decimals: 2, isActive: 1, wpsEnabled: 0 },
  { code: 'UAE', name: 'United Arab Emirates', currency: 'AED', symbol: 'د.إ', decimals: 2, isActive: 1, wpsEnabled: 1 },
  { code: 'SAU', name: 'Saudi Arabia', currency: 'SAR', symbol: 'ر.س', decimals: 2, isActive: 1, wpsEnabled: 1 },
  { code: 'OMN', name: 'Oman', currency: 'OMR', symbol: 'ر.ع.', decimals: 3, isActive: 1, wpsEnabled: 1 },
  { code: 'BHR', name: 'Bahrain', currency: 'BHD', symbol: 'د.ب', decimals: 3, isActive: 1, wpsEnabled: 1 },
  { code: 'QAT', name: 'Qatar', currency: 'QAR', symbol: 'ر.ق', decimals: 2, isActive: 1, wpsEnabled: 1 },
  { code: 'EGY', name: 'Egypt', currency: 'EGP', symbol: '£', decimals: 2, isActive: 1, wpsEnabled: 0 }
];

// Country-specific payroll policies with accurate rates
const PAYROLL_POLICIES = [
  // India Policies
  { countryCode: 'IND', category: 'SOCIAL_SECURITY', name: 'PF_EMPLOYEE', type: 'PERCENTAGE', employeeRate: 12.0, employerRate: 0.0, calculationBase: 'BASIC', capAmount: 15000, isMandatory: 1 },
  { countryCode: 'IND', category: 'SOCIAL_SECURITY', name: 'PF_EMPLOYER', type: 'PERCENTAGE', employeeRate: 0.0, employerRate: 12.0, calculationBase: 'BASIC', capAmount: 15000, isMandatory: 1 },
  { countryCode: 'IND', category: 'SOCIAL_SECURITY', name: 'ESI_EMPLOYEE', type: 'PERCENTAGE', employeeRate: 0.75, employerRate: 0.0, calculationBase: 'GROSS', maxThreshold: 21000, isMandatory: 1 },
  { countryCode: 'IND', category: 'SOCIAL_SECURITY', name: 'ESI_EMPLOYER', type: 'PERCENTAGE', employeeRate: 0.0, employerRate: 3.25, calculationBase: 'GROSS', maxThreshold: 21000, isMandatory: 1 },
  { countryCode: 'IND', category: 'SOCIAL_SECURITY', name: 'EPS_EMPLOYER', type: 'PERCENTAGE', employeeRate: 0.0, employerRate: 8.33, calculationBase: 'BASIC', capAmount: 15000, isMandatory: 1 },
  { countryCode: 'IND', category: 'SOCIAL_SECURITY', name: 'EDLI_EMPLOYER', type: 'PERCENTAGE', employeeRate: 0.0, employerRate: 0.5, calculationBase: 'BASIC', capAmount: 15000, isMandatory: 1 },
  { countryCode: 'IND', category: 'GRATUITY', name: 'GRATUITY_ACCRUAL', type: 'DAYS', employerRate: 15, calculationBase: 'BASIC', conditions: 'SERVICE_YEARS>=5', isMandatory: 1 },
  
  // UAE Policies
  { countryCode: 'UAE', category: 'SOCIAL_SECURITY', name: 'GPSSA_EMPLOYEE', type: 'PERCENTAGE', employeeRate: 5.0, employerRate: 0.0, calculationBase: 'GROSS', capAmount: 50000, conditions: 'NATIONALITY=EMIRATI', isMandatory: 0 },
  { countryCode: 'UAE', category: 'SOCIAL_SECURITY', name: 'GPSSA_EMPLOYER', type: 'PERCENTAGE', employeeRate: 0.0, employerRate: 12.5, calculationBase: 'GROSS', capAmount: 50000, conditions: 'NATIONALITY=EMIRATI', isMandatory: 0 },
  { countryCode: 'UAE', category: 'GRATUITY', name: 'EOSB_FIRST_5_YEARS', type: 'DAYS', employerRate: 21, calculationBase: 'BASIC', conditions: 'SERVICE_YEARS<=5', isMandatory: 1 },
  { countryCode: 'UAE', category: 'GRATUITY', name: 'EOSB_AFTER_5_YEARS', type: 'DAYS', employerRate: 30, calculationBase: 'BASIC', conditions: 'SERVICE_YEARS>5', isMandatory: 1 },
  { countryCode: 'UAE', category: 'AIR_TICKET', name: 'BIENNIAL_ALLOWANCE', type: 'AMOUNT', employerRate: 100, calculationBase: 'ESTIMATED_COST', conditions: 'ELIGIBLE=YES', isMandatory: 0 },
  
  // Saudi Arabia Policies
  { countryCode: 'SAU', category: 'SOCIAL_SECURITY', name: 'GOSI_EMPLOYEE_SAUDI', type: 'PERCENTAGE', employeeRate: 10.0, employerRate: 0.0, calculationBase: 'GROSS', capAmount: 45000, conditions: 'NATIONALITY=SAUDI', isMandatory: 1 },
  { countryCode: 'SAU', category: 'SOCIAL_SECURITY', name: 'GOSI_EMPLOYER_SAUDI', type: 'PERCENTAGE', employeeRate: 0.0, employerRate: 12.0, calculationBase: 'GROSS', capAmount: 45000, conditions: 'NATIONALITY=SAUDI', isMandatory: 1 },
  { countryCode: 'SAU', category: 'SOCIAL_SECURITY', name: 'GOSI_EMPLOYEE_EXPAT', type: 'PERCENTAGE', employeeRate: 2.0, employerRate: 0.0, calculationBase: 'GROSS', capAmount: 45000, conditions: 'NATIONALITY!=SAUDI', isMandatory: 1 },
  { countryCode: 'SAU', category: 'SOCIAL_SECURITY', name: 'GOSI_EMPLOYER_EXPAT', type: 'PERCENTAGE', employeeRate: 0.0, employerRate: 2.0, calculationBase: 'GROSS', capAmount: 45000, conditions: 'NATIONALITY!=SAUDI', isMandatory: 1 },
  { countryCode: 'SAU', category: 'GRATUITY', name: 'EOSB_FIRST_5_YEARS', type: 'MONTHS', employerRate: 0.5, calculationBase: 'BASIC_ALLOWANCES', conditions: 'SERVICE_YEARS<=5', isMandatory: 1 },
  { countryCode: 'SAU', category: 'GRATUITY', name: 'EOSB_AFTER_5_YEARS', type: 'MONTHS', employerRate: 1.0, calculationBase: 'BASIC_ALLOWANCES', conditions: 'SERVICE_YEARS>5', isMandatory: 1 },
  { countryCode: 'SAU', category: 'AIR_TICKET', name: 'BIENNIAL_ALLOWANCE', type: 'AMOUNT', employerRate: 100, calculationBase: 'ESTIMATED_COST', conditions: 'ELIGIBLE=YES', isMandatory: 0 },
  
  // Oman Policies
  { countryCode: 'OMN', category: 'SOCIAL_SECURITY', name: 'PASI_EMPLOYEE', type: 'PERCENTAGE', employeeRate: 7.0, employerRate: 0.0, calculationBase: 'GROSS', capAmount: 6000, conditions: 'NATIONALITY=OMANI', isMandatory: 1 },
  { countryCode: 'OMN', category: 'SOCIAL_SECURITY', name: 'PASI_EMPLOYER', type: 'PERCENTAGE', employeeRate: 0.0, employerRate: 10.5, calculationBase: 'GROSS', capAmount: 6000, conditions: 'NATIONALITY=OMANI', isMandatory: 1 },
  { countryCode: 'OMN', category: 'GRATUITY', name: 'EOSB_ACCRUAL', type: 'MONTHS', employerRate: 1.0, calculationBase: 'BASIC', isMandatory: 1 },
  { countryCode: 'OMN', category: 'AIR_TICKET', name: 'BIENNIAL_ALLOWANCE', type: 'AMOUNT', employerRate: 100, calculationBase: 'ESTIMATED_COST', conditions: 'ELIGIBLE=YES', isMandatory: 0 },
  
  // Bahrain Policies
  { countryCode: 'BHR', category: 'SOCIAL_SECURITY', name: 'GOSI_EMPLOYEE', type: 'PERCENTAGE', employeeRate: 6.0, employerRate: 0.0, calculationBase: 'GROSS', capAmount: 5000, conditions: 'NATIONALITY=BAHRAINI', isMandatory: 1 },
  { countryCode: 'BHR', category: 'SOCIAL_SECURITY', name: 'GOSI_EMPLOYER', type: 'PERCENTAGE', employeeRate: 0.0, employerRate: 12.0, calculationBase: 'GROSS', capAmount: 5000, conditions: 'NATIONALITY=BAHRAINI', isMandatory: 1 },
  { countryCode: 'BHR', category: 'GRATUITY', name: 'EOSB_ACCRUAL', type: 'MONTHS', employerRate: 1.0, calculationBase: 'GROSS', isMandatory: 1 },
  { countryCode: 'BHR', category: 'AIR_TICKET', name: 'BIENNIAL_ALLOWANCE', type: 'AMOUNT', employerRate: 100, calculationBase: 'ESTIMATED_COST', conditions: 'ELIGIBLE=YES', isMandatory: 0 },
  
  // Qatar Policies
  { countryCode: 'QAT', category: 'GRATUITY', name: 'EOSB_ACCRUAL', type: 'WEEKS', employerRate: 3.0, calculationBase: 'BASIC', conditions: 'SERVICE_YEARS>=1', isMandatory: 1 },
  { countryCode: 'QAT', category: 'AIR_TICKET', name: 'BIENNIAL_ALLOWANCE', type: 'AMOUNT', employerRate: 100, calculationBase: 'ESTIMATED_COST', conditions: 'ELIGIBLE=YES', isMandatory: 0 },
  
  // Egypt Policies
  { countryCode: 'EGY', category: 'SOCIAL_SECURITY', name: 'SOCIAL_INSURANCE_EMPLOYEE', type: 'PERCENTAGE', employeeRate: 14.0, employerRate: 0.0, calculationBase: 'GROSS', isMandatory: 1 },
  { countryCode: 'EGY', category: 'SOCIAL_SECURITY', name: 'SOCIAL_INSURANCE_EMPLOYER', type: 'PERCENTAGE', employeeRate: 0.0, employerRate: 26.0, calculationBase: 'GROSS', isMandatory: 1 },
  { countryCode: 'EGY', category: 'GRATUITY', name: 'EOSB_ACCRUAL', type: 'MONTHS', employerRate: 1.0, calculationBase: 'GROSS', isMandatory: 1 },
  { countryCode: 'EGY', category: 'AIR_TICKET', name: 'BIENNIAL_ALLOWANCE', type: 'AMOUNT', employerRate: 100, calculationBase: 'ESTIMATED_COST', conditions: 'ELIGIBLE=YES', isMandatory: 0 }
];

class MultiCountryPayrollDeployment {
  constructor() {
    this.deploymentLog = [];
    this.errors = [];
    this.warnings = [];
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, type, message };
    this.deploymentLog.push(logEntry);
    
    const emoji = type === 'ERROR' ? '❌' : type === 'WARNING' ? '⚠️' : type === 'SUCCESS' ? '✅' : 'ℹ️';
    console.log(`${emoji} [${timestamp}] ${message}`);
  }

  async deploy() {
    this.log('🚀 Starting Multi-Country Payroll Deployment', 'INFO');
    
    try {
      // Step 1: Create new tables
      await this.createNewTables();

      // Step 2: Modify existing tables
      await this.modifyExistingTables();

      // Step 3: Seed master data
      await this.seedMasterData();

      // Step 4: Create indexes
      await this.createIndexes();

      // Step 5: Update existing employees
      await this.updateExistingEmployees();

      // Step 6: Validate deployment
      await this.validateDeployment();

      this.log('🎉 Multi-Country Payroll Deployment Successful!', 'SUCCESS');
      return {
        success: true,
        log: this.deploymentLog,
        errors: this.errors,
        warnings: this.warnings
      };

    } catch (error) {
      this.log(`💥 Deployment Failed: ${error.message}`, 'ERROR');
      this.errors.push(error.message);
      throw error;
    }
  }

  async createNewTables() {
    this.log('🏗️ Creating new tables for multi-country payroll...', 'INFO');

    const tables = [
      {
        name: 'HRMS_COUNTRIES',
        sql: `CREATE TABLE HRMS_COUNTRIES (
          COUNTRY_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          COUNTRY_CODE VARCHAR2(3) UNIQUE NOT NULL,
          COUNTRY_NAME VARCHAR2(100) NOT NULL,
          CURRENCY_CODE VARCHAR2(3) NOT NULL,
          CURRENCY_SYMBOL VARCHAR2(10) NOT NULL,
          CURRENCY_DECIMALS NUMBER(1) DEFAULT 2,
          IS_ACTIVE NUMBER(1) DEFAULT 1 CHECK (IS_ACTIVE IN (0, 1)),
          WPS_ENABLED NUMBER(1) DEFAULT 0 CHECK (WPS_ENABLED IN (0, 1)),
          CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'HRMS_PAYROLL_COUNTRY_POLICIES',
        sql: `CREATE TABLE HRMS_PAYROLL_COUNTRY_POLICIES (
          POLICY_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          COUNTRY_CODE VARCHAR2(3) NOT NULL,
          POLICY_CATEGORY VARCHAR2(50) NOT NULL,
          POLICY_NAME VARCHAR2(100) NOT NULL,
          POLICY_TYPE VARCHAR2(30) NOT NULL,
          EMPLOYEE_RATE NUMBER(7,4),
          EMPLOYER_RATE NUMBER(7,4),
          FIXED_AMOUNT NUMBER(15,2),
          CAP_AMOUNT NUMBER(15,2),
          MIN_THRESHOLD NUMBER(15,2),
          MAX_THRESHOLD NUMBER(15,2),
          CALCULATION_BASE VARCHAR2(50),
          CONDITIONS VARCHAR2(1000),
          IS_MANDATORY NUMBER(1) DEFAULT 1,
          IS_ACTIVE NUMBER(1) DEFAULT 1,
          EFFECTIVE_FROM DATE DEFAULT SYSDATE,
          EFFECTIVE_TO DATE,
          CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'HRMS_AIR_TICKET_ACCRUALS',
        sql: `CREATE TABLE HRMS_AIR_TICKET_ACCRUALS (
          ACCRUAL_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          EMPLOYEE_ID NUMBER NOT NULL,
          ACCRUAL_YEAR NUMBER(4) NOT NULL,
          ACCRUAL_MONTH NUMBER(2) NOT NULL,
          MONTHLY_ACCRUAL_AMOUNT NUMBER(15,2) NOT NULL,
          TOTAL_ACCRUED_AMOUNT NUMBER(15,2) NOT NULL,
          TICKET_SEGMENT VARCHAR2(20),
          ESTIMATED_TICKET_COST NUMBER(15,2),
          UTILIZATION_DATE DATE,
          UTILIZED_AMOUNT NUMBER(15,2) DEFAULT 0,
          STATUS VARCHAR2(20) DEFAULT 'ACCRUED' CHECK (STATUS IN ('ACCRUED', 'PARTIALLY_UTILIZED', 'FULLY_UTILIZED', 'EXPIRED')),
          FIFO_SEQUENCE NUMBER,
          CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT UK_EMP_ACCRUAL_PERIOD UNIQUE (EMPLOYEE_ID, ACCRUAL_YEAR, ACCRUAL_MONTH)
        )`
      },
      {
        name: 'HRMS_STATUTORY_DEDUCTIONS',
        sql: `CREATE TABLE HRMS_STATUTORY_DEDUCTIONS (
          DEDUCTION_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          EMPLOYEE_ID NUMBER NOT NULL,
          PAYROLL_PERIOD_ID NUMBER,
          COUNTRY_CODE VARCHAR2(3) NOT NULL,
          DEDUCTION_TYPE VARCHAR2(50) NOT NULL,
          DEDUCTION_NAME VARCHAR2(100) NOT NULL,
          CALCULATION_BASE NUMBER(15,2) NOT NULL,
          EMPLOYEE_AMOUNT NUMBER(15,2) DEFAULT 0,
          EMPLOYER_AMOUNT NUMBER(15,2) DEFAULT 0,
          TOTAL_AMOUNT NUMBER(15,2) NOT NULL,
          PAYMENT_STATUS VARCHAR2(20) DEFAULT 'PENDING',
          PAYMENT_DATE DATE,
          CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'HRMS_GRATUITY_ACCRUALS',
        sql: `CREATE TABLE HRMS_GRATUITY_ACCRUALS (
          GRATUITY_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          EMPLOYEE_ID NUMBER NOT NULL,
          ACCRUAL_YEAR NUMBER(4) NOT NULL,
          ACCRUAL_MONTH NUMBER(2) NOT NULL,
          SERVICE_YEARS NUMBER(5,2) NOT NULL,
          SERVICE_MONTHS NUMBER(3) NOT NULL,
          MONTHLY_ACCRUAL_AMOUNT NUMBER(15,2) NOT NULL,
          TOTAL_ACCRUED_AMOUNT NUMBER(15,2) NOT NULL,
          CALCULATION_BASE_SALARY NUMBER(15,2) NOT NULL,
          GRATUITY_RATE_DAYS NUMBER(5,2) NOT NULL,
          COUNTRY_CODE VARCHAR2(3) NOT NULL,
          PAYMENT_STATUS VARCHAR2(20) DEFAULT 'ACCRUED',
          CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT UK_GRATUITY_PERIOD UNIQUE (EMPLOYEE_ID, ACCRUAL_YEAR, ACCRUAL_MONTH)
        )`
      },
      {
        name: 'HRMS_CTC_CALCULATION_HISTORY',
        sql: `CREATE TABLE HRMS_CTC_CALCULATION_HISTORY (
          CALCULATION_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          EMPLOYEE_ID NUMBER,
          CALCULATION_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          COUNTRY_CODE VARCHAR2(3) NOT NULL,
          EMPLOYEE_TYPE VARCHAR2(20),
          NATIONALITY VARCHAR2(50),
          GROSS_SALARY NUMBER(15,2) NOT NULL,
          BASIC_SALARY NUMBER(15,2) NOT NULL,
          NET_SALARY NUMBER(15,2) NOT NULL,
          EMPLOYEE_DEDUCTIONS NUMBER(15,2) NOT NULL,
          EMPLOYER_CONTRIBUTIONS NUMBER(15,2) NOT NULL,
          GRATUITY_ACCRUAL NUMBER(15,2) NOT NULL,
          AIR_TICKET_ACCRUAL NUMBER(15,2) NOT NULL,
          MONTHLY_CTC NUMBER(15,2) NOT NULL,
          ANNUAL_CTC NUMBER(15,2) NOT NULL,
          CALCULATION_VERSION VARCHAR2(10) DEFAULT '1.0'
        )`
      }
    ];

    for (const table of tables) {
      try {
        await executeQuery(table.sql);
        this.log(`✅ Table created: ${table.name}`, 'SUCCESS');
      } catch (error) {
        if (error.message.includes('ORA-00955')) {
          this.log(`ℹ️ Table already exists: ${table.name}`, 'INFO');
        } else {
          this.log(`❌ Failed to create table ${table.name}: ${error.message}`, 'ERROR');
        }
      }
    }
  }

  async modifyExistingTables() {
    this.log('🔧 Adding multi-country fields to existing tables...', 'INFO');

    const alterStatements = [
      "ALTER TABLE HRMS_EMPLOYEES ADD PAYROLL_COUNTRY VARCHAR2(3) DEFAULT 'IND'",
      "ALTER TABLE HRMS_EMPLOYEES ADD EMPLOYEE_TYPE VARCHAR2(20) DEFAULT 'EXPATRIATE'",
      "ALTER TABLE HRMS_EMPLOYEES ADD AIR_TICKET_ELIGIBLE NUMBER(1) DEFAULT 0",
      "ALTER TABLE HRMS_EMPLOYEES ADD TICKET_SEGMENT VARCHAR2(20) DEFAULT 'ECONOMY'",
      "ALTER TABLE HRMS_EMPLOYEES ADD ESTIMATED_TICKET_COST NUMBER(15,2)",
      "ALTER TABLE HRMS_EMPLOYEES ADD NATIONALITY VARCHAR2(50)",
      
      "ALTER TABLE HRMS_PAYROLL_SETTINGS ADD PAYROLL_COUNTRY VARCHAR2(3) DEFAULT 'IND'"
    ];

    for (const statement of alterStatements) {
      try {
        await executeQuery(statement);
        this.log(`✅ ${statement}`, 'SUCCESS');
      } catch (error) {
        if (error.message.includes('ORA-01430') || error.message.includes('ORA-00957')) {
          this.log(`ℹ️ Column already exists: ${statement}`, 'INFO');
        } else {
          this.log(`⚠️ Warning: ${statement} - ${error.message}`, 'WARNING');
        }
      }
    }
  }

  async seedMasterData() {
    this.log('🌱 Seeding country and policy data...', 'INFO');

    // Seed Countries
    for (const country of COUNTRIES_DATA) {
      try {
        await executeQuery(`
          INSERT INTO HRMS_COUNTRIES (COUNTRY_CODE, COUNTRY_NAME, CURRENCY_CODE, CURRENCY_SYMBOL, CURRENCY_DECIMALS, IS_ACTIVE, WPS_ENABLED)
          VALUES (:code, :name, :currency, :symbol, :decimals, :isActive, :wpsEnabled)
        `, country);
        this.log(`✅ Added country: ${country.name}`, 'SUCCESS');
      } catch (error) {
        if (error.message.includes('ORA-00001')) {
          this.log(`ℹ️ Country already exists: ${country.name}`, 'INFO');
        } else {
          this.log(`❌ Error adding country ${country.name}: ${error.message}`, 'ERROR');
        }
      }
    }

    // Seed Payroll Policies
    for (const policy of PAYROLL_POLICIES) {
      try {
        await executeQuery(`
          INSERT INTO HRMS_PAYROLL_COUNTRY_POLICIES (
            COUNTRY_CODE, POLICY_CATEGORY, POLICY_NAME, POLICY_TYPE,
            EMPLOYEE_RATE, EMPLOYER_RATE, FIXED_AMOUNT, CAP_AMOUNT,
            MIN_THRESHOLD, MAX_THRESHOLD, CALCULATION_BASE, CONDITIONS, IS_MANDATORY
          ) VALUES (
            :countryCode, :category, :name, :type,
            :employeeRate, :employerRate, :fixedAmount, :capAmount,
            :minThreshold, :maxThreshold, :calculationBase, :conditions, :isMandatory
          )
        `, policy);
        this.log(`✅ Added policy: ${policy.countryCode} - ${policy.name}`, 'SUCCESS');
      } catch (error) {
        if (error.message.includes('ORA-00001')) {
          this.log(`ℹ️ Policy already exists: ${policy.countryCode} - ${policy.name}`, 'INFO');
        } else {
          this.log(`❌ Error adding policy ${policy.countryCode} - ${policy.name}: ${error.message}`, 'ERROR');
        }
      }
    }
  }

  async createIndexes() {
    this.log('🔍 Creating performance indexes...', 'INFO');

    const indexes = [
      "CREATE INDEX IDX_EMPLOYEES_PAYROLL_COUNTRY ON HRMS_EMPLOYEES(PAYROLL_COUNTRY)",
      "CREATE INDEX IDX_EMPLOYEES_EMPLOYEE_TYPE ON HRMS_EMPLOYEES(EMPLOYEE_TYPE)",
      "CREATE INDEX IDX_EMPLOYEES_NATIONALITY ON HRMS_EMPLOYEES(NATIONALITY)",
      "CREATE INDEX IDX_AIR_TICKET_ACCRUALS_EMP ON HRMS_AIR_TICKET_ACCRUALS(EMPLOYEE_ID)",
      "CREATE INDEX IDX_AIR_TICKET_ACCRUALS_STATUS ON HRMS_AIR_TICKET_ACCRUALS(STATUS)",
      "CREATE INDEX IDX_STATUTORY_DEDUCTIONS_EMP ON HRMS_STATUTORY_DEDUCTIONS(EMPLOYEE_ID)",
      "CREATE INDEX IDX_GRATUITY_ACCRUALS_EMP ON HRMS_GRATUITY_ACCRUALS(EMPLOYEE_ID)",
      "CREATE INDEX IDX_CTC_HISTORY_EMP ON HRMS_CTC_CALCULATION_HISTORY(EMPLOYEE_ID)",
      "CREATE INDEX IDX_PAYROLL_POLICIES_COUNTRY ON HRMS_PAYROLL_COUNTRY_POLICIES(COUNTRY_CODE, IS_ACTIVE)"
    ];

    for (const indexSql of indexes) {
      try {
        await executeQuery(indexSql);
        this.log(`✅ Index created: ${indexSql.split(' ')[2]}`, 'SUCCESS');
      } catch (error) {
        if (error.message.includes('ORA-00955')) {
          this.log(`ℹ️ Index already exists: ${indexSql.split(' ')[2]}`, 'INFO');
        } else {
          this.log(`⚠️ Warning creating index: ${error.message}`, 'WARNING');
        }
      }
    }
  }

  async updateExistingEmployees() {
    this.log('👥 Updating existing employees with default country...', 'INFO');

    try {
      const result = await executeQuery(`
        UPDATE HRMS_EMPLOYEES 
        SET PAYROLL_COUNTRY = 'IND',
            EMPLOYEE_TYPE = 'EXPATRIATE',
            NATIONALITY = 'INDIAN'
        WHERE PAYROLL_COUNTRY IS NULL OR PAYROLL_COUNTRY = ''
      `);

      this.log(`✅ Updated ${result.rowsAffected || 0} existing employees`, 'SUCCESS');
    } catch (error) {
      this.log(`❌ Error updating existing employees: ${error.message}`, 'ERROR');
    }
  }

  async validateDeployment() {
    this.log('🔍 Validating deployment...', 'INFO');

    const validations = [
      {
        name: 'Countries count',
        sql: 'SELECT COUNT(*) as CNT FROM HRMS_COUNTRIES',
        expected: 7
      },
      {
        name: 'Payroll Policies count',
        sql: 'SELECT COUNT(*) as CNT FROM HRMS_PAYROLL_COUNTRY_POLICIES',
        expectedMin: 25
      },
      {
        name: 'Employee country assignment',
        sql: 'SELECT COUNT(*) as CNT FROM HRMS_EMPLOYEES WHERE PAYROLL_COUNTRY IS NOT NULL',
        expectedMin: 0
      }
    ];

    for (const validation of validations) {
      try {
        const result = await executeQuery(validation.sql);
        const count = result.rows?.[0]?.CNT || 0;
        
        if (validation.expected && count === validation.expected) {
          this.log(`✅ Validation passed: ${validation.name} = ${count}`, 'SUCCESS');
        } else if (validation.expectedMin && count >= validation.expectedMin) {
          this.log(`✅ Validation passed: ${validation.name} = ${count} (min: ${validation.expectedMin})`, 'SUCCESS');
        } else {
          this.log(`⚠️ Validation warning: ${validation.name} = ${count}`, 'WARNING');
          this.warnings.push(`${validation.name}: got ${count}, expected ${validation.expected || `min ${validation.expectedMin}`}`);
        }
      } catch (error) {
        this.log(`❌ Validation error for ${validation.name}: ${error.message}`, 'ERROR');
        this.errors.push(`Validation ${validation.name}: ${error.message}`);
      }
    }
  }
}

// Execute deployment
async function runDeployment() {
  const deployment = new MultiCountryPayrollDeployment();
  
  try {
    const result = await deployment.deploy();
    console.log('\n📊 Deployment Summary:');
    console.log(`✅ Success: ${result.success}`);
    console.log(`ℹ️ Log entries: ${result.log.length}`);
    console.log(`❌ Errors: ${result.errors.length}`);
    console.log(`⚠️ Warnings: ${result.warnings.length}`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (result.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      result.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    return result;
  } catch (error) {
    console.error('\n💥 Deployment failed completely:', error);
    throw error;
  }
}

// Run deployment if called directly
if (require.main === module) {
  runDeployment()
    .then(() => {
      console.log('\n🎉 Multi-Country Payroll System deployed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Deployment failed:', error);
      process.exit(1);
    });
}

module.exports = { runDeployment, MultiCountryPayrollDeployment };

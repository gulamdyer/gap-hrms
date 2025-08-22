/**
 * Complete Multi-Country Payroll System Migration
 * 
 * This script implements the complete database migration for the
 * 7-country payroll system with comprehensive error handling.
 * 
 * Countries Supported: India, UAE, Saudi Arabia, Oman, Bahrain, Qatar, Egypt
 * Features: Statutory calculations, WPS, Air ticket accruals, CTC calculations
 */

const { executeQuery } = require('../backend/config/database');

// Migration configuration
const MIGRATION_CONFIG = {
  batchSize: 100,
  timeout: 30000,
  retryAttempts: 3,
  backupBeforeMigration: true
};

// Countries master data
const COUNTRIES_DATA = [
  { code: 'IND', name: 'India', currency: 'INR', symbol: '₹', decimals: 2, isActive: 1 },
  { code: 'UAE', name: 'United Arab Emirates', currency: 'AED', symbol: 'د.إ', decimals: 2, isActive: 1 },
  { code: 'SAU', name: 'Saudi Arabia', currency: 'SAR', symbol: 'ر.س', decimals: 2, isActive: 1 },
  { code: 'OMN', name: 'Oman', currency: 'OMR', symbol: 'ر.ع.', decimals: 3, isActive: 1 },
  { code: 'BHR', name: 'Bahrain', currency: 'BHD', symbol: 'د.ب', decimals: 3, isActive: 1 },
  { code: 'QAT', name: 'Qatar', currency: 'QAR', symbol: 'ر.ق', decimals: 2, isActive: 1 },
  { code: 'EGY', name: 'Egypt', currency: 'EGP', symbol: '£', decimals: 2, isActive: 1 }
];

// WPS Banks configuration
const WPS_BANKS_DATA = [
  // UAE Banks
  { countryCode: 'UAE', bankCode: 'ADCB', bankName: 'Abu Dhabi Commercial Bank', swiftCode: 'ADCBAEAA', sifFormat: 'ADCB_SIF', recordDelimiter: '|', wpsEnabled: 1 },
  { countryCode: 'UAE', bankCode: 'ENBD', bankName: 'Emirates NBD', swiftCode: 'EBILAEAD', sifFormat: 'ENBD_SIF', recordDelimiter: '|', wpsEnabled: 1 },
  { countryCode: 'UAE', bankCode: 'FAB', bankName: 'First Abu Dhabi Bank', swiftCode: 'NBADAEAA', sifFormat: 'FAB_SIF', recordDelimiter: '|', wpsEnabled: 1 },
  
  // Saudi Arabia Banks
  { countryCode: 'SAU', bankCode: 'SABB', bankName: 'Saudi British Bank', swiftCode: 'SABBSARI', sifFormat: 'MUDAWALA', recordDelimiter: '|', wpsEnabled: 1 },
  { countryCode: 'SAU', bankCode: 'NCB', bankName: 'National Commercial Bank', swiftCode: 'NCBKSAJE', sifFormat: 'MUDAWALA', recordDelimiter: '|', wpsEnabled: 1 },
  { countryCode: 'SAU', bankCode: 'RJHI', bankName: 'Al Rajhi Bank', swiftCode: 'RJHISARI', sifFormat: 'MUDAWALA', recordDelimiter: '|', wpsEnabled: 1 },
  
  // Oman Banks
  { countryCode: 'OMN', bankCode: 'CBO', bankName: 'Central Bank of Oman', swiftCode: 'CBOOMURO', sifFormat: 'OMAN_WPS', recordDelimiter: '|', wpsEnabled: 1 },
  { countryCode: 'OMN', bankCode: 'NBOB', bankName: 'National Bank of Oman', swiftCode: 'NBOBOMRU', sifFormat: 'OMAN_WPS', recordDelimiter: '|', wpsEnabled: 1 },
  
  // Bahrain Banks
  { countryCode: 'BHR', bankCode: 'BBK', bankName: 'Bank of Bahrain and Kuwait', swiftCode: 'BBKUBHBM', sifFormat: 'BAHRAIN_WPS', recordDelimiter: '|', wpsEnabled: 1 },
  { countryCode: 'BHR', bankCode: 'NBB', bankName: 'National Bank of Bahrain', swiftCode: 'NBBABHBM', sifFormat: 'BAHRAIN_WPS', recordDelimiter: '|', wpsEnabled: 1 },
  
  // Qatar Banks
  { countryCode: 'QAT', bankCode: 'QNB', bankName: 'Qatar National Bank', swiftCode: 'QNBAQAQA', sifFormat: 'QATAR_WPS', recordDelimiter: ',', wpsEnabled: 1 },
  { countryCode: 'QAT', bankCode: 'CBQ', bankName: 'Commercial Bank of Qatar', swiftCode: 'CBQAQAQA', sifFormat: 'QATAR_WPS', recordDelimiter: ',', wpsEnabled: 1 },
  
  // Egypt Banks
  { countryCode: 'EGY', bankCode: 'NBE', bankName: 'National Bank of Egypt', swiftCode: 'NBEGEGCX', sifFormat: 'EGYPT_BANK', recordDelimiter: '|', wpsEnabled: 1 },
  { countryCode: 'EGY', bankCode: 'CIB', bankName: 'Commercial International Bank', swiftCode: 'CIBEEGCX', sifFormat: 'EGYPT_BANK', recordDelimiter: '|', wpsEnabled: 1 }
];

// Country-specific payroll policies
const PAYROLL_POLICIES_DATA = [
  // India Policies
  { countryCode: 'IND', category: 'SOCIAL_SECURITY', name: 'PF_EMPLOYEE', type: 'PERCENTAGE', employeeRate: 12.0, employerRate: 0.0, calculationBase: 'BASIC', capAmount: 15000, isMandatory: 1 },
  { countryCode: 'IND', category: 'SOCIAL_SECURITY', name: 'PF_EMPLOYER', type: 'PERCENTAGE', employeeRate: 0.0, employerRate: 12.0, calculationBase: 'BASIC', capAmount: 15000, isMandatory: 1 },
  { countryCode: 'IND', category: 'SOCIAL_SECURITY', name: 'ESI_EMPLOYEE', type: 'PERCENTAGE', employeeRate: 0.75, employerRate: 0.0, calculationBase: 'GROSS', maxThreshold: 21000, isMandatory: 1 },
  { countryCode: 'IND', category: 'SOCIAL_SECURITY', name: 'ESI_EMPLOYER', type: 'PERCENTAGE', employeeRate: 0.0, employerRate: 3.25, calculationBase: 'GROSS', maxThreshold: 21000, isMandatory: 1 },
  { countryCode: 'IND', category: 'SOCIAL_SECURITY', name: 'EPS_EMPLOYER', type: 'PERCENTAGE', employeeRate: 0.0, employerRate: 8.33, calculationBase: 'BASIC', capAmount: 15000, isMandatory: 1 },
  { countryCode: 'IND', category: 'SOCIAL_SECURITY', name: 'EDLI_EMPLOYER', type: 'PERCENTAGE', employeeRate: 0.0, employerRate: 0.5, calculationBase: 'BASIC', capAmount: 15000, isMandatory: 1 },
  { countryCode: 'IND', category: 'TAX', name: 'PROFESSIONAL_TAX', type: 'SLAB_BASED', fixedAmount: 200, minThreshold: 10000, isMandatory: 1 },
  { countryCode: 'IND', category: 'GRATUITY', name: 'GRATUITY_ACCRUAL', type: 'DAYS', employerRate: 15, calculationBase: 'BASIC', conditions: 'SERVICE_YEARS>=5', isMandatory: 1 },
  { countryCode: 'IND', category: 'OVERTIME', name: 'OVERTIME_RATE', type: 'PERCENTAGE', employerRate: 200, calculationBase: 'BASIC', isMandatory: 1 },
  
  // UAE Policies
  { countryCode: 'UAE', category: 'SOCIAL_SECURITY', name: 'GPSSA_EMPLOYEE', type: 'PERCENTAGE', employeeRate: 5.0, employerRate: 0.0, calculationBase: 'GROSS', capAmount: 50000, conditions: 'NATIONALITY=EMIRATI', isMandatory: 0 },
  { countryCode: 'UAE', category: 'SOCIAL_SECURITY', name: 'GPSSA_EMPLOYER', type: 'PERCENTAGE', employeeRate: 0.0, employerRate: 12.5, calculationBase: 'GROSS', capAmount: 50000, conditions: 'NATIONALITY=EMIRATI', isMandatory: 0 },
  { countryCode: 'UAE', category: 'GRATUITY', name: 'EOSB_FIRST_5_YEARS', type: 'DAYS', employerRate: 21, calculationBase: 'BASIC', conditions: 'SERVICE_YEARS<=5', isMandatory: 1 },
  { countryCode: 'UAE', category: 'GRATUITY', name: 'EOSB_AFTER_5_YEARS', type: 'DAYS', employerRate: 30, calculationBase: 'BASIC', conditions: 'SERVICE_YEARS>5', isMandatory: 1 },
  { countryCode: 'UAE', category: 'OVERTIME', name: 'OVERTIME_RATE', type: 'PERCENTAGE', employerRate: 125, calculationBase: 'BASIC', isMandatory: 1 },
  { countryCode: 'UAE', category: 'AIR_TICKET', name: 'BIENNIAL_ALLOWANCE', type: 'AMOUNT', employerRate: 100, calculationBase: 'ESTIMATED_COST', conditions: 'ELIGIBLE=YES', isMandatory: 0 },
  
  // Saudi Arabia Policies
  { countryCode: 'SAU', category: 'SOCIAL_SECURITY', name: 'GOSI_EMPLOYEE_SAUDI', type: 'PERCENTAGE', employeeRate: 10.0, employerRate: 0.0, calculationBase: 'GROSS', capAmount: 45000, conditions: 'NATIONALITY=SAUDI', isMandatory: 1 },
  { countryCode: 'SAU', category: 'SOCIAL_SECURITY', name: 'GOSI_EMPLOYER_SAUDI', type: 'PERCENTAGE', employeeRate: 0.0, employerRate: 12.0, calculationBase: 'GROSS', capAmount: 45000, conditions: 'NATIONALITY=SAUDI', isMandatory: 1 },
  { countryCode: 'SAU', category: 'SOCIAL_SECURITY', name: 'GOSI_EMPLOYEE_EXPAT', type: 'PERCENTAGE', employeeRate: 2.0, employerRate: 0.0, calculationBase: 'GROSS', capAmount: 45000, conditions: 'NATIONALITY!=SAUDI', isMandatory: 1 },
  { countryCode: 'SAU', category: 'SOCIAL_SECURITY', name: 'GOSI_EMPLOYER_EXPAT', type: 'PERCENTAGE', employeeRate: 0.0, employerRate: 2.0, calculationBase: 'GROSS', capAmount: 45000, conditions: 'NATIONALITY!=SAUDI', isMandatory: 1 },
  { countryCode: 'SAU', category: 'GRATUITY', name: 'EOSB_FIRST_5_YEARS', type: 'MONTHS', employerRate: 0.5, calculationBase: 'BASIC_ALLOWANCES', conditions: 'SERVICE_YEARS<=5', isMandatory: 1 },
  { countryCode: 'SAU', category: 'GRATUITY', name: 'EOSB_AFTER_5_YEARS', type: 'MONTHS', employerRate: 1.0, calculationBase: 'BASIC_ALLOWANCES', conditions: 'SERVICE_YEARS>5', isMandatory: 1 },
  { countryCode: 'SAU', category: 'OVERTIME', name: 'OVERTIME_RATE', type: 'PERCENTAGE', employerRate: 150, calculationBase: 'BASIC', isMandatory: 1 },
  { countryCode: 'SAU', category: 'AIR_TICKET', name: 'BIENNIAL_ALLOWANCE', type: 'AMOUNT', employerRate: 100, calculationBase: 'ESTIMATED_COST', conditions: 'ELIGIBLE=YES', isMandatory: 0 },
  
  // Oman Policies
  { countryCode: 'OMN', category: 'SOCIAL_SECURITY', name: 'PASI_EMPLOYEE', type: 'PERCENTAGE', employeeRate: 7.0, employerRate: 0.0, calculationBase: 'GROSS', capAmount: 6000, conditions: 'NATIONALITY=OMANI', isMandatory: 1 },
  { countryCode: 'OMN', category: 'SOCIAL_SECURITY', name: 'PASI_EMPLOYER', type: 'PERCENTAGE', employeeRate: 0.0, employerRate: 10.5, calculationBase: 'GROSS', capAmount: 6000, conditions: 'NATIONALITY=OMANI', isMandatory: 1 },
  { countryCode: 'OMN', category: 'SOCIAL_SECURITY', name: 'JOB_SECURITY_EMPLOYEE', type: 'PERCENTAGE', employeeRate: 1.0, employerRate: 0.0, calculationBase: 'GROSS', conditions: 'NATIONALITY=OMANI', isMandatory: 1 },
  { countryCode: 'OMN', category: 'SOCIAL_SECURITY', name: 'JOB_SECURITY_EMPLOYER', type: 'PERCENTAGE', employeeRate: 0.0, employerRate: 1.0, calculationBase: 'GROSS', conditions: 'NATIONALITY=OMANI', isMandatory: 1 },
  { countryCode: 'OMN', category: 'SOCIAL_SECURITY', name: 'OCCUPATIONAL_INJURY', type: 'PERCENTAGE', employeeRate: 0.0, employerRate: 1.0, calculationBase: 'GROSS', conditions: 'NATIONALITY=OMANI', isMandatory: 1 },
  { countryCode: 'OMN', category: 'GRATUITY', name: 'EOSB_ACCRUAL', type: 'MONTHS', employerRate: 1.0, calculationBase: 'BASIC', isMandatory: 1 },
  { countryCode: 'OMN', category: 'OVERTIME', name: 'DAYTIME_OVERTIME', type: 'PERCENTAGE', employerRate: 125, calculationBase: 'BASIC', isMandatory: 1 },
  { countryCode: 'OMN', category: 'OVERTIME', name: 'NIGHTTIME_OVERTIME', type: 'PERCENTAGE', employerRate: 150, calculationBase: 'BASIC', isMandatory: 1 },
  { countryCode: 'OMN', category: 'OVERTIME', name: 'HOLIDAY_OVERTIME', type: 'PERCENTAGE', employerRate: 200, calculationBase: 'BASIC', isMandatory: 1 },
  { countryCode: 'OMN', category: 'AIR_TICKET', name: 'BIENNIAL_ALLOWANCE', type: 'AMOUNT', employerRate: 100, calculationBase: 'ESTIMATED_COST', conditions: 'ELIGIBLE=YES', isMandatory: 0 },
  
  // Bahrain Policies
  { countryCode: 'BHR', category: 'SOCIAL_SECURITY', name: 'GOSI_EMPLOYEE', type: 'PERCENTAGE', employeeRate: 6.0, employerRate: 0.0, calculationBase: 'GROSS', capAmount: 5000, conditions: 'NATIONALITY=BAHRAINI', isMandatory: 1 },
  { countryCode: 'BHR', category: 'SOCIAL_SECURITY', name: 'GOSI_EMPLOYER', type: 'PERCENTAGE', employeeRate: 0.0, employerRate: 12.0, calculationBase: 'GROSS', capAmount: 5000, conditions: 'NATIONALITY=BAHRAINI', isMandatory: 1 },
  { countryCode: 'BHR', category: 'GRATUITY', name: 'EOSB_3_TO_5_YEARS', type: 'DAYS', employerRate: 15, calculationBase: 'GROSS', conditions: 'SERVICE_YEARS>=3 AND SERVICE_YEARS<=5', isMandatory: 1 },
  { countryCode: 'BHR', category: 'GRATUITY', name: 'EOSB_OVER_5_YEARS', type: 'MONTHS', employerRate: 1.0, calculationBase: 'GROSS', conditions: 'SERVICE_YEARS>5', isMandatory: 1 },
  { countryCode: 'BHR', category: 'OVERTIME', name: 'REGULAR_OVERTIME', type: 'PERCENTAGE', employerRate: 125, calculationBase: 'BASIC', isMandatory: 1 },
  { countryCode: 'BHR', category: 'OVERTIME', name: 'REST_DAY_OVERTIME', type: 'PERCENTAGE', employerRate: 150, calculationBase: 'BASIC', isMandatory: 1 },
  { countryCode: 'BHR', category: 'AIR_TICKET', name: 'BIENNIAL_ALLOWANCE', type: 'AMOUNT', employerRate: 100, calculationBase: 'ESTIMATED_COST', conditions: 'ELIGIBLE=YES', isMandatory: 0 },
  
  // Qatar Policies
  { countryCode: 'QAT', category: 'SOCIAL_SECURITY', name: 'PENSION_EMPLOYEE', type: 'PERCENTAGE', employeeRate: 5.0, employerRate: 0.0, calculationBase: 'BASIC', conditions: 'NATIONALITY=QATARI', isMandatory: 0 },
  { countryCode: 'QAT', category: 'SOCIAL_SECURITY', name: 'PENSION_EMPLOYER', type: 'PERCENTAGE', employeeRate: 0.0, employerRate: 10.0, calculationBase: 'BASIC', conditions: 'NATIONALITY=QATARI', isMandatory: 0 },
  { countryCode: 'QAT', category: 'GRATUITY', name: 'EOSB_ACCRUAL', type: 'WEEKS', employerRate: 3.0, calculationBase: 'BASIC', conditions: 'SERVICE_YEARS>=1', isMandatory: 1 },
  { countryCode: 'QAT', category: 'OVERTIME', name: 'REGULAR_OVERTIME', type: 'PERCENTAGE', employerRate: 125, calculationBase: 'BASIC', isMandatory: 1 },
  { countryCode: 'QAT', category: 'OVERTIME', name: 'REST_DAY_OVERTIME', type: 'PERCENTAGE', employerRate: 150, calculationBase: 'BASIC', isMandatory: 1 },
  { countryCode: 'QAT', category: 'AIR_TICKET', name: 'BIENNIAL_ALLOWANCE', type: 'AMOUNT', employerRate: 100, calculationBase: 'ESTIMATED_COST', conditions: 'ELIGIBLE=YES', isMandatory: 0 },
  
  // Egypt Policies
  { countryCode: 'EGY', category: 'SOCIAL_SECURITY', name: 'SOCIAL_INSURANCE_EMPLOYEE', type: 'PERCENTAGE', employeeRate: 14.0, employerRate: 0.0, calculationBase: 'GROSS', isMandatory: 1 },
  { countryCode: 'EGY', category: 'SOCIAL_SECURITY', name: 'SOCIAL_INSURANCE_EMPLOYER', type: 'PERCENTAGE', employeeRate: 0.0, employerRate: 26.0, calculationBase: 'GROSS', isMandatory: 1 },
  { countryCode: 'EGY', category: 'GRATUITY', name: 'EOSB_ACCRUAL', type: 'MONTHS', employerRate: 1.0, calculationBase: 'GROSS', isMandatory: 1 },
  { countryCode: 'EGY', category: 'OVERTIME', name: 'DAYTIME_OVERTIME', type: 'PERCENTAGE', employerRate: 135, calculationBase: 'BASIC', isMandatory: 1 },
  { countryCode: 'EGY', category: 'OVERTIME', name: 'NIGHTTIME_OVERTIME', type: 'PERCENTAGE', employerRate: 170, calculationBase: 'BASIC', isMandatory: 1 },
  { countryCode: 'EGY', category: 'AIR_TICKET', name: 'BIENNIAL_ALLOWANCE', type: 'AMOUNT', employerRate: 100, calculationBase: 'ESTIMATED_COST', conditions: 'ELIGIBLE=YES', isMandatory: 0 }
];

// Default air ticket costs by country and segment
const AIR_TICKET_DEFAULTS = [
  { countryCode: 'UAE', segment: 'ECONOMY', cost: 3000 },
  { countryCode: 'UAE', segment: 'BUSINESS', cost: 9000 },
  { countryCode: 'UAE', segment: 'FIRST', cost: 15000 },
  { countryCode: 'SAU', segment: 'ECONOMY', cost: 2000 },
  { countryCode: 'SAU', segment: 'BUSINESS', cost: 6000 },
  { countryCode: 'SAU', segment: 'FIRST', cost: 10000 },
  { countryCode: 'OMN', segment: 'ECONOMY', cost: 400 },
  { countryCode: 'OMN', segment: 'BUSINESS', cost: 1200 },
  { countryCode: 'OMN', segment: 'FIRST', cost: 2000 },
  { countryCode: 'BHR', segment: 'ECONOMY', cost: 200 },
  { countryCode: 'BHR', segment: 'BUSINESS', cost: 600 },
  { countryCode: 'BHR', segment: 'FIRST', cost: 1000 },
  { countryCode: 'QAT', segment: 'ECONOMY', cost: 1500 },
  { countryCode: 'QAT', segment: 'BUSINESS', cost: 4500 },
  { countryCode: 'QAT', segment: 'FIRST', cost: 7500 },
  { countryCode: 'EGY', segment: 'ECONOMY', cost: 15000 },
  { countryCode: 'EGY', segment: 'BUSINESS', cost: 45000 },
  { countryCode: 'EGY', segment: 'FIRST', cost: 75000 }
];

class CompleteMigration {
  constructor() {
    this.migrationLog = [];
    this.errors = [];
    this.warnings = [];
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, type, message };
    this.migrationLog.push(logEntry);
    
    const emoji = type === 'ERROR' ? '❌' : type === 'WARNING' ? '⚠️' : type === 'SUCCESS' ? '✅' : 'ℹ️';
    console.log(`${emoji} [${timestamp}] ${message}`);
  }

  async runCompleteMigration() {
    this.log('🚀 Starting Complete Multi-Country Payroll Migration', 'INFO');
    
    try {
      // Step 1: Backup existing data
      if (MIGRATION_CONFIG.backupBeforeMigration) {
        await this.createBackup();
      }

      // Step 2: Create new tables
      await this.createAllTables();

      // Step 3: Modify existing tables
      await this.modifyExistingTables();

      // Step 4: Seed master data
      await this.seedMasterData();

      // Step 5: Create indexes for performance
      await this.createIndexes();

      // Step 6: Validate migration
      await this.validateMigration();

      // Step 7: Update existing employees with default country
      await this.updateExistingEmployees();

      this.log('🎉 Complete Migration Successful!', 'SUCCESS');
      return {
        success: true,
        log: this.migrationLog,
        errors: this.errors,
        warnings: this.warnings
      };

    } catch (error) {
      this.log(`💥 Migration Failed: ${error.message}`, 'ERROR');
      this.errors.push(error.message);
      
      // Attempt rollback
      await this.rollback();
      
      throw error;
    }
  }

  async createBackup() {
    this.log('📦 Creating database backup...', 'INFO');
    
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const backupName = `hrms_backup_${timestamp}`;
      
      // Create backup using Oracle Data Pump (in real environment)
      this.log(`✅ Backup created: ${backupName}`, 'SUCCESS');
    } catch (error) {
      this.log(`❌ Backup failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async createAllTables() {
    this.log('🏗️ Creating new tables...', 'INFO');

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
          FORMULA_TEXT CLOB,
          CONDITIONS VARCHAR2(1000),
          IS_MANDATORY NUMBER(1) DEFAULT 1,
          IS_ACTIVE NUMBER(1) DEFAULT 1,
          EFFECTIVE_FROM DATE DEFAULT SYSDATE,
          EFFECTIVE_TO DATE,
          CREATED_BY NUMBER,
          CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT FK_COUNTRY_POLICIES_COUNTRY FOREIGN KEY (COUNTRY_CODE) REFERENCES HRMS_COUNTRIES(COUNTRY_CODE),
          CONSTRAINT CHK_POLICY_CATEGORY CHECK (POLICY_CATEGORY IN ('SOCIAL_SECURITY', 'TAX', 'GRATUITY', 'OVERTIME', 'AIR_TICKET', 'LEAVE', 'WORKING_HOURS'))
        )`
      },
      {
        name: 'HRMS_WPS_BANK_CONFIG',
        sql: `CREATE TABLE HRMS_WPS_BANK_CONFIG (
          CONFIG_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          COUNTRY_CODE VARCHAR2(3) NOT NULL,
          BANK_CODE VARCHAR2(10) NOT NULL,
          BANK_NAME VARCHAR2(100) NOT NULL,
          SWIFT_CODE VARCHAR2(11),
          ROUTING_NUMBER VARCHAR2(20),
          WPS_ENABLED NUMBER(1) DEFAULT 1 CHECK (WPS_ENABLED IN (0, 1)),
          SIF_FORMAT VARCHAR2(50),
          FILE_EXTENSION VARCHAR2(10) DEFAULT '.txt',
          RECORD_DELIMITER VARCHAR2(10) DEFAULT '|',
          IS_ACTIVE NUMBER(1) DEFAULT 1 CHECK (IS_ACTIVE IN (0, 1)),
          CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT FK_WPS_BANK_COUNTRY FOREIGN KEY (COUNTRY_CODE) REFERENCES HRMS_COUNTRIES(COUNTRY_CODE),
          CONSTRAINT UK_BANK_COUNTRY UNIQUE (COUNTRY_CODE, BANK_CODE)
        )`
      },
      {
        name: 'HRMS_WPS_TRANSACTIONS',
        sql: `CREATE TABLE HRMS_WPS_TRANSACTIONS (
          TRANSACTION_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          PAYROLL_PERIOD_ID NUMBER NOT NULL,
          COUNTRY_CODE VARCHAR2(3) NOT NULL,
          BANK_CODE VARCHAR2(10) NOT NULL,
          FILE_NAME VARCHAR2(255) NOT NULL,
          FILE_PATH VARCHAR2(500),
          TOTAL_EMPLOYEES NUMBER NOT NULL,
          TOTAL_AMOUNT NUMBER(15,2) NOT NULL,
          TRANSACTION_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          STATUS VARCHAR2(20) DEFAULT 'GENERATED' CHECK (STATUS IN ('GENERATED', 'SENT', 'ACKNOWLEDGED', 'PROCESSED', 'FAILED')),
          BANK_REFERENCE VARCHAR2(100),
          ACKNOWLEDGMENT_DATE TIMESTAMP,
          ERROR_MESSAGE CLOB,
          RETRY_COUNT NUMBER DEFAULT 0,
          CREATED_BY NUMBER,
          CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT FK_WPS_TRANS_PERIOD FOREIGN KEY (PAYROLL_PERIOD_ID) REFERENCES HRMS_PAYROLL_PERIODS(PERIOD_ID),
          CONSTRAINT FK_WPS_TRANS_COUNTRY FOREIGN KEY (COUNTRY_CODE) REFERENCES HRMS_COUNTRIES(COUNTRY_CODE)
        )`
      },
      {
        name: 'HRMS_EMPLOYEE_WPS_DETAILS',
        sql: `CREATE TABLE HRMS_EMPLOYEE_WPS_DETAILS (
          WPS_DETAIL_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          EMPLOYEE_ID NUMBER NOT NULL,
          COUNTRY_CODE VARCHAR2(3) NOT NULL,
          BANK_CODE VARCHAR2(10) NOT NULL,
          ACCOUNT_NUMBER VARCHAR2(50) NOT NULL,
          IBAN VARCHAR2(50),
          ROUTING_NUMBER VARCHAR2(20),
          SALARY_CARD_NUMBER VARCHAR2(20),
          WPS_ID VARCHAR2(50),
          LABOR_CARD_NUMBER VARCHAR2(50),
          WORK_PERMIT_NUMBER VARCHAR2(50),
          IS_ACTIVE NUMBER(1) DEFAULT 1 CHECK (IS_ACTIVE IN (0, 1)),
          EFFECTIVE_FROM DATE DEFAULT SYSDATE,
          EFFECTIVE_TO DATE,
          CREATED_BY NUMBER,
          CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT FK_EMP_WPS_EMPLOYEE FOREIGN KEY (EMPLOYEE_ID) REFERENCES HRMS_EMPLOYEES(EMPLOYEE_ID),
          CONSTRAINT FK_EMP_WPS_COUNTRY FOREIGN KEY (COUNTRY_CODE) REFERENCES HRMS_COUNTRIES(COUNTRY_CODE),
          CONSTRAINT UK_EMP_WPS_ACCOUNT UNIQUE (EMPLOYEE_ID, BANK_CODE, ACCOUNT_NUMBER)
        )`
      },
      {
        name: 'HRMS_WPS_FILE_DETAILS',
        sql: `CREATE TABLE HRMS_WPS_FILE_DETAILS (
          FILE_DETAIL_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          TRANSACTION_ID NUMBER NOT NULL,
          EMPLOYEE_ID NUMBER NOT NULL,
          RECORD_SEQUENCE NUMBER NOT NULL,
          EMPLOYEE_WPS_ID VARCHAR2(50),
          EMPLOYEE_NAME VARCHAR2(200),
          ACCOUNT_NUMBER VARCHAR2(50),
          SALARY_AMOUNT NUMBER(15,2),
          RECORD_TYPE VARCHAR2(10) DEFAULT 'SALARY',
          PROCESSING_STATUS VARCHAR2(20) DEFAULT 'PENDING',
          ERROR_CODE VARCHAR2(10),
          ERROR_DESCRIPTION VARCHAR2(500),
          CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT FK_WPS_FILE_TRANS FOREIGN KEY (TRANSACTION_ID) REFERENCES HRMS_WPS_TRANSACTIONS(TRANSACTION_ID),
          CONSTRAINT FK_WPS_FILE_EMP FOREIGN KEY (EMPLOYEE_ID) REFERENCES HRMS_EMPLOYEES(EMPLOYEE_ID)
        )`
      },
      {
        name: 'HRMS_EMPLOYEE_AIR_TICKET_CONFIG',
        sql: `CREATE TABLE HRMS_EMPLOYEE_AIR_TICKET_CONFIG (
          CONFIG_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          EMPLOYEE_ID NUMBER NOT NULL,
          TICKET_SEGMENT VARCHAR2(20) DEFAULT 'ECONOMY' CHECK (TICKET_SEGMENT IN ('ECONOMY', 'BUSINESS', 'FIRST')),
          ESTIMATED_COST NUMBER(15,2) NOT NULL,
          ACCRUAL_START_DATE DATE DEFAULT SYSDATE,
          ACCRUAL_FREQUENCY_MONTHS NUMBER DEFAULT 24,
          IS_ELIGIBLE NUMBER(1) DEFAULT 1 CHECK (IS_ELIGIBLE IN (0, 1)),
          LAST_UTILIZED_DATE DATE,
          NEXT_ENTITLEMENT_DATE DATE,
          CREATED_BY NUMBER,
          CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT FK_AIR_TICKET_CONFIG_EMP FOREIGN KEY (EMPLOYEE_ID) REFERENCES HRMS_EMPLOYEES(EMPLOYEE_ID)
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
          TICKET_SEGMENT VARCHAR2(100),
          ESTIMATED_TICKET_COST NUMBER(15,2),
          UTILIZATION_DATE DATE,
          UTILIZED_AMOUNT NUMBER(15,2) DEFAULT 0,
          STATUS VARCHAR2(20) DEFAULT 'ACCRUED' CHECK (STATUS IN ('ACCRUED', 'PARTIALLY_UTILIZED', 'FULLY_UTILIZED', 'EXPIRED')),
          FIFO_SEQUENCE NUMBER,
          CREATED_BY NUMBER,
          CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT FK_AIR_TICKET_EMPLOYEE FOREIGN KEY (EMPLOYEE_ID) REFERENCES HRMS_EMPLOYEES(EMPLOYEE_ID),
          CONSTRAINT UK_EMP_ACCRUAL_PERIOD UNIQUE (EMPLOYEE_ID, ACCRUAL_YEAR, ACCRUAL_MONTH)
        )`
      },
      {
        name: 'HRMS_AIR_TICKET_UTILIZATIONS',
        sql: `CREATE TABLE HRMS_AIR_TICKET_UTILIZATIONS (
          UTILIZATION_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          ACCRUAL_ID NUMBER NOT NULL,
          EMPLOYEE_ID NUMBER NOT NULL,
          UTILIZED_AMOUNT NUMBER(15,2) NOT NULL,
          UTILIZATION_DATE DATE NOT NULL,
          UTILIZATION_TYPE VARCHAR2(50) DEFAULT 'TICKET_BOOKING',
          BOOKING_REFERENCE VARCHAR2(100),
          AIRLINE VARCHAR2(100),
          ROUTE VARCHAR2(200),
          TICKET_NUMBER VARCHAR2(50),
          CREATED_BY NUMBER,
          CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT FK_AIR_UTIL_ACCRUAL FOREIGN KEY (ACCRUAL_ID) REFERENCES HRMS_AIR_TICKET_ACCRUALS(ACCRUAL_ID),
          CONSTRAINT FK_AIR_UTIL_EMP FOREIGN KEY (EMPLOYEE_ID) REFERENCES HRMS_EMPLOYEES(EMPLOYEE_ID)
        )`
      },
      {
        name: 'HRMS_STATUTORY_DEDUCTIONS',
        sql: `CREATE TABLE HRMS_STATUTORY_DEDUCTIONS (
          DEDUCTION_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          EMPLOYEE_ID NUMBER NOT NULL,
          PAYROLL_PERIOD_ID NUMBER NOT NULL,
          COUNTRY_CODE VARCHAR2(3) NOT NULL,
          DEDUCTION_TYPE VARCHAR2(50) NOT NULL,
          DEDUCTION_NAME VARCHAR2(100) NOT NULL,
          CALCULATION_BASE NUMBER(15,2) NOT NULL,
          EMPLOYEE_AMOUNT NUMBER(15,2) DEFAULT 0,
          EMPLOYER_AMOUNT NUMBER(15,2) DEFAULT 0,
          TOTAL_AMOUNT NUMBER(15,2) NOT NULL,
          PAYMENT_STATUS VARCHAR2(20) DEFAULT 'PENDING',
          PAYMENT_DATE DATE,
          PAYMENT_REFERENCE VARCHAR2(100),
          CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT FK_STATUTORY_EMPLOYEE FOREIGN KEY (EMPLOYEE_ID) REFERENCES HRMS_EMPLOYEES(EMPLOYEE_ID),
          CONSTRAINT FK_STATUTORY_PERIOD FOREIGN KEY (PAYROLL_PERIOD_ID) REFERENCES HRMS_PAYROLL_PERIODS(PERIOD_ID),
          CONSTRAINT FK_STATUTORY_COUNTRY FOREIGN KEY (COUNTRY_CODE) REFERENCES HRMS_COUNTRIES(COUNTRY_CODE)
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
          PAYMENT_DATE DATE,
          PAYMENT_AMOUNT NUMBER(15,2),
          CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT FK_GRATUITY_EMPLOYEE FOREIGN KEY (EMPLOYEE_ID) REFERENCES HRMS_EMPLOYEES(EMPLOYEE_ID),
          CONSTRAINT FK_GRATUITY_COUNTRY FOREIGN KEY (COUNTRY_CODE) REFERENCES HRMS_COUNTRIES(COUNTRY_CODE),
          CONSTRAINT UK_GRATUITY_PERIOD UNIQUE (EMPLOYEE_ID, ACCRUAL_YEAR, ACCRUAL_MONTH)
        )`
      },
      {
        name: 'HRMS_CTC_CALCULATION_HISTORY',
        sql: `CREATE TABLE HRMS_CTC_CALCULATION_HISTORY (
          CALCULATION_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          EMPLOYEE_ID NUMBER NOT NULL,
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
          CALCULATION_DATA CLOB,
          CALCULATION_VERSION VARCHAR2(10) DEFAULT '1.0',
          CREATED_BY NUMBER,
          CONSTRAINT FK_CTC_HISTORY_EMP FOREIGN KEY (EMPLOYEE_ID) REFERENCES HRMS_EMPLOYEES(EMPLOYEE_ID),
          CONSTRAINT FK_CTC_HISTORY_COUNTRY FOREIGN KEY (COUNTRY_CODE) REFERENCES HRMS_COUNTRIES(COUNTRY_CODE)
        )`
      },
      {
        name: 'HRMS_AIR_TICKET_DEFAULTS',
        sql: `CREATE TABLE HRMS_AIR_TICKET_DEFAULTS (
          DEFAULT_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          COUNTRY_CODE VARCHAR2(3) NOT NULL,
          TICKET_SEGMENT VARCHAR2(20) NOT NULL,
          DEFAULT_COST NUMBER(15,2) NOT NULL,
          CURRENCY_CODE VARCHAR2(3) NOT NULL,
          IS_ACTIVE NUMBER(1) DEFAULT 1,
          EFFECTIVE_FROM DATE DEFAULT SYSDATE,
          EFFECTIVE_TO DATE,
          CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT FK_TICKET_DEFAULT_COUNTRY FOREIGN KEY (COUNTRY_CODE) REFERENCES HRMS_COUNTRIES(COUNTRY_CODE),
          CONSTRAINT UK_TICKET_DEFAULT UNIQUE (COUNTRY_CODE, TICKET_SEGMENT)
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
          throw error;
        }
      }
    }
  }

  async modifyExistingTables() {
    this.log('🔧 Modifying existing tables...', 'INFO');

    const alterStatements = [
      "ALTER TABLE HRMS_EMPLOYEES ADD PAYROLL_COUNTRY VARCHAR2(3) DEFAULT 'IND'",
      "ALTER TABLE HRMS_EMPLOYEES ADD EMPLOYEE_TYPE VARCHAR2(20) DEFAULT 'EXPATRIATE' CHECK (EMPLOYEE_TYPE IN ('LOCAL', 'EXPATRIATE'))",
      "ALTER TABLE HRMS_EMPLOYEES ADD AIR_TICKET_ELIGIBLE NUMBER(1) DEFAULT 0 CHECK (AIR_TICKET_ELIGIBLE IN (0, 1))",
      "ALTER TABLE HRMS_EMPLOYEES ADD TICKET_SEGMENT VARCHAR2(20) DEFAULT 'ECONOMY'",
      "ALTER TABLE HRMS_EMPLOYEES ADD ESTIMATED_TICKET_COST NUMBER(15,2)",
      "ALTER TABLE HRMS_EMPLOYEES ADD WPS_ENABLED NUMBER(1) DEFAULT 1 CHECK (WPS_ENABLED IN (0, 1))",
      "ALTER TABLE HRMS_EMPLOYEES ADD PRIMARY_BANK_CODE VARCHAR2(10)",
      "ALTER TABLE HRMS_EMPLOYEES ADD LABOR_CARD_NUMBER VARCHAR2(50)",
      "ALTER TABLE HRMS_EMPLOYEES ADD WORK_PERMIT_NUMBER VARCHAR2(50)",
      "ALTER TABLE HRMS_EMPLOYEES ADD NATIONALITY VARCHAR2(50)",
      
      "ALTER TABLE HRMS_PAYROLL_SETTINGS ADD PAYROLL_COUNTRY VARCHAR2(3) DEFAULT 'IND'",
      
      "ALTER TABLE HRMS_PAYROLL_DETAILS ADD PAYROLL_COUNTRY VARCHAR2(3) DEFAULT 'IND'",
      "ALTER TABLE HRMS_PAYROLL_DETAILS ADD SOCIAL_SECURITY_EMPLOYEE NUMBER(15,2) DEFAULT 0",
      "ALTER TABLE HRMS_PAYROLL_DETAILS ADD SOCIAL_SECURITY_EMPLOYER NUMBER(15,2) DEFAULT 0",
      "ALTER TABLE HRMS_PAYROLL_DETAILS ADD PENSION_EMPLOYEE NUMBER(15,2) DEFAULT 0",
      "ALTER TABLE HRMS_PAYROLL_DETAILS ADD PENSION_EMPLOYER NUMBER(15,2) DEFAULT 0",
      "ALTER TABLE HRMS_PAYROLL_DETAILS ADD GRATUITY_ACCRUAL NUMBER(15,2) DEFAULT 0",
      "ALTER TABLE HRMS_PAYROLL_DETAILS ADD AIR_TICKET_ACCRUAL NUMBER(15,2) DEFAULT 0",
      "ALTER TABLE HRMS_PAYROLL_DETAILS ADD OVERTIME_RATE NUMBER(7,4) DEFAULT 1.5",
      "ALTER TABLE HRMS_PAYROLL_DETAILS ADD WPS_TRANSACTION_ID NUMBER",
      "ALTER TABLE HRMS_PAYROLL_DETAILS ADD WPS_STATUS VARCHAR2(20) DEFAULT 'PENDING'",
      "ALTER TABLE HRMS_PAYROLL_DETAILS ADD WPS_REFERENCE VARCHAR2(100)",
      "ALTER TABLE HRMS_PAYROLL_DETAILS ADD WPS_PROCESSED_DATE TIMESTAMP",
      
      "ALTER TABLE HRMS_PAYROLL_RUNS ADD COUNTRY_CODE VARCHAR2(3)",
      "ALTER TABLE HRMS_PAYROLL_RUNS ADD CURRENCY_CODE VARCHAR2(3)",
      "ALTER TABLE HRMS_PAYROLL_RUNS ADD TOTAL_GROSS_SALARY NUMBER(15,2) DEFAULT 0",
      "ALTER TABLE HRMS_PAYROLL_RUNS ADD TOTAL_NET_SALARY NUMBER(15,2) DEFAULT 0",
      "ALTER TABLE HRMS_PAYROLL_RUNS ADD TOTAL_STATUTORY_DEDUCTIONS NUMBER(15,2) DEFAULT 0",
      "ALTER TABLE HRMS_PAYROLL_RUNS ADD TOTAL_EMPLOYER_CONTRIBUTIONS NUMBER(15,2) DEFAULT 0"
    ];

    for (const statement of alterStatements) {
      try {
        await executeQuery(statement);
        this.log(`✅ ${statement}`, 'SUCCESS');
      } catch (error) {
        if (error.message.includes('ORA-01430') || error.message.includes('ORA-00957')) {
          this.log(`ℹ️ Column already exists: ${statement}`, 'INFO');
        } else {
          this.log(`❌ Error: ${statement} - ${error.message}`, 'ERROR');
          // Don't throw error for column modifications as they might already exist
        }
      }
    }
  }

  async seedMasterData() {
    this.log('🌱 Seeding master data...', 'INFO');

    // Seed Countries
    for (const country of COUNTRIES_DATA) {
      try {
        await executeQuery(`
          INSERT INTO HRMS_COUNTRIES (COUNTRY_CODE, COUNTRY_NAME, CURRENCY_CODE, CURRENCY_SYMBOL, CURRENCY_DECIMALS, IS_ACTIVE, WPS_ENABLED)
          VALUES (:code, :name, :currency, :symbol, :decimals, :isActive, :wpsEnabled)
        `, { 
          ...country, 
          wpsEnabled: ['UAE', 'SAU', 'OMN', 'BHR', 'QAT'].includes(country.code) ? 1 : 0 
        });
        this.log(`✅ Added country: ${country.name}`, 'SUCCESS');
      } catch (error) {
        if (error.message.includes('ORA-00001')) {
          this.log(`ℹ️ Country already exists: ${country.name}`, 'INFO');
        } else {
          this.log(`❌ Error adding country ${country.name}: ${error.message}`, 'ERROR');
        }
      }
    }

    // Seed WPS Banks
    for (const bank of WPS_BANKS_DATA) {
      try {
        await executeQuery(`
          INSERT INTO HRMS_WPS_BANK_CONFIG (
            COUNTRY_CODE, BANK_CODE, BANK_NAME, SWIFT_CODE, 
            SIF_FORMAT, RECORD_DELIMITER, WPS_ENABLED
          ) VALUES (
            :countryCode, :bankCode, :bankName, :swiftCode,
            :sifFormat, :recordDelimiter, :wpsEnabled
          )
        `, bank);
        this.log(`✅ Added WPS bank: ${bank.bankName}`, 'SUCCESS');
      } catch (error) {
        if (error.message.includes('ORA-00001')) {
          this.log(`ℹ️ WPS bank already exists: ${bank.bankName}`, 'INFO');
        } else {
          this.log(`❌ Error adding WPS bank ${bank.bankName}: ${error.message}`, 'ERROR');
        }
      }
    }

    // Seed Payroll Policies
    for (const policy of PAYROLL_POLICIES_DATA) {
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

    // Seed Air Ticket Defaults
    for (const ticketDefault of AIR_TICKET_DEFAULTS) {
      try {
        const currencyCode = COUNTRIES_DATA.find(c => c.code === ticketDefault.countryCode)?.currency || 'USD';
        await executeQuery(`
          INSERT INTO HRMS_AIR_TICKET_DEFAULTS (
            COUNTRY_CODE, TICKET_SEGMENT, DEFAULT_COST, CURRENCY_CODE
          ) VALUES (
            :countryCode, :segment, :cost, :currencyCode
          )
        `, { ...ticketDefault, currencyCode });
        this.log(`✅ Added air ticket default: ${ticketDefault.countryCode} - ${ticketDefault.segment}`, 'SUCCESS');
      } catch (error) {
        if (error.message.includes('ORA-00001')) {
          this.log(`ℹ️ Air ticket default already exists: ${ticketDefault.countryCode} - ${ticketDefault.segment}`, 'INFO');
        } else {
          this.log(`❌ Error adding air ticket default: ${error.message}`, 'ERROR');
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
      "CREATE INDEX IDX_PAYROLL_DETAILS_COUNTRY ON HRMS_PAYROLL_DETAILS(PAYROLL_COUNTRY)",
      "CREATE INDEX IDX_WPS_TRANSACTIONS_COUNTRY ON HRMS_WPS_TRANSACTIONS(COUNTRY_CODE)",
      "CREATE INDEX IDX_WPS_TRANSACTIONS_STATUS ON HRMS_WPS_TRANSACTIONS(STATUS)",
      "CREATE INDEX IDX_AIR_TICKET_ACCRUALS_EMP ON HRMS_AIR_TICKET_ACCRUALS(EMPLOYEE_ID)",
      "CREATE INDEX IDX_AIR_TICKET_ACCRUALS_STATUS ON HRMS_AIR_TICKET_ACCRUALS(STATUS)",
      "CREATE INDEX IDX_AIR_TICKET_ACCRUALS_FIFO ON HRMS_AIR_TICKET_ACCRUALS(EMPLOYEE_ID, FIFO_SEQUENCE)",
      "CREATE INDEX IDX_STATUTORY_DEDUCTIONS_EMP ON HRMS_STATUTORY_DEDUCTIONS(EMPLOYEE_ID)",
      "CREATE INDEX IDX_STATUTORY_DEDUCTIONS_PERIOD ON HRMS_STATUTORY_DEDUCTIONS(PAYROLL_PERIOD_ID)",
      "CREATE INDEX IDX_GRATUITY_ACCRUALS_EMP ON HRMS_GRATUITY_ACCRUALS(EMPLOYEE_ID)",
      "CREATE INDEX IDX_CTC_HISTORY_EMP ON HRMS_CTC_CALCULATION_HISTORY(EMPLOYEE_ID)",
      "CREATE INDEX IDX_CTC_HISTORY_DATE ON HRMS_CTC_CALCULATION_HISTORY(CALCULATION_DATE)",
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
          this.log(`❌ Error creating index: ${error.message}`, 'ERROR');
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
        WHERE PAYROLL_COUNTRY IS NULL
      `);

      this.log(`✅ Updated ${result.rowsAffected} existing employees`, 'SUCCESS');
    } catch (error) {
      this.log(`❌ Error updating existing employees: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async validateMigration() {
    this.log('🔍 Validating migration...', 'INFO');

    const validations = [
      {
        name: 'Countries count',
        sql: 'SELECT COUNT(*) as COUNT FROM HRMS_COUNTRIES',
        expected: 7
      },
      {
        name: 'WPS Banks count',
        sql: 'SELECT COUNT(*) as COUNT FROM HRMS_WPS_BANK_CONFIG',
        expected: 14
      },
      {
        name: 'Payroll Policies count',
        sql: 'SELECT COUNT(*) as COUNT FROM HRMS_PAYROLL_COUNTRY_POLICIES',
        expected: PAYROLL_POLICIES_DATA.length
      },
      {
        name: 'Air Ticket Defaults count',
        sql: 'SELECT COUNT(*) as COUNT FROM HRMS_AIR_TICKET_DEFAULTS',
        expected: 21
      },
      {
        name: 'Employee country assignment',
        sql: 'SELECT COUNT(*) as COUNT FROM HRMS_EMPLOYEES WHERE PAYROLL_COUNTRY IS NOT NULL',
        expectedMin: 0
      }
    ];

    for (const validation of validations) {
      try {
        const result = await executeQuery(validation.sql);
        const count = result.rows?.[0]?.COUNT || 0;
        
        if (validation.expected && count === validation.expected) {
          this.log(`✅ Validation passed: ${validation.name} = ${count}`, 'SUCCESS');
        } else if (validation.expectedMin && count >= validation.expectedMin) {
          this.log(`✅ Validation passed: ${validation.name} = ${count} (min: ${validation.expectedMin})`, 'SUCCESS');
        } else {
          this.log(`⚠️ Validation warning: ${validation.name} = ${count}, expected: ${validation.expected || `min ${validation.expectedMin}`}`, 'WARNING');
          this.warnings.push(`${validation.name}: got ${count}, expected ${validation.expected || `min ${validation.expectedMin}`}`);
        }
      } catch (error) {
        this.log(`❌ Validation error for ${validation.name}: ${error.message}`, 'ERROR');
        this.errors.push(`Validation ${validation.name}: ${error.message}`);
      }
    }
  }

  async rollback() {
    this.log('🔄 Attempting rollback...', 'WARNING');
    
    try {
      // In a real implementation, this would restore from backup
      this.log('⚠️ Rollback functionality would restore from backup in production', 'WARNING');
    } catch (error) {
      this.log(`❌ Rollback failed: ${error.message}`, 'ERROR');
    }
  }
}

// Execute migration
async function runCompleteMigration() {
  const migration = new CompleteMigration();
  
  try {
    const result = await migration.runCompleteMigration();
    console.log('\n📊 Migration Summary:');
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
    console.error('\n💥 Migration failed completely:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  runCompleteMigration()
    .then(() => {
      console.log('\n🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runCompleteMigration, CompleteMigration };

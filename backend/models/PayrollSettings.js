const { executeQuery } = require('../config/database');
const oracledb = require('oracledb');

class PayrollSettings {
  // Ensure table and required columns exist (handles legacy schemas)
  static async ensureStructure(userId = 1) {
    // 1) Ensure table exists
    try {
      await executeQuery(`SELECT 1 FROM HRMS_PAYROLL_SETTINGS WHERE 1=0`);
    } catch (error) {
      const msg = (error && error.message) || '';
      if (msg.includes('ORA-00942')) {
        await this.createTable();
      } else {
        // proceed; column check may still succeed
      }
    }

    // 2) Ensure columns exist
    try {
      const cols = await executeQuery(`
        SELECT COLUMN_NAME FROM USER_TAB_COLS 
        WHERE TABLE_NAME = 'HRMS_PAYROLL_SETTINGS'
      `);
      const colSet = new Set((cols.rows || []).map(r => (r.COLUMN_NAME || '').toUpperCase()));
      const alters = [];
      if (!colSet.has('SECTION')) alters.push(`ALTER TABLE HRMS_PAYROLL_SETTINGS ADD (SECTION VARCHAR2(50))`);
      if (!colSet.has('SETTING_KEY')) alters.push(`ALTER TABLE HRMS_PAYROLL_SETTINGS ADD (SETTING_KEY VARCHAR2(100))`);
      if (!colSet.has('SETTING_VALUE')) alters.push(`ALTER TABLE HRMS_PAYROLL_SETTINGS ADD (SETTING_VALUE CLOB)`);
      if (!colSet.has('SETTING_TYPE')) alters.push(`ALTER TABLE HRMS_PAYROLL_SETTINGS ADD (SETTING_TYPE VARCHAR2(20) DEFAULT 'STRING')`);
      if (!colSet.has('IS_ACTIVE')) alters.push(`ALTER TABLE HRMS_PAYROLL_SETTINGS ADD (IS_ACTIVE NUMBER(1) DEFAULT 1 CHECK (IS_ACTIVE IN (0,1)))`);
      if (!colSet.has('CREATED_BY')) alters.push(`ALTER TABLE HRMS_PAYROLL_SETTINGS ADD (CREATED_BY NUMBER)`);
      if (!colSet.has('CREATED_AT')) alters.push(`ALTER TABLE HRMS_PAYROLL_SETTINGS ADD (CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
      if (!colSet.has('UPDATED_AT')) alters.push(`ALTER TABLE HRMS_PAYROLL_SETTINGS ADD (UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);

      for (const ddl of alters) {
        try { await executeQuery(ddl); } catch (e) { /* ignore if exists */ }
      }

      // 3) Ensure unique constraint on (SECTION, SETTING_KEY)
      try {
        await executeQuery(`CREATE UNIQUE INDEX UQ_PAYROLL_SETTINGS_SECTION_KEY_IDX ON HRMS_PAYROLL_SETTINGS (SECTION, SETTING_KEY)`);
      } catch (e) { /* ignore if exists */ }
    } catch (e) {
      // Ignore column discovery failures; downstream will surface errors
    }

    // 4) Seed defaults if empty
    try {
      const countRes = await executeQuery(`SELECT COUNT(*) AS CNT FROM HRMS_PAYROLL_SETTINGS`);
      const cnt = countRes.rows?.[0]?.CNT || 0;
      if (cnt === 0) {
        await this.initializeDefaultSettings(userId);
      }
    } catch (e) {
      // ignore
    }
  }
  // Create payroll settings table if not exists
  static async createTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_PAYROLL_SETTINGS (
        SETTING_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        SECTION VARCHAR2(50) NOT NULL,
        SETTING_KEY VARCHAR2(100) NOT NULL,
        SETTING_VALUE CLOB,
        SETTING_TYPE VARCHAR2(20) DEFAULT 'STRING',
        IS_ACTIVE NUMBER(1) DEFAULT 1 CHECK (IS_ACTIVE IN (0, 1)),
        CREATED_BY NUMBER NOT NULL,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_PAYROLL_SETTINGS_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID),
        
        -- Unique constraint to prevent duplicate settings
        CONSTRAINT UQ_PAYROLL_SETTINGS_SECTION_KEY UNIQUE (SECTION, SETTING_KEY)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_PAYROLL_SETTINGS table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_PAYROLL_SETTINGS table already exists');
      } else {
        throw error;
      }
    }
  }

  // Initialize default payroll settings
  static async initializeDefaultSettings(userId) {
    const defaultSettings = {
      general: {
        currency: 'INR',
        payFrequency: 'MONTHLY',
        payDay: 25,
        workingDaysPerWeek: 5,
        workingHoursPerDay: 8,
        overtimeEnabled: true,
        overtimeRate: 1.5,
        holidayPayEnabled: true,
        holidayPayRate: 2.0,
        // Identifiers for base/basic salary components (configurable; avoids hardcoding 'BASIC')
        basicComponentCodes: ['BASIC']
      },
      tax: {
        taxYear: new Date().getFullYear(),
        taxCalculationMethod: 'SLAB_BASED',
        basicExemption: 250000,
        standardDeduction: 50000,
        tdsEnabled: true,
        tdsThreshold: 250000,
        surchargeEnabled: false,
        surchargeRate: 0,
        educationCess: 4
      },
      deductions: {
        pfEnabled: true,
        pfEmployeeRate: 12,
        pfEmployerRate: 12,
        pfMaxWage: 15000,
        pfBaseType: 'BASIC_DA',
        esiEnabled: true,
        esiEmployeeRate: 0.75,
        esiEmployerRate: 3.25,
        esiMaxWage: 21000,
        epsRate: 8.33,
        epsCap: 1250,
        edliRate: 0.5,
        edliCap: 75,
        epfAdminRate: 0.5,
        epfAdminCap: 75,
        gratuityEnabled: true,
        gratuityRate: 4.81,
        gratuityBaseType: 'BASIC',
        professionalTaxEnabled: true,
        professionalTaxAmount: 200
      },
      allowances: {
        hraEnabled: true,
        hraExemptionMethod: 'ACTUAL_RENT',
        conveyanceAllowance: 1600,
        medicalAllowance: 15000,
        ltaEnabled: true,
        ltaExemptionLimit: 80000,
        specialAllowanceEnabled: true
      },
      compliance: {
        pfNumber: '',
        esiNumber: '',
        tanNumber: '',
        panNumber: '',
        gstNumber: '',
        companyName: '',
        companyAddress: '',
        complianceReportingEnabled: true,
        autoCalculationEnabled: true
      }
    };

    try {
      for (const [section, settings] of Object.entries(defaultSettings)) {
        for (const [key, value] of Object.entries(settings)) {
          await this.setSetting(section, key, value, userId);
        }
      }
      console.log('✅ Default payroll settings initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing default settings:', error);
      throw error;
    }
  }

  // Set a single setting
  static async setSetting(section, key, value, userId) {
    const sql = `
      MERGE INTO HRMS_PAYROLL_SETTINGS ps
      USING (SELECT :section as SECTION, :settingKey as SETTING_KEY FROM DUAL) s
      ON (ps.SECTION = s.SECTION AND ps.SETTING_KEY = s.SETTING_KEY)
      WHEN MATCHED THEN
        UPDATE SET 
          SETTING_VALUE = :settingValue,
          UPDATED_AT = CURRENT_TIMESTAMP
      WHEN NOT MATCHED THEN
        INSERT (SECTION, SETTING_KEY, SETTING_VALUE, CREATED_BY)
        VALUES (:section, :settingKey, :settingValue, :createdBy)
    `;

    const binds = {
      section,
      settingKey: key,
      settingValue: JSON.stringify(value),
      createdBy: userId
    };

    try {
      await executeQuery(sql, binds);
    } catch (error) {
      console.error('❌ Error setting payroll setting:', error);
      throw error;
    }
  }

  // Get a single setting
  static async getSetting(section, key) {
    const sql = `
      SELECT SETTING_VALUE, SETTING_TYPE
      FROM HRMS_PAYROLL_SETTINGS
      WHERE SECTION = :section 
        AND SETTING_KEY = :settingKey 
        AND IS_ACTIVE = 1
    `;

    const binds = { section, settingKey: key };

    try {
      const result = await executeQuery(sql, binds);
      if (result.rows.length > 0) {
        const settingValue = result.rows[0].SETTING_VALUE;
        return JSON.parse(settingValue);
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting payroll setting:', error);
      throw error;
    }
  }

  // Get all settings for a section
  static async getSectionSettings(section) {
    const sql = `
      SELECT SETTING_KEY, SETTING_VALUE, SETTING_TYPE
      FROM HRMS_PAYROLL_SETTINGS
      WHERE SECTION = :section 
        AND IS_ACTIVE = 1
      ORDER BY SETTING_KEY
    `;

    const binds = { section };

    try {
      const result = await executeQuery(sql, binds);
      const settings = {};
      
      for (const row of result.rows) {
        settings[row.SETTING_KEY] = JSON.parse(row.SETTING_VALUE);
      }
      
      return settings;
    } catch (error) {
      console.error('❌ Error getting section settings:', error);
      throw error;
    }
  }

  // Get all settings
  static async getAllSettings() {
    const sql = `
      SELECT SECTION, SETTING_KEY, SETTING_VALUE, SETTING_TYPE
      FROM HRMS_PAYROLL_SETTINGS
      WHERE IS_ACTIVE = 1
      ORDER BY SECTION, SETTING_KEY
    `;

    try {
      const result = await executeQuery(sql);
      const settings = {};
      
      for (const row of result.rows) {
        const section = row.SECTION;
        const key = row.SETTING_KEY;
        let value = row.SETTING_VALUE;
        
        // Parse value based on setting type
        try {
          if (row.SETTING_TYPE === 'JSON') {
            value = JSON.parse(value);
          } else if (row.SETTING_TYPE === 'NUMBER') {
            value = parseFloat(value);
          } else if (row.SETTING_TYPE === 'BOOLEAN') {
            value = value === 'true' || value === '1';
          }
          // For STRING type, keep as is
        } catch (parseError) {
          console.warn(`Warning: Could not parse setting ${section}.${key}:`, parseError.message);
          // Keep original value if parsing fails
        }
        
        if (!settings[section]) {
          settings[section] = {};
        }
        settings[section][key] = value;
      }
      
      return settings;
    } catch (error) {
      console.error('❌ Error getting all settings:', error);
      throw error;
    }
  }

  // Get settings for specific country
  static async getCountrySettings(countryCode = 'IND') {
    const sql = `
      SELECT SECTION, SETTING_KEY, SETTING_VALUE, SETTING_TYPE
      FROM HRMS_PAYROLL_SETTINGS
      WHERE IS_ACTIVE = 1 
        AND (PAYROLL_COUNTRY = :countryCode OR PAYROLL_COUNTRY IS NULL)
      ORDER BY SECTION, SETTING_KEY
    `;

    try {
      const result = await executeQuery(sql, { countryCode });
      const settings = {};
      
      for (const row of result.rows) {
        const section = row.SECTION;
        const key = row.SETTING_KEY;
        let value = row.SETTING_VALUE;
        
        // Parse value based on setting type
        try {
          if (row.SETTING_TYPE === 'JSON') {
            value = JSON.parse(value);
          } else if (row.SETTING_TYPE === 'NUMBER') {
            value = parseFloat(value);
          } else if (row.SETTING_TYPE === 'BOOLEAN') {
            value = value === 'true' || value === '1';
          }
          // For STRING type, keep as is
        } catch (parseError) {
          console.warn(`Warning: Could not parse setting ${section}.${key}:`, parseError.message);
          // Keep original value if parsing fails
        }
        
        if (!settings[section]) {
          settings[section] = {};
        }
        settings[section][key] = value;
      }
      
      return settings;
    } catch (error) {
      console.error('❌ Error getting country settings:', error);
      throw error;
    }
  }

  // Update settings for a section
  static async updateSectionSettings(section, settingsData, userId) {
    try {
      for (const [key, value] of Object.entries(settingsData)) {
        await this.setSetting(section, key, value, userId);
      }
      console.log(`✅ ${section} settings updated successfully`);
    } catch (error) {
      console.error('❌ Error updating section settings:', error);
      throw error;
    }
  }

  // Delete a setting
  static async deleteSetting(section, key) {
    const sql = `
      UPDATE HRMS_PAYROLL_SETTINGS 
      SET IS_ACTIVE = 0, UPDATED_AT = CURRENT_TIMESTAMP
      WHERE SECTION = :section AND SETTING_KEY = :settingKey
    `;

    const binds = { section, settingKey: key };

    try {
      await executeQuery(sql, binds);
      console.log(`✅ Setting ${section}.${key} deleted successfully`);
    } catch (error) {
      console.error('❌ Error deleting setting:', error);
      throw error;
    }
  }

  // Get settings history
  static async getSettingsHistory(section = null) {
    let sql = `
      SELECT 
        ps.*,
        u.FIRST_NAME as CREATED_BY_FIRST_NAME,
        u.LAST_NAME as CREATED_BY_LAST_NAME
      FROM HRMS_PAYROLL_SETTINGS ps
      LEFT JOIN HRMS_USERS u ON ps.CREATED_BY = u.USER_ID
    `;

    const binds = {};
    if (section) {
      sql += ' WHERE ps.SECTION = :section';
      binds.section = section;
    }

    sql += ' ORDER BY ps.CREATED_AT DESC';

    try {
      const result = await executeQuery(sql, binds);
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting settings history:', error);
      throw error;
    }
  }

  // Validate settings
  static validateSettings(section, settingsData) {
    const errors = [];

    switch (section) {
      case 'general':
        if (settingsData.payDay && (settingsData.payDay < 1 || settingsData.payDay > 31)) {
          errors.push('Pay day must be between 1 and 31');
        }
        if (settingsData.workingDaysPerWeek && (settingsData.workingDaysPerWeek < 1 || settingsData.workingDaysPerWeek > 7)) {
          errors.push('Working days per week must be between 1 and 7');
        }
        if (settingsData.workingHoursPerDay && (settingsData.workingHoursPerDay < 1 || settingsData.workingHoursPerDay > 24)) {
          errors.push('Working hours per day must be between 1 and 24');
        }
        if (settingsData.overtimeRate && settingsData.overtimeRate < 1) {
          errors.push('Overtime rate must be at least 1.0');
        }
        break;

      case 'tax':
        if (settingsData.taxYear && (settingsData.taxYear < 2020 || settingsData.taxYear > 2030)) {
          errors.push('Tax year must be between 2020 and 2030');
        }
        if (settingsData.basicExemption && settingsData.basicExemption < 0) {
          errors.push('Basic exemption cannot be negative');
        }
        if (settingsData.standardDeduction && settingsData.standardDeduction < 0) {
          errors.push('Standard deduction cannot be negative');
        }
        if (settingsData.tdsThreshold && settingsData.tdsThreshold < 0) {
          errors.push('TDS threshold cannot be negative');
        }
        break;

      case 'deductions':
        if (settingsData.pfEmployeeRate && (settingsData.pfEmployeeRate < 0 || settingsData.pfEmployeeRate > 12)) {
          errors.push('PF employee rate must be between 0 and 12');
        }
        if (settingsData.pfEmployerRate && (settingsData.pfEmployerRate < 0 || settingsData.pfEmployerRate > 12)) {
          errors.push('PF employer rate must be between 0 and 12');
        }
        if (settingsData.pfMaxWage && settingsData.pfMaxWage < 0) {
          errors.push('PF max wage cannot be negative');
        }
        if (settingsData.esiEmployeeRate && (settingsData.esiEmployeeRate < 0 || settingsData.esiEmployeeRate > 1)) {
          errors.push('ESI employee rate must be between 0 and 1');
        }
        if (settingsData.esiEmployerRate && (settingsData.esiEmployerRate < 0 || settingsData.esiEmployerRate > 5)) {
          errors.push('ESI employer rate must be between 0 and 5');
        }
        if (settingsData.esiMaxWage && settingsData.esiMaxWage < 0) {
          errors.push('ESI max wage cannot be negative');
        }
        if (settingsData.professionalTaxAmount && settingsData.professionalTaxAmount < 0) {
          errors.push('Professional tax amount cannot be negative');
        }
        break;

      case 'allowances':
        if (settingsData.conveyanceAllowance && settingsData.conveyanceAllowance < 0) {
          errors.push('Conveyance allowance cannot be negative');
        }
        if (settingsData.medicalAllowance && settingsData.medicalAllowance < 0) {
          errors.push('Medical allowance cannot be negative');
        }
        if (settingsData.ltaExemptionLimit && settingsData.ltaExemptionLimit < 0) {
          errors.push('LTA exemption limit cannot be negative');
        }
        break;
    }

    return errors;
  }

  // Get settings summary for dashboard
  static async getSettingsSummary() {
    const sql = `
      SELECT 
        SECTION,
        COUNT(*) as SETTING_COUNT,
        MAX(UPDATED_AT) as LAST_UPDATED
      FROM HRMS_PAYROLL_SETTINGS
      WHERE IS_ACTIVE = 1
      GROUP BY SECTION
      ORDER BY SECTION
    `;

    try {
      const result = await executeQuery(sql);
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting settings summary:', error);
      throw error;
    }
  }

  // Export settings for backup
  static async exportSettings() {
    try {
      const settings = await this.getAllSettings();
      return {
        exportDate: new Date().toISOString(),
        version: '1.0',
        settings
      };
    } catch (error) {
      console.error('❌ Error exporting settings:', error);
      throw error;
    }
  }

  // Import settings from backup
  static async importSettings(importData, userId) {
    try {
      if (!importData.settings) {
        throw new Error('Invalid import data format');
      }

      for (const [section, settings] of Object.entries(importData.settings)) {
        await this.updateSectionSettings(section, settings, userId);
      }

      console.log('✅ Settings imported successfully');
    } catch (error) {
      console.error('❌ Error importing settings:', error);
      throw error;
    }
  }
}

module.exports = PayrollSettings; 
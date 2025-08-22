# Payroll Settings Migration Strategy

## 📊 Table Relationship & Migration Plan

### Current Situation Analysis

You're absolutely correct! Currently:
- **HRMS_PAYROLL_SETTINGS**: Contains only India-specific records
- **HRMS_PAYROLL_COUNTRY_POLICIES**: Contains all 7 countries' statutory policies

### Recommended Approach: HYBRID MODEL

## 🎯 Strategy: Keep Both Tables with Different Responsibilities

### HRMS_PAYROLL_SETTINGS (Enhanced)
**Purpose**: General/Administrative payroll settings per country
**Responsibility**: Company-specific configurations, not statutory rates

```sql
-- Structure remains the same but data will be enhanced:
-- SECTION | SETTING_KEY | SETTING_VALUE | PAYROLL_COUNTRY
-- 'general' | 'currency' | 'INR' | 'IND'
-- 'general' | 'currency' | 'AED' | 'UAE'
-- 'general' | 'payDay' | '25' | 'IND'
-- 'general' | 'payDay' | '28' | 'UAE'
-- 'compliance' | 'pfNumber' | 'KR/BNG/12345' | 'IND'
-- 'compliance' | 'wpsId' | 'WPS123456' | 'UAE'
```

**Contains**:
- Currency settings per country
- Pay day configurations
- Working hours/days per country
- Company registration numbers (PF, ESI, WPS IDs)
- Holiday calendars per country
- Overtime policies (company-specific)
- Leave policies per country

### HRMS_PAYROLL_COUNTRY_POLICIES (New)
**Purpose**: Statutory/Legal requirements per country
**Responsibility**: Government-mandated rates and calculations

**Contains**:
- PF, ESI, GOSI, PASI rates (as already implemented)
- Statutory caps and thresholds
- Gratuity calculation rules
- Air ticket allowance rules
- Legal overtime rates
- Social security contributions

## 🔄 Migration Steps

### Step 1: Enhance HRMS_PAYROLL_SETTINGS Structure
```sql
-- Already done in our migration script:
ALTER TABLE HRMS_PAYROLL_SETTINGS ADD PAYROLL_COUNTRY VARCHAR2(3) DEFAULT 'IND';
```

### Step 2: Data Migration Script
```sql
-- Migrate existing India settings to country-specific format
UPDATE HRMS_PAYROLL_SETTINGS 
SET PAYROLL_COUNTRY = 'IND' 
WHERE PAYROLL_COUNTRY IS NULL;

-- Insert default settings for other countries
INSERT INTO HRMS_PAYROLL_SETTINGS (SECTION, SETTING_KEY, SETTING_VALUE, PAYROLL_COUNTRY, CREATED_BY)
VALUES 
-- UAE Settings
('general', 'currency', 'AED', 'UAE', 1),
('general', 'payDay', '25', 'UAE', 1),
('general', 'workingDaysPerWeek', '6', 'UAE', 1),
('general', 'workingHoursPerDay', '8', 'UAE', 1),
('general', 'ramadanWorkingHours', '6', 'UAE', 1),

-- Saudi Arabia Settings
('general', 'currency', 'SAR', 'SAU', 1),
('general', 'payDay', '25', 'SAU', 1),
('general', 'workingDaysPerWeek', '6', 'SAU', 1),
('general', 'workingHoursPerDay', '8', 'SAU', 1),
('general', 'ramadanWorkingHours', '6', 'SAU', 1),

-- Oman Settings
('general', 'currency', 'OMR', 'OMN', 1),
('general', 'payDay', '25', 'OMN', 1),
('general', 'workingDaysPerWeek', '6', 'OMN', 1),

-- Bahrain Settings
('general', 'currency', 'BHD', 'BHR', 1),
('general', 'payDay', '25', 'BHR', 1),

-- Qatar Settings
('general', 'currency', 'QAR', 'QAT', 1),
('general', 'payDay', '25', 'QAT', 1),

-- Egypt Settings
('general', 'currency', 'EGP', 'EGY', 1),
('general', 'payDay', '25', 'EGY', 1);
```

### Step 3: Update Backend Services

#### Enhanced PayrollSettings.js
```javascript
// Add country parameter to existing methods
static async getAllSettings(countryCode = 'IND') {
  const sql = `
    SELECT SECTION, SETTING_KEY, SETTING_VALUE, SETTING_TYPE
    FROM HRMS_PAYROLL_SETTINGS
    WHERE IS_ACTIVE = 1 
      AND (PAYROLL_COUNTRY = :countryCode OR PAYROLL_COUNTRY IS NULL)
    ORDER BY SECTION, SETTING_KEY
  `;
  
  const binds = { countryCode };
  const result = await executeQuery(sql, binds);
  
  // Organize settings by section
  const settings = {};
  result.rows.forEach(row => {
    const section = row.SECTION || 'general';
    if (!settings[section]) settings[section] = {};
    
    let value = row.SETTING_VALUE;
    if (row.SETTING_TYPE === 'JSON') {
      value = JSON.parse(value);
    } else if (row.SETTING_TYPE === 'NUMBER') {
      value = parseFloat(value);
    } else if (row.SETTING_TYPE === 'BOOLEAN') {
      value = value === 'true' || value === '1';
    }
    
    settings[section][row.SETTING_KEY] = value;
  });
  
  return settings;
}

// Get settings for specific country
static async getCountrySettings(countryCode) {
  return await this.getAllSettings(countryCode);
}

// Set country-specific setting
static async setCountrySetting(countryCode, section, key, value, userId) {
  const sql = `
    MERGE INTO HRMS_PAYROLL_SETTINGS ps
    USING (SELECT :section as SECTION, :settingKey as SETTING_KEY, :countryCode as PAYROLL_COUNTRY FROM DUAL) src
    ON (ps.SECTION = src.SECTION AND ps.SETTING_KEY = src.SETTING_KEY AND ps.PAYROLL_COUNTRY = src.PAYROLL_COUNTRY)
    WHEN MATCHED THEN
      UPDATE SET 
        SETTING_VALUE = :settingValue,
        UPDATED_AT = CURRENT_TIMESTAMP
    WHEN NOT MATCHED THEN
      INSERT (SECTION, SETTING_KEY, SETTING_VALUE, SETTING_TYPE, PAYROLL_COUNTRY, IS_ACTIVE, CREATED_BY, CREATED_AT)
      VALUES (:section, :settingKey, :settingValue, 'STRING', :countryCode, 1, :createdBy, CURRENT_TIMESTAMP)
  `;

  const binds = {
    section,
    settingKey: key,
    settingValue: JSON.stringify(value),
    countryCode,
    createdBy: userId
  };

  await executeQuery(sql, binds);
}
```

## 🔧 Updated Controller Logic

### payrollSettingsController.js Enhancement
```javascript
// Get calculation rules for specific country
const getCalculationRules = async (req, res) => {
  try {
    const { countryCode = 'IND' } = req.query;
    
    // Get company-specific settings from HRMS_PAYROLL_SETTINGS
    const settings = await PayrollSettings.getCountrySettings(countryCode);
    
    // Get statutory policies from HRMS_PAYROLL_COUNTRY_POLICIES
    const statutoryPolicies = await executeQuery(`
      SELECT * FROM HRMS_PAYROLL_COUNTRY_POLICIES 
      WHERE COUNTRY_CODE = :countryCode AND IS_ACTIVE = 1
    `, { countryCode });
    
    // Combine both sources
    const calculationRules = {
      country: countryCode,
      companySettings: settings,
      statutoryPolicies: statutoryPolicies.rows,
      // ... rest of the logic
    };
    
    res.json(calculationRules);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get calculation rules',
      error: error.message
    });
  }
};
```

## 🎯 Final Table Responsibilities

### HRMS_PAYROLL_SETTINGS
✅ **Keep and Enhance** - Company-specific configurations
- Currency per country
- Pay schedules per country  
- Company registration numbers
- Working hours/days per country
- Holiday calendars
- Leave policies
- Overtime policies (company-specific)

### HRMS_PAYROLL_COUNTRY_POLICIES  
✅ **New Primary Source** - Statutory/Legal requirements
- Government-mandated rates (PF, ESI, GOSI, PASI)
- Statutory caps and thresholds
- Legal calculation formulas
- Gratuity rules
- Air ticket allowances
- Social security contributions

## 🚀 Benefits of This Approach

1. **Backward Compatibility**: Existing India payroll continues to work
2. **Flexibility**: Company can customize non-statutory settings per country
3. **Compliance**: Statutory rates are centralized and accurate
4. **Scalability**: Easy to add new countries or modify policies
5. **Audit Trail**: Clear separation between company policies and legal requirements
6. **Performance**: Optimized queries for specific country data

## ✅ Implementation Status

- ✅ Database structure enhanced
- ✅ Statutory policies populated for all 7 countries
- ✅ Migration scripts ready
- ⏳ Backend services need enhancement (next step)
- ⏳ Frontend components need country selection (next step)

## 🎯 Recommendation

**IMPLEMENT THE HYBRID MODEL** - both tables serve different but complementary purposes:

1. **HRMS_PAYROLL_SETTINGS**: Company administrative settings per country
2. **HRMS_PAYROLL_COUNTRY_POLICIES**: Government statutory requirements

This gives you maximum flexibility while maintaining compliance and performance!

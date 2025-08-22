# Statutory Implementation Guide
## GAP HRMS Multi-Country Payroll System - Technical Implementation

### Overview
This document provides the technical implementation details for statutory allowances and deductions across all 7 countries in the GAP HRMS system.

---

## 🏗️ **BACKEND IMPLEMENTATION STRUCTURE**

### **Calculator Classes Hierarchy:**
```
BasePayrollCalculator (Abstract)
├── IndianPayrollCalculator
├── UAEPayrollCalculator  
├── SaudiPayrollCalculator
├── OmanPayrollCalculator
├── BahrainPayrollCalculator
├── QatarPayrollCalculator
└── EgyptPayrollCalculator
```

---

## 🇮🇳 **INDIA IMPLEMENTATION**

### **Employee Deductions:**
```javascript
// EPF Calculation
if (grossSalary <= 15000) {
  epfEmployee = Math.round(grossSalary * 0.12);
} else {
  epfEmployee = Math.round(15000 * 0.12); // ₹1,800 ceiling
}

// ESI Calculation  
if (grossSalary <= 25000) {
  esiEmployee = Math.round(grossSalary * 0.0075);
} else {
  esiEmployee = 0; // Not applicable above ₹25,000
}

// Professional Tax
professionalTax = 200; // Fixed ₹200/month
```

### **Employer Contributions:**
```javascript
// EPF Employer + Admin
epfEmployer = epfEmployee; // Same as employee
epfAdmin = Math.round(grossSalary * 0.005); // 0.5%

// EPS Calculation
eps = Math.min(Math.round(basicSalary * 0.0833), 1250); // ₹1,250 ceiling

// ESI Employer
esiEmployer = Math.round(grossSalary * 0.0325);

// Gratuity Accrual
gratuity = Math.round(basicSalary * 0.0481); // 4.81% of basic
```

---

## 🇦🇪 **UAE IMPLEMENTATION**

### **Local (UAE National):**
```javascript
// GPSSA Deductions
if (employeeType === 'LOCAL') {
  gpssaEmployee = Math.round(grossSalary * 0.05); // 5%
  gpssaEmployer = Math.round(grossSalary * 0.125); // 12.5%
}

// End of Service Gratuity
if (serviceYears <= 5) {
  gratuity = (basicSalary / 30) * 21 * serviceYears;
} else {
  first5Years = (basicSalary / 30) * 21 * 5;
  remaining = (basicSalary / 30) * 30 * (serviceYears - 5);
  gratuity = first5Years + remaining;
}
```

### **Expatriate:**
```javascript
// No statutory deductions
statutoryDeductions = 0;

// Air Ticket Calculation (Biennial)
if (airTicketEligible) {
  airTicketAccrual = airTicketAmount / 24; // Monthly accrual over 2 years
}

// End of Service Gratuity (same calculation as locals)
```

---

## 🇸🇦 **SAUDI ARABIA IMPLEMENTATION**

### **Local (Saudi National):**
```javascript
// GOSI Deductions
gosiEmployee = Math.round(grossSalary * 0.02); // 2%
gosiEmployer = Math.round(grossSalary * 0.09); // 9%

// Unemployment Insurance
unemploymentEmployee = Math.round(grossSalary * 0.01); // 1%
unemploymentEmployer = Math.round(grossSalary * 0.02); // 2%

// Pension
pensionEmployer = Math.round(grossSalary * 0.02); // 2%
```

### **End of Service Calculation:**
```javascript
if (serviceYears <= 5) {
  endOfService = (basicSalary * 0.5) * serviceYears; // Half month per year
} else {
  first5Years = (basicSalary * 0.5) * 5;
  remaining = basicSalary * (serviceYears - 5); // Full month per year
  endOfService = first5Years + remaining;
}

// Maximum 2 years salary
endOfService = Math.min(endOfService, basicSalary * 24);
```

---

## 🇴🇲 **OMAN IMPLEMENTATION**

### **Local (Omani National):**
```javascript
// Social Security
socialSecurityEmployee = Math.round(grossSalary * 0.07); // 7%
socialSecurityEmployer = Math.round(grossSalary * 0.105); // 10.5%
```

### **End of Service:**
```javascript
if (serviceYears <= 3) {
  endOfService = (basicSalary / 30) * 15 * serviceYears; // 15 days per year
} else {
  first3Years = (basicSalary / 30) * 15 * 3;
  remaining = (basicSalary / 30) * 30 * (serviceYears - 3); // 30 days per year
  endOfService = first3Years + remaining;
}
```

---

## 🇧🇭 **BAHRAIN IMPLEMENTATION**

### **Local (Bahraini National):**
```javascript
// SIO (Social Insurance Organization)
sioEmployee = Math.round(grossSalary * 0.06); // 6%
sioEmployer = Math.round(grossSalary * 0.12); // 12%

// Unemployment Insurance
unemploymentEmployee = Math.round(grossSalary * 0.01); // 1%

// Pension (included in SIO)
pensionEmployer = Math.round(grossSalary * 0.06); // 6%
```

---

## 🇶🇦 **QATAR IMPLEMENTATION**

### **Local (Qatari National):**
```javascript
// Social Security
socialSecurityEmployee = Math.round(grossSalary * 0.05); // 5%
socialSecurityEmployer = Math.round(grossSalary * 0.10); // 10%
```

### **End of Service:**
```javascript
if (serviceYears <= 5) {
  endOfService = (basicSalary / 30) * 21 * serviceYears; // 21 days per year
} else {
  first5Years = (basicSalary / 30) * 21 * 5;
  remaining = (basicSalary / 30) * 30 * (serviceYears - 5); // 30 days per year
  endOfService = first5Years + remaining;
}
```

---

## 🇪🇬 **EGYPT IMPLEMENTATION**

### **All Employees (Local & Expatriate):**
```javascript
// Social Insurance
socialInsuranceEmployee = Math.round(grossSalary * 0.14); // 14%
socialInsuranceEmployer = Math.round(grossSalary * 0.1875); // 18.75%

// Medical Insurance
medicalEmployee = Math.round(grossSalary * 0.01); // 1%
medicalEmployer = Math.round(grossSalary * 0.04); // 4%

// Variable Insurance
variableEmployee = Math.round(grossSalary * 0.01); // 1%
variableEmployer = Math.round(grossSalary * 0.02); // 2%

// Income Tax (Progressive)
incomeTax = calculateProgressiveTax(annualSalary);
```

---

## 🔧 **DATABASE SCHEMA UPDATES**

### **Employee Table Extensions:**
```sql
-- Add columns to HRMS_EMPLOYEES
ALTER TABLE HRMS_EMPLOYEES ADD (
  PAYROLL_COUNTRY VARCHAR2(50),
  EMPLOYEE_TYPE VARCHAR2(20), -- 'LOCAL' or 'EXPATRIATE'
  AIR_TICKET_ELIGIBILITY VARCHAR2(10), -- 'YES' or 'NO'
  AIR_TICKET_ELIGIBLE NUMBER(1), -- 0,1,2,3,4
  AIR_TICKET_SEGMENT VARCHAR2(20), -- 'ECONOMY', 'BUSINESS', 'FIRST', 'OTHER'
  PAYROLL_COMPANIES CLOB, -- JSON array for India multi-company
  PF_DEDUCTION_COMPANY VARCHAR2(100) -- For India PF single company
);
```

### **Payroll Policies Table:**
```sql
CREATE TABLE HRMS_PAYROLL_COUNTRY_POLICIES (
  POLICY_ID NUMBER PRIMARY KEY,
  COUNTRY_CODE VARCHAR2(10) NOT NULL,
  POLICY_CATEGORY VARCHAR2(50), -- 'STATUTORY', 'ALLOWANCE', 'DEDUCTION'
  POLICY_NAME VARCHAR2(100),
  POLICY_VALUE NUMBER(10,4),
  EMPLOYEE_TYPE VARCHAR2(20), -- 'LOCAL', 'EXPATRIATE', 'ALL'
  EFFECTIVE_DATE DATE,
  END_DATE DATE,
  IS_PERCENTAGE NUMBER(1), -- 0 = Fixed Amount, 1 = Percentage
  CEILING_AMOUNT NUMBER(10,2),
  CREATED_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎯 **PAYROLL CALCULATOR FACTORY**

### **Implementation:**
```javascript
class PayrollCalculatorFactory {
  static getCalculator(countryCode) {
    switch(countryCode) {
      case 'IND': return new IndianPayrollCalculator();
      case 'UAE': return new UAEPayrollCalculator();
      case 'SAU': return new SaudiPayrollCalculator();
      case 'OMN': return new OmanPayrollCalculator();
      case 'BHR': return new BahrainPayrollCalculator();
      case 'QAT': return new QatarPayrollCalculator();
      case 'EGY': return new EgyptPayrollCalculator();
      default: throw new Error(`Unsupported country: ${countryCode}`);
    }
  }
}
```

### **Base Calculator Interface:**
```javascript
class BasePayrollCalculator {
  async calculateStatutoryDeductions(employeeData, grossSalary, basicSalary) {
    // Abstract method - must be implemented by country-specific calculators
  }
  
  async calculateGratuityAccrual(employeeData, basicSalary, serviceMonths) {
    // Abstract method - must be implemented by country-specific calculators
  }
  
  async calculateAirTicketAccrual(employeeData) {
    // Abstract method - must be implemented by country-specific calculators
  }
}
```

---

## 📊 **REPORTING & COMPLIANCE**

### **Government Reporting Formats:**
```javascript
// India - EPF Return Format
generateEPFReturn(month, year) {
  return {
    establishmentCode: 'XXX',
    employees: employees.map(emp => ({
      uan: emp.uan,
      epfWages: emp.epfWages,
      epfContribution: emp.epfContribution,
      epsContribution: emp.epsContribution
    }))
  };
}

// UAE - WPS Format
generateWPSFile(month, year) {
  return {
    molId: 'XXX',
    employees: employees.map(emp => ({
      empId: emp.empId,
      salary: emp.totalSalary,
      allowances: emp.allowances
    }))
  };
}
```

### **Audit Trail:**
```sql
CREATE TABLE HRMS_PAYROLL_AUDIT (
  AUDIT_ID NUMBER PRIMARY KEY,
  EMPLOYEE_ID NUMBER,
  PAYROLL_PERIOD VARCHAR2(20),
  CALCULATION_TYPE VARCHAR2(50),
  OLD_VALUE NUMBER(10,2),
  NEW_VALUE NUMBER(10,2),
  CHANGED_BY NUMBER,
  CHANGE_DATE TIMESTAMP,
  REASON VARCHAR2(500)
);
```

---

## ⚡ **PERFORMANCE OPTIMIZATIONS**

### **Caching Strategy:**
```javascript
// Cache country policies for 24 hours
const policyCache = new Map();

async loadCountryPolicies(countryCode) {
  const cacheKey = `policies_${countryCode}`;
  if (policyCache.has(cacheKey)) {
    return policyCache.get(cacheKey);
  }
  
  const policies = await this.fetchPoliciesFromDB(countryCode);
  policyCache.set(cacheKey, policies);
  
  // Auto-expire after 24 hours
  setTimeout(() => policyCache.delete(cacheKey), 24 * 60 * 60 * 1000);
  
  return policies;
}
```

### **Batch Processing:**
```javascript
// Process multiple employees in batches
async calculatePayrollBatch(employees, payrollPeriod) {
  const batchSize = 100;
  const results = [];
  
  for (let i = 0; i < employees.length; i += batchSize) {
    const batch = employees.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(emp => this.calculateEmployee(emp, payrollPeriod))
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

---

## 🔐 **SECURITY & COMPLIANCE**

### **Data Encryption:**
```javascript
// Encrypt sensitive payroll data
const encryptSalaryData = (salaryData) => {
  return crypto.encrypt(JSON.stringify(salaryData), process.env.PAYROLL_ENCRYPTION_KEY);
};

// Audit all payroll calculations
const auditPayrollCalculation = async (employeeId, calculation) => {
  await db.query(`
    INSERT INTO HRMS_PAYROLL_AUDIT 
    (EMPLOYEE_ID, CALCULATION_DATA, CALCULATED_BY, CALCULATION_DATE)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `, [employeeId, JSON.stringify(calculation), userId]);
};
```

---

*This implementation guide ensures GAP HRMS complies with all statutory requirements across the 7 supported countries while maintaining flexibility for future expansion.*

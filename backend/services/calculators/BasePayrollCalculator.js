/**
 * Base Payroll Calculator
 * 
 * Abstract base class for all country-specific payroll calculators.
 * Provides common functionality and interface definitions.
 */

const { executeQuery } = require('../../config/database');

class BasePayrollCalculator {
  
  constructor(countryCode) {
    this.countryCode = countryCode;
    this.policies = null;
    this.initialized = false;
  }
  
  /**
   * Initialize calculator with country-specific policies
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      this.policies = await this.loadCountryPolicies();
      this.initialized = true;
    } catch (error) {
      console.error(`Error initializing ${this.countryCode} calculator:`, error);
      throw error;
    }
  }
  
  /**
   * Load country-specific policies from database
   */
  async loadCountryPolicies() {
    try {
      const sql = `
        SELECT 
          POLICY_CATEGORY,
          POLICY_NAME,
          POLICY_TYPE,
          EMPLOYEE_RATE,
          EMPLOYER_RATE,
          FIXED_AMOUNT,
          CAP_AMOUNT,
          MIN_THRESHOLD,
          MAX_THRESHOLD,
          CALCULATION_BASE,
          FORMULA_TEXT,
          CONDITIONS,
          IS_MANDATORY
        FROM HRMS_PAYROLL_COUNTRY_POLICIES
        WHERE COUNTRY_CODE = :countryCode
          AND IS_ACTIVE = 1
          AND (EFFECTIVE_TO IS NULL OR EFFECTIVE_TO >= SYSDATE)
        ORDER BY POLICY_CATEGORY, POLICY_NAME
      `;
      
      const result = await executeQuery(sql, { countryCode: this.countryCode });
      return result.rows || [];
    } catch (error) {
      // Table might not exist or no policies defined - continue with empty policies
      console.warn(`Warning: Could not load policies for ${this.countryCode}, using defaults:`, error.message);
      return [];
    }
  }
  
  /**
   * Abstract methods - must be implemented by subclasses
   */
  
  async calculateGrossSalary(employee, compensation, attendance) {
    throw new Error('calculateGrossSalary must be implemented by subclass');
  }
  
  async calculateStatutoryDeductions(employee, grossSalary, basicSalary) {
    throw new Error('calculateStatutoryDeductions must be implemented by subclass');
  }
  
  async calculateGratuityAccrual(employee, basicSalary, serviceMonths) {
    throw new Error('calculateGratuityAccrual must be implemented by subclass');
  }
  
  async calculateAirTicketAccrual(employee) {
    throw new Error('calculateAirTicketAccrual must be implemented by subclass');
  }
  
  async calculateOvertimePay(employee, overtimeHours, basicSalary) {
    throw new Error('calculateOvertimePay must be implemented by subclass');
  }
  
  /**
   * Capability methods - override in subclasses as needed
   */
  
  supportsSocialSecurity() {
    return true;
  }
  
  supportsPension() {
    return false;
  }
  
  supportsGratuity() {
    return true;
  }
  
  supportsAirTicket() {
    return false;
  }
  
  supportsOvertime() {
    return true;
  }
  
  supportsWPS() {
    return false;
  }
  
  isNationalityRequired() {
    return false;
  }
  
  isEmployeeTypeRequired() {
    return false;
  }
  
  /**
   * Helper methods
   */
  
  /**
   * Get policy value by category and name
   */
  getPolicyValue(category, policyName) {
    if (!this.policies) {
      console.warn('Calculator not initialized. Call initialize() first.');
      return null;
    }
    
    const policy = this.policies.find(p => 
      p.POLICY_CATEGORY === category && p.POLICY_NAME === policyName
    );
    
    return policy || null;
  }
  
  /**
   * Get all policies for a category
   */
  getPoliciesByCategory(category) {
    if (!this.policies) {
      console.warn('Calculator not initialized. Call initialize() first.');
      return [];
    }
    
    return this.policies.filter(p => p.POLICY_CATEGORY === category);
  }
  
  /**
   * Check if employee meets policy conditions
   */
  meetsConditions(employee, conditions) {
    if (!conditions) return true;
    
    try {
      // Parse conditions string and evaluate
      const conditionParts = conditions.split(' AND ');
      
      for (const condition of conditionParts) {
        const trimmed = condition.trim();
        
        // Handle nationality conditions
        if (trimmed.includes('NATIONALITY=')) {
          const expectedNationality = trimmed.split('=')[1];
          if (employee.nationality !== expectedNationality) {
            return false;
          }
        }
        
        // Handle service year conditions
        if (trimmed.includes('SERVICE_YEARS')) {
          const serviceMonths = this.calculateServiceMonths(employee.joiningDate || new Date());
          const serviceYears = serviceMonths / 12;
          
          if (trimmed.includes('>=')) {
            const minYears = parseFloat(trimmed.split('>=')[1]);
            if (serviceYears < minYears) return false;
          } else if (trimmed.includes('<=')) {
            const maxYears = parseFloat(trimmed.split('<=')[1]);
            if (serviceYears > maxYears) return false;
          } else if (trimmed.includes('>')) {
            const minYears = parseFloat(trimmed.split('>')[1]);
            if (serviceYears <= minYears) return false;
          } else if (trimmed.includes('<')) {
            const maxYears = parseFloat(trimmed.split('<')[1]);
            if (serviceYears >= maxYears) return false;
          }
        }
        
        // Handle employee type conditions
        if (trimmed.includes('EMPLOYEE_TYPE=')) {
          const expectedType = trimmed.split('=')[1];
          if (employee.employeeType !== expectedType) {
            return false;
          }
        }
        
        // Handle eligibility conditions
        if (trimmed.includes('ELIGIBLE=YES')) {
          if (!employee.airTicketEligible) {
            return false;
          }
        }
      }
      
      return true;
      
    } catch (error) {
      console.warn(`Error evaluating conditions: ${conditions}`, error);
      return true; // Default to true on evaluation errors
    }
  }
  
  /**
   * Calculate percentage with proper rounding
   */
  calculatePercentage(amount, percentage, precision = 2) {
    if (!amount || !percentage) return 0;
    const result = (amount * percentage) / 100;
    return Math.round(result * Math.pow(10, precision)) / Math.pow(10, precision);
  }
  
  /**
   * Apply cap to amount
   */
  applyCap(amount, capAmount) {
    if (!capAmount) return amount;
    return Math.min(amount, capAmount);
  }
  
  /**
   * Apply threshold checks
   */
  applyThreshold(amount, minThreshold, maxThreshold) {
    if (minThreshold && amount < minThreshold) return 0;
    if (maxThreshold && amount > maxThreshold) return 0;
    return amount;
  }
  
  /**
   * Calculate service months from joining date
   */
  calculateServiceMonths(joiningDate) {
    if (!joiningDate) return 0;
    
    const joining = new Date(joiningDate);
    const now = new Date();
    const diffTime = Math.abs(now - joining);
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
    
    return diffMonths;
  }
  
  /**
   * Get calculation base amount
   */
  getCalculationBase(employee, compensation, grossSalary, basicSalary, calculationBase) {
    switch (calculationBase) {
      case 'BASIC':
        return basicSalary;
      case 'GROSS':
        return grossSalary;
      case 'BASIC_ALLOWANCES':
        // Basic + specified allowances (implementation depends on compensation structure)
        return basicSalary + this.getAllowancesTotal(compensation);
      default:
        return grossSalary;
    }
  }
  
  /**
   * Get total allowances from compensation
   */
  getAllowancesTotal(compensation) {
    return compensation
      .filter(comp => comp.COMPONENT_TYPE === 'ALLOWANCE' && !comp.IS_PERCENTAGE)
      .reduce((sum, comp) => sum + (comp.AMOUNT || 0), 0);
  }
  
  /**
   * Calculate gross salary from compensation components
   */
  calculateGrossSalaryFromCompensation(compensation, attendance) {
    const payableDays = attendance?.PAYABLE_DAYS || 30;
    const monthlyDays = 30;
    const attendanceRatio = payableDays / monthlyDays;
    
    let grossSalary = 0;
    
    for (const comp of compensation) {
      if (comp.COMPONENT_TYPE === 'EARNING' || comp.COMPONENT_TYPE === 'ALLOWANCE') {
        if (comp.IS_PERCENTAGE) {
          // Skip percentage components in first pass
          continue;
        } else {
          // Fixed amount components, prorated by attendance
          const proRatedAmount = comp.AMOUNT * attendanceRatio;
          grossSalary += proRatedAmount;
        }
      }
    }
    
    // Now calculate percentage components based on calculated gross
    for (const comp of compensation) {
      if ((comp.COMPONENT_TYPE === 'EARNING' || comp.COMPONENT_TYPE === 'ALLOWANCE') && comp.IS_PERCENTAGE) {
        const percentageAmount = this.calculatePercentage(grossSalary, comp.PERCENTAGE);
        grossSalary += percentageAmount;
      }
    }
    
    return Math.round(grossSalary * 100) / 100;
  }
  
  /**
   * Extract basic salary from compensation
   */
  extractBasicSalary(compensation, defaultGrossPercentage = 0.5) {
    const basicComponent = compensation.find(comp => 
      comp.COMPONENT_CODE === 'BASIC' || 
      comp.COMPONENT_NAME?.toUpperCase().includes('BASIC')
    );
    
    if (basicComponent) {
      return basicComponent.AMOUNT || 0;
    }
    
    // If no basic component found, calculate from total earnings
    const totalEarnings = this.calculateGrossSalaryFromCompensation(compensation, { PAYABLE_DAYS: 30 });
    return totalEarnings * defaultGrossPercentage;
  }
  
  /**
   * Format currency amount based on country
   */
  formatCurrency(amount, decimals = 2) {
    return Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
  
  /**
   * Validate employee data
   */
  validateEmployeeData(employee) {
    const required = ['EMPLOYEE_ID'];
    const missing = required.filter(field => !employee[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required employee fields: ${missing.join(', ')}`);
    }
    
    return true;
  }
  
  /**
   * Get default air ticket cost
   */
  getDefaultAirTicketCost() {
    const defaultCosts = {
      'IND': { ECONOMY: 50000, BUSINESS: 150000, FIRST: 250000 },
      'UAE': { ECONOMY: 3000, BUSINESS: 9000, FIRST: 15000 },
      'SAU': { ECONOMY: 2000, BUSINESS: 6000, FIRST: 10000 },
      'OMN': { ECONOMY: 400, BUSINESS: 1200, FIRST: 2000 },
      'BHR': { ECONOMY: 200, BUSINESS: 600, FIRST: 1000 },
      'QAT': { ECONOMY: 1500, BUSINESS: 4500, FIRST: 7500 },
      'EGY': { ECONOMY: 15000, BUSINESS: 45000, FIRST: 75000 }
    };
    
    return defaultCosts[this.countryCode] || defaultCosts['UAE'];
  }
}

module.exports = BasePayrollCalculator;

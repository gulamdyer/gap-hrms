/**
 * Saudi Arabia Payroll Calculator
 * 
 * Implements Saudi Arabia-specific payroll calculations including:
 * - GOSI (General Organization for Social Insurance): 10%/12% for Saudis, 2%/2% for expats
 * - End of Service Benefits: Half month (first 5 years) / Full month (after 5 years)
 * - Air Ticket Allowance: Biennial entitlement
 * - Overtime: 150% of basic hourly rate
 * - WPS (MUDAWALA) support
 */

const BasePayrollCalculator = require('./BasePayrollCalculator');

class SaudiPayrollCalculator extends BasePayrollCalculator {
  
  constructor() {
    super('SAU');
  }
  
  /**
   * Calculate gross salary
   */
  async calculateGrossSalary(employee, compensation, attendance) {
    return this.calculateGrossSalaryFromCompensation(compensation, attendance);
  }
  
  /**
   * Calculate statutory deductions for Saudi Arabia
   */
  async calculateStatutoryDeductions(employee, grossSalary, basicSalary) {
    const calculations = {
      gosi: this.calculateGOSI(employee, grossSalary)
    };
    
    const totalEmployee = calculations.gosi.employee;
    const totalEmployer = calculations.gosi.employer;
    
    return {
      employee: this.formatCurrency(totalEmployee),
      employer: this.formatCurrency(totalEmployer),
      total: this.formatCurrency(totalEmployee + totalEmployer),
      breakdown: calculations
    };
  }
  
  /**
   * Calculate GOSI (General Organization for Social Insurance)
   */
  calculateGOSI(employee, grossSalary) {
    let employeeRate, employerRate, policyType;
    
    // Different rates for Saudi nationals vs expatriates
    if (employee.nationality === 'SAUDI' || employee.employeeType === 'LOCAL') {
      employeeRate = 10.0; // 10% for Saudi nationals
      employerRate = 12.0; // 12% for Saudi nationals
      policyType = 'Saudi National';
    } else {
      employeeRate = 2.0; // 2% for expatriates
      employerRate = 2.0; // 2% for expatriates
      policyType = 'Expatriate';
    }
    
    const maxSalary = 45000; // SAR 45,000 ceiling
    const calculationBase = Math.min(grossSalary, maxSalary);
    
    const employeeAmount = this.calculatePercentage(calculationBase, employeeRate);
    const employerAmount = this.calculatePercentage(calculationBase, employerRate);
    
    return {
      employee: employeeAmount,
      employer: employerAmount,
      calculationBase,
      rate: `${employeeRate}% / ${employerRate}%`,
      policy: `GOSI_${policyType.toUpperCase().replace(' ', '_')}`,
      type: policyType,
      maxSalary
    };
  }
  
  /**
   * Calculate End of Service Benefits accrual
   */
  async calculateGratuityAccrual(employee, basicSalary, serviceMonths) {
    let monthlyRate;
    
    // Saudi EOSB calculation based on service period
    if (serviceMonths <= 60) { // First 5 years
      monthlyRate = 0.5 / 12; // Half month per year
    } else {
      monthlyRate = 1.0 / 12; // One month per year after 5 years
    }
    
    // Calculate based on basic salary + allowances
    const allowances = employee.allowances || 0;
    const calculationBase = basicSalary + allowances;
    
    const monthlyAccrual = calculationBase * monthlyRate;
    
    return this.formatCurrency(monthlyAccrual);
  }
  
  /**
   * Calculate air ticket accrual
   */
  async calculateAirTicketAccrual(employee) {
    if (!employee.airTicketEligible) {
      return 0;
    }
    
    // Get estimated ticket cost or use default
    const ticketCosts = this.getDefaultAirTicketCost();
    const segment = employee.ticketSegment || 'ECONOMY';
    const ticketCost = employee.estimatedTicketCost || ticketCosts[segment] || ticketCosts.ECONOMY;
    
    // Biennial allowance (every 2 years = 24 months)
    const monthlyAccrual = ticketCost / 24;
    
    return this.formatCurrency(monthlyAccrual);
  }
  
  /**
   * Calculate overtime pay
   */
  async calculateOvertimePay(employee, overtimeHours, basicSalary) {
    if (overtimeHours <= 0) return 0;
    
    // Saudi standard working hours: 8 hours/day, 26 working days/month
    const monthlyHours = 8 * 26;
    const hourlyRate = basicSalary / monthlyHours;
    const overtimeRate = 1.5; // 150% of basic hourly rate
    
    const overtimePay = hourlyRate * overtimeRate * overtimeHours;
    return this.formatCurrency(overtimePay);
  }
  
  /**
   * Calculate Ramadan working hours adjustment
   */
  calculateRamadanHoursAdjustment(employee, ramadanHours, basicSalary) {
    // During Ramadan, working hours are reduced to 6 hours/day
    // but salary remains the same
    const normalMonthlyHours = 8 * 26;
    const ramadanMonthlyHours = 6 * 26;
    
    if (ramadanHours > ramadanMonthlyHours) {
      // Any hours above 6/day are considered overtime
      const overtimeHours = ramadanHours - ramadanMonthlyHours;
      return this.calculateOvertimePay(employee, overtimeHours, basicSalary);
    }
    
    return 0;
  }
  
  /**
   * Calculate housing allowance (if applicable)
   */
  calculateHousingAllowance(employee, basicSalary) {
    // Housing allowance is typically 25-30% of basic salary for expats
    if (employee.nationality !== 'SAUDI' && employee.housingAllowanceEligible) {
      const rate = employee.housingAllowanceRate || 25; // 25% default
      return this.calculatePercentage(basicSalary, rate);
    }
    
    return 0;
  }
  
  /**
   * Capability overrides
   */
  
  supportsSocialSecurity() {
    return true;
  }
  
  supportsPension() {
    return true; // Part of GOSI
  }
  
  supportsGratuity() {
    return true;
  }
  
  supportsAirTicket() {
    return true;
  }
  
  supportsOvertime() {
    return true;
  }
  
  supportsWPS() {
    return true;
  }
  
  isNationalityRequired() {
    return true; // GOSI rates depend on nationality
  }
  
  isEmployeeTypeRequired() {
    return true;
  }
  
  /**
   * Get Saudi labor law parameters
   */
  getLaborLawParameters() {
    return {
      standardWorkingHours: {
        dailyHours: 8,
        weeklyHours: 48,
        workingDaysPerWeek: 6
      },
      ramadanWorkingHours: {
        dailyHours: 6,
        weeklyHours: 36
      },
      overtimeRates: {
        regular: 1.5, // 150%
        holiday: 1.5  // 150%
      },
      gratuity: {
        first5Years: 0.5, // half month per year
        after5Years: 1.0  // full month per year
      },
      leave: {
        annualLeave: 21, // days per year (increases to 30 after 5 years)
        sickLeave: 120,  // days per year
        maternityLeave: 70, // days
        paternityLeave: 3   // days
      },
      probationPeriod: 3, // months
      minimumWage: 4000, // SAR for Saudi nationals
      noticePeriod: {
        employee: 60, // days
        employer: 60  // days
      }
    };
  }
  
  /**
   * Calculate final settlement for termination
   */
  calculateFinalSettlement(employee, basicSalary, totalServiceMonths, terminationType = 'RESIGNATION') {
    const settlement = {
      eosb: 0,
      noticePay: 0,
      leaveEncashment: 0,
      total: 0
    };
    
    // Calculate EOSB
    settlement.eosb = this.calculateEndOfServiceBenefits(employee, basicSalary, totalServiceMonths, terminationType);
    
    // Calculate notice pay (if not served)
    const noticeDays = this.getLaborLawParameters().noticePeriod.employee;
    settlement.noticePay = (basicSalary / 30) * noticeDays;
    
    // Calculate leave encashment (unused annual leave)
    const unusedLeaveDays = employee.unusedLeaveDays || 0;
    settlement.leaveEncashment = (basicSalary / 30) * unusedLeaveDays;
    
    settlement.total = settlement.eosb + settlement.noticePay + settlement.leaveEncashment;
    
    return {
      ...settlement,
      breakdown: {
        eosb: this.formatCurrency(settlement.eosb),
        noticePay: this.formatCurrency(settlement.noticePay),
        leaveEncashment: this.formatCurrency(settlement.leaveEncashment),
        total: this.formatCurrency(settlement.total)
      }
    };
  }
  
  /**
   * Calculate complete EOSB for termination
   */
  calculateEndOfServiceBenefits(employee, basicSalary, totalServiceMonths, terminationType) {
    const serviceYears = totalServiceMonths / 12;
    const allowances = employee.allowances || 0;
    const calculationBase = basicSalary + allowances;
    
    let totalEOSB = 0;
    
    // Calculate for first 5 years (half month per year)
    const first5Years = Math.min(serviceYears, 5);
    totalEOSB += first5Years * 0.5 * calculationBase;
    
    // Calculate for years after 5 (full month per year)
    if (serviceYears > 5) {
      const additionalYears = serviceYears - 5;
      totalEOSB += additionalYears * 1.0 * calculationBase;
    }
    
    // Apply termination type adjustments
    if (terminationType === 'TERMINATION_FOR_CAUSE') {
      return 0; // No EOSB for termination for cause
    }
    
    if (terminationType === 'RESIGNATION') {
      if (serviceYears < 2) {
        return 0; // No EOSB for resignation before 2 years
      } else if (serviceYears < 5) {
        totalEOSB = totalEOSB / 3; // One-third for resignation between 2-5 years
      } else if (serviceYears < 10) {
        totalEOSB = totalEOSB * 2 / 3; // Two-thirds for resignation between 5-10 years
      }
      // Full EOSB for resignation after 10 years
    }
    
    return totalEOSB;
  }
  
  /**
   * Check Nitaqat compliance
   */
  checkNitaqatCompliance(employee, companyData) {
    // Nitaqat is the Saudization program
    const warnings = [];
    
    if (employee.nationality === 'SAUDI') {
      // Saudi employee - positive for Nitaqat
      return {
        category: 'Green', // Assuming positive contribution
        compliance: true,
        warnings: []
      };
    } else {
      // Expatriate employee - check if visa is linked to Saudi employee
      if (!employee.sponsorSaudiEmployee) {
        warnings.push('Expatriate employee should be linked to Saudi sponsor for Nitaqat compliance');
      }
    }
    
    return {
      category: 'Yellow', // Default for expats
      compliance: warnings.length === 0,
      warnings
    };
  }
  
  /**
   * Get MUDAWALA WPS requirements
   */
  getWPSRequirements() {
    return {
      mandatory: true,
      system: 'MUDAWALA',
      salaryTransferDeadline: 7, // days from salary due date
      penaltyRange: { min: 2000, max: 50000 }, // SAR
      companyBlacklistRisk: true
    };
  }
}

module.exports = SaudiPayrollCalculator;

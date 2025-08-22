/**
 * UAE Payroll Calculator
 * 
 * Implements UAE-specific payroll calculations including:
 * - GPSSA (General Pension and Social Security Authority): 5% employee + 12.5% employer (UAE nationals only)
 * - End of Service Gratuity: 21 days (first 5 years) / 30 days (after 5 years)
 * - Air Ticket Allowance: Biennial entitlement
 * - Overtime: 125% of basic hourly rate
 * - WPS (Wage Protection System) support
 */

const BasePayrollCalculator = require('./BasePayrollCalculator');

class UAEPayrollCalculator extends BasePayrollCalculator {
  
  constructor() {
    super('UAE');
  }
  
  /**
   * Calculate gross salary
   */
  async calculateGrossSalary(employee, compensation, attendance) {
    return this.calculateGrossSalaryFromCompensation(compensation, attendance);
  }
  
  /**
   * Calculate statutory deductions for UAE
   */
  async calculateStatutoryDeductions(employee, grossSalary, basicSalary) {
    const calculations = {
      gpssa: this.calculateGPSSA(employee, grossSalary)
    };
    
    const totalEmployee = calculations.gpssa.employee;
    const totalEmployer = calculations.gpssa.employer;
    
    return {
      employee: this.formatCurrency(totalEmployee),
      employer: this.formatCurrency(totalEmployer),
      total: this.formatCurrency(totalEmployee + totalEmployer),
      breakdown: calculations
    };
  }
  
  /**
   * Calculate GPSSA (General Pension and Social Security Authority)
   * Only applicable to UAE nationals
   */
  calculateGPSSA(employee, grossSalary) {
    // GPSSA only applies to UAE nationals
    if (employee.nationality !== 'EMIRATI' && employee.employeeType !== 'LOCAL') {
      return {
        employee: 0,
        employer: 0,
        calculationBase: 0,
        rate: 'Not Applicable (Expatriate)',
        policy: 'GPSSA_EXEMPTION',
        note: 'GPSSA only applies to UAE nationals'
      };
    }
    
    const employeeRate = 5.0; // 5%
    const employerRate = 12.5; // 12.5%
    const maxSalary = 50000; // AED 50,000 ceiling
    
    const calculationBase = Math.min(grossSalary, maxSalary);
    const employeeAmount = this.calculatePercentage(calculationBase, employeeRate);
    const employerAmount = this.calculatePercentage(calculationBase, employerRate);
    
    return {
      employee: employeeAmount,
      employer: employerAmount,
      calculationBase,
      rate: '5% / 12.5%',
      policy: 'GPSSA_EMPLOYEE / GPSSA_EMPLOYER',
      maxSalary
    };
  }
  
  /**
   * Calculate End of Service Gratuity accrual
   */
  async calculateGratuityAccrual(employee, basicSalary, serviceMonths) {
    let dailyRate;
    
    // UAE gratuity calculation based on service period
    if (serviceMonths <= 60) { // First 5 years
      dailyRate = 21; // 21 days per year
    } else {
      dailyRate = 30; // 30 days per year after 5 years
    }
    
    // Calculate daily wage (30 days in a month)
    const dailyWage = basicSalary / 30;
    
    // Monthly accrual
    const monthlyAccrual = (dailyWage * dailyRate) / 12;
    
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
    
    // UAE standard working hours: 8 hours/day, 26 working days/month
    const monthlyHours = 8 * 26;
    const hourlyRate = basicSalary / monthlyHours;
    const overtimeRate = 1.25; // 125% of basic hourly rate
    
    const overtimePay = hourlyRate * overtimeRate * overtimeHours;
    return this.formatCurrency(overtimePay);
  }
  
  /**
   * Calculate night shift allowance (if applicable)
   */
  calculateNightShiftAllowance(employee, nightHours, basicSalary) {
    if (nightHours <= 0) return 0;
    
    const monthlyHours = 8 * 26;
    const hourlyRate = basicSalary / monthlyHours;
    const nightAllowanceRate = 0.25; // 25% additional for night shift
    
    const nightAllowance = hourlyRate * nightAllowanceRate * nightHours;
    return this.formatCurrency(nightAllowance);
  }
  
  /**
   * Calculate holiday pay
   */
  calculateHolidayPay(employee, holidayHours, basicSalary) {
    if (holidayHours <= 0) return 0;
    
    const monthlyHours = 8 * 26;
    const hourlyRate = basicSalary / monthlyHours;
    const holidayRate = 1.5; // 150% for holiday work
    
    const holidayPay = hourlyRate * holidayRate * holidayHours;
    return this.formatCurrency(holidayPay);
  }
  
  /**
   * Capability overrides
   */
  
  supportsSocialSecurity() {
    return true; // GPSSA for nationals
  }
  
  supportsPension() {
    return true; // Part of GPSSA
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
    return true; // GPSSA depends on nationality
  }
  
  isEmployeeTypeRequired() {
    return true;
  }
  
  /**
   * Get UAE labor law parameters
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
        regular: 1.25, // 125%
        night: 1.5,    // 150%
        holiday: 1.5   // 150%
      },
      gratuity: {
        first5Years: 21, // days per year
        after5Years: 30  // days per year
      },
      leave: {
        annualLeave: 30, // days per year
        sickLeave: 90,   // days per year
        maternityLeave: 45 // days
      },
      probationPeriod: 6, // months
      noticePeriod: {
        limitedContract: 30, // days
        unlimitedContract: 90 // days
      }
    };
  }
  
  /**
   * Calculate end of service gratuity for termination
   */
  calculateEndOfServiceGratuity(employee, basicSalary, totalServiceMonths, terminationType = 'RESIGNATION') {
    const serviceYears = totalServiceMonths / 12;
    const dailyWage = basicSalary / 30;
    
    let totalGratuity = 0;
    
    // Calculate for first 5 years
    const first5Years = Math.min(serviceYears, 5);
    totalGratuity += first5Years * 21 * dailyWage;
    
    // Calculate for years after 5
    if (serviceYears > 5) {
      const additionalYears = serviceYears - 5;
      totalGratuity += additionalYears * 30 * dailyWage;
    }
    
    // Apply termination type adjustments
    if (terminationType === 'RESIGNATION' && serviceYears < 1) {
      return 0; // No gratuity for resignation before 1 year
    }
    
    if (terminationType === 'RESIGNATION' && serviceYears < 5) {
      totalGratuity = totalGratuity / 3; // One-third for resignation before 5 years
    }
    
    if (terminationType === 'TERMINATION_FOR_CAUSE') {
      return 0; // No gratuity for termination for cause
    }
    
    return this.formatCurrency(totalGratuity);
  }
  
  /**
   * Check visa and labor compliance
   */
  checkVisaCompliance(employee) {
    const warnings = [];
    
    if (!employee.laborCardNumber) {
      warnings.push('Labor card number missing');
    }
    
    if (!employee.workPermitNumber) {
      warnings.push('Work permit number missing');
    }
    
    // Add more compliance checks as needed
    
    return {
      isCompliant: warnings.length === 0,
      warnings
    };
  }
  
  /**
   * Get WPS requirements
   */
  getWPSRequirements() {
    return {
      mandatory: true,
      salaryTransferDeadline: 7, // days
      penaltyPerViolation: 5000, // AED
      requiredBanks: [
        'ADCB', 'ENBD', 'FAB', 'NBAD', 'CBD', 'HSBC', 'SCB'
      ]
    };
  }
}

module.exports = UAEPayrollCalculator;

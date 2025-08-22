/**
 * Indian Payroll Calculator
 * 
 * Implements comprehensive Indian statutory calculations including:
 * - PF (Provident Fund): 12% employee + 12% employer
 * - ESI (Employee State Insurance): 0.75% employee + 3.25% employer
 * - EPS (Employee Pension Scheme): 8.33% employer
 * - EDLI (Employee Deposit Linked Insurance): 0.5% employer
 * - Professional Tax: Slab-based calculation
 * - Gratuity: 15 days salary per year (after 5 years)
 */

const BasePayrollCalculator = require('./BasePayrollCalculator');

class IndianPayrollCalculator extends BasePayrollCalculator {
  
  constructor() {
    super('IND');
  }
  
  /**
   * Calculate gross salary
   */
  async calculateGrossSalary(employee, compensation, attendance) {
    return this.calculateGrossSalaryFromCompensation(compensation, attendance);
  }
  
  /**
   * Calculate all statutory deductions for India
   */
  async calculateStatutoryDeductions(employee, grossSalary, basicSalary) {
    const calculations = {
      pf: this.calculatePF(basicSalary),
      esi: this.calculateESI(grossSalary),
      eps: this.calculateEPS(basicSalary),
      edli: this.calculateEDLI(basicSalary),
      professionalTax: this.calculateProfessionalTax(grossSalary)
    };
    
    const totalEmployee = calculations.pf.employee + calculations.esi.employee + calculations.professionalTax.amount;
    const totalEmployer = calculations.pf.employer + calculations.esi.employer + calculations.eps.amount + calculations.edli.amount;
    
    return {
      employee: this.formatCurrency(totalEmployee),
      employer: this.formatCurrency(totalEmployer),
      total: this.formatCurrency(totalEmployee + totalEmployer),
      breakdown: calculations
    };
  }
  
  /**
   * Calculate PF (Provident Fund)
   */
  calculatePF(basicSalary) {
    const pfWage = Math.min(basicSalary, 15000); // PF ceiling
    const employeeRate = 12; // 12%
    const employerRate = 12; // 12%
    
    const employeeAmount = this.calculatePercentage(pfWage, employeeRate);
    const employerAmount = this.calculatePercentage(pfWage, employerRate);
    
    return {
      employee: employeeAmount,
      employer: employerAmount,
      calculationBase: pfWage,
      rate: '12% / 12%',
      policy: 'PF_EMPLOYEE / PF_EMPLOYER'
    };
  }
  
  /**
   * Calculate ESI (Employee State Insurance)
   */
  calculateESI(grossSalary) {
    // ESI is applicable only if gross salary <= 21,000
    if (grossSalary > 21000) {
      return {
        employee: 0,
        employer: 0,
        calculationBase: 0,
        rate: 'Not Applicable (Salary > ₹21,000)',
        policy: 'ESI_EXEMPTION'
      };
    }
    
    const employeeRate = 0.75; // 0.75%
    const employerRate = 3.25; // 3.25%
    
    const employeeAmount = this.calculatePercentage(grossSalary, employeeRate);
    const employerAmount = this.calculatePercentage(grossSalary, employerRate);
    
    return {
      employee: employeeAmount,
      employer: employerAmount,
      calculationBase: grossSalary,
      rate: '0.75% / 3.25%',
      policy: 'ESI_EMPLOYEE / ESI_EMPLOYER'
    };
  }
  
  /**
   * Calculate EPS (Employee Pension Scheme)
   */
  calculateEPS(basicSalary) {
    const epsWage = Math.min(basicSalary, 15000); // EPS ceiling same as PF
    const rate = 8.33; // 8.33% employer contribution
    
    const amount = this.calculatePercentage(epsWage, rate);
    
    return {
      amount,
      calculationBase: epsWage,
      rate: '8.33%',
      policy: 'EPS_EMPLOYER'
    };
  }
  
  /**
   * Calculate EDLI (Employee Deposit Linked Insurance)
   */
  calculateEDLI(basicSalary) {
    const edliWage = Math.min(basicSalary, 15000); // EDLI ceiling same as PF
    const rate = 0.5; // 0.5% employer contribution
    
    const amount = this.calculatePercentage(edliWage, rate);
    
    return {
      amount,
      calculationBase: edliWage,
      rate: '0.5%',
      policy: 'EDLI_EMPLOYER'
    };
  }
  
  /**
   * Calculate Professional Tax (Maharashtra slab)
   */
  calculateProfessionalTax(grossSalary) {
    let amount = 0;
    let slab = '';
    
    if (grossSalary <= 10000) {
      amount = 0;
      slab = 'Exempted';
    } else if (grossSalary <= 15000) {
      amount = 110;
      slab = 'Slab 1';
    } else if (grossSalary <= 20000) {
      amount = 130;
      slab = 'Slab 2';
    } else {
      amount = 200;
      slab = 'Slab 3';
    }
    
    return {
      amount,
      calculationBase: grossSalary,
      slab,
      policy: 'PROFESSIONAL_TAX'
    };
  }
  
  /**
   * Calculate gratuity accrual
   */
  async calculateGratuityAccrual(employee, basicSalary, serviceMonths) {
    // Gratuity is applicable after 5 years of service
    if (serviceMonths < 60) {
      return 0;
    }
    
    // 15 days salary for each year of service
    const dailyWage = basicSalary / 26; // 26 working days in a month
    const annualGratuity = dailyWage * 15; // 15 days per year
    const monthlyAccrual = annualGratuity / 12;
    
    return this.formatCurrency(monthlyAccrual);
  }
  
  /**
   * Calculate air ticket accrual (not applicable for India in standard cases)
   */
  async calculateAirTicketAccrual(employee) {
    return 0; // Air ticket allowance is not standard in India
  }
  
  /**
   * Calculate overtime pay
   */
  async calculateOvertimePay(employee, overtimeHours, basicSalary) {
    if (overtimeHours <= 0) return 0;
    
    const monthlyHours = 8 * 26; // 8 hours * 26 working days
    const hourlyRate = basicSalary / monthlyHours;
    const overtimeRate = 2.0; // 200% of basic hourly rate as per Indian labor law
    
    const overtimePay = hourlyRate * overtimeRate * overtimeHours;
    return this.formatCurrency(overtimePay);
  }
  
  /**
   * Capability overrides
   */
  
  supportsSocialSecurity() {
    return true;
  }
  
  supportsPension() {
    return true; // EPS
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
    return false; // All employees get same treatment
  }
  
  isEmployeeTypeRequired() {
    return false;
  }
  
  /**
   * Get Indian tax slabs (for future income tax calculation)
   */
  getTaxSlabs(financialYear = '2024-25') {
    return [
      { min: 0, max: 250000, rate: 0 },
      { min: 250000, max: 500000, rate: 5 },
      { min: 500000, max: 750000, rate: 10 },
      { min: 750000, max: 1000000, rate: 15 },
      { min: 1000000, max: 1250000, rate: 20 },
      { min: 1250000, max: 1500000, rate: 25 },
      { min: 1500000, max: Infinity, rate: 30 }
    ];
  }
  
  /**
   * Calculate annual tax liability (for reference)
   */
  calculateAnnualTax(annualIncome, deductions = {}) {
    const standardDeduction = 50000;
    const basicExemption = 250000;
    
    const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + val, 0);
    const taxableIncome = Math.max(0, annualIncome - standardDeduction - totalDeductions - basicExemption);
    
    const slabs = this.getTaxSlabs();
    let tax = 0;
    
    for (const slab of slabs) {
      if (taxableIncome > slab.min) {
        const taxableAtThisSlab = Math.min(taxableIncome, slab.max) - slab.min;
        tax += (taxableAtThisSlab * slab.rate) / 100;
      }
    }
    
    // Add cess (4% on tax)
    const educationCess = tax * 0.04;
    
    return {
      taxableIncome,
      baseTax: tax,
      educationCess,
      totalTax: tax + educationCess
    };
  }
  
  /**
   * Get contribution limits for current year
   */
  getContributionLimits() {
    return {
      pf: {
        maxWage: 15000,
        employeeRate: 12,
        employerRate: 12
      },
      esi: {
        maxWage: 21000,
        employeeRate: 0.75,
        employerRate: 3.25
      },
      eps: {
        maxWage: 15000,
        employerRate: 8.33
      },
      edli: {
        maxWage: 15000,
        employerRate: 0.5
      },
      gratuity: {
        daysPerYear: 15,
        minimumService: 60 // months
      }
    };
  }
}

module.exports = IndianPayrollCalculator;

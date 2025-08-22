/**
 * Payroll Calculator Factory
 * 
 * Factory class for creating country-specific payroll calculators
 * with comprehensive statutory calculation support.
 */

const IndianPayrollCalculator = require('./calculators/IndianPayrollCalculator');
const UAEPayrollCalculator = require('./calculators/UAEPayrollCalculator');
const SaudiPayrollCalculator = require('./calculators/SaudiPayrollCalculator');
const OmanPayrollCalculator = require('./calculators/OmanPayrollCalculator');
const BahrainPayrollCalculator = require('./calculators/BahrainPayrollCalculator');
const QatarPayrollCalculator = require('./calculators/QatarPayrollCalculator');
const EgyptPayrollCalculator = require('./calculators/EgyptPayrollCalculator');

class PayrollCalculatorFactory {
  
  /**
   * Get calculator instance for specific country
   */
  static getCalculator(countryCode) {
    switch (countryCode?.toUpperCase()) {
      case 'IND':
        return new IndianPayrollCalculator();
      case 'UAE':
        return new UAEPayrollCalculator();
      case 'SAU':
        return new SaudiPayrollCalculator();
      case 'OMN':
        return new OmanPayrollCalculator();
      case 'BHR':
        return new BahrainPayrollCalculator();
      case 'QAT':
        return new QatarPayrollCalculator();
      case 'EGY':
        return new EgyptPayrollCalculator();
      default:
        throw new Error(`Unsupported country code: ${countryCode}`);
    }
  }
  
  /**
   * Get list of supported countries
   */
  static getSupportedCountries() {
    return [
      { code: 'IND', name: 'India', currency: 'INR' },
      { code: 'UAE', name: 'United Arab Emirates', currency: 'AED' },
      { code: 'SAU', name: 'Saudi Arabia', currency: 'SAR' },
      { code: 'OMN', name: 'Oman', currency: 'OMR' },
      { code: 'BHR', name: 'Bahrain', currency: 'BHD' },
      { code: 'QAT', name: 'Qatar', currency: 'QAR' },
      { code: 'EGY', name: 'Egypt', currency: 'EGP' }
    ];
  }
  
  /**
   * Validate if country is supported
   */
  static isCountrySupported(countryCode) {
    const supportedCodes = this.getSupportedCountries().map(c => c.code);
    return supportedCodes.includes(countryCode?.toUpperCase());
  }
  
  /**
   * Get calculator capabilities for a country
   */
  static getCalculatorCapabilities(countryCode) {
    if (!this.isCountrySupported(countryCode)) {
      throw new Error(`Unsupported country code: ${countryCode}`);
    }
    
    const calculator = this.getCalculator(countryCode);
    
    return {
      countryCode,
      supportsSocialSecurity: calculator.supportsSocialSecurity(),
      supportsPension: calculator.supportsPension(),
      supportsGratuity: calculator.supportsGratuity(),
      supportsAirTicket: calculator.supportsAirTicket(),
      supportsOvertime: calculator.supportsOvertime(),
      supportsWPS: calculator.supportsWPS(),
      nationalityRequired: calculator.isNationalityRequired(),
      employeeTypeRequired: calculator.isEmployeeTypeRequired()
    };
  }
  
  /**
   * Get all calculators with their capabilities
   */
  static getAllCalculatorCapabilities() {
    const countries = this.getSupportedCountries();
    
    return countries.map(country => ({
      ...country,
      capabilities: this.getCalculatorCapabilities(country.code)
    }));
  }
  
  /**
   * Test calculator functionality
   */
  static async testCalculator(countryCode, testData) {
    try {
      const calculator = this.getCalculator(countryCode);
      await calculator.initialize();
      
      const testEmployee = {
        nationality: testData.nationality || 'EXPATRIATE',
        employeeType: testData.employeeType || 'EXPATRIATE',
        ...testData.employee
      };
      
      const grossSalary = testData.grossSalary || 5000;
      const basicSalary = testData.basicSalary || 3000;
      
      const results = {
        countryCode,
        testData,
        calculations: {}
      };
      
      // Test statutory deductions
      try {
        results.calculations.statutoryDeductions = await calculator.calculateStatutoryDeductions(
          testEmployee, 
          grossSalary, 
          basicSalary
        );
      } catch (error) {
        results.calculations.statutoryDeductions = { error: error.message };
      }
      
      // Test gratuity accrual
      try {
        results.calculations.gratuityAccrual = await calculator.calculateGratuityAccrual(
          testEmployee, 
          basicSalary, 
          testData.serviceMonths || 12
        );
      } catch (error) {
        results.calculations.gratuityAccrual = { error: error.message };
      }
      
      // Test air ticket accrual
      try {
        results.calculations.airTicketAccrual = await calculator.calculateAirTicketAccrual(testEmployee);
      } catch (error) {
        results.calculations.airTicketAccrual = { error: error.message };
      }
      
      // Test overtime calculation
      try {
        results.calculations.overtimePay = await calculator.calculateOvertimePay(
          testEmployee, 
          testData.overtimeHours || 10, 
          basicSalary
        );
      } catch (error) {
        results.calculations.overtimePay = { error: error.message };
      }
      
      return results;
      
    } catch (error) {
      return {
        countryCode,
        testData,
        error: error.message
      };
    }
  }
  
  /**
   * Compare calculations across countries
   */
  static async compareCalculations(employeeData, compensationData) {
    const countries = this.getSupportedCountries();
    const comparisons = {};
    
    for (const country of countries) {
      try {
        const calculator = this.getCalculator(country.code);
        await calculator.initialize();
        
        // Calculate for this country
        const grossSalary = compensationData
          .filter(c => c.componentType === 'EARNING' && !c.isPercentage)
          .reduce((sum, c) => sum + (c.amount || 0), 0);
          
        const basicSalary = compensationData
          .find(c => c.componentCode === 'BASIC')?.amount || (grossSalary * 0.5);
        
        const testEmployee = {
          ...employeeData,
          nationality: this.getDefaultNationality(country.code, employeeData.employeeType)
        };
        
        const statutoryDeductions = await calculator.calculateStatutoryDeductions(
          testEmployee, 
          grossSalary, 
          basicSalary
        );
        
        const serviceMonths = this.calculateServiceMonths(employeeData.joiningDate || new Date());
        const gratuityAccrual = await calculator.calculateGratuityAccrual(
          testEmployee, 
          basicSalary, 
          serviceMonths
        );
        
        const airTicketAccrual = await calculator.calculateAirTicketAccrual(testEmployee);
        
        const netSalary = grossSalary - statutoryDeductions.employee;
        const totalEmployerCost = grossSalary + statutoryDeductions.employer + gratuityAccrual + airTicketAccrual;
        
        comparisons[country.code] = {
          country: country.name,
          currency: country.currency,
          grossSalary,
          netSalary,
          employeeDeductions: statutoryDeductions.employee,
          employerContributions: statutoryDeductions.employer,
          gratuityAccrual,
          airTicketAccrual,
          totalEmployerCost,
          annualCTC: totalEmployerCost * 12,
          calculations: {
            statutory: statutoryDeductions,
            gratuity: gratuityAccrual,
            airTicket: airTicketAccrual
          }
        };
        
      } catch (error) {
        comparisons[country.code] = {
          country: country.name,
          currency: country.currency,
          error: error.message
        };
      }
    }
    
    return comparisons;
  }
  
  /**
   * Helper methods
   */
  
  static getDefaultNationality(countryCode, employeeType) {
    if (employeeType === 'LOCAL') {
      const nationalityMap = {
        'IND': 'INDIAN',
        'UAE': 'EMIRATI',
        'SAU': 'SAUDI',
        'OMN': 'OMANI',
        'BHR': 'BAHRAINI',
        'QAT': 'QATARI',
        'EGY': 'EGYPTIAN'
      };
      return nationalityMap[countryCode] || 'LOCAL';
    }
    return 'EXPATRIATE';
  }
  
  static calculateServiceMonths(joiningDate) {
    const joining = new Date(joiningDate);
    const now = new Date();
    const diffTime = Math.abs(now - joining);
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
    return diffMonths;
  }
}

module.exports = PayrollCalculatorFactory;

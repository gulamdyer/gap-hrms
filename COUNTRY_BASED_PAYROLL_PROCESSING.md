# Country-Based Payroll Processing Implementation

## Overview
This document details how the payroll processing system filters and processes employees based on their assigned country, ensuring that only employees from the selected country are processed with their country-specific rules.

## Backend Implementation

### 1. Enhanced Payroll Controller with Country Filtering

```javascript
// backend/controllers/payrollController.js - Enhanced Version

// @desc    Process payroll by country
// @route   POST /api/payroll/process-by-country
// @access  Private (ADMIN, HR)
const processPayrollByCountry = async (req, res) => {
  try {
    console.log('🌍 processPayrollByCountry called with body:', req.body);
    const { periodId, countryCode, employeeIds = null } = req.body;
    const createdBy = req.user.userId;

    // Validate required fields
    if (!periodId || !countryCode) {
      return res.status(400).json({
        success: false,
        message: 'Period ID and Country Code are required'
      });
    }

    // Validate country code
    const supportedCountries = ['IND', 'UAE', 'SAU', 'OMN', 'BHR', 'QAT', 'EGY'];
    if (!supportedCountries.includes(countryCode)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported country code: ${countryCode}`
      });
    }

    console.log(`🎯 Processing payroll for country: ${countryCode}`);

    // Get period details
    const period = await Payroll.getPayrollPeriodById(periodId);
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Payroll period not found'
      });
    }

    if (period.STATUS !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Payroll period is not in DRAFT status'
      });
    }

    // Get employees filtered by country
    console.log('🔍 Getting employees for country:', countryCode);
    const employees = await getEmployeesByCountry(countryCode, employeeIds);
    
    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No active employees found for country: ${countryCode}`
      });
    }

    console.log(`📊 Found ${employees.length} employees for ${countryCode}`);

    // Create country-specific payroll run
    const runData = {
      periodId,
      runName: `${countryCode} Payroll Run - ${period.PERIOD_NAME}`,
      runType: employeeIds ? 'PARTIAL' : 'FULL',
      status: 'IN_PROGRESS',
      countryCode: countryCode
    };

    const runId = await Payroll.createPayrollRun(runData, createdBy);
    console.log('📊 Created country-specific run with ID:', runId);

    // Get country-specific calculator
    const PayrollCalculatorFactory = require('../services/PayrollCalculatorFactory');
    const calculator = PayrollCalculatorFactory.getCalculator(countryCode);
    await calculator.initialize();

    const results = {
      countryCode,
      totalEmployees: employees.length,
      processedEmployees: 0,
      failedEmployees: 0,
      errors: [],
      periodId,
      runId,
      countrySpecificData: {
        currency: await getCurrencyInfo(countryCode),
        totalSocialSecurity: 0,
        totalGratuityAccrual: 0,
        totalAirTicketAccrual: 0
      }
    };

    // Process each employee with country-specific rules
    for (const employee of employees) {
      try {
        console.log(`💼 Processing employee: ${employee.EMPLOYEE_CODE} (${countryCode})`);
        
        const payrollResult = await calculateEmployeePayrollByCountry(
          employee.EMPLOYEE_ID, 
          periodId, 
          runId, 
          countryCode,
          calculator,
          createdBy
        );

        // Accumulate country-specific totals
        results.countrySpecificData.totalSocialSecurity += payrollResult.socialSecurity || 0;
        results.countrySpecificData.totalGratuityAccrual += payrollResult.gratuityAccrual || 0;
        results.countrySpecificData.totalAirTicketAccrual += payrollResult.airTicketAccrual || 0;

        results.processedEmployees++;
        console.log(`✅ Successfully processed: ${employee.EMPLOYEE_CODE}`);
        
      } catch (error) {
        console.error(`❌ Error processing employee ${employee.EMPLOYEE_CODE}:`, error);
        results.failedEmployees++;
        results.errors.push({
          employeeId: employee.EMPLOYEE_ID,
          employeeCode: employee.EMPLOYEE_CODE,
          employeeName: `${employee.FIRST_NAME} ${employee.LAST_NAME}`,
          error: error.message
        });
      }
    }

    // Update run status
    const runStatus = results.failedEmployees === 0 ? 'COMPLETED' : 'COMPLETED_WITH_ERRORS';
    await Payroll.updatePayrollRunStatus(runId, runStatus, null, results.errors.length > 0 ? JSON.stringify(results.errors) : null);

    // Generate country-specific summary
    const countrySummary = await generateCountryPayrollSummary(periodId, countryCode, runId);

    res.status(200).json({
      success: true,
      message: `${countryCode} payroll processing completed`,
      data: {
        ...results,
        countrySummary
      }
    });

  } catch (error) {
    console.error('Error processing country payroll:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process country payroll',
      error: error.message
    });
  }
};

// Helper function to get employees by country
async function getEmployeesByCountry(countryCode, specificEmployeeIds = null) {
  let sql = `
    SELECT 
      e.EMPLOYEE_ID,
      e.EMPLOYEE_CODE,
      e.FIRST_NAME,
      e.LAST_NAME,
      e.PAYROLL_COUNTRY,
      e.JOINING_DATE,
      e.BASIC_SALARY,
      e.AIR_TICKET_ELIGIBLE,
      e.ESTIMATED_TICKET_COST,
      e.TICKET_SEGMENT,
      e.NATIONALITY,
      d.DESIGNATION_NAME,
      dept.DEPARTMENT_NAME
    FROM HRMS_EMPLOYEES e
    LEFT JOIN HRMS_DESIGNATIONS d ON e.DESIGNATION_ID = d.DESIGNATION_ID
    LEFT JOIN HRMS_DEPARTMENTS dept ON e.DEPARTMENT_ID = dept.DEPARTMENT_ID
    WHERE e.STATUS = 'ACTIVE' 
      AND e.PAYROLL_COUNTRY = :countryCode
  `;

  const params = { countryCode };

  // Filter by specific employee IDs if provided
  if (specificEmployeeIds && specificEmployeeIds.length > 0) {
    const placeholders = specificEmployeeIds.map((_, index) => `:empId${index}`).join(',');
    sql += ` AND e.EMPLOYEE_ID IN (${placeholders})`;
    
    specificEmployeeIds.forEach((empId, index) => {
      params[`empId${index}`] = empId;
    });
  }

  sql += ` ORDER BY e.EMPLOYEE_CODE`;

  console.log('🔍 Employee query SQL:', sql);
  console.log('🔍 Query params:', params);

  const result = await executeQuery(sql, params);
  return result.rows || [];
}

// Helper function to calculate employee payroll by country
async function calculateEmployeePayrollByCountry(employeeId, periodId, runId, countryCode, calculator, createdBy) {
  console.log(`🧮 Calculating payroll for employee ${employeeId} in ${countryCode}`);

  // Get employee details
  const employee = await Employee.getById(employeeId);
  
  // Get employee compensation
  const compensation = await EmployeeCompensation.getActiveCompensation(employeeId);
  
  // Get attendance summary for the period
  const period = await Payroll.getPayrollPeriodById(periodId);
  const attendance = await Payroll.getEmployeeAttendance(employeeId, period.START_DATE, period.END_DATE);

  // Calculate using country-specific calculator
  const grossSalary = await calculator.calculateGrossSalary(employee, compensation, attendance);
  const socialSecurity = await calculator.calculateSocialSecurity(employee, grossSalary);
  const overtimePay = await calculator.calculateOvertimePay(employee, attendance.OVERTIME_HOURS || 0, employee.BASIC_SALARY);
  
  // Calculate country-specific accruals
  const serviceMonths = calculateServiceMonths(employee.JOINING_DATE);
  const gratuityAccrual = await calculator.calculateGratuityAccrual(employee, employee.BASIC_SALARY, serviceMonths);
  const airTicketAccrual = await calculator.calculateAirTicketAccrual(employee);

  // Calculate net salary
  const totalEarnings = grossSalary + overtimePay;
  const totalDeductions = socialSecurity.employee;
  const netSalary = totalEarnings - totalDeductions;

  // Create payroll detail record
  const payrollData = {
    periodId,
    employeeId,
    runId,
    basicSalary: employee.BASIC_SALARY,
    grossSalary: totalEarnings,
    netSalary,
    totalEarnings,
    totalDeductions,
    overtimeAmount: overtimePay,
    payrollCountry: countryCode,
    socialSecurityEmployee: socialSecurity.employee,
    socialSecurityEmployer: socialSecurity.employer,
    gratuityAccrual,
    airTicketAccrual,
    overtimeRate: await getOvertimeRate(countryCode),
    workDays: attendance.PAYABLE_DAYS || 30,
    presentDays: attendance.PRESENT_DAYS || 30
  };

  const payrollId = await Payroll.createPayrollDetail(payrollData, createdBy);

  // Create country-specific statutory deductions record
  if (socialSecurity.total > 0) {
    await createStatutoryDeductionRecord({
      employeeId,
      payrollPeriodId: periodId,
      countryCode,
      deductionType: 'SOCIAL_SECURITY',
      deductionName: getDeductionName(countryCode),
      calculationBase: grossSalary,
      employeeAmount: socialSecurity.employee,
      employerAmount: socialSecurity.employer,
      totalAmount: socialSecurity.total
    });
  }

  // Create gratuity accrual record
  if (gratuityAccrual > 0) {
    await createGratuityAccrualRecord({
      employeeId,
      accrualYear: new Date().getFullYear(),
      accrualMonth: new Date().getMonth() + 1,
      serviceYears: Math.floor(serviceMonths / 12),
      serviceMonths: serviceMonths % 12,
      monthlyAccrualAmount: gratuityAccrual,
      totalAccruedAmount: gratuityAccrual, // This would be cumulative in real implementation
      calculationBaseSalary: employee.BASIC_SALARY,
      gratuityRateDays: getGratuityRate(countryCode, serviceMonths),
      countryCode
    });
  }

  // Create air ticket accrual record
  if (airTicketAccrual > 0) {
    await createAirTicketAccrualRecord({
      employeeId,
      accrualYear: new Date().getFullYear(),
      accrualMonth: new Date().getMonth() + 1,
      monthlyAccrualAmount: airTicketAccrual,
      totalAccruedAmount: airTicketAccrual, // This would be cumulative in real implementation
      ticketSegment: employee.TICKET_SEGMENT || 'HOME_COUNTRY',
      estimatedTicketCost: employee.ESTIMATED_TICKET_COST
    });
  }

  return {
    payrollId,
    grossSalary: totalEarnings,
    netSalary,
    socialSecurity: socialSecurity.total,
    gratuityAccrual,
    airTicketAccrual,
    overtimePay
  };
}

// Helper function to get currency info
async function getCurrencyInfo(countryCode) {
  const currencyMap = {
    'IND': { code: 'INR', symbol: '₹' },
    'UAE': { code: 'AED', symbol: 'د.إ' },
    'SAU': { code: 'SAR', symbol: 'ر.س' },
    'OMN': { code: 'OMR', symbol: 'ر.ع.' },
    'BHR': { code: 'BHD', symbol: 'د.ب' },
    'QAT': { code: 'QAR', symbol: 'ر.ق' },
    'EGY': { code: 'EGP', symbol: '£' }
  };
  return currencyMap[countryCode] || currencyMap['IND'];
}

// Helper function to get deduction name by country
function getDeductionName(countryCode) {
  const deductionNames = {
    'IND': 'PF + ESI + Professional Tax',
    'UAE': 'None',
    'SAU': 'GOSI',
    'OMN': 'PASI + Job Security Fund',
    'BHR': 'GOSI (Bahraini Nationals)',
    'QAT': 'Social Security (Qatari Nationals)',
    'EGY': 'Social Insurance'
  };
  return deductionNames[countryCode] || 'Social Security';
}

// Helper function to get overtime rate by country
async function getOvertimeRate(countryCode) {
  const overtimeRates = {
    'IND': 2.0,   // 200%
    'UAE': 1.25,  // 125%
    'SAU': 1.5,   // 150%
    'OMN': 1.25,  // 125% (daytime)
    'BHR': 1.25,  // 125%
    'QAT': 1.25,  // 125%
    'EGY': 1.35   // 135% (daytime)
  };
  return overtimeRates[countryCode] || 1.5;
}

// Helper function to get gratuity rate
function getGratuityRate(countryCode, serviceMonths) {
  switch (countryCode) {
    case 'UAE':
      return serviceMonths <= 60 ? 21 : 30; // days per year
    case 'SAU':
      return serviceMonths <= 60 ? 15 : 30; // days per year (half month / full month)
    case 'OMN':
      return 30; // 1 month per year
    case 'BHR':
      if (serviceMonths < 36) return 0;
      return serviceMonths <= 60 ? 15 : 30; // days per year
    case 'QAT':
      return 21; // 3 weeks per year
    case 'EGY':
      return 30; // 1 month per year
    default:
      return 15; // default
  }
}

module.exports = {
  processPayrollByCountry,
  getEmployeesByCountry,
  calculateEmployeePayrollByCountry
};
```

### 2. Enhanced Frontend - Country Selection in Payroll Processing

```jsx
// frontend/src/pages/CountryPayrollProcessing.jsx
import React, { useState, useEffect } from 'react';
import { GlobeAltIcon, UsersIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { payrollAPI } from '../services/api';
import CountrySelector from '../components/CountrySelector';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const CountryPayrollProcessing = () => {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [periods, setPeriods] = useState([]);
  const [countryEmployees, setCountryEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // Country information with employee counts
  const [countryStats, setCountryStats] = useState({});

  const countries = [
    { code: 'IND', name: 'India', currency: 'INR', flag: '🇮🇳' },
    { code: 'UAE', name: 'United Arab Emirates', currency: 'AED', flag: '🇦🇪' },
    { code: 'SAU', name: 'Saudi Arabia', currency: 'SAR', flag: '🇸🇦' },
    { code: 'OMN', name: 'Oman', currency: 'OMR', flag: '🇴🇲' },
    { code: 'BHR', name: 'Bahrain', currency: 'BHD', flag: '🇧🇭' },
    { code: 'QAT', name: 'Qatar', currency: 'QAR', flag: '🇶🇦' },
    { code: 'EGY', name: 'Egypt', currency: 'EGP', flag: '🇪🇬' }
  ];

  // Load periods on mount
  useEffect(() => {
    loadPayrollPeriods();
    loadCountryStats();
  }, []);

  // Load employees when country is selected
  useEffect(() => {
    if (selectedCountry) {
      loadCountryEmployees();
    }
  }, [selectedCountry]);

  const loadPayrollPeriods = async () => {
    try {
      const response = await payrollAPI.getPeriods();
      setPeriods(response.data?.filter(p => p.STATUS === 'DRAFT') || []);
    } catch (error) {
      console.error('Error loading periods:', error);
      toast.error('Failed to load payroll periods');
    }
  };

  const loadCountryStats = async () => {
    try {
      setLoading(true);
      const stats = {};
      
      for (const country of countries) {
        try {
          const response = await payrollAPI.getEmployeesByCountry(country.code);
          stats[country.code] = {
            totalEmployees: response.data?.length || 0,
            employees: response.data || []
          };
        } catch (error) {
          console.error(`Error loading stats for ${country.code}:`, error);
          stats[country.code] = { totalEmployees: 0, employees: [] };
        }
      }
      
      setCountryStats(stats);
    } catch (error) {
      console.error('Error loading country stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCountryEmployees = async () => {
    if (!selectedCountry) return;
    
    try {
      setLoading(true);
      const response = await payrollAPI.getEmployeesByCountry(selectedCountry);
      setCountryEmployees(response.data || []);
      setSelectedEmployees([]); // Reset selection
    } catch (error) {
      console.error('Error loading country employees:', error);
      toast.error('Failed to load employees for selected country');
      setCountryEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (countryCode) => {
    setSelectedCountry(countryCode);
    setResults(null); // Clear previous results
  };

  const handleEmployeeSelection = (employeeId) => {
    setSelectedEmployees(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const selectAllEmployees = () => {
    if (selectedEmployees.length === countryEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(countryEmployees.map(emp => emp.EMPLOYEE_ID));
    }
  };

  const processCountryPayroll = async () => {
    if (!selectedCountry || !selectedPeriod) {
      toast.error('Please select country and period');
      return;
    }

    if (selectedEmployees.length === 0 && countryEmployees.length > 0) {
      toast.error('Please select at least one employee or process all');
      return;
    }

    try {
      setProcessing(true);
      
      const payload = {
        periodId: selectedPeriod,
        countryCode: selectedCountry,
        employeeIds: selectedEmployees.length > 0 ? selectedEmployees : null
      };

      console.log('🚀 Processing payroll with payload:', payload);
      
      const response = await payrollAPI.processPayrollByCountry(payload);
      
      setResults(response.data);
      toast.success(`${selectedCountry} payroll processed successfully!`);
      
      // Refresh employee list
      await loadCountryEmployees();
      
    } catch (error) {
      console.error('Error processing payroll:', error);
      toast.error(error.response?.data?.message || 'Failed to process payroll');
    } finally {
      setProcessing(false);
    }
  };

  const getSelectedCountryInfo = () => {
    return countries.find(c => c.code === selectedCountry);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <GlobeAltIcon className="h-8 w-8 mr-3 text-blue-600" />
          Multi-Country Payroll Processing
        </h1>
        <p className="text-gray-600 mt-2">
          Process payroll for employees by country with country-specific calculations
        </p>
      </div>

      {/* Country Statistics Overview */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Employee Distribution by Country</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {countries.map(country => (
            <div 
              key={country.code}
              className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all duration-200 ${
                selectedCountry === country.code 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => handleCountryChange(country.code)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{country.flag}</span>
                <UsersIcon className="h-5 w-5 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 text-sm">{country.name}</h3>
              <p className="text-xs text-gray-500 mb-1">{country.currency}</p>
              <p className="text-lg font-bold text-blue-600">
                {loading ? '...' : (countryStats[country.code]?.totalEmployees || 0)} employees
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Country Selection and Processing */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payroll Processing Setup</h3>
            
            {/* Period Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Payroll Period
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Period</option>
                {periods.map(period => (
                  <option key={period.PERIOD_ID} value={period.PERIOD_ID}>
                    {period.PERIOD_NAME} ({period.START_DATE} to {period.END_DATE})
                  </option>
                ))}
              </select>
            </div>

            {/* Country Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Country
              </label>
              <CountrySelector 
                value={selectedCountry}
                onChange={handleCountryChange}
              />
            </div>

            {/* Selected Country Info */}
            {selectedCountry && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">{getSelectedCountryInfo()?.flag}</span>
                  <h4 className="font-semibold text-blue-900">{getSelectedCountryInfo()?.name}</h4>
                </div>
                <div className="text-sm text-blue-700">
                  <p>Currency: {getSelectedCountryInfo()?.currency}</p>
                  <p>Total Employees: {countryEmployees.length}</p>
                  <p>Selected for Processing: {selectedEmployees.length || 'All'}</p>
                </div>
              </div>
            )}

            {/* Process Button */}
            <button
              onClick={processCountryPayroll}
              disabled={processing || !selectedCountry || !selectedPeriod}
              className={`w-full px-4 py-2 rounded-md font-medium ${
                processing || !selectedCountry || !selectedPeriod
                  ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {processing ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Processing...</span>
                </div>
              ) : (
                `Process ${selectedCountry} Payroll`
              )}
            </button>
          </div>

          {/* Right Column - Employee List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Employees in {selectedCountry ? getSelectedCountryInfo()?.name : 'Selected Country'}
            </h3>
            
            {selectedCountry ? (
              <div>
                {countryEmployees.length > 0 && (
                  <div className="mb-4">
                    <button
                      onClick={selectAllEmployees}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {selectedEmployees.length === countryEmployees.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                )}

                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                  {loading ? (
                    <div className="p-4 text-center">
                      <LoadingSpinner size="sm" />
                      <p className="text-gray-500 mt-2">Loading employees...</p>
                    </div>
                  ) : countryEmployees.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {countryEmployees.map(employee => (
                        <div key={employee.EMPLOYEE_ID} className="p-3 hover:bg-gray-50">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedEmployees.includes(employee.EMPLOYEE_ID)}
                              onChange={() => handleEmployeeSelection(employee.EMPLOYEE_ID)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {employee.EMPLOYEE_CODE} - {employee.FIRST_NAME} {employee.LAST_NAME}
                              </p>
                              <p className="text-xs text-gray-500">
                                {employee.DESIGNATION_NAME} • {employee.DEPARTMENT_NAME}
                              </p>
                              {employee.AIR_TICKET_ELIGIBLE && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                                  ✈️ Air Ticket Eligible
                                </span>
                              )}
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No employees found for {getSelectedCountryInfo()?.name}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 border border-gray-200 rounded-md">
                Select a country to view employees
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Processing Results */}
      {results && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 mr-2 text-green-600" />
            Processing Results - {results.countryCode}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900">Successfully Processed</h4>
              <p className="text-2xl font-bold text-green-600">{results.processedEmployees}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-900">Failed</h4>
              <p className="text-2xl font-bold text-red-600">{results.failedEmployees}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900">Total Employees</h4>
              <p className="text-2xl font-bold text-blue-600">{results.totalEmployees}</p>
            </div>
          </div>

          {/* Country-Specific Summary */}
          {results.countrySpecificData && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Country-Specific Totals</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Social Security:</span>
                  <span className="font-medium ml-2">
                    {results.countrySpecificData.currency?.symbol} {results.countrySpecificData.totalSocialSecurity?.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Gratuity Accrual:</span>
                  <span className="font-medium ml-2">
                    {results.countrySpecificData.currency?.symbol} {results.countrySpecificData.totalGratuityAccrual?.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Air Ticket Accrual:</span>
                  <span className="font-medium ml-2">
                    {results.countrySpecificData.currency?.symbol} {results.countrySpecificData.totalAirTicketAccrual?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Details */}
          {results.errors && results.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-red-900 mb-2">Processing Errors</h4>
              <div className="bg-red-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                {results.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-700 mb-1">
                    <strong>{error.employeeCode}:</strong> {error.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CountryPayrollProcessing;
```

### 3. API Route Addition

```javascript
// backend/routes/payroll.js - Add this route

// Country-based payroll processing
router.post('/process-by-country', 
  authorizeRoles('ADMIN', 'HR'), 
  payrollController.processPayrollByCountry
);

// Get employees by country
router.get('/employees/:countryCode', 
  authorizeRoles('ADMIN', 'HR'), 
  async (req, res) => {
    try {
      const { countryCode } = req.params;
      const employees = await getEmployeesByCountry(countryCode);
      
      res.json({
        success: true,
        data: employees
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch employees',
        error: error.message
      });
    }
  }
);
```

### 4. Frontend API Service

```javascript
// frontend/src/services/api.js - Add these methods

export const payrollAPI = {
  // ... existing methods ...

  // Process payroll by country
  processPayrollByCountry: (data) => api.post('/payroll/process-by-country', data),

  // Get employees by country
  getEmployeesByCountry: (countryCode) => api.get(`/payroll/employees/${countryCode}`),

  // Get country-specific payroll summary
  getCountryPayrollSummary: (periodId, countryCode) => 
    api.get(`/payroll/summary/${periodId}/${countryCode}`)
};
```

/**
 * Multi-Country Payroll Service
 * 
 * This service provides comprehensive payroll processing capabilities
 * for all 7 supported countries with accurate statutory calculations.
 */

const { executeQuery } = require('../config/database');
const PayrollCalculatorFactory = require('./PayrollCalculatorFactory');
const WPSService = require('./WPSService');
const AirTicketService = require('./AirTicketService');
const StatutoryCalculationService = require('./StatutoryCalculationService');

class MultiCountryPayrollService {
  
  /**
   * Process payroll for specific country
   */
  static async processCountryPayroll(periodId, countryCode, employeeIds = null, createdBy) {
    console.log(`🌍 Processing ${countryCode} payroll for period ${periodId}`);
    
    try {
      // Validate inputs
      await this.validateProcessingInputs(periodId, countryCode);
      
      // Get employees for processing
      const employees = await this.getCountryEmployees(periodId, countryCode, employeeIds);
      
      if (employees.length === 0) {
        throw new Error(`No eligible employees found for ${countryCode}`);
      }
      
      // Get country-specific calculator
      const calculator = PayrollCalculatorFactory.getCalculator(countryCode);
      await calculator.initialize();
      
      // Create payroll run
      const runId = await this.createPayrollRun(periodId, countryCode, employees.length, createdBy);
      
      const results = {
        countryCode,
        runId,
        periodId,
        totalEmployees: employees.length,
        processedEmployees: 0,
        failedEmployees: 0,
        totalGrossSalary: 0,
        totalNetSalary: 0,
        totalStatutoryDeductions: 0,
        totalEmployerContributions: 0,
        totalGratuityAccrual: 0,
        totalAirTicketAccrual: 0,
        errors: [],
        processingDetails: []
      };
      
      // Process each employee
      for (const employee of employees) {
        try {
          const employeeResult = await this.processEmployeePayroll(
            employee,
            periodId,
            runId,
            countryCode,
            calculator,
            createdBy
          );
          
          // Accumulate totals
          results.totalGrossSalary += employeeResult.grossSalary;
          results.totalNetSalary += employeeResult.netSalary;
          results.totalStatutoryDeductions += employeeResult.statutoryDeductions.total;
          results.totalEmployerContributions += employeeResult.employerContributions;
          results.totalGratuityAccrual += employeeResult.gratuityAccrual;
          results.totalAirTicketAccrual += employeeResult.airTicketAccrual;
          
          results.processedEmployees++;
          results.processingDetails.push({
            employeeId: employee.EMPLOYEE_ID,
            employeeCode: employee.EMPLOYEE_CODE,
            status: 'SUCCESS',
            ...employeeResult
          });
          
        } catch (error) {
          console.error(`❌ Error processing employee ${employee.EMPLOYEE_CODE}:`, error);
          results.failedEmployees++;
          results.errors.push({
            employeeId: employee.EMPLOYEE_ID,
            employeeCode: employee.EMPLOYEE_CODE,
            error: error.message
          });
        }
      }
      
      // Update run totals
      await this.updatePayrollRunTotals(runId, results);
      
      // Mark run as completed
      const runStatus = results.failedEmployees === 0 ? 'COMPLETED' : 'COMPLETED_WITH_ERRORS';
      await this.updatePayrollRunStatus(runId, runStatus);
      
      console.log(`✅ ${countryCode} payroll completed: ${results.processedEmployees} success, ${results.failedEmployees} failed`);
      
      return results;
      
    } catch (error) {
      console.error(`❌ Country payroll processing failed for ${countryCode}:`, error);
      throw error;
    }
  }
  
  /**
   * Process individual employee payroll
   */
  static async processEmployeePayroll(employee, periodId, runId, countryCode, calculator, createdBy) {
    console.log(`👤 Processing employee: ${employee.EMPLOYEE_CODE} (${countryCode})`);
    
    try {
      // Get employee compensation
      const compensation = await this.getEmployeeCompensation(employee.EMPLOYEE_ID);
      
      // Get attendance data
      const attendance = await this.getEmployeeAttendance(employee.EMPLOYEE_ID, periodId);
      
      // Calculate gross salary
      const grossSalary = await calculator.calculateGrossSalary(employee, compensation, attendance);
      const basicSalary = this.extractBasicSalary(compensation, grossSalary);
      
      // Calculate statutory deductions
      const statutoryDeductions = await calculator.calculateStatutoryDeductions(
        employee, 
        grossSalary, 
        basicSalary
      );
      
      // Calculate gratuity accrual
      const serviceMonths = this.calculateServiceMonths(employee.JOINING_DATE);
      const gratuityAccrual = await calculator.calculateGratuityAccrual(
        employee, 
        basicSalary, 
        serviceMonths
      );
      
      // Calculate air ticket accrual
      const airTicketAccrual = await calculator.calculateAirTicketAccrual(employee);
      
      // Calculate overtime
      const overtimeHours = attendance.OVERTIME_HOURS || 0;
      const overtimePay = await calculator.calculateOvertimePay(
        employee, 
        overtimeHours, 
        basicSalary
      );
      
      // Calculate totals
      const totalEarnings = grossSalary + overtimePay;
      const totalDeductions = statutoryDeductions.employee;
      const netSalary = totalEarnings - totalDeductions;
      const employerContributions = statutoryDeductions.employer;
      
      // Create payroll detail record
      const payrollData = {
        periodId,
        employeeId: employee.EMPLOYEE_ID,
        runId,
        basicSalary,
        grossSalary: totalEarnings,
        netSalary,
        totalEarnings,
        totalDeductions,
        totalTaxes: 0, // Will be calculated separately for countries with tax
        workDays: attendance.WORK_DAYS || 30,
        presentDays: attendance.PRESENT_DAYS || 30,
        absentDays: attendance.ABSENT_DAYS || 0,
        leaveDays: attendance.LEAVE_DAYS || 0,
        overtimeHours,
        overtimeAmount: overtimePay,
        payrollCountry: countryCode,
        socialSecurityEmployee: statutoryDeductions.employee,
        socialSecurityEmployer: statutoryDeductions.employer,
        pensionEmployee: statutoryDeductions.breakdown.pension?.employee || 0,
        pensionEmployer: statutoryDeductions.breakdown.pension?.employer || 0,
        gratuityAccrual,
        airTicketAccrual,
        overtimeRate: await this.getOvertimeRate(countryCode),
        status: 'CALCULATED'
      };
      
      const payrollId = await this.createPayrollDetail(payrollData, createdBy);
      
      // Create statutory deduction records
      if (statutoryDeductions.total > 0) {
        await StatutoryCalculationService.createStatutoryRecords(
          employee.EMPLOYEE_ID,
          periodId,
          countryCode,
          statutoryDeductions,
          grossSalary
        );
      }
      
      // Create gratuity accrual record
      if (gratuityAccrual > 0) {
        await this.createGratuityAccrualRecord(
          employee.EMPLOYEE_ID,
          serviceMonths,
          gratuityAccrual,
          basicSalary,
          countryCode
        );
      }
      
      // Create air ticket accrual record
      if (airTicketAccrual > 0) {
        await AirTicketService.createMonthlyAccrual(
          employee.EMPLOYEE_ID,
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          airTicketAccrual,
          employee.TICKET_SEGMENT || 'ECONOMY',
          employee.ESTIMATED_TICKET_COST || 0
        );
      }
      
      return {
        payrollId,
        grossSalary: totalEarnings,
        netSalary,
        statutoryDeductions,
        employerContributions,
        gratuityAccrual,
        airTicketAccrual,
        overtimePay,
        basicSalary
      };
      
    } catch (error) {
      console.error(`❌ Error processing employee ${employee.EMPLOYEE_CODE}:`, error);
      throw error;
    }
  }
  
  /**
   * Calculate real-time CTC for employee
   */
  static async calculateRealTimeCTC(employeeData, compensationData) {
    console.log(`💰 Calculating real-time CTC for ${employeeData.countryCode}`);
    
    try {
      // Get country-specific calculator
      const calculator = PayrollCalculatorFactory.getCalculator(employeeData.countryCode);
      await calculator.initialize();
      
      // Calculate base salary components
      console.log('📊 [Backend] Received compensation data:', JSON.stringify(compensationData, null, 2));
      const grossSalary = this.calculateCompensationTotal(compensationData, 'EARNING');
      console.log('💰 [Backend] Calculated gross salary:', grossSalary);
      const basicSalary = this.extractBasicSalaryFromData(compensationData, grossSalary);
      console.log('💼 [Backend] Extracted basic salary:', basicSalary);
      
      // Calculate statutory deductions
      const statutoryDeductions = await calculator.calculateStatutoryDeductions(
        employeeData,
        grossSalary,
        basicSalary
      );
      
      // Calculate gratuity accrual
      const serviceMonths = this.calculateServiceMonths(employeeData.joiningDate);
      const gratuityAccrual = await calculator.calculateGratuityAccrual(
        employeeData,
        basicSalary,
        serviceMonths
      );
      
      // Calculate air ticket accrual
      const airTicketAccrual = await calculator.calculateAirTicketAccrual(employeeData);
      
      // Calculate net salary
      const netSalary = grossSalary - statutoryDeductions.employee;
      
      // Calculate total employer costs
      const totalEmployerCosts = statutoryDeductions.employer + gratuityAccrual + airTicketAccrual;
      
      // Calculate total CTC
      const monthlyCTC = grossSalary + totalEmployerCosts;
      const annualCTC = monthlyCTC * 12;
      
      // Get currency information
      const currencyInfo = await this.getCurrencyInfo(employeeData.countryCode);
      
      return {
        countryCode: employeeData.countryCode,
        currency: currencyInfo,
        earnings: {
          gross: grossSalary,
          basic: basicSalary,
          allowances: grossSalary - basicSalary,
          breakdown: this.categorizeCompensationData(compensationData)
        },
        deductions: {
          employee: statutoryDeductions.employee,
          statutory: statutoryDeductions.breakdown,
          net: netSalary
        },
        employerCosts: {
          statutory: statutoryDeductions.employer,
          gratuity: gratuityAccrual,
          airTicket: airTicketAccrual,
          total: totalEmployerCosts
        },
        totals: {
          monthlyGross: grossSalary,
          monthlyNet: netSalary,
          monthlyEmployerCost: totalEmployerCosts,
          monthlyCTC,
          annualCTC
        },
        serviceInfo: {
          joiningDate: employeeData.joiningDate,
          serviceMonths,
          serviceYears: Math.floor(serviceMonths / 12)
        },
        calculatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Error calculating CTC:`, error);
      throw error;
    }
  }
  
  /**
   * Generate WPS file for country and bank
   */
  static async generateWPSFile(periodId, countryCode, bankCode, createdBy) {
    console.log(`🏦 Generating WPS file: ${countryCode} - ${bankCode}`);
    
    try {
      return await WPSService.generateWPSFile(periodId, countryCode, bankCode, createdBy);
    } catch (error) {
      console.error(`❌ WPS file generation failed:`, error);
      throw error;
    }
  }
  
  /**
   * Get country-specific payroll summary
   */
  static async getCountryPayrollSummary(periodId, countryCode) {
    const sql = `
      SELECT 
        COUNT(*) as TOTAL_EMPLOYEES,
        SUM(GROSS_SALARY) as TOTAL_GROSS_SALARY,
        SUM(NET_SALARY) as TOTAL_NET_SALARY,
        SUM(SOCIAL_SECURITY_EMPLOYEE) as TOTAL_EMPLOYEE_DEDUCTIONS,
        SUM(SOCIAL_SECURITY_EMPLOYER) as TOTAL_EMPLOYER_CONTRIBUTIONS,
        SUM(GRATUITY_ACCRUAL) as TOTAL_GRATUITY_ACCRUAL,
        SUM(AIR_TICKET_ACCRUAL) as TOTAL_AIR_TICKET_ACCRUAL,
        SUM(OVERTIME_AMOUNT) as TOTAL_OVERTIME,
        AVG(GROSS_SALARY) as AVERAGE_GROSS_SALARY,
        c.CURRENCY_CODE,
        c.CURRENCY_SYMBOL
      FROM HRMS_PAYROLL_DETAILS pd
      JOIN HRMS_COUNTRIES c ON pd.PAYROLL_COUNTRY = c.COUNTRY_CODE
      WHERE pd.PERIOD_ID = :periodId 
        AND pd.PAYROLL_COUNTRY = :countryCode
        AND pd.STATUS IN ('CALCULATED', 'APPROVED', 'PAID')
      GROUP BY c.CURRENCY_CODE, c.CURRENCY_SYMBOL
    `;
    
    const result = await executeQuery(sql, { periodId, countryCode });
    return result.rows?.[0] || null;
  }
  
  /**
   * Get available countries for payroll
   */
  static async getAvailableCountries() {
    const sql = `
      SELECT 
        COUNTRY_CODE,
        COUNTRY_NAME,
        CURRENCY_CODE,
        CURRENCY_SYMBOL,
        CURRENCY_DECIMALS,
        WPS_ENABLED,
        (SELECT COUNT(*) FROM HRMS_EMPLOYEES WHERE PAYROLL_COUNTRY = c.COUNTRY_CODE AND STATUS = 'ACTIVE') as EMPLOYEE_COUNT
      FROM HRMS_COUNTRIES c
      WHERE IS_ACTIVE = 1
      ORDER BY COUNTRY_NAME
    `;
    
    const result = await executeQuery(sql);
    return result.rows || [];
  }
  
  /**
   * Get employees by country for payroll processing
   */
  static async getCountryEmployees(periodId, countryCode, employeeIds = null) {
    let sql = `
      SELECT 
        e.EMPLOYEE_ID,
        e.EMPLOYEE_CODE,
        e.FIRST_NAME,
        e.LAST_NAME,
        e.PAYROLL_COUNTRY,
        e.EMPLOYEE_TYPE,
        e.NATIONALITY,
        e.JOINING_DATE,
        e.BASIC_SALARY,
        e.AIR_TICKET_ELIGIBLE,
        e.TICKET_SEGMENT,
        e.ESTIMATED_TICKET_COST,
        e.WPS_ENABLED,
        e.PRIMARY_BANK_CODE,
        d.DESIGNATION_NAME,
        dept.DEPARTMENT_NAME
      FROM HRMS_EMPLOYEES e
      LEFT JOIN HRMS_DESIGNATIONS d ON e.DESIGNATION_ID = d.DESIGNATION_ID
      LEFT JOIN HRMS_DEPARTMENTS dept ON e.DEPARTMENT_ID = dept.DEPARTMENT_ID
      WHERE e.STATUS = 'ACTIVE'
        AND e.PAYROLL_COUNTRY = :countryCode
        AND NOT EXISTS (
          SELECT 1 FROM HRMS_PAYROLL_DETAILS pd 
          WHERE pd.EMPLOYEE_ID = e.EMPLOYEE_ID 
            AND pd.PERIOD_ID = :periodId
            AND pd.STATUS IN ('CALCULATED', 'APPROVED', 'PAID')
        )
    `;
    
    const params = { periodId, countryCode };
    
    if (employeeIds && employeeIds.length > 0) {
      const placeholders = employeeIds.map((_, index) => `:empId${index}`).join(',');
      sql += ` AND e.EMPLOYEE_ID IN (${placeholders})`;
      
      employeeIds.forEach((empId, index) => {
        params[`empId${index}`] = empId;
      });
    }
    
    sql += ` ORDER BY e.EMPLOYEE_CODE`;
    
    const result = await executeQuery(sql, params);
    return result.rows || [];
  }
  
  /**
   * Helper methods
   */
  
  static async validateProcessingInputs(periodId, countryCode) {
    // Validate period exists and is in correct status
    const periodSql = `
      SELECT STATUS FROM HRMS_PAYROLL_PERIODS 
      WHERE PERIOD_ID = :periodId
    `;
    const periodResult = await executeQuery(periodSql, { periodId });
    
    if (!periodResult.rows || periodResult.rows.length === 0) {
      throw new Error('Payroll period not found');
    }
    
    if (periodResult.rows[0].STATUS !== 'DRAFT') {
      throw new Error('Payroll period is not in DRAFT status');
    }
    
    // Validate country code
    const countrySql = `
      SELECT COUNTRY_CODE FROM HRMS_COUNTRIES 
      WHERE COUNTRY_CODE = :countryCode AND IS_ACTIVE = 1
    `;
    const countryResult = await executeQuery(countrySql, { countryCode });
    
    if (!countryResult.rows || countryResult.rows.length === 0) {
      throw new Error(`Invalid or inactive country code: ${countryCode}`);
    }
  }
  
  static async createPayrollRun(periodId, countryCode, totalEmployees, createdBy) {
    const period = await this.getPayrollPeriod(periodId);
    const currency = await this.getCurrencyInfo(countryCode);
    
    const sql = `
      INSERT INTO HRMS_PAYROLL_RUNS (
        PERIOD_ID, RUN_NAME, RUN_TYPE, STATUS, 
        TOTAL_EMPLOYEES_PROCESSED, COUNTRY_CODE, CURRENCY_CODE,
        CREATED_BY
      ) VALUES (
        :periodId, :runName, 'FULL', 'IN_PROGRESS',
        0, :countryCode, :currencyCode, :createdBy
      ) RETURNING RUN_ID INTO :runId
    `;
    
    const params = {
      periodId,
      runName: `${countryCode} Payroll - ${period.PERIOD_NAME}`,
      countryCode,
      currencyCode: currency.code,
      createdBy,
      runId: { type: require('oracledb').NUMBER, dir: require('oracledb').BIND_OUT }
    };
    
    const result = await executeQuery(sql, params);
    return result.outBinds.runId[0];
  }
  
  static async createPayrollDetail(payrollData, createdBy) {
    const sql = `
      INSERT INTO HRMS_PAYROLL_DETAILS (
        PERIOD_ID, EMPLOYEE_ID, RUN_ID, BASIC_SALARY, GROSS_SALARY, NET_SALARY,
        TOTAL_EARNINGS, TOTAL_DEDUCTIONS, TOTAL_TAXES, WORK_DAYS, PRESENT_DAYS,
        ABSENT_DAYS, LEAVE_DAYS, OVERTIME_HOURS, OVERTIME_AMOUNT, PAYROLL_COUNTRY,
        SOCIAL_SECURITY_EMPLOYEE, SOCIAL_SECURITY_EMPLOYER, PENSION_EMPLOYEE,
        PENSION_EMPLOYER, GRATUITY_ACCRUAL, AIR_TICKET_ACCRUAL, OVERTIME_RATE,
        STATUS, CREATED_BY
      ) VALUES (
        :periodId, :employeeId, :runId, :basicSalary, :grossSalary, :netSalary,
        :totalEarnings, :totalDeductions, :totalTaxes, :workDays, :presentDays,
        :absentDays, :leaveDays, :overtimeHours, :overtimeAmount, :payrollCountry,
        :socialSecurityEmployee, :socialSecurityEmployer, :pensionEmployee,
        :pensionEmployer, :gratuityAccrual, :airTicketAccrual, :overtimeRate,
        :status, :createdBy
      ) RETURNING PAYROLL_ID INTO :payrollId
    `;
    
    const params = {
      ...payrollData,
      createdBy,
      payrollId: { type: require('oracledb').NUMBER, dir: require('oracledb').BIND_OUT }
    };
    
    const result = await executeQuery(sql, params);
    return result.outBinds.payrollId[0];
  }
  
  static async updatePayrollRunTotals(runId, results) {
    const sql = `
      UPDATE HRMS_PAYROLL_RUNS SET
        TOTAL_EMPLOYEES_PROCESSED = :processedEmployees,
        TOTAL_EMPLOYEES_FAILED = :failedEmployees,
        TOTAL_GROSS_SALARY = :totalGrossSalary,
        TOTAL_NET_SALARY = :totalNetSalary,
        TOTAL_STATUTORY_DEDUCTIONS = :totalStatutoryDeductions,
        TOTAL_EMPLOYER_CONTRIBUTIONS = :totalEmployerContributions
      WHERE RUN_ID = :runId
    `;
    
    await executeQuery(sql, {
      runId,
      processedEmployees: results.processedEmployees,
      failedEmployees: results.failedEmployees,
      totalGrossSalary: results.totalGrossSalary,
      totalNetSalary: results.totalNetSalary,
      totalStatutoryDeductions: results.totalStatutoryDeductions,
      totalEmployerContributions: results.totalEmployerContributions
    });
  }
  
  static async updatePayrollRunStatus(runId, status) {
    const sql = `
      UPDATE HRMS_PAYROLL_RUNS SET
        STATUS = :status,
        COMPLETED_AT = CASE WHEN :status IN ('COMPLETED', 'COMPLETED_WITH_ERRORS') THEN CURRENT_TIMESTAMP ELSE NULL END
      WHERE RUN_ID = :runId
    `;
    
    await executeQuery(sql, { runId, status });
  }
  
  static async getEmployeeCompensation(employeeId) {
    const sql = `
      SELECT 
        ec.COMPENSATION_ID,
        ec.PAY_COMPONENT_ID,
        ec.AMOUNT,
        ec.PERCENTAGE,
        ec.IS_PERCENTAGE,
        pc.COMPONENT_NAME,
        pc.COMPONENT_TYPE,
        pc.COMPONENT_CODE,
        pc.CALCULATION_TYPE,
        pc.BASE_TYPE
      FROM HRMS_EMPLOYEE_COMPENSATION ec
      JOIN HRMS_PAY_COMPONENTS pc ON ec.PAY_COMPONENT_ID = pc.PAY_COMPONENT_ID
      WHERE ec.EMPLOYEE_ID = :employeeId
        AND ec.STATUS = 'ACTIVE'
        AND ec.EFFECTIVE_DATE <= SYSDATE
        AND (ec.END_DATE IS NULL OR ec.END_DATE >= SYSDATE)
      ORDER BY pc.COMPONENT_TYPE, pc.COMPONENT_NAME
    `;
    
    const result = await executeQuery(sql, { employeeId });
    return result.rows || [];
  }
  
  static async getEmployeeAttendance(employeeId, periodId) {
    const period = await this.getPayrollPeriod(periodId);
    
    const sql = `
      SELECT 
        COALESCE(SUM(CASE WHEN STATUS = 'PRESENT' THEN 1 ELSE 0 END), 30) as PRESENT_DAYS,
        COALESCE(SUM(CASE WHEN STATUS = 'ABSENT' THEN 1 ELSE 0 END), 0) as ABSENT_DAYS,
        COALESCE(SUM(CASE WHEN STATUS = 'LEAVE' THEN 1 ELSE 0 END), 0) as LEAVE_DAYS,
        COALESCE(SUM(NVL(OVERTIME_HOURS, 0)), 0) as OVERTIME_HOURS,
        30 as WORK_DAYS
      FROM HRMS_ATTENDANCE
      WHERE EMPLOYEE_ID = :employeeId
        AND ATTENDANCE_DATE BETWEEN TO_DATE(:startDate, 'YYYY-MM-DD') 
        AND TO_DATE(:endDate, 'YYYY-MM-DD')
    `;
    
    const result = await executeQuery(sql, {
      employeeId,
      startDate: period.START_DATE,
      endDate: period.END_DATE
    });
    
    return result.rows?.[0] || {
      PRESENT_DAYS: 30,
      ABSENT_DAYS: 0,
      LEAVE_DAYS: 0,
      OVERTIME_HOURS: 0,
      WORK_DAYS: 30
    };
  }
  
  static async getPayrollPeriod(periodId) {
    const sql = `
      SELECT PERIOD_ID, PERIOD_NAME, START_DATE, END_DATE, STATUS
      FROM HRMS_PAYROLL_PERIODS
      WHERE PERIOD_ID = :periodId
    `;
    
    const result = await executeQuery(sql, { periodId });
    
    if (!result.rows || result.rows.length === 0) {
      throw new Error('Payroll period not found');
    }
    
    return result.rows[0];
  }
  
  static extractBasicSalary(compensation, grossSalary) {
    const basicComponent = compensation.find(comp => 
      comp.COMPONENT_CODE === 'BASIC' || 
      comp.COMPONENT_NAME?.toUpperCase().includes('BASIC')
    );
    
    return basicComponent?.AMOUNT || (grossSalary * 0.5);
  }
  
  static extractBasicSalaryFromData(compensationData, grossSalary) {
    const basicComponent = compensationData.find(comp => 
      comp.componentCode === 'BASIC' || 
      comp.componentName?.toUpperCase().includes('BASIC')
    );
    
    return basicComponent?.amount || (grossSalary * 0.5);
  }
  
  static calculateServiceMonths(joiningDate) {
    const joining = new Date(joiningDate);
    const now = new Date();
    const diffTime = Math.abs(now - joining);
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
    return diffMonths;
  }
  
  static calculateCompensationTotal(compensationData, componentType) {
    if (componentType === 'EARNING') {
      // For earnings, include both EARNING and ALLOWANCE types as they are part of gross salary
      return compensationData
        .filter(comp => (comp.componentType === 'EARNING' || comp.componentType === 'ALLOWANCE') && !comp.isPercentage)
        .reduce((sum, comp) => sum + (comp.amount || 0), 0);
    }
    
    return compensationData
      .filter(comp => comp.componentType === componentType && !comp.isPercentage)
      .reduce((sum, comp) => sum + (comp.amount || 0), 0);
  }
  
  static categorizeCompensationData(compensationData) {
    const categories = {
      earnings: [],
      allowances: [],
      deductions: []
    };
    
    compensationData.forEach(comp => {
      if (comp.componentType === 'EARNING') {
        categories.earnings.push(comp);
      } else if (comp.componentType === 'ALLOWANCE') {
        categories.allowances.push(comp);
      } else if (comp.componentType === 'DEDUCTION') {
        categories.deductions.push(comp);
      }
    });
    
    return categories;
  }
  
  static async getCurrencyInfo(countryCode) {
    const sql = `
      SELECT CURRENCY_CODE as code, CURRENCY_SYMBOL as symbol, CURRENCY_DECIMALS as decimals
      FROM HRMS_COUNTRIES
      WHERE COUNTRY_CODE = :countryCode
    `;
    
    const result = await executeQuery(sql, { countryCode });
    return result.rows?.[0] || { code: 'USD', symbol: '$', decimals: 2 };
  }
  
  static async getOvertimeRate(countryCode) {
    const rates = {
      'IND': 2.0,
      'UAE': 1.25,
      'SAU': 1.5,
      'OMN': 1.25,
      'BHR': 1.25,
      'QAT': 1.25,
      'EGY': 1.35
    };
    
    return rates[countryCode] || 1.5;
  }
  
  static async createGratuityAccrualRecord(employeeId, serviceMonths, monthlyAccrual, baseSalary, countryCode) {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    
    const sql = `
      INSERT INTO HRMS_GRATUITY_ACCRUALS (
        EMPLOYEE_ID, ACCRUAL_YEAR, ACCRUAL_MONTH, SERVICE_YEARS, SERVICE_MONTHS,
        MONTHLY_ACCRUAL_AMOUNT, TOTAL_ACCRUED_AMOUNT, CALCULATION_BASE_SALARY,
        GRATUITY_RATE_DAYS, COUNTRY_CODE
      ) VALUES (
        :employeeId, :year, :month, :serviceYears, :serviceMonths,
        :monthlyAccrual, :monthlyAccrual, :baseSalary,
        :gratuityRateDays, :countryCode
      )
    `;
    
    const gratuityRateDays = this.getGratuityRateDays(countryCode, serviceMonths);
    
    await executeQuery(sql, {
      employeeId,
      year,
      month,
      serviceYears: Math.floor(serviceMonths / 12),
      serviceMonths: serviceMonths % 12,
      monthlyAccrual,
      baseSalary,
      gratuityRateDays,
      countryCode
    });
  }
  
  static getGratuityRateDays(countryCode, serviceMonths) {
    switch (countryCode) {
      case 'IND':
        return 15; // 15 days per year
      case 'UAE':
        return serviceMonths <= 60 ? 21 : 30;
      case 'SAU':
        return serviceMonths <= 60 ? 15 : 30;
      case 'OMN':
        return 30; // 1 month per year
      case 'BHR':
        if (serviceMonths < 36) return 0;
        return serviceMonths <= 60 ? 15 : 30;
      case 'QAT':
        return 21; // 3 weeks per year
      case 'EGY':
        return 30; // 1 month per year
      default:
        return 15;
    }
  }
}

module.exports = MultiCountryPayrollService;

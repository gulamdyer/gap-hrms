const { executeQuery } = require('../config/database');
const oracledb = require('oracledb');

class Loan {
  // Create loans table if not exists
  static async createTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_LOANS (
        LOAN_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        EMPLOYEE_ID NUMBER NOT NULL,
        LOAN_TYPE VARCHAR2(50) NOT NULL CHECK (LOAN_TYPE IN ('PERSONAL', 'HOME', 'VEHICLE', 'EDUCATION', 'MEDICAL', 'OTHER')),
        LOAN_AMOUNT NUMBER(10,2) NOT NULL,
        MONTHLY_DEDUCTION_AMOUNT NUMBER(10,2) NOT NULL,
        TOTAL_MONTHS NUMBER(3) NOT NULL,
        REASON VARCHAR2(500) NOT NULL,
        LOAN_DATE DATE DEFAULT SYSDATE,
        FIRST_DEDUCTION_MONTH VARCHAR2(20),
        LAST_DEDUCTION_MONTH VARCHAR2(20),
        STATUS VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (STATUS IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
        CREATED_BY NUMBER NOT NULL,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_LOAN_EMPLOYEE FOREIGN KEY (EMPLOYEE_ID) REFERENCES HRMS_EMPLOYEES(EMPLOYEE_ID),
        CONSTRAINT FK_LOAN_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_LOANS table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_LOANS table already exists');
      } else {
        throw error;
      }
    }
  }

  // Create new loan
  static async create(loanData) {
    console.log('🔍 Creating loan with data:', loanData);
    
    // Helper function to handle date conversion
    const formatDateForOracle = (dateString) => {
      if (!dateString || dateString === '') {
        return null;
      }
      if (dateString instanceof Date) {
        return dateString.toISOString().split('T')[0];
      }
      if (typeof dateString === 'string') {
        return dateString.split('T')[0];
      }
      return null;
    };
    
    const sql = `
      INSERT INTO HRMS_LOANS (
        EMPLOYEE_ID, LOAN_TYPE, LOAN_AMOUNT, MONTHLY_DEDUCTION_AMOUNT, 
        TOTAL_MONTHS, REASON, LOAN_DATE, FIRST_DEDUCTION_MONTH, 
        LAST_DEDUCTION_MONTH, STATUS, CREATED_BY
      ) VALUES (
        :employeeId, :loanType, :loanAmount, :monthlyDeductionAmount,
        :totalMonths, :reason, SYSDATE, :firstDeductionMonth,
        :lastDeductionMonth, :status, :createdBy
      ) RETURNING LOAN_ID INTO :loanId
    `;
    
    const binds = {
      employeeId: loanData.employeeId,
      loanType: loanData.loanType,
      loanAmount: loanData.loanAmount,
      monthlyDeductionAmount: loanData.monthlyDeductionAmount,
      totalMonths: loanData.totalMonths,
      reason: loanData.reason,
      firstDeductionMonth: loanData.firstDeductionMonth || null,
      lastDeductionMonth: loanData.lastDeductionMonth || null,
      status: loanData.status || 'ACTIVE',
      createdBy: loanData.createdBy,
      loanId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };
    
    try {
      const result = await executeQuery(sql, binds);
      const loanId = result.outBinds.loanId[0];
      console.log('✅ Loan created successfully with ID:', loanId);
      return loanId;
    } catch (error) {
      console.error('❌ Error creating loan:', error);
      throw error;
    }
  }

  // Get loan by ID with employee details
  static async findById(loanId) {
    const sql = `
      SELECT 
        l.*,
        e.FIRST_NAME as EMPLOYEE_FIRST_NAME,
        e.LAST_NAME as EMPLOYEE_LAST_NAME,
        e.EMPLOYEE_CODE,
        e.DESIGNATION,
        c.FIRST_NAME as CREATED_BY_FIRST_NAME,
        c.LAST_NAME as CREATED_BY_LAST_NAME
      FROM HRMS_LOANS l
      LEFT JOIN HRMS_EMPLOYEES e ON l.EMPLOYEE_ID = e.EMPLOYEE_ID
      LEFT JOIN HRMS_USERS c ON l.CREATED_BY = c.USER_ID
      WHERE l.LOAN_ID = :loanId
    `;
    
    const result = await executeQuery(sql, { loanId });
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Get all loans with pagination and filters
  static async getAllLoans(filters = {}) {
    let sql = `
      SELECT 
        l.*,
        e.FIRST_NAME as EMPLOYEE_FIRST_NAME,
        e.LAST_NAME as EMPLOYEE_LAST_NAME,
        e.EMPLOYEE_CODE,
        e.DESIGNATION,
        c.FIRST_NAME as CREATED_BY_FIRST_NAME,
        c.LAST_NAME as CREATED_BY_LAST_NAME
      FROM HRMS_LOANS l
      LEFT JOIN HRMS_EMPLOYEES e ON l.EMPLOYEE_ID = e.EMPLOYEE_ID
      LEFT JOIN HRMS_USERS c ON l.CREATED_BY = c.USER_ID
    `;
    
    const conditions = [];
    const binds = {};
    
    if (filters.loanType) {
      conditions.push('l.LOAN_TYPE = :loanType');
      binds.loanType = filters.loanType;
    }
    
    if (filters.employeeId) {
      conditions.push('l.EMPLOYEE_ID = :employeeId');
      binds.employeeId = filters.employeeId;
    }
    
    if (filters.status) {
      conditions.push('l.STATUS = :status');
      binds.status = filters.status;
    }
    
    if (filters.search) {
      conditions.push(`(
        e.FIRST_NAME LIKE '%' || :search || '%' OR 
        e.LAST_NAME LIKE '%' || :search || '%' OR 
        e.EMPLOYEE_CODE LIKE '%' || :search || '%' OR
        l.REASON LIKE '%' || :search || '%'
      )`);
      binds.search = filters.search;
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY l.CREATED_AT DESC';
    
    const result = await executeQuery(sql, binds);
    return result.rows;
  }

  // Update loan
  static async update(loanId, loanData) {
    console.log('🔍 Updating loan with data:', loanData);
    
    const formatDateForOracle = (dateString) => {
      if (!dateString || dateString === '') {
        return null;
      }
      if (dateString instanceof Date) {
        return dateString.toISOString().split('T')[0];
      }
      if (typeof dateString === 'string') {
        return dateString.split('T')[0];
      }
      return null;
    };
    
    const sql = `
      UPDATE HRMS_LOANS SET
        EMPLOYEE_ID = :employeeId,
        LOAN_TYPE = :loanType,
        LOAN_AMOUNT = :loanAmount,
        MONTHLY_DEDUCTION_AMOUNT = :monthlyDeductionAmount,
        TOTAL_MONTHS = :totalMonths,
        REASON = :reason,
        FIRST_DEDUCTION_MONTH = :firstDeductionMonth,
        LAST_DEDUCTION_MONTH = :lastDeductionMonth,
        STATUS = :status,
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE LOAN_ID = :loanId
    `;
    
    const binds = {
      loanId,
      employeeId: loanData.employeeId,
      loanType: loanData.loanType,
      loanAmount: loanData.loanAmount,
      monthlyDeductionAmount: loanData.monthlyDeductionAmount,
      totalMonths: loanData.totalMonths,
      reason: loanData.reason,
      firstDeductionMonth: loanData.firstDeductionMonth || null,
      lastDeductionMonth: loanData.lastDeductionMonth || null,
      status: loanData.status || 'ACTIVE'
    };
    
    try {
      await executeQuery(sql, binds);
      console.log('✅ Loan updated successfully');
    } catch (error) {
      console.error('❌ Error updating loan:', error);
      throw error;
    }
  }

  // Delete loan
  static async delete(loanId) {
    const sql = 'DELETE FROM HRMS_LOANS WHERE LOAN_ID = :loanId';
    await executeQuery(sql, { loanId });
  }

  // Get loans by employee ID
  static async getByEmployeeId(employeeId) {
    const sql = `
      SELECT 
        l.*,
        c.FIRST_NAME as CREATED_BY_FIRST_NAME,
        c.LAST_NAME as CREATED_BY_LAST_NAME
      FROM HRMS_LOANS l
      LEFT JOIN HRMS_USERS c ON l.CREATED_BY = c.USER_ID
      WHERE l.EMPLOYEE_ID = :employeeId
      ORDER BY l.CREATED_AT DESC
    `;
    
    const result = await executeQuery(sql, { employeeId });
    return result.rows;
  }

  // Get loan statistics
  static async getStatistics() {
    const sql = `
      SELECT 
        COUNT(*) as TOTAL_LOANS,
        SUM(LOAN_AMOUNT) as TOTAL_LOAN_AMOUNT,
        SUM(MONTHLY_DEDUCTION_AMOUNT) as TOTAL_MONTHLY_DEDUCTIONS,
        COUNT(CASE WHEN STATUS = 'ACTIVE' THEN 1 END) as ACTIVE_LOANS,
        COUNT(CASE WHEN STATUS = 'COMPLETED' THEN 1 END) as COMPLETED_LOANS
      FROM HRMS_LOANS
    `;
    
    const result = await executeQuery(sql);
    return result.rows[0];
  }
}

module.exports = Loan; 
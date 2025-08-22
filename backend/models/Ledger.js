const { executeQuery } = require('../config/database');
const oracledb = require('oracledb');

class Ledger {
  // Create ledger table if not exists
  static async createTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_LEDGER (
        LEDGER_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        EMPLOYEE_ID NUMBER NOT NULL,
        TRANSACTION_DATE DATE DEFAULT SYSDATE NOT NULL,
        TRANSACTION_TYPE VARCHAR2(50) NOT NULL CHECK (TRANSACTION_TYPE IN ('ADVANCE', 'LOAN', 'DEDUCTION', 'PAYROLL', 'BONUS', 'ALLOWANCE', 'REFUND', 'ADJUSTMENT')),
        DEBIT_AMOUNT NUMBER(15,2) DEFAULT 0,
        CREDIT_AMOUNT NUMBER(15,2) DEFAULT 0,
        BALANCE NUMBER(15,2) NOT NULL,
        REFERENCE_ID NUMBER,
        REFERENCE_TYPE VARCHAR2(50),
        REFERENCE_DESCRIPTION VARCHAR2(500),
        PERIOD_MONTH VARCHAR2(7),
        PERIOD_YEAR NUMBER(4),
        STATUS VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (STATUS IN ('ACTIVE', 'CANCELLED', 'REVERSED')),
        CREATED_BY NUMBER NOT NULL,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_LEDGER_EMPLOYEE FOREIGN KEY (EMPLOYEE_ID) REFERENCES HRMS_EMPLOYEES(EMPLOYEE_ID),
        CONSTRAINT FK_LEDGER_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID),
        
        -- Check constraint to ensure either debit or credit is set, not both
        CONSTRAINT CHK_LEDGER_AMOUNT CHECK (
          (DEBIT_AMOUNT > 0 AND CREDIT_AMOUNT = 0) OR 
          (CREDIT_AMOUNT > 0 AND DEBIT_AMOUNT = 0)
        )
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_LEDGER table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_LEDGER table already exists');
      } else {
        throw error;
      }
    }
  }

  // Create a new ledger entry
  static async createEntry(ledgerData) {
    console.log('🔍 Creating ledger entry with data:', ledgerData);
    
    // Calculate new balance
    const currentBalance = await this.getCurrentBalance(ledgerData.employeeId);
    const transactionAmount = ledgerData.debitAmount || ledgerData.creditAmount || 0;
    const newBalance = currentBalance + (ledgerData.creditAmount || 0) - (ledgerData.debitAmount || 0);
    
    const sql = `
      INSERT INTO HRMS_LEDGER (
        EMPLOYEE_ID, TRANSACTION_DATE, TRANSACTION_TYPE, DEBIT_AMOUNT, CREDIT_AMOUNT,
        BALANCE, REFERENCE_ID, REFERENCE_TYPE, REFERENCE_DESCRIPTION,
        PERIOD_MONTH, PERIOD_YEAR, CREATED_BY
      ) VALUES (
        :employeeId, SYSDATE, :transactionType, :debitAmount, :creditAmount,
        :balance, :referenceId, :referenceType, :referenceDescription,
        :periodMonth, :periodYear, :createdBy
      ) RETURNING LEDGER_ID INTO :ledgerId
    `;
    
    const binds = {
      employeeId: ledgerData.employeeId,
      transactionType: ledgerData.transactionType,
      debitAmount: ledgerData.debitAmount || 0,
      creditAmount: ledgerData.creditAmount || 0,
      balance: newBalance,
      referenceId: ledgerData.referenceId || null,
      referenceType: ledgerData.referenceType || null,
      referenceDescription: ledgerData.referenceDescription || null,
      periodMonth: ledgerData.periodMonth || null,
      periodYear: ledgerData.periodYear || null,
      createdBy: ledgerData.createdBy,
      ledgerId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };
    
    try {
      const result = await executeQuery(sql, binds);
      const ledgerId = result.outBinds.ledgerId[0];
      console.log('✅ Ledger entry created successfully with ID:', ledgerId);
      return ledgerId;
    } catch (error) {
      console.error('❌ Error creating ledger entry:', error);
      throw error;
    }
  }

  // Get current balance for an employee
  static async getCurrentBalance(employeeId) {
    const sql = `
      SELECT COALESCE(SUM(CREDIT_AMOUNT - DEBIT_AMOUNT), 0) AS CURRENT_BALANCE
      FROM HRMS_LEDGER
      WHERE EMPLOYEE_ID = :employeeId AND STATUS = 'ACTIVE'
    `;
    
    try {
      const result = await executeQuery(sql, { employeeId });
      return result.rows[0]?.CURRENT_BALANCE || 0;
    } catch (error) {
      console.error('❌ Error getting current balance:', error);
      return 0;
    }
  }

  // Get ledger entries for an employee with pagination
  static async getEmployeeLedger(employeeId, page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE l.EMPLOYEE_ID = :employeeId';
    const binds = { employeeId, offset, limit };
    
    // Add filters
    if (filters.transactionType) {
      whereClause += ' AND l.TRANSACTION_TYPE = :transactionType';
      binds.transactionType = filters.transactionType;
    }
    
    if (filters.startDate) {
      whereClause += ' AND l.TRANSACTION_DATE >= TO_DATE(:startDate, \'YYYY-MM-DD\')';
      binds.startDate = filters.startDate;
    }
    
    if (filters.endDate) {
      whereClause += ' AND l.TRANSACTION_DATE <= TO_DATE(:endDate, \'YYYY-MM-DD\')';
      binds.endDate = filters.endDate;
    }
    
    if (filters.periodMonth) {
      whereClause += ' AND l.PERIOD_MONTH = :periodMonth';
      binds.periodMonth = filters.periodMonth;
    }

    const sql = `
      SELECT 
        l.LEDGER_ID,
        l.EMPLOYEE_ID,
        l.TRANSACTION_DATE,
        l.TRANSACTION_TYPE,
        l.DEBIT_AMOUNT,
        l.CREDIT_AMOUNT,
        0 BALANCE,
        l.REFERENCE_ID,
        l.REFERENCE_TYPE,
        l.REFERENCE_DESCRIPTION,
        l.PERIOD_MONTH,
        l.PERIOD_YEAR,
        l.STATUS,
        l.CREATED_AT,
        e.FIRST_NAME || ' ' || e.LAST_NAME AS EMPLOYEE_NAME,
        e.EMPLOYEE_CODE,
        u.USERNAME AS CREATED_BY_NAME
      FROM HRMS_LEDGER l
      LEFT JOIN HRMS_EMPLOYEES e ON l.EMPLOYEE_ID = e.EMPLOYEE_ID
      LEFT JOIN HRMS_USERS u ON l.CREATED_BY = u.USER_ID
      ${whereClause}
      ORDER BY l.TRANSACTION_DATE DESC, l.LEDGER_ID DESC
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;
    
    const countSql = `
      SELECT COUNT(*) AS TOTAL_COUNT
      FROM HRMS_LEDGER l
      ${whereClause}
    `;
    
    // Create separate binds for count query (without offset and limit)
    const countBinds = { ...binds };
    delete countBinds.offset;
    delete countBinds.limit;
    
    try {
      const [ledgerData, countResult] = await Promise.all([
        executeQuery(sql, binds),
        executeQuery(countSql, countBinds)
      ]);
      
      const totalCount = countResult.rows[0]?.TOTAL_COUNT || 0;
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        data: ledgerData.rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit
        }
      };
    } catch (error) {
      console.error('❌ Error getting employee ledger:', error);
      throw error;
    }
  }

  // Get ledger summary for an employee
  static async getEmployeeLedgerSummary(employeeId) {
    const sql = `
      SELECT 
        e.EMPLOYEE_ID,
        e.FIRST_NAME || ' ' || e.LAST_NAME AS EMPLOYEE_NAME,
        e.EMPLOYEE_CODE,
        COALESCE(SUM(l.CREDIT_AMOUNT), 0) AS TOTAL_CREDITS,
        COALESCE(SUM(l.DEBIT_AMOUNT), 0) AS TOTAL_DEBITS,
        COALESCE(SUM(l.CREDIT_AMOUNT - l.DEBIT_AMOUNT), 0) AS CURRENT_BALANCE,
        COUNT(l.LEDGER_ID) AS TOTAL_TRANSACTIONS,
        MAX(l.TRANSACTION_DATE) AS LAST_TRANSACTION_DATE
      FROM HRMS_EMPLOYEES e
      LEFT JOIN HRMS_LEDGER l ON e.EMPLOYEE_ID = l.EMPLOYEE_ID AND l.STATUS = 'ACTIVE'
      WHERE e.EMPLOYEE_ID = :employeeId
      GROUP BY e.EMPLOYEE_ID, e.FIRST_NAME, e.LAST_NAME, e.EMPLOYEE_CODE
    `;
    
    try {
      const result = await executeQuery(sql, { employeeId });
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error getting employee ledger summary:', error);
      throw error;
    }
  }

  // Get all employees with ledger summary
  static async getAllEmployeesLedgerSummary(page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const binds = { offset, limit };
    
    if (filters.search) {
      whereClause += ' AND (e.FIRST_NAME || \' \' || e.LAST_NAME LIKE \'%\' || :search || \'%\' OR e.EMPLOYEE_CODE LIKE \'%\' || :search || \'%\')';
      binds.search = filters.search;
    }
    
    if (filters.departmentId) {
      whereClause += ' AND e.COST_CENTER = :departmentId';
      binds.departmentId = filters.departmentId;
    }

    const sql = `
      SELECT 
        e.EMPLOYEE_ID,
        e.FIRST_NAME || ' ' || e.LAST_NAME AS EMPLOYEE_NAME,
        e.EMPLOYEE_CODE,
        e.COST_CENTER AS DEPARTMENT_NAME,
        COALESCE(SUM(l.CREDIT_AMOUNT), 0) AS TOTAL_CREDITS,
        COALESCE(SUM(l.DEBIT_AMOUNT), 0) AS TOTAL_DEBITS,
        COALESCE(SUM(l.CREDIT_AMOUNT - l.DEBIT_AMOUNT), 0) AS CURRENT_BALANCE,
        COUNT(l.LEDGER_ID) AS TOTAL_TRANSACTIONS,
        MAX(l.TRANSACTION_DATE) AS LAST_TRANSACTION_DATE
      FROM HRMS_EMPLOYEES e
      LEFT JOIN HRMS_LEDGER l ON e.EMPLOYEE_ID = l.EMPLOYEE_ID AND l.STATUS = 'ACTIVE'
      ${whereClause}
      GROUP BY e.EMPLOYEE_ID, e.FIRST_NAME, e.LAST_NAME, e.EMPLOYEE_CODE, e.COST_CENTER
      ORDER BY e.FIRST_NAME, e.LAST_NAME
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;
    
    const countSql = `
      SELECT COUNT(*) AS TOTAL_COUNT
      FROM HRMS_EMPLOYEES e
      ${whereClause}
    `;
    
    // Create separate binds for count query (without offset and limit)
    const countBinds = { ...binds };
    delete countBinds.offset;
    delete countBinds.limit;
    
    try {
      const [ledgerData, countResult] = await Promise.all([
        executeQuery(sql, binds),
        executeQuery(countSql, countBinds)
      ]);
      
      const totalCount = countResult.rows[0]?.TOTAL_COUNT || 0;
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        data: ledgerData.rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit
        }
      };
    } catch (error) {
      console.error('❌ Error getting all employees ledger summary:', error);
      throw error;
    }
  }



  // Get ledger entry by ID
  static async getEntryById(ledgerId) {
    const sql = `
      SELECT * FROM HRMS_LEDGER WHERE LEDGER_ID = :ledgerId
    `;
    
    try {
      const result = await executeQuery(sql, { ledgerId });
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error getting ledger entry by ID:', error);
      throw error;
    }
  }

  // Get transaction types for filtering
  static async getTransactionTypes() {
    return [
      'ADVANCE',
      'LOAN', 
      'DEDUCTION',
      'PAYROLL',
      'BONUS',
      'ALLOWANCE',
      'REFUND',
      'ADJUSTMENT'
    ];
  }
}

module.exports = Ledger;

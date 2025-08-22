const { executeQuery } = require('../config/database');
const oracledb = require('oracledb');

class Advance {
  // Create advances table if not exists
  static async createTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_ADVANCES (
        ADVANCE_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        EMPLOYEE_ID NUMBER NOT NULL,
        ADVANCE_TYPE VARCHAR2(50) NOT NULL CHECK (ADVANCE_TYPE IN ('SALARY', 'TRAVEL', 'MEDICAL', 'EDUCATION', 'HOUSING', 'OTHER')),
        AMOUNT NUMBER(10,2) NOT NULL,
        REASON VARCHAR2(500) NOT NULL,
        REQUEST_DATE DATE DEFAULT SYSDATE,
        AMOUNT_REQUIRED_ON_DATE DATE,
        DEDUCTION_MONTH VARCHAR2(20),
        CREATED_BY NUMBER NOT NULL,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_ADVANCE_EMPLOYEE FOREIGN KEY (EMPLOYEE_ID) REFERENCES HRMS_EMPLOYEES(EMPLOYEE_ID),
        CONSTRAINT FK_ADVANCE_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_ADVANCES table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_ADVANCES table already exists');
      } else {
        throw error;
      }
    }
  }

  // Create new advance
  static async create(advanceData) {
    console.log('🔍 Creating advance with data:', advanceData);
    
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
      INSERT INTO HRMS_ADVANCES (
        EMPLOYEE_ID, ADVANCE_TYPE, AMOUNT, REASON, REQUEST_DATE,
        AMOUNT_REQUIRED_ON_DATE, DEDUCTION_MONTH, CREATED_BY
      ) VALUES (
        :employeeId, :advanceType, :amount, :reason, SYSDATE,
        TO_DATE(:amountRequiredOnDate, 'YYYY-MM-DD'), :deductionMonth, :createdBy
      ) RETURNING ADVANCE_ID INTO :advanceId
    `;
    
    const binds = {
      employeeId: advanceData.employeeId,
      advanceType: advanceData.advanceType,
      amount: advanceData.amount,
      reason: advanceData.reason,
      amountRequiredOnDate: formatDateForOracle(advanceData.amountRequiredOnDate),
      deductionMonth: advanceData.deductionMonth || null,
      createdBy: advanceData.createdBy,
      advanceId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };
    
    try {
      const result = await executeQuery(sql, binds);
      const advanceId = result.outBinds.advanceId[0];
      console.log('✅ Advance created successfully with ID:', advanceId);
      return advanceId;
    } catch (error) {
      console.error('❌ Error creating advance:', error);
      throw error;
    }
  }

  // Get advance by ID with employee details
  static async findById(advanceId) {
    const sql = `
      SELECT 
        a.*,
        e.FIRST_NAME as EMPLOYEE_FIRST_NAME,
        e.LAST_NAME as EMPLOYEE_LAST_NAME,
        e.EMPLOYEE_CODE,
        e.DESIGNATION,
        c.FIRST_NAME as CREATED_BY_FIRST_NAME,
        c.LAST_NAME as CREATED_BY_LAST_NAME
      FROM HRMS_ADVANCES a
      LEFT JOIN HRMS_EMPLOYEES e ON a.EMPLOYEE_ID = e.EMPLOYEE_ID
      LEFT JOIN HRMS_USERS c ON a.CREATED_BY = c.USER_ID
      WHERE a.ADVANCE_ID = :advanceId
    `;
    
    const result = await executeQuery(sql, { advanceId });
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Get all advances with pagination and filters
  static async getAllAdvances(filters = {}) {
    let sql = `
      SELECT 
        a.*,
        e.FIRST_NAME as EMPLOYEE_FIRST_NAME,
        e.LAST_NAME as EMPLOYEE_LAST_NAME,
        e.EMPLOYEE_CODE,
        e.DESIGNATION,
        c.FIRST_NAME as CREATED_BY_FIRST_NAME,
        c.LAST_NAME as CREATED_BY_LAST_NAME
      FROM HRMS_ADVANCES a
      LEFT JOIN HRMS_EMPLOYEES e ON a.EMPLOYEE_ID = e.EMPLOYEE_ID
      LEFT JOIN HRMS_USERS c ON a.CREATED_BY = c.USER_ID
    `;
    
    const conditions = [];
    const binds = {};
    
    if (filters.advanceType) {
      conditions.push('a.ADVANCE_TYPE = :advanceType');
      binds.advanceType = filters.advanceType;
    }
    
    if (filters.employeeId) {
      conditions.push('a.EMPLOYEE_ID = :employeeId');
      binds.employeeId = filters.employeeId;
    }
    
    if (filters.search) {
      conditions.push(`(
        e.FIRST_NAME LIKE '%' || :search || '%' OR 
        e.LAST_NAME LIKE '%' || :search || '%' OR 
        e.EMPLOYEE_CODE LIKE '%' || :search || '%' OR
        a.REASON LIKE '%' || :search || '%'
      )`);
      binds.search = filters.search;
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY a.CREATED_AT DESC';
    
    const result = await executeQuery(sql, binds);
    return result.rows;
  }

  // Update advance
  static async update(advanceId, advanceData) {
    console.log('🔍 Updating advance with data:', advanceData);
    
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
      UPDATE HRMS_ADVANCES SET
        EMPLOYEE_ID = :employeeId,
        ADVANCE_TYPE = :advanceType,
        AMOUNT = :amount,
        REASON = :reason,
        AMOUNT_REQUIRED_ON_DATE = TO_DATE(:amountRequiredOnDate, 'YYYY-MM-DD'),
        DEDUCTION_MONTH = :deductionMonth,
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE ADVANCE_ID = :advanceId
    `;
    
    const binds = {
      advanceId,
      employeeId: advanceData.employeeId,
      advanceType: advanceData.advanceType,
      amount: advanceData.amount,
      reason: advanceData.reason,
      amountRequiredOnDate: formatDateForOracle(advanceData.amountRequiredOnDate),
      deductionMonth: advanceData.deductionMonth || null
    };
    
    try {
      await executeQuery(sql, binds);
      console.log('✅ Advance updated successfully');
    } catch (error) {
      console.error('❌ Error updating advance:', error);
      throw error;
    }
  }

  // Delete advance
  static async delete(advanceId) {
    const sql = 'DELETE FROM HRMS_ADVANCES WHERE ADVANCE_ID = :advanceId';
    await executeQuery(sql, { advanceId });
  }



  // Get advances by employee ID
  static async getByEmployeeId(employeeId) {
    const sql = `
      SELECT 
        a.*,
        c.FIRST_NAME as CREATED_BY_FIRST_NAME,
        c.LAST_NAME as CREATED_BY_LAST_NAME
      FROM HRMS_ADVANCES a
      LEFT JOIN HRMS_USERS c ON a.CREATED_BY = c.USER_ID
      WHERE a.EMPLOYEE_ID = :employeeId
      ORDER BY a.CREATED_AT DESC
    `;
    
    const result = await executeQuery(sql, { employeeId });
    return result.rows;
  }

  // Get advance statistics
  static async getStatistics() {
    const sql = `
      SELECT 
        COUNT(*) as TOTAL_ADVANCES,
        SUM(AMOUNT) as TOTAL_AMOUNT
      FROM HRMS_ADVANCES
    `;
    
    const result = await executeQuery(sql);
    return result.rows[0];
  }
}

module.exports = Advance; 
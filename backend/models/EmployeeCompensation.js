const { executeQuery } = require('../config/database');
const oracledb = require('oracledb');

class EmployeeCompensation {
  // Create employee compensation table if not exists
  static async createTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_EMPLOYEE_COMPENSATION (
        COMPENSATION_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        EMPLOYEE_ID NUMBER NOT NULL,
        PAY_COMPONENT_ID NUMBER NOT NULL,
        AMOUNT NUMBER(15,2) NOT NULL,
        PERCENTAGE NUMBER(5,2),
        IS_PERCENTAGE NUMBER(1) DEFAULT 0 CHECK (IS_PERCENTAGE IN (0, 1)),
        EFFECTIVE_DATE DATE NOT NULL,
        END_DATE DATE,
        STATUS VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (STATUS IN ('ACTIVE', 'INACTIVE')),
        CREATED_BY NUMBER,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT FK_EMP_COMP_EMPLOYEE 
          FOREIGN KEY (EMPLOYEE_ID) REFERENCES HRMS_EMPLOYEES(EMPLOYEE_ID),
        CONSTRAINT FK_EMP_COMP_PAY_COMPONENT 
          FOREIGN KEY (PAY_COMPONENT_ID) REFERENCES HRMS_PAY_COMPONENTS(PAY_COMPONENT_ID),
        CONSTRAINT UK_EMP_PAY_COMPONENT_DATE 
          UNIQUE (EMPLOYEE_ID, PAY_COMPONENT_ID, EFFECTIVE_DATE)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_EMPLOYEE_COMPENSATION table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_EMPLOYEE_COMPENSATION table already exists');
      } else {
        throw error;
      }
    }
  }

  // Get all compensation records for an employee
  static async findByEmployeeId(employeeId) {
    const sql = `
      SELECT 
        ec.*,
        pc.COMPONENT_NAME,
        pc.COMPONENT_TYPE,
        pc.COMPONENT_CODE,
        pc.DESCRIPTION as PAY_COMPONENT_DESCRIPTION
      FROM HRMS_EMPLOYEE_COMPENSATION ec
      JOIN HRMS_PAY_COMPONENTS pc ON ec.PAY_COMPONENT_ID = pc.PAY_COMPONENT_ID
      WHERE ec.EMPLOYEE_ID = :employeeId
      AND ec.STATUS = 'ACTIVE'
      ORDER BY ec.EFFECTIVE_DATE DESC, pc.COMPONENT_NAME
    `;
    const result = await executeQuery(sql, { employeeId });
    return result.rows || [];
  }

  // Get active compensation for an employee at a specific date
  static async getActiveCompensation(employeeId, effectiveDate = new Date()) {
    const sql = `
      SELECT 
        ec.*,
        pc.COMPONENT_NAME,
        pc.COMPONENT_TYPE,
        pc.COMPONENT_CODE,
        pc.DESCRIPTION as PAY_COMPONENT_DESCRIPTION
      FROM HRMS_EMPLOYEE_COMPENSATION ec
      JOIN HRMS_PAY_COMPONENTS pc ON ec.PAY_COMPONENT_ID = pc.PAY_COMPONENT_ID
      WHERE ec.EMPLOYEE_ID = :employeeId
      AND ec.STATUS = 'ACTIVE'
      AND ec.EFFECTIVE_DATE <= TO_DATE(:effectiveDate, 'YYYY-MM-DD')
      AND (ec.END_DATE IS NULL OR ec.END_DATE >= TO_DATE(:effectiveDate, 'YYYY-MM-DD'))
      ORDER BY pc.COMPONENT_NAME
    `;
    
    // Convert date to YYYY-MM-DD format
    const dateStr = effectiveDate instanceof Date ? 
      effectiveDate.toISOString().split('T')[0] : 
      effectiveDate;
    
    const result = await executeQuery(sql, { 
      employeeId, 
      effectiveDate: dateStr
    });
    return result.rows || [];
  }

  // Create new compensation record
  static async create(compensationData) {
    const sql = `
      INSERT INTO HRMS_EMPLOYEE_COMPENSATION (
        EMPLOYEE_ID, PAY_COMPONENT_ID, AMOUNT, PERCENTAGE, IS_PERCENTAGE,
        EFFECTIVE_DATE, END_DATE, STATUS, CREATED_BY
      ) VALUES (
        :employeeId, :payComponentId, :amount, :percentage, :isPercentage,
        TO_DATE(:effectiveDate, 'YYYY-MM-DD'), 
        CASE 
          WHEN :endDate IS NOT NULL THEN TO_DATE(:endDate, 'YYYY-MM-DD')
          ELSE NULL 
        END,
        :status, :createdBy
      ) RETURNING COMPENSATION_ID INTO :compensationId
    `;

    const params = {
      employeeId: compensationData.employeeId,
      payComponentId: compensationData.payComponentId,
      amount: compensationData.amount || 0,
      percentage: compensationData.percentage || null,
      isPercentage: compensationData.isPercentage ? 1 : 0,
      effectiveDate: compensationData.effectiveDate,
      endDate: compensationData.endDate || null,
      status: compensationData.status || 'ACTIVE',
      createdBy: compensationData.createdBy || null,
      compensationId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };

    console.log('🔍 Creating compensation with params:', params);
    const result = await executeQuery(sql, params);
    return result.outBinds.compensationId[0];
  }

  // Update compensation record
  static async update(compensationId, compensationData) {
    const sql = `
      UPDATE HRMS_EMPLOYEE_COMPENSATION SET
        AMOUNT = :amount,
        PERCENTAGE = :percentage,
        IS_PERCENTAGE = :isPercentage,
        EFFECTIVE_DATE = TO_DATE(:effectiveDate, 'YYYY-MM-DD'),
        END_DATE = CASE 
          WHEN :endDate IS NOT NULL THEN TO_DATE(:endDate, 'YYYY-MM-DD')
          ELSE NULL 
        END,
        STATUS = :status,
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE COMPENSATION_ID = :compensationId
    `;

    const params = {
      compensationId,
      amount: compensationData.amount || 0,
      percentage: compensationData.percentage || null,
      isPercentage: compensationData.isPercentage ? 1 : 0,
      effectiveDate: compensationData.effectiveDate,
      endDate: compensationData.endDate || null,
      status: compensationData.status || 'ACTIVE'
    };

    console.log('🔍 Updating compensation with params:', params);
    const result = await executeQuery(sql, params);
    return result.rowsAffected;
  }

  // Delete compensation record (soft delete by setting status to INACTIVE)
  static async delete(compensationId) {
    const sql = `
      UPDATE HRMS_EMPLOYEE_COMPENSATION 
      SET STATUS = 'INACTIVE', UPDATED_AT = CURRENT_TIMESTAMP
      WHERE COMPENSATION_ID = :compensationId
    `;
    const result = await executeQuery(sql, { compensationId });
    return result.rowsAffected;
  }

  // Get compensation by ID
  static async findById(compensationId) {
    const sql = `
      SELECT 
        ec.*,
        pc.COMPONENT_NAME,
        pc.COMPONENT_TYPE,
        pc.COMPONENT_CODE,
        pc.DESCRIPTION as PAY_COMPONENT_DESCRIPTION
      FROM HRMS_EMPLOYEE_COMPENSATION ec
      JOIN HRMS_PAY_COMPONENTS pc ON ec.PAY_COMPONENT_ID = pc.PAY_COMPONENT_ID
      WHERE ec.COMPENSATION_ID = :compensationId
    `;
    const result = await executeQuery(sql, { compensationId });
    return result.rows?.[0] || null;
  }

  // Bulk create/update compensation for an employee
  static async bulkUpsert(employeeId, compensationData, createdBy = null) {
    const results = [];
    
    for (const comp of compensationData) {
      try {
        if (comp.compensationId) {
          // Update existing
          await this.update(comp.compensationId, {
            ...comp,
            employeeId
          });
          results.push({ action: 'updated', compensationId: comp.compensationId });
        } else {
          // Create new
          const newId = await this.create({
            ...comp,
            employeeId,
            createdBy
          });
          results.push({ action: 'created', compensationId: newId });
        }
      } catch (error) {
        console.error(`Error processing compensation for pay component ${comp.payComponentId}:`, error);
        throw error;
      }
    }
    
    return results;
  }

  // Get compensation summary for an employee
  static async getCompensationSummary(employeeId) {
    const sql = `
      SELECT 
        COUNT(*) as TOTAL_COMPONENTS,
        SUM(CASE WHEN pc.COMPONENT_TYPE = 'EARNING' AND ec.IS_PERCENTAGE = 0 THEN ec.AMOUNT ELSE 0 END) as TOTAL_FIXED_EARNINGS,
        SUM(CASE WHEN pc.COMPONENT_TYPE = 'DEDUCTION' AND ec.IS_PERCENTAGE = 0 THEN ec.AMOUNT ELSE 0 END) as TOTAL_FIXED_DEDUCTIONS,
        COUNT(CASE WHEN ec.IS_PERCENTAGE = 1 THEN 1 END) as PERCENTAGE_COMPONENTS
      FROM HRMS_EMPLOYEE_COMPENSATION ec
      JOIN HRMS_PAY_COMPONENTS pc ON ec.PAY_COMPONENT_ID = pc.PAY_COMPONENT_ID
      WHERE ec.EMPLOYEE_ID = :employeeId
      AND ec.STATUS = 'ACTIVE'
      AND ec.EFFECTIVE_DATE <= SYSDATE
      AND (ec.END_DATE IS NULL OR ec.END_DATE >= SYSDATE)
    `;
    const result = await executeQuery(sql, { employeeId });
    return result.rows?.[0] || {};
  }
}

module.exports = EmployeeCompensation; 
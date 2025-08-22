const { executeQuery } = require('../config/database');
const oracledb = require('oracledb');

class LeaveResumption {
  // Create leave resumptions table if not exists
  static async createTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_LEAVE_RESUMPTIONS (
        RESUMPTION_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        LEAVE_ID NUMBER NOT NULL,
        EMPLOYEE_ID NUMBER NOT NULL,
        PLANNED_RESUMPTION_DATE DATE NOT NULL,
        ACTUAL_RESUMPTION_DATE DATE NOT NULL,
        RESUMPTION_TYPE VARCHAR2(20) NOT NULL CHECK (RESUMPTION_TYPE IN ('EARLY', 'ON_TIME', 'EXTENDED')),
        REASON VARCHAR2(500),
        ATTACHMENT_URL VARCHAR2(500),
        STATUS VARCHAR2(20) DEFAULT 'PENDING' CHECK (STATUS IN ('PENDING', 'APPROVED', 'REJECTED')),
        APPLIED_BY NUMBER NOT NULL,
        APPROVED_BY NUMBER,
        APPROVED_AT TIMESTAMP,
        APPROVAL_COMMENTS VARCHAR2(500),
        IS_AUTO_APPROVED NUMBER(1) DEFAULT 0 CHECK (IS_AUTO_APPROVED IN (0, 1)),
        ATTENDANCE_UPDATED NUMBER(1) DEFAULT 0 CHECK (ATTENDANCE_UPDATED IN (0, 1)),
        PAYROLL_UPDATED NUMBER(1) DEFAULT 0 CHECK (PAYROLL_UPDATED IN (0, 1)),
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_RESUMPTION_LEAVE FOREIGN KEY (LEAVE_ID) REFERENCES HRMS_LEAVES(LEAVE_ID),
        CONSTRAINT FK_RESUMPTION_EMPLOYEE FOREIGN KEY (EMPLOYEE_ID) REFERENCES HRMS_EMPLOYEES(EMPLOYEE_ID),
        CONSTRAINT FK_RESUMPTION_APPLIED_BY FOREIGN KEY (APPLIED_BY) REFERENCES HRMS_USERS(USER_ID),
        CONSTRAINT FK_RESUMPTION_APPROVED_BY FOREIGN KEY (APPROVED_BY) REFERENCES HRMS_USERS(USER_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_LEAVE_RESUMPTIONS table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_LEAVE_RESUMPTIONS table already exists');
      } else {
        throw error;
      }
    }
  }

  // Create new leave resumption
  static async create(resumptionData) {
    console.log('🔍 Creating leave resumption with data:', resumptionData);
    
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

    // Determine resumption type based on dates
    const getResumptionType = (plannedDate, actualDate) => {
      const planned = new Date(plannedDate);
      const actual = new Date(actualDate);
      
      if (actual < planned) return 'EARLY';
      if (actual > planned) return 'EXTENDED';
      return 'ON_TIME';
    };

    // Check if auto-approval applies (HR/Manager role)
    const isAutoApproved = resumptionData.appliedByRole && 
                          ['ADMIN', 'HR', 'MANAGER'].includes(resumptionData.appliedByRole.toUpperCase());
    
    const sql = `
      INSERT INTO HRMS_LEAVE_RESUMPTIONS (
        LEAVE_ID, EMPLOYEE_ID, PLANNED_RESUMPTION_DATE, ACTUAL_RESUMPTION_DATE,
        RESUMPTION_TYPE, REASON, ATTACHMENT_URL, STATUS, APPLIED_BY,
        IS_AUTO_APPROVED, APPROVED_BY, APPROVED_AT
      ) VALUES (
        :leaveId, :employeeId, TO_DATE(:plannedDate, 'YYYY-MM-DD'), TO_DATE(:actualDate, 'YYYY-MM-DD'),
        :resumptionType, :reason, :attachmentUrl, :status, :appliedBy,
        :isAutoApproved, :approvedBy, :approvedAt
      ) RETURNING RESUMPTION_ID INTO :resumptionId
    `;
    
    const plannedDate = formatDateForOracle(resumptionData.plannedResumptionDate);
    const actualDate = formatDateForOracle(resumptionData.actualResumptionDate);
    const resumptionType = getResumptionType(plannedDate, actualDate);
    
    const binds = {
      leaveId: resumptionData.leaveId,
      employeeId: resumptionData.employeeId,
      plannedDate,
      actualDate,
      resumptionType,
      reason: resumptionData.reason || null,
      attachmentUrl: resumptionData.attachmentUrl || null,
      status: isAutoApproved ? 'APPROVED' : 'PENDING',
      appliedBy: resumptionData.appliedBy,
      isAutoApproved: isAutoApproved ? 1 : 0,
      approvedBy: isAutoApproved ? resumptionData.appliedBy : null,
      approvedAt: isAutoApproved ? new Date() : null,
      resumptionId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };
    
    try {
      const result = await executeQuery(sql, binds);
      const resumptionId = result.outBinds.resumptionId[0];
      
      // If auto-approved, update the leave status
      if (isAutoApproved) {
        await this.updateLeaveStatus(resumptionData.leaveId, 'RESUMED');
      }
      
      console.log('✅ Leave resumption created successfully with ID:', resumptionId);
      return resumptionId;
    } catch (error) {
      console.error('❌ Error creating leave resumption:', error);
      throw error;
    }
  }

  // Get resumption by ID with full details
  static async findById(resumptionId) {
    const sql = `
      SELECT 
        lr.*,
        l.LEAVE_TYPE, l.START_DATE as LEAVE_START_DATE, l.END_DATE as LEAVE_END_DATE,
        e.FIRST_NAME as EMPLOYEE_FIRST_NAME, e.LAST_NAME as EMPLOYEE_LAST_NAME,
        e.EMPLOYEE_CODE, e.DESIGNATION,
        u1.FIRST_NAME as APPLIED_BY_FIRST_NAME, u1.LAST_NAME as APPLIED_BY_LAST_NAME,
        u2.FIRST_NAME as APPROVED_BY_FIRST_NAME, u2.LAST_NAME as APPROVED_BY_LAST_NAME
      FROM HRMS_LEAVE_RESUMPTIONS lr
      LEFT JOIN HRMS_LEAVES l ON lr.LEAVE_ID = l.LEAVE_ID
      LEFT JOIN HRMS_EMPLOYEES e ON lr.EMPLOYEE_ID = e.EMPLOYEE_ID
      LEFT JOIN HRMS_USERS u1 ON lr.APPLIED_BY = u1.USER_ID
      LEFT JOIN HRMS_USERS u2 ON lr.APPROVED_BY = u2.USER_ID
      WHERE lr.RESUMPTION_ID = :resumptionId
    `;
    
    const result = await executeQuery(sql, { resumptionId });
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Get all resumptions with filters
  static async getAllResumptions(filters = {}) {
    let sql = `
      SELECT 
        lr.*,
        l.LEAVE_TYPE, l.START_DATE as LEAVE_START_DATE, l.END_DATE as LEAVE_END_DATE,
        e.FIRST_NAME as EMPLOYEE_FIRST_NAME, e.LAST_NAME as EMPLOYEE_LAST_NAME,
        e.EMPLOYEE_CODE, e.DESIGNATION,
        u1.FIRST_NAME as APPLIED_BY_FIRST_NAME, u1.LAST_NAME as APPLIED_BY_LAST_NAME,
        u2.FIRST_NAME as APPROVED_BY_FIRST_NAME, u2.LAST_NAME as APPROVED_BY_LAST_NAME
      FROM HRMS_LEAVE_RESUMPTIONS lr
      LEFT JOIN HRMS_LEAVES l ON lr.LEAVE_ID = l.LEAVE_ID
      LEFT JOIN HRMS_EMPLOYEES e ON lr.EMPLOYEE_ID = e.EMPLOYEE_ID
      LEFT JOIN HRMS_USERS u1 ON lr.APPLIED_BY = u1.USER_ID
      LEFT JOIN HRMS_USERS u2 ON lr.APPROVED_BY = u2.USER_ID
    `;
    
    const conditions = [];
    const binds = {};
    
    if (filters.status) {
      conditions.push('lr.STATUS = :status');
      binds.status = filters.status;
    }
    
    if (filters.employeeId) {
      conditions.push('lr.EMPLOYEE_ID = :employeeId');
      binds.employeeId = filters.employeeId;
    }
    
    if (filters.resumptionType) {
      conditions.push('lr.RESUMPTION_TYPE = :resumptionType');
      binds.resumptionType = filters.resumptionType;
    }
    
    if (filters.search) {
      conditions.push(`(
        e.FIRST_NAME LIKE '%' || :search || '%' OR 
        e.LAST_NAME LIKE '%' || :search || '%' OR 
        e.EMPLOYEE_CODE LIKE '%' || :search || '%' OR
        lr.REASON LIKE '%' || :search || '%'
      )`);
      binds.search = filters.search;
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY lr.CREATED_AT DESC';
    
    const result = await executeQuery(sql, binds);
    return result.rows;
  }

  // Approve/Reject resumption
  static async updateStatus(resumptionId, status, approvedBy, comments = '') {
    const sql = `
      UPDATE HRMS_LEAVE_RESUMPTIONS SET
        STATUS = :status,
        APPROVED_BY = :approvedBy,
        APPROVED_AT = CURRENT_TIMESTAMP,
        APPROVAL_COMMENTS = :comments,
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE RESUMPTION_ID = :resumptionId
    `;
    
    await executeQuery(sql, {
      resumptionId,
      status,
      approvedBy,
      comments
    });

    // If approved, update the main leave status to RESUMED
    if (status === 'APPROVED') {
      const resumption = await this.findById(resumptionId);
      if (resumption) {
        await this.updateLeaveStatus(resumption.LEAVE_ID, 'RESUMED');
      }
    }
    
    console.log(`✅ Leave resumption ${status.toLowerCase()} successfully`);
  }

  // Update main leave status
  static async updateLeaveStatus(leaveId, status) {
    const sql = `
      UPDATE HRMS_LEAVES SET
        STATUS = :status,
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE LEAVE_ID = :leaveId
    `;
    
    await executeQuery(sql, { leaveId, status });
  }

  // Get resumptions by leave ID
  static async getByLeaveId(leaveId) {
    const sql = `
      SELECT 
        lr.*,
        u1.FIRST_NAME as APPLIED_BY_FIRST_NAME, u1.LAST_NAME as APPLIED_BY_LAST_NAME,
        u2.FIRST_NAME as APPROVED_BY_FIRST_NAME, u2.LAST_NAME as APPROVED_BY_LAST_NAME
      FROM HRMS_LEAVE_RESUMPTIONS lr
      LEFT JOIN HRMS_USERS u1 ON lr.APPLIED_BY = u1.USER_ID
      LEFT JOIN HRMS_USERS u2 ON lr.APPROVED_BY = u2.USER_ID
      WHERE lr.LEAVE_ID = :leaveId
      ORDER BY lr.CREATED_AT DESC
    `;
    
    const result = await executeQuery(sql, { leaveId });
    return result.rows;
  }

  // Get resumptions by employee ID
  static async getByEmployeeId(employeeId) {
    const sql = `
      SELECT 
        lr.*,
        l.LEAVE_TYPE, l.START_DATE as LEAVE_START_DATE, l.END_DATE as LEAVE_END_DATE,
        u1.FIRST_NAME as APPLIED_BY_FIRST_NAME, u1.LAST_NAME as APPLIED_BY_LAST_NAME,
        u2.FIRST_NAME as APPROVED_BY_FIRST_NAME, u2.LAST_NAME as APPROVED_BY_LAST_NAME
      FROM HRMS_LEAVE_RESUMPTIONS lr
      LEFT JOIN HRMS_LEAVES l ON lr.LEAVE_ID = l.LEAVE_ID
      LEFT JOIN HRMS_USERS u1 ON lr.APPLIED_BY = u1.USER_ID
      LEFT JOIN HRMS_USERS u2 ON lr.APPROVED_BY = u2.USER_ID
      WHERE lr.EMPLOYEE_ID = :employeeId
      ORDER BY lr.CREATED_AT DESC
    `;
    
    const result = await executeQuery(sql, { employeeId });
    return result.rows;
  }

  // Mark attendance/payroll as updated
  static async markIntegrationUpdated(resumptionId, type) {
    const field = type === 'attendance' ? 'ATTENDANCE_UPDATED' : 'PAYROLL_UPDATED';
    const sql = `
      UPDATE HRMS_LEAVE_RESUMPTIONS SET
        ${field} = 1,
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE RESUMPTION_ID = :resumptionId
    `;
    
    await executeQuery(sql, { resumptionId });
  }

  // Get statistics
  static async getStatistics() {
    const sql = `
      SELECT 
        COUNT(*) as TOTAL_RESUMPTIONS,
        SUM(CASE WHEN STATUS = 'PENDING' THEN 1 ELSE 0 END) as PENDING_RESUMPTIONS,
        SUM(CASE WHEN STATUS = 'APPROVED' THEN 1 ELSE 0 END) as APPROVED_RESUMPTIONS,
        SUM(CASE WHEN RESUMPTION_TYPE = 'EARLY' THEN 1 ELSE 0 END) as EARLY_RESUMPTIONS,
        SUM(CASE WHEN RESUMPTION_TYPE = 'EXTENDED' THEN 1 ELSE 0 END) as EXTENDED_RESUMPTIONS
      FROM HRMS_LEAVE_RESUMPTIONS
    `;
    
    const result = await executeQuery(sql);
    return result.rows[0];
  }

  // Delete resumption
  static async delete(resumptionId) {
    const sql = 'DELETE FROM HRMS_LEAVE_RESUMPTIONS WHERE RESUMPTION_ID = :resumptionId';
    await executeQuery(sql, { resumptionId });
  }

  // Helper method to calculate total days for payroll
  static calculateAdjustedLeaveDays(originalEndDate, actualResumptionDate) {
    const endDate = new Date(originalEndDate);
    const resumptionDate = new Date(actualResumptionDate);
    
    if (resumptionDate <= endDate) {
      // Early resumption - calculate days to credit back
      const diffTime = Math.abs(endDate - resumptionDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    
    return 0; // No adjustment for on-time or extended leave
  }
}

module.exports = LeaveResumption; 
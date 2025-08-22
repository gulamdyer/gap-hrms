const { executeQuery } = require('../config/database');
const oracledb = require('oracledb');

class Leave {
  // Create leaves table if not exists
  static async createTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_LEAVES (
        LEAVE_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        EMPLOYEE_ID NUMBER NOT NULL,
        LEAVE_TYPE VARCHAR2(50) NOT NULL,
        AVAILABLE_DAYS NUMBER(5,2) DEFAULT 0,
        START_DATE DATE NOT NULL,
        END_DATE DATE NOT NULL,
        TOTAL_DAYS NUMBER(5,2) NOT NULL,
        REASON VARCHAR2(500) NOT NULL,
        STATUS VARCHAR2(20) DEFAULT 'PENDING' CHECK (STATUS IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'ON_LEAVE', 'RESUMED')),
        APPROVED_BY NUMBER,
        APPROVED_AT TIMESTAMP,
        APPROVAL_COMMENTS VARCHAR2(500),
        ATTACHMENT_URL VARCHAR2(500),
        RESUMPTION_APPLIED NUMBER(1) DEFAULT 0 CHECK (RESUMPTION_APPLIED IN (0, 1)),
        ACTUAL_RESUMPTION_DATE DATE,
        RESUMPTION_STATUS VARCHAR2(20) CHECK (RESUMPTION_STATUS IN ('PENDING', 'APPROVED', 'REJECTED')),
        ADJUSTED_DAYS NUMBER(5,2) DEFAULT 0,
        CREATED_BY NUMBER NOT NULL,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_LEAVE_EMPLOYEE FOREIGN KEY (EMPLOYEE_ID) REFERENCES HRMS_EMPLOYEES(EMPLOYEE_ID),
        CONSTRAINT FK_LEAVE_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID),
        CONSTRAINT FK_LEAVE_APPROVED_BY FOREIGN KEY (APPROVED_BY) REFERENCES HRMS_USERS(USER_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_LEAVES table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_LEAVES table already exists');
      } else {
        throw error;
      }
    }
  }

  // Create new leave
  static async create(leaveData) {
    console.log('🔍 Creating leave with data:', leaveData);
    
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
      INSERT INTO HRMS_LEAVES (
        EMPLOYEE_ID, LEAVE_TYPE, AVAILABLE_DAYS, START_DATE, END_DATE,
        TOTAL_DAYS, REASON, STATUS, ATTACHMENT_URL, CREATED_BY
      ) VALUES (
        :employeeId, :leaveType, :availableDays, TO_DATE(:startDate, 'YYYY-MM-DD'), 
        TO_DATE(:endDate, 'YYYY-MM-DD'), :totalDays, :reason, :status, :attachmentUrl, :createdBy
      ) RETURNING LEAVE_ID INTO :leaveId
    `;
    
    const binds = {
      employeeId: leaveData.employeeId,
      leaveType: leaveData.leaveType,
      availableDays: leaveData.availableDays || 0,
      startDate: formatDateForOracle(leaveData.startDate),
      endDate: formatDateForOracle(leaveData.endDate),
      totalDays: leaveData.totalDays,
      reason: leaveData.reason,
      status: leaveData.status || 'PENDING',
      attachmentUrl: leaveData.attachmentUrl || null,
      createdBy: leaveData.createdBy,
      leaveId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };
    
    try {
      const result = await executeQuery(sql, binds);
      const leaveId = result.outBinds.leaveId[0];
      console.log('✅ Leave created successfully with ID:', leaveId);
      return leaveId;
    } catch (error) {
      console.error('❌ Error creating leave:', error);
      throw error;
    }
  }

  // Get leave by ID with employee details
  static async findById(leaveId) {
    const sql = `
      SELECT 
        l.*,
        e.FIRST_NAME as EMPLOYEE_FIRST_NAME,
        e.LAST_NAME as EMPLOYEE_LAST_NAME,
        e.EMPLOYEE_CODE,
        e.DESIGNATION,
        c.FIRST_NAME as CREATED_BY_FIRST_NAME,
        c.LAST_NAME as CREATED_BY_LAST_NAME,
        a.FIRST_NAME as APPROVED_BY_FIRST_NAME,
        a.LAST_NAME as APPROVED_BY_LAST_NAME
      FROM HRMS_LEAVES l
      LEFT JOIN HRMS_EMPLOYEES e ON l.EMPLOYEE_ID = e.EMPLOYEE_ID
      LEFT JOIN HRMS_USERS c ON l.CREATED_BY = c.USER_ID
      LEFT JOIN HRMS_USERS a ON l.APPROVED_BY = a.USER_ID
      WHERE l.LEAVE_ID = :leaveId
    `;
    
    const result = await executeQuery(sql, { leaveId });
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Get all leaves with pagination and filters
  static async getAllLeaves(filters = {}) {
    let sql = `
      SELECT 
        l.*,
        e.FIRST_NAME as EMPLOYEE_FIRST_NAME,
        e.LAST_NAME as EMPLOYEE_LAST_NAME,
        e.EMPLOYEE_CODE,
        e.DESIGNATION,
        c.FIRST_NAME as CREATED_BY_FIRST_NAME,
        c.LAST_NAME as CREATED_BY_LAST_NAME,
        a.FIRST_NAME as APPROVED_BY_FIRST_NAME,
        a.LAST_NAME as APPROVED_BY_LAST_NAME
      FROM HRMS_LEAVES l
      LEFT JOIN HRMS_EMPLOYEES e ON l.EMPLOYEE_ID = e.EMPLOYEE_ID
      LEFT JOIN HRMS_USERS c ON l.CREATED_BY = c.USER_ID
      LEFT JOIN HRMS_USERS a ON l.APPROVED_BY = a.USER_ID
    `;
    
    const conditions = [];
    const binds = {};
    
    if (filters.leaveType) {
      conditions.push('l.LEAVE_TYPE = :leaveType');
      binds.leaveType = filters.leaveType;
    }
    
    if (filters.status) {
      conditions.push('l.STATUS = :status');
      binds.status = filters.status;
    }
    
    if (filters.employeeId) {
      conditions.push('l.EMPLOYEE_ID = :employeeId');
      binds.employeeId = filters.employeeId;
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
    
    if (filters.startDate) {
      conditions.push('l.START_DATE >= TO_DATE(:startDate, "YYYY-MM-DD")');
      binds.startDate = filters.startDate;
    }
    
    if (filters.endDate) {
      conditions.push('l.END_DATE <= TO_DATE(:endDate, "YYYY-MM-DD")');
      binds.endDate = filters.endDate;
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY l.CREATED_AT DESC';
    
    const result = await executeQuery(sql, binds);
    return result.rows;
  }

  // Update leave
  static async update(leaveId, leaveData) {
    console.log('🔍 Updating leave with data:', leaveData);
    
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
      UPDATE HRMS_LEAVES SET
        EMPLOYEE_ID = :employeeId,
        LEAVE_TYPE = :leaveType,
        AVAILABLE_DAYS = :availableDays,
        START_DATE = TO_DATE(:startDate, 'YYYY-MM-DD'),
        END_DATE = TO_DATE(:endDate, 'YYYY-MM-DD'),
        TOTAL_DAYS = :totalDays,
        REASON = :reason,
        STATUS = :status,
        ATTACHMENT_URL = :attachmentUrl,
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE LEAVE_ID = :leaveId
    `;
    
    const binds = {
      leaveId,
      employeeId: leaveData.employeeId,
      leaveType: leaveData.leaveType,
      availableDays: leaveData.availableDays || 0,
      startDate: formatDateForOracle(leaveData.startDate),
      endDate: formatDateForOracle(leaveData.endDate),
      totalDays: leaveData.totalDays,
      reason: leaveData.reason,
      status: leaveData.status,
      attachmentUrl: leaveData.attachmentUrl || null
    };
    
    try {
      await executeQuery(sql, binds);
      console.log('✅ Leave updated successfully');
    } catch (error) {
      console.error('❌ Error updating leave:', error);
      throw error;
    }
  }

  // Approve/Reject leave
  static async updateStatus(leaveId, status, approvedBy, approvalComments = null) {
    const sql = `
      UPDATE HRMS_LEAVES SET
        STATUS = :status,
        APPROVED_BY = :approvedBy,
        APPROVED_AT = CURRENT_TIMESTAMP,
        APPROVAL_COMMENTS = :approvalComments,
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE LEAVE_ID = :leaveId
    `;
    
    const binds = {
      leaveId,
      status,
      approvedBy,
      approvalComments
    };
    
    try {
      await executeQuery(sql, binds);
      console.log('✅ Leave status updated successfully');
    } catch (error) {
      console.error('❌ Error updating leave status:', error);
      throw error;
    }
  }

  // Delete leave
  static async delete(leaveId) {
    const sql = 'DELETE FROM HRMS_LEAVES WHERE LEAVE_ID = :leaveId';
    await executeQuery(sql, { leaveId });
  }

  // Get leaves by employee ID
  static async getByEmployeeId(employeeId) {
    const sql = `
      SELECT 
        l.*,
        c.FIRST_NAME as CREATED_BY_FIRST_NAME,
        c.LAST_NAME as CREATED_BY_LAST_NAME,
        a.FIRST_NAME as APPROVED_BY_FIRST_NAME,
        a.LAST_NAME as APPROVED_BY_LAST_NAME
      FROM HRMS_LEAVES l
      LEFT JOIN HRMS_USERS c ON l.CREATED_BY = c.USER_ID
      LEFT JOIN HRMS_USERS a ON l.APPROVED_BY = a.USER_ID
      WHERE l.EMPLOYEE_ID = :employeeId
      ORDER BY l.CREATED_AT DESC
    `;
    
    const result = await executeQuery(sql, { employeeId });
    return result.rows;
  }

  // Get leave statistics
  static async getStatistics() {
    const sql = `
      SELECT 
        COUNT(*) as TOTAL_LEAVES,
        COUNT(CASE WHEN STATUS = 'PENDING' THEN 1 END) as PENDING_LEAVES,
        COUNT(CASE WHEN STATUS = 'APPROVED' THEN 1 END) as APPROVED_LEAVES,
        COUNT(CASE WHEN STATUS = 'REJECTED' THEN 1 END) as REJECTED_LEAVES,
        SUM(TOTAL_DAYS) as TOTAL_DAYS
      FROM HRMS_LEAVES
    `;
    
    const result = await executeQuery(sql);
    return result.rows[0];
  }

  // Get leave statistics for dashboard
  static async getLeaveStatistics() {
    const sql = `
      SELECT 
        COUNT(CASE WHEN STATUS = 'PENDING' THEN 1 END) as PENDING_LEAVES,
        COUNT(CASE WHEN STATUS = 'ON_LEAVE' THEN 1 END) as ON_LEAVE,
        COUNT(CASE WHEN STATUS = 'APPROVED' THEN 1 END) as APPROVED_LEAVES
      FROM HRMS_LEAVES
      WHERE (STATUS = 'PENDING' OR STATUS = 'ON_LEAVE' OR STATUS = 'APPROVED')
    `;
    
    try {
      const result = await executeQuery(sql);
      const stats = result.rows[0];
      
      return {
        pendingLeaves: parseInt(stats.PENDING_LEAVES) || 0,
        onLeave: parseInt(stats.ON_LEAVE) || 0,
        approvedLeaves: parseInt(stats.APPROVED_LEAVES) || 0
      };
    } catch (error) {
      console.error('Error fetching leave statistics:', error);
      return {
        pendingLeaves: 0,
        onLeave: 0,
        approvedLeaves: 0
      };
    }
  }

  // Get statistics
  static async getByStatus(status) {
    const sql = `
      SELECT 
        l.*,
        e.FIRST_NAME as EMPLOYEE_FIRST_NAME,
        e.LAST_NAME as EMPLOYEE_LAST_NAME,
        e.EMPLOYEE_CODE,
        e.DESIGNATION
      FROM HRMS_LEAVES l
      LEFT JOIN HRMS_EMPLOYEES e ON l.EMPLOYEE_ID = e.EMPLOYEE_ID
      WHERE l.STATUS = :status
      ORDER BY l.CREATED_AT DESC
    `;
    
    const result = await executeQuery(sql, { status });
    return result.rows;
  }

  // Calculate total days between two dates (excluding weekends)
  static calculateTotalDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let totalDays = 0;
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        totalDays++;
      }
    }
    
    return totalDays;
  }

  // Update leave resumption status
  static async updateLeaveResumptionStatus(leaveId, resumptionData) {
    const updateFields = [];
    const binds = { leaveId };

    if (resumptionData.resumptionApplied !== undefined) {
      updateFields.push('RESUMPTION_APPLIED = :resumptionApplied');
      binds.resumptionApplied = resumptionData.resumptionApplied;
    }

    if (resumptionData.actualResumptionDate !== undefined) {
      if (resumptionData.actualResumptionDate === null) {
        updateFields.push('ACTUAL_RESUMPTION_DATE = NULL');
      } else {
        updateFields.push('ACTUAL_RESUMPTION_DATE = TO_DATE(:actualResumptionDate, \'YYYY-MM-DD\')');
        binds.actualResumptionDate = resumptionData.actualResumptionDate;
      }
    }

    if (resumptionData.resumptionStatus !== undefined) {
      if (resumptionData.resumptionStatus === null) {
        updateFields.push('RESUMPTION_STATUS = NULL');
      } else {
        updateFields.push('RESUMPTION_STATUS = :resumptionStatus');
        binds.resumptionStatus = resumptionData.resumptionStatus;
      }
    }

    if (resumptionData.status !== undefined) {
      updateFields.push('STATUS = :status');
      binds.status = resumptionData.status;
    }

    if (resumptionData.adjustedDays !== undefined) {
      updateFields.push('ADJUSTED_DAYS = :adjustedDays');
      binds.adjustedDays = resumptionData.adjustedDays;
    }

    if (updateFields.length > 0) {
      updateFields.push('UPDATED_AT = CURRENT_TIMESTAMP');
      
      const sql = `
        UPDATE HRMS_LEAVES SET
        ${updateFields.join(', ')}
        WHERE LEAVE_ID = :leaveId
      `;

      await executeQuery(sql, binds);
    }
  }
}

module.exports = Leave; 
const { executeQuery } = require('../config/database');
const oracledb = require('oracledb');

class Timesheet {
  // Create timesheets table if not exists
  static async createTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_TIMESHEETS (
        TIMESHEET_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        EMPLOYEE_ID NUMBER NOT NULL,
        TIMESHEET_DATE DATE NOT NULL,
        WEEK_START_DATE DATE NOT NULL,
        WEEK_END_DATE DATE NOT NULL,
        TOTAL_HOURS NUMBER(5,2) DEFAULT 0,
        BREAK_HOURS NUMBER(5,2) DEFAULT 0,
        OVERTIME_HOURS NUMBER(5,2) DEFAULT 0,
        STATUS VARCHAR2(20) DEFAULT 'DRAFT' CHECK (STATUS IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')),
        SUBMITTED_AT TIMESTAMP,
        APPROVED_BY NUMBER,
        APPROVED_AT TIMESTAMP,
        APPROVAL_COMMENTS VARCHAR2(500),
        REJECTION_REASON VARCHAR2(500),
        CREATED_BY NUMBER NOT NULL,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_TIMESHEET_EMPLOYEE FOREIGN KEY (EMPLOYEE_ID) REFERENCES HRMS_EMPLOYEES(EMPLOYEE_ID),
        CONSTRAINT FK_TIMESHEET_APPROVED_BY FOREIGN KEY (APPROVED_BY) REFERENCES HRMS_USERS(USER_ID),
        CONSTRAINT FK_TIMESHEET_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID),
        
        -- Unique constraint for employee and date
        CONSTRAINT UK_TIMESHEET_EMP_DATE UNIQUE (EMPLOYEE_ID, TIMESHEET_DATE)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_TIMESHEETS table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_TIMESHEETS table already exists');
      } else {
        throw error;
      }
    }
  }

  // Helper function to handle date conversion
  static formatDateForOracle(dateString) {
    console.log('🔍 formatDateForOracle input:', dateString, 'type:', typeof dateString);
    if (!dateString || dateString === '') {
      console.log('📊 Date is empty/null, returning null');
      return null;
    }
    if (dateString instanceof Date) {
      const formatted = dateString.toISOString().split('T')[0];
      console.log('📊 Date object converted to:', formatted);
      return formatted;
    }
    if (typeof dateString === 'string') {
      const formatted = dateString.split('T')[0];
      console.log('📊 String date formatted to:', formatted);
      return formatted;
    }
    console.log('📊 Unknown date format, returning null');
    return null;
  }

  // Helper function to get week start date (Monday)
  static getWeekStartDate(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  // Helper function to get week end date (Sunday)
  static getWeekEndDate(date) {
    const weekStart = this.getWeekStartDate(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return weekEnd;
  }

  // Create new timesheet
  static async create(timesheetData) {
    console.log('🔍 Creating timesheet with data:', timesheetData);
    
    const timesheetDate = new Date(timesheetData.timesheetDate);
    const weekStartDate = this.getWeekStartDate(timesheetDate);
    const weekEndDate = this.getWeekEndDate(timesheetDate);
    
    const sql = `
      INSERT INTO HRMS_TIMESHEETS (
        EMPLOYEE_ID, TIMESHEET_DATE, WEEK_START_DATE, WEEK_END_DATE,
        TOTAL_HOURS, BREAK_HOURS, OVERTIME_HOURS, STATUS, CREATED_BY
      ) VALUES (
        :employeeId, TO_DATE(:timesheetDate, 'YYYY-MM-DD'), 
        TO_DATE(:weekStartDate, 'YYYY-MM-DD'), TO_DATE(:weekEndDate, 'YYYY-MM-DD'),
        :totalHours, :breakHours, :overtimeHours, :status, :createdBy
      ) RETURNING TIMESHEET_ID INTO :timesheetId
    `;

    const params = {
      employeeId: timesheetData.employeeId,
      timesheetDate: this.formatDateForOracle(timesheetData.timesheetDate),
      weekStartDate: this.formatDateForOracle(weekStartDate.toISOString()),
      weekEndDate: this.formatDateForOracle(weekEndDate.toISOString()),
      totalHours: timesheetData.totalHours || 0,
      breakHours: timesheetData.breakHours || 0,
      overtimeHours: timesheetData.overtimeHours || 0,
      status: timesheetData.status || 'DRAFT',
      createdBy: timesheetData.createdBy,
      timesheetId: { type: require('oracledb').NUMBER, dir: require('oracledb').BIND_OUT }
    };

    console.log('📊 Executing SQL with params:', params);
    
    try {
      const result = await executeQuery(sql, params);
      const newTimesheetId = result.outBinds.timesheetId[0];
      console.log('✅ Timesheet created successfully with ID:', newTimesheetId);
      return { success: true, timesheetId: newTimesheetId };
    } catch (error) {
      console.error('❌ Error creating timesheet:', error.message);
      throw error;
    }
  }

  // Get all timesheets with filtering
  static async findAll(filters = {}) {
    let sql = `
      SELECT 
        t.TIMESHEET_ID,
        t.EMPLOYEE_ID,
        e.EMPLOYEE_CODE,
        e.FIRST_NAME || ' ' || e.LAST_NAME AS EMPLOYEE_NAME,
        t.TIMESHEET_DATE,
        t.WEEK_START_DATE,
        t.WEEK_END_DATE,
        t.TOTAL_HOURS,
        t.BREAK_HOURS,
        t.OVERTIME_HOURS,
        t.STATUS,
        t.SUBMITTED_AT,
        t.APPROVED_BY,
        a.FIRST_NAME || ' ' || a.LAST_NAME AS APPROVED_BY_NAME,
        t.APPROVED_AT,
        t.APPROVAL_COMMENTS,
        t.REJECTION_REASON,
        t.CREATED_BY,
        u.FIRST_NAME || ' ' || u.LAST_NAME AS CREATED_BY_NAME,
        t.CREATED_AT,
        t.UPDATED_AT,
        (SELECT COUNT(*) FROM HRMS_TIMESHEET_ENTRIES te WHERE te.TIMESHEET_ID = t.TIMESHEET_ID) AS ENTRY_COUNT
      FROM HRMS_TIMESHEETS t
      LEFT JOIN HRMS_EMPLOYEES e ON t.EMPLOYEE_ID = e.EMPLOYEE_ID
      LEFT JOIN HRMS_USERS u ON t.CREATED_BY = u.USER_ID
      LEFT JOIN HRMS_USERS a ON t.APPROVED_BY = a.USER_ID
      WHERE 1=1
    `;

    const params = {};
    
    if (filters.employeeId) {
      sql += ` AND t.EMPLOYEE_ID = :employeeId`;
      params.employeeId = filters.employeeId;
    }
    
    if (filters.status) {
      sql += ` AND t.STATUS = :status`;
      params.status = filters.status;
    }
    
    if (filters.startDate) {
      sql += ` AND t.TIMESHEET_DATE >= TO_DATE(:startDate, 'YYYY-MM-DD')`;
      params.startDate = filters.startDate;
    }
    
    if (filters.endDate) {
      sql += ` AND t.TIMESHEET_DATE <= TO_DATE(:endDate, 'YYYY-MM-DD')`;
      params.endDate = filters.endDate;
    }

    sql += ` ORDER BY t.TIMESHEET_DATE DESC, e.FIRST_NAME, e.LAST_NAME`;

    try {
      const result = await executeQuery(sql, params);
      return result.rows || [];
    } catch (error) {
      console.error('❌ Error fetching timesheets:', error.message);
      throw error;
    }
  }

  // Get timesheet by ID with entries
  static async findById(timesheetId) {
    const sql = `
      SELECT 
        t.TIMESHEET_ID,
        t.EMPLOYEE_ID,
        e.EMPLOYEE_CODE,
        e.FIRST_NAME || ' ' || e.LAST_NAME AS EMPLOYEE_NAME,
        t.TIMESHEET_DATE,
        t.WEEK_START_DATE,
        t.WEEK_END_DATE,
        t.TOTAL_HOURS,
        t.BREAK_HOURS,
        t.OVERTIME_HOURS,
        t.STATUS,
        t.SUBMITTED_AT,
        t.APPROVED_BY,
        a.FIRST_NAME || ' ' || a.LAST_NAME AS APPROVED_BY_NAME,
        t.APPROVED_AT,
        t.APPROVAL_COMMENTS,
        t.REJECTION_REASON,
        t.CREATED_BY,
        u.FIRST_NAME || ' ' || u.LAST_NAME AS CREATED_BY_NAME,
        t.CREATED_AT,
        t.UPDATED_AT
      FROM HRMS_TIMESHEETS t
      LEFT JOIN HRMS_EMPLOYEES e ON t.EMPLOYEE_ID = e.EMPLOYEE_ID
      LEFT JOIN HRMS_USERS u ON t.CREATED_BY = u.USER_ID
      LEFT JOIN HRMS_USERS a ON t.APPROVED_BY = a.USER_ID
      WHERE t.TIMESHEET_ID = :timesheetId
    `;

    try {
      const result = await executeQuery(sql, { timesheetId });
      return result.rows?.[0] || null;
    } catch (error) {
      console.error('❌ Error fetching timesheet by ID:', error.message);
      throw error;
    }
  }

  // Update timesheet
  static async update(timesheetId, timesheetData) {
    console.log('🔍 Updating timesheet with ID:', timesheetId, 'Data:', timesheetData);
    
    const sql = `
      UPDATE HRMS_TIMESHEETS SET
        TOTAL_HOURS = :totalHours,
        BREAK_HOURS = :breakHours,
        OVERTIME_HOURS = :overtimeHours,
        STATUS = :status,
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE TIMESHEET_ID = :timesheetId
    `;

    const params = {
      timesheetId,
      totalHours: timesheetData.totalHours || 0,
      breakHours: timesheetData.breakHours || 0,
      overtimeHours: timesheetData.overtimeHours || 0,
      status: timesheetData.status
    };

    try {
      const result = await executeQuery(sql, params);
      console.log('✅ Timesheet updated successfully');
      return { success: true, rowsAffected: result.rowsAffected };
    } catch (error) {
      console.error('❌ Error updating timesheet:', error.message);
      throw error;
    }
  }

  // Update timesheet status (submit, approve, reject)
  static async updateStatus(timesheetId, statusData) {
    console.log('🔍 Updating timesheet status:', timesheetId, statusData);
    
    let sql, params;

    if (statusData.status === 'SUBMITTED') {
      sql = `
        UPDATE HRMS_TIMESHEETS SET
          STATUS = 'SUBMITTED',
          SUBMITTED_AT = CURRENT_TIMESTAMP,
          UPDATED_AT = CURRENT_TIMESTAMP
        WHERE TIMESHEET_ID = :timesheetId
      `;
      params = { timesheetId };
    } else if (statusData.status === 'APPROVED') {
      sql = `
        UPDATE HRMS_TIMESHEETS SET
          STATUS = 'APPROVED',
          APPROVED_BY = :approvedBy,
          APPROVED_AT = CURRENT_TIMESTAMP,
          APPROVAL_COMMENTS = :approvalComments,
          UPDATED_AT = CURRENT_TIMESTAMP
        WHERE TIMESHEET_ID = :timesheetId
      `;
      params = {
        timesheetId,
        approvedBy: statusData.approvedBy,
        approvalComments: statusData.approvalComments || null
      };
    } else if (statusData.status === 'REJECTED') {
      sql = `
        UPDATE HRMS_TIMESHEETS SET
          STATUS = 'REJECTED',
          APPROVED_BY = :approvedBy,
          APPROVED_AT = CURRENT_TIMESTAMP,
          REJECTION_REASON = :rejectionReason,
          UPDATED_AT = CURRENT_TIMESTAMP
        WHERE TIMESHEET_ID = :timesheetId
      `;
      params = {
        timesheetId,
        approvedBy: statusData.approvedBy,
        rejectionReason: statusData.rejectionReason || null
      };
    }

    try {
      const result = await executeQuery(sql, params);
      console.log('✅ Timesheet status updated successfully');
      return { success: true, rowsAffected: result.rowsAffected };
    } catch (error) {
      console.error('❌ Error updating timesheet status:', error.message);
      throw error;
    }
  }

  // Delete timesheet
  static async delete(timesheetId) {
    const sql = `DELETE FROM HRMS_TIMESHEETS WHERE TIMESHEET_ID = :timesheetId`;
    
    try {
      const result = await executeQuery(sql, { timesheetId });
      console.log('✅ Timesheet deleted successfully');
      return { success: true, rowsAffected: result.rowsAffected };
    } catch (error) {
      console.error('❌ Error deleting timesheet:', error.message);
      throw error;
    }
  }

  // Get timesheet statistics
  static async getStatistics(filters = {}) {
    let sql = `
      SELECT 
        COUNT(*) AS total_timesheets,
        COUNT(CASE WHEN STATUS = 'DRAFT' THEN 1 END) AS draft_count,
        COUNT(CASE WHEN STATUS = 'SUBMITTED' THEN 1 END) AS submitted_count,
        COUNT(CASE WHEN STATUS = 'APPROVED' THEN 1 END) AS approved_count,
        COUNT(CASE WHEN STATUS = 'REJECTED' THEN 1 END) AS rejected_count,
        AVG(TOTAL_HOURS) AS avg_hours_per_day,
        SUM(TOTAL_HOURS) AS total_hours_logged
      FROM HRMS_TIMESHEETS
      WHERE 1=1
    `;

    const params = {};
    
    if (filters.employeeId) {
      sql += ` AND EMPLOYEE_ID = :employeeId`;
      params.employeeId = filters.employeeId;
    }
    
    if (filters.startDate) {
      sql += ` AND TIMESHEET_DATE >= TO_DATE(:startDate, 'YYYY-MM-DD')`;
      params.startDate = filters.startDate;
    }
    
    if (filters.endDate) {
      sql += ` AND TIMESHEET_DATE <= TO_DATE(:endDate, 'YYYY-MM-DD')`;
      params.endDate = filters.endDate;
    }

    try {
      const result = await executeQuery(sql, params);
      return result.rows?.[0] || {};
    } catch (error) {
      console.error('❌ Error fetching timesheet statistics:', error.message);
      throw error;
    }
  }
}

module.exports = Timesheet; 
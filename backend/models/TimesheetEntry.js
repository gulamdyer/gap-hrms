const { executeQuery } = require('../config/database');
const oracledb = require('oracledb');

class TimesheetEntry {
  // Create timesheet entries table if not exists
  static async createTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_TIMESHEET_ENTRIES (
        ENTRY_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        TIMESHEET_ID NUMBER NOT NULL,
        PROJECT_ID NUMBER,
        TASK_DESCRIPTION VARCHAR2(500) NOT NULL,
        START_TIME TIMESTAMP,
        END_TIME TIMESTAMP,
        TOTAL_HOURS NUMBER(5,2) NOT NULL,
        BREAK_HOURS NUMBER(5,2) DEFAULT 0,
        OVERTIME_HOURS NUMBER(5,2) DEFAULT 0,
        IS_BILLABLE NUMBER(1) DEFAULT 1 CHECK (IS_BILLABLE IN (0, 1)),
        ACTIVITY_TYPE VARCHAR2(50) DEFAULT 'DEVELOPMENT' CHECK (
          ACTIVITY_TYPE IN ('DEVELOPMENT', 'TESTING', 'MEETING', 'DOCUMENTATION', 'TRAINING', 'SUPPORT', 'RESEARCH', 'OTHER')
        ),
        COMMENTS VARCHAR2(1000),
        CREATED_BY NUMBER NOT NULL,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_ENTRY_TIMESHEET FOREIGN KEY (TIMESHEET_ID) REFERENCES HRMS_TIMESHEETS(TIMESHEET_ID) ON DELETE CASCADE,
        CONSTRAINT FK_ENTRY_PROJECT FOREIGN KEY (PROJECT_ID) REFERENCES HRMS_PROJECTS(PROJECT_ID),
        CONSTRAINT FK_ENTRY_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID),
        
        -- Check constraints
        CONSTRAINT CHK_ENTRY_HOURS_POSITIVE CHECK (TOTAL_HOURS > 0),
        CONSTRAINT CHK_ENTRY_TIME_LOGICAL CHECK (END_TIME > START_TIME OR (START_TIME IS NULL AND END_TIME IS NULL))
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_TIMESHEET_ENTRIES table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_TIMESHEET_ENTRIES table already exists');
      } else {
        throw error;
      }
    }
  }

  // Helper function to handle timestamp conversion
  static formatTimestampForOracle(timestampString) {
    console.log('🔍 formatTimestampForOracle input:', timestampString, 'type:', typeof timestampString);
    if (!timestampString || timestampString === '') {
      console.log('📊 Timestamp is empty/null, returning null');
      return null;
    }
    if (timestampString instanceof Date) {
      const formatted = timestampString.toISOString();
      console.log('📊 Date object converted to:', formatted);
      return formatted;
    }
    if (typeof timestampString === 'string') {
      // Ensure ISO format
      const formatted = new Date(timestampString).toISOString();
      console.log('📊 String timestamp formatted to:', formatted);
      return formatted;
    }
    console.log('📊 Unknown timestamp format, returning null');
    return null;
  }

  // Create new timesheet entry
  static async create(entryData) {
    console.log('🔍 Creating timesheet entry with data:', entryData);
    
    const sql = `
      INSERT INTO HRMS_TIMESHEET_ENTRIES (
        TIMESHEET_ID, PROJECT_ID, TASK_DESCRIPTION, START_TIME, END_TIME,
        TOTAL_HOURS, BREAK_HOURS, OVERTIME_HOURS, IS_BILLABLE,
        ACTIVITY_TYPE, COMMENTS, CREATED_BY
      ) VALUES (
        :timesheetId, :projectId, :taskDescription, 
        TO_TIMESTAMP(:startTime, 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
        TO_TIMESTAMP(:endTime, 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
        :totalHours, :breakHours, :overtimeHours, :isBillable,
        :activityType, :comments, :createdBy
      ) RETURNING ENTRY_ID INTO :entryId
    `;

    const params = {
      timesheetId: entryData.timesheetId,
      projectId: entryData.projectId || null,
      taskDescription: entryData.taskDescription,
      startTime: this.formatTimestampForOracle(entryData.startTime),
      endTime: this.formatTimestampForOracle(entryData.endTime),
      totalHours: entryData.totalHours,
      breakHours: entryData.breakHours || 0,
      overtimeHours: entryData.overtimeHours || 0,
      isBillable: entryData.isBillable ? 1 : 0,
      activityType: entryData.activityType || 'DEVELOPMENT',
      comments: entryData.comments || null,
      createdBy: entryData.createdBy,
      entryId: { type: require('oracledb').NUMBER, dir: require('oracledb').BIND_OUT }
    };

    console.log('📊 Executing SQL with params:', params);
    
    try {
      const result = await executeQuery(sql, params);
      const newEntryId = result.outBinds.entryId[0];
      console.log('✅ Timesheet entry created successfully with ID:', newEntryId);
      
      // Update parent timesheet totals
      await this.updateTimesheetTotals(entryData.timesheetId);
      
      return { success: true, entryId: newEntryId };
    } catch (error) {
      console.error('❌ Error creating timesheet entry:', error.message);
      throw error;
    }
  }

  // Get all entries for a timesheet
  static async findByTimesheetId(timesheetId) {
    const sql = `
      SELECT 
        te.ENTRY_ID,
        te.TIMESHEET_ID,
        te.PROJECT_ID,
        p.PROJECT_CODE,
        p.PROJECT_NAME,
        te.TASK_DESCRIPTION,
        te.START_TIME,
        te.END_TIME,
        te.TOTAL_HOURS,
        te.BREAK_HOURS,
        te.OVERTIME_HOURS,
        te.IS_BILLABLE,
        te.ACTIVITY_TYPE,
        te.COMMENTS,
        te.CREATED_BY,
        u.FIRST_NAME || ' ' || u.LAST_NAME AS CREATED_BY_NAME,
        te.CREATED_AT,
        te.UPDATED_AT
      FROM HRMS_TIMESHEET_ENTRIES te
      LEFT JOIN HRMS_PROJECTS p ON te.PROJECT_ID = p.PROJECT_ID
      LEFT JOIN HRMS_USERS u ON te.CREATED_BY = u.USER_ID
      WHERE te.TIMESHEET_ID = :timesheetId
      ORDER BY te.START_TIME DESC, te.CREATED_AT DESC
    `;

    try {
      const result = await executeQuery(sql, { timesheetId });
      return result.rows || [];
    } catch (error) {
      console.error('❌ Error fetching timesheet entries:', error.message);
      throw error;
    }
  }

  // Get entry by ID
  static async findById(entryId) {
    const sql = `
      SELECT 
        te.ENTRY_ID,
        te.TIMESHEET_ID,
        te.PROJECT_ID,
        p.PROJECT_CODE,
        p.PROJECT_NAME,
        te.TASK_DESCRIPTION,
        te.START_TIME,
        te.END_TIME,
        te.TOTAL_HOURS,
        te.BREAK_HOURS,
        te.OVERTIME_HOURS,
        te.IS_BILLABLE,
        te.ACTIVITY_TYPE,
        te.COMMENTS,
        te.CREATED_BY,
        u.FIRST_NAME || ' ' || u.LAST_NAME AS CREATED_BY_NAME,
        te.CREATED_AT,
        te.UPDATED_AT
      FROM HRMS_TIMESHEET_ENTRIES te
      LEFT JOIN HRMS_PROJECTS p ON te.PROJECT_ID = p.PROJECT_ID
      LEFT JOIN HRMS_USERS u ON te.CREATED_BY = u.USER_ID
      WHERE te.ENTRY_ID = :entryId
    `;

    try {
      const result = await executeQuery(sql, { entryId });
      return result.rows?.[0] || null;
    } catch (error) {
      console.error('❌ Error fetching timesheet entry by ID:', error.message);
      throw error;
    }
  }

  // Update timesheet entry
  static async update(entryId, entryData) {
    console.log('🔍 Updating timesheet entry with ID:', entryId, 'Data:', entryData);
    
    const sql = `
      UPDATE HRMS_TIMESHEET_ENTRIES SET
        PROJECT_ID = :projectId,
        TASK_DESCRIPTION = :taskDescription,
        START_TIME = TO_TIMESTAMP(:startTime, 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
        END_TIME = TO_TIMESTAMP(:endTime, 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
        TOTAL_HOURS = :totalHours,
        BREAK_HOURS = :breakHours,
        OVERTIME_HOURS = :overtimeHours,
        IS_BILLABLE = :isBillable,
        ACTIVITY_TYPE = :activityType,
        COMMENTS = :comments,
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE ENTRY_ID = :entryId
    `;

    const params = {
      entryId,
      projectId: entryData.projectId || null,
      taskDescription: entryData.taskDescription,
      startTime: this.formatTimestampForOracle(entryData.startTime),
      endTime: this.formatTimestampForOracle(entryData.endTime),
      totalHours: entryData.totalHours,
      breakHours: entryData.breakHours || 0,
      overtimeHours: entryData.overtimeHours || 0,
      isBillable: entryData.isBillable ? 1 : 0,
      activityType: entryData.activityType || 'DEVELOPMENT',
      comments: entryData.comments || null
    };

    try {
      const result = await executeQuery(sql, params);
      console.log('✅ Timesheet entry updated successfully');
      
      // Update parent timesheet totals
      await this.updateTimesheetTotals(entryData.timesheetId);
      
      return { success: true, rowsAffected: result.rowsAffected };
    } catch (error) {
      console.error('❌ Error updating timesheet entry:', error.message);
      throw error;
    }
  }

  // Delete timesheet entry
  static async delete(entryId) {
    // First get the timesheet ID for updating totals
    const entryResult = await this.findById(entryId);
    if (!entryResult) {
      throw new Error('Timesheet entry not found');
    }
    
    const timesheetId = entryResult.TIMESHEET_ID;
    
    const sql = `DELETE FROM HRMS_TIMESHEET_ENTRIES WHERE ENTRY_ID = :entryId`;
    
    try {
      const result = await executeQuery(sql, { entryId });
      console.log('✅ Timesheet entry deleted successfully');
      
      // Update parent timesheet totals
      await this.updateTimesheetTotals(timesheetId);
      
      return { success: true, rowsAffected: result.rowsAffected };
    } catch (error) {
      console.error('❌ Error deleting timesheet entry:', error.message);
      throw error;
    }
  }

  // Update timesheet totals based on entries
  static async updateTimesheetTotals(timesheetId) {
    const sql = `
      UPDATE HRMS_TIMESHEETS SET
        TOTAL_HOURS = (
          SELECT COALESCE(SUM(TOTAL_HOURS), 0) 
          FROM HRMS_TIMESHEET_ENTRIES 
          WHERE TIMESHEET_ID = :timesheetId
        ),
        BREAK_HOURS = (
          SELECT COALESCE(SUM(BREAK_HOURS), 0) 
          FROM HRMS_TIMESHEET_ENTRIES 
          WHERE TIMESHEET_ID = :timesheetId
        ),
        OVERTIME_HOURS = (
          SELECT COALESCE(SUM(OVERTIME_HOURS), 0) 
          FROM HRMS_TIMESHEET_ENTRIES 
          WHERE TIMESHEET_ID = :timesheetId
        ),
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE TIMESHEET_ID = :timesheetId
    `;

    try {
      await executeQuery(sql, { timesheetId });
      console.log('✅ Timesheet totals updated successfully');
    } catch (error) {
      console.error('❌ Error updating timesheet totals:', error.message);
      throw error;
    }
  }

  // Get entries by project
  static async findByProjectId(projectId, filters = {}) {
    let sql = `
      SELECT 
        te.ENTRY_ID,
        te.TIMESHEET_ID,
        t.TIMESHEET_DATE,
        t.EMPLOYEE_ID,
        e.EMPLOYEE_CODE,
        e.FIRST_NAME || ' ' || e.LAST_NAME AS EMPLOYEE_NAME,
        te.TASK_DESCRIPTION,
        te.START_TIME,
        te.END_TIME,
        te.TOTAL_HOURS,
        te.BREAK_HOURS,
        te.OVERTIME_HOURS,
        te.IS_BILLABLE,
        te.ACTIVITY_TYPE,
        te.COMMENTS,
        te.CREATED_AT
      FROM HRMS_TIMESHEET_ENTRIES te
      JOIN HRMS_TIMESHEETS t ON te.TIMESHEET_ID = t.TIMESHEET_ID
      JOIN HRMS_EMPLOYEES e ON t.EMPLOYEE_ID = e.EMPLOYEE_ID
      WHERE te.PROJECT_ID = :projectId
    `;

    const params = { projectId };
    
    if (filters.startDate) {
      sql += ` AND t.TIMESHEET_DATE >= TO_DATE(:startDate, 'YYYY-MM-DD')`;
      params.startDate = filters.startDate;
    }
    
    if (filters.endDate) {
      sql += ` AND t.TIMESHEET_DATE <= TO_DATE(:endDate, 'YYYY-MM-DD')`;
      params.endDate = filters.endDate;
    }

    sql += ` ORDER BY t.TIMESHEET_DATE DESC, te.START_TIME DESC`;

    try {
      const result = await executeQuery(sql, params);
      return result.rows || [];
    } catch (error) {
      console.error('❌ Error fetching entries by project:', error.message);
      throw error;
    }
  }

  // Get time tracking statistics
  static async getTimeTrackingStats(filters = {}) {
    let sql = `
      SELECT 
        COUNT(*) AS total_entries,
        SUM(TOTAL_HOURS) AS total_hours,
        SUM(BREAK_HOURS) AS total_break_hours,
        SUM(OVERTIME_HOURS) AS total_overtime_hours,
        SUM(CASE WHEN IS_BILLABLE = 1 THEN TOTAL_HOURS ELSE 0 END) AS billable_hours,
        COUNT(DISTINCT te.TIMESHEET_ID) AS total_timesheets,
        COUNT(DISTINCT PROJECT_ID) AS projects_worked_on,
        AVG(TOTAL_HOURS) AS avg_hours_per_entry
      FROM HRMS_TIMESHEET_ENTRIES te
      JOIN HRMS_TIMESHEETS t ON te.TIMESHEET_ID = t.TIMESHEET_ID
      WHERE 1=1
    `;

    const params = {};
    
    if (filters.employeeId) {
      sql += ` AND t.EMPLOYEE_ID = :employeeId`;
      params.employeeId = filters.employeeId;
    }
    
    if (filters.projectId) {
      sql += ` AND te.PROJECT_ID = :projectId`;
      params.projectId = filters.projectId;
    }
    
    if (filters.startDate) {
      sql += ` AND t.TIMESHEET_DATE >= TO_DATE(:startDate, 'YYYY-MM-DD')`;
      params.startDate = filters.startDate;
    }
    
    if (filters.endDate) {
      sql += ` AND t.TIMESHEET_DATE <= TO_DATE(:endDate, 'YYYY-MM-DD')`;
      params.endDate = filters.endDate;
    }

    try {
      const result = await executeQuery(sql, params);
      return result.rows?.[0] || {};
    } catch (error) {
      console.error('❌ Error fetching time tracking statistics:', error.message);
      throw error;
    }
  }
}

module.exports = TimesheetEntry; 
const { executeQuery } = require('../config/database');
const oracledb = require('oracledb');

class Attendance {
  // Create attendance tables if not exists
  static async createTables() {
    await this.createAttendanceTable();
    await this.createAttendanceRulesTable();
    await this.createBiometricDevicesTable();
    await this.createAttendanceLogsTable();
    await this.createLeaveBalanceTable();
    await this.createOvertimeTable();
    await this.createAttendanceSettingsTable();
  }

  // Main attendance table
  static async createAttendanceTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_ATTENDANCE (
        ATTENDANCE_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        EMPLOYEE_ID NUMBER NOT NULL,
        ATTENDANCE_DATE DATE NOT NULL,
        SHIFT_ID NUMBER,
        SCHEDULED_IN_TIME VARCHAR2(5),
        SCHEDULED_OUT_TIME VARCHAR2(5),
        ACTUAL_IN_TIME VARCHAR2(5),
        ACTUAL_OUT_TIME VARCHAR2(5),
        IN_LOCATION VARCHAR2(100),
        OUT_LOCATION VARCHAR2(100),
        IN_DEVICE_ID VARCHAR2(50),
        OUT_DEVICE_ID VARCHAR2(50),
        IN_METHOD VARCHAR2(20) DEFAULT 'MANUAL' CHECK (IN_METHOD IN ('MANUAL', 'BIOMETRIC', 'CARD', 'MOBILE')),
        OUT_METHOD VARCHAR2(20) DEFAULT 'MANUAL' CHECK (OUT_METHOD IN ('MANUAL', 'BIOMETRIC', 'CARD', 'MOBILE')),
        WORK_HOURS NUMBER(5,2),
        OVERTIME_HOURS NUMBER(5,2) DEFAULT 0,
        LATE_MINUTES NUMBER(3) DEFAULT 0,
        EARLY_LEAVE_MINUTES NUMBER(3) DEFAULT 0,
        STATUS VARCHAR2(20) DEFAULT 'PRESENT' CHECK (STATUS IN ('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'HOLIDAY', 'WEEKEND')),
        LEAVE_TYPE VARCHAR2(20),
        REMARKS VARCHAR2(500),
        APPROVED_BY NUMBER,
        APPROVED_AT TIMESTAMP,
        CREATED_BY NUMBER,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT FK_ATTENDANCE_EMPLOYEE FOREIGN KEY (EMPLOYEE_ID) REFERENCES HRMS_EMPLOYEES(EMPLOYEE_ID),
        CONSTRAINT FK_ATTENDANCE_SHIFT FOREIGN KEY (SHIFT_ID) REFERENCES HRMS_SHIFTS(SHIFT_ID),
        CONSTRAINT FK_ATTENDANCE_APPROVED_BY FOREIGN KEY (APPROVED_BY) REFERENCES HRMS_USERS(USER_ID),
        CONSTRAINT FK_ATTENDANCE_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID),
        CONSTRAINT UQ_ATTENDANCE_EMPLOYEE_DATE UNIQUE (EMPLOYEE_ID, ATTENDANCE_DATE)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_ATTENDANCE table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_ATTENDANCE table already exists');
      } else {
        throw error;
      }
    }
  }

  // Attendance rules table
  static async createAttendanceRulesTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_ATTENDANCE_RULES (
        RULE_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        RULE_NAME VARCHAR2(100) NOT NULL,
        RULE_TYPE VARCHAR2(20) NOT NULL CHECK (RULE_TYPE IN ('LATE', 'EARLY_LEAVE', 'OVERTIME', 'ABSENT', 'HALF_DAY')),
        APPLICABLE_FROM VARCHAR2(20) DEFAULT 'ALL' CHECK (APPLICABLE_FROM IN ('ALL', 'DEPARTMENT', 'DESIGNATION', 'EMPLOYEE')),
        APPLICABLE_TO VARCHAR2(500),
        CONDITION_TYPE VARCHAR2(20) CHECK (CONDITION_TYPE IN ('MINUTES', 'PERCENTAGE', 'HOURS')),
        CONDITION_VALUE NUMBER(5,2),
        ACTION_TYPE VARCHAR2(20) CHECK (ACTION_TYPE IN ('WARNING', 'DEDUCTION', 'OVERTIME', 'LEAVE_DEDUCTION')),
        ACTION_VALUE NUMBER(5,2),
        IS_ACTIVE NUMBER(1) DEFAULT 1 CHECK (IS_ACTIVE IN (0, 1)),
        DESCRIPTION VARCHAR2(500),
        CREATED_BY NUMBER,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT FK_ATTENDANCE_RULES_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_ATTENDANCE_RULES table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_ATTENDANCE_RULES table already exists');
      } else {
        throw error;
      }
    }
  }

  // Biometric devices table
  static async createBiometricDevicesTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_BIOMETRIC_DEVICES (
        DEVICE_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        DEVICE_NAME VARCHAR2(100) NOT NULL,
        DEVICE_CODE VARCHAR2(50) UNIQUE NOT NULL,
        DEVICE_TYPE VARCHAR2(20) CHECK (DEVICE_TYPE IN ('FINGERPRINT', 'FACE', 'CARD', 'MOBILE', 'PALM')),
        LOCATION VARCHAR2(100),
        IP_ADDRESS VARCHAR2(15),
        PORT_NUMBER NUMBER(5),
        STATUS VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (STATUS IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE')),
        LAST_SYNC_TIME TIMESTAMP,
        DEVICE_INFO VARCHAR2(500),
        CREATED_BY NUMBER,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT FK_BIOMETRIC_DEVICES_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_BIOMETRIC_DEVICES table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_BIOMETRIC_DEVICES table already exists');
      } else {
        throw error;
      }
    }
  }

  // Attendance logs table (for raw biometric data)
  static async createAttendanceLogsTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_ATTENDANCE_LOGS (
        LOG_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        DEVICE_ID NUMBER,
        EMPLOYEE_ID NUMBER,
        LOG_TIME TIMESTAMP NOT NULL,
        LOG_TYPE VARCHAR2(20) CHECK (LOG_TYPE IN ('IN', 'OUT', 'BREAK_START', 'BREAK_END')),
        BIOMETRIC_DATA VARCHAR2(1000),
        VERIFICATION_METHOD VARCHAR2(20) CHECK (VERIFICATION_METHOD IN ('FINGERPRINT', 'FACE', 'CARD', 'PIN', 'MOBILE')),
        VERIFICATION_STATUS VARCHAR2(20) DEFAULT 'SUCCESS' CHECK (VERIFICATION_STATUS IN ('SUCCESS', 'FAILED', 'PENDING')),
        DEVICE_RESPONSE VARCHAR2(500),
        PROCESSED NUMBER(1) DEFAULT 0 CHECK (PROCESSED IN (0, 1)),
        PROCESSED_AT TIMESTAMP,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT FK_ATTENDANCE_LOGS_DEVICE FOREIGN KEY (DEVICE_ID) REFERENCES HRMS_BIOMETRIC_DEVICES(DEVICE_ID),
        CONSTRAINT FK_ATTENDANCE_LOGS_EMPLOYEE FOREIGN KEY (EMPLOYEE_ID) REFERENCES HRMS_EMPLOYEES(EMPLOYEE_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_ATTENDANCE_LOGS table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_ATTENDANCE_LOGS table already exists');
      } else {
        throw error;
      }
    }
  }

  // Leave balance table
  static async createLeaveBalanceTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_LEAVE_BALANCE (
        BALANCE_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        EMPLOYEE_ID NUMBER NOT NULL,
        LEAVE_TYPE VARCHAR2(20) NOT NULL,
        YEAR NUMBER(4) NOT NULL,
        TOTAL_LEAVES NUMBER(5,2) DEFAULT 0,
        USED_LEAVES NUMBER(5,2) DEFAULT 0,
        BALANCE_LEAVES NUMBER(5,2) DEFAULT 0,
        CARRIED_FORWARD NUMBER(5,2) DEFAULT 0,
        CREATED_BY NUMBER,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT FK_LEAVE_BALANCE_EMPLOYEE FOREIGN KEY (EMPLOYEE_ID) REFERENCES HRMS_EMPLOYEES(EMPLOYEE_ID),
        CONSTRAINT FK_LEAVE_BALANCE_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID),
        CONSTRAINT UQ_LEAVE_BALANCE_EMPLOYEE_TYPE_YEAR UNIQUE (EMPLOYEE_ID, LEAVE_TYPE, YEAR)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_LEAVE_BALANCE table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_LEAVE_BALANCE table already exists');
      } else {
        throw error;
      }
    }
  }

  // Overtime table
  static async createOvertimeTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_OVERTIME (
        OVERTIME_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        EMPLOYEE_ID NUMBER NOT NULL,
        ATTENDANCE_ID NUMBER,
        OVERTIME_DATE DATE NOT NULL,
        START_TIME VARCHAR2(5) NOT NULL,
        END_TIME VARCHAR2(5) NOT NULL,
        HOURS_WORKED NUMBER(5,2) NOT NULL,
        OVERTIME_HOURS NUMBER(5,2) NOT NULL,
        RATE_TYPE VARCHAR2(20) DEFAULT 'NORMAL' CHECK (RATE_TYPE IN ('NORMAL', 'HOLIDAY', 'NIGHT')),
        RATE_MULTIPLIER NUMBER(3,2) DEFAULT 1.5,
        REASON VARCHAR2(500),
        STATUS VARCHAR2(20) DEFAULT 'PENDING' CHECK (STATUS IN ('PENDING', 'APPROVED', 'REJECTED')),
        APPROVED_BY NUMBER,
        APPROVED_AT TIMESTAMP,
        APPROVAL_REMARKS VARCHAR2(500),
        CREATED_BY NUMBER,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT FK_OVERTIME_EMPLOYEE FOREIGN KEY (EMPLOYEE_ID) REFERENCES HRMS_EMPLOYEES(EMPLOYEE_ID),
        CONSTRAINT FK_OVERTIME_ATTENDANCE FOREIGN KEY (ATTENDANCE_ID) REFERENCES HRMS_ATTENDANCE(ATTENDANCE_ID),
        CONSTRAINT FK_OVERTIME_APPROVED_BY FOREIGN KEY (APPROVED_BY) REFERENCES HRMS_USERS(USER_ID),
        CONSTRAINT FK_OVERTIME_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_OVERTIME table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_OVERTIME table already exists');
      } else {
        throw error;
      }
    }
  }

  // Attendance settings table
  static async createAttendanceSettingsTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_ATTENDANCE_SETTINGS (
        SETTING_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        SETTING_KEY VARCHAR2(100) UNIQUE NOT NULL,
        SETTING_VALUE VARCHAR2(500),
        SETTING_TYPE VARCHAR2(20) DEFAULT 'STRING' CHECK (SETTING_TYPE IN ('STRING', 'NUMBER', 'BOOLEAN', 'JSON')),
        DESCRIPTION VARCHAR2(500),
        IS_ACTIVE NUMBER(1) DEFAULT 1 CHECK (IS_ACTIVE IN (0, 1)),
        CREATED_BY NUMBER,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT FK_ATTENDANCE_SETTINGS_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_ATTENDANCE_SETTINGS table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_ATTENDANCE_SETTINGS table already exists');
      } else {
        throw error;
      }
    }
  }

  // CRUD Operations for Attendance
  static async createAttendance(attendanceData, createdBy) {
    const sql = `
      INSERT INTO HRMS_ATTENDANCE (
        EMPLOYEE_ID, ATTENDANCE_DATE, SHIFT_ID, SCHEDULED_IN_TIME, SCHEDULED_OUT_TIME,
        ACTUAL_IN_TIME, ACTUAL_OUT_TIME, IN_LOCATION, OUT_LOCATION, IN_DEVICE_ID,
        OUT_DEVICE_ID, IN_METHOD, OUT_METHOD, WORK_HOURS, OVERTIME_HOURS,
        LATE_MINUTES, EARLY_LEAVE_MINUTES, STATUS, LEAVE_TYPE, REMARKS, CREATED_BY
      ) VALUES (
        :employeeId, TO_DATE(:attendanceDate, 'YYYY-MM-DD'), :shiftId, :scheduledInTime, :scheduledOutTime,
        :actualInTime, :actualOutTime, :inLocation, :outLocation, :inDeviceId,
        :outDeviceId, :inMethod, :outMethod, :workHours, :overtimeHours,
        :lateMinutes, :earlyLeaveMinutes, :status, :leaveType, :remarks, :createdBy
      ) RETURNING ATTENDANCE_ID INTO :attendanceId
    `;

    const binds = {
      employeeId: attendanceData.employeeId,
      attendanceDate: attendanceData.attendanceDate,
      shiftId: attendanceData.shiftId || null,
      scheduledInTime: attendanceData.scheduledInTime || null,
      scheduledOutTime: attendanceData.scheduledOutTime || null,
      actualInTime: attendanceData.actualInTime || null,
      actualOutTime: attendanceData.actualOutTime || null,
      inLocation: attendanceData.inLocation || null,
      outLocation: attendanceData.outLocation || null,
      inDeviceId: attendanceData.inDeviceId || null,
      outDeviceId: attendanceData.outDeviceId || null,
      inMethod: attendanceData.inMethod || 'MANUAL',
      outMethod: attendanceData.outMethod || 'MANUAL',
      workHours: attendanceData.workHours || null,
      overtimeHours: attendanceData.overtimeHours || 0,
      lateMinutes: attendanceData.lateMinutes || 0,
      earlyLeaveMinutes: attendanceData.earlyLeaveMinutes || 0,
      status: attendanceData.status || 'PRESENT',
      leaveType: attendanceData.leaveType || null,
      remarks: attendanceData.remarks || null,
      createdBy,
      attendanceId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };

    const result = await executeQuery(sql, binds);
    return result.outBinds.attendanceId[0];
  }

  static async getAttendanceById(attendanceId) {
    const sql = `
      SELECT a.*, 
             e.FIRST_NAME, e.LAST_NAME, e.EMPLOYEE_CODE,
             s.SHIFT_NAME, s.START_TIME as SHIFT_START_TIME, s.END_TIME as SHIFT_END_TIME,
             u.FIRST_NAME as CREATED_BY_FIRST_NAME, u.LAST_NAME as CREATED_BY_LAST_NAME
      FROM HRMS_ATTENDANCE a
      LEFT JOIN HRMS_EMPLOYEES e ON a.EMPLOYEE_ID = e.EMPLOYEE_ID
      LEFT JOIN HRMS_SHIFTS s ON a.SHIFT_ID = s.SHIFT_ID
      LEFT JOIN HRMS_USERS u ON a.CREATED_BY = u.USER_ID
      WHERE a.ATTENDANCE_ID = :attendanceId
    `;

    const result = await executeQuery(sql, { attendanceId });
    return result.rows[0] || null;
  }

  static async getAllAttendance(filters = {}) {
    let sql = `
      SELECT a.*, 
             e.FIRST_NAME, e.LAST_NAME, e.EMPLOYEE_CODE, e.DESIGNATION,
             s.SHIFT_NAME,
             u.FIRST_NAME as CREATED_BY_FIRST_NAME, u.LAST_NAME as CREATED_BY_LAST_NAME
      FROM HRMS_ATTENDANCE a
      LEFT JOIN HRMS_EMPLOYEES e ON a.EMPLOYEE_ID = e.EMPLOYEE_ID
      LEFT JOIN HRMS_SHIFTS s ON a.SHIFT_ID = s.SHIFT_ID
      LEFT JOIN HRMS_USERS u ON a.CREATED_BY = u.USER_ID
      WHERE 1=1
    `;

    const binds = {};
    let bindIndex = 1;

    if (filters.employeeId) {
      sql += ` AND a.EMPLOYEE_ID = :${bindIndex}`;
      binds[bindIndex] = filters.employeeId;
      bindIndex++;
    }

    if (filters.startDate) {
      sql += ` AND a.ATTENDANCE_DATE >= TO_DATE(:${bindIndex}, 'YYYY-MM-DD')`;
      binds[bindIndex] = filters.startDate;
      bindIndex++;
    }

    if (filters.endDate) {
      sql += ` AND a.ATTENDANCE_DATE <= TO_DATE(:${bindIndex}, 'YYYY-MM-DD')`;
      binds[bindIndex] = filters.endDate;
      bindIndex++;
    }

    if (filters.status) {
      sql += ` AND a.STATUS = :${bindIndex}`;
      binds[bindIndex] = filters.status;
      bindIndex++;
    }

    if (filters.search) {
      sql += ` AND (e.FIRST_NAME LIKE '%' || :${bindIndex} || '%' OR e.LAST_NAME LIKE '%' || :${bindIndex} || '%' OR e.EMPLOYEE_CODE LIKE '%' || :${bindIndex} || '%')`;
      binds[bindIndex] = filters.search;
      bindIndex++;
    }

    sql += ` ORDER BY a.ATTENDANCE_DATE DESC, e.FIRST_NAME, e.LAST_NAME`;

    // Pagination
    if (filters.page && filters.limit) {
      const offset = (filters.page - 1) * filters.limit;
      sql += ` OFFSET ${offset} ROWS FETCH NEXT ${filters.limit} ROWS ONLY`;
    }

    const result = await executeQuery(sql, binds);
    return result.rows || [];
  }

  static async updateAttendance(attendanceId, attendanceData) {
    const sql = `
      UPDATE HRMS_ATTENDANCE SET
        SHIFT_ID = :shiftId,
        SCHEDULED_IN_TIME = :scheduledInTime,
        SCHEDULED_OUT_TIME = :scheduledOutTime,
        ACTUAL_IN_TIME = :actualInTime,
        ACTUAL_OUT_TIME = :actualOutTime,
        IN_LOCATION = :inLocation,
        OUT_LOCATION = :outLocation,
        IN_DEVICE_ID = :inDeviceId,
        OUT_DEVICE_ID = :outDeviceId,
        IN_METHOD = :inMethod,
        OUT_METHOD = :outMethod,
        WORK_HOURS = :workHours,
        OVERTIME_HOURS = :overtimeHours,
        LATE_MINUTES = :lateMinutes,
        EARLY_LEAVE_MINUTES = :earlyLeaveMinutes,
        STATUS = :status,
        LEAVE_TYPE = :leaveType,
        REMARKS = :remarks,
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE ATTENDANCE_ID = :attendanceId
    `;

    const binds = {
      attendanceId,
      shiftId: attendanceData.shiftId || null,
      scheduledInTime: attendanceData.scheduledInTime || null,
      scheduledOutTime: attendanceData.scheduledOutTime || null,
      actualInTime: attendanceData.actualInTime || null,
      actualOutTime: attendanceData.actualOutTime || null,
      inLocation: attendanceData.inLocation || null,
      outLocation: attendanceData.outLocation || null,
      inDeviceId: attendanceData.inDeviceId || null,
      outDeviceId: attendanceData.outDeviceId || null,
      inMethod: attendanceData.inMethod || 'MANUAL',
      outMethod: attendanceData.outMethod || 'MANUAL',
      workHours: attendanceData.workHours || null,
      overtimeHours: attendanceData.overtimeHours || 0,
      lateMinutes: attendanceData.lateMinutes || 0,
      earlyLeaveMinutes: attendanceData.earlyLeaveMinutes || 0,
      status: attendanceData.status || 'PRESENT',
      leaveType: attendanceData.leaveType || null,
      remarks: attendanceData.remarks || null
    };

    await executeQuery(sql, binds);
    return true;
  }

  static async deleteAttendance(attendanceId) {
    const sql = `DELETE FROM HRMS_ATTENDANCE WHERE ATTENDANCE_ID = :attendanceId`;
    await executeQuery(sql, { attendanceId });
    return true;
  }

  // Biometric Device Operations
  static async createBiometricDevice(deviceData, createdBy) {
    const sql = `
      INSERT INTO HRMS_BIOMETRIC_DEVICES (
        DEVICE_NAME, DEVICE_CODE, DEVICE_TYPE, LOCATION, IP_ADDRESS, PORT_NUMBER,
        STATUS, DEVICE_INFO, CREATED_BY
      ) VALUES (
        :deviceName, :deviceCode, :deviceType, :location, :ipAddress, :portNumber,
        :status, :deviceInfo, :createdBy
      ) RETURNING DEVICE_ID INTO :deviceId
    `;

    const binds = {
      deviceName: deviceData.deviceName,
      deviceCode: deviceData.deviceCode,
      deviceType: deviceData.deviceType,
      location: deviceData.location || null,
      ipAddress: deviceData.ipAddress || null,
      portNumber: deviceData.portNumber || null,
      status: deviceData.status || 'ACTIVE',
      deviceInfo: deviceData.deviceInfo || null,
      createdBy,
      deviceId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };

    const result = await executeQuery(sql, binds);
    return result.outBinds.deviceId[0];
  }

  static async getAllBiometricDevices() {
    const sql = `
      SELECT d.*, u.FIRST_NAME as CREATED_BY_FIRST_NAME, u.LAST_NAME as CREATED_BY_LAST_NAME
      FROM HRMS_BIOMETRIC_DEVICES d
      LEFT JOIN HRMS_USERS u ON d.CREATED_BY = u.USER_ID
      ORDER BY d.DEVICE_NAME
    `;

    const result = await executeQuery(sql);
    return result.rows || [];
  }

  // Attendance Log Operations
  static async createAttendanceLog(logData) {
    const sql = `
      INSERT INTO HRMS_ATTENDANCE_LOGS (
        DEVICE_ID, EMPLOYEE_ID, LOG_TIME, LOG_TYPE, BIOMETRIC_DATA,
        VERIFICATION_METHOD, VERIFICATION_STATUS, DEVICE_RESPONSE
      ) VALUES (
        :deviceId, :employeeId, :logTime, :logType, :biometricData,
        :verificationMethod, :verificationStatus, :deviceResponse
      ) RETURNING LOG_ID INTO :logId
    `;

    const binds = {
      deviceId: logData.deviceId || null,
      employeeId: logData.employeeId || null,
      logTime: logData.logTime,
      logType: logData.logType,
      biometricData: logData.biometricData || null,
      verificationMethod: logData.verificationMethod || 'FINGERPRINT',
      verificationStatus: logData.verificationStatus || 'SUCCESS',
      deviceResponse: logData.deviceResponse || null,
      logId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };

    const result = await executeQuery(sql, binds);
    return result.outBinds.logId[0];
  }

  // Get attendance statistics
  static async getAttendanceStatistics(filters = {}) {
    const sql = `
      SELECT 
        COUNT(*) as TOTAL_DAYS,
        SUM(CASE WHEN STATUS = 'PRESENT' THEN 1 ELSE 0 END) as PRESENT_DAYS,
        SUM(CASE WHEN STATUS = 'ABSENT' THEN 1 ELSE 0 END) as ABSENT_DAYS,
        SUM(CASE WHEN STATUS = 'HALF_DAY' THEN 1 ELSE 0 END) as HALF_DAYS,
        SUM(CASE WHEN STATUS = 'LEAVE' THEN 1 ELSE 0 END) as LEAVE_DAYS,
        SUM(WORK_HOURS) as TOTAL_WORK_HOURS,
        SUM(OVERTIME_HOURS) as TOTAL_OVERTIME_HOURS,
        SUM(LATE_MINUTES) as TOTAL_LATE_MINUTES,
        SUM(EARLY_LEAVE_MINUTES) as TOTAL_EARLY_LEAVE_MINUTES
      FROM HRMS_ATTENDANCE
      WHERE EMPLOYEE_ID = :employeeId
      AND ATTENDANCE_DATE >= TO_DATE(:startDate, 'YYYY-MM-DD')
      AND ATTENDANCE_DATE <= TO_DATE(:endDate, 'YYYY-MM-DD')
    `;

    const result = await executeQuery(sql, {
      employeeId: filters.employeeId,
      startDate: filters.startDate,
      endDate: filters.endDate
    });

    return result.rows[0] || null;
  }

  // Get attendance for dropdown
  static async getAttendanceForDropdown() {
    const sql = `
      SELECT DISTINCT STATUS, LEAVE_TYPE
      FROM HRMS_ATTENDANCE
      WHERE STATUS IS NOT NULL
      ORDER BY STATUS
    `;

    const result = await executeQuery(sql);
    return result.rows || [];
  }
}

module.exports = Attendance; 
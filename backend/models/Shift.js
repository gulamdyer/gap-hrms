const { executeQuery } = require('../config/database');
const oracledb = require('oracledb');

class Shift {
  // Create shifts table if not exists
  static async createTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_SHIFTS (
        SHIFT_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        SHIFT_NAME VARCHAR2(100) NOT NULL UNIQUE,
        START_TIME VARCHAR2(5) NOT NULL,
        END_TIME VARCHAR2(5) NOT NULL,
        SHIFT_HOURS NUMBER(5,2),
        DESCRIPTION VARCHAR2(255),
        STATUS VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (STATUS IN ('ACTIVE', 'INACTIVE')),
        OVERTIME_APPLICABLE NUMBER(1) DEFAULT 0 CHECK (OVERTIME_APPLICABLE IN (0, 1)),
        OVERTIME_CAP_HOURS NUMBER(5,2),
        FLEXIBLE_TIME_APPLICABLE NUMBER(1) DEFAULT 0 CHECK (FLEXIBLE_TIME_APPLICABLE IN (0, 1)),
        LATE_COMING_TOLERANCE NUMBER(3) DEFAULT 0 CHECK (LATE_COMING_TOLERANCE BETWEEN 0 AND 60),
        EARLY_GOING_TOLERANCE NUMBER(3) DEFAULT 0 CHECK (EARLY_GOING_TOLERANCE BETWEEN 0 AND 60),
        HAS_BREAK_TIME NUMBER(1) DEFAULT 0 CHECK (HAS_BREAK_TIME IN (0, 1)),
        BREAK_START_TIME VARCHAR2(5),
        BREAK_END_TIME VARCHAR2(5),
        BREAK_HOURS NUMBER(5,2),
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_SHIFTS table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_SHIFTS table already exists');
      } else {
        throw error;
      }
    }
  }

  // Idempotent migration: add missing columns to HRMS_SHIFTS for shift/break hours
  static async addMissingColumns() {
    const alterations = [
      { name: 'SHIFT_HOURS', sql: "ALTER TABLE HRMS_SHIFTS ADD (SHIFT_HOURS NUMBER(5,2))" },
      { name: 'HAS_BREAK_TIME', sql: "ALTER TABLE HRMS_SHIFTS ADD (HAS_BREAK_TIME NUMBER(1) DEFAULT 0)" },
      { name: 'BREAK_START_TIME', sql: "ALTER TABLE HRMS_SHIFTS ADD (BREAK_START_TIME VARCHAR2(5))" },
      { name: 'BREAK_END_TIME', sql: "ALTER TABLE HRMS_SHIFTS ADD (BREAK_END_TIME VARCHAR2(5))" },
      { name: 'BREAK_HOURS', sql: "ALTER TABLE HRMS_SHIFTS ADD (BREAK_HOURS NUMBER(5,2))" },
    ];
    for (const col of alterations) {
      try {
        await executeQuery(col.sql);
        console.log(`✅ Added column HRMS_SHIFTS.${col.name}`);
      } catch (error) {
        if (
          error.message.includes('ORA-01430') || // column being added already exists
          error.message.includes('ORA-00942') // table does not exist (handled by createTable)
        ) {
          console.log(`ℹ️ Column HRMS_SHIFTS.${col.name} already exists or table missing; skipping`);
        } else {
          throw error;
        }
      }
    }
    // Add basic check constraint for HAS_BREAK_TIME if not present (best-effort)
    try {
      await executeQuery("ALTER TABLE HRMS_SHIFTS ADD CONSTRAINT HRMS_SHIFTS_HAS_BREAK_TIME_CK CHECK (HAS_BREAK_TIME IN (0,1))");
      console.log('✅ Added constraint HRMS_SHIFTS_HAS_BREAK_TIME_CK');
    } catch (error) {
      if (error.message.includes('ORA-02275') || error.message.includes('ORA-02260') || error.message.includes('ORA-00955')) {
        console.log('ℹ️ Constraint HRMS_SHIFTS_HAS_BREAK_TIME_CK already exists; skipping');
      } else if (error.message.includes('ORA-02436')) {
        console.log('ℹ️ Constraint already functionally present; skipping');
      } else {
        // Non-fatal; log and continue
        console.log('⚠️ Skipping constraint add:', error.message);
      }
    }
  }

  // Create new shift
  static async create(shiftData) {
    const sql = `
      INSERT INTO HRMS_SHIFTS (
        SHIFT_NAME, START_TIME, END_TIME, SHIFT_HOURS, DESCRIPTION, STATUS, OVERTIME_APPLICABLE, OVERTIME_CAP_HOURS,
        FLEXIBLE_TIME_APPLICABLE, LATE_COMING_TOLERANCE, EARLY_GOING_TOLERANCE,
        HAS_BREAK_TIME, BREAK_START_TIME, BREAK_END_TIME, BREAK_HOURS
      ) VALUES (
        :shiftName, :startTime, :endTime, :shiftHours, :description, :status, :overtimeApplicable, :overtimeCapHours,
        :flexibleTimeApplicable, :lateComingTolerance, :earlyGoingTolerance,
        :hasBreakTime, :breakStartTime, :breakEndTime, :breakHours
      ) RETURNING SHIFT_ID INTO :shiftId
    `;
    const params = {
      shiftName: shiftData.shiftName,
      startTime: shiftData.startTime,
      endTime: shiftData.endTime,
      shiftHours: shiftData.shiftHours ?? null,
      description: shiftData.description || null,
      status: shiftData.status || 'ACTIVE',
      overtimeApplicable: shiftData.overtimeApplicable ? 1 : 0,
      overtimeCapHours: shiftData.overtimeCapHours || null,
      flexibleTimeApplicable: shiftData.flexibleTimeApplicable ? 1 : 0,
      lateComingTolerance: shiftData.lateComingTolerance || 0,
      earlyGoingTolerance: shiftData.earlyGoingTolerance || 0,
      hasBreakTime: shiftData.hasBreakTime ? 1 : 0,
      breakStartTime: shiftData.hasBreakTime ? (shiftData.breakStartTime || null) : null,
      breakEndTime: shiftData.hasBreakTime ? (shiftData.breakEndTime || null) : null,
      breakHours: shiftData.hasBreakTime ? (shiftData.breakHours ?? null) : null,
      shiftId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };
    const result = await executeQuery(sql, params);
    return result.outBinds.shiftId[0];
  }

  // Get all shifts
  static async findAll() {
    const sql = `SELECT * FROM HRMS_SHIFTS ORDER BY CREATED_AT DESC`;
    const result = await executeQuery(sql);
    return result.rows || [];
  }

  // Get shift by ID
  static async findById(shiftId) {
    const sql = `SELECT * FROM HRMS_SHIFTS WHERE SHIFT_ID = :shiftId`;
    const result = await executeQuery(sql, { shiftId });
    return result.rows?.[0] || null;
  }

  // Update shift
  static async update(shiftId, shiftData) {
    const sql = `
      UPDATE HRMS_SHIFTS SET
        SHIFT_NAME = :shiftName,
        START_TIME = :startTime,
        END_TIME = :endTime,
        SHIFT_HOURS = :shiftHours,
        DESCRIPTION = :description,
        STATUS = :status,
        OVERTIME_APPLICABLE = :overtimeApplicable,
        OVERTIME_CAP_HOURS = :overtimeCapHours,
        FLEXIBLE_TIME_APPLICABLE = :flexibleTimeApplicable,
        LATE_COMING_TOLERANCE = :lateComingTolerance,
        EARLY_GOING_TOLERANCE = :earlyGoingTolerance,
        HAS_BREAK_TIME = :hasBreakTime,
        BREAK_START_TIME = :breakStartTime,
        BREAK_END_TIME = :breakEndTime,
        BREAK_HOURS = :breakHours,
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE SHIFT_ID = :shiftId
    `;
    const params = {
      shiftId,
      shiftName: shiftData.shiftName,
      startTime: shiftData.startTime,
      endTime: shiftData.endTime,
      shiftHours: shiftData.shiftHours ?? null,
      description: shiftData.description || null,
      status: shiftData.status || 'ACTIVE',
      overtimeApplicable: shiftData.overtimeApplicable ? 1 : 0,
      overtimeCapHours: shiftData.overtimeCapHours || null,
      flexibleTimeApplicable: shiftData.flexibleTimeApplicable ? 1 : 0,
      lateComingTolerance: shiftData.lateComingTolerance || 0,
      earlyGoingTolerance: shiftData.earlyGoingTolerance || 0,
      hasBreakTime: shiftData.hasBreakTime ? 1 : 0,
      breakStartTime: shiftData.hasBreakTime ? (shiftData.breakStartTime || null) : null,
      breakEndTime: shiftData.hasBreakTime ? (shiftData.breakEndTime || null) : null,
      breakHours: shiftData.hasBreakTime ? (shiftData.breakHours ?? null) : null
    };
    const result = await executeQuery(sql, params);
    return result.rowsAffected;
  }

  // Delete shift
  static async delete(shiftId) {
    const sql = `DELETE FROM HRMS_SHIFTS WHERE SHIFT_ID = :shiftId`;
    const result = await executeQuery(sql, { shiftId });
    return result.rowsAffected;
  }

  // Get shifts for dropdown
  static async getShiftsForDropdown() {
    const sql = `
      SELECT SHIFT_ID, SHIFT_NAME, START_TIME, END_TIME,
             OVERTIME_APPLICABLE, OVERTIME_CAP_HOURS,
             FLEXIBLE_TIME_APPLICABLE, LATE_COMING_TOLERANCE, EARLY_GOING_TOLERANCE,
             SHIFT_HOURS, HAS_BREAK_TIME, BREAK_START_TIME, BREAK_END_TIME, BREAK_HOURS
      FROM HRMS_SHIFTS
      WHERE STATUS = 'ACTIVE'
      ORDER BY SHIFT_NAME
    `;
    
    const result = await executeQuery(sql);
    return result.rows || [];
  }
}

module.exports = Shift; 
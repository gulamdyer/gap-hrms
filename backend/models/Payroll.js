const { executeQuery } = require('../config/database');
const oracledb = require('oracledb');
const Calendar = require('./Calendar');

class Payroll {
  // Check if attendance has already been processed for a specific month/year
  static async checkAttendanceProcessed(month, year) {
    try {
      console.log('🔍 Checking if attendance already processed for:', { month, year });
      
      const query = `
        SELECT 
          ps.*,
          e.EMPLOYEE_CODE,
          e.FIRST_NAME,
          e.LAST_NAME
        FROM HRMS_PAYROLL_ATTENDANCE_SUMMARY ps
        INNER JOIN HRMS_EMPLOYEES e ON ps.EMPLOYEE_ID = e.EMPLOYEE_ID
        WHERE ps.PERIOD_YEAR = :year AND ps.PERIOD_MONTH = :month
        AND e.STATUS = 'ACTIVE'
        ORDER BY e.EMPLOYEE_CODE
      `;
      
      const result = await executeQuery(query, { month: Number(month), year: Number(year) });
      const rows = result.rows || [];
      
      console.log('✅ Found', rows.length, 'existing attendance records');
      
      if (rows.length > 0) {
        console.log('🔍 DEBUG: checkAttendanceProcessed - First row data:', rows[0]);
        console.log('🔍 DEBUG: checkAttendanceProcessed - First row keys:', Object.keys(rows[0]));
        console.log('🔍 DEBUG: checkAttendanceProcessed - PRESENT_DAYS:', rows[0].PRESENT_DAYS);
        console.log('🔍 DEBUG: checkAttendanceProcessed - TOTAL_WORK_HOURS:', rows[0].TOTAL_WORK_HOURS);
        console.log('🔍 DEBUG: checkAttendanceProcessed - HOLIDAY_DAYS:', rows[0].HOLIDAY_DAYS);
        console.log('🔍 DEBUG: checkAttendanceProcessed - HOLIDAY_HOURS:', rows[0].HOLIDAY_HOURS);
      }
      
      // If we have records, attendance has been processed
      return rows.length > 0 ? rows : null;
    } catch (error) {
      console.error('❌ Error checking attendance processed status:', error);
      
      // If table doesn't exist, attendance hasn't been processed
      if (error.message.includes('ORA-00942')) {
        console.log('ℹ️ Attendance summary table does not exist, attendance not processed');
        return null;
      }
      
      throw error;
    }
  }

  // Backend date formatting for Oracle - from DATE_HANDLING_GUIDE.md
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

  // Create or replace DB procedure that computes and upserts attendance summary
  static async ensureProcessAttendanceProcedure() {
    const plsql = `
    CREATE OR REPLACE PROCEDURE HRMS_PROCESS_ATTENDANCE(
      p_month   IN NUMBER,
      p_year    IN NUMBER,
      p_user_id IN NUMBER
    ) AS
      v_start_date DATE;
      v_end_date   DATE;
    BEGIN
      v_start_date := TO_DATE(p_year || '-' || LPAD(p_month,2,'0') || '-01', 'YYYY-MM-DD');
      v_end_date   := LAST_DAY(v_start_date);

      FOR emp IN (
        SELECT e.EMPLOYEE_ID,
               e.EMPLOYEE_CODE,
               e.FIRST_NAME,
               e.LAST_NAME,
               e.CALENDAR_ID,
               e.SHIFT_ID
          FROM HRMS_EMPLOYEES e
         WHERE e.STATUS = 'ACTIVE')
      LOOP
        -- Defaults
        DECLARE
          v_present_days         NUMBER := 0;
          v_total_work_hours     NUMBER := 0;
          v_total_ot_hours       NUMBER := 0;
          v_total_late_minutes   NUMBER := 0;
          v_total_short_hours    NUMBER := 0;
          v_paid_leave_days      NUMBER := 0;
          v_unpaid_leave_days    NUMBER := 0;
          v_payable_days         NUMBER := 0;
          v_weekly_off_days      NUMBER := 0;
          v_weekly_off_hours     NUMBER := 0;
          v_holiday_days         NUMBER := 0;
          v_holiday_hours        NUMBER := 0;
          v_paid_leave_hours     NUMBER := 0;
          v_total_hours          NUMBER := 0;
          v_required_hours       NUMBER := 0;
          v_shift_hours          NUMBER := 8;
          v_start_time           VARCHAR2(5);
          v_end_time             VARCHAR2(5);
          v_weekly_json          VARCHAR2(4000);
          v_day                  DATE;
          v_dy                   VARCHAR2(3);
          v_wk_map               VARCHAR2(200) := '';
        BEGIN
          -- Shift hours
          BEGIN
            SELECT START_TIME, END_TIME INTO v_start_time, v_end_time FROM HRMS_SHIFTS WHERE SHIFT_ID = emp.SHIFT_ID;
            IF v_start_time IS NOT NULL AND v_end_time IS NOT NULL THEN
              v_shift_hours := (TO_NUMBER(SUBSTR(v_end_time,1,2)) + NVL(TO_NUMBER(SUBSTR(v_end_time,4,2)),0)/60)
                              - (TO_NUMBER(SUBSTR(v_start_time,1,2)) + NVL(TO_NUMBER(SUBSTR(v_start_time,4,2)),0)/60);
              IF v_shift_hours < 0 THEN v_shift_hours := v_shift_hours + 24; END IF;
            END IF;
          EXCEPTION WHEN OTHERS THEN NULL; END;

          -- Attendance aggregates
          BEGIN
            SELECT NVL(SUM(CASE WHEN STATUS='PRESENT' THEN 1 ELSE 0 END),0),
                   NVL(SUM(NVL(WORK_HOURS,0)),0),
                   NVL(SUM(NVL(OVERTIME_HOURS,0)),0),
                   NVL(SUM(NVL(LATE_MINUTES,0)),0)
              INTO v_present_days, v_total_work_hours, v_total_ot_hours, v_total_late_minutes
              FROM HRMS_ATTENDANCE a
             WHERE a.EMPLOYEE_ID = emp.EMPLOYEE_ID
               AND a.ATTENDANCE_DATE BETWEEN v_start_date AND v_end_date;
          EXCEPTION WHEN OTHERS THEN
            v_present_days := 0; v_total_work_hours := 0; v_total_ot_hours := 0; v_total_late_minutes := 0;
          END;

          -- Paid/Unpaid leave
          BEGIN
            -- With leave policies (paid vs unpaid)
            BEGIN
              SELECT NVL(SUM(
                       CASE WHEN (LEAST(l.END_DATE, v_end_date) - GREATEST(l.START_DATE, v_start_date) + 1) > 0
                            AND NVL(lp.IS_PAID, CASE WHEN l.LEAVE_TYPE='UNPAID' THEN 'N' ELSE 'Y' END) = 'Y'
                            THEN (LEAST(l.END_DATE, v_end_date) - GREATEST(l.START_DATE, v_start_date) + 1) ELSE 0 END
                     ),0),
                     NVL(SUM(
                       CASE WHEN (LEAST(l.END_DATE, v_end_date) - GREATEST(l.START_DATE, v_start_date) + 1) > 0
                            AND NVL(lp.IS_PAID, CASE WHEN l.LEAVE_TYPE='UNPAID' THEN 'N' ELSE 'Y' END) = 'N'
                            THEN (LEAST(l.END_DATE, v_end_date) - GREATEST(l.START_DATE, v_start_date) + 1) ELSE 0 END
                     ),0)
                INTO v_paid_leave_days, v_unpaid_leave_days
                FROM HRMS_LEAVES l LEFT JOIN HRMS_LEAVE_POLICIES lp ON lp.LEAVE_TYPE = l.LEAVE_TYPE
               WHERE l.EMPLOYEE_ID = emp.EMPLOYEE_ID
                 AND l.STATUS='APPROVED'
                 AND l.START_DATE <= v_end_date AND l.END_DATE >= v_start_date;
            EXCEPTION WHEN OTHERS THEN
              -- Fallback without policy table
              SELECT NVL(SUM(
                       CASE WHEN (LEAST(l.END_DATE, v_end_date) - GREATEST(l.START_DATE, v_start_date) + 1) > 0
                            AND NVL(l.LEAVE_TYPE,'UNPAID') <> 'UNPAID'
                            THEN (LEAST(l.END_DATE, v_end_date) - GREATEST(l.START_DATE, v_start_date) + 1) ELSE 0 END
                     ),0),
                     NVL(SUM(
                       CASE WHEN (LEAST(l.END_DATE, v_end_date) - GREATEST(l.START_DATE, v_start_date) + 1) > 0
                            AND NVL(l.LEAVE_TYPE,'UNPAID') = 'UNPAID'
                            THEN (LEAST(l.END_DATE, v_end_date) - GREATEST(l.START_DATE, v_start_date) + 1) ELSE 0 END
                     ),0)
                INTO v_paid_leave_days, v_unpaid_leave_days
                FROM HRMS_LEAVES l
               WHERE l.EMPLOYEE_ID = emp.EMPLOYEE_ID
                 AND l.STATUS='APPROVED'
                 AND l.START_DATE <= v_end_date AND l.END_DATE >= v_start_date;
            END;
          EXCEPTION WHEN OTHERS THEN v_paid_leave_days := 0; v_unpaid_leave_days := 0; END;

          -- Weekly off days based on calendar JSON names or numbers
          BEGIN
            IF emp.CALENDAR_ID IS NOT NULL THEN
              BEGIN
                SELECT WEEKLY_HOLIDAYS INTO v_weekly_json FROM HRMS_CALENDAR WHERE CALENDAR_ID = emp.CALENDAR_ID;
              EXCEPTION WHEN OTHERS THEN v_weekly_json := NULL; END;

              IF v_weekly_json IS NOT NULL THEN
                -- Normalize JSON to comma separated tokens without brackets/spaces/quotes
                v_weekly_json := REPLACE(REPLACE(REPLACE(REPLACE(LOWER(v_weekly_json),'[',''),']',''),'"',''),' ','');
                v_wk_map := ',' || v_weekly_json || ','; -- simple membership test

                v_day := v_start_date;
                WHILE v_day <= v_end_date LOOP
                  v_dy := TO_CHAR(v_day, 'DY', 'NLS_DATE_LANGUAGE=ENGLISH');
                  -- Map to 0..6 and names
                  IF     INSTR(v_wk_map, ',0,')>0 AND v_dy='SUN' THEN v_weekly_off_days := v_weekly_off_days + 1;
                  ELSIF  INSTR(v_wk_map, ',1,')>0 AND v_dy='MON' THEN v_weekly_off_days := v_weekly_off_days + 1;
                  ELSIF  INSTR(v_wk_map, ',2,')>0 AND v_dy='TUE' THEN v_weekly_off_days := v_weekly_off_days + 1;
                  ELSIF  INSTR(v_wk_map, ',3,')>0 AND v_dy='WED' THEN v_weekly_off_days := v_weekly_off_days + 1;
                  ELSIF  INSTR(v_wk_map, ',4,')>0 AND v_dy='THU' THEN v_weekly_off_days := v_weekly_off_days + 1;
                  ELSIF  INSTR(v_wk_map, ',5,')>0 AND v_dy='FRI' THEN v_weekly_off_days := v_weekly_off_days + 1;
                  ELSIF  INSTR(v_wk_map, ',6,')>0 AND v_dy='SAT' THEN v_weekly_off_days := v_weekly_off_days + 1;
                  ELSIF  INSTR(v_wk_map, 'sunday')>0 AND v_dy='SUN' THEN v_weekly_off_days := v_weekly_off_days + 1;
                  ELSIF  INSTR(v_wk_map, 'monday')>0 AND v_dy='MON' THEN v_weekly_off_days := v_weekly_off_days + 1;
                  ELSIF  INSTR(v_wk_map, 'tuesday')>0 AND v_dy='TUE' THEN v_weekly_off_days := v_weekly_off_days + 1;
                  ELSIF  INSTR(v_wk_map, 'wednesday')>0 AND v_dy='WED' THEN v_weekly_off_days := v_weekly_off_days + 1;
                  ELSIF  INSTR(v_wk_map, 'thursday')>0 AND v_dy='THU' THEN v_weekly_off_days := v_weekly_off_days + 1;
                  ELSIF  INSTR(v_wk_map, 'friday')>0 AND v_dy='FRI' THEN v_weekly_off_days := v_weekly_off_days + 1;
                  ELSIF  INSTR(v_wk_map, 'saturday')>0 AND v_dy='SAT' THEN v_weekly_off_days := v_weekly_off_days + 1;
                  END IF;
                  v_day := v_day + 1;
                END LOOP;
              END IF;
            END IF;
          EXCEPTION WHEN OTHERS THEN v_weekly_off_days := 0; END;

          -- Holiday days for calendar
          BEGIN
            IF emp.CALENDAR_ID IS NOT NULL THEN
              SELECT NVL(COUNT(*),0) INTO v_holiday_days
                FROM HRMS_CALENDAR_HOLIDAYS h
               WHERE h.CALENDAR_ID = emp.CALENDAR_ID
                 AND h.IS_ACTIVE = 1
                 AND h.HOLIDAY_DATE BETWEEN v_start_date AND v_end_date;
            END IF;
          EXCEPTION WHEN OTHERS THEN v_holiday_days := 0; END;

          -- Derivations
          v_weekly_off_hours := NVL(v_weekly_off_days,0) * v_shift_hours;
          v_holiday_hours    := NVL(v_holiday_days,0)   * v_shift_hours;
          v_paid_leave_hours := NVL(v_paid_leave_days,0)* v_shift_hours;
          v_total_hours      := NVL(v_total_work_hours,0) + NVL(v_total_ot_hours,0);
          v_payable_days     := NVL(v_present_days,0) + NVL(v_paid_leave_days,0);
          v_required_hours   := (NVL(v_present_days,0) + NVL(v_paid_leave_days,0) + NVL(v_weekly_off_days,0) + NVL(v_holiday_days,0)) * v_shift_hours;

          -- Upsert into summary
          MERGE INTO HRMS_PAYROLL_ATTENDANCE_SUMMARY t
          USING (SELECT p_year AS PERIOD_YEAR, p_month AS PERIOD_MONTH, emp.EMPLOYEE_ID AS EMPLOYEE_ID FROM dual) s
          ON (t.PERIOD_YEAR = s.PERIOD_YEAR AND t.PERIOD_MONTH = s.PERIOD_MONTH AND t.EMPLOYEE_ID = s.EMPLOYEE_ID)
          WHEN MATCHED THEN UPDATE SET
            PRESENT_DAYS = v_present_days,
            TOTAL_WORK_HOURS = v_total_work_hours,
            TOTAL_OT_HOURS = v_total_ot_hours,
            TOTAL_LATE_MINUTES = v_total_late_minutes,
            TOTAL_SHORT_HOURS = v_total_short_hours,
            PAID_LEAVE_DAYS = v_paid_leave_days,
            UNPAID_LEAVE_DAYS = v_unpaid_leave_days,
            PAYABLE_DAYS = v_payable_days,
            WEEKLY_OFF_DAYS = v_weekly_off_days,
            WEEKLY_OFF_HOURS = v_weekly_off_hours,
            HOLIDAY_DAYS = v_holiday_days,
            HOLIDAY_HOURS = v_holiday_hours,
            PAID_LEAVE_HOURS = v_paid_leave_hours,
            TOTAL_HOURS = v_total_hours,
            REQUIRED_HOURS = v_required_hours
          WHEN NOT MATCHED THEN INSERT (
            PERIOD_YEAR, PERIOD_MONTH, EMPLOYEE_ID, PRESENT_DAYS, TOTAL_WORK_HOURS, TOTAL_OT_HOURS, TOTAL_LATE_MINUTES, TOTAL_SHORT_HOURS,
            PAID_LEAVE_DAYS, UNPAID_LEAVE_DAYS, PAYABLE_DAYS, WEEKLY_OFF_DAYS, WEEKLY_OFF_HOURS, HOLIDAY_DAYS, HOLIDAY_HOURS, PAID_LEAVE_HOURS, TOTAL_HOURS, REQUIRED_HOURS, CREATED_BY
          ) VALUES (
            p_year, p_month, emp.EMPLOYEE_ID, v_present_days, v_total_work_hours, v_total_ot_hours, v_total_late_minutes, v_total_short_hours,
            v_paid_leave_days, v_unpaid_leave_days, v_payable_days, v_weekly_off_days, v_weekly_off_hours, v_holiday_days, v_holiday_hours, v_paid_leave_hours, v_total_hours, v_required_hours, p_user_id
          );
        END;
      END LOOP;
    END;`;

    try {
      await executeQuery(plsql);
    } catch (e) {
      // Ignore compile warnings; rethrow other errors
      if (!(`${e.message}`.includes('ORA-06512') || `${e.message}`.includes('PLS-'))) {
        throw e;
      }
    }
  }

  static async runProcessAttendanceProcedure(month, year, userId) {
    await this.ensureAttendanceSummaryTable();
    await this.ensureProcessAttendanceProcedure();
    const pl = `BEGIN HRMS_PROCESS_ATTENDANCE(:p_month, :p_year, :p_user_id); END;`;
    await executeQuery(pl, { p_month: month, p_year: year, p_user_id: userId });
  }

  // Get count of raw attendance records for a given month/year
  static async getRawAttendanceCount(month, year) {
    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    try {
      const sql = `
        SELECT COUNT(*) as ATTENDANCE_COUNT 
        FROM HRMS_ATTENDANCE 
        WHERE ATTENDANCE_DATE BETWEEN TO_DATE(:startDate, 'YYYY-MM-DD') AND TO_DATE(:endDate, 'YYYY-MM-DD')
      `;
      
      const result = await executeQuery(sql, { startDate, endDate });
      return result.rows?.[0]?.ATTENDANCE_COUNT || 0;
    } catch (error) {
      console.error('Error getting raw attendance count:', error);
      return 0;
    }
  }

  // Create default attendance records for active employees
  static async createDefaultAttendanceRecords(month, year, createdBy) {
    const lastDay = new Date(year, month, 0).getDate();
    
    try {
      // First, ensure the attendance table exists
      const { executeQuery } = require('../config/database');
      
      // Get all active employees
      const employeesResult = await executeQuery(`
        SELECT EMPLOYEE_ID, SHIFT_ID 
        FROM HRMS_EMPLOYEES 
        WHERE STATUS = 'ACTIVE'
      `);
      
      const employees = employeesResult.rows || [];
      console.log(`📊 Creating default attendance for ${employees.length} active employees`);
      
      // Create attendance records for each working day of the month
      for (let day = 1; day <= lastDay; day++) {
        const currentDate = new Date(year, month - 1, day);
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Skip weekends for default records (you can modify this logic based on your business rules)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          continue;
        }
        
        for (const employee of employees) {
          try {
            // Check if attendance record already exists
            const existingResult = await executeQuery(`
              SELECT ATTENDANCE_ID 
              FROM HRMS_ATTENDANCE 
              WHERE EMPLOYEE_ID = :employeeId AND ATTENDANCE_DATE = TO_DATE(:dateStr, 'YYYY-MM-DD')
            `, { employeeId: employee.EMPLOYEE_ID, dateStr });
            
            if (existingResult.rows.length === 0) {
              // Create default attendance record (8 hours work, present status)
              await executeQuery(`
                INSERT INTO HRMS_ATTENDANCE (
                  EMPLOYEE_ID, ATTENDANCE_DATE, SHIFT_ID, 
                  SCHEDULED_IN_TIME, SCHEDULED_OUT_TIME,
                  ACTUAL_IN_TIME, ACTUAL_OUT_TIME,
                  WORK_HOURS, STATUS, CREATED_BY
                ) VALUES (
                  :employeeId, TO_DATE(:dateStr, 'YYYY-MM-DD'), :shiftId,
                  '09:00', '17:00',
                  '09:00', '17:00',
                  8, 'PRESENT', :createdBy
                )
              `, {
                employeeId: employee.EMPLOYEE_ID,
                dateStr,
                shiftId: employee.SHIFT_ID || null,
                createdBy
              });
            }
          } catch (error) {
            console.error(`Error creating attendance for employee ${employee.EMPLOYEE_ID} on ${dateStr}:`, error.message);
            // Continue with next employee/date
          }
        }
      }
      
      console.log('✅ Default attendance records creation completed');
    } catch (error) {
      console.error('Error creating default attendance records:', error);
      throw error;
    }
  }

  static async installAttendanceProcedure() {
    try {
      await this.ensureAttendanceSummaryTable();
      await this.ensureProcessAttendanceProcedure();
      // Check status
      const statusRes = await executeQuery(
        `SELECT STATUS FROM USER_OBJECTS WHERE OBJECT_NAME = 'HRMS_PROCESS_ATTENDANCE' AND OBJECT_TYPE = 'PROCEDURE'`
      );
      const status = statusRes.rows?.[0]?.STATUS || 'UNKNOWN';
      let errors = [];
      if (status !== 'VALID') {
        const errRes = await executeQuery(
          `SELECT LINE, POSITION, TEXT FROM USER_ERRORS WHERE NAME = 'HRMS_PROCESS_ATTENDANCE' AND TYPE = 'PROCEDURE' ORDER BY SEQUENCE`
        );
        errors = errRes.rows || [];
      }
      return { status, errors };
    } catch (e) {
      // Surface privilege issues clearly
      return { status: 'FAILED', errors: [{ LINE: 0, POSITION: 0, TEXT: e.message }] };
    }
  }

  // Ensure monthly attendance summary table exists
  static async ensureAttendanceSummaryTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY (
        SUMMARY_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        PERIOD_YEAR NUMBER(4) NOT NULL,
        PERIOD_MONTH NUMBER(2) NOT NULL,
        EMPLOYEE_ID NUMBER NOT NULL,
        PRESENT_DAYS NUMBER,
        TOTAL_WORK_HOURS NUMBER(7,2),
        TOTAL_OT_HOURS NUMBER(7,2),
        TOTAL_LATE_MINUTES NUMBER(9),
        TOTAL_SHORT_HOURS NUMBER(7,2),
        PAID_LEAVE_DAYS NUMBER(7,2),
        UNPAID_LEAVE_DAYS NUMBER(7,2),
        PAYABLE_DAYS NUMBER(7,2),
        FINAL_PRESENT_DAYS NUMBER(7,2),
        FINAL_WORK_HOURS NUMBER(7,2),
        FINAL_OT_HOURS NUMBER(7,2),
        FINAL_LATE_MINUTES NUMBER(9),
        FINAL_SHORT_HOURS NUMBER(7,2),
        FINAL_PAID_LEAVE_DAYS NUMBER(7,2),
        FINAL_UNPAID_LEAVE_DAYS NUMBER(7,2),
        FINAL_PAYABLE_DAYS NUMBER(7,2),
        CREATED_BY NUMBER,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT UQ_ATT_SUMMARY UNIQUE (PERIOD_YEAR, PERIOD_MONTH, EMPLOYEE_ID),
        CONSTRAINT FK_ATT_SUMMARY_EMP FOREIGN KEY (EMPLOYEE_ID) REFERENCES HRMS_EMPLOYEES(EMPLOYEE_ID),
        CONSTRAINT FK_ATT_SUMMARY_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ Created table: HRMS_PAYROLL_ATTENDANCE_SUMMARY');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_PAYROLL_ATTENDANCE_SUMMARY already exists');
      } else {
        throw error;
      }
    }

    // Attempt to add new columns if the table already existed earlier
    const tryAdd = async (sql) => {
      try { await executeQuery(sql); } catch (e) {
        if (!(`${e.message}`.includes('ORA-01430') || `${e.message}`.includes('ORA-01735') || `${e.message}`.includes('ORA-01442'))) {
          // ignore if column exists or invalid alter, otherwise rethrow
          // Note: ORA-01430 column being added already exists
          throw e;
        }
      }
    };
    await tryAdd(`ALTER TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY ADD (PAID_LEAVE_DAYS NUMBER(7,2))`);
    await tryAdd(`ALTER TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY ADD (UNPAID_LEAVE_DAYS NUMBER(7,2))`);
    await tryAdd(`ALTER TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY ADD (PAYABLE_DAYS NUMBER(7,2))`);
    await tryAdd(`ALTER TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY ADD (FINAL_PRESENT_DAYS NUMBER(7,2))`);
    await tryAdd(`ALTER TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY ADD (FINAL_WORK_HOURS NUMBER(7,2))`);
    await tryAdd(`ALTER TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY ADD (FINAL_OT_HOURS NUMBER(7,2))`);
    await tryAdd(`ALTER TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY ADD (FINAL_LATE_MINUTES NUMBER(9))`);
    await tryAdd(`ALTER TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY ADD (FINAL_SHORT_HOURS NUMBER(7,2))`);
    await tryAdd(`ALTER TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY ADD (FINAL_PAID_LEAVE_DAYS NUMBER(7,2))`);
    await tryAdd(`ALTER TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY ADD (FINAL_UNPAID_LEAVE_DAYS NUMBER(7,2))`);
    await tryAdd(`ALTER TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY ADD (FINAL_PAYABLE_DAYS NUMBER(7,2))`);
    await tryAdd(`ALTER TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY ADD (FINAL_REMARKS VARCHAR2(1000))`);
    await tryAdd(`ALTER TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY ADD (WEEKLY_OFF_DAYS NUMBER(7,2))`);
    await tryAdd(`ALTER TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY ADD (WEEKLY_OFF_HOURS NUMBER(7,2))`);
    await tryAdd(`ALTER TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY ADD (HOLIDAY_DAYS NUMBER(7,2))`);
    await tryAdd(`ALTER TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY ADD (HOLIDAY_HOURS NUMBER(7,2))`);
    await tryAdd(`ALTER TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY ADD (PAID_LEAVE_HOURS NUMBER(7,2))`);
    await tryAdd(`ALTER TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY ADD (TOTAL_HOURS NUMBER(7,2))`);
    await tryAdd(`ALTER TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY ADD (REQUIRED_HOURS NUMBER(7,2))`);
    await tryAdd(`ALTER TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY ADD (FINAL_WEEKLY_OFF_DAYS NUMBER(7,2))`);
    await tryAdd(`ALTER TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY ADD (FINAL_WEEKLY_OFF_HOURS NUMBER(7,2))`);
    await tryAdd(`ALTER TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY ADD (FINAL_HOLIDAY_DAYS NUMBER(7,2))`);
    await tryAdd(`ALTER TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY ADD (FINAL_HOLIDAY_HOURS NUMBER(7,2))`);
    await tryAdd(`ALTER TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY ADD (FINAL_PAID_LEAVE_HOURS NUMBER(7,2))`);
    await tryAdd(`ALTER TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY ADD (FINAL_TOTAL_HOURS NUMBER(7,2))`);
    await tryAdd(`ALTER TABLE HRMS_PAYROLL_ATTENDANCE_SUMMARY ADD (FINAL_REQUIRED_HOURS NUMBER(7,2))`);
  }

  // Compute monthly attendance summary across employees
  static async getMonthlyAttendanceSummary(month, year) {
    try {
      console.log('🔄 Fetching payroll attendance summary for:', { month, year });
    const sql = `
      SELECT 
          ps.*,
        e.EMPLOYEE_CODE,
        e.FIRST_NAME,
          e.LAST_NAME
        FROM HRMS_PAYROLL_ATTENDANCE_SUMMARY ps
        JOIN HRMS_EMPLOYEES e ON ps.EMPLOYEE_ID = e.EMPLOYEE_ID
        WHERE ps.PERIOD_YEAR = :year AND ps.PERIOD_MONTH = :month
      ORDER BY e.EMPLOYEE_CODE
    `;
      console.log('🔍 DEBUG: Executing SQL:', sql);
      console.log('🔍 DEBUG: With parameters:', { month: Number(month), year: Number(year) });
      
      const result = await executeQuery(sql, { month: Number(month), year: Number(year) });
      const rows = result.rows || [];
      console.log('✅ Found', rows.length, 'attendance summary records');
      
      if (rows.length > 0) {
        console.log('🔍 DEBUG: First row data:', rows[0]);
        console.log('🔍 DEBUG: First row keys:', Object.keys(rows[0]));
        console.log('🔍 DEBUG: PRESENT_DAYS value:', rows[0].PRESENT_DAYS);
        console.log('🔍 DEBUG: TOTAL_WORK_HOURS value:', rows[0].TOTAL_WORK_HOURS);
        console.log('🔍 DEBUG: HOLIDAY_DAYS value:', rows[0].HOLIDAY_DAYS);
        console.log('🔍 DEBUG: HOLIDAY_HOURS value:', rows[0].HOLIDAY_HOURS);
      }
      
      return rows;
    } catch (error) {
      console.error('❌ Error fetching payroll attendance summary:', error);
      throw error;
    }
  }

  // Save monthly attendance summary to table
  static async saveMonthlyAttendanceSummary(month, year, createdBy) {
    await this.ensureAttendanceSummaryTable();

    // Recompute current summary to ensure integrity
    const summaries = await this.getMonthlyAttendanceSummary(month, year);

    // Upsert rows without touching FINAL_* columns if a row already exists
    for (const row of summaries) {
      // Defensive defaults to avoid NULL merges
      const safeRow = {
        PRESENT_DAYS: row.PRESENT_DAYS ?? 0,
        TOTAL_WORK_HOURS: row.TOTAL_WORK_HOURS ?? 0,
        TOTAL_OT_HOURS: row.TOTAL_OT_HOURS ?? 0,
        TOTAL_LATE_MINUTES: row.TOTAL_LATE_MINUTES ?? 0,
        TOTAL_SHORT_HOURS: row.TOTAL_SHORT_HOURS ?? 0,
        PAID_LEAVE_DAYS: row.PAID_LEAVE_DAYS ?? 0,
        UNPAID_LEAVE_DAYS: row.UNPAID_LEAVE_DAYS ?? 0,
        PAYABLE_DAYS: row.PAYABLE_DAYS ?? ((row.PRESENT_DAYS || 0) + (row.PAID_LEAVE_DAYS || 0)),
        WEEKLY_OFF_DAYS: row.WEEKLY_OFF_DAYS ?? 0,
        WEEKLY_OFF_HOURS: row.WEEKLY_OFF_HOURS ?? 0,
        HOLIDAY_DAYS: row.HOLIDAY_DAYS ?? 0,
        HOLIDAY_HOURS: row.HOLIDAY_HOURS ?? 0,
        PAID_LEAVE_HOURS: row.PAID_LEAVE_HOURS ?? ((row.PAID_LEAVE_DAYS || 0) * 8),
        TOTAL_HOURS: row.TOTAL_HOURS ?? ((row.TOTAL_WORK_HOURS || 0) + (row.TOTAL_OT_HOURS || 0)),
        REQUIRED_HOURS: row.REQUIRED_HOURS ?? 0,
        // Auto-populate FINAL_ columns from base columns
        FINAL_PRESENT_DAYS: row.FINAL_PRESENT_DAYS ?? row.PRESENT_DAYS ?? 0,
        FINAL_WEEKLY_OFF_DAYS: row.FINAL_WEEKLY_OFF_DAYS ?? row.WEEKLY_OFF_DAYS ?? 0,
        FINAL_HOLIDAY_DAYS: row.FINAL_HOLIDAY_DAYS ?? row.HOLIDAY_DAYS ?? 0,
        FINAL_PAID_LEAVE_DAYS: row.FINAL_PAID_LEAVE_DAYS ?? row.PAID_LEAVE_DAYS ?? 0,
        FINAL_UNPAID_LEAVE_DAYS: row.FINAL_UNPAID_LEAVE_DAYS ?? row.UNPAID_LEAVE_DAYS ?? 0,
        FINAL_PAYABLE_DAYS: row.FINAL_PAYABLE_DAYS ?? row.PAYABLE_DAYS ?? ((row.PRESENT_DAYS || 0) + (row.PAID_LEAVE_DAYS || 0)),
        FINAL_WORK_HOURS: row.FINAL_WORK_HOURS ?? row.TOTAL_WORK_HOURS ?? 0,
        FINAL_WEEKLY_OFF_HOURS: row.FINAL_WEEKLY_OFF_HOURS ?? row.WEEKLY_OFF_HOURS ?? 0,
        FINAL_HOLIDAY_HOURS: row.FINAL_HOLIDAY_HOURS ?? row.HOLIDAY_HOURS ?? 0,
        FINAL_PAID_LEAVE_HOURS: row.FINAL_PAID_LEAVE_HOURS ?? row.PAID_LEAVE_HOURS ?? ((row.PAID_LEAVE_DAYS || 0) * 8),
        FINAL_TOTAL_HOURS: row.FINAL_TOTAL_HOURS ?? row.TOTAL_HOURS ?? ((row.TOTAL_WORK_HOURS || 0) + (row.TOTAL_OT_HOURS || 0)),
        FINAL_REQUIRED_HOURS: row.FINAL_REQUIRED_HOURS ?? row.REQUIRED_HOURS ?? 0,
        FINAL_OT_HOURS: row.FINAL_OT_HOURS ?? row.TOTAL_OT_HOURS ?? 0,
        FINAL_LATE_MINUTES: row.FINAL_LATE_MINUTES ?? row.TOTAL_LATE_MINUTES ?? 0,
        FINAL_SHORT_HOURS: row.FINAL_SHORT_HOURS ?? row.TOTAL_SHORT_HOURS ?? 0
      };
      const sql = `
        MERGE INTO HRMS_PAYROLL_ATTENDANCE_SUMMARY t
        USING (SELECT :year AS PERIOD_YEAR, :month AS PERIOD_MONTH, :employeeId AS EMPLOYEE_ID FROM dual) s
        ON (t.PERIOD_YEAR = s.PERIOD_YEAR AND t.PERIOD_MONTH = s.PERIOD_MONTH AND t.EMPLOYEE_ID = s.EMPLOYEE_ID)
        WHEN MATCHED THEN UPDATE SET 
          PRESENT_DAYS = :presentDays,
          TOTAL_WORK_HOURS = :totalWorkHours,
          TOTAL_OT_HOURS = :totalOtHours,
          TOTAL_LATE_MINUTES = :totalLateMinutes,
          TOTAL_SHORT_HOURS = :totalShortHours,
          PAID_LEAVE_DAYS = :paidLeaveDays,
          UNPAID_LEAVE_DAYS = :unpaidLeaveDays,
          PAYABLE_DAYS = :payableDays,
          WEEKLY_OFF_DAYS = :weeklyOffDays,
          WEEKLY_OFF_HOURS = :weeklyOffHours,
          HOLIDAY_DAYS = :holidayDays,
          HOLIDAY_HOURS = :holidayHours,
          PAID_LEAVE_HOURS = :paidLeaveHours,
          TOTAL_HOURS = :totalHours,
          REQUIRED_HOURS = :requiredHours,
          FINAL_PRESENT_DAYS = :finalPresentDays,
          FINAL_WEEKLY_OFF_DAYS = :finalWeeklyOffDays,
          FINAL_HOLIDAY_DAYS = :finalHolidayDays,
          FINAL_PAID_LEAVE_DAYS = :finalPaidLeaveDays,
          FINAL_UNPAID_LEAVE_DAYS = :finalUnpaidLeaveDays,
          FINAL_PAYABLE_DAYS = :finalPayableDays,
          FINAL_WORK_HOURS = :finalWorkHours,
          FINAL_WEEKLY_OFF_HOURS = :finalWeeklyOffHours,
          FINAL_HOLIDAY_HOURS = :finalHolidayHours,
          FINAL_PAID_LEAVE_HOURS = :finalPaidLeaveHours,
          FINAL_TOTAL_HOURS = :finalTotalHours,
          FINAL_REQUIRED_HOURS = :finalRequiredHours,
          FINAL_OT_HOURS = :finalOtHours,
          FINAL_LATE_MINUTES = :finalLateMinutes,
          FINAL_SHORT_HOURS = :finalShortHours
        WHEN NOT MATCHED THEN INSERT (
          PERIOD_YEAR, PERIOD_MONTH, EMPLOYEE_ID, PRESENT_DAYS, TOTAL_WORK_HOURS, TOTAL_OT_HOURS, TOTAL_LATE_MINUTES, TOTAL_SHORT_HOURS,
          PAID_LEAVE_DAYS, UNPAID_LEAVE_DAYS, PAYABLE_DAYS,
          WEEKLY_OFF_DAYS, WEEKLY_OFF_HOURS, HOLIDAY_DAYS, HOLIDAY_HOURS, PAID_LEAVE_HOURS, TOTAL_HOURS, REQUIRED_HOURS,
          FINAL_PRESENT_DAYS, FINAL_WEEKLY_OFF_DAYS, FINAL_HOLIDAY_DAYS, FINAL_PAID_LEAVE_DAYS, FINAL_UNPAID_LEAVE_DAYS, FINAL_PAYABLE_DAYS,
          FINAL_WORK_HOURS, FINAL_WEEKLY_OFF_HOURS, FINAL_HOLIDAY_HOURS, FINAL_PAID_LEAVE_HOURS, FINAL_TOTAL_HOURS, FINAL_REQUIRED_HOURS,
          FINAL_OT_HOURS, FINAL_LATE_MINUTES, FINAL_SHORT_HOURS,
          CREATED_BY
        ) VALUES (
          :year, :month, :employeeId, :presentDays, :totalWorkHours, :totalOtHours, :totalLateMinutes, :totalShortHours,
          :paidLeaveDays, :unpaidLeaveDays, :payableDays,
          :weeklyOffDays, :weeklyOffHours, :holidayDays, :holidayHours, :paidLeaveHours, :totalHours, :requiredHours,
          :finalPresentDays, :finalWeeklyOffDays, :finalHolidayDays, :finalPaidLeaveDays, :finalUnpaidLeaveDays, :finalPayableDays,
          :finalWorkHours, :finalWeeklyOffHours, :finalHolidayHours, :finalPaidLeaveHours, :finalTotalHours, :finalRequiredHours,
          :finalOtHours, :finalLateMinutes, :finalShortHours,
          :createdBy
        )`;
      const binds = {
        year,
        month,
        employeeId: row.EMPLOYEE_ID,
        presentDays: safeRow.PRESENT_DAYS,
        totalWorkHours: safeRow.TOTAL_WORK_HOURS,
        totalOtHours: safeRow.TOTAL_OT_HOURS,
        totalLateMinutes: safeRow.TOTAL_LATE_MINUTES,
        totalShortHours: safeRow.TOTAL_SHORT_HOURS,
        paidLeaveDays: safeRow.PAID_LEAVE_DAYS,
        unpaidLeaveDays: safeRow.UNPAID_LEAVE_DAYS,
        payableDays: safeRow.PAYABLE_DAYS,
        weeklyOffDays: safeRow.WEEKLY_OFF_DAYS,
        weeklyOffHours: safeRow.WEEKLY_OFF_HOURS,
        holidayDays: safeRow.HOLIDAY_DAYS,
        holidayHours: safeRow.HOLIDAY_HOURS,
        paidLeaveHours: safeRow.PAID_LEAVE_HOURS,
        totalHours: safeRow.TOTAL_HOURS,
        requiredHours: safeRow.REQUIRED_HOURS,
        finalPresentDays: safeRow.FINAL_PRESENT_DAYS,
        finalWeeklyOffDays: safeRow.FINAL_WEEKLY_OFF_DAYS,
        finalHolidayDays: safeRow.FINAL_HOLIDAY_DAYS,
        finalPaidLeaveDays: safeRow.FINAL_PAID_LEAVE_DAYS,
        finalUnpaidLeaveDays: safeRow.FINAL_UNPAID_LEAVE_DAYS,
        finalPayableDays: safeRow.FINAL_PAYABLE_DAYS,
        finalWorkHours: safeRow.FINAL_WORK_HOURS,
        finalWeeklyOffHours: safeRow.FINAL_WEEKLY_OFF_HOURS,
        finalHolidayHours: safeRow.FINAL_HOLIDAY_HOURS,
        finalPaidLeaveHours: safeRow.FINAL_PAID_LEAVE_HOURS,
        finalTotalHours: safeRow.FINAL_TOTAL_HOURS,
        finalRequiredHours: safeRow.FINAL_REQUIRED_HOURS,
        finalOtHours: safeRow.FINAL_OT_HOURS,
        finalLateMinutes: safeRow.FINAL_LATE_MINUTES,
        finalShortHours: safeRow.FINAL_SHORT_HOURS,
        createdBy: createdBy || null
      };

      try {
        await executeQuery(sql, binds);
      } catch (e) {
        // If CREATED_BY violates FK (e.g., user not in HRMS_USERS), retry with null
        if (`${e.message}`.includes('FK_ATT_SUMMARY_CREATED_BY') || `${e.message}`.includes('ORA-02291')) {
          await executeQuery(sql, { ...binds, createdBy: null });
        } else {
          throw e;
        }
      }
    }

    return { inserted: summaries.length };
  }

  // Upsert FINAL_* editable fields for a summary row
  static async upsertAttendanceFinal(month, year, employeeId, finalValues, baseValues, userId) {
    await this.ensureAttendanceSummaryTable();
    const sql = `
      MERGE INTO HRMS_PAYROLL_ATTENDANCE_SUMMARY t
      USING (SELECT :year AS PERIOD_YEAR, :month AS PERIOD_MONTH, :employeeId AS EMPLOYEE_ID FROM dual) s
      ON (t.PERIOD_YEAR = s.PERIOD_YEAR AND t.PERIOD_MONTH = s.PERIOD_MONTH AND t.EMPLOYEE_ID = s.EMPLOYEE_ID)
      WHEN MATCHED THEN UPDATE SET
        FINAL_PRESENT_DAYS = :finalPresentDays,
        FINAL_WORK_HOURS = :finalWorkHours,
        FINAL_OT_HOURS = :finalOtHours,
        FINAL_LATE_MINUTES = :finalLateMinutes,
        FINAL_SHORT_HOURS = :finalShortHours,
        FINAL_PAID_LEAVE_DAYS = :finalPaidLeaveDays,
        FINAL_UNPAID_LEAVE_DAYS = :finalUnpaidLeaveDays,
        FINAL_PAYABLE_DAYS = :finalPayableDays,
        FINAL_WEEKLY_OFF_DAYS = :finalWeeklyOffDays,
        FINAL_WEEKLY_OFF_HOURS = :finalWeeklyOffHours,
        FINAL_HOLIDAY_DAYS = :finalHolidayDays,
        FINAL_HOLIDAY_HOURS = :finalHolidayHours,
        FINAL_PAID_LEAVE_HOURS = :finalPaidLeaveHours,
        FINAL_TOTAL_HOURS = :finalTotalHours,
        FINAL_REQUIRED_HOURS = :finalRequiredHours,
        FINAL_REMARKS = :finalRemarks
      WHEN NOT MATCHED THEN INSERT (
        PERIOD_YEAR, PERIOD_MONTH, EMPLOYEE_ID, PRESENT_DAYS, TOTAL_WORK_HOURS, TOTAL_OT_HOURS, TOTAL_LATE_MINUTES, TOTAL_SHORT_HOURS,
        PAID_LEAVE_DAYS, UNPAID_LEAVE_DAYS, PAYABLE_DAYS, WEEKLY_OFF_DAYS, WEEKLY_OFF_HOURS, HOLIDAY_DAYS, HOLIDAY_HOURS, PAID_LEAVE_HOURS, TOTAL_HOURS, REQUIRED_HOURS, CREATED_BY,
        FINAL_PRESENT_DAYS, FINAL_WORK_HOURS, FINAL_OT_HOURS, FINAL_LATE_MINUTES, FINAL_SHORT_HOURS, FINAL_PAID_LEAVE_DAYS, FINAL_UNPAID_LEAVE_DAYS, FINAL_PAYABLE_DAYS,
        FINAL_WEEKLY_OFF_DAYS, FINAL_WEEKLY_OFF_HOURS, FINAL_HOLIDAY_DAYS, FINAL_HOLIDAY_HOURS, FINAL_PAID_LEAVE_HOURS, FINAL_TOTAL_HOURS, FINAL_REQUIRED_HOURS, FINAL_REMARKS
      ) VALUES (
        :year, :month, :employeeId, :presentDays, :totalWorkHours, :totalOtHours, :totalLateMinutes, :totalShortHours,
        :paidLeaveDays, :unpaidLeaveDays, :payableDays, :weeklyOffDays, :weeklyOffHours, :holidayDays, :holidayHours, :paidLeaveHours, :totalHours, :requiredHours, :createdBy,
        :finalPresentDays, :finalWorkHours, :finalOtHours, :finalLateMinutes, :finalShortHours, :finalPaidLeaveDays, :finalUnpaidLeaveDays, :finalPayableDays,
        :finalWeeklyOffDays, :finalWeeklyOffHours, :finalHolidayDays, :finalHolidayHours, :finalPaidLeaveHours, :finalTotalHours, :finalRequiredHours, :finalRemarks
      )`;

    const binds = {
      year, month, employeeId,
      finalPresentDays: finalValues.finalPresentDays,
      finalWorkHours: finalValues.finalWorkHours,
      finalOtHours: finalValues.finalOtHours,
      finalLateMinutes: finalValues.finalLateMinutes,
      finalShortHours: finalValues.finalShortHours,
      finalPaidLeaveDays: finalValues.finalPaidLeaveDays,
      finalUnpaidLeaveDays: finalValues.finalUnpaidLeaveDays,
      finalPayableDays: finalValues.finalPayableDays,
      finalWeeklyOffDays: finalValues.finalWeeklyOffDays,
      finalWeeklyOffHours: finalValues.finalWeeklyOffHours,
      finalHolidayDays: finalValues.finalHolidayDays,
      finalHolidayHours: finalValues.finalHolidayHours,
      finalPaidLeaveHours: finalValues.finalPaidLeaveHours,
      finalTotalHours: finalValues.finalTotalHours,
      finalRequiredHours: finalValues.finalRequiredHours,
      finalRemarks: finalValues.finalRemarks || null,
      presentDays: baseValues.presentDays || 0,
      totalWorkHours: baseValues.totalWorkHours || 0,
      totalOtHours: baseValues.totalOtHours || 0,
      totalLateMinutes: baseValues.totalLateMinutes || 0,
      totalShortHours: baseValues.totalShortHours || 0,
      paidLeaveDays: baseValues.paidLeaveDays || 0,
      unpaidLeaveDays: baseValues.unpaidLeaveDays || 0,
      payableDays: baseValues.payableDays || 0,
      weeklyOffDays: baseValues.weeklyOffDays || 0,
      weeklyOffHours: baseValues.weeklyOffHours || 0,
      holidayDays: baseValues.holidayDays || 0,
      holidayHours: baseValues.holidayHours || 0,
      paidLeaveHours: baseValues.paidLeaveHours || 0,
      totalHours: baseValues.totalHours || 0,
      requiredHours: baseValues.requiredHours || 0,
      createdBy: userId
    };

    await executeQuery(sql, binds);
    return true;
  }

  // Check if attendance summary exists for period
  static async attendanceSummaryExists(month, year) {
    await this.ensureAttendanceSummaryTable();
    const sql = `SELECT COUNT(*) AS CNT FROM HRMS_PAYROLL_ATTENDANCE_SUMMARY WHERE PERIOD_YEAR = :year AND PERIOD_MONTH = :month`;
    const result = await executeQuery(sql, { year, month });
    const count = result.rows?.[0]?.CNT || 0;
    return { exists: count > 0, count };
  }

  // Get existing summary rows for period (from summary table)
  static async getExistingAttendanceSummary(month, year) {
    await this.ensureAttendanceSummaryTable();
    const sql = `
      SELECT 
        e.EMPLOYEE_ID,
        e.EMPLOYEE_CODE,
        e.FIRST_NAME,
        e.LAST_NAME,
        s.PRESENT_DAYS,
        s.TOTAL_WORK_HOURS,
        s.TOTAL_OT_HOURS,
        s.TOTAL_LATE_MINUTES,
        s.TOTAL_SHORT_HOURS,
        s.PAID_LEAVE_DAYS,
        s.UNPAID_LEAVE_DAYS,
        s.PAYABLE_DAYS,
        s.FINAL_PRESENT_DAYS,
        s.FINAL_WORK_HOURS,
        s.FINAL_OT_HOURS,
        s.FINAL_LATE_MINUTES,
        s.FINAL_SHORT_HOURS,
        s.FINAL_PAID_LEAVE_DAYS,
        s.FINAL_UNPAID_LEAVE_DAYS,
        s.FINAL_PAYABLE_DAYS,
        s.FINAL_REMARKS
      FROM HRMS_PAYROLL_ATTENDANCE_SUMMARY s
      LEFT JOIN HRMS_EMPLOYEES e ON e.EMPLOYEE_ID = s.EMPLOYEE_ID
      WHERE s.PERIOD_YEAR = :year AND s.PERIOD_MONTH = :month
      ORDER BY e.EMPLOYEE_CODE`;
    const result = await executeQuery(sql, { year, month });
    return result.rows || [];
  }

  // Clean month-end data across related tables for a given month/year
  static async cleanMonthData(month, year) {
    await this.ensureAttendanceSummaryTable();

    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const counts = {
      attendanceSummary: 0,
      approvals: 0,
      earnings: 0,
      deductions: 0,
      details: 0,
      runs: 0,
      periods: 0
    };

    // 1) Delete attendance summary rows
    try {
      const r = await executeQuery(
        `DELETE FROM HRMS_PAYROLL_ATTENDANCE_SUMMARY WHERE PERIOD_YEAR = :year AND PERIOD_MONTH = :month`,
        { year, month }
      );
      counts.attendanceSummary = r.rowsAffected || 0;
    } catch (e) {
      console.log('⚠️ Error deleting attendance summary:', e.message);
    }

    // 2) Locate payroll period for the month
    const period = await this.getPayrollPeriodByDateRange(startDate, endDate);
    if (!period) {
      return counts; // nothing else to clean
    }
    const periodId = period.PERIOD_ID;

    // Helper: delete by sub-select count
    const deleteBySql = async (sql, binds, key) => {
      try {
        const r = await executeQuery(sql, binds);
        counts[key] = (counts[key] || 0) + (r.rowsAffected || 0);
      } catch (e) {
        console.log(`⚠️ Error during cleanup for ${key}:`, e.message);
      }
    };

    // 3) Delete approvals referencing the period or payrolls of the period
    await deleteBySql(
      `DELETE FROM HRMS_PAYROLL_APPROVALS WHERE PERIOD_ID = :periodId OR PAYROLL_ID IN (SELECT PAYROLL_ID FROM HRMS_PAYROLL_DETAILS WHERE PERIOD_ID = :periodId)`,
      { periodId },
      'approvals'
    );

    // 4) Delete earnings for payrolls in the period
    await deleteBySql(
      `DELETE FROM HRMS_PAYROLL_EARNINGS WHERE PAYROLL_ID IN (SELECT PAYROLL_ID FROM HRMS_PAYROLL_DETAILS WHERE PERIOD_ID = :periodId)`,
      { periodId },
      'earnings'
    );

    // 5) Delete deductions for payrolls in the period
    await deleteBySql(
      `DELETE FROM HRMS_PAYROLL_DEDUCTIONS WHERE PAYROLL_ID IN (SELECT PAYROLL_ID FROM HRMS_PAYROLL_DETAILS WHERE PERIOD_ID = :periodId)`,
      { periodId },
      'deductions'
    );

    // 6) Delete payroll details
    await deleteBySql(
      `DELETE FROM HRMS_PAYROLL_DETAILS WHERE PERIOD_ID = :periodId`,
      { periodId },
      'details'
    );

    // 7) Delete payroll runs
    await deleteBySql(
      `DELETE FROM HRMS_PAYROLL_RUNS WHERE PERIOD_ID = :periodId`,
      { periodId },
      'runs'
    );

    // 8) Delete period itself
    await deleteBySql(
      `DELETE FROM HRMS_PAYROLL_PERIODS WHERE PERIOD_ID = :periodId`,
      { periodId },
      'periods'
    );

    return counts;
  }

  // Create payroll tables if not exists
  static async createTables() {
    await this.createPayrollPeriodsTable();
    await this.createPayrollRunsTable();
    await this.createPayrollDetailsTable();
    await this.createPayrollDeductionsTable();
    await this.createPayrollEarningsTable();
    await this.createPayrollSettingsTable();
    await this.createPayrollApprovalsTable();
  }

  // Payroll periods table
  static async createPayrollPeriodsTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_PAYROLL_PERIODS (
        PERIOD_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        PERIOD_NAME VARCHAR2(100) NOT NULL,
        PERIOD_TYPE VARCHAR2(20) DEFAULT 'MONTHLY' CHECK (PERIOD_TYPE IN ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY')),
        START_DATE DATE NOT NULL,
        END_DATE DATE NOT NULL,
        PAY_DATE DATE NOT NULL,
        STATUS VARCHAR2(20) DEFAULT 'DRAFT' CHECK (STATUS IN ('DRAFT', 'PROCESSING', 'COMPLETED', 'APPROVED', 'PAID', 'CANCELLED')),
        TOTAL_EMPLOYEES NUMBER DEFAULT 0,
        TOTAL_GROSS_PAY NUMBER(15,2) DEFAULT 0,
        TOTAL_NET_PAY NUMBER(15,2) DEFAULT 0,
        TOTAL_DEDUCTIONS NUMBER(15,2) DEFAULT 0,
        TOTAL_TAXES NUMBER(15,2) DEFAULT 0,
        CREATED_BY NUMBER,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT FK_PAYROLL_PERIODS_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID),
        CONSTRAINT UQ_PAYROLL_PERIOD_DATES UNIQUE (START_DATE, END_DATE)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_PAYROLL_PERIODS table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_PAYROLL_PERIODS table already exists');
      } else {
        throw error;
      }
    }
  }

  // Payroll runs table
  static async createPayrollRunsTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_PAYROLL_RUNS (
        RUN_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        PERIOD_ID NUMBER NOT NULL,
        RUN_NAME VARCHAR2(100) NOT NULL,
        RUN_TYPE VARCHAR2(20) DEFAULT 'FULL' CHECK (RUN_TYPE IN ('FULL', 'PARTIAL', 'CORRECTION')),
        RUN_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        STATUS VARCHAR2(30) DEFAULT 'IN_PROGRESS' CHECK (STATUS IN ('IN_PROGRESS', 'COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED', 'CANCELLED')),
        TOTAL_EMPLOYEES_PROCESSED NUMBER DEFAULT 0,
        TOTAL_EMPLOYEES_FAILED NUMBER DEFAULT 0,
        PROCESSING_TIME_SECONDS NUMBER,
        ERROR_MESSAGE VARCHAR2(4000),
        CREATED_BY NUMBER,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        COMPLETED_AT TIMESTAMP,
        
        CONSTRAINT FK_PAYROLL_RUNS_PERIOD FOREIGN KEY (PERIOD_ID) REFERENCES HRMS_PAYROLL_PERIODS(PERIOD_ID),
        CONSTRAINT FK_PAYROLL_RUNS_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_PAYROLL_RUNS table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_PAYROLL_RUNS table already exists');
      } else {
        throw error;
      }
    }
  }

  // Payroll details table (main payroll record for each employee)
  static async createPayrollDetailsTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_PAYROLL_DETAILS (
        PAYROLL_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        PERIOD_ID NUMBER NOT NULL,
        EMPLOYEE_ID NUMBER NOT NULL,
        RUN_ID NUMBER,
        BASIC_SALARY NUMBER(15,2) NOT NULL,
        GROSS_SALARY NUMBER(15,2) NOT NULL,
        NET_SALARY NUMBER(15,2) NOT NULL,
        TOTAL_EARNINGS NUMBER(15,2) DEFAULT 0,
        TOTAL_DEDUCTIONS NUMBER(15,2) DEFAULT 0,
        TOTAL_TAXES NUMBER(15,2) DEFAULT 0,
        WORK_DAYS NUMBER(3) DEFAULT 0,
        PRESENT_DAYS NUMBER(3) DEFAULT 0,
        ABSENT_DAYS NUMBER(3) DEFAULT 0,
        LEAVE_DAYS NUMBER(3) DEFAULT 0,
        OVERTIME_HOURS NUMBER(5,2) DEFAULT 0,
        OVERTIME_AMOUNT NUMBER(15,2) DEFAULT 0,
        LATE_DAYS NUMBER(3) DEFAULT 0,
        LATE_DEDUCTION NUMBER(15,2) DEFAULT 0,
        ADVANCE_AMOUNT NUMBER(15,2) DEFAULT 0,
        LOAN_DEDUCTION NUMBER(15,2) DEFAULT 0,
        OTHER_DEDUCTIONS NUMBER(15,2) DEFAULT 0,
        BONUS_AMOUNT NUMBER(15,2) DEFAULT 0,
        ALLOWANCE_AMOUNT NUMBER(15,2) DEFAULT 0,
        REMARKS VARCHAR2(1000),
        STATUS VARCHAR2(20) DEFAULT 'DRAFT' CHECK (STATUS IN ('DRAFT', 'CALCULATED', 'APPROVED', 'PAID', 'CANCELLED')),
        APPROVED_BY NUMBER,
        APPROVED_AT TIMESTAMP,
        PAID_AT TIMESTAMP,
        CREATED_BY NUMBER,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT FK_PAYROLL_DETAILS_PERIOD FOREIGN KEY (PERIOD_ID) REFERENCES HRMS_PAYROLL_PERIODS(PERIOD_ID),
        CONSTRAINT FK_PAYROLL_DETAILS_EMPLOYEE FOREIGN KEY (EMPLOYEE_ID) REFERENCES HRMS_EMPLOYEES(EMPLOYEE_ID),
        CONSTRAINT FK_PAYROLL_DETAILS_RUN FOREIGN KEY (RUN_ID) REFERENCES HRMS_PAYROLL_RUNS(RUN_ID),
        CONSTRAINT FK_PAYROLL_DETAILS_APPROVED_BY FOREIGN KEY (APPROVED_BY) REFERENCES HRMS_USERS(USER_ID),
        CONSTRAINT FK_PAYROLL_DETAILS_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID),
        CONSTRAINT UQ_PAYROLL_EMPLOYEE_PERIOD UNIQUE (EMPLOYEE_ID, PERIOD_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_PAYROLL_DETAILS table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_PAYROLL_DETAILS table already exists');
      } else {
        throw error;
      }
    }
  }

  // Payroll earnings breakdown
  static async createPayrollEarningsTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_PAYROLL_EARNINGS (
        EARNING_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        PAYROLL_ID NUMBER NOT NULL,
        PAY_COMPONENT_ID NUMBER,
        EARNING_TYPE VARCHAR2(50) NOT NULL CHECK (EARNING_TYPE IN ('BASIC', 'HRA', 'DA', 'TA', 'OVERTIME', 'BONUS', 'ALLOWANCE', 'OTHER')),
        AMOUNT NUMBER(15,2) NOT NULL,
        RATE NUMBER(5,2),
        HOURS NUMBER(5,2),
        DESCRIPTION VARCHAR2(500),
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT FK_PAYROLL_EARNINGS_PAYROLL FOREIGN KEY (PAYROLL_ID) REFERENCES HRMS_PAYROLL_DETAILS(PAYROLL_ID),
        CONSTRAINT FK_PAYROLL_EARNINGS_COMPONENT FOREIGN KEY (PAY_COMPONENT_ID) REFERENCES HRMS_PAY_COMPONENTS(PAY_COMPONENT_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_PAYROLL_EARNINGS table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_PAYROLL_EARNINGS table already exists');
      } else {
        throw error;
      }
    }
  }

  // Payroll deductions breakdown
  static async createPayrollDeductionsTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_PAYROLL_DEDUCTIONS (
        DEDUCTION_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        PAYROLL_ID NUMBER NOT NULL,
        DEDUCTION_TYPE VARCHAR2(50) NOT NULL CHECK (DEDUCTION_TYPE IN ('PF', 'ESI', 'TAX', 'ADVANCE', 'LOAN', 'LATE', 'OTHER')),
        REFERENCE_ID NUMBER,
        REFERENCE_TYPE VARCHAR2(50),
        AMOUNT NUMBER(15,2) NOT NULL,
        RATE NUMBER(5,2),
        DESCRIPTION VARCHAR2(500),
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT FK_PAYROLL_DEDUCTIONS_PAYROLL FOREIGN KEY (PAYROLL_ID) REFERENCES HRMS_PAYROLL_DETAILS(PAYROLL_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_PAYROLL_DEDUCTIONS table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_PAYROLL_DEDUCTIONS table already exists');
      } else {
        throw error;
      }
    }
  }

  // Payroll settings table
  static async createPayrollSettingsTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_PAYROLL_SETTINGS (
        SETTING_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        SETTING_KEY VARCHAR2(100) UNIQUE NOT NULL,
        SETTING_VALUE VARCHAR2(500),
        SETTING_TYPE VARCHAR2(20) DEFAULT 'STRING' CHECK (SETTING_TYPE IN ('STRING', 'NUMBER', 'BOOLEAN', 'JSON')),
        DESCRIPTION VARCHAR2(500),
        IS_ACTIVE NUMBER(1) DEFAULT 1 CHECK (IS_ACTIVE IN (0, 1)),
        CREATED_BY NUMBER,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT FK_PAYROLL_SETTINGS_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_PAYROLL_SETTINGS table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_PAYROLL_SETTINGS table already exists');
      } else {
        throw error;
      }
    }
  }

  // Payroll approvals table
  static async createPayrollApprovalsTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_PAYROLL_APPROVALS (
        APPROVAL_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        PAYROLL_ID NUMBER,
        PERIOD_ID NUMBER,
        APPROVAL_LEVEL NUMBER(2) DEFAULT 1,
        APPROVAL_TYPE VARCHAR2(20) NOT NULL CHECK (APPROVAL_TYPE IN ('PERIOD', 'PAYROLL', 'PAYMENT')),
        STATUS VARCHAR2(20) DEFAULT 'PENDING' CHECK (STATUS IN ('PENDING', 'APPROVED', 'REJECTED')),
        APPROVED_BY NUMBER,
        APPROVED_AT TIMESTAMP,
        COMMENTS VARCHAR2(1000),
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT FK_PAYROLL_APPROVALS_PAYROLL FOREIGN KEY (PAYROLL_ID) REFERENCES HRMS_PAYROLL_DETAILS(PAYROLL_ID),
        CONSTRAINT FK_PAYROLL_APPROVALS_PERIOD FOREIGN KEY (PERIOD_ID) REFERENCES HRMS_PAYROLL_PERIODS(PERIOD_ID),
        CONSTRAINT FK_PAYROLL_APPROVALS_APPROVED_BY FOREIGN KEY (APPROVED_BY) REFERENCES HRMS_USERS(USER_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_PAYROLL_APPROVALS table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_PAYROLL_APPROVALS table already exists');
      } else {
        throw error;
      }
    }
  }

  // Create payroll period
  static async createPayrollPeriod(periodData, createdBy) {
    const sql = `
      INSERT INTO HRMS_PAYROLL_PERIODS (
        PERIOD_NAME, PERIOD_TYPE, START_DATE, END_DATE, PAY_DATE, 
        STATUS, CREATED_BY
      ) VALUES (
        :periodName, :periodType, TO_DATE(:startDate, 'YYYY-MM-DD'), 
        TO_DATE(:endDate, 'YYYY-MM-DD'), TO_DATE(:payDate, 'YYYY-MM-DD'),
        :status, :createdBy
      ) RETURNING PERIOD_ID INTO :periodId
    `;

    const binds = {
      periodName: periodData.periodName,
      periodType: periodData.periodType || 'MONTHLY',
      startDate: this.formatDateForOracle(periodData.startDate),
      endDate: this.formatDateForOracle(periodData.endDate),
      payDate: this.formatDateForOracle(periodData.payDate),
      status: periodData.status || 'DRAFT',
      createdBy,
      periodId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };

    const result = await executeQuery(sql, binds);
    return result.outBinds.periodId[0];
  }

  // Get payroll period by ID
  static async getPayrollPeriodById(periodId) {
    const sql = `
      SELECT 
        pp.*,
        u.FIRST_NAME as CREATED_BY_FIRST_NAME,
        u.LAST_NAME as CREATED_BY_LAST_NAME
      FROM HRMS_PAYROLL_PERIODS pp
      LEFT JOIN HRMS_USERS u ON pp.CREATED_BY = u.USER_ID
      WHERE pp.PERIOD_ID = :periodId
    `;
    
    const result = await executeQuery(sql, { periodId });
    return result.rows?.[0] || null;
  }

  // Get all payroll periods
  static async getAllPayrollPeriods(filters = {}) {
    let sql = `
      SELECT 
        pp.*,
        u.FIRST_NAME as CREATED_BY_FIRST_NAME,
        u.LAST_NAME as CREATED_BY_LAST_NAME
      FROM HRMS_PAYROLL_PERIODS pp
      LEFT JOIN HRMS_USERS u ON pp.CREATED_BY = u.USER_ID
    `;
    
    const conditions = [];
    const binds = {};
    
    if (filters.status) {
      conditions.push('pp.STATUS = :status');
      binds.status = filters.status;
    }
    
    if (filters.periodType) {
      conditions.push('pp.PERIOD_TYPE = :periodType');
      binds.periodType = filters.periodType;
    }
    
    if (filters.search) {
      conditions.push(`pp.PERIOD_NAME LIKE '%' || :search || '%'`);
      binds.search = filters.search;
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY pp.START_DATE DESC';
    
    const result = await executeQuery(sql, binds);
    return result.rows;
  }

  // Update payroll period
  static async updatePayrollPeriod(periodId, updateData, updatedBy) {
    const sql = `
      UPDATE HRMS_PAYROLL_PERIODS SET
        PERIOD_NAME = :periodName,
        PERIOD_TYPE = :periodType,
        START_DATE = TO_DATE(:startDate, 'YYYY-MM-DD'),
        END_DATE = TO_DATE(:endDate, 'YYYY-MM-DD'),
        PAY_DATE = TO_DATE(:payDate, 'YYYY-MM-DD'),
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE PERIOD_ID = :periodId
    `;

    await executeQuery(sql, {
      periodId,
      periodName: updateData.periodName,
      periodType: updateData.periodType,
      startDate: this.formatDateForOracle(updateData.startDate),
      endDate: this.formatDateForOracle(updateData.endDate),
      payDate: this.formatDateForOracle(updateData.payDate)
    });
  }

  // Create payroll run
  static async createPayrollRun(runData, createdBy) {
    const sql = `
      INSERT INTO HRMS_PAYROLL_RUNS (
        PERIOD_ID, RUN_NAME, RUN_TYPE, STATUS, CREATED_BY
      ) VALUES (
        :periodId, :runName, :runType, :status, :createdBy
      ) RETURNING RUN_ID INTO :runId
    `;

    const binds = {
      periodId: runData.periodId,
      runName: runData.runName,
      runType: runData.runType || 'FULL',
      status: runData.status || 'IN_PROGRESS',
      createdBy,
      runId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };

    const result = await executeQuery(sql, binds);
    return result.outBinds.runId[0];
  }

  // Update payroll run status
  static async updatePayrollRunStatus(runId, status, processingTime = null, errorMessage = null) {
    const sql = `
      UPDATE HRMS_PAYROLL_RUNS SET
        STATUS = :status,
        PROCESSING_TIME_SECONDS = :processingTime,
        ERROR_MESSAGE = :errorMessage,
        COMPLETED_AT = CASE WHEN :status IN ('COMPLETED', 'FAILED') THEN CURRENT_TIMESTAMP ELSE NULL END
      WHERE RUN_ID = :runId
    `;

    await executeQuery(sql, {
      runId,
      status,
      processingTime,
      errorMessage
    });
  }

  // Calculate payroll for an employee
  static async calculateEmployeePayroll(employeeId, periodId, runId, createdBy) {
    try {
      console.log(`🔍 Calculating payroll for employee ${employeeId}, period ${periodId}, run ${runId}`);
      
      // Get period details
      const period = await this.getPayrollPeriodById(periodId);
      if (!period) {
        throw new Error('Payroll period not found');
      }

      console.log('📊 Period details:', period);

      // Get employee details including payroll country
      const Employee = require('./Employee');
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      console.log('📊 Employee details:', {
        id: employee.EMPLOYEE_ID,
        name: `${employee.FIRST_NAME} ${employee.LAST_NAME}`,
        payrollCountry: employee.PAYROLL_COUNTRY,
        employeeType: employee.EMPLOYEE_TYPE
      });

      // Get employee compensation
      const EmployeeCompensation = require('./EmployeeCompensation');
      let compensation = [];
      try {
        compensation = await EmployeeCompensation.getActiveCompensation(employeeId, period.END_DATE);
        console.log('📊 Compensation data:', compensation);
      } catch (error) {
        console.log('⚠️ Error getting compensation, using default values');
        // Create default compensation structure
        compensation = [{
          PAY_COMPONENT_ID: 1,
          COMPONENT_CODE: 'BASIC',
          COMPONENT_NAME: 'Basic Salary',
          COMPONENT_TYPE: 'EARNING',
          AMOUNT: 25000, // Default basic salary
          IS_PERCENTAGE: 0,
          PERCENTAGE: 0
        }];
      }
      
      if (!compensation || compensation.length === 0) {
        console.log('⚠️ No compensation found, using default values');
        compensation = [{
          PAY_COMPONENT_ID: 1,
          COMPONENT_CODE: 'BASIC',
          COMPONENT_NAME: 'Basic Salary',
          COMPONENT_TYPE: 'EARNING',
          AMOUNT: 25000, // Default basic salary
          IS_PERCENTAGE: 0,
          PERCENTAGE: 0
        }];
      }

      // Get attendance data
      const attendanceData = await this.getAttendanceForPeriod(employeeId, period.START_DATE, period.END_DATE);
      console.log('📊 Attendance data:', attendanceData);

      // Get overtime data
      const overtimeData = await this.getOvertimeForPeriod(employeeId, period.START_DATE, period.END_DATE);
      console.log('📊 Overtime data:', overtimeData);

      // Get advances
      const Advance = require('./Advance');
      let advances = [];
      try {
        advances = await Advance.getByEmployeeId(employeeId);
        console.log('📊 Advances data:', advances);
      } catch (error) {
        console.log('⚠️ Error getting advances, using empty array');
        advances = [];
      }

      // Get loans
      const Loan = require('./Loan');
      let loans = [];
      try {
        loans = await Loan.getByEmployeeId(employeeId);
        console.log('📊 Loans data:', loans);
      } catch (error) {
        console.log('⚠️ Error getting loans, using empty array');
        loans = [];
      }

      // Get deductions
      const Deduction = require('./Deduction');
      let deductions = { data: [] };
      try {
        deductions = await Deduction.getAll({ employeeId });
        console.log('📊 Deductions data:', deductions);
      } catch (error) {
        console.log('⚠️ Error getting deductions, using empty array');
        deductions = { data: [] };
      }

      // Use MultiCountryPayrollService for country-specific calculations
      const MultiCountryPayrollService = require('../services/MultiCountryPayrollService');
      
      // Determine payroll country (fallback to India if not set)
      const payrollCountry = employee.PAYROLL_COUNTRY || 'IND';
      console.log('🌍 Using payroll country:', payrollCountry);

      // Prepare employee data for calculation
      const employeeData = {
        countryCode: payrollCountry,
        employeeType: employee.EMPLOYEE_TYPE || 'LOCAL',
        joiningDate: employee.DATE_OF_JOINING,
        airTicketEligible: employee.AIR_TICKET_ELIGIBLE || 0,
        airTicketSegment: employee.AIR_TICKET_SEGMENT || 'ECONOMY',
        nationality: employee.EMPLOYEE_TYPE === 'LOCAL' ? 'LOCAL' : 'EXPATRIATE'
      };

      // Transform compensation data to calculator format
      const compensationForCalc = compensation.map(comp => ({
        componentCode: comp.COMPONENT_CODE || comp.COMPONENT_NAME?.toUpperCase().replace(/\s+/g, '_') || 'UNKNOWN',
        componentName: comp.COMPONENT_NAME,
        componentType: comp.COMPONENT_TYPE,
        amount: comp.AMOUNT || 0,
        isPercentage: comp.IS_PERCENTAGE === 1,
        percentage: comp.PERCENTAGE || 0
      }));

      // Calculate using country-specific logic
      const ctcCalculation = await MultiCountryPayrollService.calculateRealTimeCTC(employeeData, compensationForCalc);
      console.log('📊 Country-specific CTC calculation:', ctcCalculation);

      // Extract values from country-specific calculation
      const basicSalary = ctcCalculation.earnings.basic;
      const grossSalary = ctcCalculation.earnings.gross;
      const statutoryDeductions = ctcCalculation.deductions.employee;
      const employerCosts = ctcCalculation.employerCosts.total;

      console.log('📊 Country-specific calculations:', {
        basicSalary,
        grossSalary,
        statutoryDeductions,
        employerCosts
      });

      // Calculate manual deductions (advances, loans, other deductions)
      const manualDeductions = await this.calculateManualDeductions(
        deductions.data || [],
        advances,
        loans,
        attendanceData,
        period,
        grossSalary
      );
      console.log('📊 Manual deductions:', manualDeductions);

      // Calculate total deductions and net salary
      const totalDeductions = statutoryDeductions + manualDeductions.totalManualDeductions;
      const netSalary = grossSalary - totalDeductions;
      
      console.log('📊 Final calculations:', {
        basicSalary,
        grossSalary,
        totalDeductions,
        netSalary
      });

      // Create payroll detail record with country-specific data
      const payrollData = {
        periodId,
        employeeId,
        runId,
        basicSalary,
        grossSalary,
        netSalary,
        totalEarnings: grossSalary - basicSalary, // Allowances and benefits
        totalDeductions,
        totalTaxes: manualDeductions.taxes || 0,
        workDays: attendanceData.TOTAL_DAYS || 30,
        presentDays: attendanceData.PRESENT_DAYS || 22,
        absentDays: attendanceData.ABSENT_DAYS || 0,
        leaveDays: attendanceData.LEAVE_DAYS || 0,
        overtimeHours: overtimeData.TOTAL_HOURS || 0,
        overtimeAmount: 0, // Will be included in gross calculation
        lateDays: attendanceData.LATE_DAYS || 0,
        lateDeduction: manualDeductions.lateDeduction || 0,
        advanceAmount: manualDeductions.advanceAmount || 0,
        loanDeduction: manualDeductions.loanDeduction || 0,
        otherDeductions: manualDeductions.otherDeductions || 0,
        bonusAmount: 0, // Will be included in gross calculation
        allowanceAmount: grossSalary - basicSalary,
        countryCode: payrollCountry, // Store country used for calculation
        employerCosts, // Store employer costs for reporting
        status: 'CALCULATED',
        createdBy
      };

      console.log('📊 Creating payroll detail with data:', payrollData);
      const payrollId = await this.createPayrollDetail(payrollData);
      console.log('📊 Created payroll detail with ID:', payrollId);

      // Create earnings breakdown
      if (earnings.breakdown && earnings.breakdown.length > 0) {
        await this.createPayrollEarnings(payrollId, earnings.breakdown);
      }

      // Store employer contributions as earnings for CTC tracking
      const statutory = deductionAmounts.breakdown?.__employerContrib;
      if (statutory) {
        const employerEntries = [];
        // Use 'OTHER' earning type to satisfy DB check constraint; keep descriptions
        if (statutory.epfEmployer > 0) employerEntries.push({ type: 'OTHER', amount: statutory.epfEmployer, description: 'EPF Employer' });
        if (statutory.epsEmployer > 0) employerEntries.push({ type: 'OTHER', amount: statutory.epsEmployer, description: 'EPS Employer' });
        if (statutory.esiEmployer > 0) employerEntries.push({ type: 'OTHER', amount: statutory.esiEmployer, description: 'ESI Employer' });
        if (statutory.gratuityEmployer > 0) employerEntries.push({ type: 'OTHER', amount: statutory.gratuityEmployer, description: 'Gratuity Accrual' });
        if (statutory.edliEmployer > 0) employerEntries.push({ type: 'OTHER', amount: statutory.edliEmployer, description: 'EDLI Employer' });
        if (statutory.epfAdmin > 0) employerEntries.push({ type: 'OTHER', amount: statutory.epfAdmin, description: 'EPF Admin Charges' });
        if (employerEntries.length > 0) {
          await this.createPayrollEarnings(payrollId, employerEntries);
        }
      }

      // Create deductions breakdown
      if (deductionAmounts.breakdown && deductionAmounts.breakdown.length > 0) {
        await this.createPayrollDeductions(payrollId, deductionAmounts.breakdown);
      }

      console.log(`✅ Successfully calculated payroll for employee ${employeeId}`);
      return {
        success: true,
        payrollId,
        data: payrollData
      };

    } catch (error) {
      console.error(`❌ Error calculating payroll for employee ${employeeId}:`, error);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  }

  // Calculate manual deductions (non-statutory: advances, loans, other deductions)
  static async calculateManualDeductions(deductions, advances, loans, attendanceData, period, grossSalary) {
    let totalManualDeductions = 0;
    let advanceAmount = 0;
    let loanDeduction = 0;
    let otherDeductions = 0;
    let lateDeduction = 0;
    let taxes = 0;

    // Calculate advance deductions
    if (advances && advances.length > 0) {
      for (const advance of advances) {
        if (advance.STATUS === 'APPROVED' && advance.BALANCE_AMOUNT > 0) {
          // Calculate monthly deduction based on advance amount and installments
          const monthlyDeduction = advance.BALANCE_AMOUNT / (advance.INSTALLMENTS || 1);
          advanceAmount += monthlyDeduction;
        }
      }
    }

    // Calculate loan deductions
    if (loans && loans.length > 0) {
      for (const loan of loans) {
        if (loan.STATUS === 'ACTIVE' && loan.OUTSTANDING_AMOUNT > 0) {
          // Calculate monthly EMI
          const monthlyEMI = loan.EMI_AMOUNT || (loan.OUTSTANDING_AMOUNT / 12); // Default to 12 months
          loanDeduction += monthlyEMI;
        }
      }
    }

    // Calculate other deductions
    if (deductions && deductions.length > 0) {
      for (const deduction of deductions) {
        if (deduction.STATUS === 'ACTIVE') {
          if (deduction.IS_PERCENTAGE === 1) {
            otherDeductions += (grossSalary * deduction.PERCENTAGE) / 100;
          } else {
            otherDeductions += deduction.AMOUNT || 0;
          }
        }
      }
    }

    // Calculate late deduction (if any attendance-based penalties)
    if (attendanceData && attendanceData.LATE_DAYS > 0) {
      // Deduct per day salary for late days (company policy)
      const perDaySalary = grossSalary / 30;
      lateDeduction = attendanceData.LATE_DAYS * perDaySalary * 0.1; // 10% penalty
    }

    totalManualDeductions = advanceAmount + loanDeduction + otherDeductions + lateDeduction + taxes;

    return {
      totalManualDeductions,
      advanceAmount,
      loanDeduction,
      otherDeductions,
      lateDeduction,
      taxes
    };
  }

  // Create payroll detail record
  static async createPayrollDetail(payrollData) {
    const sql = `
      INSERT INTO HRMS_PAYROLL_DETAILS (
        PAYROLL_ID, PERIOD_ID, EMPLOYEE_ID, RUN_ID, BASIC_SALARY, GROSS_SALARY, NET_SALARY,
        TOTAL_EARNINGS, TOTAL_DEDUCTIONS, TOTAL_TAXES, WORK_DAYS, PRESENT_DAYS,
        ABSENT_DAYS, LEAVE_DAYS, OVERTIME_HOURS, OVERTIME_AMOUNT, LATE_DAYS,
        LATE_DEDUCTION, ADVANCE_AMOUNT, LOAN_DEDUCTION, OTHER_DEDUCTIONS,
        BONUS_AMOUNT, ALLOWANCE_AMOUNT, STATUS, CREATED_BY
      ) VALUES (
        HRMS_PAYROLL_DETAILS_SEQ.NEXTVAL, :periodId, :employeeId, :runId, :basicSalary, :grossSalary, :netSalary,
        :totalEarnings, :totalDeductions, :totalTaxes, :workDays, :presentDays,
        :absentDays, :leaveDays, :overtimeHours, :overtimeAmount, :lateDays,
        :lateDeduction, :advanceAmount, :loanDeduction, :otherDeductions,
        :bonusAmount, :allowanceAmount, :status, :createdBy
      ) RETURNING PAYROLL_ID INTO :payrollId
    `;

    const binds = {
      ...payrollData,
      payrollId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };

    const result = await executeQuery(sql, binds);
    const payrollId = result.outBinds.payrollId[0];
    return payrollId;
  }

  // Create payroll earnings breakdown
  static async createPayrollEarnings(payrollId, earnings) {
    for (const earning of earnings) {
      const sql = `
        INSERT INTO HRMS_PAYROLL_EARNINGS (
          EARNING_ID, PAYROLL_ID, PAY_COMPONENT_ID, EARNING_TYPE, AMOUNT, RATE, HOURS, DESCRIPTION
        ) VALUES (
          HRMS_PAYROLL_EARNINGS_SEQ.NEXTVAL, :payrollId, :payComponentId, :earningType, :amount, :rate, :hours, :description
        )
      `;

      await executeQuery(sql, {
        payrollId,
        payComponentId: earning.payComponentId || null,
        earningType: earning.type,
        amount: earning.amount,
        rate: earning.rate || null,
        hours: earning.hours || null,
        description: earning.description || null
      });
    }
  }

  // Create payroll deductions breakdown
  static async createPayrollDeductions(payrollId, deductions) {
    for (const deduction of deductions) {
      const sql = `
        INSERT INTO HRMS_PAYROLL_DEDUCTIONS (
          DEDUCTION_ID, PAYROLL_ID, DEDUCTION_TYPE, REFERENCE_ID, REFERENCE_TYPE, AMOUNT, RATE, DESCRIPTION
        ) VALUES (
          HRMS_PAYROLL_DEDUCTIONS_SEQ.NEXTVAL, :payrollId, :deductionType, :referenceId, :referenceType, :amount, :rate, :description
        )
      `;

      await executeQuery(sql, {
        payrollId,
        deductionType: deduction.type,
        referenceId: deduction.referenceId || null,
        referenceType: deduction.referenceType || null,
        amount: deduction.amount,
        rate: deduction.rate || null,
        description: deduction.description || null
      });
    }
  }

  // Get attendance data for period
  static async getAttendanceForPeriod(employeeId, startDate, endDate) {
    try {
      const sql = `
        SELECT 
          COUNT(*) as TOTAL_DAYS,
          COUNT(CASE WHEN STATUS = 'PRESENT' THEN 1 END) as PRESENT_DAYS,
          COUNT(CASE WHEN STATUS = 'ABSENT' THEN 1 END) as ABSENT_DAYS,
          COUNT(CASE WHEN STATUS = 'LEAVE' THEN 1 END) as LEAVE_DAYS,
          COUNT(CASE WHEN LATE_MINUTES > 0 THEN 1 END) as LATE_DAYS,
          SUM(WORK_HOURS) as TOTAL_WORK_HOURS,
          SUM(OVERTIME_HOURS) as TOTAL_OVERTIME_HOURS,
          SUM(LATE_MINUTES) as TOTAL_LATE_MINUTES
        FROM HRMS_ATTENDANCE
        WHERE EMPLOYEE_ID = :employeeId
        AND ATTENDANCE_DATE BETWEEN TO_DATE(:startDate, 'YYYY-MM-DD') AND TO_DATE(:endDate, 'YYYY-MM-DD')
      `;

      const result = await executeQuery(sql, { 
        employeeId, 
        startDate: this.formatDateForOracle(startDate), 
        endDate: this.formatDateForOracle(endDate) 
      });
      return result.rows?.[0] || {
        TOTAL_DAYS: 0,
        PRESENT_DAYS: 0,
        ABSENT_DAYS: 0,
        LEAVE_DAYS: 0,
        LATE_DAYS: 0,
        TOTAL_WORK_HOURS: 0,
        TOTAL_OVERTIME_HOURS: 0,
        TOTAL_LATE_MINUTES: 0
      };
    } catch (error) {
      console.log('⚠️ Attendance table not found, using default values');
      return {
        TOTAL_DAYS: 22, // Default working days
        PRESENT_DAYS: 20, // Default present days
        ABSENT_DAYS: 0,
        LEAVE_DAYS: 0,
        LATE_DAYS: 0,
        TOTAL_WORK_HOURS: 176, // 8 hours * 22 days
        TOTAL_OVERTIME_HOURS: 0,
        TOTAL_LATE_MINUTES: 0
      };
    }
  }

  // Get overtime data for period
  static async getOvertimeForPeriod(employeeId, startDate, endDate) {
    try {
      const sql = `
        SELECT 
          SUM(OVERTIME_HOURS) as TOTAL_HOURS,
          SUM(OVERTIME_HOURS * RATE_MULTIPLIER) as TOTAL_AMOUNT
        FROM HRMS_OVERTIME
        WHERE EMPLOYEE_ID = :employeeId
        AND OVERTIME_DATE BETWEEN TO_DATE(:startDate, 'YYYY-MM-DD') AND TO_DATE(:endDate, 'YYYY-MM-DD')
        AND STATUS = 'APPROVED'
      `;

      const result = await executeQuery(sql, { 
        employeeId, 
        startDate: this.formatDateForOracle(startDate), 
        endDate: this.formatDateForOracle(endDate) 
      });
      return result.rows?.[0] || { TOTAL_HOURS: 0, TOTAL_AMOUNT: 0 };
    } catch (error) {
      console.log('⚠️ Overtime table not found, using default values');
      return { TOTAL_HOURS: 0, TOTAL_AMOUNT: 0 };
    }
  }

  // Calculate basic salary
  static calculateBasicSalary(compensation) {
    let basicSalary = 0;
    
    // Read configurable basic component codes
    let basicCodes = ['BASIC'];
    try {
      const PayrollSettings = require('./PayrollSettings');
      const settings = (PayrollSettings.getAllSettings && PayrollSettings.getAllSettings.constructor.name === 'AsyncFunction')
        ? null : null; // no-op to keep sync path
    } catch (_) {}

    // Fallback: also treat component type explicitly marked as 'BASIC' as basic
    for (const comp of compensation) {
      const code = String(comp.COMPONENT_CODE || '').toUpperCase();
      const type = String(comp.COMPONENT_TYPE || '').toUpperCase();
      if (type === 'BASIC' || basicCodes.includes(code)) {
        if (comp.IS_PERCENTAGE === 1) {
          // Handle percentage-based basic salary
          basicSalary = comp.AMOUNT; // This should be the base amount
        } else {
          basicSalary = comp.AMOUNT;
        }
        break;
      }
    }
    
    return basicSalary;
  }

  // Calculate earnings
  static calculateEarnings(compensation, overtimeData, period) {
    let totalEarnings = 0;
    let overtimeAmount = 0;
    let bonusAmount = 0;
    let allowanceAmount = 0;
    const breakdown = [];

    // Calculate compensation-based earnings (include every non-deduction component; exclude BASIC which is handled separately)
    for (const comp of compensation) {
      const compCode = String(comp.COMPONENT_CODE || '').toUpperCase();
      const compType = String(comp.COMPONENT_TYPE || '').toUpperCase();
      if (compType !== 'DEDUCTION' && compCode !== 'BASIC') {
        let amount = comp.AMOUNT;
        
        if (comp.IS_PERCENTAGE === 1) {
          // Calculate percentage-based earnings
          const basicSalary = this.calculateBasicSalary(compensation);
          amount = (basicSalary * comp.PERCENTAGE) / 100;
        }

        totalEarnings += amount;

        // Normalize earning type to allowed values
        const allowedTypes = new Set(['BASIC','HRA','DA','TA','OVERTIME','BONUS','ALLOWANCE','OTHER']);
        let earningType = compCode || 'OTHER';
        if (!allowedTypes.has(earningType)) {
          earningType = allowedTypes.has(compType) ? compType : 'ALLOWANCE';
        }

        breakdown.push({
          type: earningType,
          amount: amount,
          payComponentId: comp.PAY_COMPONENT_ID,
          description: comp.COMPONENT_NAME
        });

        if (compCode === 'BONUS') {
          bonusAmount = amount;
        } else if (compType === 'ALLOWANCE' || compCode === 'ALLOWANCE') {
          allowanceAmount = amount;
        }
      }
    }

    // Add explicit basic to breakdown for reporting (if present)
    const basicCode = (compensation.find(c => String(c.COMPONENT_TYPE||'').toUpperCase()==='BASIC' || String(c.COMPONENT_CODE||'').toUpperCase()==='BASIC'));
    if (basicCode) {
      breakdown.push({ type: 'BASIC', amount: this.calculateBasicSalary(compensation), description: basicCode.COMPONENT_NAME || 'Basic Salary', payComponentId: basicCode.PAY_COMPONENT_ID });
    }

    // Add overtime earnings
    if (overtimeData.TOTAL_AMOUNT > 0) {
      totalEarnings += overtimeData.TOTAL_AMOUNT;
      overtimeAmount = overtimeData.TOTAL_AMOUNT;
      
      breakdown.push({
        type: 'OVERTIME',
        amount: overtimeData.TOTAL_AMOUNT,
        hours: overtimeData.TOTAL_HOURS,
        description: 'Overtime Pay'
      });
    }

    return {
      totalEarnings,
      overtimeAmount,
      bonusAmount,
      allowanceAmount,
      breakdown
    };
  }

  /**
   * Compute India statutory contributions and deductions
   * - Employee side: PF (EE), ESI (EE)
   * - Employer side: EPF (ER), EPS (ER), ESI (ER), Gratuity, EDLI, EPF Admin
   * Uses common defaults and statutory caps. Values are monthly and rounded to nearest rupee.
   */
  static async computeIndiaStatutory(basicAmount, compensation, grossAmount) {
    const round = (n) => Math.round(n || 0);
    // Load dynamic settings
    let settings;
    try {
      const PayrollSettings = require('./PayrollSettings');
      settings = await PayrollSettings.getAllSettings();
    } catch (e) {
      settings = {};
    }
    const d = settings.deductions || {};

    // Determine DA if present
    let dearnessAllowance = 0;
    for (const comp of compensation || []) {
      if ((comp.COMPONENT_CODE || '').toUpperCase() === 'DA') {
        dearnessAllowance += Number(comp.AMOUNT || 0);
      }
    }

    const pfBaseCap = Number(d.pfMaxWage ?? 15000);
    const esiWageLimit = Number(d.esiMaxWage ?? 21000);
    const pfEmployeeRate = Number(d.pfEmployeeRate ?? 12) / 100;
    const pfEmployerRate = Number(d.pfEmployerRate ?? 12) / 100;
    const epsRate = Number(d.epsRate ?? 8.33) / 100;
    const epsCap = Number(d.epsCap ?? 1250);
    const esiEmployeeRate = Number(d.esiEmployeeRate ?? 0.75) / 100;
    const esiEmployerRate = Number(d.esiEmployerRate ?? 3.25) / 100;
    const edliRate = Number(d.edliRate ?? 0.5) / 100;
    const edliCap = Number(d.edliCap ?? 75);
    const epfAdminRate = Number(d.epfAdminRate ?? 0.5) / 100;
    const epfAdminCap = Number(d.epfAdminCap ?? 75);
    const gratuityRate = Number(d.gratuityRate ?? 4.81) / 100;

    const baseForPf = Math.min((basicAmount || 0) + (dearnessAllowance || 0), pfBaseCap);

    // Employee PF/ESI
    const epfEmployee = round(baseForPf * pfEmployeeRate);
    const esiEligible = (grossAmount || 0) <= esiWageLimit;
    const esiEmployee = round(esiEligible ? (grossAmount || 0) * esiEmployeeRate : 0);

    // Employer contributions
    const epsEmployerRaw = baseForPf * epsRate;
    const epsEmployer = round(Math.min(epsEmployerRaw, epsCap));
    const epfEmployer = round(Math.max(baseForPf * pfEmployerRate - epsEmployer, 0));
    const esiEmployer = round(esiEligible ? (grossAmount || 0) * esiEmployerRate : 0);
    const gratuityEmployer = round((basicAmount || 0) * gratuityRate);
    const edliEmployer = round(Math.min(baseForPf * edliRate, edliCap));
    const epfAdmin = round(Math.min(baseForPf * epfAdminRate, epfAdminCap));

    return {
      // Employee side
      epfEmployee,
      esiEmployee,
      // Employer side
      epfEmployer,
      epsEmployer,
      esiEmployer,
      gratuityEmployer,
      edliEmployer,
      epfAdmin,
      baseForPf,
      esiEligible
    };
  }

  // Calculate deductions
  static async calculateDeductions(deductions, advances, loans, attendanceData, period, compensation, earnings, basicSalary) {
    let totalDeductions = 0;
    let taxes = 0;
    let lateDeduction = 0;
    let advanceAmount = 0;
    let loanDeduction = 0;
    let otherDeductions = 0;
    const breakdown = [];

    // Compute statutory PF/ESI from compensation snapshot
    try {
      const grossForStat = (basicSalary || 0) + (earnings?.totalEarnings || 0);
      const statutory = await this.computeIndiaStatutory(basicSalary || 0, compensation || [], grossForStat);
      if (statutory.epfEmployee > 0) {
        totalDeductions += statutory.epfEmployee;
        taxes += statutory.epfEmployee;
        breakdown.push({
          type: 'PF',
          amount: statutory.epfEmployee,
          referenceId: null,
          referenceType: 'STATUTORY',
          description: 'EPF Employee (12%)'
        });
      }
      if (statutory.esiEmployee > 0) {
        totalDeductions += statutory.esiEmployee;
        taxes += statutory.esiEmployee;
        breakdown.push({
          type: 'ESI',
          amount: statutory.esiEmployee,
          referenceId: null,
          referenceType: 'STATUTORY',
          description: 'ESI Employee (0.75%)'
        });
      }
      // Attach employer contributions for later storage on the payroll record
      breakdown.__employerContrib = statutory;
    } catch (e) {
      // Non-fatal
      breakdown.__employerContrib = null;
    }

    // Calculate statutory deductions (PF, ESI, Tax)
    for (const comp of deductions) {
      if (comp.DEDUCTION_TYPE === 'PF' || comp.DEDUCTION_TYPE === 'ESI' || comp.DEDUCTION_TYPE === 'TAX') {
        const amount = comp.AMOUNT || 0;
        totalDeductions += amount;
        taxes += amount;
        
        breakdown.push({
          type: comp.DEDUCTION_TYPE,
          amount: amount,
          referenceId: comp.DEDUCTION_ID,
          referenceType: 'DEDUCTION',
          description: `${comp.DEDUCTION_TYPE} Deduction`
        });
      }
    }

    // Calculate late deductions
    if (attendanceData.LATE_DAYS > 0) {
      // Assume 100 per late day (configurable)
      lateDeduction = attendanceData.LATE_DAYS * 100;
      totalDeductions += lateDeduction;
      
      breakdown.push({
        type: 'LATE',
        amount: lateDeduction,
        description: `Late deduction for ${attendanceData.LATE_DAYS} days`
      });
    }

    // Calculate advance deductions
    for (const advance of advances) {
      if (advance.DEDUCTION_MONTH === period.PERIOD_NAME) {
        advanceAmount += advance.AMOUNT;
        totalDeductions += advance.AMOUNT;
        
        breakdown.push({
          type: 'ADVANCE',
          amount: advance.AMOUNT,
          referenceId: advance.ADVANCE_ID,
          referenceType: 'ADVANCE',
          description: `${advance.ADVANCE_TYPE} Advance`
        });
      }
    }

    // Calculate loan deductions
    for (const loan of loans) {
      if (loan.STATUS === 'ACTIVE' && 
          loan.FIRST_DEDUCTION_MONTH <= period.PERIOD_NAME && 
          (loan.LAST_DEDUCTION_MONTH === null || loan.LAST_DEDUCTION_MONTH >= period.PERIOD_NAME)) {
        loanDeduction += loan.MONTHLY_DEDUCTION_AMOUNT;
        totalDeductions += loan.MONTHLY_DEDUCTION_AMOUNT;
        
        breakdown.push({
          type: 'LOAN',
          amount: loan.MONTHLY_DEDUCTION_AMOUNT,
          referenceId: loan.LOAN_ID,
          referenceType: 'LOAN',
          description: `${loan.LOAN_TYPE} Loan`
        });
      }
    }

    // Calculate other deductions
    for (const comp of deductions) {
      if (comp.DEDUCTION_TYPE !== 'PF' && comp.DEDUCTION_TYPE !== 'ESI' && comp.DEDUCTION_TYPE !== 'TAX') {
        const amount = comp.AMOUNT || 0;
        otherDeductions += amount;
        totalDeductions += amount;
        
        breakdown.push({
          type: 'OTHER',
          amount: amount,
          referenceId: comp.DEDUCTION_ID,
          referenceType: 'DEDUCTION',
          description: comp.REASON || 'Other Deduction'
        });
      }
    }

    return {
      totalDeductions,
      taxes,
      lateDeduction,
      advanceAmount,
      loanDeduction,
      otherDeductions,
      breakdown
    };
  }

  // Get payroll details by period
  static async getPayrollDetailsByPeriod(periodId) {
    try {
      console.log('Executing getPayrollDetailsByPeriod for periodId:', periodId);
      
      // First, let's check if the period exists
      const periodCheckSql = `SELECT COUNT(*) as COUNT FROM HRMS_PAYROLL_PERIODS WHERE PERIOD_ID = :periodId`;
      const periodResult = await executeQuery(periodCheckSql, { periodId });
      const periodExists = periodResult.rows[0]?.COUNT > 0;
      
      console.log('Period exists:', periodExists);
      
      if (!periodExists) {
        console.log('Period does not exist, returning empty array');
        return [];
      }
      
      // Check if there are any payroll details for this period
      const detailsCheckSql = `SELECT COUNT(*) as COUNT FROM HRMS_PAYROLL_DETAILS WHERE PERIOD_ID = :periodId`;
      const detailsResult = await executeQuery(detailsCheckSql, { periodId });
      const hasDetails = detailsResult.rows[0]?.COUNT > 0;
      
      console.log('Has payroll details:', hasDetails);
      
      if (!hasDetails) {
        console.log('No payroll details found for period, returning empty array');
        return [];
      }
      
      const sql = `
        SELECT 
          pd.PAYROLL_ID,
          pd.EMPLOYEE_ID,
          pd.PERIOD_ID,
          pd.BASIC_SALARY,
          pd.GROSS_SALARY,
          pd.TOTAL_DEDUCTIONS,
          pd.NET_SALARY,
          pd.STATUS,
          pd.CREATED_AT,
          pd.CREATED_BY,
          e.EMPLOYEE_CODE,
          e.FIRST_NAME as EMPLOYEE_FIRST_NAME,
          e.LAST_NAME as EMPLOYEE_LAST_NAME,
          e.DESIGNATION,
          u.FIRST_NAME as CREATED_BY_FIRST_NAME,
          u.LAST_NAME as CREATED_BY_LAST_NAME
        FROM HRMS_PAYROLL_DETAILS pd
        LEFT JOIN HRMS_EMPLOYEES e ON pd.EMPLOYEE_ID = e.EMPLOYEE_ID
        LEFT JOIN HRMS_USERS u ON pd.CREATED_BY = u.USER_ID
        WHERE pd.PERIOD_ID = :periodId
        ORDER BY e.FIRST_NAME, e.LAST_NAME
      `;

      console.log('SQL Query:', sql);
      console.log('Parameters:', { periodId });

      const result = await executeQuery(sql, { periodId });
      console.log('Query result rows:', result.rows?.length || 0);
      
      return result.rows || [];
    } catch (error) {
      console.error('Error in getPayrollDetailsByPeriod:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  // Get payroll detail by ID with breakdown
  static async getPayrollDetailById(payrollId) {
    try {
      console.log('Executing getPayrollDetailById for payrollId:', payrollId);
      
      // Get main payroll detail
      const sql = `
        SELECT 
          pd.*,
          e.EMPLOYEE_CODE,
          e.FIRST_NAME as EMPLOYEE_FIRST_NAME,
          e.LAST_NAME as EMPLOYEE_LAST_NAME,
          e.DESIGNATION,
          u.FIRST_NAME as CREATED_BY_FIRST_NAME,
          u.LAST_NAME as CREATED_BY_LAST_NAME
        FROM HRMS_PAYROLL_DETAILS pd
        LEFT JOIN HRMS_EMPLOYEES e ON pd.EMPLOYEE_ID = e.EMPLOYEE_ID
        LEFT JOIN HRMS_USERS u ON pd.CREATED_BY = u.USER_ID
        WHERE pd.PAYROLL_ID = :payrollId
      `;

      console.log('SQL Query:', sql);
      console.log('Parameters:', { payrollId });

      const result = await executeQuery(sql, { payrollId });
      console.log('Main query result rows:', result.rows?.length || 0);
      
      const payrollDetail = result.rows?.[0];

      if (!payrollDetail) {
        console.log('No payroll detail found for ID:', payrollId);
        return null;
      }

      console.log('Payroll detail found:', payrollDetail);

      // Get earnings breakdown
      let earnings = [];
      try {
        const earningsSql = `
          SELECT * FROM HRMS_PAYROLL_EARNINGS 
          WHERE PAYROLL_ID = :payrollId
          ORDER BY EARNING_TYPE
        `;
        const earningsResult = await executeQuery(earningsSql, { payrollId });
        earnings = earningsResult.rows || [];
        console.log('Earnings found:', earnings.length);
      } catch (error) {
        console.log('⚠️ Earnings table not found or error:', error.message);
        earnings = [];
      }

      // Get deductions breakdown
      let deductions = [];
      try {
        const deductionsSql = `
          SELECT * FROM HRMS_PAYROLL_DEDUCTIONS 
          WHERE PAYROLL_ID = :payrollId
          ORDER BY DEDUCTION_TYPE
        `;
        const deductionsResult = await executeQuery(deductionsSql, { payrollId });
        deductions = deductionsResult.rows || [];
        console.log('Deductions found:', deductions.length);
      } catch (error) {
        console.log('⚠️ Deductions table not found or error:', error.message);
        deductions = [];
      }

      const finalResult = {
        ...payrollDetail,
        earnings: earnings,
        deductions: deductions
      };

      console.log('Final result prepared with earnings:', earnings.length, 'and deductions:', deductions.length);
      return finalResult;
    } catch (error) {
      console.error('Error in getPayrollDetailById:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  // Approve payroll
  static async approvePayroll(payrollId, approvedBy, comments = null) {
    const sql = `
      UPDATE HRMS_PAYROLL_DETAILS SET
        STATUS = 'APPROVED',
        APPROVED_BY = :approvedBy,
        APPROVED_AT = CURRENT_TIMESTAMP
      WHERE PAYROLL_ID = :payrollId
    `;

    await executeQuery(sql, { payrollId, approvedBy });

    // Create approval record
    const approvalSql = `
      INSERT INTO HRMS_PAYROLL_APPROVALS (
        PAYROLL_ID, APPROVAL_LEVEL, APPROVAL_TYPE, STATUS, APPROVED_BY, COMMENTS
      ) VALUES (
        :payrollId, 1, 'PAYROLL', 'APPROVED', :approvedBy, :comments
      )
    `;

    await executeQuery(approvalSql, { payrollId, approvedBy, comments });
  }

  // Get payroll statistics
  static async getPayrollStatistics(periodId) {
    const sql = `
      SELECT 
        COUNT(*) as TOTAL_EMPLOYEES,
        SUM(GROSS_SALARY) as TOTAL_GROSS_PAY,
        SUM(NET_SALARY) as TOTAL_NET_PAY,
        SUM(TOTAL_DEDUCTIONS) as TOTAL_DEDUCTIONS,
        SUM(TOTAL_TAXES) as TOTAL_TAXES,
        SUM(OVERTIME_AMOUNT) as TOTAL_OVERTIME,
        SUM(BONUS_AMOUNT) as TOTAL_BONUS,
        SUM(ADVANCE_AMOUNT) as TOTAL_ADVANCES,
        SUM(LOAN_DEDUCTION) as TOTAL_LOAN_DEDUCTIONS
      FROM HRMS_PAYROLL_DETAILS
      WHERE PERIOD_ID = :periodId
    `;

    const result = await executeQuery(sql, { periodId });
    return result.rows?.[0] || {};
  }

  // Initialize default payroll settings
  static async initializeDefaultSettings(createdBy) {
    const defaultSettings = [
      {
        settingKey: 'OVERTIME_RATE_NORMAL',
        settingValue: '1.5',
        settingType: 'NUMBER',
        description: 'Normal overtime rate multiplier'
      },
      {
        settingKey: 'OVERTIME_RATE_HOLIDAY',
        settingValue: '2.0',
        settingType: 'NUMBER',
        description: 'Holiday overtime rate multiplier'
      },
      {
        settingKey: 'OVERTIME_RATE_NIGHT',
        settingValue: '1.75',
        settingType: 'NUMBER',
        description: 'Night overtime rate multiplier'
      },
      {
        settingKey: 'LATE_DEDUCTION_PER_DAY',
        settingValue: '100',
        settingType: 'NUMBER',
        description: 'Late deduction amount per day'
      },
      {
        settingKey: 'PF_RATE',
        settingValue: '12',
        settingType: 'NUMBER',
        description: 'Provident Fund rate percentage'
      },
      {
        settingKey: 'ESI_RATE',
        settingValue: '1.75',
        settingType: 'NUMBER',
        description: 'ESI rate percentage'
      }
    ];

    for (const setting of defaultSettings) {
      const sql = `
        INSERT INTO HRMS_PAYROLL_SETTINGS (
          SETTING_KEY, SETTING_VALUE, SETTING_TYPE, DESCRIPTION, CREATED_BY
        ) VALUES (
          :settingKey, :settingValue, :settingType, :description, :createdBy
        )
      `;

      try {
        await executeQuery(sql, { ...setting, createdBy });
      } catch (error) {
        if (!error.message.includes('ORA-00001')) {
          console.error('Error inserting payroll setting:', error);
        }
      }
    }
  }

  // Get payroll period by date range
  static async getPayrollPeriodByDateRange(startDate, endDate) {
    const sql = `
      SELECT * FROM HRMS_PAYROLL_PERIODS 
      WHERE START_DATE = TO_DATE(:startDate, 'YYYY-MM-DD') 
      AND END_DATE = TO_DATE(:endDate, 'YYYY-MM-DD')
    `;
    
    const result = await executeQuery(sql, {
      startDate: this.formatDateForOracle(startDate),
      endDate: this.formatDateForOracle(endDate)
    });
    return result.rows?.[0] || null;
  }

  // Update period totals
  static async updatePeriodTotals(periodId, statistics) {
    const sql = `
      UPDATE HRMS_PAYROLL_PERIODS SET
        TOTAL_EMPLOYEES = :totalEmployees,
        TOTAL_GROSS_PAY = :totalGrossPay,
        TOTAL_NET_PAY = :totalNetPay,
        TOTAL_DEDUCTIONS = :totalDeductions,
        TOTAL_TAXES = :totalTaxes,
        STATUS = 'COMPLETED',
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE PERIOD_ID = :periodId
    `;

    await executeQuery(sql, {
      periodId,
      totalEmployees: statistics.TOTAL_EMPLOYEES || 0,
      totalGrossPay: statistics.TOTAL_GROSS_PAY || 0,
      totalNetPay: statistics.TOTAL_NET_PAY || 0,
      totalDeductions: statistics.TOTAL_DEDUCTIONS || 0,
      totalTaxes: statistics.TOTAL_TAXES || 0
    });
  }

  // Update period status
  static async updatePeriodStatus(periodId, status) {
    const sql = `
      UPDATE HRMS_PAYROLL_PERIODS SET
        STATUS = :status,
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE PERIOD_ID = :periodId
    `;

    await executeQuery(sql, { periodId, status });
  }

  // Get payroll runs by period
  static async getPayrollRunsByPeriod(periodId) {
    const sql = `
      SELECT 
        pr.*,
        u.FIRST_NAME as CREATED_BY_FIRST_NAME,
        u.LAST_NAME as CREATED_BY_LAST_NAME
      FROM HRMS_PAYROLL_RUNS pr
      LEFT JOIN HRMS_USERS u ON pr.CREATED_BY = u.USER_ID
      WHERE pr.PERIOD_ID = :periodId
      ORDER BY pr.CREATED_AT DESC
    `;

    const result = await executeQuery(sql, { periodId });
    return result.rows;
  }

  // Approve payroll period
  static async approvePayrollPeriod(periodId, approvedBy, comments = null) {
    // Update all payroll details for this period
    const sql = `
      UPDATE HRMS_PAYROLL_DETAILS SET
        STATUS = 'APPROVED',
        APPROVED_BY = :approvedBy,
        APPROVED_AT = CURRENT_TIMESTAMP
      WHERE PERIOD_ID = :periodId AND STATUS = 'CALCULATED'
    `;

    await executeQuery(sql, { periodId, approvedBy });

    // Create approval record for the period
    const approvalSql = `
      INSERT INTO HRMS_PAYROLL_APPROVALS (
        PERIOD_ID, APPROVAL_LEVEL, APPROVAL_TYPE, STATUS, APPROVED_BY, COMMENTS
      ) VALUES (
        :periodId, 1, 'PERIOD', 'APPROVED', :approvedBy, :comments
      )
    `;

    await executeQuery(approvalSql, { periodId, approvedBy, comments });
  }

  // Generate summary report
  static async generateSummaryReport(periodId) {
    const sql = `
      SELECT 
        COUNT(*) as TOTAL_EMPLOYEES,
        SUM(GROSS_SALARY) as TOTAL_GROSS_PAY,
        SUM(NET_SALARY) as TOTAL_NET_PAY,
        SUM(TOTAL_DEDUCTIONS) as TOTAL_DEDUCTIONS,
        SUM(TOTAL_TAXES) as TOTAL_TAXES,
        SUM(OVERTIME_AMOUNT) as TOTAL_OVERTIME,
        SUM(BONUS_AMOUNT) as TOTAL_BONUS,
        SUM(ADVANCE_AMOUNT) as TOTAL_ADVANCES,
        SUM(LOAN_DEDUCTION) as TOTAL_LOAN_DEDUCTIONS,
        AVG(GROSS_SALARY) as AVG_GROSS_PAY,
        AVG(NET_SALARY) as AVG_NET_PAY
      FROM HRMS_PAYROLL_DETAILS
      WHERE PERIOD_ID = :periodId
    `;

    const result = await executeQuery(sql, { periodId });
    return result.rows?.[0] || {};
  }

  // Generate detailed report
  static async generateDetailedReport(periodId) {
    const sql = `
      SELECT 
        pd.PAYROLL_ID,
        pd.PERIOD_ID,
        pd.EMPLOYEE_ID,
        pd.RUN_ID,
        pd.BASIC_SALARY,
        pd.GROSS_SALARY,
        pd.NET_SALARY,
        pd.TOTAL_EARNINGS,
        pd.TOTAL_DEDUCTIONS,
        pd.TOTAL_TAXES,
        pd.WORK_DAYS,
        pd.PRESENT_DAYS,
        pd.ABSENT_DAYS,
        pd.LEAVE_DAYS,
        pd.OVERTIME_HOURS,
        pd.OVERTIME_AMOUNT,
        pd.LATE_DAYS,
        pd.LATE_DEDUCTION,
        pd.ADVANCE_AMOUNT,
        pd.LOAN_DEDUCTION,
        pd.OTHER_DEDUCTIONS,
        pd.BONUS_AMOUNT,
        pd.ALLOWANCE_AMOUNT,
        pd.REMARKS,
        pd.STATUS,
        pd.CREATED_AT,
        pd.CREATED_BY,
        e.EMPLOYEE_CODE,
        e.FIRST_NAME as EMPLOYEE_FIRST_NAME,
        e.LAST_NAME as EMPLOYEE_LAST_NAME,
        e.DESIGNATION,
        e.DEPARTMENT,
        e.DATE_OF_JOINING,
        e.IFSC_CODE,
        e.ACCOUNT_NUMBER,
        u.FIRST_NAME as CREATED_BY_FIRST_NAME,
        u.LAST_NAME as CREATED_BY_LAST_NAME,
        NVL(ea.BASIC_AMOUNT, 0) AS BASIC_AMOUNT,
        NVL(ea.HRA_AMOUNT, 0) AS HRA_AMOUNT,
        NVL(ea.CONVEYANCE_AMOUNT, 0) AS CONVEYANCE_AMOUNT,
        NVL(ea.OTHER_ALLOWANCES, 0) AS OTHER_ALLOWANCES,
        NVL(dd.DED_ESI, 0) AS DED_ESI,
        NVL(dd.DED_PF, 0) AS DED_PF,
        NVL(dd.DED_TAX, 0) AS DED_TAX,
        NVL(dd.DED_ADVANCE, 0) AS DED_ADVANCE,
        NVL(dd.DED_OTHER, 0) AS DED_OTHER,
        pd.TOTAL_DEDUCTIONS AS TOTAL_DEDUCTION_AMOUNT
      FROM HRMS_PAYROLL_DETAILS pd
      LEFT JOIN HRMS_EMPLOYEES e ON pd.EMPLOYEE_ID = e.EMPLOYEE_ID
      LEFT JOIN HRMS_USERS u ON pd.CREATED_BY = u.USER_ID
      LEFT JOIN (
        SELECT 
          PAYROLL_ID,
          SUM(CASE WHEN EARNING_TYPE = 'BASIC' THEN AMOUNT ELSE 0 END) AS BASIC_AMOUNT,
          SUM(CASE WHEN EARNING_TYPE = 'HRA' THEN AMOUNT ELSE 0 END) AS HRA_AMOUNT,
          SUM(CASE WHEN EARNING_TYPE = 'TA' THEN AMOUNT ELSE 0 END) AS CONVEYANCE_AMOUNT,
          SUM(CASE 
                WHEN EARNING_TYPE NOT IN ('BASIC','HRA','TA') 
                 AND (DESCRIPTION IS NULL OR DESCRIPTION NOT IN (
                      'ESI Employer','Gratuity Accrual','EDLI Employer','EPF Admin Charges','EPF Employer','EPS Employer'
                 )) 
                THEN AMOUNT ELSE 0 END) AS OTHER_ALLOWANCES
        FROM HRMS_PAYROLL_EARNINGS
        GROUP BY PAYROLL_ID
      ) ea ON ea.PAYROLL_ID = pd.PAYROLL_ID
      LEFT JOIN (
        SELECT 
          PAYROLL_ID,
          SUM(CASE WHEN DEDUCTION_TYPE = 'ESI' THEN AMOUNT ELSE 0 END) AS DED_ESI,
          SUM(CASE WHEN DEDUCTION_TYPE = 'PF' THEN AMOUNT ELSE 0 END) AS DED_PF,
          SUM(CASE WHEN DEDUCTION_TYPE = 'TAX' THEN AMOUNT ELSE 0 END) AS DED_TAX,
          SUM(CASE WHEN DEDUCTION_TYPE = 'ADVANCE' THEN AMOUNT ELSE 0 END) AS DED_ADVANCE,
          SUM(CASE WHEN DEDUCTION_TYPE IN ('OTHER','LATE','LOAN') THEN AMOUNT ELSE 0 END) AS DED_OTHER
        FROM HRMS_PAYROLL_DEDUCTIONS
        GROUP BY PAYROLL_ID
      ) dd ON dd.PAYROLL_ID = pd.PAYROLL_ID
      WHERE pd.PERIOD_ID = :periodId
      ORDER BY e.DEPARTMENT, e.FIRST_NAME, e.LAST_NAME
    `;

    const result = await executeQuery(sql, { periodId });
    return result.rows;
  }

  // Generate department report
  static async generateDepartmentReport(periodId) {
    const sql = `
      SELECT 
        e.DEPARTMENT,
        COUNT(*) as EMPLOYEE_COUNT,
        SUM(pd.GROSS_SALARY) as TOTAL_GROSS_PAY,
        SUM(pd.NET_SALARY) as TOTAL_NET_PAY,
        SUM(pd.TOTAL_DEDUCTIONS) as TOTAL_DEDUCTIONS,
        SUM(pd.TOTAL_TAXES) as TOTAL_TAXES,
        SUM(pd.OVERTIME_AMOUNT) as TOTAL_OVERTIME,
        SUM(pd.BONUS_AMOUNT) as TOTAL_BONUS,
        AVG(pd.GROSS_SALARY) as AVG_GROSS_PAY,
        AVG(pd.NET_SALARY) as AVG_NET_PAY
      FROM HRMS_PAYROLL_DETAILS pd
      LEFT JOIN HRMS_EMPLOYEES e ON pd.EMPLOYEE_ID = e.EMPLOYEE_ID
      WHERE pd.PERIOD_ID = :periodId
      GROUP BY e.DEPARTMENT
      ORDER BY e.DEPARTMENT
    `;

    const result = await executeQuery(sql, { periodId });
    return result.rows;
  }

  // Generate tax report
  static async generateTaxReport(periodId) {
    const sql = `
      SELECT 
        pd.EMPLOYEE_ID,
        e.EMPLOYEE_CODE,
        e.FIRST_NAME as EMPLOYEE_FIRST_NAME,
        e.LAST_NAME as EMPLOYEE_LAST_NAME,
        e.DESIGNATION,
        e.DEPARTMENT,
        pd.GROSS_SALARY,
        pd.TOTAL_TAXES,
        pd.TOTAL_DEDUCTIONS,
        pd.NET_SALARY,
        pe.EARNING_TYPE,
        pe.AMOUNT as EARNING_AMOUNT,
        pd.DEDUCTION_TYPE,
        pd.AMOUNT as DEDUCTION_AMOUNT
      FROM HRMS_PAYROLL_DETAILS pd
      LEFT JOIN HRMS_EMPLOYEES e ON pd.EMPLOYEE_ID = e.EMPLOYEE_ID
      LEFT JOIN HRMS_PAYROLL_EARNINGS pe ON pd.PAYROLL_ID = pe.PAYROLL_ID
      LEFT JOIN HRMS_PAYROLL_DEDUCTIONS pded ON pd.PAYROLL_ID = pded.PAYROLL_ID
      WHERE pd.PERIOD_ID = :periodId
      ORDER BY e.DEPARTMENT, e.FIRST_NAME, e.LAST_NAME
    `;

    const result = await executeQuery(sql, { periodId });
    return result.rows;
  }

  // PF report (India)
  static async generatePFReport(periodId) {
    const sql = `
      SELECT 
        e.EMPLOYEE_CODE,
        e.DEPARTMENT,
        e.DESIGNATION,
        e.FIRST_NAME AS EMPLOYEE_FIRST_NAME,
        e.LAST_NAME AS EMPLOYEE_LAST_NAME,
        e.UAN_NUMBER,
        pd.WORK_DAYS,
        pd.GROSS_SALARY,
        /* Wage bases */
        NVL(pd.PF_WAGE_BASE, 0) AS EPF_WAGES,
        LEAST(NVL(pd.PF_WAGE_BASE, 0), 15000) AS EPS_WAGES,
        LEAST(NVL(pd.GROSS_SALARY, 0), 15000) AS EDLI_WAGES,
        /* Components captured in deductions table */
        NVL(SUM(CASE WHEN d.DEDUCTION_TYPE = 'PF' THEN d.AMOUNT ELSE 0 END),0) AS PF_EE,
        /* Employer side tracked in earnings as OTHER with description */
        NVL(SUM(CASE WHEN pe.DESCRIPTION = 'EPS Employer' THEN pe.AMOUNT ELSE 0 END),0) AS EPS_ER,
        NVL(SUM(CASE WHEN pe.DESCRIPTION = 'EPF Admin Charges' THEN pe.AMOUNT ELSE 0 END),0) AS EPF_ADMIN,
        NVL(SUM(CASE WHEN pe.DESCRIPTION = 'EDLI Employer' THEN pe.AMOUNT ELSE 0 END),0) AS EDLI_ER
      FROM HRMS_PAYROLL_DETAILS pd
      LEFT JOIN HRMS_EMPLOYEES e ON pd.EMPLOYEE_ID = e.EMPLOYEE_ID
      LEFT JOIN HRMS_PAYROLL_DEDUCTIONS d ON pd.PAYROLL_ID = d.PAYROLL_ID
      LEFT JOIN HRMS_PAYROLL_EARNINGS pe ON pd.PAYROLL_ID = pe.PAYROLL_ID
      WHERE pd.PERIOD_ID = :periodId
      GROUP BY e.EMPLOYEE_CODE, e.FIRST_NAME, e.LAST_NAME, e.UAN_NUMBER, pd.WORK_DAYS, pd.GROSS_SALARY, pd.PF_WAGE_BASE
      ORDER BY e.EMPLOYEE_CODE
    `;
    const result = await executeQuery(sql, { periodId });
    return result.rows;
  }

  // ESI report (India)
  static async generateESIReport(periodId) {
    const sql = `
      SELECT 
        e.EMPLOYEE_CODE,
        e.DEPARTMENT,
        e.DESIGNATION,
        e.FIRST_NAME AS EMPLOYEE_FIRST_NAME,
        e.LAST_NAME AS EMPLOYEE_LAST_NAME,
        e.ESI_NUMBER,
        pd.WORK_DAYS,
        /* ESI base approximated as gross salary for the period when eligible */
        NVL(pd.ESI_WAGE_BASE, NVL(pd.GROSS_SALARY,0)) AS ESI_WAGES,
        NVL(SUM(CASE WHEN d.DEDUCTION_TYPE = 'ESI' THEN d.AMOUNT ELSE 0 END),0) AS ESI_EE,
        NVL(SUM(CASE WHEN pe.DESCRIPTION = 'ESI Employer' THEN pe.AMOUNT ELSE 0 END),0) AS ESI_ER
      FROM HRMS_PAYROLL_DETAILS pd
      LEFT JOIN HRMS_EMPLOYEES e ON pd.EMPLOYEE_ID = e.EMPLOYEE_ID
      LEFT JOIN HRMS_PAYROLL_DEDUCTIONS d ON pd.PAYROLL_ID = d.PAYROLL_ID
      LEFT JOIN HRMS_PAYROLL_EARNINGS pe ON pd.PAYROLL_ID = pe.PAYROLL_ID
      WHERE pd.PERIOD_ID = :periodId
      GROUP BY e.EMPLOYEE_CODE, e.FIRST_NAME, e.LAST_NAME, e.ESI_NUMBER, pd.WORK_DAYS, pd.GROSS_SALARY, pd.ESI_WAGE_BASE
      ORDER BY e.EMPLOYEE_CODE
    `;
    const result = await executeQuery(sql, { periodId });
    return result.rows;
  }

  // Bank transfer report
  static async generateBankReport(periodId) {
    const sql = `
      SELECT 
        e.EMPLOYEE_CODE,
        e.DEPARTMENT,
        e.DESIGNATION,
        e.FIRST_NAME AS EMPLOYEE_FIRST_NAME,
        e.LAST_NAME AS EMPLOYEE_LAST_NAME,
        e.IFSC_CODE,
        e.ACCOUNT_NUMBER,
        pd.NET_SALARY
      FROM HRMS_PAYROLL_DETAILS pd
      LEFT JOIN HRMS_EMPLOYEES e ON pd.EMPLOYEE_ID = e.EMPLOYEE_ID
      WHERE pd.PERIOD_ID = :periodId
      ORDER BY e.EMPLOYEE_CODE
    `;
    const result = await executeQuery(sql, { periodId });
    return result.rows;
  }

  // Get payroll runs (for the controller)
  static async getPayrollRuns(filters = {}) {
    let sql = `
      SELECT 
        pr.*,
        pp.PERIOD_NAME,
        u.FIRST_NAME as CREATED_BY_FIRST_NAME,
        u.LAST_NAME as CREATED_BY_LAST_NAME
      FROM HRMS_PAYROLL_RUNS pr
      LEFT JOIN HRMS_PAYROLL_PERIODS pp ON pr.PERIOD_ID = pp.PERIOD_ID
      LEFT JOIN HRMS_USERS u ON pr.CREATED_BY = u.USER_ID
    `;
    
    const conditions = [];
    const binds = {};
    
    if (filters.periodId) {
      conditions.push('pr.PERIOD_ID = :periodId');
      binds.periodId = filters.periodId;
    }
    
    if (filters.status) {
      conditions.push('pr.STATUS = :status');
      binds.status = filters.status;
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY pr.CREATED_AT DESC';
    
    const result = await executeQuery(sql, binds);
    return result.rows;
  }

  // Translate technical errors to user-friendly messages
  static translateErrorToUserMessage(error, employeeName = '') {
    const errorMessage = error.toString().toLowerCase();
    
    // Date format errors
    if (errorMessage.includes('ora-01858') || errorMessage.includes('non-numeric character') || errorMessage.includes('date format')) {
      return {
        type: 'DATE_FORMAT_ERROR',
        title: 'Date Format Issue',
        message: `Invalid date format found for employee ${employeeName}.`,
        action: 'Please check and correct the following date fields:',
        fields: [
          'Employee joining date',
          'Compensation effective date', 
          'Attendance dates',
          'Leave dates',
          'Advance/loan dates'
        ],
        example: 'Dates should be in DD-MM-YYYY format (e.g., 25-12-2024)',
        severity: 'HIGH'
      };
    }

    // Missing compensation errors
    if (errorMessage.includes('no active compensation') || errorMessage.includes('compensation not found')) {
      return {
        type: 'MISSING_COMPENSATION',
        title: 'Missing Compensation Data',
        message: `No active compensation found for employee ${employeeName}.`,
        action: 'Please add compensation details:',
        fields: [
          'Basic salary',
          'HRA amount',
          'DA amount',
          'Other allowances'
        ],
        example: 'Go to Employee > Compensation and add current compensation details',
        severity: 'HIGH'
      };
    }

    // Database constraint errors
    if (errorMessage.includes('ora-02291') || errorMessage.includes('parent key not found')) {
      return {
        type: 'REFERENCE_ERROR',
        title: 'Missing Reference Data',
        message: `Reference data missing for employee ${employeeName}.`,
        action: 'Please ensure the following data exists:',
        fields: [
          'Employee record in HRMS_EMPLOYEES',
          'Department assignment',
          'Position assignment',
          'Pay grade assignment'
        ],
        example: 'Check if employee is properly assigned to department and position',
        severity: 'HIGH'
      };
    }

    // Null value errors
    if (errorMessage.includes('ora-01400') || errorMessage.includes('cannot insert null')) {
      return {
        type: 'NULL_VALUE_ERROR',
        title: 'Missing Required Data',
        message: `Required data is missing for employee ${employeeName}.`,
        action: 'Please fill in the following required fields:',
        fields: [
          'Employee basic information',
          'Compensation details',
          'Department assignment',
          'Position details'
        ],
        example: 'Complete all mandatory fields in employee profile',
        severity: 'MEDIUM'
      };
    }

    // Calculation errors
    if (errorMessage.includes('calculation') || errorMessage.includes('divide by zero') || errorMessage.includes('invalid number')) {
      return {
        type: 'CALCULATION_ERROR',
        title: 'Calculation Error',
        message: `Payroll calculation failed for employee ${employeeName}.`,
        action: 'Please verify the following:',
        fields: [
          'Basic salary amount',
          'Working days calculation',
          'Attendance data',
          'Deduction amounts'
        ],
        example: 'Check if salary amounts and working days are valid numbers',
        severity: 'MEDIUM'
      };
    }

    // Attendance errors
    if (errorMessage.includes('attendance') || errorMessage.includes('work days')) {
      return {
        type: 'ATTENDANCE_ERROR',
        title: 'Attendance Data Issue',
        message: `Attendance data problem for employee ${employeeName}.`,
        action: 'Please check attendance records:',
        fields: [
          'Daily attendance entries',
          'Working days calculation',
          'Present days count',
          'Leave days integration'
        ],
        example: 'Verify attendance is marked for the payroll period',
        severity: 'MEDIUM'
      };
    }

    // Default error
    return {
      type: 'GENERAL_ERROR',
      title: 'Processing Error',
      message: `Payroll processing failed for employee ${employeeName}.`,
      action: 'Please contact system administrator with error details.',
      fields: [],
      example: 'Technical error: ' + error,
      severity: 'HIGH'
    };
  }

  // Create user-friendly error summary
  static createUserFriendlyErrorSummary(errors) {
    if (!errors || errors.length === 0) {
      return null;
    }

    const errorTypes = {};
    const employeeErrors = [];

    // Process each error
    errors.forEach(error => {
      const employeeName = error.employeeName || 'Unknown Employee';
      const translatedError = this.translateErrorToUserMessage(error.error, employeeName);
      
      // Group by error type
      if (!errorTypes[translatedError.type]) {
        errorTypes[translatedError.type] = {
          count: 0,
          details: translatedError,
          employees: []
        };
      }
      errorTypes[translatedError.type].count++;
      errorTypes[translatedError.type].employees.push(employeeName);
      
      // Add to employee-specific errors
      employeeErrors.push({
        employeeName,
        error: translatedError
      });
    });

    // Create summary message
    const errorTypeNames = Object.keys(errorTypes);
    let summaryMessage = `Payroll processing completed with ${errors.length} error(s).\n\n`;
    
    summaryMessage += '**Error Summary:**\n';
    errorTypeNames.forEach(type => {
      const errorInfo = errorTypes[type];
      summaryMessage += `• ${errorInfo.details.title}: ${errorInfo.count} employee(s)\n`;
    });

    summaryMessage += '\n**Required Actions:**\n';
    errorTypeNames.forEach(type => {
      const errorInfo = errorTypes[type];
      summaryMessage += `\n**${errorInfo.details.title}**\n`;
      summaryMessage += `${errorInfo.details.action}\n`;
      errorInfo.details.fields.forEach(field => {
        summaryMessage += `- ${field}\n`;
      });
      summaryMessage += `\nExample: ${errorInfo.details.example}\n`;
      summaryMessage += `Affected employees: ${errorInfo.employees.join(', ')}\n`;
    });

    return {
      summary: summaryMessage,
      errorTypes,
      employeeErrors,
      totalErrors: errors.length
    };
  }

  // Helper method to safely extract Oracle output values (handles both array and direct values)
  static getOutputValue(oracleOutput, defaultValue = null) {
    if (!oracleOutput) return defaultValue;
    return Array.isArray(oracleOutput) ? (oracleOutput[0] ?? defaultValue) : (oracleOutput ?? defaultValue);
  }

  // Call Oracle stored procedure for month-end payroll processing
  static async processMonthEndPayrollProcedure(month, year, processType = 'FULL', createdBy) {
    const { executeQuery } = require('../config/database');
    const oracledb = require('oracledb');

    try {
      // First check if a period already exists for this month/year
      const lastDayOfMonth = new Date(year, month, 0).getDate();
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDayOfMonth}`;
      
      const existingPeriod = await this.getPayrollPeriodByDateRange(startDate, endDate);
      let periodId = null;
      
      if (existingPeriod) {
        periodId = existingPeriod.PERIOD_ID;
        console.log(`Using existing period ID: ${periodId} for ${month}/${year} with status: ${existingPeriod.STATUS}`);
        
        // Check if period is in a processable status
        const processableStatuses = ['DRAFT', 'PROCESSING'];
        if (!processableStatuses.includes(existingPeriod.STATUS)) {
          throw new Error(`Payroll period issue: Invalid period ID or period is not in processable status. Current status: ${existingPeriod.STATUS}. Only periods with status DRAFT or PROCESSING can be processed.`);
        }
      } else {
        // Since P_PERIOD_ID is a required IN parameter, we need to create a period first
        const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
        throw new Error(`Payroll period issue: No payroll period exists for ${monthName} ${year}. Please create a payroll period first before processing payroll.`);
      }

      // Define parameters for the stored procedure call
      const runId = null; // IN parameter (can be null for new run)
      const employeeIds = null; // Process all active employees
      const countryCode = 'IND'; // Process all countries or default
      const dryRun = 'N'; // Actual processing, not validation

      console.log(`P_PERIOD_YEAR: ${year}, P_PERIOD_MONTH: ${month}, P_PERIOD_ID: ${periodId}, P_RUN_ID: ${runId}, P_EMPLOYEE_IDS: ${employeeIds}, P_COUNTRY_CODE: ${countryCode}, P_PROCESS_TYPE: ${processType}, P_CREATED_BY: ${createdBy}, P_DRY_RUN: ${dryRun}`);

      const sql = `
        BEGIN
          HRMS_PROCESS_MONTH_END_PAYROLL(
            P_PERIOD_YEAR => :periodYear,
            P_PERIOD_MONTH => :periodMonth,
            P_PERIOD_ID => :periodId,
            P_RUN_ID => :runId,
            P_EMPLOYEE_IDS => :employeeIds,
            P_COUNTRY_CODE => :countryCode,
            P_PROCESS_TYPE => :processType,
            P_CREATED_BY => :createdBy,
            P_DRY_RUN => :dryRun,
            P_TOTAL_PROCESSED => :totalProcessed,
            P_TOTAL_FAILED => :totalFailed,
            P_ERROR_MESSAGE => :errorMessage
          );
        END;
      `;
      console.log(`Starting procedure call - P_PERIOD_YEAR: ${year}, P_PERIOD_MONTH: ${month}, P_PERIOD_ID: ${periodId}, P_RUN_ID: ${runId}, P_EMPLOYEE_IDS: ${employeeIds}, P_COUNTRY_CODE: ${countryCode}, P_PROCESS_TYPE: ${processType}, P_CREATED_BY: ${createdBy}, P_DRY_RUN: ${dryRun}`);

      const binds = {
        periodYear: year,
        periodMonth: month,
        periodId: periodId, // IN parameter only
        runId: runId, // IN parameter (can be null for new run)
        employeeIds: employeeIds, // Process all active employees
        countryCode: countryCode, // Process all countries or default
        processType: processType || 'FULL',
        createdBy: createdBy,
        dryRun: dryRun, // Actual processing, not validation
        totalProcessed: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
        totalFailed: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
        errorMessage: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 4000 }
      };

      const result = await executeQuery(sql, binds);

      // Check if there was an error from the procedure
      if (result.outBinds && result.outBinds.errorMessage) {
        const errorMsg = Array.isArray(result.outBinds.errorMessage) 
          ? result.outBinds.errorMessage[0] 
          : result.outBinds.errorMessage;
        if (errorMsg) {
          throw new Error(errorMsg);
        }
      }

      // Get the last day of the month for period dates (already calculated above)
      // const lastDayOfMonth, startDate, endDate already defined
      
      // Calculate pay date (usually 5th of next month)
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const payDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-05`;
      const periodName = `${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`;

      return {
        periodId: periodId, // Use the input periodId since it's not an OUT parameter
        runId: null, // Procedure doesn't return run ID as OUT parameter
        results: {
          totalEmployees: this.getOutputValue(result.outBinds?.totalProcessed, 0) + this.getOutputValue(result.outBinds?.totalFailed, 0),
          processedEmployees: this.getOutputValue(result.outBinds?.totalProcessed, 0),
          failedEmployees: this.getOutputValue(result.outBinds?.totalFailed, 0),
          errors: []
        },
        period: {
          name: periodName,
          startDate,
          endDate,
          payDate
        }
      };

    } catch (error) {
      console.error('Error calling HRMS_PROCESS_MONTH_END_PAYROLL procedure:', error);
      
      // Add more detailed error information
      if (error.errorNum) {
        console.error('Oracle Error Number:', error.errorNum);
        console.error('Oracle Error Message:', error.message);
      }
      
      // Create a more descriptive error message
      let errorMessage = error.message;
      if (error.errorNum) {
        errorMessage = `Oracle Error ${error.errorNum}: ${error.message}`;
      } else if (error.message && error.message.includes('ORA-')) {
        errorMessage = error.message;
      } else if (error.message && error.message.toLowerCase().includes('period')) {
        // Specific handling for period-related errors
        errorMessage = `Payroll period issue: ${error.message}`;
      } else if (error.message && error.message.toLowerCase().includes('processable')) {
        // Specific handling for status-related errors
        errorMessage = `Period status issue: ${error.message}`;
      } else {
        errorMessage = `Stored procedure error: ${error.message || 'Unknown error occurred'}`;
      }
      
      const detailedError = new Error(errorMessage);
      detailedError.originalError = error;
      throw detailedError;
    }
  }
}

module.exports = Payroll; 
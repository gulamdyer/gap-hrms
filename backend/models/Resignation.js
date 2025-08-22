const { executeQuery } = require('../config/database');
const oracledb = require('oracledb');

class Resignation {
  static async createTable() {
    const sql = `
      CREATE TABLE HRMS_RESIGNATIONS (
        RESIGNATION_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        EMPLOYEE_ID NUMBER NOT NULL,
        TYPE VARCHAR2(20) NOT NULL CHECK (TYPE IN ('RESIGNATION', 'TERMINATION')),
        REASON VARCHAR2(1000) NOT NULL,
        NOTICE_DATE DATE NOT NULL,
        LAST_WORKING_DATE DATE NOT NULL,
        STATUS VARCHAR2(20) DEFAULT 'PENDING' CHECK (STATUS IN ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN')),
        COMMENTS VARCHAR2(1000),
        ATTACHMENT_URL VARCHAR2(500),
        CREATED_BY NUMBER NOT NULL,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT FK_RESIGNATION_EMPLOYEE FOREIGN KEY (EMPLOYEE_ID) REFERENCES HRMS_EMPLOYEES(EMPLOYEE_ID),
        CONSTRAINT FK_RESIGNATION_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID)
      )
    `;
    try {
      await executeQuery(sql);
      console.log('✅ HRMS_RESIGNATIONS table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_RESIGNATIONS table already exists');
      } else {
        throw error;
      }
    }
  }

  static async create(data) {
    const sql = `
      INSERT INTO HRMS_RESIGNATIONS (
        EMPLOYEE_ID, TYPE, REASON, NOTICE_DATE, LAST_WORKING_DATE, STATUS, COMMENTS, ATTACHMENT_URL, CREATED_BY
      ) VALUES (
        :employeeId, :type, :reason, TO_DATE(:noticeDate, 'YYYY-MM-DD'), TO_DATE(:lastWorkingDate, 'YYYY-MM-DD'), :status, :comments, :attachmentUrl, :createdBy
      ) RETURNING RESIGNATION_ID INTO :resignationId
    `;
    const binds = {
      employeeId: data.employeeId,
      type: data.type,
      reason: data.reason,
      noticeDate: data.noticeDate,
      lastWorkingDate: data.lastWorkingDate,
      status: data.status || 'PENDING',
      comments: data.comments || null,
      attachmentUrl: data.attachmentUrl || null,
      createdBy: data.createdBy,
      resignationId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };
    const result = await executeQuery(sql, binds);
    return result.outBinds.resignationId[0];
  }

  static async update(resignationId, data) {
    const sql = `
      UPDATE HRMS_RESIGNATIONS SET
        TYPE = :type,
        REASON = :reason,
        NOTICE_DATE = TO_DATE(:noticeDate, 'YYYY-MM-DD'),
        LAST_WORKING_DATE = TO_DATE(:lastWorkingDate, 'YYYY-MM-DD'),
        STATUS = :status,
        COMMENTS = :comments,
        ATTACHMENT_URL = :attachmentUrl,
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE RESIGNATION_ID = :resignationId
    `;
    const binds = {
      resignationId,
      type: data.type,
      reason: data.reason,
      noticeDate: data.noticeDate,
      lastWorkingDate: data.lastWorkingDate,
      status: data.status,
      comments: data.comments || null,
      attachmentUrl: data.attachmentUrl || null
    };
    await executeQuery(sql, binds);
  }

  static async delete(resignationId) {
    const sql = 'DELETE FROM HRMS_RESIGNATIONS WHERE RESIGNATION_ID = :resignationId';
    await executeQuery(sql, { resignationId });
  }

  static async findById(resignationId) {
    const sql = `
      SELECT r.*, e.FIRST_NAME, e.LAST_NAME, e.EMPLOYEE_CODE, e.DESIGNATION
      FROM HRMS_RESIGNATIONS r
      LEFT JOIN HRMS_EMPLOYEES e ON r.EMPLOYEE_ID = e.EMPLOYEE_ID
      WHERE r.RESIGNATION_ID = :resignationId
    `;
    const result = await executeQuery(sql, { resignationId });
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async getAll(filters = {}) {
    let sql = `
      SELECT r.*, e.FIRST_NAME, e.LAST_NAME, e.EMPLOYEE_CODE, e.DESIGNATION
      FROM HRMS_RESIGNATIONS r
      LEFT JOIN HRMS_EMPLOYEES e ON r.EMPLOYEE_ID = e.EMPLOYEE_ID
    `;
    const conditions = [];
    const binds = {};
    if (filters.status) {
      conditions.push('r.STATUS = :status');
      binds.status = filters.status;
    }
    if (filters.type) {
      conditions.push('r.TYPE = :type');
      binds.type = filters.type;
    }
    if (filters.employeeId) {
      conditions.push('r.EMPLOYEE_ID = :employeeId');
      binds.employeeId = filters.employeeId;
    }
    if (filters.search) {
      conditions.push(`(
        e.FIRST_NAME LIKE '%' || :search || '%' OR
        e.LAST_NAME LIKE '%' || :search || '%' OR
        e.EMPLOYEE_CODE LIKE '%' || :search || '%' OR
        r.REASON LIKE '%' || :search || '%'
      )`);
      binds.search = filters.search;
    }
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY r.CREATED_AT DESC';
    const result = await executeQuery(sql, binds);
    return result.rows;
  }
}

module.exports = Resignation; 
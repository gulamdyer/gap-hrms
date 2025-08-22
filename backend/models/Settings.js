const { executeQuery } = require('../config/database');
const oracledb = require('oracledb');

class Settings {
  // Create designation table
  static async createDesignationTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_DESIGNATIONS (
        DESIGNATION_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        DESIGNATION_NAME VARCHAR2(100) UNIQUE NOT NULL,
        DESCRIPTION VARCHAR2(500),
        STATUS VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (STATUS IN ('ACTIVE', 'INACTIVE')),
        CREATED_BY NUMBER,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT FK_DESIGNATION_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_DESIGNATIONS table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_DESIGNATIONS table already exists');
      } else {
        throw error;
      }
    }
  }

  // Create role table
  static async createRoleTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_ROLES (
        ROLE_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        ROLE_NAME VARCHAR2(100) UNIQUE NOT NULL,
        DESCRIPTION VARCHAR2(500),
        STATUS VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (STATUS IN ('ACTIVE', 'INACTIVE')),
        CREATED_BY NUMBER,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT FK_ROLE_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_ROLES table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_ROLES table already exists');
      } else {
        throw error;
      }
    }
  }

  // Create position table
  static async createPositionTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_POSITIONS (
        POSITION_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        POSITION_NAME VARCHAR2(100) UNIQUE NOT NULL,
        DESCRIPTION VARCHAR2(500),
        STATUS VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (STATUS IN ('ACTIVE', 'INACTIVE')),
        CREATED_BY NUMBER,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT FK_POSITION_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_POSITIONS table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_POSITIONS table already exists');
      } else {
        throw error;
      }
    }
  }

  // Create location table
  static async createLocationTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_LOCATIONS (
        LOCATION_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        LOCATION_NAME VARCHAR2(100) UNIQUE NOT NULL,
        ADDRESS VARCHAR2(500),
        CITY VARCHAR2(50),
        STATE VARCHAR2(50),
        COUNTRY VARCHAR2(50) DEFAULT 'India',
        PINCODE VARCHAR2(10),
        STATUS VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (STATUS IN ('ACTIVE', 'INACTIVE')),
        CREATED_BY NUMBER,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT FK_LOCATION_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_LOCATIONS table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_LOCATIONS table already exists');
      } else {
        throw error;
      }
    }
  }

  // Create cost center table
  static async createCostCenterTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_COST_CENTERS (
        COST_CENTER_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        COST_CENTER_CODE VARCHAR2(20) UNIQUE NOT NULL,
        COST_CENTER_NAME VARCHAR2(100) NOT NULL,
        DESCRIPTION VARCHAR2(500),
        STATUS VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (STATUS IN ('ACTIVE', 'INACTIVE')),
        CREATED_BY NUMBER,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT FK_COST_CENTER_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_COST_CENTERS table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_COST_CENTERS table already exists');
      } else {
        throw error;
      }
    }
  }

  // Create pay component table
  static async createPayComponentTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_PAY_COMPONENTS (
        PAY_COMPONENT_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        COMPONENT_CODE VARCHAR2(20) UNIQUE NOT NULL,
        COMPONENT_NAME VARCHAR2(100) NOT NULL,
        COMPONENT_TYPE VARCHAR2(20) NOT NULL CHECK (COMPONENT_TYPE IN ('EARNING', 'DEDUCTION', 'ALLOWANCE', 'BONUS')),
        DESCRIPTION VARCHAR2(500),
        IS_TAXABLE VARCHAR2(1) DEFAULT 'N' CHECK (IS_TAXABLE IN ('Y', 'N')),
        IS_PF_APPLICABLE VARCHAR2(1) DEFAULT 'N' CHECK (IS_PF_APPLICABLE IN ('Y', 'N')),
        IS_ESI_APPLICABLE VARCHAR2(1) DEFAULT 'N' CHECK (IS_ESI_APPLICABLE IN ('Y', 'N')),
        -- Statutory and formula fields
        IS_STATUTORY VARCHAR2(1) DEFAULT 'N' CHECK (IS_STATUTORY IN ('Y','N')),
        STATUTORY_CODE VARCHAR2(30),
        IS_EMPLOYEE_PORTION VARCHAR2(1) DEFAULT 'N' CHECK (IS_EMPLOYEE_PORTION IN ('Y','N')),
        IS_EMPLOYER_PORTION VARCHAR2(1) DEFAULT 'N' CHECK (IS_EMPLOYER_PORTION IN ('Y','N')),
        CALCULATION_TYPE VARCHAR2(30), -- FIXED | PERCENT_OF_BASE | FORMULA
        BASE_TYPE VARCHAR2(30),        -- BASIC | DA | BASIC_DA | GROSS | CUSTOM
        PERCENTAGE NUMBER(7,4),        -- e.g. 12.00 for 12%
        CAP_BASE NUMBER(12,2),         -- e.g. 15000
        CAP_AMOUNT NUMBER(12,2),       -- absolute cap, e.g. 75
        MIN_AMOUNT NUMBER(12,2),
        MAX_AMOUNT NUMBER(12,2),
        APPLICABILITY_CONDITION VARCHAR2(200), -- e.g. GROSS<=21000
        FORMULA_TEXT VARCHAR2(4000),
        EFFECTIVE_FROM DATE,
        STATUS VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (STATUS IN ('ACTIVE', 'INACTIVE')),
        CREATED_BY NUMBER,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT FK_PAY_COMPONENT_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_PAY_COMPONENTS table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_PAY_COMPONENTS table already exists');
      } else {
        throw error;
      }
    }
  }

  // Ensure added columns exist on HRMS_PAY_COMPONENTS for rules & formulas
  static async ensurePayComponentRuleColumns() {
    const alterStatements = [
      "ALTER TABLE HRMS_PAY_COMPONENTS ADD (IS_STATUTORY VARCHAR2(1) DEFAULT 'N' CHECK (IS_STATUTORY IN ('Y','N')))",
      "ALTER TABLE HRMS_PAY_COMPONENTS ADD (STATUTORY_CODE VARCHAR2(30))",
      "ALTER TABLE HRMS_PAY_COMPONENTS ADD (IS_EMPLOYEE_PORTION VARCHAR2(1) DEFAULT 'N' CHECK (IS_EMPLOYEE_PORTION IN ('Y','N')))",
      "ALTER TABLE HRMS_PAY_COMPONENTS ADD (IS_EMPLOYER_PORTION VARCHAR2(1) DEFAULT 'N' CHECK (IS_EMPLOYER_PORTION IN ('Y','N')))",
      "ALTER TABLE HRMS_PAY_COMPONENTS ADD (CALCULATION_TYPE VARCHAR2(30))",
      "ALTER TABLE HRMS_PAY_COMPONENTS ADD (BASE_TYPE VARCHAR2(30))",
      "ALTER TABLE HRMS_PAY_COMPONENTS ADD (PERCENTAGE NUMBER(7,4))",
      "ALTER TABLE HRMS_PAY_COMPONENTS ADD (CAP_BASE NUMBER(12,2))",
      "ALTER TABLE HRMS_PAY_COMPONENTS ADD (CAP_AMOUNT NUMBER(12,2))",
      "ALTER TABLE HRMS_PAY_COMPONENTS ADD (MIN_AMOUNT NUMBER(12,2))",
      "ALTER TABLE HRMS_PAY_COMPONENTS ADD (MAX_AMOUNT NUMBER(12,2))",
      "ALTER TABLE HRMS_PAY_COMPONENTS ADD (APPLICABILITY_CONDITION VARCHAR2(200))",
      "ALTER TABLE HRMS_PAY_COMPONENTS ADD (FORMULA_TEXT VARCHAR2(4000))",
      "ALTER TABLE HRMS_PAY_COMPONENTS ADD (EFFECTIVE_FROM DATE)"
    ];
    for (const stmt of alterStatements) {
      try {
        await executeQuery(stmt);
      } catch (error) {
        // Ignore common cases (already exists / locked)
        if (
          error.message.includes('ORA-01430') ||
          error.message.includes('ORA-00955') ||
          error.message.includes('ORA-01442') ||
          error.message.includes('already') ||
          error.message.includes('ORA-00054')
        ) {
          continue;
        }
        // If table missing, attempt to create then continue
        if (error.message.includes('ORA-00942')) {
          await this.createPayComponentTable();
          continue;
        }
        throw error;
      }
    }
  }

  // Create leave policy table
  static async createLeavePolicyTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_LEAVE_POLICIES (
        LEAVE_POLICY_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        LEAVE_CODE VARCHAR2(5) UNIQUE NOT NULL,
        POLICY_NAME VARCHAR2(100) NOT NULL,
        LEAVE_TYPE VARCHAR2(20) NOT NULL CHECK (LEAVE_TYPE IN ('ANNUAL', 'SICK', 'CASUAL', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT', 'COMPENSATORY', 'UNPAID')),
        DESCRIPTION VARCHAR2(500),
        DEFAULT_DAYS NUMBER DEFAULT 0,
        MAX_DAYS NUMBER DEFAULT 0,
        MIN_DAYS NUMBER DEFAULT 0,
        CARRY_FORWARD_DAYS NUMBER DEFAULT 0,
        CARRY_FORWARD_EXPIRY_MONTHS NUMBER DEFAULT 12,
        IS_PAID VARCHAR2(1) DEFAULT 'Y' CHECK (IS_PAID IN ('Y', 'N')),
        REQUIRES_APPROVAL VARCHAR2(1) DEFAULT 'Y' CHECK (REQUIRES_APPROVAL IN ('Y', 'N')),
        ALLOW_HALF_DAY VARCHAR2(1) DEFAULT 'N' CHECK (ALLOW_HALF_DAY IN ('Y', 'N')),
        ALLOW_ATTACHMENT VARCHAR2(1) DEFAULT 'N' CHECK (ALLOW_ATTACHMENT IN ('Y', 'N')),
        APPLICABLE_FROM_MONTHS NUMBER DEFAULT 0,
        APPLICABLE_FROM_DAYS NUMBER DEFAULT 0,
        STATUS VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (STATUS IN ('ACTIVE', 'INACTIVE')),
        CREATED_BY NUMBER,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT FK_LEAVE_POLICY_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_LEAVE_POLICIES table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_LEAVE_POLICIES table already exists');
      } else {
        throw error;
      }
    }
  }

  // Create all tables
  static async createAllTables() {
    await this.createDesignationTable();
    await this.createRoleTable();
    await this.createPositionTable();
    await this.createLocationTable();
    await this.createCostCenterTable();
    await this.createPayComponentTable();
    await this.createLeavePolicyTable();
    await this.createPayGradeTable();
    await this.createDepartmentTable();
    await this.createWorkcenterTable();
    await this.createEmploymentTypeTable();
  }

  // New: Create departments table
  static async createDepartmentTable() {
    const sql = `
      CREATE TABLE HRMS_DEPARTMENTS (
        DEPARTMENT_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        DEPARTMENT_NAME VARCHAR2(100) UNIQUE NOT NULL,
        DESCRIPTION VARCHAR2(500),
        STATUS VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (STATUS IN ('ACTIVE','INACTIVE')),
        CREATED_BY NUMBER,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT FK_DEPARTMENT_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID)
      )
    `;
    try { await executeQuery(sql); } catch (e) { if (!e.message.includes('ORA-00955')) throw e; }
  }

  // New: Create workcenters (sections) table
  static async createWorkcenterTable() {
    const sql = `
      CREATE TABLE HRMS_WORKCENTERS (
        WORKCENTER_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        WORKCENTER_NAME VARCHAR2(100) UNIQUE NOT NULL,
        DESCRIPTION VARCHAR2(500),
        STATUS VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (STATUS IN ('ACTIVE','INACTIVE')),
        CREATED_BY NUMBER,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT FK_WORKCENTER_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID)
      )
    `;
    try { await executeQuery(sql); } catch (e) { if (!e.message.includes('ORA-00955')) throw e; }
  }

  // New: Create employment types table
  static async createEmploymentTypeTable() {
    const sql = `
      CREATE TABLE HRMS_EMPLOYMENT_TYPES (
        EMPLOYMENT_TYPE_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        EMPLOYMENT_TYPE_NAME VARCHAR2(100) UNIQUE NOT NULL,
        DESCRIPTION VARCHAR2(500),
        STATUS VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (STATUS IN ('ACTIVE','INACTIVE')),
        CREATED_BY NUMBER,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT FK_EMPLOYMENT_TYPE_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID)
      )
    `;
    try { await executeQuery(sql); } catch (e) { if (!e.message.includes('ORA-00955')) throw e; }
  }

  // Create pay grade table
  static async createPayGradeTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_PAY_GRADES (
        PAY_GRADE_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        GRADE_CODE VARCHAR2(20) UNIQUE NOT NULL,
        GRADE_NAME VARCHAR2(100) NOT NULL,
        MIN_SALARY NUMBER(10,2),
        MAX_SALARY NUMBER(10,2),
        MID_SALARY NUMBER(10,2),
        DESCRIPTION VARCHAR2(500),
        STATUS VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (STATUS IN ('ACTIVE', 'INACTIVE')),
        CREATED_BY NUMBER,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT FK_PAY_GRADE_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_PAY_GRADES table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_PAY_GRADES table already exists');
      } else {
        throw error;
      }
    }
  }

  // Designation CRUD operations
  static async getAllDesignations(filters = {}) {
    let sql = `
      SELECT d.*, u.FIRST_NAME || ' ' || u.LAST_NAME as CREATED_BY_NAME
      FROM HRMS_DESIGNATIONS d
      LEFT JOIN HRMS_USERS u ON d.CREATED_BY = u.USER_ID
      WHERE 1=1
    `;
    const binds = {};
    if (filters.status) {
      sql += ` AND d.STATUS = :status`;
      binds.status = filters.status;
    }
    if (filters.search) {
      sql += ` AND (d.DESIGNATION_NAME LIKE '%' || :search || '%' OR d.DESCRIPTION LIKE '%' || :search || '%')`;
      binds.search = filters.search;
    }
    sql += ` ORDER BY d.DESIGNATION_NAME`;
    // Pagination
    let page = parseInt(filters.page) || 1;
    let limit = parseInt(filters.limit) || 10;
    let offset = (page - 1) * limit;
    const paginatedSql = `${sql} OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    // Get total count
    const countSql = `SELECT COUNT(*) as TOTAL FROM HRMS_DESIGNATIONS d WHERE 1=1` +
      (filters.status ? ` AND d.STATUS = :status` : '') +
      (filters.search ? ` AND (d.DESIGNATION_NAME LIKE '%' || :search || '%' OR d.DESCRIPTION LIKE '%' || :search || '%')` : '');
    const [result, countResult] = await Promise.all([
      executeQuery(paginatedSql, binds),
      executeQuery(countSql, binds)
    ]);
    return {
      rows: result.rows,
      total: countResult.rows[0].TOTAL
    };
  }

  static async getDesignationById(id) {
    const sql = `
      SELECT d.*, u.FIRST_NAME || ' ' || u.LAST_NAME as CREATED_BY_NAME
      FROM HRMS_DESIGNATIONS d
      LEFT JOIN HRMS_USERS u ON d.CREATED_BY = u.USER_ID
      WHERE d.DESIGNATION_ID = :id
    `;
    
    const result = await executeQuery(sql, { id });
    return result.rows[0];
  }

  static async createDesignation(designationData, createdBy) {
    const sql = `
      INSERT INTO HRMS_DESIGNATIONS (DESIGNATION_NAME, DESCRIPTION, STATUS, CREATED_BY)
      VALUES (:designationName, :description, :status, :createdBy)
      RETURNING DESIGNATION_ID INTO :designationId
    `;
    
    const binds = {
      designationName: designationData.designationName,
      description: designationData.description,
      status: designationData.status || 'ACTIVE',
      createdBy,
      designationId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };
    
    const result = await executeQuery(sql, binds);
    return result.outBinds.designationId[0];
  }

  static async updateDesignation(id, designationData) {
    const sql = `
      UPDATE HRMS_DESIGNATIONS 
      SET DESIGNATION_NAME = :designationName,
          DESCRIPTION = :description,
          STATUS = :status,
          UPDATED_AT = CURRENT_TIMESTAMP
      WHERE DESIGNATION_ID = :id
    `;
    
    const binds = {
      designationName: designationData.designationName,
      description: designationData.description,
      status: designationData.status,
      id
    };
    
    await executeQuery(sql, binds);
  }

  static async deleteDesignation(id) {
    const sql = `DELETE FROM HRMS_DESIGNATIONS WHERE DESIGNATION_ID = :id`;
    await executeQuery(sql, { id });
  }

  // Role CRUD operations
  static async getAllRoles(filters = {}) {
    let sql = `
      SELECT r.*, u.FIRST_NAME || ' ' || u.LAST_NAME as CREATED_BY_NAME
      FROM HRMS_ROLES r
      LEFT JOIN HRMS_USERS u ON r.CREATED_BY = u.USER_ID
      WHERE 1=1
    `;
    const binds = {};
    if (filters.status) {
      sql += ` AND r.STATUS = :status`;
      binds.status = filters.status;
    }
    if (filters.search) {
      sql += ` AND (r.ROLE_NAME LIKE '%' || :search || '%' OR r.DESCRIPTION LIKE '%' || :search || '%')`;
      binds.search = filters.search;
    }
    sql += ` ORDER BY r.ROLE_NAME`;
    // Pagination
    let page = parseInt(filters.page) || 1;
    let limit = parseInt(filters.limit) || 10;
    let offset = (page - 1) * limit;
    const paginatedSql = `${sql} OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    // Get total count
    const countSql = `SELECT COUNT(*) as TOTAL FROM HRMS_ROLES r WHERE 1=1` +
      (filters.status ? ` AND r.STATUS = :status` : '') +
      (filters.search ? ` AND (r.ROLE_NAME LIKE '%' || :search || '%' OR r.DESCRIPTION LIKE '%' || :search || '%')` : '');
    const [result, countResult] = await Promise.all([
      executeQuery(paginatedSql, binds),
      executeQuery(countSql, binds)
    ]);
    return {
      rows: result.rows,
      total: countResult.rows[0].TOTAL
    };
  }

  static async getRoleById(id) {
    const sql = `
      SELECT r.*, u.FIRST_NAME || ' ' || u.LAST_NAME as CREATED_BY_NAME
      FROM HRMS_ROLES r
      LEFT JOIN HRMS_USERS u ON r.CREATED_BY = u.USER_ID
      WHERE r.ROLE_ID = :id
    `;
    
    const result = await executeQuery(sql, { id });
    return result.rows[0];
  }

  static async createRole(roleData, createdBy) {
    const sql = `
      INSERT INTO HRMS_ROLES (ROLE_NAME, DESCRIPTION, STATUS, CREATED_BY)
      VALUES (:roleName, :description, :status, :createdBy)
      RETURNING ROLE_ID INTO :roleId
    `;
    
    const binds = {
      roleName: roleData.roleName,
      description: roleData.description,
      status: roleData.status || 'ACTIVE',
      createdBy,
      roleId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };
    
    const result = await executeQuery(sql, binds);
    return result.outBinds.roleId[0];
  }

  static async updateRole(id, roleData) {
    const sql = `
      UPDATE HRMS_ROLES 
      SET ROLE_NAME = :roleName,
          DESCRIPTION = :description,
          STATUS = :status,
          UPDATED_AT = CURRENT_TIMESTAMP
      WHERE ROLE_ID = :id
    `;
    
    const binds = {
      roleName: roleData.roleName,
      description: roleData.description,
      status: roleData.status,
      id
    };
    
    await executeQuery(sql, binds);
  }

  static async deleteRole(id) {
    const sql = `DELETE FROM HRMS_ROLES WHERE ROLE_ID = :id`;
    await executeQuery(sql, { id });
  }

  // Position CRUD operations
  static async getAllPositions(filters = {}) {
    let sql = `
      SELECT p.*, u.FIRST_NAME || ' ' || u.LAST_NAME as CREATED_BY_NAME
      FROM HRMS_POSITIONS p
      LEFT JOIN HRMS_USERS u ON p.CREATED_BY = u.USER_ID
      WHERE 1=1
    `;
    const binds = {};
    if (filters.status) {
      sql += ` AND p.STATUS = :status`;
      binds.status = filters.status;
    }
    if (filters.search) {
      sql += ` AND (p.POSITION_NAME LIKE '%' || :search || '%' OR p.DESCRIPTION LIKE '%' || :search || '%')`;
      binds.search = filters.search;
    }
    sql += ` ORDER BY p.POSITION_NAME`;
    // Pagination
    let page = parseInt(filters.page) || 1;
    let limit = parseInt(filters.limit) || 10;
    let offset = (page - 1) * limit;
    const paginatedSql = `${sql} OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    // Get total count
    const countSql = `SELECT COUNT(*) as TOTAL FROM HRMS_POSITIONS p WHERE 1=1` +
      (filters.status ? ` AND p.STATUS = :status` : '') +
      (filters.search ? ` AND (p.POSITION_NAME LIKE '%' || :search || '%' OR p.DESCRIPTION LIKE '%' || :search || '%')` : '');
    const [result, countResult] = await Promise.all([
      executeQuery(paginatedSql, binds),
      executeQuery(countSql, binds)
    ]);
    return {
      rows: result.rows,
      total: countResult.rows[0].TOTAL
    };
  }

  static async getPositionById(id) {
    const sql = `
      SELECT p.*, u.FIRST_NAME || ' ' || u.LAST_NAME as CREATED_BY_NAME
      FROM HRMS_POSITIONS p
      LEFT JOIN HRMS_USERS u ON p.CREATED_BY = u.USER_ID
      WHERE p.POSITION_ID = :id
    `;
    
    const result = await executeQuery(sql, { id });
    return result.rows[0];
  }

  static async createPosition(positionData, createdBy) {
    const sql = `
      INSERT INTO HRMS_POSITIONS (POSITION_NAME, DESCRIPTION, STATUS, CREATED_BY)
      VALUES (:positionName, :description, :status, :createdBy)
      RETURNING POSITION_ID INTO :positionId
    `;
    
    const binds = {
      positionName: positionData.positionName,
      description: positionData.description,
      status: positionData.status || 'ACTIVE',
      createdBy,
      positionId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };
    
    const result = await executeQuery(sql, binds);
    return result.outBinds.positionId[0];
  }

  static async updatePosition(id, positionData) {
    const sql = `
      UPDATE HRMS_POSITIONS 
      SET POSITION_NAME = :positionName,
          DESCRIPTION = :description,
          STATUS = :status,
          UPDATED_AT = CURRENT_TIMESTAMP
      WHERE POSITION_ID = :id
    `;
    
    const binds = {
      positionName: positionData.positionName,
      description: positionData.description,
      status: positionData.status,
      id
    };
    
    await executeQuery(sql, binds);
  }

  static async deletePosition(id) {
    const sql = `DELETE FROM HRMS_POSITIONS WHERE POSITION_ID = :id`;
    await executeQuery(sql, { id });
  }

  // Location CRUD operations
  static async getAllLocations(filters = {}) {
    let sql = `
      SELECT l.*, u.FIRST_NAME || ' ' || u.LAST_NAME as CREATED_BY_NAME
      FROM HRMS_LOCATIONS l
      LEFT JOIN HRMS_USERS u ON l.CREATED_BY = u.USER_ID
      WHERE 1=1
    `;
    const binds = {};
    if (filters.status) {
      sql += ` AND l.STATUS = :status`;
      binds.status = filters.status;
    }
    if (filters.search) {
      sql += ` AND (l.LOCATION_NAME LIKE '%' || :search || '%' OR l.CITY LIKE '%' || :search || '%' OR l.STATE LIKE '%' || :search || '%')`;
      binds.search = filters.search;
    }
    sql += ` ORDER BY l.LOCATION_NAME`;
    // Pagination
    let page = parseInt(filters.page) || 1;
    let limit = parseInt(filters.limit) || 10;
    let offset = (page - 1) * limit;
    const paginatedSql = `${sql} OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    // Get total count
    const countSql = `SELECT COUNT(*) as TOTAL FROM HRMS_LOCATIONS l WHERE 1=1` +
      (filters.status ? ` AND l.STATUS = :status` : '') +
      (filters.search ? ` AND (l.LOCATION_NAME LIKE '%' || :search || '%' OR l.CITY LIKE '%' || :search || '%' OR l.STATE LIKE '%' || :search || '%')` : '');
    const [result, countResult] = await Promise.all([
      executeQuery(paginatedSql, binds),
      executeQuery(countSql, binds)
    ]);
    return {
      rows: result.rows,
      total: countResult.rows[0].TOTAL
    };
  }

  static async getLocationById(id) {
    const sql = `
      SELECT l.*, u.FIRST_NAME || ' ' || u.LAST_NAME as CREATED_BY_NAME
      FROM HRMS_LOCATIONS l
      LEFT JOIN HRMS_USERS u ON l.CREATED_BY = u.USER_ID
      WHERE l.LOCATION_ID = :id
    `;
    
    const result = await executeQuery(sql, { id });
    return result.rows[0];
  }

  static async createLocation(locationData, createdBy) {
    const sql = `
      INSERT INTO HRMS_LOCATIONS (LOCATION_NAME, ADDRESS, CITY, STATE, COUNTRY, PINCODE, STATUS, CREATED_BY)
      VALUES (:locationName, :address, :city, :state, :country, :pincode, :status, :createdBy)
      RETURNING LOCATION_ID INTO :locationId
    `;
    
    const binds = {
      locationName: locationData.locationName,
      address: locationData.address,
      city: locationData.city,
      state: locationData.state,
      country: locationData.country || 'India',
      pincode: locationData.pincode,
      status: locationData.status || 'ACTIVE',
      createdBy,
      locationId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };
    
    const result = await executeQuery(sql, binds);
    return result.outBinds.locationId[0];
  }

  static async updateLocation(id, locationData) {
    const sql = `
      UPDATE HRMS_LOCATIONS 
      SET LOCATION_NAME = :locationName,
          ADDRESS = :address,
          CITY = :city,
          STATE = :state,
          COUNTRY = :country,
          PINCODE = :pincode,
          STATUS = :status,
          UPDATED_AT = CURRENT_TIMESTAMP
      WHERE LOCATION_ID = :id
    `;
    
    const binds = {
      locationName: locationData.locationName,
      address: locationData.address,
      city: locationData.city,
      state: locationData.state,
      country: locationData.country,
      pincode: locationData.pincode,
      status: locationData.status,
      id
    };
    
    await executeQuery(sql, binds);
  }

  static async deleteLocation(id) {
    const sql = `DELETE FROM HRMS_LOCATIONS WHERE LOCATION_ID = :id`;
    await executeQuery(sql, { id });
  }

  // Cost Center CRUD operations
  static async getAllCostCenters(filters = {}) {
    let sql = `
      SELECT c.*, u.FIRST_NAME || ' ' || u.LAST_NAME as CREATED_BY_NAME
      FROM HRMS_COST_CENTERS c
      LEFT JOIN HRMS_USERS u ON c.CREATED_BY = u.USER_ID
      WHERE 1=1
    `;
    const binds = {};
    if (filters.status) {
      sql += ` AND c.STATUS = :status`;
      binds.status = filters.status;
    }
    if (filters.search) {
      sql += ` AND (c.COST_CENTER_CODE LIKE '%' || :search || '%' OR c.COST_CENTER_NAME LIKE '%' || :search || '%' OR c.DESCRIPTION LIKE '%' || :search || '%')`;
      binds.search = filters.search;
    }
    sql += ` ORDER BY c.COST_CENTER_NAME`;
    // Pagination
    let page = parseInt(filters.page) || 1;
    let limit = parseInt(filters.limit) || 10;
    let offset = (page - 1) * limit;
    const paginatedSql = `${sql} OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    // Get total count
    const countSql = `SELECT COUNT(*) as TOTAL FROM HRMS_COST_CENTERS c WHERE 1=1` +
      (filters.status ? ` AND c.STATUS = :status` : '') +
      (filters.search ? ` AND (c.COST_CENTER_CODE LIKE '%' || :search || '%' OR c.COST_CENTER_NAME LIKE '%' || :search || '%' OR c.DESCRIPTION LIKE '%' || :search || '%')` : '');
    const [result, countResult] = await Promise.all([
      executeQuery(paginatedSql, binds),
      executeQuery(countSql, binds)
    ]);
    return {
      rows: result.rows,
      total: countResult.rows[0].TOTAL
    };
  }

  // New Entities CRUD
  // Departments
  static async getAllDepartments(filters = {}) {
    let sql = `SELECT d.*, u.FIRST_NAME || ' ' || u.LAST_NAME as CREATED_BY_NAME FROM HRMS_DEPARTMENTS d LEFT JOIN HRMS_USERS u ON d.CREATED_BY = u.USER_ID WHERE 1=1`;
    const binds = {};
    if (filters.status) { sql += ` AND d.STATUS = :status`; binds.status = filters.status; }
    if (filters.search) { sql += ` AND (d.DEPARTMENT_NAME LIKE '%' || :search || '%' OR d.DESCRIPTION LIKE '%' || :search || '%')`; binds.search = filters.search; }
    sql += ` ORDER BY d.DEPARTMENT_NAME`;
    const page = parseInt(filters.page) || 1; const limit = parseInt(filters.limit) || 10; const offset = (page - 1) * limit;
    const paginatedSql = `${sql} OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    const countSql = `SELECT COUNT(*) as TOTAL FROM HRMS_DEPARTMENTS d WHERE 1=1` +
      (filters.status ? ` AND d.STATUS = :status` : '') +
      (filters.search ? ` AND (d.DEPARTMENT_NAME LIKE '%' || :search || '%' OR d.DESCRIPTION LIKE '%' || :search || '%')` : '');
    const [result, countResult] = await Promise.all([executeQuery(paginatedSql, binds), executeQuery(countSql, binds)]);
    return { rows: result.rows, total: countResult.rows[0].TOTAL };
  }
  static async getDepartmentById(id) { const r = await executeQuery(`SELECT * FROM HRMS_DEPARTMENTS WHERE DEPARTMENT_ID = :id`, { id }); return r.rows[0]; }
  static async createDepartment(data, createdBy) {
    const sql = `INSERT INTO HRMS_DEPARTMENTS (DEPARTMENT_NAME, DESCRIPTION, STATUS, CREATED_BY) VALUES (:name,:descriptionVal,:statusVal,:createdBy) RETURNING DEPARTMENT_ID INTO :outId`;
    const binds = { name: data.departmentName, descriptionVal: data.description, statusVal: data.status || 'ACTIVE', createdBy, outId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } };
    const res = await executeQuery(sql, binds); return res.outBinds.outId[0];
  }
  static async updateDepartment(id, data) {
    const sql = `UPDATE HRMS_DEPARTMENTS SET DEPARTMENT_NAME=:name, DESCRIPTION=:descriptionVal, STATUS=:statusVal, UPDATED_AT=CURRENT_TIMESTAMP WHERE DEPARTMENT_ID=:id`;
    await executeQuery(sql, { id, name: data.departmentName, descriptionVal: data.description, statusVal: data.status });
  }
  static async deleteDepartment(id) { await executeQuery(`DELETE FROM HRMS_DEPARTMENTS WHERE DEPARTMENT_ID = :id`, { id }); }

  // Workcenters
  static async getAllWorkcenters(filters = {}) {
    let sql = `SELECT w.*, u.FIRST_NAME || ' ' || u.LAST_NAME as CREATED_BY_NAME FROM HRMS_WORKCENTERS w LEFT JOIN HRMS_USERS u ON w.CREATED_BY = u.USER_ID WHERE 1=1`;
    const binds = {};
    if (filters.status) { sql += ` AND w.STATUS = :status`; binds.status = filters.status; }
    if (filters.search) { sql += ` AND (w.WORKCENTER_NAME LIKE '%' || :search || '%' OR w.DESCRIPTION LIKE '%' || :search || '%')`; binds.search = filters.search; }
    sql += ` ORDER BY w.WORKCENTER_NAME`;
    const page = parseInt(filters.page) || 1; const limit = parseInt(filters.limit) || 10; const offset = (page - 1) * limit;
    const paginatedSql = `${sql} OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    const countSql = `SELECT COUNT(*) as TOTAL FROM HRMS_WORKCENTERS w WHERE 1=1` +
      (filters.status ? ` AND w.STATUS = :status` : '') +
      (filters.search ? ` AND (w.WORKCENTER_NAME LIKE '%' || :search || '%' OR w.DESCRIPTION LIKE '%' || :search || '%')` : '');
    const [result, countResult] = await Promise.all([executeQuery(paginatedSql, binds), executeQuery(countSql, binds)]);
    return { rows: result.rows, total: countResult.rows[0].TOTAL };
  }
  static async getWorkcenterById(id) { const r = await executeQuery(`SELECT * FROM HRMS_WORKCENTERS WHERE WORKCENTER_ID = :id`, { id }); return r.rows[0]; }
  static async createWorkcenter(data, createdBy) {
    const sql = `INSERT INTO HRMS_WORKCENTERS (WORKCENTER_NAME, DESCRIPTION, STATUS, CREATED_BY) VALUES (:name,:descriptionVal,:statusVal,:createdBy) RETURNING WORKCENTER_ID INTO :outId`;
    const binds = { name: data.workcenterName, descriptionVal: data.description, statusVal: data.status || 'ACTIVE', createdBy, outId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } };
    const res = await executeQuery(sql, binds); return res.outBinds.outId[0];
  }
  static async updateWorkcenter(id, data) {
    const sql = `UPDATE HRMS_WORKCENTERS SET WORKCENTER_NAME=:name, DESCRIPTION=:descriptionVal, STATUS=:statusVal, UPDATED_AT=CURRENT_TIMESTAMP WHERE WORKCENTER_ID=:id`;
    await executeQuery(sql, { id, name: data.workcenterName, descriptionVal: data.description, statusVal: data.status });
  }
  static async deleteWorkcenter(id) { await executeQuery(`DELETE FROM HRMS_WORKCENTERS WHERE WORKCENTER_ID = :id`, { id }); }

  // Employment Types
  static async getAllEmploymentTypes(filters = {}) {
    let sql = `SELECT e.*, u.FIRST_NAME || ' ' || u.LAST_NAME as CREATED_BY_NAME FROM HRMS_EMPLOYMENT_TYPES e LEFT JOIN HRMS_USERS u ON e.CREATED_BY = u.USER_ID WHERE 1=1`;
    const binds = {};
    if (filters.status) { sql += ` AND e.STATUS = :status`; binds.status = filters.status; }
    if (filters.search) { sql += ` AND (e.EMPLOYMENT_TYPE_NAME LIKE '%' || :search || '%' OR e.DESCRIPTION LIKE '%' || :search || '%')`; binds.search = filters.search; }
    sql += ` ORDER BY e.EMPLOYMENT_TYPE_NAME`;
    const page = parseInt(filters.page) || 1; const limit = parseInt(filters.limit) || 10; const offset = (page - 1) * limit;
    const paginatedSql = `${sql} OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    const countSql = `SELECT COUNT(*) as TOTAL FROM HRMS_EMPLOYMENT_TYPES e WHERE 1=1` +
      (filters.status ? ` AND e.STATUS = :status` : '') +
      (filters.search ? ` AND (e.EMPLOYMENT_TYPE_NAME LIKE '%' || :search || '%' OR e.DESCRIPTION LIKE '%' || :search || '%')` : '');
    const [result, countResult] = await Promise.all([executeQuery(paginatedSql, binds), executeQuery(countSql, binds)]);
    return { rows: result.rows, total: countResult.rows[0].TOTAL };
  }
  static async getEmploymentTypeById(id) { const r = await executeQuery(`SELECT * FROM HRMS_EMPLOYMENT_TYPES WHERE EMPLOYMENT_TYPE_ID = :id`, { id }); return r.rows[0]; }
  static async createEmploymentType(data, createdBy) {
    const sql = `INSERT INTO HRMS_EMPLOYMENT_TYPES (EMPLOYMENT_TYPE_NAME, DESCRIPTION, STATUS, CREATED_BY) VALUES (:name,:descriptionVal,:statusVal,:createdBy) RETURNING EMPLOYMENT_TYPE_ID INTO :outId`;
    const binds = { name: data.employmentTypeName, descriptionVal: data.description, statusVal: data.status || 'ACTIVE', createdBy, outId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } };
    const res = await executeQuery(sql, binds); return res.outBinds.outId[0];
  }
  static async updateEmploymentType(id, data) {
    const sql = `UPDATE HRMS_EMPLOYMENT_TYPES SET EMPLOYMENT_TYPE_NAME=:name, DESCRIPTION=:descriptionVal, STATUS=:statusVal, UPDATED_AT=CURRENT_TIMESTAMP WHERE EMPLOYMENT_TYPE_ID=:id`;
    await executeQuery(sql, { id, name: data.employmentTypeName, descriptionVal: data.description, statusVal: data.status });
  }
  static async deleteEmploymentType(id) { await executeQuery(`DELETE FROM HRMS_EMPLOYMENT_TYPES WHERE EMPLOYMENT_TYPE_ID = :id`, { id }); }

  static async getCostCenterById(id) {
    const sql = `
      SELECT c.*, u.FIRST_NAME || ' ' || u.LAST_NAME as CREATED_BY_NAME
      FROM HRMS_COST_CENTERS c
      LEFT JOIN HRMS_USERS u ON c.CREATED_BY = u.USER_ID
      WHERE c.COST_CENTER_ID = :id
    `;
    
    const result = await executeQuery(sql, { id });
    return result.rows[0];
  }

  static async createCostCenter(costCenterData, createdBy) {
    const sql = `
      INSERT INTO HRMS_COST_CENTERS (COST_CENTER_CODE, COST_CENTER_NAME, DESCRIPTION, STATUS, CREATED_BY)
      VALUES (:costCenterCode, :costCenterName, :description, :status, :createdBy)
      RETURNING COST_CENTER_ID INTO :costCenterId
    `;
    
    const binds = {
      costCenterCode: costCenterData.costCenterCode,
      costCenterName: costCenterData.costCenterName,
      description: costCenterData.description,
      status: costCenterData.status || 'ACTIVE',
      createdBy,
      costCenterId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };
    
    const result = await executeQuery(sql, binds);
    return result.outBinds.costCenterId[0];
  }

  static async updateCostCenter(id, costCenterData) {
    const sql = `
      UPDATE HRMS_COST_CENTERS 
      SET COST_CENTER_CODE = :costCenterCode,
          COST_CENTER_NAME = :costCenterName,
          DESCRIPTION = :description,
          STATUS = :status,
          UPDATED_AT = CURRENT_TIMESTAMP
      WHERE COST_CENTER_ID = :id
    `;
    
    const binds = {
      costCenterCode: costCenterData.costCenterCode,
      costCenterName: costCenterData.costCenterName,
      description: costCenterData.description,
      status: costCenterData.status,
      id
    };
    
    await executeQuery(sql, binds);
  }

  static async deleteCostCenter(id) {
    const sql = `DELETE FROM HRMS_COST_CENTERS WHERE COST_CENTER_ID = :id`;
    await executeQuery(sql, { id });
  }

  // Pay Component CRUD operations
  static async getAllPayComponents(filters = {}) {
    try {
      let sql = `
        SELECT pc.PAY_COMPONENT_ID, pc.COMPONENT_CODE, pc.COMPONENT_NAME, pc.COMPONENT_TYPE,
               pc.DESCRIPTION, pc.IS_TAXABLE, pc.IS_PF_APPLICABLE, pc.IS_ESI_APPLICABLE,
               pc.IS_STATUTORY, pc.STATUTORY_CODE, pc.IS_EMPLOYEE_PORTION, pc.IS_EMPLOYER_PORTION,
               pc.CALCULATION_TYPE, pc.BASE_TYPE, pc.PERCENTAGE, pc.CAP_BASE, pc.CAP_AMOUNT,
               pc.MIN_AMOUNT, pc.MAX_AMOUNT, pc.APPLICABILITY_CONDITION,
               pc.FORMULA_TEXT AS FORMULA_TEXT,
               pc.EFFECTIVE_FROM, pc.STATUS, pc.CREATED_BY, pc.CREATED_AT, pc.UPDATED_AT,
               u.FIRST_NAME || ' ' || u.LAST_NAME as CREATED_BY_NAME
        FROM HRMS_PAY_COMPONENTS pc
        LEFT JOIN HRMS_USERS u ON pc.CREATED_BY = u.USER_ID
        WHERE 1=1
      `;
      const binds = {};
      if (filters.status) {
        sql += ` AND pc.STATUS = :status`;
        binds.status = filters.status;
      }
      if (filters.search) {
        sql += ` AND (pc.COMPONENT_CODE LIKE '%' || :search || '%' OR pc.COMPONENT_NAME LIKE '%' || :search || '%' OR pc.DESCRIPTION LIKE '%' || :search || '%')`;
        binds.search = filters.search;
      }
      sql += ` ORDER BY pc.COMPONENT_NAME`;
      // Pagination
      let page = parseInt(filters.page) || 1;
      let limit = parseInt(filters.limit) || 10;
      let offset = (page - 1) * limit;
      const paginatedSql = `${sql} OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
      // Get total count
      const countSql = `SELECT COUNT(*) as TOTAL FROM HRMS_PAY_COMPONENTS pc WHERE 1=1` +
        (filters.status ? ` AND pc.STATUS = :status` : '') +
        (filters.search ? ` AND (pc.COMPONENT_CODE LIKE '%' || :search || '%' OR pc.COMPONENT_NAME LIKE '%' || :search || '%' OR pc.DESCRIPTION LIKE '%' || :search || '%')` : '');
      const [result, countResult] = await Promise.all([
        executeQuery(paginatedSql, binds),
        executeQuery(countSql, binds)
      ]);
      return {
        rows: result.rows,
        total: countResult.rows[0].TOTAL
      };
    } catch (error) {
      // Fallback minimal query if any new column causes issues
      console.warn('⚠️ Falling back to minimal pay components query due to:', error.message);
      let sql = `
        SELECT PAY_COMPONENT_ID, COMPONENT_CODE, COMPONENT_NAME, COMPONENT_TYPE,
               DESCRIPTION, IS_TAXABLE, IS_PF_APPLICABLE, IS_ESI_APPLICABLE,
               STATUS, CREATED_BY, CREATED_AT, UPDATED_AT
        FROM HRMS_PAY_COMPONENTS
        WHERE 1=1
      `;
      const binds = {};
      if (filters.status) {
        sql += ` AND STATUS = :status`;
        binds.status = filters.status;
      }
      if (filters.search) {
        sql += ` AND (COMPONENT_CODE LIKE '%' || :search || '%' OR COMPONENT_NAME LIKE '%' || :search || '%' OR DESCRIPTION LIKE '%' || :search || '%')`;
        binds.search = filters.search;
      }
      sql += ` ORDER BY COMPONENT_NAME`;
      // Pagination
      let page = parseInt(filters.page) || 1;
      let limit = parseInt(filters.limit) || 10;
      let offset = (page - 1) * limit;
      const paginatedSql = `${sql} OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
      const countSql = `SELECT COUNT(*) as TOTAL FROM HRMS_PAY_COMPONENTS WHERE 1=1` +
        (filters.status ? ` AND STATUS = :status` : '') +
        (filters.search ? ` AND (COMPONENT_CODE LIKE '%' || :search || '%' OR COMPONENT_NAME LIKE '%' || :search || '%' OR DESCRIPTION LIKE '%' || :search || '%')` : '');
      const [result, countResult] = await Promise.all([
        executeQuery(paginatedSql, binds),
        executeQuery(countSql, binds)
      ]);
      // Attach defaults for new fields expected by UI if needed
      const rows = (result.rows || []).map(r => ({
        ...r,
        IS_STATUTORY: r.IS_STATUTORY || 'N'
      }));
      return { rows, total: countResult.rows[0].TOTAL };
    }
  }

  static async getPayComponentById(id) {
    const sql = `
      SELECT pc.PAY_COMPONENT_ID, pc.COMPONENT_CODE, pc.COMPONENT_NAME, pc.COMPONENT_TYPE,
             pc.DESCRIPTION, pc.IS_TAXABLE, pc.IS_PF_APPLICABLE, pc.IS_ESI_APPLICABLE,
             pc.IS_STATUTORY, pc.STATUTORY_CODE, pc.IS_EMPLOYEE_PORTION, pc.IS_EMPLOYER_PORTION,
             pc.CALCULATION_TYPE, pc.BASE_TYPE, pc.PERCENTAGE, pc.CAP_BASE, pc.CAP_AMOUNT,
             pc.MIN_AMOUNT, pc.MAX_AMOUNT, pc.APPLICABILITY_CONDITION,
             pc.FORMULA_TEXT AS FORMULA_TEXT,
             pc.EFFECTIVE_FROM, pc.STATUS, pc.CREATED_BY, pc.CREATED_AT, pc.UPDATED_AT,
             u.FIRST_NAME || ' ' || u.LAST_NAME as CREATED_BY_NAME
      FROM HRMS_PAY_COMPONENTS pc
      LEFT JOIN HRMS_USERS u ON pc.CREATED_BY = u.USER_ID
      WHERE pc.PAY_COMPONENT_ID = :id
    `;
    
    const result = await executeQuery(sql, { id });
    return result.rows[0];
  }

  static async createPayComponent(payComponentData, createdBy) {
    await this.ensurePayComponentRuleColumns();
    const sql = `
      INSERT INTO HRMS_PAY_COMPONENTS (
        COMPONENT_CODE, COMPONENT_NAME, COMPONENT_TYPE, DESCRIPTION,
        IS_TAXABLE, IS_PF_APPLICABLE, IS_ESI_APPLICABLE,
        IS_STATUTORY, STATUTORY_CODE, IS_EMPLOYEE_PORTION, IS_EMPLOYER_PORTION,
        CALCULATION_TYPE, BASE_TYPE, PERCENTAGE, CAP_BASE, CAP_AMOUNT,
        MIN_AMOUNT, MAX_AMOUNT, APPLICABILITY_CONDITION, FORMULA_TEXT, EFFECTIVE_FROM,
        STATUS, CREATED_BY
      )
      VALUES (
        :componentCode, :componentName, :componentType, :description,
        :isTaxable, :isPfApplicable, :isEsiApplicable,
        :isStatutory, :statutoryCode, :isEmployeePortion, :isEmployerPortion,
        :calculationType, :baseType, :percentage, :capBase, :capAmount,
        :minAmount, :maxAmount, :applicabilityCondition, :formulaText, :effectiveFrom,
        :status, :createdBy
      )
      RETURNING PAY_COMPONENT_ID INTO :payComponentId
    `;
    
    const binds = {
      componentCode: payComponentData.componentCode,
      componentName: payComponentData.componentName,
      componentType: payComponentData.componentType,
      description: payComponentData.description,
      isTaxable: payComponentData.isTaxable || 'N',
      isPfApplicable: payComponentData.isPfApplicable || 'N',
      isEsiApplicable: payComponentData.isEsiApplicable || 'N',
      isStatutory: payComponentData.isStatutory || 'N',
      statutoryCode: payComponentData.statutoryCode || null,
      isEmployeePortion: payComponentData.isEmployeePortion || 'N',
      isEmployerPortion: payComponentData.isEmployerPortion || 'N',
      calculationType: payComponentData.calculationType || null,
      baseType: payComponentData.baseType || null,
      percentage: payComponentData.percentage || null,
      capBase: payComponentData.capBase || null,
      capAmount: payComponentData.capAmount || null,
      minAmount: payComponentData.minAmount || null,
      maxAmount: payComponentData.maxAmount || null,
      applicabilityCondition: payComponentData.applicabilityCondition || null,
      formulaText: payComponentData.formulaText || null,
      effectiveFrom: payComponentData.effectiveFrom || null,
      status: payComponentData.status || 'ACTIVE',
      createdBy,
      payComponentId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };
    
    const result = await executeQuery(sql, binds);
    return result.outBinds.payComponentId[0];
  }

  static async updatePayComponent(id, payComponentData) {
    await this.ensurePayComponentRuleColumns();
    const sql = `
      UPDATE HRMS_PAY_COMPONENTS 
      SET COMPONENT_CODE = :componentCode,
          COMPONENT_NAME = :componentName,
          COMPONENT_TYPE = :componentType,
          DESCRIPTION = :description,
          IS_TAXABLE = :isTaxable,
          IS_PF_APPLICABLE = :isPfApplicable,
          IS_ESI_APPLICABLE = :isEsiApplicable,
          IS_STATUTORY = :isStatutory,
          STATUTORY_CODE = :statutoryCode,
          IS_EMPLOYEE_PORTION = :isEmployeePortion,
          IS_EMPLOYER_PORTION = :isEmployerPortion,
          CALCULATION_TYPE = :calculationType,
          BASE_TYPE = :baseType,
          PERCENTAGE = :percentage,
          CAP_BASE = :capBase,
          CAP_AMOUNT = :capAmount,
          MIN_AMOUNT = :minAmount,
          MAX_AMOUNT = :maxAmount,
          APPLICABILITY_CONDITION = :applicabilityCondition,
          FORMULA_TEXT = :formulaText,
          EFFECTIVE_FROM = :effectiveFrom,
          STATUS = :status,
          UPDATED_AT = CURRENT_TIMESTAMP
      WHERE PAY_COMPONENT_ID = :id
    `;
    
    const binds = {
      componentCode: payComponentData.componentCode,
      componentName: payComponentData.componentName,
      componentType: payComponentData.componentType,
      description: payComponentData.description,
      isTaxable: payComponentData.isTaxable || 'N',
      isPfApplicable: payComponentData.isPfApplicable || 'N',
      isEsiApplicable: payComponentData.isEsiApplicable || 'N',
      isStatutory: payComponentData.isStatutory || 'N',
      statutoryCode: payComponentData.statutoryCode || null,
      isEmployeePortion: payComponentData.isEmployeePortion || 'N',
      isEmployerPortion: payComponentData.isEmployerPortion || 'N',
      calculationType: payComponentData.calculationType || null,
      baseType: payComponentData.baseType || null,
      percentage: payComponentData.percentage || null,
      capBase: payComponentData.capBase || null,
      capAmount: payComponentData.capAmount || null,
      minAmount: payComponentData.minAmount || null,
      maxAmount: payComponentData.maxAmount || null,
      applicabilityCondition: payComponentData.applicabilityCondition || null,
      formulaText: payComponentData.formulaText || null,
      effectiveFrom: payComponentData.effectiveFrom || null,
      status: payComponentData.status,
      id
    };
    
    await executeQuery(sql, binds);
  }

  static async deletePayComponent(id) {
    const sql = `DELETE FROM HRMS_PAY_COMPONENTS WHERE PAY_COMPONENT_ID = :id`;
    await executeQuery(sql, { id });
  }

  // Backfill defaults for new statutory/rule columns on existing pay components
  static async backfillPayComponentRuleDefaults() {
    await this.ensurePayComponentRuleColumns();

    // Fetch all components
    const result = await executeQuery(`SELECT * FROM HRMS_PAY_COMPONENTS`);
    const rows = result.rows || [];

    let updatedCount = 0;
    for (const row of rows) {
      const code = (row.COMPONENT_CODE || '').toUpperCase();
      const name = (row.COMPONENT_NAME || '').toUpperCase();
      const type = (row.COMPONENT_TYPE || '').toUpperCase();

      // Defaults
      let isStatutory = 'N';
      let statutoryCode = null;
      let isEmployeePortion = 'N';
      let isEmployerPortion = 'N';
      let calculationType = 'FIXED';
      let baseType = 'CUSTOM';
      let percentage = null;
      let capBase = null;
      let capAmount = null;
      let minAmount = null;
      let maxAmount = null;
      let applicability = null;
      let formulaText = null;
      let effectiveFrom = row.EFFECTIVE_FROM || null;

      // Heuristics for India private company statutory rules
      const includes = (s) => name.includes(s) || code.includes(s);

      // ESI
      if ((row.IS_ESI_APPLICABLE === 'Y') || includes('ESI')) {
        isStatutory = 'Y';
        baseType = 'GROSS';
        calculationType = 'PERCENT_OF_BASE';
        applicability = 'GROSS<=21000';
        if (includes('EMPLOYER') || includes('ER') || includes('ESI_ER')) {
          statutoryCode = 'ESI_ER';
          isEmployerPortion = 'Y';
          percentage = 3.25;
        } else {
          statutoryCode = 'ESI_EE';
          isEmployeePortion = 'Y';
          percentage = 0.75;
        }
      }

      // PF/EPF/EPS/EDLI/Admin
      if ((row.IS_PF_APPLICABLE === 'Y') || includes('EPF') || includes('PF') || includes('EPS') || includes('EDLI')) {
        isStatutory = 'Y';
        baseType = 'BASIC_DA';
        // Prefer explicit components by name/code
        if (includes('EPS')) {
          statutoryCode = 'EPS_ER';
          isEmployerPortion = 'Y';
          calculationType = 'PERCENT_OF_BASE';
          percentage = 8.33;
          capBase = 15000;
          capAmount = 1250;
        } else if (includes('EDLI')) {
          statutoryCode = 'EDLI_ER';
          isEmployerPortion = 'Y';
          calculationType = 'PERCENT_OF_BASE';
          percentage = 0.5;
          capBase = 15000;
          capAmount = 75;
        } else if (includes('ADMIN')) {
          statutoryCode = 'EPF_ADMIN';
          isEmployerPortion = 'Y';
          calculationType = 'PERCENT_OF_BASE';
          percentage = 0.5;
          capBase = 15000;
          capAmount = 75; // optional, use as default cap
        } else if (includes('EMPLOYER') || includes('EPF_ER') || includes('ER')) {
          statutoryCode = 'EPF_ER';
          isEmployerPortion = 'Y';
          calculationType = 'FORMULA';
          capBase = 15000;
          formulaText = 'min((BASIC+DA)*0.12, 15000*0.12) - min((BASIC+DA)*0.0833, 15000*0.0833)';
        } else if (includes('EMPLOYEE') || includes('EPF_EE') || includes('EE') || includes('PF')) {
          statutoryCode = 'EPF_EE';
          isEmployeePortion = 'Y';
          calculationType = 'PERCENT_OF_BASE';
          percentage = 12.0;
          capBase = 15000;
        }
      }

      // Gratuity
      if (includes('GRATUITY')) {
        isStatutory = 'Y';
        statutoryCode = 'GRATUITY';
        isEmployerPortion = 'Y';
        calculationType = 'PERCENT_OF_BASE';
        baseType = 'BASIC';
        percentage = 4.81;
      }

      // Bonus
      if (includes('BONUS')) {
        isStatutory = 'Y';
        if (includes('MIN')) {
          statutoryCode = 'BONUS_MIN';
          isEmployerPortion = 'Y';
          calculationType = 'FIXED';
          minAmount = 583; maxAmount = 583;
          applicability = 'BASIC_DA<=21000';
        } else if (includes('MAX')) {
          statutoryCode = 'BONUS_MAX';
          isEmployerPortion = 'Y';
          calculationType = 'FIXED';
          minAmount = 1400; maxAmount = 1400;
          applicability = 'BASIC_DA<=21000';
        } else {
          // default to min bonus if unspecified
          statutoryCode = 'BONUS_MIN';
          isEmployerPortion = 'Y';
          calculationType = 'FIXED';
          minAmount = 583; maxAmount = 583;
          applicability = 'BASIC_DA<=21000';
        }
      }

      // For general non-statutory earnings/deductions with no matches, keep defaults
      // Only apply update if any new field is null or uninitialized to avoid overwriting manual settings

      const binds = {
        id: row.PAY_COMPONENT_ID,
        isStatutory,
        statutoryCode,
        isEmployeePortion,
        isEmployerPortion,
        calculationType,
        baseType,
        percentage,
        capBase,
        capAmount,
        minAmount,
        maxAmount,
        applicability,
        formulaText,
        effectiveFrom
      };

      const updateSql = `
        UPDATE HRMS_PAY_COMPONENTS
        SET IS_STATUTORY = NVL(IS_STATUTORY, :isStatutory),
            STATUTORY_CODE = NVL(STATUTORY_CODE, :statutoryCode),
            IS_EMPLOYEE_PORTION = NVL(IS_EMPLOYEE_PORTION, :isEmployeePortion),
            IS_EMPLOYER_PORTION = NVL(IS_EMPLOYER_PORTION, :isEmployerPortion),
            CALCULATION_TYPE = NVL(CALCULATION_TYPE, :calculationType),
            BASE_TYPE = NVL(BASE_TYPE, :baseType),
            PERCENTAGE = NVL(PERCENTAGE, :percentage),
            CAP_BASE = NVL(CAP_BASE, :capBase),
            CAP_AMOUNT = NVL(CAP_AMOUNT, :capAmount),
            MIN_AMOUNT = NVL(MIN_AMOUNT, :minAmount),
            MAX_AMOUNT = NVL(MAX_AMOUNT, :maxAmount),
            APPLICABILITY_CONDITION = NVL(APPLICABILITY_CONDITION, :applicability),
            FORMULA_TEXT = COALESCE(FORMULA_TEXT, :formulaText),
            EFFECTIVE_FROM = COALESCE(EFFECTIVE_FROM, CASE WHEN :effectiveFrom IS NOT NULL THEN TO_DATE(:effectiveFrom, 'YYYY-MM-DD') ELSE NULL END),
            UPDATED_AT = CURRENT_TIMESTAMP
        WHERE PAY_COMPONENT_ID = :id
      `;

      await executeQuery(updateSql, binds);
      updatedCount += 1;
    }

    return { total: rows.length, updated: updatedCount };
  }

  // Leave Policy CRUD operations
  static async getAllLeavePolicies(filters = {}) {
    let sql = `
      SELECT lp.*, u.FIRST_NAME || ' ' || u.LAST_NAME as CREATED_BY_NAME
      FROM HRMS_LEAVE_POLICIES lp
      LEFT JOIN HRMS_USERS u ON lp.CREATED_BY = u.USER_ID
      WHERE 1=1
    `;
    const binds = {};
    if (filters.status) {
      sql += ` AND lp.STATUS = :status`;
      binds.status = filters.status;
    }
    if (filters.search) {
      sql += ` AND (lp.LEAVE_CODE LIKE '%' || :search || '%' OR lp.POLICY_NAME LIKE '%' || :search || '%' OR lp.DESCRIPTION LIKE '%' || :search || '%')`;
      binds.search = filters.search;
    }
    sql += ` ORDER BY lp.POLICY_NAME`;
    // Pagination
    let page = parseInt(filters.page) || 1;
    let limit = parseInt(filters.limit) || 10;
    let offset = (page - 1) * limit;
    const paginatedSql = `${sql} OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    // Get total count
    const countSql = `SELECT COUNT(*) as TOTAL FROM HRMS_LEAVE_POLICIES lp WHERE 1=1` +
      (filters.status ? ` AND lp.STATUS = :status` : '') +
      (filters.search ? ` AND (lp.LEAVE_CODE LIKE '%' || :search || '%' OR lp.POLICY_NAME LIKE '%' || :search || '%' OR lp.DESCRIPTION LIKE '%' || :search || '%')` : '');
    const [result, countResult] = await Promise.all([
      executeQuery(paginatedSql, binds),
      executeQuery(countSql, binds)
    ]);
    return {
      rows: result.rows,
      total: countResult.rows[0].TOTAL
    };
  }

  static async getLeavePolicyById(id) {
    const sql = `
      SELECT lp.*, u.FIRST_NAME || ' ' || u.LAST_NAME as CREATED_BY_NAME
      FROM HRMS_LEAVE_POLICIES lp
      LEFT JOIN HRMS_USERS u ON lp.CREATED_BY = u.USER_ID
      WHERE lp.LEAVE_POLICY_ID = :id
    `;
    
    const result = await executeQuery(sql, { id });
    return result.rows[0];
  }

  static async createLeavePolicy(leavePolicyData, createdBy) {
    const sql = `
      INSERT INTO HRMS_LEAVE_POLICIES (LEAVE_CODE, POLICY_NAME, LEAVE_TYPE, DESCRIPTION, DEFAULT_DAYS, MAX_DAYS, MIN_DAYS, CARRY_FORWARD_DAYS, CARRY_FORWARD_EXPIRY_MONTHS, IS_PAID, REQUIRES_APPROVAL, ALLOW_HALF_DAY, ALLOW_ATTACHMENT, APPLICABLE_FROM_MONTHS, APPLICABLE_FROM_DAYS, STATUS, CREATED_BY)
      VALUES (:leaveCode, :policyName, :leaveType, :description, :defaultDays, :maxDays, :minDays, :carryForwardDays, :carryForwardExpiryMonths, :isPaid, :requiresApproval, :allowHalfDay, :allowAttachment, :applicableFromMonths, :applicableFromDays, :status, :createdBy)
      RETURNING LEAVE_POLICY_ID INTO :leavePolicyId
    `;
    
    const binds = {
      leaveCode: leavePolicyData.leaveCode,
      policyName: leavePolicyData.policyName,
      leaveType: leavePolicyData.leaveType,
      description: leavePolicyData.description,
      defaultDays: leavePolicyData.defaultDays || 0,
      maxDays: leavePolicyData.maxDays || 0,
      minDays: leavePolicyData.minDays || 0,
      carryForwardDays: leavePolicyData.carryForwardDays || 0,
      carryForwardExpiryMonths: leavePolicyData.carryForwardExpiryMonths || 12,
      isPaid: leavePolicyData.isPaid || 'Y',
      requiresApproval: leavePolicyData.requiresApproval || 'Y',
      allowHalfDay: leavePolicyData.allowHalfDay || 'N',
      allowAttachment: leavePolicyData.allowAttachment || 'N',
      applicableFromMonths: leavePolicyData.applicableFromMonths || 0,
      applicableFromDays: leavePolicyData.applicableFromDays || 0,
      status: leavePolicyData.status || 'ACTIVE',
      createdBy,
      leavePolicyId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };
    
    const result = await executeQuery(sql, binds);
    return result.outBinds.leavePolicyId[0];
  }

  static async updateLeavePolicy(id, leavePolicyData) {
    const sql = `
      UPDATE HRMS_LEAVE_POLICIES 
      SET LEAVE_CODE = :leaveCode,
          POLICY_NAME = :policyName,
          LEAVE_TYPE = :leaveType,
          DESCRIPTION = :description,
          DEFAULT_DAYS = :defaultDays,
          MAX_DAYS = :maxDays,
          MIN_DAYS = :minDays,
          CARRY_FORWARD_DAYS = :carryForwardDays,
          CARRY_FORWARD_EXPIRY_MONTHS = :carryForwardExpiryMonths,
          IS_PAID = :isPaid,
          REQUIRES_APPROVAL = :requiresApproval,
          ALLOW_HALF_DAY = :allowHalfDay,
          ALLOW_ATTACHMENT = :allowAttachment,
          APPLICABLE_FROM_MONTHS = :applicableFromMonths,
          APPLICABLE_FROM_DAYS = :applicableFromDays,
          STATUS = :status,
          UPDATED_AT = CURRENT_TIMESTAMP
      WHERE LEAVE_POLICY_ID = :id
    `;
    
    const binds = {
      leaveCode: leavePolicyData.leaveCode,
      policyName: leavePolicyData.policyName,
      leaveType: leavePolicyData.leaveType,
      description: leavePolicyData.description,
      defaultDays: leavePolicyData.defaultDays,
      maxDays: leavePolicyData.maxDays,
      minDays: leavePolicyData.minDays,
      carryForwardDays: leavePolicyData.carryForwardDays,
      carryForwardExpiryMonths: leavePolicyData.carryForwardExpiryMonths,
      isPaid: leavePolicyData.isPaid,
      requiresApproval: leavePolicyData.requiresApproval,
      allowHalfDay: leavePolicyData.allowHalfDay,
      allowAttachment: leavePolicyData.allowAttachment,
      applicableFromMonths: leavePolicyData.applicableFromMonths,
      applicableFromDays: leavePolicyData.applicableFromDays,
      status: leavePolicyData.status,
      id
    };
    
    await executeQuery(sql, binds);
  }

  static async deleteLeavePolicy(id) {
    const sql = `DELETE FROM HRMS_LEAVE_POLICIES WHERE LEAVE_POLICY_ID = :id`;
    await executeQuery(sql, { id });
  }

  // Pay Grade CRUD operations
  static async getAllPayGrades(filters = {}) {
    let sql = `
      SELECT pg.*, u.FIRST_NAME || ' ' || u.LAST_NAME as CREATED_BY_NAME
      FROM HRMS_PAY_GRADES pg
      LEFT JOIN HRMS_USERS u ON pg.CREATED_BY = u.USER_ID
      WHERE 1=1
    `;
    const binds = {};
    if (filters.status) {
      sql += ` AND pg.STATUS = :status`;
      binds.status = filters.status;
    }
    if (filters.search) {
      sql += ` AND (pg.GRADE_CODE LIKE '%' || :search || '%' OR pg.GRADE_NAME LIKE '%' || :search || '%' OR pg.DESCRIPTION LIKE '%' || :search || '%')`;
      binds.search = filters.search;
    }
    sql += ` ORDER BY pg.GRADE_CODE`;
    // Pagination
    let page = parseInt(filters.page) || 1;
    let limit = parseInt(filters.limit) || 10;
    let offset = (page - 1) * limit;
    const paginatedSql = `${sql} OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    // Get total count
    const countSql = `SELECT COUNT(*) as TOTAL FROM HRMS_PAY_GRADES pg WHERE 1=1` +
      (filters.status ? ` AND pg.STATUS = :status` : '') +
      (filters.search ? ` AND (pg.GRADE_CODE LIKE '%' || :search || '%' OR pg.GRADE_NAME LIKE '%' || :search || '%' OR pg.DESCRIPTION LIKE '%' || :search || '%')` : '');
    const [result, countResult] = await Promise.all([
      executeQuery(paginatedSql, binds),
      executeQuery(countSql, binds)
    ]);
    return {
      rows: result.rows,
      total: countResult.rows[0].TOTAL
    };
  }

  static async getPayGradeById(id) {
    const sql = `
      SELECT pg.*, u.FIRST_NAME || ' ' || u.LAST_NAME as CREATED_BY_NAME
      FROM HRMS_PAY_GRADES pg
      LEFT JOIN HRMS_USERS u ON pg.CREATED_BY = u.USER_ID
      WHERE pg.PAY_GRADE_ID = :id
    `;
    
    const result = await executeQuery(sql, { id });
    return result.rows[0];
  }

  static async createPayGrade(payGradeData, createdBy) {
    const sql = `
      INSERT INTO HRMS_PAY_GRADES (GRADE_CODE, GRADE_NAME, MIN_SALARY, MAX_SALARY, MID_SALARY, DESCRIPTION, STATUS, CREATED_BY)
      VALUES (:gradeCode, :gradeName, :minSalary, :maxSalary, :midSalary, :description, :status, :createdBy)
      RETURNING PAY_GRADE_ID INTO :payGradeId
    `;
    
    const binds = {
      gradeCode: payGradeData.gradeCode,
      gradeName: payGradeData.gradeName,
      minSalary: payGradeData.minSalary,
      maxSalary: payGradeData.maxSalary,
      midSalary: payGradeData.midSalary,
      description: payGradeData.description,
      status: payGradeData.status || 'ACTIVE',
      createdBy,
      payGradeId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };
    
    const result = await executeQuery(sql, binds);
    return result.outBinds.payGradeId[0];
  }

  static async updatePayGrade(id, payGradeData) {
    const sql = `
      UPDATE HRMS_PAY_GRADES 
      SET GRADE_CODE = :gradeCode,
          GRADE_NAME = :gradeName,
          MIN_SALARY = :minSalary,
          MAX_SALARY = :maxSalary,
          MID_SALARY = :midSalary,
          DESCRIPTION = :description,
          STATUS = :status,
          UPDATED_AT = CURRENT_TIMESTAMP
      WHERE PAY_GRADE_ID = :id
    `;
    
    const binds = {
      gradeCode: payGradeData.gradeCode,
      gradeName: payGradeData.gradeName,
      minSalary: payGradeData.minSalary,
      maxSalary: payGradeData.maxSalary,
      midSalary: payGradeData.midSalary,
      description: payGradeData.description,
      status: payGradeData.status,
      id
    };
    
    await executeQuery(sql, binds);
  }

  static async deletePayGrade(id) {
    const sql = `DELETE FROM HRMS_PAY_GRADES WHERE PAY_GRADE_ID = :id`;
    await executeQuery(sql, { id });
  }

  // Get dropdown lists for forms
  static async getDepartmentsForDropdown() {
    const sql = `SELECT DEPARTMENT_ID, DEPARTMENT_NAME
                 FROM HRMS_DEPARTMENTS
                 WHERE STATUS IS NULL OR UPPER(STATUS)='ACTIVE'
                 ORDER BY DEPARTMENT_NAME`;
    const result = await executeQuery(sql);
    return result.rows;
  }

  static async getWorkcentersForDropdown() {
    const sql = `SELECT WORKCENTER_ID, WORKCENTER_NAME
                 FROM HRMS_WORKCENTERS
                 WHERE STATUS IS NULL OR UPPER(STATUS)='ACTIVE'
                 ORDER BY WORKCENTER_NAME`;
    const result = await executeQuery(sql);
    return result.rows;
  }

  static async getEmploymentTypesForDropdown() {
    const sql = `SELECT EMPLOYMENT_TYPE_ID, EMPLOYMENT_TYPE_NAME
                 FROM HRMS_EMPLOYMENT_TYPES
                 WHERE STATUS IS NULL OR UPPER(STATUS)='ACTIVE'
                 ORDER BY EMPLOYMENT_TYPE_NAME`;
    const result = await executeQuery(sql);
    return result.rows;
  }
  static async getDesignationsForDropdown() {
    const sql = `
      SELECT DESIGNATION_ID, DESIGNATION_NAME
      FROM HRMS_DESIGNATIONS
      WHERE STATUS = 'ACTIVE'
      ORDER BY DESIGNATION_NAME
    `;
    
    const result = await executeQuery(sql);
    return result.rows;
  }

  static async getRolesForDropdown() {
    const sql = `
      SELECT ROLE_ID, ROLE_NAME
      FROM HRMS_ROLES
      WHERE STATUS = 'ACTIVE'
      ORDER BY ROLE_NAME
    `;
    
    const result = await executeQuery(sql);
    return result.rows;
  }

  static async getPositionsForDropdown() {
    const sql = `
      SELECT POSITION_ID, POSITION_NAME
      FROM HRMS_POSITIONS
      WHERE STATUS = 'ACTIVE'
      ORDER BY POSITION_NAME
    `;
    
    const result = await executeQuery(sql);
    return result.rows;
  }

  static async getLocationsForDropdown() {
    const sql = `
      SELECT LOCATION_ID, LOCATION_NAME
      FROM HRMS_LOCATIONS
      WHERE STATUS = 'ACTIVE'
      ORDER BY LOCATION_NAME
    `;
    
    const result = await executeQuery(sql);
    return result.rows;
  }

  static async getCostCentersForDropdown() {
    const sql = `
      SELECT COST_CENTER_ID, COST_CENTER_CODE, COST_CENTER_NAME
      FROM HRMS_COST_CENTERS
      WHERE STATUS = 'ACTIVE'
      ORDER BY COST_CENTER_CODE
    `;
    
    const result = await executeQuery(sql);
    return result.rows;
  }

  static async getPayComponentsForDropdown() {
    const sql = `
      SELECT PAY_COMPONENT_ID, COMPONENT_CODE, COMPONENT_NAME, COMPONENT_TYPE
      FROM HRMS_PAY_COMPONENTS
      WHERE STATUS = 'ACTIVE'
      ORDER BY COMPONENT_CODE
    `;
    
    const result = await executeQuery(sql);
    return result.rows;
  }

  static async getLeavePoliciesForDropdown() {
    const sql = `
      SELECT LEAVE_POLICY_ID, LEAVE_CODE, POLICY_NAME, LEAVE_TYPE, DEFAULT_DAYS
      FROM HRMS_LEAVE_POLICIES
      WHERE STATUS = 'ACTIVE'
      ORDER BY LEAVE_CODE
    `;
    
    const result = await executeQuery(sql);
    return result.rows;
  }

  static async getPayGradesForDropdown() {
    const sql = `
      SELECT PAY_GRADE_ID, GRADE_CODE, GRADE_NAME
      FROM HRMS_PAY_GRADES
      WHERE STATUS = 'ACTIVE'
      ORDER BY GRADE_CODE
    `;
    
    const result = await executeQuery(sql);
    return result.rows;
  }
}

module.exports = Settings; 
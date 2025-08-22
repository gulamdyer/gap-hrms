const { executeQuery } = require('../config/database');
const oracledb = require('oracledb');

class Project {
  // Create projects table if not exists
  static async createTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_PROJECTS (
        PROJECT_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        PROJECT_CODE VARCHAR2(50) NOT NULL UNIQUE,
        PROJECT_NAME VARCHAR2(100) NOT NULL,
        DESCRIPTION VARCHAR2(500),
        CLIENT_NAME VARCHAR2(100),
        PROJECT_MANAGER NUMBER,
        START_DATE DATE,
        END_DATE DATE,
        STATUS VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (STATUS IN ('ACTIVE', 'INACTIVE', 'COMPLETED', 'CANCELLED')),
        IS_BILLABLE NUMBER(1) DEFAULT 1 CHECK (IS_BILLABLE IN (0, 1)),
        HOURLY_RATE NUMBER(10,2) DEFAULT 0,
        BUDGET_HOURS NUMBER(10,2),
        CREATED_BY NUMBER NOT NULL,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_PROJECT_MANAGER FOREIGN KEY (PROJECT_MANAGER) REFERENCES HRMS_EMPLOYEES(EMPLOYEE_ID),
        CONSTRAINT FK_PROJECT_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_PROJECTS table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_PROJECTS table already exists');
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

  // Create new project
  static async create(projectData) {
    console.log('🔍 Creating project with data:', projectData);
    
    const sql = `
      INSERT INTO HRMS_PROJECTS (
        PROJECT_CODE, PROJECT_NAME, DESCRIPTION, CLIENT_NAME,
        PROJECT_MANAGER, START_DATE, END_DATE, STATUS,
        IS_BILLABLE, HOURLY_RATE, BUDGET_HOURS, CREATED_BY
      ) VALUES (
        :projectCode, :projectName, :description, :clientName,
        :projectManager, TO_DATE(:startDate, 'YYYY-MM-DD'), TO_DATE(:endDate, 'YYYY-MM-DD'), :status,
        :isBillable, :hourlyRate, :budgetHours, :createdBy
      )
    `;

    const params = {
      projectCode: projectData.projectCode,
      projectName: projectData.projectName,
      description: projectData.description || null,
      clientName: projectData.clientName || null,
      projectManager: projectData.projectManager || null,
      startDate: this.formatDateForOracle(projectData.startDate),
      endDate: this.formatDateForOracle(projectData.endDate),
      status: projectData.status || 'ACTIVE',
      isBillable: projectData.isBillable ? 1 : 0,
      hourlyRate: projectData.hourlyRate || 0,
      budgetHours: projectData.budgetHours || null,
      createdBy: projectData.createdBy
    };

    console.log('📊 Executing SQL with params:', params);
    
    try {
      const result = await executeQuery(sql, params);
      console.log('✅ Project created successfully');
      return { success: true, projectId: result.lastRowid };
    } catch (error) {
      console.error('❌ Error creating project:', error.message);
      throw error;
    }
  }

  // Get all projects with filtering
  static async findAll(filters = {}) {
    let sql = `
      SELECT 
        p.PROJECT_ID,
        p.PROJECT_CODE,
        p.PROJECT_NAME,
        p.DESCRIPTION,
        p.CLIENT_NAME,
        p.PROJECT_MANAGER,
        e.FIRST_NAME || ' ' || e.LAST_NAME AS MANAGER_NAME,
        p.START_DATE,
        p.END_DATE,
        p.STATUS,
        p.IS_BILLABLE,
        p.HOURLY_RATE,
        p.BUDGET_HOURS,
        p.CREATED_BY,
        u.FIRST_NAME || ' ' || u.LAST_NAME AS CREATED_BY_NAME,
        p.CREATED_AT,
        p.UPDATED_AT
      FROM HRMS_PROJECTS p
      LEFT JOIN HRMS_EMPLOYEES e ON p.PROJECT_MANAGER = e.EMPLOYEE_ID
      LEFT JOIN HRMS_USERS u ON p.CREATED_BY = u.USER_ID
      WHERE 1=1
    `;

    const params = {};
    
    if (filters.status) {
      sql += ` AND p.STATUS = :status`;
      params.status = filters.status;
    }
    
    if (filters.isBillable !== undefined) {
      sql += ` AND p.IS_BILLABLE = :isBillable`;
      params.isBillable = filters.isBillable ? 1 : 0;
    }
    
    if (filters.clientName) {
      sql += ` AND UPPER(p.CLIENT_NAME) LIKE UPPER(:clientName)`;
      params.clientName = `%${filters.clientName}%`;
    }
    
    if (filters.projectName) {
      sql += ` AND UPPER(p.PROJECT_NAME) LIKE UPPER(:projectName)`;
      params.projectName = `%${filters.projectName}%`;
    }

    sql += ` ORDER BY p.CREATED_AT DESC`;

    try {
      const result = await executeQuery(sql, params);
      return result.rows || [];
    } catch (error) {
      console.error('❌ Error fetching projects:', error.message);
      throw error;
    }
  }

  // Get project by ID
  static async findById(projectId) {
    const sql = `
      SELECT 
        p.PROJECT_ID,
        p.PROJECT_CODE,
        p.PROJECT_NAME,
        p.DESCRIPTION,
        p.CLIENT_NAME,
        p.PROJECT_MANAGER,
        e.FIRST_NAME || ' ' || e.LAST_NAME AS MANAGER_NAME,
        p.START_DATE,
        p.END_DATE,
        p.STATUS,
        p.IS_BILLABLE,
        p.HOURLY_RATE,
        p.BUDGET_HOURS,
        p.CREATED_BY,
        u.FIRST_NAME || ' ' || u.LAST_NAME AS CREATED_BY_NAME,
        p.CREATED_AT,
        p.UPDATED_AT
      FROM HRMS_PROJECTS p
      LEFT JOIN HRMS_EMPLOYEES e ON p.PROJECT_MANAGER = e.EMPLOYEE_ID
      LEFT JOIN HRMS_USERS u ON p.CREATED_BY = u.USER_ID
      WHERE p.PROJECT_ID = :projectId
    `;

    try {
      const result = await executeQuery(sql, { projectId });
      return result.rows?.[0] || null;
    } catch (error) {
      console.error('❌ Error fetching project by ID:', error.message);
      throw error;
    }
  }

  // Update project
  static async update(projectId, projectData) {
    console.log('🔍 Updating project with ID:', projectId, 'Data:', projectData);
    
    const sql = `
      UPDATE HRMS_PROJECTS SET
        PROJECT_CODE = :projectCode,
        PROJECT_NAME = :projectName,
        DESCRIPTION = :description,
        CLIENT_NAME = :clientName,
        PROJECT_MANAGER = :projectManager,
        START_DATE = TO_DATE(:startDate, 'YYYY-MM-DD'),
        END_DATE = TO_DATE(:endDate, 'YYYY-MM-DD'),
        STATUS = :status,
        IS_BILLABLE = :isBillable,
        HOURLY_RATE = :hourlyRate,
        BUDGET_HOURS = :budgetHours,
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE PROJECT_ID = :projectId
    `;

    const params = {
      projectId,
      projectCode: projectData.projectCode,
      projectName: projectData.projectName,
      description: projectData.description || null,
      clientName: projectData.clientName || null,
      projectManager: projectData.projectManager || null,
      startDate: this.formatDateForOracle(projectData.startDate),
      endDate: this.formatDateForOracle(projectData.endDate),
      status: projectData.status || 'ACTIVE',
      isBillable: projectData.isBillable ? 1 : 0,
      hourlyRate: projectData.hourlyRate || 0,
      budgetHours: projectData.budgetHours || null
    };

    try {
      const result = await executeQuery(sql, params);
      console.log('✅ Project updated successfully');
      return { success: true, rowsAffected: result.rowsAffected };
    } catch (error) {
      console.error('❌ Error updating project:', error.message);
      throw error;
    }
  }

  // Delete project
  static async delete(projectId) {
    const sql = `DELETE FROM HRMS_PROJECTS WHERE PROJECT_ID = :projectId`;
    
    try {
      const result = await executeQuery(sql, { projectId });
      console.log('✅ Project deleted successfully');
      return { success: true, rowsAffected: result.rowsAffected };
    } catch (error) {
      console.error('❌ Error deleting project:', error.message);
      throw error;
    }
  }

  // Get projects for dropdown (active projects only)
  static async getDropdownList() {
    const sql = `
      SELECT 
        PROJECT_ID,
        PROJECT_CODE,
        PROJECT_NAME,
        CLIENT_NAME,
        IS_BILLABLE
      FROM HRMS_PROJECTS 
      WHERE STATUS = 'ACTIVE'
      ORDER BY PROJECT_NAME
    `;

    try {
      const result = await executeQuery(sql);
      return result.rows || [];
    } catch (error) {
      console.error('❌ Error fetching projects dropdown:', error.message);
      throw error;
    }
  }

  // Get project statistics
  static async getStatistics() {
    const sql = `
      SELECT 
        COUNT(*) AS total_projects,
        COUNT(CASE WHEN STATUS = 'ACTIVE' THEN 1 END) AS active_projects,
        COUNT(CASE WHEN STATUS = 'COMPLETED' THEN 1 END) AS completed_projects,
        COUNT(CASE WHEN IS_BILLABLE = 1 THEN 1 END) AS billable_projects,
        AVG(HOURLY_RATE) AS avg_hourly_rate
      FROM HRMS_PROJECTS
    `;

    try {
      const result = await executeQuery(sql);
      return result.rows?.[0] || {};
    } catch (error) {
      console.error('❌ Error fetching project statistics:', error.message);
      throw error;
    }
  }
}

module.exports = Project; 
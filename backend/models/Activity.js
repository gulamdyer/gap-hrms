const { executeQuery } = require('../config/database');
const oracledb = require('oracledb');

class Activity {
  // Create activities table if not exists
  static async createTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_ACTIVITIES (
        ACTIVITY_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        USER_ID NUMBER NOT NULL,
        EMPLOYEE_ID NUMBER,
        MODULE VARCHAR2(50) NOT NULL,
        ACTION VARCHAR2(50) NOT NULL,
        ENTITY_TYPE VARCHAR2(50) NOT NULL,
        ENTITY_ID NUMBER,
        ENTITY_NAME VARCHAR2(200),
        DESCRIPTION VARCHAR2(500) NOT NULL,
        OLD_VALUES VARCHAR2(4000),
        NEW_VALUES VARCHAR2(4000),
        IP_ADDRESS VARCHAR2(45),
        USER_AGENT VARCHAR2(500),
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_ACTIVITY_USER FOREIGN KEY (USER_ID) REFERENCES HRMS_USERS(USER_ID),
        CONSTRAINT FK_ACTIVITY_EMPLOYEE FOREIGN KEY (EMPLOYEE_ID) REFERENCES HRMS_EMPLOYEES(EMPLOYEE_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_ACTIVITIES table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_ACTIVITIES table already exists');
      } else {
        throw error;
      }
    }
  }

  // Create new activity
  static async create(activityData) {
    console.log('🔍 Creating activity with data:', {
      module: activityData.module,
      action: activityData.action,
      entityType: activityData.entityType,
      entityId: activityData.entityId,
      description: activityData.description,
      hasOldValues: !!activityData.oldValues,
      hasNewValues: !!activityData.newValues,
      oldValuesType: typeof activityData.oldValues,
      newValuesType: typeof activityData.newValues,
      oldValuesLength: activityData.oldValues ? activityData.oldValues.length : 0,
      newValuesLength: activityData.newValues ? activityData.newValues.length : 0
    });
    
    const sql = `
      INSERT INTO HRMS_ACTIVITIES (
        USER_ID, EMPLOYEE_ID, MODULE, ACTION, ENTITY_TYPE, ENTITY_ID, 
        ENTITY_NAME, DESCRIPTION, OLD_VALUES, NEW_VALUES, IP_ADDRESS, USER_AGENT
      ) VALUES (
        :userId, :employeeId, :module, :action, :entityType, :entityId,
        :entityName, :description, :oldValues, :newValues, :ipAddress, :userAgent
      ) RETURNING ACTIVITY_ID INTO :activityId
    `;
    
    const binds = {
      userId: activityData.userId,
      employeeId: activityData.employeeId || null,
      module: activityData.module,
      action: activityData.action,
      entityType: activityData.entityType,
      entityId: activityData.entityId || null,
      entityName: activityData.entityName || null,
      description: activityData.description,
      oldValues: activityData.oldValues ? (typeof activityData.oldValues === 'string' ? activityData.oldValues : JSON.stringify(activityData.oldValues)) : null,
      newValues: activityData.newValues ? (typeof activityData.newValues === 'string' ? activityData.newValues : JSON.stringify(activityData.newValues)) : null,
      ipAddress: activityData.ipAddress || null,
      userAgent: activityData.userAgent || null,
      activityId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };
    
    try {
      console.log('🔍 Executing SQL with binds:', {
        userId: binds.userId,
        employeeId: binds.employeeId,
        module: binds.module,
        action: binds.action,
        entityType: binds.entityType,
        entityId: binds.entityId,
        entityName: binds.entityName,
        description: binds.description,
        hasOldValues: !!binds.oldValues,
        hasNewValues: !!binds.newValues,
        oldValuesLength: binds.oldValues ? binds.oldValues.length : 0,
        newValuesLength: binds.newValues ? binds.newValues.length : 0
      });
      
      const result = await executeQuery(sql, binds);
      const activityId = result.outBinds.activityId[0];
      console.log('✅ Activity created successfully with ID:', activityId);
      return activityId;
    } catch (error) {
      console.error('❌ Error creating activity:', error);
      throw error;
    }
  }

  // Get all activities with pagination and filters
  static async getAllActivities(filters = {}) {
    console.log('🔍 Getting all activities with filters:', filters);
    
    const { page = 1, limit = 10, module, action, entityType, userId, employeeId } = filters;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const binds = {};
    
    if (module) {
      whereClause += ' AND a.MODULE = :module';
      binds.module = module;
    }
    
    if (action) {
      whereClause += ' AND a.ACTION = :action';
      binds.action = action;
    }
    
    if (entityType) {
      whereClause += ' AND a.ENTITY_TYPE = :entityType';
      binds.entityType = entityType;
    }
    
    if (userId) {
      whereClause += ' AND a.USER_ID = :userId';
      binds.userId = userId;
    }
    
    if (employeeId) {
      whereClause += ' AND a.EMPLOYEE_ID = :employeeId';
      binds.employeeId = employeeId;
    }
    
    const sql = `
      SELECT 
        a.ACTIVITY_ID,
        a.USER_ID,
        a.EMPLOYEE_ID,
        a.MODULE,
        a.ACTION,
        a.ENTITY_TYPE,
        a.ENTITY_ID,
        a.ENTITY_NAME,
        a.DESCRIPTION,
        a.OLD_VALUES,
        a.NEW_VALUES,
        a.IP_ADDRESS,
        a.USER_AGENT,
        a.CREATED_AT,
        u.FIRST_NAME as USER_FIRST_NAME,
        u.LAST_NAME as USER_LAST_NAME,
        e.FIRST_NAME as EMPLOYEE_FIRST_NAME,
        e.LAST_NAME as EMPLOYEE_LAST_NAME,
        e.EMPLOYEE_CODE
      FROM HRMS_ACTIVITIES a
      LEFT JOIN HRMS_USERS u ON a.USER_ID = u.USER_ID
      LEFT JOIN HRMS_EMPLOYEES e ON a.EMPLOYEE_ID = e.EMPLOYEE_ID
      ${whereClause}
      ORDER BY a.CREATED_AT DESC
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;
    
    const countSql = `
      SELECT COUNT(*) as TOTAL_COUNT
      FROM HRMS_ACTIVITIES a
      LEFT JOIN HRMS_USERS u ON a.USER_ID = u.USER_ID
      LEFT JOIN HRMS_EMPLOYEES e ON a.EMPLOYEE_ID = e.EMPLOYEE_ID
      ${whereClause}
    `;
    
    try {
      const [result, countResult] = await Promise.all([
        executeQuery(sql, { ...binds, offset, limit }),
        executeQuery(countSql, binds)
      ]);
      
      // For VARCHAR2 fields, no special handling is needed
      const activities = result.rows.map((activity) => {
        // For VARCHAR2 fields, no special handling is needed
        return activity;
      });
      
      const totalCount = countResult.rows[0].TOTAL_COUNT;
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        activities,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: totalCount,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      console.error('❌ Error fetching activities:', error);
      throw error;
    }
  }

  // Get recent activities for dashboard
  static async getRecentActivities(limit = 10) {
    console.log('🔍 Getting recent activities, limit:', limit);
    
    const sql = `
      SELECT 
        a.ACTIVITY_ID,
        a.USER_ID,
        a.EMPLOYEE_ID,
        a.MODULE,
        a.ACTION,
        a.ENTITY_TYPE,
        a.ENTITY_ID,
        a.ENTITY_NAME,
        a.DESCRIPTION,
        a.OLD_VALUES,
        a.NEW_VALUES,
        a.CREATED_AT,
        u.FIRST_NAME as USER_FIRST_NAME,
        u.LAST_NAME as USER_LAST_NAME,
        e.FIRST_NAME as EMPLOYEE_FIRST_NAME,
        e.LAST_NAME as EMPLOYEE_LAST_NAME,
        e.EMPLOYEE_CODE
      FROM HRMS_ACTIVITIES a
      LEFT JOIN HRMS_USERS u ON a.USER_ID = u.USER_ID
      LEFT JOIN HRMS_EMPLOYEES e ON a.EMPLOYEE_ID = e.EMPLOYEE_ID
      ORDER BY a.CREATED_AT DESC
      FETCH FIRST :limit ROWS ONLY
    `;
    
    try {
      const result = await executeQuery(sql, { limit });
      
      // For VARCHAR2 fields, no special handling is needed
      const activities = result.rows.map((activity) => {
        // For VARCHAR2 fields, no special handling is needed
        return activity;
      });
      
      return activities;
    } catch (error) {
      console.error('❌ Error fetching recent activities:', error);
      throw error;
    }
  }

  // Get activity by ID
  static async findById(activityId) {
    const sql = `
      SELECT 
        a.*,
        u.FIRST_NAME as USER_FIRST_NAME,
        u.LAST_NAME as USER_LAST_NAME,
        e.FIRST_NAME as EMPLOYEE_FIRST_NAME,
        e.LAST_NAME as EMPLOYEE_LAST_NAME,
        e.EMPLOYEE_CODE
      FROM HRMS_ACTIVITIES a
      LEFT JOIN HRMS_USERS u ON a.USER_ID = u.USER_ID
      LEFT JOIN HRMS_EMPLOYEES e ON a.EMPLOYEE_ID = e.EMPLOYEE_ID
      WHERE a.ACTIVITY_ID = :activityId
    `;
    
    const result = await executeQuery(sql, { activityId });
    const activity = result.rows[0];
    
    // For VARCHAR2 fields, no special handling is needed
    return activity;
  }

  // Delete activity
  static async delete(activityId) {
    const sql = 'DELETE FROM HRMS_ACTIVITIES WHERE ACTIVITY_ID = :activityId';
    await executeQuery(sql, { activityId });
  }

  // Get activity statistics
  static async getStatistics() {
    const sql = `
      SELECT 
        COUNT(*) as TOTAL_ACTIVITIES,
        COUNT(CASE WHEN MODULE = 'EMPLOYEE' THEN 1 END) as EMPLOYEE_ACTIVITIES,
        COUNT(CASE WHEN MODULE = 'LEAVE' THEN 1 END) as LEAVE_ACTIVITIES,
        COUNT(CASE WHEN MODULE = 'PAYROLL' THEN 1 END) as PAYROLL_ACTIVITIES,
        COUNT(CASE WHEN ACTION = 'CREATE' THEN 1 END) as CREATE_ACTIONS,
        COUNT(CASE WHEN ACTION = 'UPDATE' THEN 1 END) as UPDATE_ACTIONS,
        COUNT(CASE WHEN ACTION = 'DELETE' THEN 1 END) as DELETE_ACTIONS
      FROM HRMS_ACTIVITIES
    `;
    
    const result = await executeQuery(sql);
    return result.rows[0];
  }

  // Helper method to format activity for dashboard
  static formatActivityForDashboard(activity) {
    const now = new Date();
    const activityDate = new Date(activity.CREATED_AT);
    const diffInHours = Math.floor((now - activityDate) / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    let timeAgo;
    if (diffInHours < 1) {
      timeAgo = 'Just now';
    } else if (diffInHours < 24) {
      timeAgo = `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      timeAgo = `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else {
      timeAgo = activityDate.toLocaleDateString();
    }
    
    // Determine activity type and status
    let type = 'general';
    let status = 'completed';
    
    switch (activity.MODULE) {
      case 'EMPLOYEE':
        type = activity.ACTION === 'CREATE' ? 'employee_added' : 'employee_updated';
        break;
      case 'LEAVE':
        if (activity.ACTION === 'CREATE') {
          type = 'leave_request';
          status = 'pending';
        } else if (activity.ACTION === 'UPDATE' && activity.DESCRIPTION.includes('approved')) {
          type = 'leave_approved';
        }
        break;
      case 'DOCUMENT':
        type = 'document_upload';
        break;
      case 'PAYROLL':
        type = 'payroll_processed';
        break;
    }
    
    return {
      id: activity.ACTIVITY_ID,
      type,
      message: activity.DESCRIPTION,
      time: timeAgo,
      status,
      user: `${activity.USER_FIRST_NAME} ${activity.USER_LAST_NAME}`,
      employee: activity.EMPLOYEE_FIRST_NAME ? `${activity.EMPLOYEE_FIRST_NAME} ${activity.EMPLOYEE_LAST_NAME}` : null,
      module: activity.MODULE,
      action: activity.ACTION,
      hasOldValues: !!activity.OLD_VALUES,
      hasNewValues: !!activity.NEW_VALUES
    };
  }
}

module.exports = Activity; 
const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Create users table if not exists
  static async createTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_USERS (
        USER_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        USERNAME VARCHAR2(50) UNIQUE NOT NULL,
        EMAIL VARCHAR2(100) UNIQUE NOT NULL,
        PASSWORD_HASH VARCHAR2(255) NOT NULL,
        FIRST_NAME VARCHAR2(50) NOT NULL,
        LAST_NAME VARCHAR2(50) NOT NULL,
        PHONE VARCHAR2(20),
        ROLE VARCHAR2(20) DEFAULT 'USER' CHECK (ROLE IN ('ADMIN', 'HR', 'MANAGER', 'USER')),
        STATUS VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (STATUS IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
        PAY_GRADE_ID NUMBER,
        LAST_LOGIN TIMESTAMP,
        PASSWORD_RESET_TOKEN VARCHAR2(255),
        PASSWORD_RESET_EXPIRES TIMESTAMP,
        CREATED_BY NUMBER,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT FK_USER_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID),
        CONSTRAINT FK_USER_PAY_GRADE FOREIGN KEY (PAY_GRADE_ID) REFERENCES HRMS_PAY_GRADES(PAY_GRADE_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_USERS table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_USERS table already exists');
        // Try to add missing columns
        await this.addMissingColumns();
      } else {
        throw error;
      }
    }
  }

  // Add missing columns to existing table
  static async addMissingColumns() {
    try {
      // Check if CREATED_BY column exists
      const checkCreatedBySQL = `
        SELECT COUNT(*) as COLUMN_EXISTS 
        FROM USER_TAB_COLUMNS 
        WHERE TABLE_NAME = 'HRMS_USERS' AND COLUMN_NAME = 'CREATED_BY'
      `;
      
      const createdByCheck = await executeQuery(checkCreatedBySQL);
      
      if (createdByCheck.rows[0].COLUMN_EXISTS === 0) {
        console.log('🔧 Adding missing CREATED_BY column...');
        await executeQuery(`ALTER TABLE HRMS_USERS ADD CREATED_BY NUMBER`);
        console.log('✅ CREATED_BY column added successfully');
      } else {
        console.log('ℹ️ CREATED_BY column already exists');
      }
      
      // Check if PHONE column exists
      const checkPhoneSQL = `
        SELECT COUNT(*) as COLUMN_EXISTS 
        FROM USER_TAB_COLUMNS 
        WHERE TABLE_NAME = 'HRMS_USERS' AND COLUMN_NAME = 'PHONE'
      `;
      
      const phoneCheck = await executeQuery(checkPhoneSQL);
      
      if (phoneCheck.rows[0].COLUMN_EXISTS === 0) {
        console.log('🔧 Adding missing PHONE column...');
        await executeQuery(`ALTER TABLE HRMS_USERS ADD PHONE VARCHAR2(20)`);
        console.log('✅ PHONE column added successfully');
      } else {
        console.log('ℹ️ PHONE column already exists');
      }

      // Check if PAY_GRADE_ID column exists
      const checkPayGradeSQL = `
        SELECT COUNT(*) as COLUMN_EXISTS 
        FROM USER_TAB_COLUMNS 
        WHERE TABLE_NAME = 'HRMS_USERS' AND COLUMN_NAME = 'PAY_GRADE_ID'
      `;
      
      const payGradeCheck = await executeQuery(checkPayGradeSQL);
      
      if (payGradeCheck.rows[0].COLUMN_EXISTS === 0) {
        console.log('🔧 Adding missing PAY_GRADE_ID column...');
        await executeQuery(`ALTER TABLE HRMS_USERS ADD PAY_GRADE_ID NUMBER`);
        console.log('✅ PAY_GRADE_ID column added successfully');
      } else {
        console.log('ℹ️ PAY_GRADE_ID column already exists');
      }
    } catch (error) {
      console.log('⚠️ Error adding missing columns:', error.message);
    }
  }

  // Get all users with filters and pagination
  static async getAllUsers(filters = {}) {
    try {
      console.log('🔍 User.getAllUsers called with filters:', filters);
      
      let sql = `
        SELECT 
          u.*,
          pg.GRADE_NAME as PAY_GRADE_NAME,
          pg.GRADE_CODE as PAY_GRADE_CODE
        FROM HRMS_USERS u
        LEFT JOIN HRMS_PAY_GRADES pg ON u.PAY_GRADE_ID = pg.PAY_GRADE_ID
        WHERE 1=1
      `;
      
      const binds = {};
      
      if (filters.status) {
        sql += ` AND u.STATUS = :status`;
        binds.status = filters.status;
      }
      
      if (filters.role) {
        sql += ` AND u.ROLE = :role`;
        binds.role = filters.role;
      }
      
      if (filters.search) {
        sql += ` AND (u.FIRST_NAME LIKE '%' || :search || '%' OR u.LAST_NAME LIKE '%' || :search || '%' OR u.EMAIL LIKE '%' || :search || '%' OR u.USERNAME LIKE '%' || :search || '%')`;
        binds.search = filters.search;
      }
      
      sql += ` ORDER BY u.CREATED_AT DESC`;
      
      console.log('🔍 SQL Query:', sql);
      console.log('🔍 Binds:', binds);
      
      // Pagination
      let page = parseInt(filters.page) || 1;
      let limit = parseInt(filters.limit) || 10;
      let offset = (page - 1) * limit;
      
      const paginatedSql = `${sql} OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
      
      // Get total count
      const countSql = `SELECT COUNT(*) as TOTAL FROM HRMS_USERS u WHERE 1=1` +
        (filters.status ? ` AND u.STATUS = :status` : '') +
        (filters.role ? ` AND u.ROLE = :role` : '') +
        (filters.search ? ` AND (u.FIRST_NAME LIKE '%' || :search || '%' OR u.LAST_NAME LIKE '%' || :search || '%' OR u.EMAIL LIKE '%' || :search || '%' OR u.USERNAME LIKE '%' || :search || '%')` : '');
      
      console.log('🔍 Count SQL:', countSql);
      
      const [result, countResult] = await Promise.all([
        executeQuery(paginatedSql, binds),
        executeQuery(countSql, binds)
      ]);
      
      console.log('✅ Query results - Users:', result.rows.length, 'Total:', countResult.rows[0].TOTAL);
      
      return {
        rows: result.rows,
        total: countResult.rows[0].TOTAL,
        page,
        limit,
        totalPages: Math.ceil(countResult.rows[0].TOTAL / limit)
      };
    } catch (error) {
      console.error('❌ Error in User.getAllUsers:', error);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  }

  // Get user by ID
  static async getById(id) {
    const sql = `
      SELECT 
        u.*,
        pg.GRADE_NAME as PAY_GRADE_NAME,
        pg.GRADE_CODE as PAY_GRADE_CODE
      FROM HRMS_USERS u
      LEFT JOIN HRMS_PAY_GRADES pg ON u.PAY_GRADE_ID = pg.PAY_GRADE_ID
      WHERE u.USER_ID = :id
    `;
    const result = await executeQuery(sql, { id });
    return result.rows[0];
  }

  // Original working method for authentication
  static async findById(id) {
    const sql = `SELECT * FROM HRMS_USERS WHERE USER_ID = :id`;
    const result = await executeQuery(sql, { id });
    return result.rows[0];
  }

  // Get user by username
  static async getByUsername(username) {
    const sql = `SELECT * FROM HRMS_USERS WHERE USERNAME = :username`;
    const result = await executeQuery(sql, { username });
    return result.rows[0];
  }

  // Original working method for authentication
  static async findByUsername(username) {
    const sql = `SELECT * FROM HRMS_USERS WHERE USERNAME = :username`;
    const result = await executeQuery(sql, { username });
    return result.rows[0];
  }

  // Get user by email
  static async getByEmail(email) {
    const sql = `SELECT * FROM HRMS_USERS WHERE EMAIL = :email`;
    const result = await executeQuery(sql, { email });
    return result.rows[0];
  }

  // Original working method for authentication
  static async findByEmail(email) {
    const sql = `SELECT * FROM HRMS_USERS WHERE EMAIL = :email`;
    const result = await executeQuery(sql, { email });
    return result.rows[0];
  }

  // Create new user
  static async create(userData, createdBy) {
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);
    
    const sql = `
      INSERT INTO HRMS_USERS (
        USERNAME, EMAIL, PASSWORD_HASH, FIRST_NAME, LAST_NAME, 
        PHONE, ROLE, STATUS, PAY_GRADE_ID, CREATED_BY
      ) VALUES (
        :username, :email, :passwordHash, :firstName, :lastName,
        :phone, :role, :status, :payGradeId, :createdBy
      ) RETURNING USER_ID INTO :userId
    `;
    
    const binds = {
      username: userData.username,
      email: userData.email,
      passwordHash,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone || null,
      role: userData.role || 'USER',
      status: userData.status || 'ACTIVE',
      payGradeId: userData.payGradeId || null,
      createdBy,
      userId: { type: 'NUMBER', dir: 'OUT' }
    };
    
    const result = await executeQuery(sql, binds);
    return result.outBinds.userId[0];
  }

  // Update user
  static async update(id, userData) {
    // Build dynamic SQL query based on provided fields
    const updateFields = [];
    const binds = { id };
    
    if (userData.username !== undefined) {
      updateFields.push('USERNAME = :username');
      binds.username = userData.username;
    }
    
    if (userData.email !== undefined) {
      updateFields.push('EMAIL = :email');
      binds.email = userData.email;
    }
    
    if (userData.firstName !== undefined) {
      updateFields.push('FIRST_NAME = :firstName');
      binds.firstName = userData.firstName;
    }
    
    if (userData.lastName !== undefined) {
      updateFields.push('LAST_NAME = :lastName');
      binds.lastName = userData.lastName;
    }
    
    if (userData.phone !== undefined) {
      updateFields.push('PHONE = :phone');
      binds.phone = userData.phone || null;
    }
    
    if (userData.role !== undefined) {
      updateFields.push('ROLE = :role');
      binds.role = userData.role;
    }
    
    if (userData.status !== undefined) {
      updateFields.push('STATUS = :status');
      binds.status = userData.status;
    }
    
    if (userData.payGradeId !== undefined) {
      updateFields.push('PAY_GRADE_ID = :payGradeId');
      binds.payGradeId = userData.payGradeId || null;
    }
    
    // Always update the UPDATED_AT timestamp
    updateFields.push('UPDATED_AT = CURRENT_TIMESTAMP');
    
    if (updateFields.length === 1) {
      // Only UPDATED_AT field, no actual data to update
      return;
    }
    
    const sql = `
      UPDATE HRMS_USERS SET 
        ${updateFields.join(', ')}
      WHERE USER_ID = :id
    `;
    
    await executeQuery(sql, binds);
  }

  // Update password
  static async updatePassword(id, newPassword) {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    const sql = `
      UPDATE HRMS_USERS SET 
        PASSWORD_HASH = :passwordHash,
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE USER_ID = :id
    `;
    
    await executeQuery(sql, { id, passwordHash });
  }

  // Update user status
  static async updateStatus(id, status) {
    const sql = `
      UPDATE HRMS_USERS SET 
        STATUS = :status,
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE USER_ID = :id
    `;
    
    await executeQuery(sql, { id, status });
  }

  // Delete user
  static async delete(id) {
    const sql = `DELETE FROM HRMS_USERS WHERE USER_ID = :id`;
    await executeQuery(sql, { id });
  }

  // Update last login
  static async updateLastLogin(id) {
    const sql = `
      UPDATE HRMS_USERS SET 
        LAST_LOGIN = CURRENT_TIMESTAMP
      WHERE USER_ID = :id
    `;
    
    await executeQuery(sql, { id });
  }

  // Validate password
  static async validatePassword(userId, password) {
    const sql = `SELECT PASSWORD_HASH FROM HRMS_USERS WHERE USER_ID = :id`;
    const result = await executeQuery(sql, { id: userId });
    
    if (result.rows.length === 0) {
      return false;
    }
    
    return await bcrypt.compare(password, result.rows[0].PASSWORD_HASH);
  }

  // Original working method for authentication
  static async verifyPassword(password, passwordHash) {
    return await bcrypt.compare(password, passwordHash);
  }

  // Get user statistics
  static async getStatistics() {
    const sql = `
      SELECT 
        COUNT(*) as TOTAL_USERS,
        COUNT(CASE WHEN STATUS = 'ACTIVE' THEN 1 END) as ACTIVE_USERS,
        COUNT(CASE WHEN STATUS = 'INACTIVE' THEN 1 END) as INACTIVE_USERS,
        COUNT(CASE WHEN STATUS = 'SUSPENDED' THEN 1 END) as SUSPENDED_USERS,
        COUNT(CASE WHEN ROLE = 'ADMIN' THEN 1 END) as ADMIN_USERS,
        COUNT(CASE WHEN ROLE = 'HR' THEN 1 END) as HR_USERS,
        COUNT(CASE WHEN ROLE = 'MANAGER' THEN 1 END) as MANAGER_USERS,
        COUNT(CASE WHEN ROLE = 'USER' THEN 1 END) as REGULAR_USERS
      FROM HRMS_USERS
    `;
    
    const result = await executeQuery(sql);
    return result.rows[0];
  }

  // Get users for dropdown
  static async getDropdownList() {
    const sql = `
      SELECT USER_ID, FIRST_NAME || ' ' || LAST_NAME as FULL_NAME, ROLE
      FROM HRMS_USERS 
      WHERE STATUS = 'ACTIVE'
      ORDER BY FIRST_NAME, LAST_NAME
    `;
    
    const result = await executeQuery(sql);
    return result.rows;
  }

  // Check if username exists
  static async usernameExists(username, excludeId = null) {
    let sql = `SELECT COUNT(*) as COUNT FROM HRMS_USERS WHERE USERNAME = :username`;
    const binds = { username };
    
    if (excludeId) {
      sql += ` AND USER_ID != :excludeId`;
      binds.excludeId = excludeId;
    }
    
    const result = await executeQuery(sql, binds);
    return result.rows[0].COUNT > 0;
  }

  // Check if email exists
  static async emailExists(email, excludeId = null) {
    let sql = `SELECT COUNT(*) as COUNT FROM HRMS_USERS WHERE EMAIL = :email`;
    const binds = { email };
    
    if (excludeId) {
      sql += ` AND USER_ID != :excludeId`;
      binds.excludeId = excludeId;
    }
    
    const result = await executeQuery(sql, binds);
    return result.rows[0].COUNT > 0;
  }

  // Validate user data
  static validateUserData(userData, isUpdate = false) {
    const errors = [];
    
    // Username validation
    if (!isUpdate || userData.username !== undefined) {
      if (!userData.username || userData.username.trim() === '') {
        errors.push('Username is required');
      } else if (userData.username.length < 3) {
        errors.push('Username must be at least 3 characters long');
      } else if (!/^[a-zA-Z0-9_]+$/.test(userData.username)) {
        errors.push('Username can only contain letters, numbers, and underscores');
      }
    }
    
    // Email validation
    if (!isUpdate || userData.email !== undefined) {
      if (!userData.email || userData.email.trim() === '') {
        errors.push('Email is required');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
        errors.push('Please enter a valid email address');
      }
    }
    
    // Password validation (only for create)
    if (!isUpdate) {
      if (!userData.password || userData.password.trim() === '') {
        errors.push('Password is required');
      } else if (userData.password && userData.password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }
    }
    
    // First name validation
    if (!isUpdate || userData.firstName !== undefined) {
      if (!userData.firstName || userData.firstName.trim() === '') {
        errors.push('First name is required');
      }
    }
    
    // Last name validation
    if (!isUpdate || userData.lastName !== undefined) {
      if (!userData.lastName || userData.lastName.trim() === '') {
        errors.push('Last name is required');
      }
    }
    
    // Role validation
    if (userData.role !== undefined) {
      const validRoles = ['ADMIN', 'HR', 'MANAGER', 'USER'];
      if (!validRoles.includes(userData.role)) {
        errors.push('Invalid role selected');
      }
    }
    
    // Status validation
    if (userData.status !== undefined) {
      const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
      if (!validStatuses.includes(userData.status)) {
        errors.push('Invalid status selected');
      }
    }
    
    // Phone validation
    if (userData.phone !== undefined && userData.phone) {
      if (!/^[\d\s\-\+\(\)]+$/.test(userData.phone)) {
        errors.push('Please enter a valid phone number');
      }
    }
    
    return errors;
  }
}

module.exports = User; 
const { executeQuery } = require('../config/database');
const oracledb = require('oracledb');

class Employee {
  // Create employees table if not exists
  static async createTable() {
    const createTableSQL = `
      CREATE TABLE HRMS_EMPLOYEES (
        EMPLOYEE_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        EMPLOYEE_CODE VARCHAR2(20) UNIQUE NOT NULL,
        
        -- Personal Information
        FIRST_NAME VARCHAR2(50) NOT NULL,
        LAST_NAME VARCHAR2(50) NOT NULL,
        LEGAL_NAME VARCHAR2(100),
        GENDER VARCHAR2(10) CHECK (GENDER IN ('MALE', 'FEMALE', 'OTHER')),
        NATIONALITY VARCHAR2(50),
        DATE_OF_BIRTH DATE,
        BIRTH_PLACE VARCHAR2(100),
        AVATAR_URL VARCHAR2(500),
        
        -- Job Information
        REPORT_TO_ID NUMBER,
        DESIGNATION VARCHAR2(100),
        ROLE VARCHAR2(100),
        POSITION VARCHAR2(100),
        LOCATION VARCHAR2(100),
        COST_CENTER VARCHAR2(50),
        DEPARTMENT VARCHAR2(100),
        WORKCENTER VARCHAR2(100),
        EMPLOYMENT_TYPE VARCHAR2(100),
        CALENDAR_ID NUMBER,
        SHIFT_ID NUMBER,
        PAY_GRADE_ID NUMBER,
        DATE_OF_JOINING DATE,
        PROBATION_DAYS NUMBER DEFAULT 90,
        CONFIRM_DATE DATE,
        NOTICE_DAYS NUMBER DEFAULT 30,
        
        -- Address Information
        ADDRESS VARCHAR2(500),
        PINCODE VARCHAR2(10),
        CITY VARCHAR2(50),
        DISTRICT VARCHAR2(50),
        STATE VARCHAR2(50),
        COUNTRY VARCHAR2(50) DEFAULT 'India',
        PHONE VARCHAR2(20),
        MOBILE VARCHAR2(20),
        EMAIL VARCHAR2(100),
        
        -- Personal Information
        FATHER_NAME VARCHAR2(100),
        MARITAL_STATUS VARCHAR2(20) CHECK (MARITAL_STATUS IN ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED')),
        SPOUSE_NAME VARCHAR2(100),
        RELIGION VARCHAR2(50),
        
        -- Legal Information
        AADHAR_NUMBER VARCHAR2(12),
        AADHAR_IMAGE_URL VARCHAR2(500),
        PAN_NUMBER VARCHAR2(10),
        PAN_IMAGE_URL VARCHAR2(500),
        DRIVING_LICENSE_NUMBER VARCHAR2(20),
        DRIVING_LICENSE_IMAGE_URL VARCHAR2(500),
        EDUCATION_CERTIFICATE_NUMBER VARCHAR2(50),
        EDUCATION_CERTIFICATE_IMAGE_URL VARCHAR2(500),
        
        -- Bank Information
        BANK_NAME VARCHAR2(100),
        BRANCH_NAME VARCHAR2(100),
        IFSC_CODE VARCHAR2(11),
        ACCOUNT_NUMBER VARCHAR2(50),
        UAN_NUMBER VARCHAR2(20),
        PF_NUMBER VARCHAR2(20),
        ESI_NUMBER VARCHAR2(20),
        
        -- System Information
        STATUS VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (STATUS IN ('ACTIVE', 'INACTIVE', 'TERMINATED', 'ONBOARDING')),
        CREATED_BY NUMBER,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Foreign Key Constraints
        CONSTRAINT FK_EMPLOYEE_REPORT_TO FOREIGN KEY (REPORT_TO_ID) REFERENCES HRMS_EMPLOYEES(EMPLOYEE_ID),
        CONSTRAINT FK_EMPLOYEE_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID),
        CONSTRAINT FK_EMPLOYEE_CALENDAR FOREIGN KEY (CALENDAR_ID) REFERENCES HRMS_CALENDAR(CALENDAR_ID),
        CONSTRAINT FK_EMPLOYEE_SHIFT FOREIGN KEY (SHIFT_ID) REFERENCES HRMS_SHIFTS(SHIFT_ID)
      )
    `;

    try {
      await executeQuery(createTableSQL);
      console.log('✅ HRMS_EMPLOYEES table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_EMPLOYEES table already exists');
      } else {
        throw error;
      }
    }
  }

  // Migrate ADDRESS column from CLOB to VARCHAR2(500)
  static async migrateAddressColumn() {
    try {
      console.log('🔄 Starting ADDRESS column migration...');
      
      // Check if ADDRESS column is CLOB
      const checkColumnSQL = `
        SELECT DATA_TYPE, DATA_LENGTH 
        FROM USER_TAB_COLUMNS 
        WHERE TABLE_NAME = 'HRMS_EMPLOYEES' AND COLUMN_NAME = 'ADDRESS'
      `;
      
      const columnInfo = await executeQuery(checkColumnSQL);
      
      if (columnInfo.rows && columnInfo.rows.length > 0) {
        const dataType = columnInfo.rows[0].DATA_TYPE;
        
        if (dataType === 'CLOB') {
          console.log('🔄 ADDRESS column is CLOB, migrating to VARCHAR2(500)...');
          
          // Create temporary column
          await executeQuery('ALTER TABLE HRMS_EMPLOYEES ADD ADDRESS_TEMP VARCHAR2(500)');
          
          // Copy data from CLOB to temporary column
          await executeQuery('UPDATE HRMS_EMPLOYEES SET ADDRESS_TEMP = TO_CHAR(ADDRESS) WHERE ADDRESS IS NOT NULL');
          
          // Drop old CLOB column
          await executeQuery('ALTER TABLE HRMS_EMPLOYEES DROP COLUMN ADDRESS');
          
          // Rename temporary column
          await executeQuery('ALTER TABLE HRMS_EMPLOYEES RENAME COLUMN ADDRESS_TEMP TO ADDRESS');
          
          console.log('✅ ADDRESS column migration completed successfully');
        } else {
          console.log('ℹ️ ADDRESS column is already VARCHAR2, no migration needed');
        }
      } else {
        console.log('ℹ️ ADDRESS column not found, table may be empty');
      }
    } catch (error) {
      console.error('❌ Error during ADDRESS column migration:', error.message);
      throw error;
    }
  }

  // Add missing columns if they don't exist
  static async addMissingColumns() {
    try {
      console.log('🔄 Checking for missing columns in HRMS_EMPLOYEES table...');
      
      // Check if CALENDAR_ID column exists
      const checkCalendarSQL = `
        SELECT COUNT(*) AS COLUMN_EXISTS
        FROM USER_TAB_COLUMNS 
        WHERE TABLE_NAME = 'HRMS_EMPLOYEES' AND COLUMN_NAME = 'CALENDAR_ID'
      `;
      
      const calendarCheck = await executeQuery(checkCalendarSQL);
      if (calendarCheck.rows[0].COLUMN_EXISTS === 0) {
        console.log('🔄 Adding CALENDAR_ID column...');
        await executeQuery('ALTER TABLE HRMS_EMPLOYEES ADD CALENDAR_ID NUMBER');
        console.log('✅ CALENDAR_ID column added');
      }
      
      // Check if SHIFT_ID column exists
      const checkShiftSQL = `
        SELECT COUNT(*) AS COLUMN_EXISTS
        FROM USER_TAB_COLUMNS 
        WHERE TABLE_NAME = 'HRMS_EMPLOYEES' AND COLUMN_NAME = 'SHIFT_ID'
      `;
      
      const shiftCheck = await executeQuery(checkShiftSQL);
      if (shiftCheck.rows[0].COLUMN_EXISTS === 0) {
        console.log('🔄 Adding SHIFT_ID column...');
        await executeQuery('ALTER TABLE HRMS_EMPLOYEES ADD SHIFT_ID NUMBER');
        console.log('✅ SHIFT_ID column added');
      }
      
      // Check if PAY_GRADE_ID column exists
      const checkPayGradeSQL = `
        SELECT COUNT(*) AS COLUMN_EXISTS
        FROM USER_TAB_COLUMNS 
        WHERE TABLE_NAME = 'HRMS_EMPLOYEES' AND COLUMN_NAME = 'PAY_GRADE_ID'
      `;
      
      const payGradeCheck = await executeQuery(checkPayGradeSQL);
      if (payGradeCheck.rows[0].COLUMN_EXISTS === 0) {
        console.log('🔄 Adding PAY_GRADE_ID column...');
        await executeQuery('ALTER TABLE HRMS_EMPLOYEES ADD PAY_GRADE_ID NUMBER');
        console.log('✅ PAY_GRADE_ID column added');
      }

      // New columns: DEPARTMENT, WORKCENTER, EMPLOYMENT_TYPE
      const checks = [
        { name: 'DEPARTMENT', sql: "ALTER TABLE HRMS_EMPLOYEES ADD DEPARTMENT VARCHAR2(100)" },
        { name: 'WORKCENTER', sql: "ALTER TABLE HRMS_EMPLOYEES ADD WORKCENTER VARCHAR2(100)" },
        { name: 'EMPLOYMENT_TYPE', sql: "ALTER TABLE HRMS_EMPLOYEES ADD EMPLOYMENT_TYPE VARCHAR2(100)" }
      ];
      for (const c of checks) {
        const q = `SELECT COUNT(*) AS COLUMN_EXISTS FROM USER_TAB_COLUMNS WHERE TABLE_NAME = 'HRMS_EMPLOYEES' AND COLUMN_NAME = '${c.name}'`;
        const r = await executeQuery(q);
        if (r.rows[0].COLUMN_EXISTS === 0) {
          console.log(`🔄 Adding ${c.name} column...`);
          await executeQuery(c.sql);
          console.log(`✅ ${c.name} column added`);
        }
      }
      
      // Add foreign key constraints if they don't exist
      await this.addMissingConstraints();
      
      console.log('✅ All missing columns added successfully');
    } catch (error) {
      console.error('❌ Error adding missing columns:', error.message);
      throw error;
    }
  }

  // Add missing foreign key constraints
  static async addMissingConstraints() {
    try {
      console.log('🔄 Checking for missing foreign key constraints...');
      
      // Check if FK_EMPLOYEE_CALENDAR constraint exists
      const checkCalendarConstraintSQL = `
        SELECT COUNT(*) AS CONSTRAINT_EXISTS
        FROM USER_CONSTRAINTS 
        WHERE TABLE_NAME = 'HRMS_EMPLOYEES' AND CONSTRAINT_NAME = 'FK_EMPLOYEE_CALENDAR'
      `;
      
      const calendarConstraintCheck = await executeQuery(checkCalendarConstraintSQL);
      if (calendarConstraintCheck.rows[0].CONSTRAINT_EXISTS === 0) {
        console.log('🔄 Adding FK_EMPLOYEE_CALENDAR constraint...');
        await executeQuery('ALTER TABLE HRMS_EMPLOYEES ADD CONSTRAINT FK_EMPLOYEE_CALENDAR FOREIGN KEY (CALENDAR_ID) REFERENCES HRMS_CALENDAR(CALENDAR_ID)');
        console.log('✅ FK_EMPLOYEE_CALENDAR constraint added');
      }
      
      // Check if FK_EMPLOYEE_SHIFT constraint exists
      const checkShiftConstraintSQL = `
        SELECT COUNT(*) AS CONSTRAINT_EXISTS
        FROM USER_CONSTRAINTS 
        WHERE TABLE_NAME = 'HRMS_EMPLOYEES' AND CONSTRAINT_NAME = 'FK_EMPLOYEE_SHIFT'
      `;
      
      const shiftConstraintCheck = await executeQuery(checkShiftConstraintSQL);
      if (shiftConstraintCheck.rows[0].CONSTRAINT_EXISTS === 0) {
        console.log('🔄 Adding FK_EMPLOYEE_SHIFT constraint...');
        await executeQuery('ALTER TABLE HRMS_EMPLOYEES ADD CONSTRAINT FK_EMPLOYEE_SHIFT FOREIGN KEY (SHIFT_ID) REFERENCES HRMS_SHIFTS(SHIFT_ID)');
        console.log('✅ FK_EMPLOYEE_SHIFT constraint added');
      }
      
      console.log('✅ All missing constraints added successfully');
    } catch (error) {
      console.error('❌ Error adding missing constraints:', error.message);
      throw error;
    }
  }

  // Generate unique employee code
  static async generateEmployeeCode() {
    const sql = `
      SELECT 'EMP' || TO_CHAR(SYSDATE, 'YYYY') || LPAD(NVL(MAX(SUBSTR(EMPLOYEE_CODE, 8)), 0) + 1, 4, '0') as EMP_CODE
      FROM HRMS_EMPLOYEES 
      WHERE EMPLOYEE_CODE LIKE 'EMP' || TO_CHAR(SYSDATE, 'YYYY') || '%'
    `;
    
    const result = await executeQuery(sql);
    return result.rows[0].EMP_CODE;
  }

  // Create new employee
  static async create(employeeData) {
    console.log('🔍 Creating employee with data:', employeeData);
    
    const employeeCode = await this.generateEmployeeCode();
    
    // Helper function to handle date conversion
    const formatDateForOracle = (dateString) => {
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
    };
    
    const sql = `
      INSERT INTO HRMS_EMPLOYEES (
        EMPLOYEE_CODE, FIRST_NAME, LAST_NAME, LEGAL_NAME, GENDER, NATIONALITY,
        DATE_OF_BIRTH, BIRTH_PLACE, AVATAR_URL, REPORT_TO_ID, DESIGNATION,
        ROLE, POSITION, LOCATION, COST_CENTER, DEPARTMENT, WORKCENTER, EMPLOYMENT_TYPE, CALENDAR_ID, SHIFT_ID, PAY_GRADE_ID, DATE_OF_JOINING, PROBATION_DAYS,
        CONFIRM_DATE, NOTICE_DAYS, ADDRESS, PINCODE, CITY, DISTRICT, STATE,
        COUNTRY, PHONE, MOBILE, EMAIL, FATHER_NAME, MARITAL_STATUS,
        SPOUSE_NAME, RELIGION, AADHAR_NUMBER, AADHAR_IMAGE_URL, PAN_NUMBER,
        PAN_IMAGE_URL, DRIVING_LICENSE_NUMBER, DRIVING_LICENSE_IMAGE_URL,
        EDUCATION_CERTIFICATE_NUMBER, EDUCATION_CERTIFICATE_IMAGE_URL,
        BANK_NAME, BRANCH_NAME, IFSC_CODE, ACCOUNT_NUMBER, UAN_NUMBER,
        PF_NUMBER, ESI_NUMBER, STATUS, CREATED_BY,
        PAYROLL_COUNTRY, EMPLOYEE_TYPE, AIR_TICKET_ELIGIBILITY, PAYROLL_COMPANIES, PF_DEDUCTION_COMPANY,
        AIR_TICKET_ELIGIBLE, AIR_TICKET_SEGMENT
      ) VALUES (
        :employeeCode, :firstName, :lastName, :legalName, :gender, :nationality,
        TO_DATE(:dateOfBirth, 'YYYY-MM-DD'), :birthPlace, :avatarUrl, :reportToId, :designation,
        :role, :position, :location, :costCenter, :department, :workcenter, :employmentType, :calendarId, :shiftId, :payGradeId, TO_DATE(:dateOfJoining, 'YYYY-MM-DD'), :probationDays,
        TO_DATE(:confirmDate, 'YYYY-MM-DD'), :noticeDays, :address, :pincode, :city, :district, :state,
        :country, :phone, :mobile, :email, :fatherName, :maritalStatus,
        :spouseName, :religion, :aadharNumber, :aadharImageUrl, :panNumber,
        :panImageUrl, :drivingLicenseNumber, :drivingLicenseImageUrl,
        :educationCertificateNumber, :educationCertificateImageUrl,
        :bankName, :branchName, :ifscCode, :accountNumber, :uanNumber,
        :pfNumber, :esiNumber, :status, :createdBy,
        :payrollCountry, :employeeType, :airTicketEligibility, :payrollCompanies, :pfDeductionCompany,
        :airTicketEligible, :airTicketSegment
      ) RETURNING EMPLOYEE_ID INTO :employeeId
    `;
    
    const binds = {
      employeeCode,
      firstName: employeeData.firstName,
      lastName: employeeData.lastName,
      legalName: employeeData.legalName,
      gender: employeeData.gender,
      nationality: employeeData.nationality,
      dateOfBirth: formatDateForOracle(employeeData.dateOfBirth),
      birthPlace: employeeData.birthPlace,
      avatarUrl: employeeData.avatarUrl,
      reportToId: employeeData.reportToId,
      designation: employeeData.designation,
      role: employeeData.role,
      position: employeeData.position,
      location: employeeData.location,
      costCenter: employeeData.costCenter,
      department: employeeData.department,
      workcenter: employeeData.workcenter,
      employmentType: employeeData.employmentType,
      calendarId: employeeData.calendarId,
      shiftId: employeeData.shiftId,
      payGradeId: employeeData.payGradeId,
      dateOfJoining: formatDateForOracle(employeeData.dateOfJoining),
      probationDays: employeeData.probationDays || 90,
      confirmDate: formatDateForOracle(employeeData.confirmDate),
      noticeDays: employeeData.noticeDays || 30,
      address: employeeData.address,
      pincode: employeeData.pincode,
      city: employeeData.city,
      district: employeeData.district,
      state: employeeData.state,
      country: employeeData.country || 'India',
      phone: employeeData.phone,
      mobile: employeeData.mobile,
      email: employeeData.email,
      fatherName: employeeData.fatherName,
      maritalStatus: employeeData.maritalStatus,
      spouseName: employeeData.spouseName,
      religion: employeeData.religion,
      aadharNumber: employeeData.aadharNumber,
      aadharImageUrl: employeeData.aadharImageUrl,
      panNumber: employeeData.panNumber,
      panImageUrl: employeeData.panImageUrl,
      drivingLicenseNumber: employeeData.drivingLicenseNumber,
      drivingLicenseImageUrl: employeeData.drivingLicenseImageUrl,
      educationCertificateNumber: employeeData.educationCertificateNumber,
      educationCertificateImageUrl: employeeData.educationCertificateImageUrl,
      bankName: employeeData.bankName,
      branchName: employeeData.branchName,
      ifscCode: employeeData.ifscCode,
      accountNumber: employeeData.accountNumber,
      uanNumber: employeeData.uanNumber,
      pfNumber: employeeData.pfNumber,
      esiNumber: employeeData.esiNumber,
      status: employeeData.status || 'ACTIVE',
      createdBy: employeeData.createdBy,
      payrollCountry: employeeData.payrollCountry,
      employeeType: employeeData.employeeType,
      airTicketEligibility: employeeData.airTicketEligibility,
      airTicketEligible: employeeData.airTicketEligible,
      airTicketSegment: employeeData.airTicketSegment,
      payrollCompanies: Array.isArray(employeeData.payrollCompanies) ? employeeData.payrollCompanies.join(',') : employeeData.payrollCompanies,
      pfDeductionCompany: employeeData.pfDeductionCompany,
      employeeId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };
    
    console.log('🗺️ Mapped binds for create:', binds);
    
    const result = await executeQuery(sql, binds);
    return result.outBinds.employeeId[0];
  }

  // Get employee by ID
  static async findById(employeeId) {
    const sql = `
      SELECT e.*, 
             r.FIRST_NAME as REPORT_TO_FIRST_NAME, 
             r.LAST_NAME as REPORT_TO_LAST_NAME,
             c.FIRST_NAME as CREATED_BY_FIRST_NAME,
             c.LAST_NAME as CREATED_BY_LAST_NAME,
             cal.CALENDAR_NAME,
             cal.CALENDAR_CODE,
             s.SHIFT_NAME,
             s.START_TIME,
             s.END_TIME,
             pg.GRADE_NAME,
             pg.GRADE_CODE,
             NVL(s.OVERTIME_APPLICABLE, 0) as OVERTIME_APPLICABLE
      FROM HRMS_EMPLOYEES e
      LEFT JOIN HRMS_EMPLOYEES r ON e.REPORT_TO_ID = r.EMPLOYEE_ID
      LEFT JOIN HRMS_USERS c ON e.CREATED_BY = c.USER_ID
      LEFT JOIN HRMS_CALENDAR cal ON e.CALENDAR_ID = cal.CALENDAR_ID
      LEFT JOIN HRMS_SHIFTS s ON e.SHIFT_ID = s.SHIFT_ID
      LEFT JOIN HRMS_PAY_GRADES pg ON e.PAY_GRADE_ID = pg.PAY_GRADE_ID
      WHERE e.EMPLOYEE_ID = :employeeId
    `;
    
    const result = await executeQuery(sql, [employeeId]);
    if (result.rows.length > 0) {
      const row = result.rows[0];
      if (row.PAYROLL_COMPANIES) {
        row.PAYROLL_COMPANIES = row.PAYROLL_COMPANIES.split(',');
      }
      return row;
    }
    return null;
  }

  // Get all employees
  static async getAllEmployees(filters = {}) {
    try {
      console.log('Employee.getAllEmployees called with filters:', filters);
      
      let sql = `
        SELECT e.*, 
               r.FIRST_NAME as REPORT_TO_FIRST_NAME, 
               r.LAST_NAME as REPORT_TO_LAST_NAME
        FROM HRMS_EMPLOYEES e
        LEFT JOIN HRMS_EMPLOYEES r ON e.REPORT_TO_ID = r.EMPLOYEE_ID
        WHERE 1=1
      `;
      
      const binds = [];
      let bindIndex = 1;
      
      if (filters.status) {
        if (filters.status === 'ACTIVE') {
          // Include both explicit ACTIVE and NULL values (for backward compatibility)
          sql += ` AND (e.STATUS = :${bindIndex} OR e.STATUS IS NULL)`;
        } else {
          sql += ` AND e.STATUS = :${bindIndex}`;
        }
        binds.push(filters.status);
        bindIndex++;
      }
      
      if (filters.search) {
        sql += ` AND (e.FIRST_NAME LIKE '%' || :${bindIndex} || '%' OR e.LAST_NAME LIKE '%' || :${bindIndex} || '%' OR e.EMPLOYEE_CODE LIKE '%' || :${bindIndex} || '%')`;
        binds.push(filters.search);
        bindIndex++;
      }
      
      sql += ` ORDER BY e.CREATED_AT DESC`;
      
      console.log('SQL Query:', sql);
      console.log('Binds:', binds);
      
      const result = await executeQuery(sql, binds);
      console.log('Query result rows:', result.rows.length);
      
      return result.rows;
    } catch (error) {
      console.error('Error in Employee.getAllEmployees:', error);
      throw error;
    }
  }

  // Update employee
  static async update(employeeId, employeeData) {
    const formatDateForOracle = (dateString) => {
      if (!dateString) return null;
      
      // If it's already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      
      // If it's in DD-MM-YYYY format, convert to YYYY-MM-DD
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
        const parts = dateString.split('-');
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      
      // If it's a Date object or other format, try to extract YYYY-MM-DD
      try {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch (e) {
        // Ignore parsing errors
      }
      
      return null;
    };

    // Build dynamic SQL query based on provided fields
    const updateFields = [];
    const binds = { employeeId };
    
    if (employeeData.firstName !== undefined) {
      updateFields.push('FIRST_NAME = :firstName');
      binds.firstName = employeeData.firstName;
    }
    
    if (employeeData.lastName !== undefined) {
      updateFields.push('LAST_NAME = :lastName');
      binds.lastName = employeeData.lastName;
    }
    
    if (employeeData.legalName !== undefined) {
      updateFields.push('LEGAL_NAME = :legalName');
      binds.legalName = employeeData.legalName;
    }
    
    if (employeeData.gender !== undefined) {
      updateFields.push('GENDER = :gender');
      binds.gender = employeeData.gender;
    }
    
    if (employeeData.nationality !== undefined) {
      updateFields.push('NATIONALITY = :nationality');
      binds.nationality = employeeData.nationality;
    }
    
    if (employeeData.dateOfBirth !== undefined) {
      const formattedDate = formatDateForOracle(employeeData.dateOfBirth);
      if (formattedDate) {
        updateFields.push('DATE_OF_BIRTH = TO_DATE(:dateOfBirth, \'YYYY-MM-DD\')');
        binds.dateOfBirth = formattedDate;
      }
    }
    
    if (employeeData.birthPlace !== undefined) {
      updateFields.push('BIRTH_PLACE = :birthPlace');
      binds.birthPlace = employeeData.birthPlace;
    }
    
    if (employeeData.avatarUrl !== undefined) {
      updateFields.push('AVATAR_URL = :avatarUrl');
      binds.avatarUrl = employeeData.avatarUrl;
    }
    
    if (employeeData.reportToId !== undefined) {
      updateFields.push('REPORT_TO_ID = :reportToId');
      binds.reportToId = employeeData.reportToId;
    }
    
    if (employeeData.designation !== undefined) {
      updateFields.push('DESIGNATION = :designation');
      binds.designation = employeeData.designation;
    }
    
    if (employeeData.role !== undefined) {
      updateFields.push('ROLE = :role');
      binds.role = employeeData.role;
    }
    
    if (employeeData.position !== undefined) {
      updateFields.push('POSITION = :position');
      binds.position = employeeData.position;
    }
    
    if (employeeData.location !== undefined) {
      updateFields.push('LOCATION = :location');
      binds.location = employeeData.location;
    }
    
    if (employeeData.costCenter !== undefined) {
      updateFields.push('COST_CENTER = :costCenter');
      binds.costCenter = employeeData.costCenter;
    }

    if (employeeData.department !== undefined) {
      updateFields.push('DEPARTMENT = :department');
      binds.department = employeeData.department;
    }

    if (employeeData.workcenter !== undefined) {
      updateFields.push('WORKCENTER = :workcenter');
      binds.workcenter = employeeData.workcenter;
    }

    if (employeeData.employmentType !== undefined) {
      updateFields.push('EMPLOYMENT_TYPE = :employmentType');
      binds.employmentType = employeeData.employmentType;
    }
    
    if (employeeData.calendarId !== undefined) {
      updateFields.push('CALENDAR_ID = :calendarId');
      binds.calendarId = employeeData.calendarId;
    }
    
    if (employeeData.shiftId !== undefined) {
      updateFields.push('SHIFT_ID = :shiftId');
      binds.shiftId = employeeData.shiftId;
    }
    
    if (employeeData.payGradeId !== undefined) {
      updateFields.push('PAY_GRADE_ID = :payGradeId');
      binds.payGradeId = employeeData.payGradeId;
    }
    
    if (employeeData.dateOfJoining !== undefined) {
      const formattedDate = formatDateForOracle(employeeData.dateOfJoining);
      if (formattedDate) {
        updateFields.push('DATE_OF_JOINING = TO_DATE(:dateOfJoining, \'YYYY-MM-DD\')');
        binds.dateOfJoining = formattedDate;
      }
    }
    
    if (employeeData.probationDays !== undefined) {
      updateFields.push('PROBATION_DAYS = :probationDays');
      binds.probationDays = employeeData.probationDays;
    }
    
    if (employeeData.confirmDate !== undefined) {
      const formattedDate = formatDateForOracle(employeeData.confirmDate);
      if (formattedDate) {
        updateFields.push('CONFIRM_DATE = TO_DATE(:confirmDate, \'YYYY-MM-DD\')');
        binds.confirmDate = formattedDate;
      }
    }
    
    if (employeeData.noticeDays !== undefined) {
      updateFields.push('NOTICE_DAYS = :noticeDays');
      binds.noticeDays = employeeData.noticeDays;
    }
    
    if (employeeData.address !== undefined) {
      updateFields.push('ADDRESS = :address');
      binds.address = employeeData.address;
    }
    
    if (employeeData.pincode !== undefined) {
      updateFields.push('PINCODE = :pincode');
      binds.pincode = employeeData.pincode;
    }
    
    if (employeeData.city !== undefined) {
      updateFields.push('CITY = :city');
      binds.city = employeeData.city;
    }
    
    if (employeeData.district !== undefined) {
      updateFields.push('DISTRICT = :district');
      binds.district = employeeData.district;
    }
    
    if (employeeData.state !== undefined) {
      updateFields.push('STATE = :state');
      binds.state = employeeData.state;
    }
    
    if (employeeData.country !== undefined) {
      updateFields.push('COUNTRY = :country');
      binds.country = employeeData.country;
    }
    
    if (employeeData.phone !== undefined) {
      updateFields.push('PHONE = :phone');
      binds.phone = employeeData.phone;
    }
    
    if (employeeData.mobile !== undefined) {
      updateFields.push('MOBILE = :mobile');
      binds.mobile = employeeData.mobile;
    }
    
    if (employeeData.email !== undefined) {
      updateFields.push('EMAIL = :email');
      binds.email = employeeData.email;
    }
    
    if (employeeData.fatherName !== undefined) {
      updateFields.push('FATHER_NAME = :fatherName');
      binds.fatherName = employeeData.fatherName;
    }
    
    if (employeeData.maritalStatus !== undefined) {
      updateFields.push('MARITAL_STATUS = :maritalStatus');
      binds.maritalStatus = employeeData.maritalStatus;
    }
    
    if (employeeData.spouseName !== undefined) {
      updateFields.push('SPOUSE_NAME = :spouseName');
      binds.spouseName = employeeData.spouseName;
    }
    
    if (employeeData.religion !== undefined) {
      updateFields.push('RELIGION = :religion');
      binds.religion = employeeData.religion;
    }
    
    if (employeeData.aadharNumber !== undefined) {
      updateFields.push('AADHAR_NUMBER = :aadharNumber');
      binds.aadharNumber = employeeData.aadharNumber;
    }
    
    if (employeeData.aadharImageUrl !== undefined) {
      updateFields.push('AADHAR_IMAGE_URL = :aadharImageUrl');
      binds.aadharImageUrl = employeeData.aadharImageUrl;
    }
    
    if (employeeData.panNumber !== undefined) {
      updateFields.push('PAN_NUMBER = :panNumber');
      binds.panNumber = employeeData.panNumber;
    }
    
    if (employeeData.panImageUrl !== undefined) {
      updateFields.push('PAN_IMAGE_URL = :panImageUrl');
      binds.panImageUrl = employeeData.panImageUrl;
    }
    
    if (employeeData.drivingLicenseNumber !== undefined) {
      updateFields.push('DRIVING_LICENSE_NUMBER = :drivingLicenseNumber');
      binds.drivingLicenseNumber = employeeData.drivingLicenseNumber;
    }
    
    if (employeeData.drivingLicenseImageUrl !== undefined) {
      updateFields.push('DRIVING_LICENSE_IMAGE_URL = :drivingLicenseImageUrl');
      binds.drivingLicenseImageUrl = employeeData.drivingLicenseImageUrl;
    }
    
    if (employeeData.educationCertificateNumber !== undefined) {
      updateFields.push('EDUCATION_CERTIFICATE_NUMBER = :educationCertificateNumber');
      binds.educationCertificateNumber = employeeData.educationCertificateNumber;
    }
    
    if (employeeData.educationCertificateImageUrl !== undefined) {
      updateFields.push('EDUCATION_CERTIFICATE_IMAGE_URL = :educationCertificateImageUrl');
      binds.educationCertificateImageUrl = employeeData.educationCertificateImageUrl;
    }
    
    if (employeeData.bankName !== undefined) {
      updateFields.push('BANK_NAME = :bankName');
      binds.bankName = employeeData.bankName;
    }
    
    if (employeeData.branchName !== undefined) {
      updateFields.push('BRANCH_NAME = :branchName');
      binds.branchName = employeeData.branchName;
    }
    
    if (employeeData.ifscCode !== undefined) {
      updateFields.push('IFSC_CODE = :ifscCode');
      binds.ifscCode = employeeData.ifscCode;
    }
    
    if (employeeData.accountNumber !== undefined) {
      updateFields.push('ACCOUNT_NUMBER = :accountNumber');
      binds.accountNumber = employeeData.accountNumber;
    }
    
    if (employeeData.uanNumber !== undefined) {
      updateFields.push('UAN_NUMBER = :uanNumber');
      binds.uanNumber = employeeData.uanNumber;
    }
    
    if (employeeData.pfNumber !== undefined) {
      updateFields.push('PF_NUMBER = :pfNumber');
      binds.pfNumber = employeeData.pfNumber;
    }
    
    if (employeeData.esiNumber !== undefined) {
      updateFields.push('ESI_NUMBER = :esiNumber');
      binds.esiNumber = employeeData.esiNumber;
    }
    
    if (employeeData.status !== undefined) {
      updateFields.push('STATUS = :status');
      binds.status = employeeData.status;
    }
    
    if (employeeData.payrollCountry !== undefined) {
      updateFields.push('PAYROLL_COUNTRY = :payrollCountry');
      binds.payrollCountry = employeeData.payrollCountry;
    }
    if (employeeData.employeeType !== undefined) {
      updateFields.push('EMPLOYEE_TYPE = :employeeType');
      binds.employeeType = employeeData.employeeType;
    }
    if (employeeData.airTicketEligibility !== undefined) {
      updateFields.push('AIR_TICKET_ELIGIBILITY = :airTicketEligibility');
      binds.airTicketEligibility = employeeData.airTicketEligibility;
    }
    if (employeeData.airTicketEligible !== undefined) {
      updateFields.push('AIR_TICKET_ELIGIBLE = :airTicketEligible');
      binds.airTicketEligible = employeeData.airTicketEligible;
    }
    if (employeeData.airTicketSegment !== undefined) {
      updateFields.push('AIR_TICKET_SEGMENT = :airTicketSegment');
      binds.airTicketSegment = employeeData.airTicketSegment;
    }
    if (employeeData.payrollCompanies !== undefined) {
      updateFields.push('PAYROLL_COMPANIES = :payrollCompanies');
      binds.payrollCompanies = Array.isArray(employeeData.payrollCompanies) ? employeeData.payrollCompanies.join(',') : employeeData.payrollCompanies;
    }
    if (employeeData.pfDeductionCompany !== undefined) {
      updateFields.push('PF_DEDUCTION_COMPANY = :pfDeductionCompany');
      binds.pfDeductionCompany = employeeData.pfDeductionCompany;
    }
    
    // Always update the UPDATED_AT timestamp
    updateFields.push('UPDATED_AT = CURRENT_TIMESTAMP');
    
    if (updateFields.length === 1) {
      // Only UPDATED_AT field, no actual data to update
      return;
    }
    
    const sql = `
      UPDATE HRMS_EMPLOYEES SET 
        ${updateFields.join(', ')}
      WHERE EMPLOYEE_ID = :employeeId
    `;
    
    await executeQuery(sql, binds);
  }

  // Delete employee
  static async delete(employeeId) {
    const sql = `DELETE FROM HRMS_EMPLOYEES WHERE EMPLOYEE_ID = :employeeId`;
    await executeQuery(sql, [employeeId]);
    return true;
  }

  // Get employees for dropdown (for reporting structure)
  static async getEmployeesForDropdown() {
    const sql = `
      SELECT EMPLOYEE_ID, EMPLOYEE_CODE, FIRST_NAME, LAST_NAME, DESIGNATION, SHIFT_ID
      FROM HRMS_EMPLOYEES 
      WHERE STATUS = 'ACTIVE'
      ORDER BY FIRST_NAME, LAST_NAME
    `;
    
    const result = await executeQuery(sql);
    return result.rows;
  }

  // Update employee status
  static async updateStatus(employeeId, status) {
    const sql = `
      UPDATE HRMS_EMPLOYEES 
      SET STATUS = :status, UPDATED_AT = CURRENT_TIMESTAMP
      WHERE EMPLOYEE_ID = :employeeId
    `;
    
    await executeQuery(sql, [status, employeeId]);
    return true;
  }
}

module.exports = Employee; 
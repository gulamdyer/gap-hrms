const Activity = require('../models/Activity');

// Activity logger middleware
const logActivity = async (req, res, next) => {
  console.log('🚨 ACTIVITY LOGGER CALLED! 🚨');
  console.log('🚨 ACTIVITY LOGGER CALLED! 🚨');
  console.log('🚨 ACTIVITY LOGGER CALLED! 🚨');
  console.log('🔍 Activity logger: ENTRY - Method:', req.method, 'Path:', req.path);
  console.log('🔍 Activity logger: Original URL:', req.originalUrl);
  console.log('🔍 Activity logger: Base URL:', req.baseUrl);
  console.log('🔍 Activity logger: User:', req.user);
  console.log('🔍 Activity logger: Body:', req.body);
  console.log('🔍 Activity logger: Params:', req.params);
  console.log('🔍 Activity logger: Should skip logging:', shouldSkipLogging(req.path, req.method));
  
  // Early return for GET requests to prevent infinite loops
  if (req.method === 'GET') {
    console.log('🔍 Activity logger: Skipping GET request');
    return next();
  }
  
  // Early return for certain paths that shouldn't be logged
  console.log('🔍 Activity logger: Checking shouldSkipLogging for path:', req.path, 'method:', req.method);
  // TEMPORARILY DISABLE shouldSkipLogging TO TEST
  // if (shouldSkipLogging(req.path, req.method)) {
  //   console.log('🔍 Activity logger: Skipping', req.method, req.path, '- shouldSkipLogging returned true');
  //   return next();
  // }
  
  console.log('🔍 Activity logger: Processing', req.method, req.path);
  
  // For UPDATE operations, fetch existing data to capture OLD_VALUES
  if ((req.method === 'PUT' || req.method === 'PATCH') && req.params.id) {
    try {
      console.log('🔍 Activity logger: Fetching old data for', req.method, req.path, req.params.id);
      
      // Fetch old data with proper error handling
      const oldData = await fetchExistingData(req.path, req.params.id);
      req.oldData = oldData; // Store old data in request object
      
      if (oldData) {
        console.log('🔍 Activity logger: Old data fetched successfully');
        console.log('🔍 Activity logger: Old data keys:', Object.keys(oldData));
        console.log('🔍 Activity logger: Old data sample:', {
          id: oldData.EMPLOYEE_ID || oldData.LEAVE_ID || oldData.LOAN_ID || oldData.ADVANCE_ID,
          name: oldData.FIRST_NAME || oldData.EMPLOYEE_FIRST_NAME
        });
      } else {
        console.log('⚠️ WARNING: No old data found - OLD_VALUES will be empty');
        console.log('⚠️ This will cause the activity to have incomplete information');
      }
    } catch (error) {
      console.error('❌ Error fetching old data for activity logging:', error);
      console.error('❌ This will result in empty OLD_VALUES');
      // Continue without old data - don't crash the server
      req.oldData = null;
    }
  }
  
  // Store original send method
  const originalSend = res.send;
  
  // Override send method to capture response
  res.send = function(data) {
    // Restore original send method
    res.send = originalSend;
    
    // Parse response data
    let responseData;
    try {
      responseData = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (error) {
      // If parsing fails, assume it's not JSON
      responseData = { success: false };
    }
    
    // Log activity if request was successful and user exists
    if (responseData.success && req.user && req.user.userId) {
      console.log('🔍 Activity logger: Logging activity for', req.method, req.path);
      
      // Special debugging for loans
      if (req.path.includes('/loans')) {
        console.log('🔍 Activity logger: Loans activity will be logged - Success:', responseData.success, 'User:', !!req.user);
      }
      
          // Add safety check before logging activity
    if (req.user && req.user.userId && responseData.success) {
      logActivityAsync(req, responseData).catch(error => {
        console.error('❌ Error in activity logging:', error);
        console.error('❌ Error details:', error.message);
        // Don't throw error to avoid breaking the main request
        // Just log and continue
      });
    } else {
      console.log('🔍 Activity logger: Skipping activity - missing user or unsuccessful response');
    }
    } else {
      console.log('🔍 Activity logger: Skipping activity - success:', responseData.success, 'user:', !!req.user);
      
      // Special debugging for loans
      if (req.path.includes('/loans')) {
        console.log('🔍 Activity logger: Loans activity skipped - Success:', responseData.success, 'User:', !!req.user, 'UserData:', req.user);
      }
    }
    
    // Call original send method
    return originalSend.call(this, data);
  };
  
  next();
};

// Async function to log activity
const logActivityAsync = async (req, responseData) => {
  try {
    const { method, path, body, params, query, user } = req;
    
    console.log('🔍 Activity logger: Processing activity - Method:', method, 'Path:', path);
    
    // Determine module and action based on route
    const module = getModuleFromPath(path);
    const action = getActionFromMethod(method);
    const entityType = getEntityTypeFromPath(path);
    const entityId = params.id || body.employeeId || body.leaveId || body.loanId || body.advanceId || body.deductionId || body.resignationId;
    
    // Special debugging for advances
    if (path.includes('/advances')) {
      console.log('🔍 ADVANCE DEBUG: Path:', path);
      console.log('🔍 ADVANCE DEBUG: Params:', params);
      console.log('🔍 ADVANCE DEBUG: Body keys:', Object.keys(body));
      console.log('🔍 ADVANCE DEBUG: EntityId:', entityId);
      console.log('🔍 ADVANCE DEBUG: Module:', module);
    }
    
    console.log('🔍 Activity logger: Module:', module, 'Action:', action, 'EntityType:', entityType, 'EntityId:', entityId);
    
    // Create activity description
    const description = createActivityDescription(method, path, body, responseData, user, req.oldData);
    
    // Get entity name if available
    const entityName = getEntityNameFromResponse(responseData, entityType);
    
    console.log('🔍 Activity logger: Description:', description);
    console.log('🔍 Activity logger: EntityName:', entityName);
    
    // Capture old and new values for UPDATE operations
    let oldValues = null;
    let newValues = null;
    
    if (method === 'PUT' || method === 'PATCH') {
      // For update operations, use old data from request object
      oldValues = req.oldData || null;
      newValues = { ...body };
      
      console.log('🔍 Activity logger: Processing UPDATE operation');
      console.log('🔍 Activity logger: Old values present:', !!oldValues);
      console.log('🔍 Activity logger: New values present:', !!newValues);
      console.log('🔍 Activity logger: req.oldData type:', typeof req.oldData);
      console.log('🔍 Activity logger: req.oldData value:', req.oldData);
      
      if (oldValues) {
        console.log('🔍 Activity logger: Old values keys:', Object.keys(oldValues));
        console.log('🔍 Activity logger: Old values sample:', {
          id: oldValues.EMPLOYEE_ID || oldValues.LEAVE_ID || oldValues.LOAN_ID,
          name: oldValues.FIRST_NAME || oldValues.EMPLOYEE_FIRST_NAME
        });
      } else {
        console.log('⚠️ WARNING: No old values found - OLD_VALUES will be empty');
        console.log('⚠️ This means the fetchExistingData function failed or returned null');
      }
      
      // Remove sensitive fields from logging
      delete newValues.password;
      delete newValues.token;
      delete newValues.avatar;
      delete newValues.document;
    } else if (method === 'POST') {
      // For create operations, capture the new values
      newValues = { ...body };
      
      // Remove sensitive fields from logging
      delete newValues.password;
      delete newValues.token;
      delete newValues.avatar;
      delete newValues.document;
    }
    
    // Prepare activity data
    const activityData = {
      userId: user.userId,
      employeeId: body.employeeId || params.id || null,
      module,
      action,
      entityType,
      entityId,
      entityName,
      description,
      oldValues: oldValues ? JSON.stringify(oldValues) : null,
      newValues: newValues ? JSON.stringify({
        ...newValues,
        // Include entity ID in NEW_VALUES for better tracking
        ...(entityId && { employeeId: entityId })
      }) : null,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };
    
    console.log('🔍 Activity logger: Creating activity with data:', {
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
    
    // Additional debugging for oldValues
    if (activityData.oldValues) {
      console.log('🔍 Activity logger: Old values content sample:', {
        keys: Object.keys(activityData.oldValues),
        sample: Object.keys(activityData.oldValues).slice(0, 3).reduce((acc, key) => {
          acc[key] = activityData.oldValues[key];
          return acc;
        }, {})
      });
    } else {
      console.log('⚠️ Activity logger: No old values to store');
    }
    
    // Add size limit protection for JSON data
    const maxJsonSize = 3000; // Limit to 3000 characters
    
    if (activityData.oldValues && typeof activityData.oldValues === 'object') {
      const oldValuesStr = JSON.stringify(activityData.oldValues);
      if (oldValuesStr.length > maxJsonSize) {
        console.log('⚠️ OLD_VALUES too large, truncating');
        activityData.oldValues = { 
          message: 'Data truncated due to size limit',
          size: oldValuesStr.length 
        };
      }
    }
    
    if (activityData.newValues && typeof activityData.newValues === 'object') {
      const newValuesStr = JSON.stringify(activityData.newValues);
      if (newValuesStr.length > maxJsonSize) {
        console.log('⚠️ NEW_VALUES too large, truncating');
        activityData.newValues = { 
          message: 'Data truncated due to size limit',
          size: newValuesStr.length 
        };
      }
    }
    
    await Activity.create(activityData);
    console.log('✅ Activity logged successfully:', description);
  } catch (error) {
    console.error('❌ Error logging activity:', error);
    console.error('❌ Error details:', error.message);
    // Don't throw error to avoid breaking the main request
    // Just log and continue
  }
};

// Function to fetch existing data for OLD_VALUES
const fetchExistingData = async (path, entityId) => {
  try {
    const oracledb = require('oracledb');
    
    let sql = '';
    let binds = {};
    
    console.log('🔍 fetchExistingData called for path:', path, 'entityId:', entityId);
    
    // Validate entityId
    if (!entityId) {
      console.log('⚠️ No entityId provided');
      return null;
    }
    
    // Parse entityId to number
    const numericEntityId = parseInt(entityId);
    if (isNaN(numericEntityId)) {
      console.log('⚠️ Invalid entityId:', entityId);
      return null;
    }
    
         // Use optimized queries with only essential fields to reduce data transfer
     // Check for employee paths - handle both /employees and just the ID part
     // Also handle paths that are just an ID (like /1, /2, etc.)
     if (path.includes('/employees') || (path.startsWith('/') && !path.includes('/')) || /^\/\d+$/.test(path)) {
       sql = `SELECT EMPLOYEE_ID, FIRST_NAME, LAST_NAME, EMAIL, PHONE, STATUS, 
                     DATE_OF_BIRTH, GENDER, NATIONALITY, LEGAL_NAME, 
                     POSITION, LOCATION, COST_CENTER, DATE_OF_JOINING, 
                     DESIGNATION, ROLE, ADDRESS, CITY, STATE, COUNTRY,
                     BIRTH_PLACE, AVATAR_URL, REPORT_TO_ID, PROBATION_DAYS,
                     CONFIRM_DATE, NOTICE_DAYS, PINCODE, DISTRICT, MOBILE,
                     FATHER_NAME, MARITAL_STATUS, SPOUSE_NAME, RELIGION,
                     AADHAR_NUMBER, AADHAR_IMAGE_URL, PAN_NUMBER, PAN_IMAGE_URL,
                     DRIVING_LICENSE_NUMBER, DRIVING_LICENSE_IMAGE_URL,
                     EDUCATION_CERTIFICATE_NUMBER, EDUCATION_CERTIFICATE_IMAGE_URL,
                     BANK_NAME, BRANCH_NAME, IFSC_CODE, ACCOUNT_NUMBER,
                     UAN_NUMBER, PF_NUMBER, ESI_NUMBER, CALENDAR_ID,
                     SHIFT_ID, PAY_GRADE_ID
              FROM HRMS_EMPLOYEES WHERE EMPLOYEE_ID = :entityId`;
       binds = { entityId: numericEntityId };
       console.log('🔍 Fetching employee data with comprehensive SQL');
     } else if (path.includes('/leaves')) {
      sql = `SELECT LEAVE_ID, EMPLOYEE_ID, LEAVE_TYPE, START_DATE, END_DATE, 
                    REASON, STATUS, AMOUNT_REQUESTED 
             FROM HRMS_LEAVES WHERE LEAVE_ID = :entityId`;
      binds = { entityId: numericEntityId };
    } else if (path.includes('/loans')) {
      sql = `SELECT LOAN_ID, EMPLOYEE_ID, LOAN_TYPE, AMOUNT, REASON, 
                    STATUS, INTEREST_RATE, REPAYMENT_PERIOD, LOAN_DATE,
                    APPROVAL_DATE, DISBURSEMENT_DATE, CREATED_BY, CREATED_AT, UPDATED_AT
             FROM HRMS_LOANS WHERE LOAN_ID = :entityId`;
      binds = { entityId: numericEntityId };
    } else if (path.includes('/advances')) {
      sql = `SELECT ADVANCE_ID, EMPLOYEE_ID, ADVANCE_TYPE, AMOUNT, REASON, 
                    REQUEST_DATE, AMOUNT_REQUIRED_ON_DATE, DEDUCTION_MONTH,
                    CREATED_BY, CREATED_AT, UPDATED_AT
             FROM HRMS_ADVANCES WHERE ADVANCE_ID = :entityId`;
      binds = { entityId: numericEntityId };
      console.log('🔍 ADVANCE DEBUG: Fetching advance data with SQL:', sql);
      console.log('🔍 ADVANCE DEBUG: Binds:', binds);
    } else if (path.includes('/deductions')) {
      sql = `SELECT DEDUCTION_ID, EMPLOYEE_ID, DEDUCTION_TYPE, AMOUNT, 
                    REASON, STATUS, EFFECTIVE_DATE 
             FROM HRMS_DEDUCTIONS WHERE DEDUCTION_ID = :entityId`;
      binds = { entityId: numericEntityId };
    } else if (path.includes('/resignations')) {
      sql = `SELECT RESIGNATION_ID, EMPLOYEE_ID, RESIGNATION_DATE, REASON, 
                    STATUS, NOTICE_PERIOD, LAST_WORKING_DAY 
             FROM HRMS_RESIGNATIONS WHERE RESIGNATION_ID = :entityId`;
      binds = { entityId: numericEntityId };
    } else if (path.includes('/payroll')) {
      sql = `SELECT PAYROLL_RUN_ID, PERIOD_START, PERIOD_END, STATUS, 
                    TOTAL_AMOUNT, EMPLOYEE_COUNT 
             FROM HRMS_PAYROLL_RUNS WHERE PAYROLL_RUN_ID = :entityId`;
      binds = { entityId: numericEntityId };
    } else if (path.includes('/leave-resumptions')) {
      sql = `SELECT RESUMPTION_ID, EMPLOYEE_ID, LEAVE_ID, RESUMPTION_DATE, 
                    STATUS, APPROVAL_DATE 
             FROM HRMS_LEAVE_RESUMPTIONS WHERE RESUMPTION_ID = :entityId`;
      binds = { entityId: numericEntityId };
    } else if (path.includes('/users')) {
      sql = `SELECT USER_ID, USERNAME, EMAIL, FIRST_NAME, LAST_NAME, ROLE, STATUS 
             FROM HRMS_USERS WHERE USER_ID = :entityId`;
      binds = { entityId: numericEntityId };
    } else {
      console.log('⚠️ No matching path found for:', path);
      return null;
    }
    
    console.log('🔍 Executing optimized query with binds:', binds);
    
    // Get connection directly from pool
    const connection = await oracledb.getConnection();
    try {
      const result = await connection.execute(sql, binds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        autoCommit: true
      });
      
      console.log('🔍 Query result rows:', result.rows.length);
      
      if (result.rows.length > 0) {
        console.log('✅ Found existing data:', Object.keys(result.rows[0]));
        
        // Special debugging for advances
        if (path.includes('/advances')) {
          console.log('🔍 ADVANCE DEBUG: Query result:', result.rows[0]);
        }
        
        return result.rows[0];
      } else {
        console.log('⚠️ No existing data found for entityId:', numericEntityId);
        
        // Special debugging for advances
        if (path.includes('/advances')) {
          console.log('🔍 ADVANCE DEBUG: No advance data found for ID:', numericEntityId);
        }
        
        return null;
      }
    } finally {
      await connection.close();
    }
  } catch (error) {
    console.error('❌ Error fetching existing data:', error);
    console.error('❌ Error details:', error.message);
    return null;
  }
};

// Helper functions
const getModuleFromPath = (path) => {
  // Handle both full paths and relative paths
  // Also handle paths that are just an ID (like /1, /2, etc.)
  if (path.includes('/employees') || (path.startsWith('/') && !path.includes('/')) || /^\/\d+$/.test(path)) return 'EMPLOYEE';
  if (path.includes('/leaves')) return 'LEAVE';
  if (path.includes('/loans')) return 'LOAN';
  if (path.includes('/payroll')) return 'PAYROLL';
  if (path.includes('/attendance')) return 'ATTENDANCE';
  if (path.includes('/timesheets')) return 'TIMESHEET';
  if (path.includes('/advances')) return 'ADVANCE';
  if (path.includes('/deductions')) return 'DEDUCTION';
  if (path.includes('/resignations')) return 'RESIGNATION';
  if (path.includes('/users')) return 'USER';
  if (path.includes('/leave-resumptions')) return 'LEAVE_RESUMPTION';
  return 'GENERAL';
};

const getActionFromMethod = (method) => {
  switch (method) {
    case 'POST': return 'CREATE';
    case 'PUT': case 'PATCH': return 'UPDATE';
    case 'DELETE': return 'DELETE';
    case 'GET': return 'READ';
    default: return 'OTHER';
  }
};

const getEntityTypeFromPath = (path) => {
  // Handle both full paths and relative paths
  // Also handle paths that are just an ID (like /1, /2, etc.)
  if (path.includes('/employees') || (path.startsWith('/') && !path.includes('/')) || /^\/\d+$/.test(path)) return 'EMPLOYEE';
  if (path.includes('/leaves')) return 'LEAVE';
  if (path.includes('/loans')) return 'LOAN';
  if (path.includes('/payroll')) return 'PAYROLL';
  if (path.includes('/attendance')) return 'ATTENDANCE';
  if (path.includes('/timesheets')) return 'TIMESHEET';
  if (path.includes('/advances')) return 'ADVANCE';
  if (path.includes('/deductions')) return 'DEDUCTION';
  if (path.includes('/resignations')) return 'RESIGNATION';
  if (path.includes('/users')) return 'USER';
  if (path.includes('/leave-resumptions')) return 'LEAVE_RESUMPTION';
  return 'GENERAL';
};

const shouldSkipLogging = (path, method) => {
  // Only log for non-GET requests to reduce spam
  if (method !== 'GET') {
    console.log('🔍 shouldSkipLogging called for path:', path, 'method:', method);
  }
  
  // Skip logging for certain endpoints
  const skipPaths = [
    '/health',
    '/api/auth/login',
    '/api/auth/logout',
    '/api/activities',
    '/uploads',
    '/api/employees/dropdown/list',
    '/api/employees/test-auth',
    '/api/employees/test-validation',
    '/api/settings/dropdown',
    '/api/settings/currency-config',
    '/api/calendars/dropdown',
    '/api/shifts/dropdown',
    '/api/advances/dropdown',
    '/api/loans/dropdown',
    '/api/leaves/dropdown',
    '/api/employees/dashboard/stats'
  ];
  
  // Skip GET requests (read operations)
  if (method === 'GET') {
    return true;
  }
  
  // Skip any path that contains 'dropdown' - CRITICAL FIX
  if (path.includes('dropdown')) {
    return true;
  }
  
     // Skip certain employee endpoints that might cause duplicates
   // Handle both full paths (/api/employees/...) and relative paths (/...)
   // Also handle paths that are just an ID (like /1, /2, etc.)
   if ((path.includes('/api/employees') || (path.startsWith('/') && !path.includes('/')) || /^\/\d+$/.test(path)) && (
    path.includes('/avatar') || 
    path.includes('/document') || 
    path.includes('/status') ||
    path.includes('/dropdown') ||
    path.includes('/dashboard') ||
    path.includes('/test-')
  )) {
    console.log('🔍 shouldSkipLogging: Skipping employee endpoint with special path');
    return true;
  }
  
  // Skip settings dropdown endpoints
  if (path.includes('/api/settings') && path.includes('/dropdown')) {
    console.log('🔍 shouldSkipLogging: Skipping settings dropdown');
    return true;
  }
  
  // Skip any path that contains 'test-'
  if (path.includes('test-')) {
    console.log('🔍 shouldSkipLogging: Skipping test path');
    return true;
  }
  
  const shouldSkip = skipPaths.some(skipPath => path.includes(skipPath));
  if (shouldSkip) {
    console.log('🔍 shouldSkipLogging: Skipping due to skipPaths match');
  } else {
    console.log('🔍 shouldSkipLogging: NOT skipping - will log activity');
  }
  
  return shouldSkip;
};

const createActivityDescription = (method, path, body, responseData, user, oldData) => {
  const userName = `${user.firstName} ${user.lastName}`;
  
  // Get entity name for better description
  let entityName = '';
  if (responseData.data) {
    if (responseData.data.FIRST_NAME && responseData.data.LAST_NAME) {
      entityName = `${responseData.data.FIRST_NAME} ${responseData.data.LAST_NAME}`;
    } else if (responseData.data.EMPLOYEE_FIRST_NAME && responseData.data.EMPLOYEE_LAST_NAME) {
      entityName = `${responseData.data.EMPLOYEE_FIRST_NAME} ${responseData.data.EMPLOYEE_LAST_NAME}`;
    }
  }
  
  // Create specific descriptions based on the actual changes
  const createSpecificDescription = (module, oldValues, newValues) => {
    const changeList = [];
    
    console.log('🔍 Creating specific description for module:', module);
    console.log('🔍 Old values:', oldValues);
    console.log('🔍 New values:', newValues);
    
    // Compare old and new values to determine actual changes
    if (oldValues && newValues) {
      // Normalize field names for comparison
      const normalizeFieldName = (fieldName) => {
        const fieldMappings = {
          'FIRST_NAME': 'firstName',
          'LAST_NAME': 'lastName',
          'LEGAL_NAME': 'legalName',
          'GENDER': 'gender',
          'NATIONALITY': 'nationality',
          'DATE_OF_BIRTH': 'dateOfBirth',
          'BIRTH_PLACE': 'birthPlace',
          'AVATAR_URL': 'avatarUrl',
          'REPORT_TO_ID': 'reportToId',
          'DESIGNATION': 'designation',
          'ROLE': 'role',
          'POSITION': 'position',
          'LOCATION': 'location',
          'COST_CENTER': 'costCenter',
          'DATE_OF_JOINING': 'dateOfJoining',
          'PROBATION_DAYS': 'probationDays',
          'CONFIRM_DATE': 'confirmDate',
          'NOTICE_DAYS': 'noticeDays',
          'ADDRESS': 'address',
          'PINCODE': 'pincode',
          'CITY': 'city',
          'DISTRICT': 'district',
          'STATE': 'state',
          'COUNTRY': 'country',
          'PHONE': 'phone',
          'MOBILE': 'mobile',
          'EMAIL': 'email',
          'FATHER_NAME': 'fatherName',
          'MARITAL_STATUS': 'maritalStatus',
          'SPOUSE_NAME': 'spouseName',
          'RELIGION': 'religion',
          'AADHAR_NUMBER': 'aadharNumber',
          'AADHAR_IMAGE_URL': 'aadharImageUrl',
          'PAN_NUMBER': 'panNumber',
          'PAN_IMAGE_URL': 'panImageUrl',
          'DRIVING_LICENSE_NUMBER': 'drivingLicenseNumber',
          'DRIVING_LICENSE_IMAGE_URL': 'drivingLicenseImageUrl',
          'EDUCATION_CERTIFICATE_NUMBER': 'educationCertificateNumber',
          'EDUCATION_CERTIFICATE_IMAGE_URL': 'educationCertificateImageUrl',
          'BANK_NAME': 'bankName',
          'BRANCH_NAME': 'branchName',
          'IFSC_CODE': 'ifscCode',
          'ACCOUNT_NUMBER': 'accountNumber',
          'UAN_NUMBER': 'uanNumber',
          'PF_NUMBER': 'pfNumber',
          'ESI_NUMBER': 'esiNumber',
          'CALENDAR_ID': 'calendarId',
          'SHIFT_ID': 'shiftId',
          'PAY_GRADE_ID': 'payGradeId',
          'STATUS': 'status',
          'EMPLOYEE_ID': 'employeeId',
          'EMPLOYEE_CODE': 'employeeCode',
          
          // Advance field mappings
          'ADVANCE_ID': 'advanceId',
          'ADVANCE_TYPE': 'advanceType',
          'REQUEST_DATE': 'requestDate',
          'AMOUNT_REQUIRED_ON_DATE': 'amountRequiredOnDate',
          'DEDUCTION_MONTH': 'deductionMonth',
          'CREATED_BY': 'createdBy',
          'CREATED_AT': 'createdAt',
          'UPDATED_AT': 'updatedAt',
          
          // Loan field mappings
          'LOAN_ID': 'loanId',
          'LOAN_TYPE': 'loanType',
          'INTEREST_RATE': 'interestRate',
          'REPAYMENT_PERIOD': 'repaymentPeriod',
          'LOAN_DATE': 'loanDate',
          'APPROVAL_DATE': 'approvalDate',
          'DISBURSEMENT_DATE': 'disbursementDate'
        };
        return fieldMappings[fieldName] || fieldName;
      };
      
      // Create normalized versions for comparison
      const normalizedOld = {};
      const normalizedNew = {};
      
      Object.keys(oldValues).forEach(key => {
        const normalizedKey = normalizeFieldName(key);
        normalizedOld[normalizedKey] = oldValues[key];
      });
      
      Object.keys(newValues).forEach(key => {
        const normalizedKey = normalizeFieldName(key);
        normalizedNew[normalizedKey] = newValues[key];
      });
      
      console.log('🔍 Normalized old:', normalizedOld);
      console.log('🔍 Normalized new:', normalizedNew);
      
      // Check for actual changes
      if (normalizedOld.firstName !== normalizedNew.firstName) changeList.push('name');
      if (normalizedOld.lastName !== normalizedNew.lastName) changeList.push('name');
      if (normalizedOld.email !== normalizedNew.email) changeList.push('email');
      if (normalizedOld.phone !== normalizedNew.phone) changeList.push('phone');
      if (normalizedOld.status !== normalizedNew.status) changeList.push('status');
      if (normalizedOld.legalName !== normalizedNew.legalName) changeList.push('legal name');
      if (normalizedOld.gender !== normalizedNew.gender) changeList.push('gender');
      if (normalizedOld.nationality !== normalizedNew.nationality) changeList.push('nationality');
      
      // Handle date comparisons properly
      const normalizeDateForComparison = (dateStr) => {
        if (!dateStr) return null;
        try {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return String(dateStr);
          return date.toISOString().split('T')[0];
        } catch {
          return String(dateStr);
        }
      };
      
      const oldDateOfBirth = normalizeDateForComparison(normalizedOld.dateOfBirth);
      const newDateOfBirth = normalizeDateForComparison(normalizedNew.dateOfBirth);
      if (oldDateOfBirth !== newDateOfBirth) changeList.push('date of birth');
      
      const oldDateOfJoining = normalizeDateForComparison(normalizedOld.dateOfJoining);
      const newDateOfJoining = normalizeDateForComparison(normalizedNew.dateOfJoining);
      if (oldDateOfJoining !== newDateOfJoining) changeList.push('date of joining');
      
      const oldConfirmDate = normalizeDateForComparison(normalizedOld.confirmDate);
      const newConfirmDate = normalizeDateForComparison(normalizedNew.confirmDate);
      if (oldConfirmDate !== newConfirmDate) changeList.push('confirm date');
      
      if (normalizedOld.position !== normalizedNew.position) changeList.push('position');
      if (normalizedOld.role !== normalizedNew.role) changeList.push('role');
      if (normalizedOld.designation !== normalizedNew.designation) changeList.push('designation');
      if (normalizedOld.location !== normalizedNew.location) changeList.push('location');
      if (normalizedOld.address !== normalizedNew.address) changeList.push('address');
      if (normalizedOld.mobile !== normalizedNew.mobile) changeList.push('mobile');
       
             // Handle advance-specific comparisons
      if (module === 'ADVANCE') {
        console.log('🔍 ADVANCE DEBUG: Processing advance-specific comparisons');
        console.log('🔍 ADVANCE DEBUG: Normalized old keys:', Object.keys(normalizedOld));
        console.log('🔍 ADVANCE DEBUG: Normalized new keys:', Object.keys(normalizedNew));
        
        if (normalizedOld.advanceType !== normalizedNew.advanceType) {
          console.log('🔍 ADVANCE DEBUG: advanceType changed from', normalizedOld.advanceType, 'to', normalizedNew.advanceType);
          changeList.push('advance type');
        }
        if (normalizedOld.amount !== normalizedNew.amount) {
          console.log('🔍 ADVANCE DEBUG: amount changed from', normalizedOld.amount, 'to', normalizedNew.amount);
          changeList.push('amount');
        }
        if (normalizedOld.reason !== normalizedNew.reason) {
          console.log('🔍 ADVANCE DEBUG: reason changed from', normalizedOld.reason, 'to', normalizedNew.reason);
          changeList.push('reason');
        }
        if (normalizedOld.status !== normalizedNew.status) {
          console.log('🔍 ADVANCE DEBUG: status changed from', normalizedOld.status, 'to', normalizedNew.status);
          changeList.push('status');
        }
        
        // Handle advance date comparisons
        const oldRequestDate = normalizeDateForComparison(normalizedOld.requestDate);
        const newRequestDate = normalizeDateForComparison(normalizedNew.requestDate);
        if (oldRequestDate !== newRequestDate) {
          console.log('🔍 ADVANCE DEBUG: requestDate changed from', oldRequestDate, 'to', newRequestDate);
          changeList.push('request date');
        }
        
        const oldAmountRequiredDate = normalizeDateForComparison(normalizedOld.amountRequiredOnDate);
        const newAmountRequiredDate = normalizeDateForComparison(normalizedNew.amountRequiredOnDate);
        if (oldAmountRequiredDate !== newAmountRequiredDate) {
          console.log('🔍 ADVANCE DEBUG: amountRequiredOnDate changed from', oldAmountRequiredDate, 'to', newAmountRequiredDate);
          changeList.push('amount required date');
        }
        
        if (normalizedOld.deductionMonth !== normalizedNew.deductionMonth) {
          console.log('🔍 ADVANCE DEBUG: deductionMonth changed from', normalizedOld.deductionMonth, 'to', normalizedNew.deductionMonth);
          changeList.push('deduction month');
        }
        
        console.log('🔍 ADVANCE DEBUG: Final change list:', changeList);
      }
       
             // Handle loan-specific comparisons
      if (module === 'LOAN') {
        if (normalizedOld.loanType !== normalizedNew.loanType) changeList.push('loan type');
        if (normalizedOld.amount !== normalizedNew.amount) changeList.push('amount');
        if (normalizedOld.reason !== normalizedNew.reason) changeList.push('reason');
        if (normalizedOld.status !== normalizedNew.status) changeList.push('status');
        if (normalizedOld.interestRate !== normalizedNew.interestRate) changeList.push('interest rate');
        if (normalizedOld.repaymentPeriod !== normalizedNew.repaymentPeriod) changeList.push('repayment period');
        
        // Handle loan date comparisons
        const oldLoanDate = normalizeDateForComparison(normalizedOld.loanDate);
        const newLoanDate = normalizeDateForComparison(normalizedNew.loanDate);
        if (oldLoanDate !== newLoanDate) changeList.push('loan date');
        
        const oldApprovalDate = normalizeDateForComparison(normalizedOld.approvalDate);
        const newApprovalDate = normalizeDateForComparison(normalizedNew.approvalDate);
        if (oldApprovalDate !== newApprovalDate) changeList.push('approval date');
        
        const oldDisbursementDate = normalizeDateForComparison(normalizedOld.disbursementDate);
        const newDisbursementDate = normalizeDateForComparison(normalizedNew.disbursementDate);
        if (oldDisbursementDate !== newDisbursementDate) changeList.push('disbursement date');
      }
    }
    
    console.log('🔍 Actual changes detected:', changeList);
    
    if (changeList.length > 0) {
      // Remove duplicates (e.g., if both firstName and lastName changed, "name" appears once)
      const uniqueChanges = [...new Set(changeList)];
      const changeText = uniqueChanges.join(', ');
      const description = `${userName} updated ${changeText} for ${entityName || module.toLowerCase()}`;
      console.log('🔍 Generated description:', description);
      return description;
    }
    
    const fallbackDescription = `${userName} updated ${module.toLowerCase()} information for ${entityName || 'record'}`;
    console.log('🔍 Using fallback description:', fallbackDescription);
    return fallbackDescription;
  };
  
  switch (method) {
         case 'POST':
       if (path.includes('/employees') || (path.startsWith('/') && !path.includes('/')) || /^\/\d+$/.test(path)) {
        return entityName ? 
          `${userName} created a new employee: ${entityName}` :
          `${userName} created a new employee`;
      } else if (path.includes('/leaves')) {
        return entityName ? 
          `${userName} submitted a leave request for ${entityName}` :
          `${userName} submitted a leave request`;
      } else if (path.includes('/loans')) {
        return entityName ? 
          `${userName} created a new loan application for ${entityName}` :
          `${userName} created a new loan application`;
      } else if (path.includes('/advances')) {
        return entityName ? 
          `${userName} created a new advance request for ${entityName}` :
          `${userName} created a new advance request`;
      } else if (path.includes('/deductions')) {
        return entityName ? 
          `${userName} created a new deduction for ${entityName}` :
          `${userName} created a new deduction`;
      } else if (path.includes('/resignations')) {
        return entityName ? 
          `${userName} submitted a resignation for ${entityName}` :
          `${userName} submitted a resignation`;
      } else if (path.includes('/payroll')) {
        return `${userName} processed payroll`;
      } else if (path.includes('/leave-resumptions')) {
        return entityName ? 
          `${userName} submitted a leave resumption for ${entityName}` :
          `${userName} submitted a leave resumption`;
      }
      return `${userName} created a new record`;
      
         case 'PUT':
     case 'PATCH':
       if (path.includes('/employees') || (path.startsWith('/') && !path.includes('/')) || /^\/\d+$/.test(path)) {
        return createSpecificDescription('employee', oldData, body);
      } else if (path.includes('/leaves')) {
        if (body.status === 'APPROVED') {
          return entityName ? 
            `${userName} approved a leave request for ${entityName}` :
            `${userName} approved a leave request`;
        } else if (body.status === 'REJECTED') {
          return entityName ? 
            `${userName} rejected a leave request for ${entityName}` :
            `${userName} rejected a leave request`;
        }
        return createSpecificDescription('leave', oldData, body);
      } else if (path.includes('/loans')) {
        return createSpecificDescription('loan', oldData, body);
      } else if (path.includes('/advances')) {
        if (body.status === 'APPROVED') {
          return entityName ? 
            `${userName} approved an advance request for ${entityName}` :
            `${userName} approved an advance request`;
        } else if (body.status === 'REJECTED') {
          return entityName ? 
            `${userName} rejected an advance request for ${entityName}` :
            `${userName} rejected an advance request`;
        }
        return createSpecificDescription('advance', oldData, body);
      } else if (path.includes('/deductions')) {
        return createSpecificDescription('deduction', oldData, body);
      } else if (path.includes('/resignations')) {
        if (body.status === 'APPROVED') {
          return entityName ? 
            `${userName} approved a resignation for ${entityName}` :
            `${userName} approved a resignation`;
        } else if (body.status === 'REJECTED') {
          return entityName ? 
            `${userName} rejected a resignation for ${entityName}` :
            `${userName} rejected a resignation`;
        }
        return createSpecificDescription('resignation', oldData, body);
      } else if (path.includes('/payroll')) {
        if (body.status === 'APPROVED') {
          return `${userName} approved payroll processing`;
        } else if (body.status === 'REJECTED') {
          return `${userName} rejected payroll processing`;
        }
        return `${userName} updated payroll information`;
      } else if (path.includes('/leave-resumptions')) {
        if (body.status === 'APPROVED') {
          return entityName ? 
            `${userName} approved a leave resumption for ${entityName}` :
            `${userName} approved a leave resumption`;
        } else if (body.status === 'REJECTED') {
          return entityName ? 
            `${userName} rejected a leave resumption for ${entityName}` :
            `${userName} rejected a leave resumption`;
        }
        return createSpecificDescription('leave resumption', oldData, body);
      }
      return entityName ? 
        `${userName} updated information for ${entityName}` :
        `${userName} updated a record`;
      
         case 'DELETE':
       if (path.includes('/employees') || (path.startsWith('/') && !path.includes('/')) || /^\/\d+$/.test(path)) {
        return entityName ? 
          `${userName} deleted employee: ${entityName}` :
          `${userName} deleted an employee`;
      } else if (path.includes('/leaves')) {
        return entityName ? 
          `${userName} deleted a leave request for ${entityName}` :
          `${userName} deleted a leave request`;
      } else if (path.includes('/loans')) {
        return entityName ? 
          `${userName} deleted a loan application for ${entityName}` :
          `${userName} deleted a loan application`;
      } else if (path.includes('/advances')) {
        return entityName ? 
          `${userName} deleted an advance request for ${entityName}` :
          `${userName} deleted an advance request`;
      } else if (path.includes('/deductions')) {
        return entityName ? 
          `${userName} deleted a deduction for ${entityName}` :
          `${userName} deleted a deduction`;
      } else if (path.includes('/resignations')) {
        return entityName ? 
          `${userName} deleted a resignation for ${entityName}` :
          `${userName} deleted a resignation`;
      } else if (path.includes('/payroll')) {
        return `${userName} deleted payroll record`;
      } else if (path.includes('/leave-resumptions')) {
        return entityName ? 
          `${userName} deleted a leave resumption for ${entityName}` :
          `${userName} deleted a leave resumption`;
      }
      return entityName ? 
        `${userName} deleted record for ${entityName}` :
        `${userName} deleted a record`;
      
    default:
      return `${userName} performed an action`;
  }
};

const getEntityNameFromResponse = (responseData, entityType) => {
  if (responseData.data) {
    if (entityType === 'EMPLOYEE' && responseData.data.FIRST_NAME) {
      return `${responseData.data.FIRST_NAME} ${responseData.data.LAST_NAME}`;
    } else if (entityType === 'LEAVE' && responseData.data.EMPLOYEE_FIRST_NAME) {
      return `${responseData.data.EMPLOYEE_FIRST_NAME} ${responseData.data.EMPLOYEE_LAST_NAME}`;
    } else if (entityType === 'ADVANCE' && responseData.data.EMPLOYEE_FIRST_NAME) {
      return `${responseData.data.EMPLOYEE_FIRST_NAME} ${responseData.data.EMPLOYEE_LAST_NAME}`;
    } else if (entityType === 'LOAN' && responseData.data.EMPLOYEE_FIRST_NAME) {
      return `${responseData.data.EMPLOYEE_FIRST_NAME} ${responseData.data.EMPLOYEE_LAST_NAME}`;
    } else if (entityType === 'DEDUCTION' && responseData.data.EMPLOYEE_FIRST_NAME) {
      return `${responseData.data.EMPLOYEE_FIRST_NAME} ${responseData.data.EMPLOYEE_LAST_NAME}`;
    } else if (entityType === 'RESIGNATION' && responseData.data.EMPLOYEE_FIRST_NAME) {
      return `${responseData.data.EMPLOYEE_FIRST_NAME} ${responseData.data.EMPLOYEE_LAST_NAME}`;
    } else if (entityType === 'LEAVE_RESUMPTION' && responseData.data.EMPLOYEE_FIRST_NAME) {
      return `${responseData.data.EMPLOYEE_FIRST_NAME} ${responseData.data.EMPLOYEE_LAST_NAME}`;
    }
  }
  return null;
};

module.exports = { logActivity }; 
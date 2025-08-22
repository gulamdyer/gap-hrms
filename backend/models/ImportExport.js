const { executeQuery } = require('../config/database');
const Employee = require('./Employee');

class ImportExport {
  // Get all available entities for import/export
  static async getAvailableEntities() {
    return [
      {
        id: 'employees',
        name: 'Employees',
        table: 'HRMS_EMPLOYEES',
        description: 'Employee master records for onboarding',
        fields: [
          { name: 'FIRST_NAME', type: 'VARCHAR2', required: true, description: 'First name' },
          { name: 'LAST_NAME', type: 'VARCHAR2', required: true, description: 'Last name' },
          { name: 'LEGAL_NAME', type: 'VARCHAR2', required: false, description: 'Legal name' },
          { name: 'GENDER', type: 'VARCHAR2', required: false, description: 'MALE/FEMALE/OTHER' },
          { name: 'NATIONALITY', type: 'VARCHAR2', required: false, description: 'Nationality' },
          { name: 'DATE_OF_BIRTH', type: 'DATE', required: false, description: 'DD-MM-YYYY' },
          { name: 'BIRTH_PLACE', type: 'VARCHAR2', required: false, description: 'Birth place' },
          { name: 'AVATAR_URL', type: 'VARCHAR2', required: false, description: 'Avatar image URL' },
          { name: 'REPORT_TO_ID', type: 'NUMBER', required: false, description: 'Manager EMPLOYEE_ID' },
          { name: 'DESIGNATION', type: 'VARCHAR2', required: false, description: 'Designation' },
          { name: 'ROLE', type: 'VARCHAR2', required: false, description: 'Role' },
          { name: 'POSITION', type: 'VARCHAR2', required: false, description: 'Position' },
          { name: 'LOCATION', type: 'VARCHAR2', required: false, description: 'Location' },
          { name: 'COST_CENTER', type: 'VARCHAR2', required: false, description: 'Cost center' },
          { name: 'DEPARTMENT', type: 'VARCHAR2', required: false, description: 'Department name' },
          { name: 'WORKCENTER', type: 'VARCHAR2', required: false, description: 'Workcenter/Section name' },
          { name: 'EMPLOYMENT_TYPE', type: 'VARCHAR2', required: false, description: 'Employment type name' },
          { name: 'CALENDAR_ID', type: 'NUMBER', required: false, description: 'Calendar ID' },
          { name: 'SHIFT_ID', type: 'NUMBER', required: false, description: 'Shift ID' },
          { name: 'PAY_GRADE_ID', type: 'NUMBER', required: false, description: 'Pay grade ID' },
          { name: 'DATE_OF_JOINING', type: 'DATE', required: false, description: 'DD-MM-YYYY' },
          { name: 'PROBATION_DAYS', type: 'NUMBER', required: false, description: 'Probation days (default 90)' },
          { name: 'CONFIRM_DATE', type: 'DATE', required: false, description: 'DD-MM-YYYY' },
          { name: 'NOTICE_DAYS', type: 'NUMBER', required: false, description: 'Notice days (default 30)' },
          { name: 'ADDRESS', type: 'VARCHAR2', required: false, description: 'Address (max 500 chars)' },
          { name: 'PINCODE', type: 'VARCHAR2', required: false, description: 'Postal code' },
          { name: 'CITY', type: 'VARCHAR2', required: false, description: 'City' },
          { name: 'DISTRICT', type: 'VARCHAR2', required: false, description: 'District' },
          { name: 'STATE', type: 'VARCHAR2', required: false, description: 'State' },
          { name: 'COUNTRY', type: 'VARCHAR2', required: false, description: 'Country' },
          { name: 'PHONE', type: 'VARCHAR2', required: false, description: 'Phone' },
          { name: 'MOBILE', type: 'VARCHAR2', required: false, description: 'Mobile' },
          { name: 'EMAIL', type: 'VARCHAR2', required: false, description: 'Email' },
          { name: 'FATHER_NAME', type: 'VARCHAR2', required: false, description: "Father's name" },
          { name: 'MARITAL_STATUS', type: 'VARCHAR2', required: false, description: 'SINGLE/MARRIED/DIVORCED/WIDOWED' },
          { name: 'SPOUSE_NAME', type: 'VARCHAR2', required: false, description: 'Spouse name' },
          { name: 'RELIGION', type: 'VARCHAR2', required: false, description: 'Religion' },
          { name: 'AADHAR_NUMBER', type: 'VARCHAR2', required: false, description: 'Aadhar number' },
          { name: 'AADHAR_IMAGE_URL', type: 'VARCHAR2', required: false, description: 'Aadhar image URL' },
          { name: 'PAN_NUMBER', type: 'VARCHAR2', required: false, description: 'PAN number' },
          { name: 'PAN_IMAGE_URL', type: 'VARCHAR2', required: false, description: 'PAN image URL' },
          { name: 'DRIVING_LICENSE_NUMBER', type: 'VARCHAR2', required: false, description: 'DL number' },
          { name: 'DRIVING_LICENSE_IMAGE_URL', type: 'VARCHAR2', required: false, description: 'DL image URL' },
          { name: 'EDUCATION_CERTIFICATE_NUMBER', type: 'VARCHAR2', required: false, description: 'Education certificate number' },
          { name: 'EDUCATION_CERTIFICATE_IMAGE_URL', type: 'VARCHAR2', required: false, description: 'Education certificate image URL' },
          { name: 'BANK_NAME', type: 'VARCHAR2', required: false, description: 'Bank name' },
          { name: 'BRANCH_NAME', type: 'VARCHAR2', required: false, description: 'Branch name' },
          { name: 'IFSC_CODE', type: 'VARCHAR2', required: false, description: 'IFSC code' },
          { name: 'ACCOUNT_NUMBER', type: 'VARCHAR2', required: false, description: 'Account number' },
          { name: 'UAN_NUMBER', type: 'VARCHAR2', required: false, description: 'UAN' },
          { name: 'PF_NUMBER', type: 'VARCHAR2', required: false, description: 'PF' },
          { name: 'ESI_NUMBER', type: 'VARCHAR2', required: false, description: 'ESI' },
          // STATUS is optional; defaults to ACTIVE/ONBOARDING in the table definition
          { name: 'STATUS', type: 'VARCHAR2', required: false, description: 'Status (ACTIVE/INACTIVE/ONBOARDING)' }
        ]
      },
      {
        id: 'designations',
        name: 'Designations',
        table: 'HRMS_DESIGNATIONS',
        description: 'Employee job designations and titles',
        fields: [
          { name: 'DESIGNATION_ID', type: 'NUMBER', required: false, description: 'Auto-generated ID' },
          { name: 'DESIGNATION_NAME', type: 'VARCHAR2', required: true, description: 'Designation name' },
          { name: 'DESCRIPTION', type: 'VARCHAR2', required: false, description: 'Description' },
          { name: 'STATUS', type: 'VARCHAR2', required: true, description: 'Status (ACTIVE/INACTIVE)' }
        ]
      },
      {
        id: 'roles',
        name: 'Roles',
        table: 'HRMS_ROLES',
        description: 'User roles for access control',
        fields: [
          { name: 'ROLE_ID', type: 'NUMBER', required: false, description: 'Auto-generated ID' },
          { name: 'ROLE_NAME', type: 'VARCHAR2', required: true, description: 'Role name' },
          { name: 'DESCRIPTION', type: 'VARCHAR2', required: false, description: 'Description' },
          { name: 'STATUS', type: 'VARCHAR2', required: true, description: 'Status (ACTIVE/INACTIVE)' }
        ]
      },
      {
        id: 'positions',
        name: 'Positions',
        table: 'HRMS_POSITIONS',
        description: 'Job positions and roles',
        fields: [
          { name: 'POSITION_ID', type: 'NUMBER', required: false, description: 'Auto-generated ID' },
          { name: 'POSITION_NAME', type: 'VARCHAR2', required: true, description: 'Position name' },
          { name: 'DESCRIPTION', type: 'VARCHAR2', required: false, description: 'Description' },
          { name: 'STATUS', type: 'VARCHAR2', required: true, description: 'Status (ACTIVE/INACTIVE)' }
        ]
      },
      {
        id: 'departments',
        name: 'Departments',
        table: 'HRMS_DEPARTMENTS',
        description: 'Company departments',
        fields: [
          { name: 'DEPARTMENT_ID', type: 'NUMBER', required: false, description: 'Auto-generated ID' },
          { name: 'DEPARTMENT_NAME', type: 'VARCHAR2', required: true, description: 'Department name' },
          { name: 'DESCRIPTION', type: 'VARCHAR2', required: false, description: 'Description' },
          { name: 'STATUS', type: 'VARCHAR2', required: true, description: 'Status (ACTIVE/INACTIVE)' }
        ]
      },
      {
        id: 'workcenters',
        name: 'Workcenters',
        table: 'HRMS_WORKCENTERS',
        description: 'Sections / Workcenters',
        fields: [
          { name: 'WORKCENTER_ID', type: 'NUMBER', required: false, description: 'Auto-generated ID' },
          { name: 'WORKCENTER_NAME', type: 'VARCHAR2', required: true, description: 'Workcenter name' },
          { name: 'DESCRIPTION', type: 'VARCHAR2', required: false, description: 'Description' },
          { name: 'STATUS', type: 'VARCHAR2', required: true, description: 'Status (ACTIVE/INACTIVE)' }
        ]
      },
      {
        id: 'employment_types',
        name: 'Employment Types',
        table: 'HRMS_EMPLOYMENT_TYPES',
        description: 'Employment types (e.g., Permanent, Contract)',
        fields: [
          { name: 'EMPLOYMENT_TYPE_ID', type: 'NUMBER', required: false, description: 'Auto-generated ID' },
          { name: 'EMPLOYMENT_TYPE_NAME', type: 'VARCHAR2', required: true, description: 'Employment type name' },
          { name: 'DESCRIPTION', type: 'VARCHAR2', required: false, description: 'Description' },
          { name: 'STATUS', type: 'VARCHAR2', required: true, description: 'Status (ACTIVE/INACTIVE)' }
        ]
      },

      {
        id: 'locations',
        name: 'Locations',
        table: 'HRMS_LOCATIONS',
        description: 'Office locations and branches',
        fields: [
          { name: 'LOCATION_ID', type: 'NUMBER', required: false, description: 'Auto-generated ID' },
          { name: 'LOCATION_NAME', type: 'VARCHAR2', required: true, description: 'Location name' },
          { name: 'ADDRESS', type: 'VARCHAR2', required: false, description: 'Address' },
          { name: 'CITY', type: 'VARCHAR2', required: false, description: 'City' },
          { name: 'STATE', type: 'VARCHAR2', required: false, description: 'State' },
          { name: 'COUNTRY', type: 'VARCHAR2', required: false, description: 'Country' },
          { name: 'PINCODE', type: 'VARCHAR2', required: false, description: 'Postal code' },
          { name: 'STATUS', type: 'VARCHAR2', required: true, description: 'Status (ACTIVE/INACTIVE)' }
        ]
      },
      {
        id: 'pay_grades',
        name: 'Pay Grades',
        table: 'HRMS_PAY_GRADES',
        description: 'Employee pay grades and levels',
        fields: [
          { name: 'PAY_GRADE_ID', type: 'NUMBER', required: false, description: 'Auto-generated ID' },
          { name: 'GRADE_NAME', type: 'VARCHAR2', required: true, description: 'Grade name' },
          { name: 'MIN_SALARY', type: 'NUMBER', required: false, description: 'Minimum salary' },
          { name: 'MAX_SALARY', type: 'NUMBER', required: false, description: 'Maximum salary' },
          { name: 'DESCRIPTION', type: 'VARCHAR2', required: false, description: 'Description' },
          { name: 'STATUS', type: 'VARCHAR2', required: true, description: 'Status (ACTIVE/INACTIVE)' }
        ]
      },
      {
        id: 'pay_components',
        name: 'Pay Components',
        table: 'HRMS_PAY_COMPONENTS',
        description: 'Salary components and allowances',
        fields: [
          { name: 'COMPONENT_ID', type: 'NUMBER', required: false, description: 'Auto-generated ID' },
          { name: 'COMPONENT_NAME', type: 'VARCHAR2', required: true, description: 'Component name' },
          { name: 'COMPONENT_TYPE', type: 'VARCHAR2', required: true, description: 'Type (EARNING/DEDUCTION)' },
          { name: 'DESCRIPTION', type: 'VARCHAR2', required: false, description: 'Description' },
          { name: 'STATUS', type: 'VARCHAR2', required: true, description: 'Status (ACTIVE/INACTIVE)' }
        ]
      },
      {
        id: 'shifts',
        name: 'Shifts',
        table: 'HRMS_SHIFTS',
        description: 'Work shifts and schedules',
        fields: [
          { name: 'SHIFT_ID', type: 'NUMBER', required: false, description: 'Auto-generated ID' },
          { name: 'SHIFT_NAME', type: 'VARCHAR2', required: true, description: 'Shift name' },
          { name: 'START_TIME', type: 'VARCHAR2', required: true, description: 'Start time (HH:MM)' },
          { name: 'END_TIME', type: 'VARCHAR2', required: true, description: 'End time (HH:MM)' },
          { name: 'DESCRIPTION', type: 'VARCHAR2', required: false, description: 'Description' },
          { name: 'STATUS', type: 'VARCHAR2', required: true, description: 'Status (ACTIVE/INACTIVE)' }
        ]
      },
      {
        id: 'leave_policies',
        name: 'Leave Policies',
        table: 'HRMS_LEAVE_POLICIES',
        description: 'Employee leave policies',
        fields: [
          { name: 'POLICY_ID', type: 'NUMBER', required: false, description: 'Auto-generated ID' },
          { name: 'POLICY_NAME', type: 'VARCHAR2', required: true, description: 'Policy name' },
          { name: 'LEAVE_TYPE', type: 'VARCHAR2', required: true, description: 'Leave type' },
          { name: 'DAYS_ALLOWED', type: 'NUMBER', required: true, description: 'Days allowed per year' },
          { name: 'DESCRIPTION', type: 'VARCHAR2', required: false, description: 'Description' },
          { name: 'STATUS', type: 'VARCHAR2', required: true, description: 'Status (ACTIVE/INACTIVE)' }
        ]
      },
      {
        id: 'cost_centers',
        name: 'Cost Centers',
        table: 'HRMS_COST_CENTERS',
        description: 'Cost centers and departments',
        fields: [
          { name: 'COST_CENTER_ID', type: 'NUMBER', required: false, description: 'Auto-generated ID' },
          { name: 'COST_CENTER_NAME', type: 'VARCHAR2', required: true, description: 'Cost center name' },
          { name: 'COST_CENTER_CODE', type: 'VARCHAR2', required: false, description: 'Cost center code' },
          { name: 'DESCRIPTION', type: 'VARCHAR2', required: false, description: 'Description' },
          { name: 'STATUS', type: 'VARCHAR2', required: true, description: 'Status (ACTIVE/INACTIVE)' }
        ]
      },
      {
        id: 'projects',
        name: 'Projects',
        table: 'HRMS_PROJECTS',
        description: 'Company projects',
        fields: [
          { name: 'PROJECT_ID', type: 'NUMBER', required: false, description: 'Auto-generated ID' },
          { name: 'PROJECT_CODE', type: 'VARCHAR2', required: true, description: 'Project code' },
          { name: 'PROJECT_NAME', type: 'VARCHAR2', required: true, description: 'Project name' },
          { name: 'DESCRIPTION', type: 'VARCHAR2', required: false, description: 'Description' },
          { name: 'CLIENT_NAME', type: 'VARCHAR2', required: false, description: 'Client name' },
          { name: 'PROJECT_MANAGER', type: 'NUMBER', required: false, description: 'Project manager employee ID' },
          { name: 'START_DATE', type: 'DATE', required: false, description: 'Start date (DD-MM-YYYY)' },
          { name: 'END_DATE', type: 'DATE', required: false, description: 'End date (DD-MM-YYYY)' },
          { name: 'STATUS', type: 'VARCHAR2', required: true, description: 'Status (ACTIVE/INACTIVE/COMPLETED/CANCELLED)' },
          { name: 'IS_BILLABLE', type: 'NUMBER', required: false, description: 'Billable (1/0)' },
          { name: 'HOURLY_RATE', type: 'NUMBER', required: false, description: 'Hourly rate' },
          { name: 'BUDGET_HOURS', type: 'NUMBER', required: false, description: 'Budget hours' }
        ]
      },
      {
        id: 'employee_compensation',
        name: 'Employee Compensation',
        table: 'HRMS_EMPLOYEE_COMPENSATION',
        description: 'Employee compensation records (multiple per employee)',
        fields: [
          { name: 'COMPENSATION_ID', type: 'NUMBER', required: false, description: 'Auto-generated ID' },
          { name: 'EMPLOYEE_CODE', type: 'VARCHAR2', required: true, description: 'Employee code to link to employee' },
          { name: 'PAY_COMPONENT_ID', type: 'NUMBER', required: true, description: 'Pay component ID' },
          { name: 'AMOUNT', type: 'NUMBER', required: false, description: 'Amount (if not percentage)' },
          { name: 'PERCENTAGE', type: 'NUMBER', required: false, description: 'Percentage (if not amount)' },
                     { name: 'IS_PERCENTAGE', type: 'NUMBER', required: false, description: '1 for percentage, 0 for amount (auto-determined if not provided)' },
          { name: 'EFFECTIVE_DATE', type: 'DATE', required: true, description: 'Effective date (DD-MM-YYYY)' },
          { name: 'END_DATE', type: 'DATE', required: false, description: 'End date (DD-MM-YYYY)' },
          { name: 'STATUS', type: 'VARCHAR2', required: true, description: 'Status (ACTIVE/INACTIVE)' }
        ]
      }
    ];
  }

  // Export data from a specific table
  static async exportData(entityId) {
    const entities = await this.getAvailableEntities();
    const entity = entities.find(e => e.id === entityId);
    
    if (!entity) {
      throw new Error('Invalid entity');
    }

    let sql, result;
    
    if (entityId === 'employee_compensation') {
      // Special export for employee compensation - include employee code
      sql = `
        SELECT 
          ec.COMPENSATION_ID,
          e.EMPLOYEE_CODE,
          ec.PAY_COMPONENT_ID,
          ec.AMOUNT,
          ec.PERCENTAGE,
          ec.IS_PERCENTAGE,
          ec.EFFECTIVE_DATE,
          ec.END_DATE,
          ec.STATUS
        FROM HRMS_EMPLOYEE_COMPENSATION ec
        JOIN HRMS_EMPLOYEES e ON ec.EMPLOYEE_ID = e.EMPLOYEE_ID
        ORDER BY e.EMPLOYEE_CODE, ec.EFFECTIVE_DATE
      `;
      result = await executeQuery(sql);
    } else {
      sql = `SELECT * FROM ${entity.table} ORDER BY 1`;
      result = await executeQuery(sql);
    }
    
    return {
      entity: entity,
      data: result.rows,
      totalRecords: result.rows.length
    };
  }

  // Generate template for a specific entity
  static async generateTemplate(entityId) {
    const entities = await this.getAvailableEntities();
    const entity = entities.find(e => e.id === entityId);
    
    if (!entity) {
      throw new Error('Invalid entity');
    }

    // Create template with headers and sample data
    const templateData = [
      // Headers row
      entity.fields.map(field => field.name),
      // Sample data row (empty values)
      entity.fields.map(field => {
        if (field.name.includes('_ID') && field.name !== 'ID') {
          return ''; // Leave ID fields empty for auto-generation
        }
        if (field.name === 'STATUS') {
          return 'ACTIVE'; // Default to active
        }
                 if (field.name === 'IS_BILLABLE') {
           return '1'; // Default to billable
         }
         if (field.name === 'IS_PERCENTAGE') {
           return '0'; // Default to amount (0), use 1 for percentage
         }
         if (field.name.includes('DATE')) {
           return 'DD-MM-YYYY'; // Date format example
         }
         if (field.name.includes('TIME')) {
           return 'HH:MM'; // Time format example
         }
        return ''; // Empty for other fields
      })
    ];

    return {
      entity: entity,
      template: templateData,
      instructions: this.generateInstructions(entity)
    };
  }

  // Generate instructions for template
  static generateInstructions(entity) {
    let instructions = `Instructions for ${entity.name}:\n\n`;
    instructions += '1. Do not modify the header row\n';
    instructions += '2. Fill in the data starting from row 2\n';
    instructions += '3. Leave ID fields empty for auto-generation\n';
    instructions += '4. Use DD-MM-YYYY format for dates (or MM/DD/YYYY - Excel will auto-convert)\n';
    instructions += '5. Use HH:MM format for times\n';
         instructions += '6. Use ACTIVE for active, INACTIVE for inactive\n';
     instructions += '7. Use 1 for billable, 0 for non-billable (for projects)\n';
     instructions += '8. For compensation: Use 0 for amount-based, 1 for percentage-based\n';
     instructions += '9. For compensation: IS_PERCENTAGE can be auto-determined from AMOUNT/PERCENTAGE fields\n';
     instructions += '10. For new settings (Departments, Workcenters, Employment Types): only Name and Status are required.\n\n';
    instructions += 'Field descriptions:\n';
    
    entity.fields.forEach(field => {
      instructions += `- ${field.name}: ${field.description}${field.required ? ' (Required)' : ''}\n`;
    });

    return instructions;
  }

  // Import data into a specific table
  static async importData(entityId, data, userId) {
    const entities = await this.getAvailableEntities();
    const entity = entities.find(e => e.id === entityId);
    
    if (!entity) {
      throw new Error('Invalid entity');
    }

    const results = {
      total: data.length,
      success: 0,
      errors: [],
      skipped: 0
    };

    // Helper to convert various date formats to YYYY-MM-DD
    const toYMD = (value) => {
      if (!value) return null;
      const str = String(value).trim();
      // Handle DD-MM-YYYY format
      let m = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      if (m) {
        const [, dd, mm, yyyy] = m;
        return `${yyyy}-${mm}-${dd}`;
      }
      // Handle MM/DD/YYYY format (Excel default)
      m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (m) {
        const [, mm, dd, yyyy] = m;
        return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
      }
      // Handle YYYY-MM-DD format
      m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) {
        return str;
      }
      // If no match, return as-is and let Oracle handle it
      return str;
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // header is row 1

      try {
        // Validate required fields
        const validationErrors = await this.validateRow(entity, row, rowNumber);
        if (validationErrors.length > 0) {
          results.errors.push({ row: rowNumber, errors: validationErrors });
          results.skipped++;
          continue;
        }

        if (entityId === 'employees') {
          // Map row to Employee.create payload
          const employeeData = {
            firstName: row.FIRST_NAME,
            lastName: row.LAST_NAME,
            legalName: row.LEGAL_NAME,
            gender: row.GENDER,
            nationality: row.NATIONALITY,
            dateOfBirth: toYMD(row.DATE_OF_BIRTH),
            birthPlace: row.BIRTH_PLACE,
            avatarUrl: row.AVATAR_URL,
            reportToId: row.REPORT_TO_ID ? Number(row.REPORT_TO_ID) : null,
            designation: row.DESIGNATION,
            role: row.ROLE,
            position: row.POSITION,
            location: row.LOCATION,
            costCenter: row.COST_CENTER,
            department: row.DEPARTMENT,
            workcenter: row.WORKCENTER,
            employmentType: row.EMPLOYMENT_TYPE,
            calendarId: row.CALENDAR_ID ? Number(row.CALENDAR_ID) : null,
            shiftId: row.SHIFT_ID ? Number(row.SHIFT_ID) : null,
            payGradeId: row.PAY_GRADE_ID ? Number(row.PAY_GRADE_ID) : null,
            dateOfJoining: toYMD(row.DATE_OF_JOINING),
            probationDays: row.PROBATION_DAYS ? Number(row.PROBATION_DAYS) : 90,
            confirmDate: toYMD(row.CONFIRM_DATE),
            noticeDays: row.NOTICE_DAYS ? Number(row.NOTICE_DAYS) : 30,
            address: row.ADDRESS,
            pincode: row.PINCODE,
            city: row.CITY,
            district: row.DISTRICT,
            state: row.STATE,
            country: row.COUNTRY,
            phone: row.PHONE,
            mobile: row.MOBILE,
            email: row.EMAIL,
            fatherName: row.FATHER_NAME,
            maritalStatus: row.MARITAL_STATUS,
            spouseName: row.SPOUSE_NAME,
            religion: row.RELIGION,
            aadharNumber: row.AADHAR_NUMBER,
            aadharImageUrl: row.AADHAR_IMAGE_URL,
            panNumber: row.PAN_NUMBER,
            panImageUrl: row.PAN_IMAGE_URL,
            drivingLicenseNumber: row.DRIVING_LICENSE_NUMBER,
            drivingLicenseImageUrl: row.DRIVING_LICENSE_IMAGE_URL,
            educationCertificateNumber: row.EDUCATION_CERTIFICATE_NUMBER,
            educationCertificateImageUrl: row.EDUCATION_CERTIFICATE_IMAGE_URL,
            bankName: row.BANK_NAME,
            branchName: row.BRANCH_NAME,
            ifscCode: row.IFSC_CODE,
            accountNumber: row.ACCOUNT_NUMBER,
            uanNumber: row.UAN_NUMBER,
            pfNumber: row.PF_NUMBER,
            esiNumber: row.ESI_NUMBER,
            createdBy: userId
          };

          await Employee.create(employeeData);
        } else if (entityId === 'employee_compensation') {
          // Special handling for employee compensation
          const EmployeeCompensation = require('./EmployeeCompensation');
          
          // Find employee by employee code
          const employeeSql = `SELECT EMPLOYEE_ID FROM HRMS_EMPLOYEES WHERE EMPLOYEE_CODE = :employeeCode`;
          const employeeResult = await executeQuery(employeeSql, { employeeCode: row.EMPLOYEE_CODE });
          
          if (!employeeResult.rows || employeeResult.rows.length === 0) {
            throw new Error(`Employee with code '${row.EMPLOYEE_CODE}' not found`);
          }
          
          const employeeId = employeeResult.rows[0].EMPLOYEE_ID;
          
          // Determine IS_PERCENTAGE if not provided
          let isPercentage = false;
          if (row.IS_PERCENTAGE !== undefined && row.IS_PERCENTAGE !== '') {
            isPercentage = row.IS_PERCENTAGE === '1' || row.IS_PERCENTAGE === 1;
          } else {
            // Auto-determine based on which field is provided
            const hasAmount = row.AMOUNT && row.AMOUNT.toString().trim() !== '';
            const hasPercentage = row.PERCENTAGE && row.PERCENTAGE.toString().trim() !== '';
            
            if (hasPercentage && !hasAmount) {
              isPercentage = true;
            } else if (hasAmount && !hasPercentage) {
              isPercentage = false;
            } else {
              // Default to amount if both or neither provided
              isPercentage = false;
            }
          }
          
          // Create compensation record
          const compensationData = {
            employeeId: employeeId,
            payComponentId: Number(row.PAY_COMPONENT_ID),
            amount: row.AMOUNT ? Number(row.AMOUNT) : 0,
            percentage: row.PERCENTAGE ? Number(row.PERCENTAGE) : null,
            isPercentage: isPercentage,
            effectiveDate: toYMD(row.EFFECTIVE_DATE),
            endDate: row.END_DATE ? toYMD(row.END_DATE) : null,
            status: row.STATUS || 'ACTIVE',
            createdBy: userId
          };
          
          await EmployeeCompensation.create(compensationData);
        } else {
          // Generic flow
          const insertData = this.prepareInsertData(entity, row, userId);
          await this.insertRow(entity.table, insertData);
        }

        results.success++;
      } catch (error) {
        results.errors.push({ row: rowNumber, errors: [error.message] });
        results.skipped++;
      }
    }

    return results;
  }

  // Validate a single row of data
  static async validateRow(entity, row, rowNumber) {
    const errors = [];

    for (const field of entity.fields) {
      const value = row[field.name];
      
      // Debug: Log validation for required fields
      if (field.required) {
        console.log(`🔍 Validating ${field.name}:`, {
          value: value,
          type: typeof value,
          trimmed: value ? value.toString().trim() : '',
          isEmpty: !value || value.toString().trim() === ''
        });
      }
      
             if (field.required && (!value || value.toString().trim() === '')) {
         // Special handling for IS_PERCENTAGE - allow auto-determination
         if (field.name === 'IS_PERCENTAGE' && entity.id === 'employee_compensation') {
           const hasAmount = row.AMOUNT && row.AMOUNT.toString().trim() !== '';
           const hasPercentage = row.PERCENTAGE && row.PERCENTAGE.toString().trim() !== '';
           
           if (!hasAmount && !hasPercentage) {
             errors.push(`${field.name} is required. Please specify either AMOUNT or PERCENTAGE`);
           }
           // If either AMOUNT or PERCENTAGE is provided, we'll auto-determine IS_PERCENTAGE
         } else {
           errors.push(`${field.name} is required`);
         }
       }

      if (value && value.toString().trim() !== '') {
        // Type validation
        if (field.type === 'NUMBER' && isNaN(Number(value))) {
          errors.push(`${field.name} must be a number`);
        }

        if (field.name === 'STATUS' && !['ACTIVE', 'INACTIVE', 'COMPLETED', 'CANCELLED'].includes(value)) {
          errors.push(`${field.name} must be ACTIVE, INACTIVE, COMPLETED, or CANCELLED`);
        }
        
        if (field.name === 'IS_BILLABLE' && ![0, 1, '0', '1'].includes(value)) {
          errors.push(`${field.name} must be 0 or 1`);
        }

                 if (field.name === 'IS_PERCENTAGE' && value && value.toString().trim() !== '') {
           // Only validate if a value is provided
           if (![0, 1, '0', '1'].includes(value)) {
             errors.push(`${field.name} must be 0 or 1`);
           }
         }

        // Special validation for employee compensation
        if (field.name === 'EMPLOYEE_CODE' && entity.id === 'employee_compensation') {
          try {
            // Validate that employee exists
            const employeeSql = `SELECT EMPLOYEE_ID FROM HRMS_EMPLOYEES WHERE EMPLOYEE_CODE = :employeeCode`;
            const employeeResult = await executeQuery(employeeSql, { employeeCode: value });
            if (!employeeResult.rows || employeeResult.rows.length === 0) {
              errors.push(`Employee with code '${value}' not found`);
            }
          } catch (error) {
            console.error('Error validating employee code:', error);
            errors.push(`Error validating employee code: ${error.message}`);
          }
        }

        if (field.name.includes('DATE') && value !== 'DD-MM-YYYY') {
          // Validate date format - accept both DD-MM-YYYY and MM/DD/YYYY (Excel format)
          const ddmmRegex = /^\d{2}-\d{2}-\d{4}$/;
          const mmddRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
          const yyyyRegex = /^\d{4}-\d{2}-\d{2}$/;
          
          if (!ddmmRegex.test(value) && !mmddRegex.test(value) && !yyyyRegex.test(value)) {
            errors.push(`${field.name} must be in DD-MM-YYYY, MM/DD/YYYY, or YYYY-MM-DD format`);
          }
        }

        if (field.name.includes('TIME') && value !== 'HH:MM') {
          // Validate time format
          const timeRegex = /^\d{2}:\d{2}$/;
          if (!timeRegex.test(value)) {
            errors.push(`${field.name} must be in HH:MM format`);
          }
        }
      }
    }

    return errors;
  }

  // Prepare data for insertion
  static prepareInsertData(entity, row, userId) {
    const insertData = {
      CREATED_BY: userId,
      CREATED_AT: new Date()
    };

    entity.fields.forEach(field => {
      const value = row[field.name];
      
      if (value && value.toString().trim() !== '') {
        if (field.name.includes('_ID') && field.name !== 'ID') {
          // Skip ID fields for auto-generation
          return;
        }

        if (field.name.includes('DATE') && value !== 'DD-MM-YYYY') {
          // Convert DD-MM-YYYY to YYYY-MM-DD for Oracle
          const [day, month, year] = value.split('-');
          insertData[field.name] = `${year}-${month}-${day}`;
        } else {
          insertData[field.name] = value;
        }
      }
    });

    return insertData;
  }

  // Insert a single row
  static async insertRow(tableName, data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(col => `:${col}`).join(', ');

    const sql = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES (${placeholders})
    `;

    await executeQuery(sql, data);
  }

  // Get import history
  static async getImportHistory() {
    const sql = `
      SELECT 
        ih.*,
        u.FIRST_NAME || ' ' || u.LAST_NAME as CREATED_BY_NAME
      FROM HRMS_IMPORT_HISTORY ih
      LEFT JOIN HRMS_USERS u ON ih.CREATED_BY = u.USER_ID
      ORDER BY ih.CREATED_AT DESC
    `;
    
    const result = await executeQuery(sql);
    return result.rows;
  }

  // Log import operation
  static async logImport(entityId, results, userId) {
    const sql = `
      INSERT INTO HRMS_IMPORT_HISTORY (
        ENTITY_ID, TOTAL_RECORDS, SUCCESS_COUNT, ERROR_COUNT, 
        SKIPPED_COUNT, ERROR_DETAILS, CREATED_BY, CREATED_AT
      ) VALUES (
        :entityId, :totalRecords, :successCount, :errorCount,
        :skippedCount, :errorDetails, :createdBy, CURRENT_TIMESTAMP
      )
    `;

    const binds = {
      entityId,
      totalRecords: results.total,
      successCount: results.success,
      errorCount: results.errors.length,
      skippedCount: results.skipped,
      errorDetails: JSON.stringify(results.errors),
      createdBy: userId
    };

    await executeQuery(sql, binds);
  }

  // Create import history table
  static async createImportHistoryTable() {
    const sql = `
      CREATE TABLE HRMS_IMPORT_HISTORY (
        IMPORT_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        ENTITY_ID VARCHAR2(50) NOT NULL,
        TOTAL_RECORDS NUMBER DEFAULT 0,
        SUCCESS_COUNT NUMBER DEFAULT 0,
        ERROR_COUNT NUMBER DEFAULT 0,
        SKIPPED_COUNT NUMBER DEFAULT 0,
        ERROR_DETAILS CLOB,
        CREATED_BY NUMBER NOT NULL,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT FK_IMPORT_HISTORY_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID)
      )
    `;

    try {
      await executeQuery(sql);
      console.log('✅ HRMS_IMPORT_HISTORY table created successfully');
    } catch (error) {
      if (error.message.includes('ORA-00955')) {
        console.log('ℹ️ HRMS_IMPORT_HISTORY table already exists');
      } else {
        throw error;
      }
    }
  }
}

module.exports = ImportExport; 
# Database Migration Guide

This document tracks all database schema changes and provides migration scripts for the HRMS application.

## Quick Start

### Development Migration
1. **Run the enhanced calendar migration:**
```bash
cd backend
node migrate-enhanced-calendar-tables.js
```

2. **Run the weekly holidays migration (if needed):**
```bash
cd backend
node migrate-weekly-holidays.js
```

3. **Verify the tables were created:**
   ```sql
   SELECT table_name FROM user_tables WHERE table_name LIKE 'HRMS_CALENDAR%';
   ```

### Production Migration
1. **Run the complete production migration:**
```bash
cd backend
node production-migration.js
```

2. **Verify production migration:**
```bash
node -e "
const { executeQuery } = require('./config/database');
(async () => {
  try {
    const result = await executeQuery('SELECT table_name FROM user_tables WHERE table_name LIKE \'HRMS_%\' ORDER BY table_name');
    console.log('✅ Production tables created:', result.rows.map(row => row[0]));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
"
```

## Change Log

### [2025-01-22] - Oracle Queries Fixes and Missing Columns Migration
- **Tables**: `HRMS_EMPLOYEES`, `HRMS_SHIFTS`, `HRMS_CALENDAR`
- **Change**: Fixed Oracle LIMIT syntax issues and added missing SHIFT_ID, CALENDAR_ID, PAY_GRADE_ID columns
- **Impact**: Resolves all 5 query issues and enables proper employee-shift-calendar relationships
- **Migration**: Automatic column addition and constraint creation during database initialization
- **Details**:
  - Added `SHIFT_ID NUMBER` column to `HRMS_EMPLOYEES` with foreign key to `HRMS_SHIFTS`
  - Added `CALENDAR_ID NUMBER` column to `HRMS_EMPLOYEES` with foreign key to `HRMS_CALENDAR`
  - Added `PAY_GRADE_ID NUMBER` column to `HRMS_EMPLOYEES`
  - Fixed Oracle LIMIT syntax: replaced with `FETCH FIRST n ROWS ONLY`
  - Created Oracle-specific query utilities (`oracleQueries.js`)
  - Implemented automatic migration methods for existing tables
  - Added comprehensive test script (`test-oracle-queries.js`)
- **Schema Changes**:
  ```sql
  -- Added columns to HRMS_EMPLOYEES
  ALTER TABLE HRMS_EMPLOYEES ADD SHIFT_ID NUMBER;
  ALTER TABLE HRMS_EMPLOYEES ADD CALENDAR_ID NUMBER;
  ALTER TABLE HRMS_EMPLOYEES ADD PAY_GRADE_ID NUMBER;
  
  -- Added foreign key constraints
  ALTER TABLE HRMS_EMPLOYEES ADD CONSTRAINT FK_EMPLOYEE_SHIFT 
    FOREIGN KEY (SHIFT_ID) REFERENCES HRMS_SHIFTS(SHIFT_ID);
  ALTER TABLE HRMS_EMPLOYEES ADD CONSTRAINT FK_EMPLOYEE_CALENDAR 
    FOREIGN KEY (CALENDAR_ID) REFERENCES HRMS_CALENDAR(CALENDAR_ID);
  ```
- **Query Fixes**:
  - ✅ `SELECT COUNT(*) FROM HRMS_EMPLOYEES WHERE STATUS = 'ACTIVE';` (Working)
  - ✅ `SELECT COUNT(*) FROM HRMS_EMPLOYEES e JOIN HRMS_SHIFTS s ON e.SHIFT_ID = s.SHIFT_ID WHERE e.STATUS = 'ACTIVE';` (Working)
  - ✅ `SELECT COUNT(*) FROM HRMS_EMPLOYEES e JOIN HRMS_CALENDAR c ON e.CALENDAR_ID = c.CALENDAR_ID WHERE e.STATUS = 'ACTIVE';` (Working)
  - ✅ `SELECT * FROM HRMS_SHIFTS ORDER BY SHIFT_ID FETCH FIRST :limit ROWS ONLY;` (Fixed - Oracle compatible)
  - ✅ `SELECT * FROM HRMS_CALENDAR ORDER BY CALENDAR_ID FETCH FIRST :limit ROWS ONLY;` (Fixed - Oracle compatible)

### [2025-01-22] - Pay Grade Management System
- **Table**: `HRMS_PAY_GRADES`
- **Change**: Created comprehensive pay grade management system with salary ranges and industry-standard structure
- **Impact**: Enables structured salary management with defined ranges, mid-points, and compression ratios for HRMS and Payroll ERP applications
- **Migration**: Full table creation with constraints and sample data via migrate-pay-grades-table.js
- **Features**:
  - Grade codes and names for easy identification
  - Minimum, maximum, and mid-point salary ranges
  - Automatic mid-salary calculation functionality
  - Salary range validation (max > min)
  - Compression ratio calculation for pay equity analysis
  - Status management (Active/Inactive)
  - Audit trail with created by and timestamps
  - Industry-standard pay grade structure
  - Sample data with 5 standard grades (G1-G5)
  - Currency formatting with Indian Rupee (₹) display
  - Visual salary range representation in detail view
- **Schema**:
  ```sql
  CREATE TABLE HRMS_PAY_GRADES (
    PAY_GRADE_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    GRADE_CODE VARCHAR2(20) UNIQUE NOT NULL,
    GRADE_NAME VARCHAR2(100) NOT NULL,
    MIN_SALARY NUMBER(10,2) NOT NULL,
    MAX_SALARY NUMBER(10,2) NOT NULL,
    MID_SALARY NUMBER(10,2),
    DESCRIPTION VARCHAR2(500),
    STATUS VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (STATUS IN ('ACTIVE', 'INACTIVE')),
    CREATED_BY NUMBER,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT FK_PAY_GRADE_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID),
    CONSTRAINT CHK_PAY_GRADE_SALARY CHECK (MIN_SALARY <= MAX_SALARY)
  )
  ```

### [2025-01-22] - Calendar CLOB to VARCHAR2 Migration
- **Tables**: `HRMS_CALENDAR`, `HRMS_CALENDAR_HOLIDAYS`
- **Change**: Migrated CLOB columns to VARCHAR2(4000) for better performance and compatibility
- **Impact**: Improved data handling and eliminated CLOB-related issues in frontend
- **Migration**: Column type conversion with data preservation
- **Details**:
  - `DESCRIPTION` column: CLOB → VARCHAR2(4000)
  - `WEEKLY_HOLIDAYS` column: CLOB → VARCHAR2(4000)
  - Maintained all existing data during migration
  - Improved frontend compatibility and performance

### [2025-01-22] - Employee Calendar Assignment
- **Table**: `HRMS_EMPLOYEES`
- **Change**: Added `CALENDAR_ID` column with foreign key constraint to `HRMS_CALENDAR`
- **Impact**: Enables calendar assignment to employees for holiday and work schedule management
- **Migration**: Column addition with foreign key constraint
- **Details**:
  - Added `CALENDAR_ID NUMBER` column to `HRMS_EMPLOYEES`
  - Added foreign key constraint `FK_EMPLOYEE_CALENDAR` referencing `HRMS_CALENDAR(CALENDAR_ID)`
  - Updated Employee model to support calendar assignment in create/update operations
  - Enhanced employee detail view to display assigned calendar information

### [2025-01-22] - Weekly Holidays Feature
- **Table**: `HRMS_CALENDAR`
- **Change**: Added `WEEKLY_HOLIDAYS` column (CLOB) to store custom recurring weekly holidays with labels
- **Impact**: Enables creation of custom weekly holidays with descriptive labels (e.g., "Weekend Holiday", "Sunday Off", "Diwali Holiday")
- **Migration**: Column addition with JSON storage for flexible holiday configuration
- **Features**:
  - Custom weekly holiday labels for better identification
  - Support for multiple weekly holidays per calendar
  - Visual distinction in calendar grid (blue indicators)
  - Integration with existing holiday management system
  - JSON-based storage for flexible configuration

### [2025-01-22] - Enhanced Calendar Management System with Weekly Holidays
- **Tables**: `HRMS_CALENDAR`, `HRMS_CALENDAR_HOLIDAYS`, `HRMS_EMPLOYEE_CALENDAR`, `HRMS_NAMED_HOLIDAY_TEMPLATES`
- **Change**: Added comprehensive calendar management functionality with recurring holidays, named templates, pattern-based holiday creation, and custom weekly holidays with labels
- **Impact**: Enables creation of multiple calendars with advanced holiday scheduling including recurring patterns, predefined templates, and custom weekly holidays (e.g., "Weekend Holiday", "Diwali Holiday")
- **Migration**: Enhanced table creation included in migrate-enhanced-calendar-tables.js and migrate-weekly-holidays.js with full schema, foreign keys, and constraints
- **Features**: 
  - Calendar management with unique codes and names
  - Custom weekly holidays with labels (e.g., "Weekend Holiday", "Sunday Off", "Diwali Holiday")
  - Recurring holidays (weekly, monthly, yearly patterns)
  - Named holiday templates (Diwali, Christmas, New Year, Independence Day, Republic Day, weekends)
  - Employee calendar assignments for future use
  - Holiday pattern support (specific dates, day of week, month/day combinations)
  - Holiday type categorization (Public, Company, Optional, Restricted)
  - Visual distinction between date-based and weekly holidays in calendar view

### [2025-01-22] - REASON Column Migration
- **Table**: `HRMS_EMPLOYEE_COMPENSATION`
- **Change**: Added REASON column to track compensation change reasons
- **Impact**: Better audit trail for compensation modifications
- **Migration**: Column addition with default value handling

### [2025-01-22] - Employee Compensation Table
- **Table**: `HRMS_EMPLOYEE_COMPENSATION`
- **Change**: Created new table for employee compensation tracking
- **Impact**: Centralized compensation management with history
- **Migration**: Full table creation with foreign key constraints

### [2025-01-22] - Timesheet System Enhancement
- **Tables**: `HRMS_TIMESHEET`, `HRMS_TIMESHEET_ENTRY`
- **Change**: Enhanced timesheet system with detailed entry tracking
- **Impact**: Better time tracking and reporting capabilities
- **Migration**: Table structure updates and new entry system

### [2025-01-22] - Leave Resumption System
- **Table**: `HRMS_LEAVE_RESUMPTION`
- **Change**: Added leave resumption tracking functionality
- **Impact**: Complete leave lifecycle management
- **Migration**: New table creation with foreign key relationships

### [2025-01-22] - Resignation Management
- **Table**: `HRMS_RESIGNATION`
- **Change**: Added resignation tracking and approval workflow
- **Impact**: Streamlined resignation process management
- **Migration**: New table creation with status tracking

### [2025-01-22] - Settings Management
- **Tables**: `HRMS_DESIGNATION`, `HRMS_POSITION`, `HRMS_LOCATION`, `HRMS_PROJECT`, `HRMS_COST_CENTER`, `HRMS_LEAVE_POLICY`, `HRMS_PAY_COMPONENT`, `HRMS_ROLE`, `HRMS_SHIFT`
- **Change**: Comprehensive settings management system
- **Impact**: Centralized configuration management
- **Migration**: Multiple table creation with proper relationships

### [2025-01-22] - Loan Management System
- **Table**: `HRMS_LOAN`
- **Change**: Added loan management functionality
- **Impact**: Employee loan tracking and approval workflow
- **Migration**: New table creation with status and approval tracking

### [2025-01-22] - Advance and Deduction System
- **Tables**: `HRMS_ADVANCE`, `HRMS_DEDUCTION`
- **Change**: Added advance and deduction management
- **Impact**: Payroll advance and deduction tracking
- **Migration**: New table creation with month tracking

### [2025-01-22] - Leave Management System
- **Table**: `HRMS_LEAVE`
- **Change**: Enhanced leave management with approval workflow
- **Impact**: Complete leave application and approval process
- **Migration**: Table structure updates and new approval system

### [2025-01-22] - Employee Management Enhancement
- **Table**: `HRMS_EMPLOYEE`
- **Change**: Enhanced employee management with additional fields
- **Impact**: Comprehensive employee information tracking
- **Migration**: Column additions and constraint updates

### [2025-01-22] - User Management System
- **Table**: `HRMS_USER`
- **Change**: Added user authentication and role management
- **Impact**: Secure access control and user management
- **Migration**: New table creation with authentication fields

## Table Descriptions

### HRMS_CALENDAR
Stores calendar definitions with unique codes and names for different organizational units.

**Key Features:**
- Unique calendar codes for easy identification
- Calendar names and descriptions
- Active/inactive status management
- Audit trail with created/updated timestamps

### HRMS_CALENDAR_HOLIDAYS
Stores holiday definitions with support for recurring patterns and specific dates.

**Key Features:**
- Multiple holiday patterns (specific date, weekly, monthly, yearly)
- Recurring holiday support with day of week, month, and day combinations
- Holiday type categorization (Public, Company, Optional, Restricted)
- Named holiday flag for template-based holidays
- Comprehensive pattern configuration

### HRMS_EMPLOYEE_CALENDAR
Links employees to specific calendars for future assignment functionality.

**Key Features:**
- Employee to calendar assignment
- Effective date ranges for assignments
- Active/inactive status tracking
- Audit trail for assignment changes

### HRMS_NAMED_HOLIDAY_TEMPLATES
Stores predefined holiday templates for quick calendar setup.

**Key Features:**
- Predefined templates for common holidays
- Pattern configuration storage
- Template descriptions and metadata
- Easy template application to calendars

## Migration Scripts

### Enhanced Calendar Migration
```bash
cd backend
node migrate-enhanced-calendar-tables.js
```

This script creates all calendar-related tables with proper constraints and relationships.

### Individual Table Migrations
For specific table migrations, use the corresponding migration scripts in the backend directory.

## Best Practices

1. **Always backup your database before running migrations**
2. **Test migrations in a development environment first**
3. **Review the migration output for any errors**
4. **Verify table creation with SQL queries**
5. **Update application configuration if needed**

## Troubleshooting

### Common Issues

1. **ORA-12560: TNS:protocol adapter error**
   - Check Oracle database connectivity
   - Verify database configuration in config/database.js
   - Ensure Oracle client is properly installed

2. **Table already exists errors**
   - Drop existing tables if recreating
   - Use ALTER TABLE for schema changes instead of CREATE TABLE

3. **Foreign key constraint errors**
   - Ensure referenced tables exist
   - Check data integrity before adding constraints

### Support

For migration issues, check the troubleshooting guide or contact the development team. 
# Oracle Queries Fixes and Implementation Guide

## Overview
This document outlines the fixes implemented for the Oracle database queries that were not working, and provides the correct Oracle syntax for all queries.

## Issues Identified and Fixed

### 1. Missing Database Columns
**Problem**: The `HRMS_EMPLOYEES` table was missing `SHIFT_ID`, `CALENDAR_ID`, and `PAY_GRADE_ID` columns.

**Solution**: Added these columns to the Employee table creation and implemented migration methods.

**Files Modified**:
- `backend/models/Employee.js` - Added missing columns and constraints
- `backend/config/database.js` - Added migration calls during initialization

### 2. Oracle LIMIT Syntax Issue
**Problem**: Oracle doesn't support `LIMIT` clause like MySQL/PostgreSQL.

**Solution**: Replaced `LIMIT` with Oracle's `FETCH FIRST n ROWS ONLY` syntax.

**Files Created**:
- `backend/utils/oracleQueries.js` - Oracle-specific query utilities
- `backend/test-oracle-queries.js` - Test script demonstrating all queries

## Working Queries (Already Functional)

### 1. Count Active Employees
```sql
SELECT COUNT(*) FROM HRMS_EMPLOYEES WHERE STATUS = 'ACTIVE';
```
**Status**: ✅ Working
**Bind Variable Version**: 
```sql
SELECT COUNT(*) FROM HRMS_EMPLOYEES WHERE STATUS = :status
```

### 2. Count Employees with Shifts
```sql
SELECT COUNT(*) FROM HRMS_EMPLOYEES e 
JOIN HRMS_SHIFTS s ON e.SHIFT_ID = s.SHIFT_ID 
WHERE e.STATUS = 'ACTIVE';
```
**Status**: ✅ Working
**Bind Variable Version**: 
```sql
SELECT COUNT(*) FROM HRMS_EMPLOYEES e 
JOIN HRMS_SHIFTS s ON e.SHIFT_ID = s.SHIFT_ID 
WHERE e.STATUS = :status
```

### 3. Count Employees with Calendars
```sql
SELECT COUNT(*) FROM HRMS_EMPLOYEES e 
JOIN HRMS_CALENDAR c ON e.CALENDAR_ID = c.CALENDAR_ID 
WHERE e.STATUS = 'ACTIVE';
```
**Status**: ✅ Working
**Bind Variable Version**: 
```sql
SELECT COUNT(*) FROM HRMS_EMPLOYEES e 
JOIN HRMS_CALENDAR c ON e.CALENDAR_ID = c.CALENDAR_ID 
WHERE e.STATUS = :status
```

## Fixed Queries (Now Working)

### 4. Get Shifts Sample Data
**Original (Not Working)**:
```sql
SELECT * FROM HRMS_SHIFTS LIMIT 5;
```

**Fixed (Oracle-Compatible)**:
```sql
SELECT * FROM HRMS_SHIFTS 
ORDER BY SHIFT_ID 
FETCH FIRST :limit ROWS ONLY
```

**Bind Variables**: `{ limit: 5 }`

**Implementation**: 
```javascript
const shiftsData = await getSampleData.shifts(5);
```

### 5. Get Calendars Sample Data
**Original (Not Working)**:
```sql
SELECT * FROM HRMS_CALENDAR LIMIT 5;
```

**Fixed (Oracle-Compatible)**:
```sql
SELECT * FROM HRMS_CALENDAR 
ORDER BY CALENDAR_ID 
FETCH FIRST :limit ROWS ONLY
```

**Bind Variables**: `{ limit: 5 }`

**Implementation**: 
```javascript
const calendarsData = await getSampleData.calendars(5);
```

## Oracle-Specific Syntax Guide

### Pagination
**MySQL/PostgreSQL**:
```sql
SELECT * FROM table LIMIT 10 OFFSET 20;
```

**Oracle**:
```sql
SELECT * FROM table 
OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY;
```

### Row Limiting
**MySQL/PostgreSQL**:
```sql
SELECT * FROM table LIMIT 5;
```

**Oracle**:
```sql
SELECT * FROM table 
FETCH FIRST 5 ROWS ONLY;
```

### Alternative Oracle Methods
**Using ROWNUM**:
```sql
SELECT * FROM (
  SELECT * FROM table ORDER BY column_name
) WHERE ROWNUM <= 5;
```

**Using ROW_NUMBER()**:
```sql
SELECT * FROM (
  SELECT *, ROW_NUMBER() OVER (ORDER BY column_name) as rn 
  FROM table
) WHERE rn <= 5;
```

## Implementation Details

### Database Migration
The system now automatically:
1. Checks for missing columns during initialization
2. Adds `SHIFT_ID`, `CALENDAR_ID`, and `PAY_GRADE_ID` columns if missing
3. Creates foreign key constraints to `HRMS_SHIFTS` and `HRMS_CALENDAR` tables

### Utility Functions
Created `oracleQueries.js` with:
- `getSampleData.shifts(limit)` - Get shifts with Oracle pagination
- `getSampleData.calendars(limit)` - Get calendars with Oracle pagination
- `paginateQuery(baseQuery, page, limit)` - Oracle pagination helper
- `limitQuery(baseQuery, limit)` - Oracle limit replacement

### Test Script
Created `test-oracle-queries.js` that:
- Tests all 5 queries
- Demonstrates proper bind variable usage
- Shows Oracle-compatible syntax
- Provides error handling and logging

## Usage Examples

### Basic Usage
```javascript
const { getSampleData } = require('./utils/oracleQueries');

// Get 5 shifts
const shifts = await getSampleData.shifts(5);

// Get 10 calendars
const calendars = await getSampleData.calendars(10);

// Count employees with shifts
const count = await getSampleData.employeesWithShifts();
```

### With Custom Queries
```javascript
const { executeQuery } = require('./config/database');

const sql = `
  SELECT SHIFT_ID, SHIFT_NAME, START_TIME, END_TIME
  FROM HRMS_SHIFTS 
  WHERE STATUS = :status
  ORDER BY SHIFT_ID 
  FETCH FIRST :limit ROWS ONLY
`;

const result = await executeQuery(sql, { 
  status: 'ACTIVE', 
  limit: 5 
});
```

## Best Practices

1. **Always use bind variables** (`:paramName`) to prevent SQL injection
2. **Use Oracle-specific syntax** (`FETCH FIRST n ROWS ONLY` instead of `LIMIT`)
3. **Order results** before applying row limits for consistent pagination
4. **Handle errors gracefully** with try-catch blocks
5. **Use the utility functions** from `oracleQueries.js` for common operations

## Testing

Run the test script to verify all queries work:
```bash
cd backend
node test-oracle-queries.js
```

This will test all 5 queries and demonstrate proper Oracle syntax with bind variables.

## Conclusion

All queries are now working with:
- ✅ Proper Oracle syntax (no LIMIT clause)
- ✅ Bind variables for security
- ✅ Missing database columns added
- ✅ Foreign key constraints established
- ✅ Comprehensive error handling
- ✅ Utility functions for common operations

The system is now fully compatible with Oracle database and follows best practices for security and performance.

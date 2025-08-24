-- Database migration script to rename PRESENT_DAYS to PAYABLE_DAYS
-- in HRMS_PAYROLL_DETAILS table
-- 
-- Run this script on your Oracle database to apply the column rename

BEGIN
  -- Check if PRESENT_DAYS column exists and rename it to PAYABLE_DAYS
  DECLARE
    column_exists NUMBER;
  BEGIN
    SELECT COUNT(*)
    INTO column_exists
    FROM USER_TAB_COLUMNS
    WHERE TABLE_NAME = 'HRMS_PAYROLL_DETAILS'
    AND COLUMN_NAME = 'PRESENT_DAYS';
    
    IF column_exists > 0 THEN
      EXECUTE IMMEDIATE 'ALTER TABLE HRMS_PAYROLL_DETAILS RENAME COLUMN PRESENT_DAYS TO PAYABLE_DAYS';
      DBMS_OUTPUT.PUT_LINE('✅ Successfully renamed PRESENT_DAYS to PAYABLE_DAYS in HRMS_PAYROLL_DETAILS table');
    ELSE
      DBMS_OUTPUT.PUT_LINE('ℹ️  PRESENT_DAYS column not found in HRMS_PAYROLL_DETAILS table (may already be renamed)');
    END IF;
  END;
END;
/

-- Verify the column rename
SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH, NULLABLE
FROM USER_TAB_COLUMNS
WHERE TABLE_NAME = 'HRMS_PAYROLL_DETAILS'
AND COLUMN_NAME IN ('PRESENT_DAYS', 'PAYABLE_DAYS')
ORDER BY COLUMN_NAME;

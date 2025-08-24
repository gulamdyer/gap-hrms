-- Update HRMS_PAYROLL_DETAILS table structure for PF report
-- Run this script on your Oracle database to add missing columns

BEGIN
  -- Add missing columns if they don't exist
  DECLARE
    column_exists NUMBER;
  BEGIN
    -- Check and add FP_BASIC_EARNING column
    SELECT COUNT(*)
    INTO column_exists
    FROM USER_TAB_COLUMNS
    WHERE TABLE_NAME = 'HRMS_PAYROLL_DETAILS'
    AND COLUMN_NAME = 'FP_BASIC_EARNING';
    
    IF column_exists = 0 THEN
      EXECUTE IMMEDIATE 'ALTER TABLE HRMS_PAYROLL_DETAILS ADD (FP_BASIC_EARNING NUMBER(15,2) DEFAULT 0)';
      DBMS_OUTPUT.PUT_LINE('✅ Added FP_BASIC_EARNING column');
    ELSE
      DBMS_OUTPUT.PUT_LINE('ℹ️ FP_BASIC_EARNING column already exists');
    END IF;
  END;
  
  -- Check and add PF_DEDUCTION column
  DECLARE
    column_exists NUMBER;
  BEGIN
    SELECT COUNT(*)
    INTO column_exists
    FROM USER_TAB_COLUMNS
    WHERE TABLE_NAME = 'HRMS_PAYROLL_DETAILS'
    AND COLUMN_NAME = 'PF_DEDUCTION';
    
    IF column_exists = 0 THEN
      EXECUTE IMMEDIATE 'ALTER TABLE HRMS_PAYROLL_DETAILS ADD (PF_DEDUCTION NUMBER(15,2) DEFAULT 0)';
      DBMS_OUTPUT.PUT_LINE('✅ Added PF_DEDUCTION column');
    ELSE
      DBMS_OUTPUT.PUT_LINE('ℹ️ PF_DEDUCTION column already exists');
    END IF;
  END;
  
  -- Check and add ESI_DEDUCTION column
  DECLARE
    column_exists NUMBER;
  BEGIN
    SELECT COUNT(*)
    INTO column_exists
    FROM USER_TAB_COLUMNS
    WHERE TABLE_NAME = 'HRMS_PAYROLL_DETAILS'
    AND COLUMN_NAME = 'ESI_DEDUCTION';
    
    IF column_exists = 0 THEN
      EXECUTE IMMEDIATE 'ALTER TABLE HRMS_PAYROLL_DETAILS ADD (ESI_DEDUCTION NUMBER(15,2) DEFAULT 0)';
      DBMS_OUTPUT.PUT_LINE('✅ Added ESI_DEDUCTION column');
    ELSE
      DBMS_OUTPUT.PUT_LINE('ℹ️ ESI_DEDUCTION column already exists');
    END IF;
  END;
  
  -- Check and add TOTAL_EARNING column
  DECLARE
    column_exists NUMBER;
  BEGIN
    SELECT COUNT(*)
    INTO column_exists
    FROM USER_TAB_COLUMNS
    WHERE TABLE_NAME = 'HRMS_PAYROLL_DETAILS'
    AND COLUMN_NAME = 'TOTAL_EARNING';
    
    IF column_exists = 0 THEN
      EXECUTE IMMEDIATE 'ALTER TABLE HRMS_PAYROLL_DETAILS ADD (TOTAL_EARNING NUMBER(15,2) DEFAULT 0)';
      DBMS_OUTPUT.PUT_LINE('✅ Added TOTAL_EARNING column');
    ELSE
      DBMS_OUTPUT.PUT_LINE('ℹ️ TOTAL_EARNING column already exists');
    END IF;
  END;
  
  -- Check and add BASIC_EARNING column
  DECLARE
    column_exists NUMBER;
  BEGIN
    SELECT COUNT(*)
    INTO column_exists
    FROM USER_TAB_COLUMNS
    WHERE TABLE_NAME = 'HRMS_PAYROLL_DETAILS'
    AND COLUMN_NAME = 'BASIC_EARNING';
    
    IF column_exists = 0 THEN
      EXECUTE IMMEDIATE 'ALTER TABLE HRMS_PAYROLL_DETAILS ADD (BASIC_EARNING NUMBER(15,2) DEFAULT 0)';
      DBMS_OUTPUT.PUT_LINE('✅ Added BASIC_EARNING column');
    ELSE
      DBMS_OUTPUT.PUT_LINE('ℹ️ BASIC_EARNING column already exists');
    END IF;
  END;
  
  -- Check and add HRA_EARNING column
  DECLARE
    column_exists NUMBER;
  BEGIN
    SELECT COUNT(*)
    INTO column_exists
    FROM USER_TAB_COLUMNS
    WHERE TABLE_NAME = 'HRMS_PAYROLL_DETAILS'
    AND COLUMN_NAME = 'HRA_EARNING';
    
    IF column_exists = 0 THEN
      EXECUTE IMMEDIATE 'ALTER TABLE HRMS_PAYROLL_DETAILS ADD (HRA_EARNING NUMBER(15,2) DEFAULT 0)';
      DBMS_OUTPUT.PUT_LINE('✅ Added HRA_EARNING column');
    ELSE
      DBMS_OUTPUT.PUT_LINE('ℹ️ HRA_EARNING column already exists');
    END IF;
  END;
  
  -- Check and add CONVEYANCE_EARNING column
  DECLARE
    column_exists NUMBER;
  BEGIN
    SELECT COUNT(*)
    INTO column_exists
    FROM USER_TAB_COLUMNS
    WHERE TABLE_NAME = 'HRMS_PAYROLL_DETAILS'
    AND COLUMN_NAME = 'CONVEYANCE_EARNING';
    
    IF column_exists = 0 THEN
      EXECUTE IMMEDIATE 'ALTER TABLE HRMS_PAYROLL_DETAILS ADD (CONVEYANCE_EARNING NUMBER(15,2) DEFAULT 0)';
      DBMS_OUTPUT.PUT_LINE('✅ Added CONVEYANCE_EARNING column');
    ELSE
      DBMS_OUTPUT.PUT_LINE('ℹ️ CONVEYANCE_EARNING column already exists');
    END IF;
  END;
  
  -- Check and add OTHER_EARNING column
  DECLARE
    column_exists NUMBER;
  BEGIN
    SELECT COUNT(*)
    INTO column_exists
    FROM USER_TAB_COLUMNS
    WHERE TABLE_NAME = 'HRMS_PAYROLL_DETAILS'
    AND COLUMN_NAME = 'OTHER_EARNING';
    
    IF column_exists = 0 THEN
      EXECUTE IMMEDIATE 'ALTER TABLE HRMS_PAYROLL_DETAILS ADD (OTHER_EARNING NUMBER(15,2) DEFAULT 0)';
      DBMS_OUTPUT.PUT_LINE('✅ Added OTHER_EARNING column');
    ELSE
      DBMS_OUTPUT.PUT_LINE('ℹ️ OTHER_EARNING column already exists');
    END IF;
  END;
  
  -- Check and add TDS_DEDUCTION column
  DECLARE
    column_exists NUMBER;
  BEGIN
    SELECT COUNT(*)
    INTO column_exists
    FROM USER_TAB_COLUMNS
    WHERE TABLE_NAME = 'HRMS_PAYROLL_DETAILS'
    AND COLUMN_NAME = 'TDS_DEDUCTION';
    
    IF column_exists = 0 THEN
      EXECUTE IMMEDIATE 'ALTER TABLE HRMS_PAYROLL_DETAILS ADD (TDS_DEDUCTION NUMBER(15,2) DEFAULT 0)';
      DBMS_OUTPUT.PUT_LINE('✅ Added TDS_DEDUCTION column');
    ELSE
      DBMS_OUTPUT.PUT_LINE('ℹ️ TDS_DEDUCTION column already exists');
    END IF;
  END;
  
  -- Check and add TAXES_DEDUCTION column
  DECLARE
    column_exists NUMBER;
  BEGIN
    SELECT COUNT(*)
    INTO column_exists
    FROM USER_TAB_COLUMNS
    WHERE TABLE_NAME = 'HRMS_PAYROLL_DETAILS'
    AND COLUMN_NAME = 'TAXES_DEDUCTION';
    
    IF column_exists = 0 THEN
      EXECUTE IMMEDIATE 'ALTER TABLE HRMS_PAYROLL_DETAILS ADD (TAXES_DEDUCTION NUMBER(15,2) DEFAULT 0)';
      DBMS_OUTPUT.PUT_LINE('✅ Added TAXES_DEDUCTION column');
    ELSE
      DBMS_OUTPUT.PUT_LINE('ℹ️ TAXES_DEDUCTION column already exists');
    END IF;
  END;
  
  DBMS_OUTPUT.PUT_LINE('🎯 Table structure update completed successfully!');
END;
/

-- Verify the updated table structure
SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH, NULLABLE, DATA_DEFAULT
FROM USER_TAB_COLUMNS
WHERE TABLE_NAME = 'HRMS_PAYROLL_DETAILS'
ORDER BY COLUMN_ID;

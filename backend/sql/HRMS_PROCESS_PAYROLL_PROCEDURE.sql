-- =============================================
-- HRMS Month-End Payroll Processing Procedure
-- =============================================
-- This procedure handles complete payroll processing including:
-- - Multi-country payroll policies
-- - Basic salary calculations
-- - Earnings (overtime, allowances, bonuses)
-- - Deductions (statutory, advances, loans)
-- - Late/short hours penalties
-- - Tax calculations
-- - Final payroll record generation
-- =============================================

CREATE OR REPLACE PROCEDURE HRMS_PROCESS_PAYROLL(
    p_month         IN NUMBER,
    p_year          IN NUMBER,
    p_period_id     IN NUMBER,
    p_run_id        IN NUMBER,
    p_process_type  IN VARCHAR2 DEFAULT 'FULL',
    p_country_code  IN VARCHAR2 DEFAULT 'IN',
    p_user_id       IN NUMBER,
    p_result        OUT VARCHAR2
) AS
    -- Variables for processing
    v_start_date        DATE;
    v_end_date          DATE;
    v_working_days      NUMBER := 0;
    v_payroll_id        NUMBER;
    v_processed_count   NUMBER := 0;
    v_error_count       NUMBER := 0;
    v_error_message     VARCHAR2(4000);
    
    -- Employee variables
    v_basic_salary      NUMBER;
    v_gross_salary      NUMBER;
    v_net_salary        NUMBER;
    v_total_earnings    NUMBER;
    v_total_deductions  NUMBER;
    v_total_taxes       NUMBER;
    
    -- Attendance variables
    v_present_days      NUMBER;
    v_payable_days      NUMBER;
    v_work_hours        NUMBER;
    v_ot_hours          NUMBER;
    v_late_minutes      NUMBER;
    v_short_hours       NUMBER;
    
    -- Calculation variables
    v_per_day_salary    NUMBER;
    v_per_hour_salary   NUMBER;
    v_ot_rate           NUMBER;
    v_ot_amount         NUMBER;
    v_late_deduction    NUMBER;
    v_short_deduction   NUMBER;
    
    -- Country-specific variables
    v_pf_rate           NUMBER;
    v_esi_rate          NUMBER;
    v_tax_rate          NUMBER;
    v_gratuity_rate     NUMBER;
    v_air_ticket_rate   NUMBER;
    
    -- Statutory deductions
    v_pf_amount         NUMBER;
    v_esi_amount        NUMBER;
    v_tax_amount        NUMBER;
    v_gratuity_amount   NUMBER;
    v_air_ticket_amount NUMBER;
    
    -- Other deductions
    v_advance_amount    NUMBER;
    v_loan_amount       NUMBER;
    v_other_deductions  NUMBER;
    
    -- Allowances and bonuses
    v_hra_amount        NUMBER;
    v_transport_amount  NUMBER;
    v_meal_amount       NUMBER;
    v_bonus_amount      NUMBER;
    v_other_earnings    NUMBER;

BEGIN
    -- Initialize
    p_result := 'SUCCESS';
    v_start_date := TO_DATE(p_year || '-' || LPAD(p_month, 2, '0') || '-01', 'YYYY-MM-DD');
    v_end_date := LAST_DAY(v_start_date);
    
    -- Calculate working days (excluding weekends)
    SELECT COUNT(*)
    INTO v_working_days
    FROM (
        SELECT v_start_date + LEVEL - 1 as day_date
        FROM dual
        CONNECT BY LEVEL <= (v_end_date - v_start_date + 1)
    )
    WHERE TO_CHAR(day_date, 'D') NOT IN ('1', '7'); -- Exclude Sunday(1) and Saturday(7)
    
    DBMS_OUTPUT.PUT_LINE('Processing payroll for ' || TO_CHAR(v_start_date, 'YYYY-MM') || 
                        ' | Working days: ' || v_working_days);
    
    -- Loop through all active employees
    FOR emp IN (
        SELECT 
            e.EMPLOYEE_ID,
            e.EMPLOYEE_CODE,
            e.FIRST_NAME,
            e.LAST_NAME,
            e.COUNTRY_CODE,
            e.HIRE_DATE,
            ec.BASIC_SALARY,
            ec.HRA_AMOUNT,
            ec.TRANSPORT_ALLOWANCE,
            ec.MEAL_ALLOWANCE,
            ec.OTHER_ALLOWANCES,
            ec.CURRENCY_CODE,
            ec.EFFECTIVE_DATE
        FROM HRMS_EMPLOYEES e
        LEFT JOIN HRMS_EMPLOYEE_COMPENSATION ec ON e.EMPLOYEE_ID = ec.EMPLOYEE_ID
            AND ec.STATUS = 'ACTIVE'
            AND ec.EFFECTIVE_DATE = (
                SELECT MAX(ec2.EFFECTIVE_DATE)
                FROM HRMS_EMPLOYEE_COMPENSATION ec2
                WHERE ec2.EMPLOYEE_ID = e.EMPLOYEE_ID
                AND ec2.STATUS = 'ACTIVE'
                AND ec2.EFFECTIVE_DATE <= v_end_date
            )
        WHERE e.STATUS = 'ACTIVE'
        AND (p_process_type = 'FULL' OR e.COUNTRY_CODE = p_country_code)
        ORDER BY e.EMPLOYEE_CODE
    ) LOOP
        
        BEGIN
            -- Initialize employee variables
            v_basic_salary := NVL(emp.BASIC_SALARY, 0);
            v_gross_salary := 0;
            v_net_salary := 0;
            v_total_earnings := 0;
            v_total_deductions := 0;
            v_total_taxes := 0;
            
            -- Skip if no basic salary defined
            IF v_basic_salary <= 0 THEN
                DBMS_OUTPUT.PUT_LINE('Skipping employee ' || emp.EMPLOYEE_CODE || ' - No basic salary defined');
                CONTINUE;
            END IF;
            
            -- Get attendance data from summary table
            BEGIN
                SELECT 
                    NVL(FINAL_PRESENT_DAYS, PRESENT_DAYS),
                    NVL(FINAL_PAYABLE_DAYS, PAYABLE_DAYS),
                    NVL(FINAL_WORK_HOURS, TOTAL_WORK_HOURS),
                    NVL(FINAL_OT_HOURS, TOTAL_OT_HOURS),
                    NVL(FINAL_LATE_MINUTES, TOTAL_LATE_MINUTES),
                    NVL(FINAL_SHORT_HOURS, TOTAL_SHORT_HOURS)
                INTO 
                    v_present_days,
                    v_payable_days,
                    v_work_hours,
                    v_ot_hours,
                    v_late_minutes,
                    v_short_hours
                FROM HRMS_PAYROLL_ATTENDANCE_SUMMARY
                WHERE EMPLOYEE_ID = emp.EMPLOYEE_ID
                AND PERIOD_YEAR = p_year
                AND PERIOD_MONTH = p_month;
            EXCEPTION
                WHEN NO_DATA_FOUND THEN
                    -- Default attendance if no summary found
                    v_present_days := v_working_days;
                    v_payable_days := v_working_days;
                    v_work_hours := v_working_days * 8;
                    v_ot_hours := 0;
                    v_late_minutes := 0;
                    v_short_hours := 0;
            END;
            
            -- Calculate per day and per hour salary
            v_per_day_salary := v_basic_salary / 30; -- Assuming 30 days per month
            v_per_hour_salary := v_per_day_salary / 8; -- Assuming 8 hours per day
            
            -- ===========================
            -- EARNINGS CALCULATIONS
            -- ===========================
            
            -- Proportional basic salary based on payable days
            v_gross_salary := (v_basic_salary / 30) * v_payable_days;
            v_total_earnings := v_gross_salary;
            
            -- HRA (House Rent Allowance)
            v_hra_amount := NVL(emp.HRA_AMOUNT, 0);
            IF v_hra_amount = 0 THEN
                -- Default HRA calculation: 40% of basic salary for India, 25% for Gulf countries
                IF NVL(emp.COUNTRY_CODE, 'IN') = 'IN' THEN
                    v_hra_amount := v_gross_salary * 0.40;
                ELSE
                    v_hra_amount := v_gross_salary * 0.25;
                END IF;
            END IF;
            v_total_earnings := v_total_earnings + v_hra_amount;
            
            -- Transport Allowance
            v_transport_amount := NVL(emp.TRANSPORT_ALLOWANCE, 0);
            v_total_earnings := v_total_earnings + v_transport_amount;
            
            -- Meal Allowance
            v_meal_amount := NVL(emp.MEAL_ALLOWANCE, 0);
            v_total_earnings := v_total_earnings + v_meal_amount;
            
            -- Overtime calculations
            v_ot_rate := v_per_hour_salary * 1.5; -- 1.5x normal rate
            v_ot_amount := v_ot_hours * v_ot_rate;
            v_total_earnings := v_total_earnings + v_ot_amount;
            
            -- Other allowances
            v_other_earnings := NVL(emp.OTHER_ALLOWANCES, 0);
            v_total_earnings := v_total_earnings + v_other_earnings;
            
            -- Bonus calculations (quarterly bonus for Gulf countries)
            v_bonus_amount := 0;
            IF NVL(emp.COUNTRY_CODE, 'IN') != 'IN' AND MOD(p_month, 3) = 0 THEN
                v_bonus_amount := v_basic_salary * 0.083; -- 1 month salary per year / 12 months
            END IF;
            v_total_earnings := v_total_earnings + v_bonus_amount;
            
            -- ===========================
            -- DEDUCTIONS CALCULATIONS
            -- ===========================
            
            -- Get country-specific rates
            BEGIN
                SELECT 
                    NVL(PF_RATE, 0),
                    NVL(ESI_RATE, 0),
                    NVL(INCOME_TAX_RATE, 0),
                    NVL(GRATUITY_RATE, 0),
                    NVL(AIR_TICKET_RATE, 0)
                INTO 
                    v_pf_rate,
                    v_esi_rate,
                    v_tax_rate,
                    v_gratuity_rate,
                    v_air_ticket_rate
                FROM HRMS_PAYROLL_SETTINGS
                WHERE COUNTRY_CODE = NVL(emp.COUNTRY_CODE, 'IN')
                AND STATUS = 'ACTIVE';
            EXCEPTION
                WHEN NO_DATA_FOUND THEN
                    -- Default rates for India
                    v_pf_rate := 0.12;  -- 12%
                    v_esi_rate := 0.0175; -- 1.75%
                    v_tax_rate := 0.10;  -- 10%
                    v_gratuity_rate := 0.048; -- 4.8%
                    v_air_ticket_rate := 0.083; -- 8.33% (1 month per year)
            END;
            
            -- Provident Fund (PF)
            IF v_basic_salary >= 15000 OR NVL(emp.COUNTRY_CODE, 'IN') = 'IN' THEN
                v_pf_amount := LEAST(v_basic_salary * v_pf_rate, 1800); -- Max 1800 for India
            ELSE
                v_pf_amount := 0;
            END IF;
            
            -- ESI (Employee State Insurance) - Only for India
            IF NVL(emp.COUNTRY_CODE, 'IN') = 'IN' AND v_gross_salary <= 25000 THEN
                v_esi_amount := v_gross_salary * v_esi_rate;
            ELSE
                v_esi_amount := 0;
            END IF;
            
            -- Income Tax calculation
            v_tax_amount := v_total_earnings * v_tax_rate;
            
            -- Gratuity (for Gulf countries)
            IF NVL(emp.COUNTRY_CODE, 'IN') != 'IN' THEN
                v_gratuity_amount := v_basic_salary * v_gratuity_rate;
            ELSE
                v_gratuity_amount := 0;
            END IF;
            
            -- Air ticket accrual (for Gulf countries - biennial)
            IF NVL(emp.COUNTRY_CODE, 'IN') != 'IN' THEN
                v_air_ticket_amount := v_basic_salary * v_air_ticket_rate;
            ELSE
                v_air_ticket_amount := 0;
            END IF;
            
            -- Late coming deductions
            v_late_deduction := 0;
            IF v_late_minutes > 0 THEN
                -- Deduct 1 hour salary for every 60 minutes of late
                v_late_deduction := (v_late_minutes / 60) * v_per_hour_salary;
            END IF;
            
            -- Short hours deductions
            v_short_deduction := v_short_hours * v_per_hour_salary;
            
            -- Get advance deductions
            BEGIN
                SELECT NVL(SUM(
                    CASE 
                        WHEN INSTALLMENTS > 0 THEN BALANCE_AMOUNT / INSTALLMENTS
                        ELSE BALANCE_AMOUNT
                    END
                ), 0)
                INTO v_advance_amount
                FROM HRMS_ADVANCES
                WHERE EMPLOYEE_ID = emp.EMPLOYEE_ID
                AND STATUS = 'ACTIVE'
                AND BALANCE_AMOUNT > 0;
            EXCEPTION
                WHEN OTHERS THEN
                    v_advance_amount := 0;
            END;
            
            -- Get loan deductions
            BEGIN
                SELECT NVL(SUM(EMI_AMOUNT), 0)
                INTO v_loan_amount
                FROM HRMS_LOANS
                WHERE EMPLOYEE_ID = emp.EMPLOYEE_ID
                AND STATUS = 'ACTIVE'
                AND OUTSTANDING_AMOUNT > 0;
            EXCEPTION
                WHEN OTHERS THEN
                    v_loan_amount := 0;
            END;
            
            -- Get other deductions
            BEGIN
                SELECT NVL(SUM(
                    CASE 
                        WHEN IS_PERCENTAGE = 1 THEN (v_total_earnings * PERCENTAGE / 100)
                        ELSE AMOUNT
                    END
                ), 0)
                INTO v_other_deductions
                FROM HRMS_DEDUCTIONS
                WHERE EMPLOYEE_ID = emp.EMPLOYEE_ID
                AND STATUS = 'ACTIVE';
            EXCEPTION
                WHEN OTHERS THEN
                    v_other_deductions := 0;
            END;
            
            -- Calculate total deductions
            v_total_deductions := v_pf_amount + v_esi_amount + v_late_deduction + v_short_deduction + 
                                v_advance_amount + v_loan_amount + v_other_deductions + v_gratuity_amount + v_air_ticket_amount;
            
            v_total_taxes := v_tax_amount;
            
            -- Calculate net salary
            v_net_salary := v_total_earnings - v_total_deductions - v_total_taxes;
            
            -- Ensure net salary is not negative
            IF v_net_salary < 0 THEN
                v_net_salary := 0;
            END IF;
            
            -- ===========================
            -- INSERT PAYROLL RECORD
            -- ===========================
            
            -- Get next payroll ID
            SELECT HRMS_PAYROLL_DETAILS_SEQ.NEXTVAL INTO v_payroll_id FROM DUAL;
            
            -- Insert main payroll record
            INSERT INTO HRMS_PAYROLL_DETAILS (
                PAYROLL_ID, PERIOD_ID, EMPLOYEE_ID, RUN_ID,
                BASIC_SALARY, HRA_SALARY, CONVEYANCE_SALARY, OTHER_SALARY, TOTAL_SALARY,
                PAYABLE_DAYS, WORK_DAYS, ABSENT_DAYS, LEAVE_DAYS,
                BASIC_EARNING, HRA_EARNING, CONVEYANCE_EARNING, OTHER_EARNING,
                OVERTIME_HOURS, OVERTIME_EARNING, BONUS_EARNING, TOTAL_EARNING,
                FP_BASIC_EARNING,
                ESI_DEDUCTION, PF_DEDUCTION, TDS_DEDUCTION, TAXES_DEDUCTION,
                ADVANCE_DEDUCTION, LOAN_DEDUCTION, 
                LATE_DAYS, LATE_DEDUCTION, OTHER_DEDUCTION, TOTAL_DEDUCTION,
                NET_SALARY, STATUS, CREATED_BY
            ) VALUES (
                v_payroll_id, p_period_id, emp.EMPLOYEE_ID, p_run_id,
                v_basic_salary, v_hra_amount, v_transport_amount, v_other_earnings, v_gross_salary,
                v_payable_days, v_working_days, (v_working_days - v_payable_days), 0,
                v_basic_earning, v_hra_earning, v_transport_earning, v_other_actual_earnings,
                v_ot_hours, v_ot_amount, v_bonus_amount, v_total_earnings,
                v_basic_earning,
                v_esi_amount, v_pf_amount, v_tax_amount, v_total_taxes,
                v_advance_amount, v_loan_amount,
                CEIL(v_late_minutes / 60), v_late_deduction, v_other_deductions, v_total_deductions,
                v_net_salary, 'CALCULATED', p_user_id
            );
            
            -- Insert earnings breakdown
            IF v_basic_salary > 0 THEN
                INSERT INTO HRMS_PAYROLL_EARNINGS (EARNING_ID, PAYROLL_ID, EARNING_TYPE, AMOUNT, DESCRIPTION)
                VALUES (HRMS_PAYROLL_EARNINGS_SEQ.NEXTVAL, v_payroll_id, 'BASIC', v_basic_salary, 'Basic Salary');
            END IF;
            
            IF v_hra_amount > 0 THEN
                INSERT INTO HRMS_PAYROLL_EARNINGS (EARNING_ID, PAYROLL_ID, EARNING_TYPE, AMOUNT, DESCRIPTION)
                VALUES (HRMS_PAYROLL_EARNINGS_SEQ.NEXTVAL, v_payroll_id, 'HRA', v_hra_amount, 'House Rent Allowance');
            END IF;
            
            IF v_transport_amount > 0 THEN
                INSERT INTO HRMS_PAYROLL_EARNINGS (EARNING_ID, PAYROLL_ID, EARNING_TYPE, AMOUNT, DESCRIPTION)
                VALUES (HRMS_PAYROLL_EARNINGS_SEQ.NEXTVAL, v_payroll_id, 'TA', v_transport_amount, 'Transport Allowance');
            END IF;
            
            IF v_ot_amount > 0 THEN
                INSERT INTO HRMS_PAYROLL_EARNINGS (EARNING_ID, PAYROLL_ID, EARNING_TYPE, AMOUNT, RATE, HOURS, DESCRIPTION)
                VALUES (HRMS_PAYROLL_EARNINGS_SEQ.NEXTVAL, v_payroll_id, 'OVERTIME', v_ot_amount, v_ot_rate, v_ot_hours, 'Overtime Payment');
            END IF;
            
            IF v_bonus_amount > 0 THEN
                INSERT INTO HRMS_PAYROLL_EARNINGS (EARNING_ID, PAYROLL_ID, EARNING_TYPE, AMOUNT, DESCRIPTION)
                VALUES (HRMS_PAYROLL_EARNINGS_SEQ.NEXTVAL, v_payroll_id, 'BONUS', v_bonus_amount, 'Quarterly Bonus');
            END IF;
            
            -- Insert deductions breakdown
            IF v_pf_amount > 0 THEN
                INSERT INTO HRMS_PAYROLL_DEDUCTIONS (DEDUCTION_ID, PAYROLL_ID, DEDUCTION_TYPE, AMOUNT, RATE, DESCRIPTION)
                VALUES (HRMS_PAYROLL_DEDUCTIONS_SEQ.NEXTVAL, v_payroll_id, 'PF', v_pf_amount, v_pf_rate, 'Provident Fund');
            END IF;
            
            IF v_esi_amount > 0 THEN
                INSERT INTO HRMS_PAYROLL_DEDUCTIONS (DEDUCTION_ID, PAYROLL_ID, DEDUCTION_TYPE, AMOUNT, RATE, DESCRIPTION)
                VALUES (HRMS_PAYROLL_DEDUCTIONS_SEQ.NEXTVAL, v_payroll_id, 'ESI', v_esi_amount, v_esi_rate, 'Employee State Insurance');
            END IF;
            
            IF v_tax_amount > 0 THEN
                INSERT INTO HRMS_PAYROLL_DEDUCTIONS (DEDUCTION_ID, PAYROLL_ID, DEDUCTION_TYPE, AMOUNT, RATE, DESCRIPTION)
                VALUES (HRMS_PAYROLL_DEDUCTIONS_SEQ.NEXTVAL, v_payroll_id, 'TAX', v_tax_amount, v_tax_rate, 'Income Tax');
            END IF;
            
            IF v_late_deduction > 0 THEN
                INSERT INTO HRMS_PAYROLL_DEDUCTIONS (DEDUCTION_ID, PAYROLL_ID, DEDUCTION_TYPE, AMOUNT, DESCRIPTION)
                VALUES (HRMS_PAYROLL_DEDUCTIONS_SEQ.NEXTVAL, v_payroll_id, 'LATE', v_late_deduction, 'Late Coming Penalty');
            END IF;
            
            IF v_advance_amount > 0 THEN
                INSERT INTO HRMS_PAYROLL_DEDUCTIONS (DEDUCTION_ID, PAYROLL_ID, DEDUCTION_TYPE, AMOUNT, DESCRIPTION)
                VALUES (HRMS_PAYROLL_DEDUCTIONS_SEQ.NEXTVAL, v_payroll_id, 'ADVANCE', v_advance_amount, 'Advance Deduction');
            END IF;
            
            IF v_loan_amount > 0 THEN
                INSERT INTO HRMS_PAYROLL_DEDUCTIONS (DEDUCTION_ID, PAYROLL_ID, DEDUCTION_TYPE, AMOUNT, DESCRIPTION)
                VALUES (HRMS_PAYROLL_DEDUCTIONS_SEQ.NEXTVAL, v_payroll_id, 'LOAN', v_loan_amount, 'Loan EMI');
            END IF;
            
            IF v_gratuity_amount > 0 THEN
                INSERT INTO HRMS_PAYROLL_DEDUCTIONS (DEDUCTION_ID, PAYROLL_ID, DEDUCTION_TYPE, AMOUNT, RATE, DESCRIPTION)
                VALUES (HRMS_PAYROLL_DEDUCTIONS_SEQ.NEXTVAL, v_payroll_id, 'OTHER', v_gratuity_amount, v_gratuity_rate, 'Gratuity Accrual');
            END IF;
            
            IF v_air_ticket_amount > 0 THEN
                INSERT INTO HRMS_PAYROLL_DEDUCTIONS (DEDUCTION_ID, PAYROLL_ID, DEDUCTION_TYPE, AMOUNT, RATE, DESCRIPTION)
                VALUES (HRMS_PAYROLL_DEDUCTIONS_SEQ.NEXTVAL, v_payroll_id, 'OTHER', v_air_ticket_amount, v_air_ticket_rate, 'Air Ticket Accrual');
            END IF;
            
            v_processed_count := v_processed_count + 1;
            
            DBMS_OUTPUT.PUT_LINE('Processed: ' || emp.EMPLOYEE_CODE || ' | Basic: ' || v_basic_salary || 
                               ' | Gross: ' || ROUND(v_total_earnings, 2) || ' | Net: ' || ROUND(v_net_salary, 2));
            
        EXCEPTION
            WHEN OTHERS THEN
                v_error_count := v_error_count + 1;
                v_error_message := SQLERRM;
                
                DBMS_OUTPUT.PUT_LINE('ERROR processing employee ' || emp.EMPLOYEE_CODE || ': ' || v_error_message);
                
                -- Log error (you can create an error log table)
                -- INSERT INTO HRMS_PAYROLL_ERRORS (EMPLOYEE_ID, ERROR_MESSAGE, CREATED_AT)
                -- VALUES (emp.EMPLOYEE_ID, v_error_message, SYSTIMESTAMP);
                
                CONTINUE; -- Continue with next employee
        END;
        
    END LOOP;
    
    -- Final result
    IF v_error_count > 0 THEN
        p_result := 'COMPLETED_WITH_ERRORS: Processed ' || v_processed_count || ' employees, ' || v_error_count || ' errors';
    ELSE
        p_result := 'SUCCESS: Processed ' || v_processed_count || ' employees successfully';
    END IF;
    
    DBMS_OUTPUT.PUT_LINE('Payroll processing completed: ' || p_result);
    
EXCEPTION
    WHEN OTHERS THEN
        p_result := 'ERROR: ' || SQLERRM;
        DBMS_OUTPUT.PUT_LINE('FATAL ERROR: ' || p_result);
        RAISE;
END HRMS_PROCESS_PAYROLL;
/

-- Grant execute permissions
-- GRANT EXECUTE ON HRMS_PROCESS_PAYROLL TO your_app_user;

-- Example usage:
-- DECLARE
--     v_result VARCHAR2(4000);
-- BEGIN
--     HRMS_PROCESS_PAYROLL(
--         p_month => 8,
--         p_year => 2025,
--         p_period_id => 66,
--         p_run_id => 123,
--         p_process_type => 'FULL',
--         p_country_code => 'IN',
--         p_user_id => 1,
--         p_result => v_result
--     );
--     DBMS_OUTPUT.PUT_LINE('Result: ' || v_result);
-- END;
-- /

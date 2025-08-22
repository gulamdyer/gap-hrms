# Employee Ledger System - Comprehensive Guide

## Overview

The Employee Ledger System is a comprehensive financial tracking solution that automatically records all monetary transactions for employees. It provides real-time balance tracking, transaction history, and detailed reporting capabilities.

## Features

### 🔄 Automatic Transaction Recording
- **Advances**: Automatically creates debit entries when advances are given
- **Loans**: Records loan amounts as debit entries
- **Deductions**: Tracks all deduction types as debit entries
- **Payroll**: Records salary payments as credit entries
- **Bonuses**: Tracks bonus payments as credit entries
- **Allowances**: Records allowance payments as credit entries

### 📊 Real-time Balance Tracking
- Current balance calculation for each employee
- Running balance after each transaction
- Credit and debit summaries
- Transaction count tracking

### 🎯 Advanced Filtering & Search
- Search by employee name or code
- Filter by transaction type
- Date range filtering
- Department-based filtering
- Period-based filtering

### 📈 Comprehensive Reporting
- Employee ledger summaries
- Detailed transaction history
- Export functionality (Excel)
- Print-friendly reports
- Balance trend analysis

## Database Schema

### HRMS_LEDGER Table

```sql
CREATE TABLE HRMS_LEDGER (
  LEDGER_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  EMPLOYEE_ID NUMBER NOT NULL,
  TRANSACTION_DATE DATE DEFAULT SYSDATE NOT NULL,
  TRANSACTION_TYPE VARCHAR2(50) NOT NULL CHECK (
    TRANSACTION_TYPE IN ('ADVANCE', 'LOAN', 'DEDUCTION', 'PAYROLL', 'BONUS', 'ALLOWANCE', 'REFUND', 'ADJUSTMENT')
  ),
  DEBIT_AMOUNT NUMBER(15,2) DEFAULT 0,
  CREDIT_AMOUNT NUMBER(15,2) DEFAULT 0,
  BALANCE NUMBER(15,2) NOT NULL,
  REFERENCE_ID NUMBER,
  REFERENCE_TYPE VARCHAR2(50),
  REFERENCE_DESCRIPTION VARCHAR2(500),
  PERIOD_MONTH VARCHAR2(7),
  PERIOD_YEAR NUMBER(4),
  STATUS VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (STATUS IN ('ACTIVE', 'CANCELLED', 'REVERSED')),
  CREATED_BY NUMBER NOT NULL,
  CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Key Constraints
  CONSTRAINT FK_LEDGER_EMPLOYEE FOREIGN KEY (EMPLOYEE_ID) REFERENCES HRMS_EMPLOYEES(EMPLOYEE_ID),
  CONSTRAINT FK_LEDGER_CREATED_BY FOREIGN KEY (CREATED_BY) REFERENCES HRMS_USERS(USER_ID),
  
  -- Check constraint to ensure either debit or credit is set, not both
  CONSTRAINT CHK_LEDGER_AMOUNT CHECK (
    (DEBIT_AMOUNT > 0 AND CREDIT_AMOUNT = 0) OR 
    (CREDIT_AMOUNT > 0 AND DEBIT_AMOUNT = 0)
  )
);
```

## API Endpoints

### Ledger Management

#### Get All Employees Ledger Summary
```
GET /api/ledger/employees
```
**Query Parameters:**
- `page` (number): Page number for pagination
- `limit` (number): Number of records per page
- `search` (string): Search by employee name or code
- `departmentId` (number): Filter by department
- `transactionType` (string): Filter by transaction type
- `startDate` (string): Filter by start date (YYYY-MM-DD)
- `endDate` (string): Filter by end date (YYYY-MM-DD)

#### Get Employee Ledger Details
```
GET /api/ledger/employees/:employeeId
```
**Query Parameters:**
- `page` (number): Page number for pagination
- `limit` (number): Number of records per page
- `transactionType` (string): Filter by transaction type
- `startDate` (string): Filter by start date
- `endDate` (string): Filter by end date
- `periodMonth` (string): Filter by period month (YYYY-MM)

#### Get Employee Ledger Summary
```
GET /api/ledger/employees/:employeeId/summary
```

#### Get Transaction Types
```
GET /api/ledger/transaction-types
```

#### Create Manual Ledger Entry
```
POST /api/ledger/entries
```
**Request Body:**
```json
{
  "employeeId": 1,
  "transactionType": "ADJUSTMENT",
  "debitAmount": 1000,
  "creditAmount": 0,
  "referenceDescription": "Manual adjustment",
  "periodMonth": "2024-01",
  "periodYear": 2024
}
```

#### Reverse Ledger Entry
```
POST /api/ledger/entries/:ledgerId/reverse
```
**Request Body:**
```json
{
  "reason": "Correction of incorrect entry"
}
```

## Frontend Components

### LedgerList Component
- **Location**: `frontend/src/pages/LedgerList.jsx`
- **Purpose**: Displays all employees with their ledger summaries
- **Features**:
  - Search and filtering capabilities
  - Statistics cards showing totals
  - Export and print functionality
  - Pagination support
  - Responsive design

### LedgerDetail Component
- **Location**: `backend/src/pages/LedgerDetail.jsx`
- **Purpose**: Shows detailed transaction history for a specific employee
- **Features**:
  - Individual employee summary
  - Transaction history with filters
  - Balance tracking
  - Export and print functionality
  - Transaction type indicators

## Automatic Transaction Recording

### Advance Transactions
When an advance is created:
```javascript
// In Advance.js create method
const ledgerData = {
  employeeId: advanceData.employeeId,
  transactionType: 'ADVANCE',
  debitAmount: advanceData.amount,
  creditAmount: 0,
  referenceId: advanceId,
  referenceType: 'ADVANCE',
  referenceDescription: `${advanceData.advanceType} Advance - ${advanceData.reason}`,
  periodMonth: advanceData.deductionMonth,
  createdBy: advanceData.createdBy
};
await Ledger.createEntry(ledgerData);
```

### Loan Transactions
When a loan is created:
```javascript
// In Loan.js create method
const ledgerData = {
  employeeId: loanData.employeeId,
  transactionType: 'LOAN',
  debitAmount: loanData.loanAmount,
  creditAmount: 0,
  referenceId: loanId,
  referenceType: 'LOAN',
  referenceDescription: `${loanData.loanType} Loan - ${loanData.reason}`,
  createdBy: loanData.createdBy
};
await Ledger.createEntry(ledgerData);
```

### Deduction Transactions
When a deduction is created:
```javascript
// In Deduction.js create method
const ledgerData = {
  employeeId: deductionData.employeeId,
  transactionType: 'DEDUCTION',
  debitAmount: deductionData.amount,
  creditAmount: 0,
  referenceId: deductionId,
  referenceType: 'DEDUCTION',
  referenceDescription: `${deductionData.deductionType} - ${deductionData.reason}`,
  periodMonth: deductionData.effectiveFromMonth,
  createdBy: deductionData.appliedBy
};
await Ledger.createEntry(ledgerData);
```

### Payroll Transactions
When payroll is processed:
```javascript
// In Payroll.js createPayrollDetail method
const ledgerData = {
  employeeId: payrollData.employeeId,
  transactionType: 'PAYROLL',
  debitAmount: 0,
  creditAmount: payrollData.netSalary,
  referenceId: payrollId,
  referenceType: 'PAYROLL',
  referenceDescription: `Payroll for ${periodName} - Net Salary`,
  periodMonth: periodName,
  createdBy: payrollData.createdBy
};
await Ledger.createEntry(ledgerData);
```

## Balance Calculation

The system automatically calculates running balances:

```javascript
// Get current balance
const currentBalance = await Ledger.getCurrentBalance(employeeId);

// Calculate new balance
const newBalance = currentBalance + creditAmount - debitAmount;

// Store with transaction
await Ledger.createEntry({
  ...transactionData,
  balance: newBalance
});
```

## Transaction Types

| Type | Description | Debit/Credit | Auto-Generated |
|------|-------------|--------------|----------------|
| ADVANCE | Salary advances | Debit | ✅ |
| LOAN | Employee loans | Debit | ✅ |
| DEDUCTION | Various deductions | Debit | ✅ |
| PAYROLL | Salary payments | Credit | ✅ |
| BONUS | Bonus payments | Credit | ✅ |
| ALLOWANCE | Allowance payments | Credit | ✅ |
| REFUND | Refund payments | Credit | ❌ |
| ADJUSTMENT | Manual adjustments | Both | ❌ |

## Usage Examples

### 1. View All Employee Ledgers
Navigate to: `http://localhost:3000/ledger`

### 2. View Specific Employee Ledger
Navigate to: `http://localhost:3000/ledger/employees/{employeeId}`

### 3. Create Manual Entry
```javascript
const response = await api.post('/ledger/entries', {
  employeeId: 1,
  transactionType: 'ADJUSTMENT',
  debitAmount: 500,
  referenceDescription: 'Manual adjustment for late fee'
});
```

### 4. Export Ledger Data
```javascript
const response = await api.get('/ledger/export?format=excel&employeeId=1');
```

## Setup Instructions

### 1. Database Setup
```bash
# Run the setup script
cd backend
node setup.js
```

### 2. Start the Application
```bash
# Start backend
cd backend
npm run dev

# Start frontend
cd frontend
npm start
```

### 3. Access the Ledger
- Navigate to: `http://localhost:3000/ledger`
- Login with your credentials
- Start exploring employee ledgers

## Best Practices

### 1. Regular Reconciliation
- Review ledger balances monthly
- Cross-check with payroll reports
- Verify automatic entries

### 2. Manual Entries
- Use manual entries sparingly
- Always provide clear descriptions
- Document reasons for adjustments

### 3. Data Export
- Export data regularly for backup
- Use exports for external reporting
- Maintain audit trails

### 4. User Permissions
- Restrict manual entry creation to authorized users
- Implement approval workflows for large adjustments
- Log all manual entries

## Troubleshooting

### Common Issues

#### 1. Balance Mismatch
**Problem**: Employee balance doesn't match expected amount
**Solution**: 
- Check for missing transactions
- Verify automatic entry creation
- Review manual adjustments

#### 2. Missing Transactions
**Problem**: Expected transactions not appearing
**Solution**:
- Check if related records exist (advance, loan, etc.)
- Verify automatic entry creation in models
- Check database constraints

#### 3. Performance Issues
**Problem**: Slow loading of ledger data
**Solution**:
- Implement pagination
- Add database indexes
- Optimize queries

### Debug Commands

```bash
# Check ledger table structure
SELECT * FROM HRMS_LEDGER WHERE ROWNUM <= 5;

# Check employee balance
SELECT EMPLOYEE_ID, SUM(CREDIT_AMOUNT - DEBIT_AMOUNT) as BALANCE 
FROM HRMS_LEDGER 
WHERE EMPLOYEE_ID = 1 AND STATUS = 'ACTIVE';

# Check transaction types
SELECT DISTINCT TRANSACTION_TYPE FROM HRMS_LEDGER;
```

## Future Enhancements

### Planned Features
1. **Multi-currency Support**: Support for different currencies
2. **Advanced Reporting**: Charts and analytics
3. **Workflow Integration**: Approval processes for adjustments
4. **Audit Trail**: Detailed logging of all changes
5. **API Rate Limiting**: Protect against abuse
6. **Real-time Notifications**: Balance change alerts

### Technical Improvements
1. **Caching**: Implement Redis for better performance
2. **Batch Processing**: Handle large data imports
3. **Data Archiving**: Move old transactions to archive tables
4. **Backup Strategy**: Automated backup procedures

## Support

For technical support or questions about the Employee Ledger System:

1. Check the troubleshooting section above
2. Review the API documentation
3. Examine the database schema
4. Contact the development team

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Maintained By**: BOLTO HRMS Development Team

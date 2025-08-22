# 💱 Currency Configuration Guide

This guide explains how to configure and use the centralized currency system in the GAP HRMS application.

## 🎯 Overview

The GAP HRMS application now supports dynamic currency configuration that can be changed from a single location and will display throughout the entire application. This allows you to easily switch between different currencies (e.g., Indian Rupee to UAE Dirham) without modifying code.

## 🔧 Configuration

### Backend Configuration

1. **Environment Variables**
   Add these variables to your `.env` file:
   ```env
   # Currency Configuration
   CURRENCY_SYMBOL=₹
   CURRENCY_CODE=INR
   CURRENCY_NAME=Indian Rupee
   ```

2. **API Endpoint**
   The currency configuration is available via:
   ```
   GET /api/settings/currency-config
   ```

### Frontend Configuration

1. **Currency Utility**
   The currency utility is located at `frontend/src/utils/currency.js`

2. **Usage in Components**
   ```javascript
   import currencyConfig from '../utils/currency';
   
   // Get currency symbol
   const symbol = currencyConfig.getSymbol(); // Returns '₹'
   
   // Format amount with symbol
   const formatted = currencyConfig.formatAmount(1234.56); // Returns '₹1,235'
   
   // Format amount without symbol
   const formattedNoSymbol = currencyConfig.formatAmount(1234.56, false); // Returns '1,235'
   
   // Format with currency code
   const formattedWithCode = currencyConfig.formatAmountWithCode(1234.56); // Returns '₹1,235 (INR)'
   ```

## 🌍 Supported Currencies

### Indian Rupee (Default)
```env
CURRENCY_SYMBOL=₹
CURRENCY_CODE=INR
CURRENCY_NAME=Indian Rupee
```

### UAE Dirham
```env
CURRENCY_SYMBOL=د.إ
CURRENCY_CODE=AED
CURRENCY_NAME=UAE Dirham
```

### US Dollar
```env
CURRENCY_SYMBOL=$
CURRENCY_CODE=USD
CURRENCY_NAME=US Dollar
```

### Euro
```env
CURRENCY_SYMBOL=€
CURRENCY_CODE=EUR
CURRENCY_NAME=Euro
```

### British Pound
```env
CURRENCY_SYMBOL=£
CURRENCY_CODE=GBP
CURRENCY_NAME=British Pound
```

## 📋 Implementation Details

### Backend Implementation

1. **Environment Variables** (`backend/env.example`)
   - `CURRENCY_SYMBOL`: The currency symbol (e.g., ₹, $, €)
   - `CURRENCY_CODE`: The ISO currency code (e.g., INR, USD, EUR)
   - `CURRENCY_NAME`: The full currency name

2. **API Controller** (`backend/controllers/settingsController.js`)
   ```javascript
   const getCurrencyConfig = async (req, res) => {
     const currencyConfig = {
       symbol: process.env.CURRENCY_SYMBOL || '₹',
       code: process.env.CURRENCY_CODE || 'INR',
       name: process.env.CURRENCY_NAME || 'Indian Rupee'
     };
     res.json({ success: true, data: currencyConfig });
   };
   ```

3. **API Route** (`backend/routes/settings.js`)
   ```javascript
   router.get('/currency-config', settingsController.getCurrencyConfig);
   ```

### Frontend Implementation

1. **Currency Utility** (`frontend/src/utils/currency.js`)
   - Singleton class for currency configuration
   - Automatic initialization from backend
   - Fallback to default values if backend is unavailable

2. **API Service** (`frontend/src/services/api.js`)
   ```javascript
   getCurrencyConfig: async () => {
     const response = await api.get('/api/settings/currency-config');
     return response.data;
   }
   ```

## 🔄 How to Change Currency

### Step 1: Update Environment Variables
Edit your `.env` file:
```env
# For UAE Dirham
CURRENCY_SYMBOL=د.إ
CURRENCY_CODE=AED
CURRENCY_NAME=UAE Dirham

# For US Dollar
CURRENCY_SYMBOL=$
CURRENCY_CODE=USD
CURRENCY_NAME=US Dollar
```

### Step 2: Restart Backend Server
```bash
cd backend
npm run dev
```

### Step 3: Refresh Frontend
The frontend will automatically fetch the new currency configuration when it loads.

## 📊 Updated Components

The following components have been updated to use the dynamic currency system:

### Employee Management
- ✅ `EmployeeDetail.jsx` - Compensation display
- ✅ `EmployeeOnboarding.jsx` - Salary calculations

### Payroll Management
- ✅ `PayrollPeriodDetails.jsx` - Amount formatting
- ✅ `PayrollPeriodDetail.jsx` - Amount formatting
- ✅ `PayrollDetail.jsx` - Amount formatting

### Settings Management
- ✅ `PayGradeList.jsx` - Salary range display
- ✅ `PayGradeForm.jsx` - Salary input labels
- ✅ `PayGradeDetail.jsx` - Salary formatting

### Financial Management
- ✅ `LoanForm.jsx` - Loan amount labels
- ✅ `AdvanceForm.jsx` - Advance amount labels
- ✅ `DeductionForm.jsx` - Deduction amount labels

## 🧪 Testing

### Test Currency Configuration
```bash
node test-currency-config.js
```

### Manual Testing
1. **Change Currency**: Update `.env` file with new currency
2. **Restart Backend**: `npm run dev` in backend directory
3. **Refresh Frontend**: Reload the application
4. **Verify Changes**: Check various pages for currency symbol updates

### Test Cases
- ✅ Employee detail page shows correct currency
- ✅ Payroll pages display amounts with correct symbol
- ✅ Form labels show correct currency symbol
- ✅ Settings pages display salary ranges correctly
- ✅ Financial forms show correct currency labels

## 🔍 Verification Checklist

After changing the currency configuration, verify:

- [ ] **Backend Health Check**: `GET /health` returns success
- [ ] **Currency API**: `GET /api/settings/currency-config` returns new values
- [ ] **Employee Pages**: Compensation amounts show new symbol
- [ ] **Payroll Pages**: All amounts display with new symbol
- [ ] **Form Labels**: Input labels show new currency symbol
- [ ] **Settings Pages**: Salary ranges display with new symbol
- [ ] **Financial Forms**: Amount fields show new currency symbol

## 🚨 Troubleshooting

### Common Issues

1. **Currency Symbol Not Updating**
   - Check if backend server is restarted
   - Verify `.env` file has correct values
   - Clear browser cache and refresh

2. **API Error**
   - Check backend server is running
   - Verify API endpoint is accessible
   - Check network connectivity

3. **Fallback to Default**
   - If backend is unavailable, frontend uses default ₹ symbol
   - Check backend logs for errors
   - Verify database connection

### Debug Commands

```bash
# Test backend currency API
curl http://localhost:5000/api/settings/currency-config

# Check environment variables
node -e "console.log('Symbol:', process.env.CURRENCY_SYMBOL)"

# Test frontend currency utility
# Open browser console and run:
# currencyConfig.getSymbol()
```

## 📈 Benefits

1. **Centralized Configuration**: Change currency in one place
2. **Consistent Display**: Same symbol across all components
3. **Easy Maintenance**: No need to update multiple files
4. **International Support**: Support for any currency symbol
5. **Fallback Safety**: Default values if configuration fails
6. **Real-time Updates**: Changes take effect immediately

## 🎉 Success Criteria

Your currency configuration is working correctly when:

1. ✅ **Environment Variables**: Set correctly in `.env` file
2. ✅ **Backend API**: Returns correct currency configuration
3. ✅ **Frontend Display**: All pages show new currency symbol
4. ✅ **Form Labels**: Input fields show correct currency
5. ✅ **Amount Formatting**: Numbers display with correct symbol
6. ✅ **Consistency**: Same symbol across entire application

---

**🎯 Your GAP HRMS application now supports dynamic currency configuration!**
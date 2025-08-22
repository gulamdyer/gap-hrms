# Date Handling Guide for GAP HRMS Project

## 📅 Date Format Standards

### Frontend Display Format
- **Display Format**: `DD-MM-YYYY` (e.g., 25-12-1990)
- **Input Type**: Text input (not HTML date input)
- **Placeholder**: `DD-MM-YYYY (e.g., 25-12-1990)`
- **Max Length**: 10 characters

### Backend Storage Format
- **Database Format**: `YYYY-MM-DD` (Oracle DATE type)
- **API Format**: `YYYY-MM-DD` (ISO 8601 date format)
- **Oracle Query**: `TO_DATE(:dateString, 'YYYY-MM-DD')`

## 🔄 Date Conversion Functions

### Frontend Helper Functions

```javascript
// Convert any date format to DD-MM-YYYY for display
const convertToDDMMYYYY = (dateString) => {
  if (!dateString || dateString === '') return '';
  
  // If already in DD-MM-YYYY format, return as is
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
    return dateString;
  }
  
  // If in YYYY-MM-DD format, convert to DD-MM-YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  }
  
  // If in MM-DD-YYYY format, convert to DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
    const [month, day, year] = dateString.split('-');
    return `${day}-${month}-${year}`;
  }
  
  // Try to parse other formats
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
  }
  
  return '';
};

// Convert DD-MM-YYYY to YYYY-MM-DD for backend
const convertToYYYYMMDD = (dateString) => {
  if (!dateString || dateString === '') return null;
  
  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // If in DD-MM-YYYY format, convert to YYYY-MM-DD
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split('-');
    return `${year}-${month}-${day}`;
  }
  
  // If in MM-DD-YYYY format, convert to YYYY-MM-DD
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
    const [month, day, year] = dateString.split('-');
    return `${year}-${month}-${day}`;
  }
  
  // Try to parse other formats
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
  }
  
  return null;
};
```

### Date Validation Function

```javascript
// Validate DD-MM-YYYY format with proper date logic
const validateDateFormat = (dateString) => {
  if (!dateString || dateString === '') return true; // Empty is valid
  
  // Check if it matches DD-MM-YYYY format
  const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
  const match = dateString.match(dateRegex);
  
  if (!match) return false;
  
  const [, day, month, year] = match;
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);
  
  // Basic validation
  if (monthNum < 1 || monthNum > 12) return false;
  if (dayNum < 1 || dayNum > 31) return false;
  if (yearNum < 1900 || yearNum > 2100) return false;
  
  // Check for valid days in each month
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  // Handle leap years
  if (monthNum === 2 && yearNum % 4 === 0 && (yearNum % 100 !== 0 || yearNum % 400 === 0)) {
    daysInMonth[1] = 29;
  }
  
  return dayNum <= daysInMonth[monthNum - 1];
};
```

### Input Change Handler for Date Fields

```javascript
const handleInputChange = (field, value) => {
  // Special handling for date fields
  if (['dateOfBirth', 'dateOfJoining', 'confirmDate'].includes(field)) {
    // Allow only digits and hyphens
    const cleanedValue = value.replace(/[^\d-]/g, '');
    
    // Auto-format as user types
    let formattedValue = cleanedValue;
    if (cleanedValue.length >= 2 && !cleanedValue.includes('-')) {
      formattedValue = cleanedValue.slice(0, 2) + '-' + cleanedValue.slice(2);
    }
    if (formattedValue.length >= 5 && formattedValue.split('-').length === 2) {
      formattedValue = formattedValue.slice(0, 5) + '-' + formattedValue.slice(5);
    }
    
    // Validate the date format
    if (formattedValue.length === 10 && !validateDateFormat(formattedValue)) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: 'Please enter a valid date in DD-MM-YYYY format'
      }));
    } else if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  } else {
    // Handle non-date fields normally
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }
};
```

## 🎯 Implementation Checklist

### Frontend Components
- [ ] Use text input instead of `type="date"`
- [ ] Add placeholder with format example: `DD-MM-YYYY (e.g., 25-12-1990)`
- [ ] Set `maxLength={10}` for date inputs
- [ ] Implement auto-formatting as user types
- [ ] Add real-time validation with `validateDateFormat()`
- [ ] Convert display format to backend format before submission
- [ ] Convert backend format to display format when loading data

### Backend Models
- [ ] Use `formatDateForOracle()` function for date conversion
- [ ] Use `TO_DATE(:dateString, 'YYYY-MM-DD')` in Oracle queries
- [ ] Handle null/empty date values properly
- [ ] Log date conversion for debugging

### API Endpoints
- [ ] Accept dates in YYYY-MM-DD format
- [ ] Return dates in YYYY-MM-DD format
- [ ] Validate date format on backend
- [ ] Handle date parsing errors gracefully

## 📝 Date Fields in GAP HRMS

### Employee Module
- `dateOfBirth` - Date of Birth
- `dateOfJoining` - Date of Joining
- `confirmDate` - Confirmation Date

### Leave Module (Future)
- `startDate` - Leave Start Date
- `endDate` - Leave End Date
- `appliedDate` - Date Applied

### Attendance Module (Future)
- `attendanceDate` - Attendance Date
- `checkInTime` - Check-in Time
- `checkOutTime` - Check-out Time

### Payroll Module (Future)
- `payPeriodStart` - Pay Period Start
- `payPeriodEnd` - Pay Period End
- `paymentDate` - Payment Date

## 🔧 Backend Date Helper Function

```javascript
// Backend date formatting for Oracle
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
```

## 🚨 Common Issues and Solutions

### Issue: Date not saving to database
**Solution**: Ensure date is converted to YYYY-MM-DD format before sending to backend

### Issue: Date displaying incorrectly
**Solution**: Use `convertToDDMMYYYY()` when loading data from backend

### Issue: Date validation errors
**Solution**: Check if date format matches DD-MM-YYYY pattern and validate date logic

### Issue: Oracle date format errors (ORA-01861)
**Solution**: Ensure backend receives dates in YYYY-MM-DD format for TO_DATE function

## 📋 Testing Checklist

- [ ] Create new employee with valid dates
- [ ] Edit existing employee and update dates
- [ ] Test with various date formats (DD-MM-YYYY, YYYY-MM-DD, MM-DD-YYYY)
- [ ] Test with invalid dates (31-02-2024, 32-13-2024)
- [ ] Test with empty date fields
- [ ] Verify dates display correctly in DD-MM-YYYY format
- [ ] Verify dates save correctly in database
- [ ] Test date validation error messages

## 🎯 Best Practices

1. **Consistency**: Always use DD-MM-YYYY for display and YYYY-MM-DD for backend
2. **Validation**: Validate dates both on frontend and backend
3. **User Experience**: Auto-format dates as user types
4. **Error Handling**: Provide clear error messages for invalid dates
5. **Logging**: Log date conversions for debugging
6. **Documentation**: Keep this guide updated as new date fields are added

---

**Last Updated**: January 2024  
**Version**: 1.0  
**Maintained By**: GAP HRMS Development Team 
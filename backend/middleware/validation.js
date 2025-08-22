const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// Login validation rules
const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  handleValidationErrors
];

// Registration validation rules
const validateRegistration = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  
  body('role')
    .optional()
    .isIn(['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'])
    .withMessage('Invalid role specified'),
  
  handleValidationErrors
];

// Password change validation
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('confirmPassword')
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
  
  handleValidationErrors
];

// User update validation
const validateUserUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('role')
    .optional()
    .isIn(['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'])
    .withMessage('Invalid role specified'),
  
  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
    .withMessage('Invalid status specified'),
  
  handleValidationErrors
];

// Generic validation request handler
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    console.log('❌ Validation errors detected:');
    console.log('Request body:', req.body);
    console.log('Validation errors:', errors.array());
    
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    console.log('Formatted errors:', formattedErrors);
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
  
  next();
};

// Advance validation
const validateAdvanceData = (data) => {
  const errors = {};

  if (!data.employeeId || !Number.isInteger(parseInt(data.employeeId))) {
    errors.employeeId = 'Valid employee ID is required';
  }

  if (!data.advanceType || !['SALARY', 'TRAVEL', 'MEDICAL', 'EDUCATION', 'HOUSING', 'OTHER'].includes(data.advanceType)) {
    errors.advanceType = 'Valid advance type is required';
  }

  if (!data.amount || parseFloat(data.amount) <= 0) {
    errors.amount = 'Amount must be greater than 0';
  }

  if (!data.reason || data.reason.trim().length === 0) {
    errors.reason = 'Reason is required';
  }

  // Validate date format if provided
  if (data.amountRequiredOnDate && data.amountRequiredOnDate.trim()) {
    const dateValue = data.amountRequiredOnDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      errors.amountRequiredOnDate = 'Date must be in YYYY-MM-DD format';
    } else {
      const [year, month, day] = dateValue.split('-');
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);
      
      if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
        errors.amountRequiredOnDate = 'Please enter a valid date';
      } else {
        const date = new Date(yearNum, monthNum - 1, dayNum);
        if (date.getDate() !== dayNum || date.getMonth() !== monthNum - 1 || date.getFullYear() !== yearNum) {
          errors.amountRequiredOnDate = 'Please enter a valid date';
        }
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Loan validation
const validateLoanData = (data) => {
  const errors = {};

  if (!data.employeeId || !Number.isInteger(parseInt(data.employeeId))) {
    errors.employeeId = 'Valid employee ID is required';
  }

  if (!data.loanType || !['PERSONAL', 'HOME', 'VEHICLE', 'EDUCATION', 'MEDICAL', 'OTHER'].includes(data.loanType)) {
    errors.loanType = 'Valid loan type is required';
  }

  if (!data.loanAmount || parseFloat(data.loanAmount) <= 0) {
    errors.loanAmount = 'Loan amount must be greater than 0';
  }

  if (!data.monthlyDeductionAmount || parseFloat(data.monthlyDeductionAmount) <= 0) {
    errors.monthlyDeductionAmount = 'Monthly deduction amount must be greater than 0';
  }

  if (!data.totalMonths || !Number.isInteger(parseInt(data.totalMonths)) || parseInt(data.totalMonths) <= 0) {
    errors.totalMonths = 'Total months must be a positive integer';
  }

  if (!data.reason || data.reason.trim().length === 0) {
    errors.reason = 'Reason is required';
  }

  // Validate that monthly deduction * total months doesn't exceed loan amount
  if (data.monthlyDeductionAmount && data.totalMonths && data.loanAmount) {
    const totalDeduction = parseFloat(data.monthlyDeductionAmount) * parseInt(data.totalMonths);
    const loanAmount = parseFloat(data.loanAmount);
    
    if (totalDeduction > loanAmount) {
      errors.monthlyDeductionAmount = 'Total deduction amount cannot exceed loan amount';
    }
  }

  // Validate status if provided
  if (data.status && !['ACTIVE', 'COMPLETED', 'CANCELLED'].includes(data.status)) {
    errors.status = 'Invalid status specified';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Calendar validation using Joi
const validateCalendar = (data) => {
  const Joi = require('joi');
  
  const schema = Joi.object({
    calendarCode: Joi.string().required().max(50).pattern(/^[A-Z0-9_]+$/).messages({
      'string.empty': 'Calendar code is required',
      'string.max': 'Calendar code cannot exceed 50 characters',
      'string.pattern.base': 'Calendar code can only contain uppercase letters, numbers, and underscores'
    }),
    calendarName: Joi.string().required().max(200).messages({
      'string.empty': 'Calendar name is required',
      'string.max': 'Calendar name cannot exceed 200 characters'
    }),
    description: Joi.string().optional().allow('', null),
    weeklyHolidays: Joi.array().items(
      Joi.object({
        dayOfWeek: Joi.number().integer().min(0).max(6).required(),
        label: Joi.string().required().max(100).messages({
          'string.empty': 'Holiday label is required',
          'string.max': 'Holiday label cannot exceed 100 characters'
        })
      })
    ).optional().default([]),
    isActive: Joi.number().valid(0, 1).default(1)
  });

  return schema.validate(data);
};

// Calendar Holiday validation using Joi
const validateCalendarHoliday = (data) => {
  const Joi = require('joi');

  const schema = Joi.object({
    calendarId: Joi.number().integer().positive().required().messages({
      'number.base': 'Calendar ID must be a number',
      'number.integer': 'Calendar ID must be an integer',
      'number.positive': 'Calendar ID must be positive',
      'any.required': 'Calendar ID is required'
    }),
    holidayName: Joi.string().required().max(200).messages({
      'string.empty': 'Holiday name is required',
      'string.max': 'Holiday name cannot exceed 200 characters'
    }),
    holidayDate: Joi.string().optional().allow('', null).pattern(/^\d{4}-\d{2}-\d{2}$/).messages({
      'string.pattern.base': 'Holiday date must be in YYYY-MM-DD format'
    }),
    holidayType: Joi.string().valid('PUBLIC_HOLIDAY', 'COMPANY_HOLIDAY', 'OPTIONAL_HOLIDAY', 'RESTRICTED_HOLIDAY').default('PUBLIC_HOLIDAY'),
    holidayPattern: Joi.string().valid('SPECIFIC_DATE', 'WEEKLY', 'MONTHLY', 'YEARLY').default('SPECIFIC_DATE'),
    dayOfWeek: Joi.number().integer().min(0).max(6).optional().allow(null),
    monthOfYear: Joi.number().integer().min(1).max(12).optional().allow(null),
    dayOfMonth: Joi.number().integer().min(1).max(31).optional().allow(null),
    weekOfMonth: Joi.number().integer().min(1).max(5).optional().allow(null),
    isRecurring: Joi.number().valid(0, 1).default(0),
    isNamedHoliday: Joi.number().valid(0, 1).default(0),
    description: Joi.string().optional().allow('', null),
    isActive: Joi.number().valid(0, 1).default(1)
  });

  return schema.validate(data);
};

module.exports = {
  handleValidationErrors,
  validateRequest,
  validateLogin,
  validateRegistration,
  validatePasswordChange,
  validateUserUpdate,
  validateAdvanceData,
  validateLoanData,
  validateCalendar,
  validateCalendarHoliday
}; 
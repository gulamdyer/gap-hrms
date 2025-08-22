const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
  createDeduction,
  listDeductions,
  getDeductionById,
  updateDeduction,
  deleteDeduction,
  updateDeductionStatus,
  getDeductionsByEmployee,
  getDeductionSummary
} = require('../controllers/deductionController');

// Validation rules for deduction creation
const createDeductionValidation = [
  body('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isNumeric()
    .withMessage('Employee ID must be a number'),
  
  body('deductionType')
    .notEmpty()
    .withMessage('Deduction type is required')
    .isIn(['FINE', 'PENALTY', 'SALARY_ADVANCE_RECOVERY', 'LOAN_RECOVERY', 'MISCELLANEOUS', 'DISCIPLINARY', 'ATTENDANCE', 'OTHER'])
    .withMessage('Invalid deduction type'),
  
  body('deductionCategory')
    .notEmpty()
    .withMessage('Deduction category is required')
    .isIn(['STATUTORY', 'VOLUNTARY', 'RECOVERY', 'PENALTY'])
    .withMessage('Invalid deduction category'),
  
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Reason must be between 10 and 1000 characters'),
  
  body('deductionDate')
    .notEmpty()
    .withMessage('Deduction date is required')
    .isDate()
    .withMessage('Invalid deduction date format'),
  
  body('effectiveFromMonth')
    .optional()
    .matches(/^\d{4}-\d{2}$/)
    .withMessage('Effective from month must be in YYYY-MM format'),
  
  body('effectiveToMonth')
    .optional()
    .matches(/^\d{4}-\d{2}$/)
    .withMessage('Effective to month must be in YYYY-MM format'),
  
  body('isRecurring')
    .optional()
    .isIn(['Y', 'N'])
    .withMessage('Is recurring must be Y or N'),
  
  body('recurringMonths')
    .optional()
    .custom((value) => {
      if (value !== null && value !== undefined) {
        const num = parseInt(value);
        if (isNaN(num) || num < 1 || num > 60) {
          throw new Error('Recurring months must be between 1 and 60');
        }
      }
      return true;
    }),
  
  body('attachmentUrl')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Attachment URL must not exceed 500 characters'),
  
  body('comments')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Comments must not exceed 2000 characters')
];

// Validation rules for deduction update
const updateDeductionValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid deduction ID'),
  
  ...createDeductionValidation.filter(rule => 
    !rule.fields?.includes('employeeId') // Don't allow employee ID changes on update
  )
];

// Validation rules for status update
const statusUpdateValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid deduction ID'),
  
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['ACTIVE', 'COMPLETED', 'CANCELLED', 'PENDING'])
    .withMessage('Invalid status'),
  
  body('comments')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comments must not exceed 1000 characters')
];

// Route: GET /api/deductions - Get all deductions with filtering
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('employeeId').optional().isInt({ min: 1 }).withMessage('Employee ID must be a positive integer'),
  query('deductionType').optional().isIn(['FINE', 'PENALTY', 'SALARY_ADVANCE_RECOVERY', 'LOAN_RECOVERY', 'MISCELLANEOUS', 'DISCIPLINARY', 'ATTENDANCE', 'OTHER']),
  query('deductionCategory').optional().isIn(['STATUTORY', 'VOLUNTARY', 'RECOVERY', 'PENALTY']),
  query('status').optional().isIn(['ACTIVE', 'COMPLETED', 'CANCELLED', 'PENDING']),
  query('effectiveMonth').optional().matches(/^\d{4}-\d{2}$/).withMessage('Effective month must be in YYYY-MM format')
], listDeductions);

// Route: POST /api/deductions - Create new deduction
router.post('/', authenticateToken, createDeductionValidation, createDeduction);

// Route: GET /api/deductions/summary - Get deduction summary statistics
router.get('/summary', authenticateToken, [
  query('employeeId').optional().isInt({ min: 1 }).withMessage('Employee ID must be a positive integer'),
  query('month').optional().matches(/^\d{4}-\d{2}$/).withMessage('Month must be in YYYY-MM format')
], getDeductionSummary);

// Route: GET /api/deductions/employee/:employeeId - Get deductions by employee
router.get('/employee/:employeeId', authenticateToken, [
  param('employeeId').isInt({ min: 1 }).withMessage('Invalid employee ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['ACTIVE', 'COMPLETED', 'CANCELLED', 'PENDING']),
  query('deductionType').optional().isIn(['FINE', 'PENALTY', 'SALARY_ADVANCE_RECOVERY', 'LOAN_RECOVERY', 'MISCELLANEOUS', 'DISCIPLINARY', 'ATTENDANCE', 'OTHER'])
], getDeductionsByEmployee);

// Route: GET /api/deductions/:id - Get specific deduction
router.get('/:id', authenticateToken, [
  param('id').isInt({ min: 1 }).withMessage('Invalid deduction ID')
], getDeductionById);

// Route: PUT /api/deductions/:id - Update deduction
router.put('/:id', authenticateToken, updateDeductionValidation, updateDeduction);

// Route: PATCH /api/deductions/:id/status - Update deduction status
router.patch('/:id/status', authenticateToken, statusUpdateValidation, updateDeductionStatus);

// Route: DELETE /api/deductions/:id - Delete deduction
router.delete('/:id', authenticateToken, [
  param('id').isInt({ min: 1 }).withMessage('Invalid deduction ID')
], deleteDeduction);

module.exports = router; 
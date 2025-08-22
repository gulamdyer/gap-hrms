const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const advanceController = require('../controllers/advanceController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { logActivity } = require('../middleware/activityLogger');

// Validation rules
const advanceValidation = [
  body('employeeId').isInt().withMessage('Employee ID must be a valid integer'),
  body('advanceType').isIn(['SALARY', 'TRAVEL', 'MEDICAL', 'EDUCATION', 'HOUSING', 'OTHER']).withMessage('Invalid advance type'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('reason').trim().notEmpty().withMessage('Reason is required')
    .isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters'),
  body('amountRequiredOnDate').optional().custom((value) => {
    if (value && value !== '') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error('Invalid amount required on date format');
      }
    }
    return true;
  })
];

const idValidation = [
  param('id').isInt().withMessage('Invalid advance ID')
];

const employeeIdValidation = [
  param('employeeId').isInt().withMessage('Invalid employee ID')
];

const queryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('advanceType').optional().isIn(['SALARY', 'TRAVEL', 'MEDICAL', 'EDUCATION', 'HOUSING', 'OTHER']).withMessage('Invalid advance type'),
  query('employeeId').optional().isInt().withMessage('Employee ID must be a valid integer'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search term must not exceed 100 characters')
];



// Routes
// Get all advances (with pagination and filters)
router.get('/', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR', 'MANAGER'),
  queryValidation,
  validateRequest,
  advanceController.getAllAdvances
);

// Get advance by ID
router.get('/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR', 'MANAGER'),
  idValidation,
  validateRequest,
  advanceController.getAdvanceById
);

// Create new advance
router.post('/', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  advanceValidation,
  validateRequest,
  logActivity,
  advanceController.createAdvance
);

// Update advance
router.put('/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  idValidation,
  advanceValidation,
  validateRequest,
  logActivity,
  advanceController.updateAdvance
);

// Delete advance
router.delete('/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN'),
  idValidation,
  validateRequest,
  advanceController.deleteAdvance
);



// Get advances by employee ID
router.get('/employee/:employeeId', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR', 'MANAGER'),
  employeeIdValidation,
  validateRequest,
  advanceController.getAdvancesByEmployee
);

// Get advance statistics
router.get('/statistics/overview', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR', 'MANAGER'),
  advanceController.getAdvanceStatistics
);

module.exports = router; 
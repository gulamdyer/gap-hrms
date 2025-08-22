const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const employeeController = require('../controllers/employeeController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { uploadAvatar, uploadDocument, handleUploadError } = require('../middleware/upload');
const { logActivity } = require('../middleware/activityLogger');

// Validation rules
const employeeValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').trim().notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('legalName').optional().trim().isLength({ max: 100 }).withMessage('Legal name must not exceed 100 characters'),
  body('gender').optional().isIn(['MALE', 'FEMALE', 'OTHER', '']).withMessage('Invalid gender'),
  body('nationality').optional().trim().isLength({ max: 50 }).withMessage('Nationality must not exceed 50 characters'),
  body('dateOfBirth').optional().custom((value) => {
    if (value && value !== '') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error('Invalid date of birth format');
      }
    }
    return true;
  }),
  body('birthPlace').optional().trim().isLength({ max: 100 }).withMessage('Birth place must not exceed 100 characters'),
  body('reportToId').optional().custom((value) => {
    if (value && value !== '') {
      if (!Number.isInteger(Number(value))) {
        throw new Error('Invalid report to ID');
      }
    }
    return true;
  }),
  body('designation').optional().trim().isLength({ max: 100 }).withMessage('Designation must not exceed 100 characters'),
  body('role').optional().trim().isLength({ max: 100 }).withMessage('Role must not exceed 100 characters'),
  body('position').optional().trim().isLength({ max: 100 }).withMessage('Position must not exceed 100 characters'),
  body('location').optional().trim().isLength({ max: 100 }).withMessage('Location must not exceed 100 characters'),
  body('costCenter').optional().trim().isLength({ max: 50 }).withMessage('Cost center must not exceed 50 characters'),
  body('dateOfJoining').optional().custom((value) => {
    if (value && value !== '') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error('Invalid date of joining format');
      }
    }
    return true;
  }),
  body('probationDays').optional().custom((value) => {
    if (value && value !== '') {
      const num = Number(value);
      if (!Number.isInteger(num) || num < 0 || num > 365) {
        throw new Error('Probation days must be between 0 and 365');
      }
    }
    return true;
  }),
  body('confirmDate').optional().custom((value) => {
    if (value && value !== '') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error('Invalid confirm date format');
      }
    }
    return true;
  }),
  body('noticeDays').optional().custom((value) => {
    if (value && value !== '') {
      const num = Number(value);
      if (!Number.isInteger(num) || num < 0 || num > 365) {
        throw new Error('Notice days must be between 0 and 365');
      }
    }
    return true;
  }),
  body('address').optional().trim().isLength({ max: 500 }).withMessage('Address must not exceed 500 characters'),
  body('pincode').optional().trim().isLength({ min: 6, max: 10 }).withMessage('Pincode must be between 6 and 10 characters'),
  body('city').optional().trim().isLength({ max: 50 }).withMessage('City must not exceed 50 characters'),
  body('district').optional().trim().isLength({ max: 50 }).withMessage('District must not exceed 50 characters'),
  body('state').optional().trim().isLength({ max: 50 }).withMessage('State must not exceed 50 characters'),
  body('country').optional().trim().isLength({ max: 50 }).withMessage('Country must not exceed 50 characters'),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Phone must not exceed 20 characters'),
  body('mobile').optional().trim().isLength({ max: 20 }).withMessage('Mobile must not exceed 20 characters'),
  body('email').optional().custom((value) => {
    if (value && value !== '') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        throw new Error('Invalid email format');
      }
    }
    return true;
  }),
  body('fatherName').optional().trim().isLength({ max: 100 }).withMessage('Father name must not exceed 100 characters'),
  body('maritalStatus').optional().isIn(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', '']).withMessage('Invalid marital status'),
  body('spouseName').optional().trim().isLength({ max: 100 }).withMessage('Spouse name must not exceed 100 characters'),
  body('religion').optional().trim().isLength({ max: 50 }).withMessage('Religion must not exceed 50 characters'),
  body('aadharNumber').optional().trim().isLength({ min: 12, max: 12 }).withMessage('Aadhar number must be 12 digits'),
  body('panNumber').optional().trim().isLength({ min: 10, max: 10 }).withMessage('PAN number must be 10 characters'),
  body('drivingLicenseNumber').optional().trim().isLength({ max: 20 }).withMessage('Driving license number must not exceed 20 characters'),
  body('educationCertificateNumber').optional().trim().isLength({ max: 50 }).withMessage('Education certificate number must not exceed 50 characters'),
  body('bankName').optional().trim().isLength({ max: 100 }).withMessage('Bank name must not exceed 100 characters'),
  body('branchName').optional().trim().isLength({ max: 100 }).withMessage('Branch name must not exceed 100 characters'),
  body('ifscCode').optional().trim().isLength({ min: 11, max: 11 }).withMessage('IFSC code must be 11 characters'),
  body('accountNumber').optional().trim().isLength({ max: 50 }).withMessage('Account number must not exceed 50 characters'),
  body('uanNumber').optional().trim().isLength({ max: 20 }).withMessage('UAN number must not exceed 20 characters'),
  body('pfNumber').optional().trim().isLength({ max: 20 }).withMessage('PF number must not exceed 20 characters'),
  body('esiNumber').optional().trim().isLength({ max: 20 }).withMessage('ESI number must not exceed 20 characters'),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'TERMINATED', 'ONBOARDING']).withMessage('Invalid status'),
  body('payrollCountry').optional().trim().isLength({ max: 50 }).withMessage('Payroll country must not exceed 50 characters'),
  body('employeeType').optional().isIn(['EXPATRIATE', 'LOCAL', 'CONSULTANT', 'FULL-TIME', 'PART-TIME', '']).withMessage('Invalid employee type'),
  body('airTicketEligible').optional().isInt({ min: 0, max: 4 }).withMessage('Air Ticket Eligible must be 0, 1, 2, 3, or 4'),
  body('airTicketSegment').optional().trim().isLength({ max: 50 }).withMessage('Air Ticket Segment must not exceed 50 characters'),
  body('payrollCompanies').optional().custom((value) => {
    if (value && typeof value === 'string') {
      // Accept comma-separated string or array
      return true;
    }
    if (Array.isArray(value)) {
      return true;
    }
    if (value === undefined || value === null) return true;
    throw new Error('Invalid payroll companies');
  }),
  body('pfDeductionCompany').optional().trim().isLength({ max: 100 }).withMessage('PF deduction company must not exceed 100 characters')
];

const idValidation = [
  param('id').isInt().withMessage('Invalid employee ID')
];

const queryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'TERMINATED', 'ONBOARDING']).withMessage('Invalid status'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search term must not exceed 100 characters')
];

// Routes
// Get all employees (with pagination and filters)
router.get('/', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR', 'MANAGER'),
  queryValidation,
  validateRequest,
  employeeController.getAllEmployees
);

// Get employee by ID
router.get('/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR', 'MANAGER'),
  idValidation,
  validateRequest,
  employeeController.getEmployeeById
);

// Create new employee
router.post('/', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  employeeValidation,
  validateRequest,
  logActivity,
  employeeController.createEmployee
);

// Update employee
router.put('/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  idValidation,
  employeeValidation,
  validateRequest,
  logActivity,
  employeeController.updateEmployee
);

// Delete employee
router.delete('/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN'),
  idValidation,
  validateRequest,
  logActivity,
  employeeController.deleteEmployee
);

// Test authentication endpoint
router.get('/test-auth', 
  authenticateToken, 
  (req, res) => {
    console.log('🔍 Test auth endpoint called');
    console.log('User from request:', req.user);
    console.log('User role:', req.user?.role);
    
    res.json({
      success: true,
      message: 'Authentication successful',
      user: req.user,
      timestamp: new Date().toISOString()
    });
  }
);

// Test validation endpoint
router.post('/test-validation', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  employeeValidation,
  validateRequest,
  logActivity,
  (req, res) => {
    console.log('✅ Validation test passed');
    console.log('Validated data:', req.body);
    
    res.json({
      success: true,
      message: 'Validation test passed',
      data: req.body,
      timestamp: new Date().toISOString()
    });
  }
);

// Test activity logger endpoint
router.post('/test-activity', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  logActivity,
  (req, res) => {
    console.log('✅ Activity logger test endpoint called');
    
    res.json({
      success: true,
      message: 'Activity logger test successful',
      data: req.body,
      timestamp: new Date().toISOString()
    });
  }
);

// Get employees for dropdown (reporting structure)
router.get('/dropdown/list', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR', 'MANAGER'),
  employeeController.getEmployeesForDropdown
);

// Update employee status
router.patch('/:id/status', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  idValidation,
  body('status').isIn(['ACTIVE', 'INACTIVE', 'TERMINATED', 'ONBOARDING']).withMessage('Invalid status'),
  validateRequest,
  employeeController.updateEmployeeStatus
);

// Upload employee avatar
router.post('/:id/avatar', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  idValidation,
  validateRequest,
  uploadAvatar,
  handleUploadError,
  employeeController.uploadAvatar
);

// Upload document
router.post('/:id/document', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  idValidation,
  body('documentType').isIn(['aadhar', 'pan', 'drivingLicense', 'educationCertificate']).withMessage('Invalid document type'),
  validateRequest,
  uploadDocument,
  handleUploadError,
  employeeController.uploadDocument
);

// Get dashboard statistics
router.get('/dashboard/stats', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR', 'MANAGER'),
  employeeController.getDashboardStats
);

// Country dropdown static test (public route)
router.get('/countries-test', (req, res) => {
  console.log('🔍 [countries-test] Called');
  res.json({ success: true, data: ['test'] });
});
// Country dropdown for Payroll Country (public route)
router.get('/countries', employeeController.getCountriesDropdown);

// Calculate real-time CTC (authenticated route)
router.post('/calculate-ctc', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  employeeController.calculateRealTimeCTC
);

module.exports = router; 
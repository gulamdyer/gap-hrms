const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const settingsController = require('../controllers/settingsController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

// Validation rules
const designationValidation = [
  body('designationName').trim().notEmpty().withMessage('Designation name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Designation name must be between 2 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Invalid status')
];

const roleValidation = [
  body('roleName').trim().notEmpty().withMessage('Role name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Role name must be between 2 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Invalid status')
];

const positionValidation = [
  body('positionName').trim().notEmpty().withMessage('Position name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Position name must be between 2 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Invalid status')
];

const locationValidation = [
  body('locationName').trim().notEmpty().withMessage('Location name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Location name must be between 2 and 100 characters'),
  body('address').optional().trim().isLength({ max: 500 }).withMessage('Address must not exceed 500 characters'),
  body('city').optional().trim().isLength({ max: 50 }).withMessage('City must not exceed 50 characters'),
  body('state').optional().trim().isLength({ max: 50 }).withMessage('State must not exceed 50 characters'),
  body('country').optional().trim().isLength({ max: 50 }).withMessage('Country must not exceed 50 characters'),
  body('pincode').optional().trim().isLength({ min: 6, max: 10 }).withMessage('Pincode must be between 6 and 10 characters'),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Invalid status')
];

const costCenterValidation = [
  body('costCenterCode').trim().notEmpty().withMessage('Cost center code is required')
    .isLength({ min: 2, max: 20 }).withMessage('Cost center code must be between 2 and 20 characters'),
  body('costCenterName').trim().notEmpty().withMessage('Cost center name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Cost center name must be between 2 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Invalid status')
];

// New validations
const departmentValidation = [
  body('departmentName').trim().notEmpty().withMessage('Department name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Department name must be between 2 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Invalid status')
];

const workcenterValidation = [
  body('workcenterName').trim().notEmpty().withMessage('Workcenter name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Workcenter name must be between 2 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Invalid status')
];

const employmentTypeValidation = [
  body('employmentTypeName').trim().notEmpty().withMessage('Employment type name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Employment type name must be between 2 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Invalid status')
];

const payGradeValidation = [
  body('gradeCode').trim().notEmpty().withMessage('Grade code is required')
    .isLength({ min: 2, max: 20 }).withMessage('Grade code must be between 2 and 20 characters'),
  body('gradeName').trim().notEmpty().withMessage('Grade name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Grade name must be between 2 and 100 characters'),
  body('minSalary').isFloat({ min: 0 }).withMessage('Minimum salary must be a positive number'),
  body('maxSalary').isFloat({ min: 0 }).withMessage('Maximum salary must be a positive number'),
  body('midSalary').optional().isFloat({ min: 0 }).withMessage('Mid salary must be a positive number'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Invalid status')
];

const idValidation = [
  param('id').isInt().withMessage('Invalid ID')
];

const queryValidation = [
  query('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Invalid status'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search term must not exceed 100 characters')
];

// Designation Routes
router.get('/designations', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  queryValidation,
  validateRequest,
  settingsController.getAllDesignations
);

router.get('/designations/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  idValidation,
  validateRequest,
  settingsController.getDesignationById
);

router.post('/designations', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  designationValidation,
  validateRequest,
  settingsController.createDesignation
);

router.put('/designations/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  idValidation,
  designationValidation,
  validateRequest,
  settingsController.updateDesignation
);

router.delete('/designations/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN'),
  idValidation,
  validateRequest,
  settingsController.deleteDesignation
);

// Role Routes
router.get('/roles', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  queryValidation,
  validateRequest,
  settingsController.getAllRoles
);

router.get('/roles/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  idValidation,
  validateRequest,
  settingsController.getRoleById
);

router.post('/roles', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  roleValidation,
  validateRequest,
  settingsController.createRole
);

router.put('/roles/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  idValidation,
  roleValidation,
  validateRequest,
  settingsController.updateRole
);

router.delete('/roles/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN'),
  idValidation,
  validateRequest,
  settingsController.deleteRole
);

// Position Routes
router.get('/positions', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  queryValidation,
  validateRequest,
  settingsController.getAllPositions
);

router.get('/positions/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  idValidation,
  validateRequest,
  settingsController.getPositionById
);

router.post('/positions', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  positionValidation,
  validateRequest,
  settingsController.createPosition
);

router.put('/positions/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  idValidation,
  positionValidation,
  validateRequest,
  settingsController.updatePosition
);

router.delete('/positions/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN'),
  idValidation,
  validateRequest,
  settingsController.deletePosition
);

// Location Routes
router.get('/locations', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  queryValidation,
  validateRequest,
  settingsController.getAllLocations
);

router.get('/locations/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  idValidation,
  validateRequest,
  settingsController.getLocationById
);

router.post('/locations', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  locationValidation,
  validateRequest,
  settingsController.createLocation
);

router.put('/locations/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  idValidation,
  locationValidation,
  validateRequest,
  settingsController.updateLocation
);

router.delete('/locations/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN'),
  idValidation,
  validateRequest,
  settingsController.deleteLocation
);

// Cost Center Routes
router.get('/cost-centers', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  queryValidation,
  validateRequest,
  settingsController.getAllCostCenters
);

router.get('/cost-centers/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  idValidation,
  validateRequest,
  settingsController.getCostCenterById
);

router.post('/cost-centers', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  costCenterValidation,
  validateRequest,
  settingsController.createCostCenter
);

router.put('/cost-centers/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  idValidation,
  costCenterValidation,
  validateRequest,
  settingsController.updateCostCenter
);

router.delete('/cost-centers/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN'),
  idValidation,
  validateRequest,
  settingsController.deleteCostCenter
);

// Pay Grade Routes
router.get('/pay-grades', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  queryValidation,
  validateRequest,
  settingsController.getAllPayGrades
);

router.get('/pay-grades/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  idValidation,
  validateRequest,
  settingsController.getPayGradeById
);

router.post('/pay-grades', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  payGradeValidation,
  validateRequest,
  settingsController.createPayGrade
);

router.put('/pay-grades/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  idValidation,
  payGradeValidation,
  validateRequest,
  settingsController.updatePayGrade
);

router.delete('/pay-grades/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN'),
  idValidation,
  validateRequest,
  settingsController.deletePayGrade
);

// New: Department Routes
router.get('/departments', authenticateToken, authorizeRoles('ADMIN','HR'), queryValidation, validateRequest, settingsController.getAllDepartments);
router.get('/departments/:id', authenticateToken, authorizeRoles('ADMIN','HR'), idValidation, validateRequest, settingsController.getDepartmentById);
router.post('/departments', authenticateToken, authorizeRoles('ADMIN','HR'), departmentValidation, validateRequest, settingsController.createDepartment);
router.put('/departments/:id', authenticateToken, authorizeRoles('ADMIN','HR'), idValidation, departmentValidation, validateRequest, settingsController.updateDepartment);
router.delete('/departments/:id', authenticateToken, authorizeRoles('ADMIN'), idValidation, validateRequest, settingsController.deleteDepartment);

// New: Workcenter Routes
router.get('/workcenters', authenticateToken, authorizeRoles('ADMIN','HR'), queryValidation, validateRequest, settingsController.getAllWorkcenters);
router.get('/workcenters/:id', authenticateToken, authorizeRoles('ADMIN','HR'), idValidation, validateRequest, settingsController.getWorkcenterById);
router.post('/workcenters', authenticateToken, authorizeRoles('ADMIN','HR'), workcenterValidation, validateRequest, settingsController.createWorkcenter);
router.put('/workcenters/:id', authenticateToken, authorizeRoles('ADMIN','HR'), idValidation, workcenterValidation, validateRequest, settingsController.updateWorkcenter);
router.delete('/workcenters/:id', authenticateToken, authorizeRoles('ADMIN'), idValidation, validateRequest, settingsController.deleteWorkcenter);

// New: Employment Type Routes
router.get('/employment-types', authenticateToken, authorizeRoles('ADMIN','HR'), queryValidation, validateRequest, settingsController.getAllEmploymentTypes);
router.get('/employment-types/:id', authenticateToken, authorizeRoles('ADMIN','HR'), idValidation, validateRequest, settingsController.getEmploymentTypeById);
router.post('/employment-types', authenticateToken, authorizeRoles('ADMIN','HR'), employmentTypeValidation, validateRequest, settingsController.createEmploymentType);
router.put('/employment-types/:id', authenticateToken, authorizeRoles('ADMIN','HR'), idValidation, employmentTypeValidation, validateRequest, settingsController.updateEmploymentType);
router.delete('/employment-types/:id', authenticateToken, authorizeRoles('ADMIN'), idValidation, validateRequest, settingsController.deleteEmploymentType);

// Pay Component routes
router.get('/pay-components', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  queryValidation,
  validateRequest,
  settingsController.getAllPayComponents
);

router.get('/pay-components/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  idValidation,
  validateRequest,
  settingsController.getPayComponentById
);

router.post('/pay-components', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  settingsController.createPayComponent
);

router.put('/pay-components/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  idValidation,
  validateRequest,
  settingsController.updatePayComponent
);

router.delete('/pay-components/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN'),
  idValidation,
  validateRequest,
  settingsController.deletePayComponent
);

// Leave Policy routes
router.get('/leave-policies', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  queryValidation,
  validateRequest,
  settingsController.getAllLeavePolicies
);

router.get('/leave-policies/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  idValidation,
  validateRequest,
  settingsController.getLeavePolicyById
);

router.post('/leave-policies', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  settingsController.createLeavePolicy
);

router.put('/leave-policies/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR'),
  idValidation,
  validateRequest,
  settingsController.updateLeavePolicy
);

router.delete('/leave-policies/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN'),
  idValidation,
  validateRequest,
  settingsController.deleteLeavePolicy
);

// Dropdown routes
router.get('/dropdown/designations', settingsController.getDesignationsForDropdown);
router.get('/dropdown/roles', settingsController.getRolesForDropdown);
router.get('/dropdown/positions', settingsController.getPositionsForDropdown);
router.get('/dropdown/locations', settingsController.getLocationsForDropdown);
router.get('/dropdown/cost-centers', settingsController.getCostCentersForDropdown);
router.get('/dropdown/pay-components', settingsController.getPayComponentsForDropdown);
router.get('/dropdown/leave-policies', settingsController.getLeavePoliciesForDropdown);
router.get('/dropdown/pay-grades', settingsController.getPayGradesForDropdown);
router.get('/dropdown/departments', settingsController.getDepartmentsForDropdown);
router.get('/dropdown/workcenters', settingsController.getWorkcentersForDropdown);
router.get('/dropdown/employment-types', settingsController.getEmploymentTypesForDropdown);

// Currency configuration route
router.get('/currency-config', settingsController.getCurrencyConfig);

// Utility route: backfill pay component rules (ADMIN only)
router.post('/pay-components/backfill-rules',
  authenticateToken,
  authorizeRoles('ADMIN'),
  settingsController.backfillPayComponentRules
);

module.exports = router; 
const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const {
  getEmployeeCompensation,
  getActiveEmployeeCompensation,
  createCompensation,
  updateCompensation,
  deleteCompensation,
  bulkUpdateCompensation,
  getCompensationSummary
} = require('../controllers/employeeCompensationController');

// All routes require authentication
router.use(authenticateToken);

// Employee compensation routes
router.get('/:employeeId/compensation', getEmployeeCompensation);
router.get('/:employeeId/compensation/active', getActiveEmployeeCompensation);
router.get('/:employeeId/compensation/summary', getCompensationSummary);
router.post('/:employeeId/compensation', authorizeRoles('ADMIN', 'HR'), createCompensation);
router.put('/:employeeId/compensation/bulk', authorizeRoles('ADMIN', 'HR'), bulkUpdateCompensation);
router.put('/compensation/:compensationId', authorizeRoles('ADMIN', 'HR'), updateCompensation);
router.delete('/compensation/:compensationId', authorizeRoles('ADMIN', 'HR'), deleteCompensation);

module.exports = router; 
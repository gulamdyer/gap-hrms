const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');
const {
  getAllLoans,
  getLoanById,
  createLoan,
  updateLoan,
  deleteLoan,
  getLoansByEmployee,
  getLoanStatistics
} = require('../controllers/loanController');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all loans (with pagination and filters)
router.get('/', getAllLoans);

// Get loan statistics
router.get('/statistics', getLoanStatistics);

// Get loan by ID
router.get('/:id', getLoanById);

// Create new loan (HR and Admin only)
router.post('/', authorizeRoles('HR', 'ADMIN'), logActivity, createLoan);

// Update loan (HR and Admin only)
router.put('/:id', authorizeRoles('HR', 'ADMIN'), logActivity, updateLoan);

// Delete loan (Admin only)
router.delete('/:id', authorizeRoles('ADMIN'), logActivity, deleteLoan);

// Get loans by employee ID
router.get('/employee/:employeeId', getLoansByEmployee);

module.exports = router; 
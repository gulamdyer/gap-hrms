const express = require('express');
const router = express.Router();
const {
  createLeave,
  getAllLeaves,
  getLeaveById,
  updateLeave,
  updateLeaveStatus,
  deleteLeave,
  getLeavesByEmployee,
  getLeaveStatistics,
  getLeavesByStatus,
  getLeaveFormData
} = require('../controllers/leaveController');
const { authenticateToken } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all leaves with filters and pagination
router.get('/', getAllLeaves);

// Get dropdown data for leave form
router.get('/form/data', getLeaveFormData);

// Get leave statistics
router.get('/statistics/overview', getLeaveStatistics);

// Get leaves by status
router.get('/status/:status', getLeavesByStatus);

// Get leaves by employee ID
router.get('/employee/:employeeId', getLeavesByEmployee);

// Create new leave
router.post('/', logActivity, createLeave);

// Update leave status (approve/reject)
router.patch('/:id/status', logActivity, updateLeaveStatus);

// Update leave
router.put('/:id', logActivity, updateLeave);

// Delete leave
router.delete('/:id', logActivity, deleteLeave);

// Get leave by ID
router.get('/:id', getLeaveById);

module.exports = router; 
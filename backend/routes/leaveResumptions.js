const express = require('express');
const router = express.Router();
const leaveResumptionController = require('../controllers/leaveResumptionController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create new leave resumption
router.post('/', leaveResumptionController.createResumption);

// Get all leave resumptions with filters
router.get('/', leaveResumptionController.getAllResumptions);

// Get resumption statistics
router.get('/statistics', leaveResumptionController.getResumptionStatistics);

// Get approved leaves eligible for resumption
router.get('/eligible-leaves', leaveResumptionController.getEligibleLeaves);

// Get resumption by ID
router.get('/:id', leaveResumptionController.getResumptionById);

// Update resumption status (approve/reject)
router.put('/:id/status', leaveResumptionController.updateResumptionStatus);

// Mark integration as updated (attendance/payroll)
router.put('/:id/integration', leaveResumptionController.markIntegrationUpdated);

// Delete resumption
router.delete('/:id', leaveResumptionController.deleteResumption);

// Get resumptions by employee ID
router.get('/employee/:employeeId', leaveResumptionController.getResumptionsByEmployee);

// Get resumptions by leave ID
router.get('/leave/:leaveId', leaveResumptionController.getResumptionsByLeave);

module.exports = router; 
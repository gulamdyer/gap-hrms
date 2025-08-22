const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const shiftController = require('../controllers/shiftController');

// All routes require authentication and ADMIN or HR role
router.use(authenticateToken, authorizeRoles('ADMIN', 'HR'));

// Dropdown route
router.get('/dropdown', shiftController.getShiftsForDropdown);

// CRUD routes
router.get('/', shiftController.getAllShifts);
router.get('/:id', shiftController.getShiftById);
router.post('/', shiftController.createShift);
router.put('/:id', shiftController.updateShift);
router.delete('/:id', shiftController.deleteShift);

module.exports = router; 
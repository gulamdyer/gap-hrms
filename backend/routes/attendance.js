const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const attendanceController = require('../controllers/attendanceController');

// All routes require authentication
router.use(authenticateToken);

// Statistics and dashboard (must come before parameterized routes)
router.get('/statistics/employee', authorizeRoles('ADMIN', 'HR'), attendanceController.getAttendanceStatistics);
router.get('/dashboard/overview', authorizeRoles('ADMIN', 'HR'), attendanceController.getAttendanceDashboard);

// Biometric device management
router.get('/devices/biometric', authorizeRoles('ADMIN', 'HR'), attendanceController.getBiometricDevices);
router.post('/devices/biometric', authorizeRoles('ADMIN', 'HR'), attendanceController.createBiometricDevice);

// Dropdown data
router.get('/dropdown/status', authorizeRoles('ADMIN', 'HR'), attendanceController.getAttendanceForDropdown);
router.get('/dropdown/statuses', authorizeRoles('ADMIN', 'HR'), attendanceController.getStatusForDropdown);

// Mark attendance (available to all authenticated users)
router.post('/mark', attendanceController.markAttendance);

// Attendance CRUD routes (require ADMIN or HR role) - must come after specific routes
router.get('/', authorizeRoles('ADMIN', 'HR'), attendanceController.getAllAttendance);
router.get('/:id', authorizeRoles('ADMIN', 'HR'), attendanceController.getAttendanceById);
router.post('/', authorizeRoles('ADMIN', 'HR'), attendanceController.createAttendance);
router.put('/:id', authorizeRoles('ADMIN', 'HR'), attendanceController.updateAttendance);
router.delete('/:id', authorizeRoles('ADMIN', 'HR'), attendanceController.deleteAttendance);

// Bulk operations
router.post('/bulk', authorizeRoles('ADMIN', 'HR'), attendanceController.bulkCreateAttendance);

module.exports = router; 
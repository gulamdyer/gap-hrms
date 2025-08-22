const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');
const {
  getAllTimesheets,
  getTimesheetById,
  createTimesheet,
  updateTimesheet,
  updateTimesheetStatus,
  deleteTimesheet,
  getTimesheetStatistics,
  getTimesheetEntries,
  createTimesheetEntry,
  updateTimesheetEntry,
  deleteTimesheetEntry,
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectsDropdown,
  getTimeTrackingStats
} = require('../controllers/timesheetController');

// Apply authentication to all routes
router.use(authenticateToken);

// Timesheet Routes
// Get all timesheets (with pagination and filters)
router.get('/', getAllTimesheets);

// Get timesheet statistics
router.get('/statistics', getTimesheetStatistics);

// Get time tracking statistics
router.get('/stats/time-tracking', getTimeTrackingStats);

// Get timesheet by ID
router.get('/:id', getTimesheetById);

// Create new timesheet
router.post('/', logActivity, createTimesheet);

// Update timesheet
router.put('/:id', logActivity, updateTimesheet);

// Update timesheet status (submit, approve, reject)
router.patch('/:id/status', logActivity, updateTimesheetStatus);

// Delete timesheet
router.delete('/:id', logActivity, deleteTimesheet);

// Timesheet Entry Routes
// Get all entries for a timesheet
router.get('/:timesheetId/entries', getTimesheetEntries);

// Create new timesheet entry
router.post('/:timesheetId/entries', logActivity, createTimesheetEntry);

// Update timesheet entry
router.put('/:timesheetId/entries/:entryId', logActivity, updateTimesheetEntry);

// Delete timesheet entry
router.delete('/:timesheetId/entries/:entryId', logActivity, deleteTimesheetEntry);

// Project Routes
// Get all projects
router.get('/projects/all', getAllProjects);

// Get projects for dropdown
router.get('/projects/dropdown', getProjectsDropdown);

// Get project by ID
router.get('/projects/:id', getProjectById);

// Create new project
router.post('/projects', authorizeRoles(['ADMIN', 'HR', 'MANAGER']), logActivity, createProject);

// Update project
router.put('/projects/:id', authorizeRoles(['ADMIN', 'HR', 'MANAGER']), logActivity, updateProject);

// Delete project
router.delete('/projects/:id', authorizeRoles(['ADMIN', 'HR', 'MANAGER']), logActivity, deleteProject);

module.exports = router; 
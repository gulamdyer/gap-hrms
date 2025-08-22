const express = require('express');
const { param, query } = require('express-validator');
const router = express.Router();

const activityController = require('../controllers/activityController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

// Validation rules
const idValidation = [
  param('id').isInt().withMessage('Invalid activity ID')
];

// Get all activities
router.get('/', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR', 'MANAGER'),
  activityController.getAllActivities
);

// Get recent activities for dashboard
router.get('/recent', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR', 'MANAGER'),
  activityController.getRecentActivities
);

// Get activity by ID
router.get('/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR', 'MANAGER'),
  idValidation,
  validateRequest,
  activityController.getActivityById
);

// Get activity statistics
router.get('/stats/overview', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'HR', 'MANAGER'),
  activityController.getActivityStatistics
);

// Delete activity
router.delete('/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN'),
  idValidation,
  validateRequest,
  activityController.deleteActivity
);

module.exports = router; 
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
  body, 
  param, 
  query 
} = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');
const {
  getAllConfigs,
  getConfigById,
  createConfig,
  updateConfig,
  deleteConfig,
  getActiveConfigs,
  getConfigStatistics,
  testConnection
} = require('../controllers/sqlServerConfigController');

// Validation rules
const validateSqlServerConfig = [
  body('dbName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Database name is required and must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Database name can only contain letters, numbers, and underscores'),
  
  body('userId')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('User ID is required and must be between 1 and 100 characters'),
  
  body('password')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Password is required and must be between 1 and 255 characters'),
  
  body('ipAddress')
    .trim()
    .isLength({ min: 1, max: 45 })
    .withMessage('IP Address is required and must be between 1 and 45 characters')
    .matches(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/)
    .withMessage('Please provide a valid IP address'),
  
  body('port')
    .isInt({ min: 1, max: 65535 })
    .withMessage('Port must be a number between 1 and 65535'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  
  body('isActive')
    .optional()
    .isIn([0, 1, true, false])
    .withMessage('Active status must be 0, 1, true, or false'),
  
  handleValidationErrors
];

const validateConfigId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Configuration ID must be a positive integer'),
  handleValidationErrors
];

const validateQueryParams = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('isActive')
    .optional()
    .isIn(['0', '1'])
    .withMessage('Active filter must be 0 or 1'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must be less than 100 characters'),
  
  handleValidationErrors
];

// Routes
// GET /api/sql-server-configs - Get all configurations
router.get('/', authenticateToken, validateQueryParams, getAllConfigs);

// GET /api/sql-server-configs/active - Get active configurations
router.get('/active', authenticateToken, getActiveConfigs);

// GET /api/sql-server-configs/statistics - Get statistics
router.get('/statistics', authenticateToken, getConfigStatistics);

// GET /api/sql-server-configs/:id - Get configuration by ID
router.get('/:id', authenticateToken, validateConfigId, getConfigById);

// POST /api/sql-server-configs - Create new configuration
router.post('/', authenticateToken, validateSqlServerConfig, createConfig);

// PUT /api/sql-server-configs/:id - Update configuration
router.put('/:id', authenticateToken, validateConfigId, validateSqlServerConfig, updateConfig);

// DELETE /api/sql-server-configs/:id - Delete configuration
router.delete('/:id', authenticateToken, validateConfigId, deleteConfig);

// POST /api/sql-server-configs/:id/test - Test connection
router.post('/:id/test', authenticateToken, validateConfigId, testConnection);

module.exports = router; 
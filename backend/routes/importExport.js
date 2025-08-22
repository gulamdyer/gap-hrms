const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const importExportController = require('../controllers/importExportController');
const { logActivity } = require('../middleware/activityLogger');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get available entities for import/export
router.get('/entities', importExportController.getAvailableEntities);

// Export data from a specific entity
router.get('/export/:entityId/:format?', logActivity, importExportController.exportData);

// Generate template for a specific entity
router.get('/template/:entityId/:format?', importExportController.generateTemplate);

// Import data from uploaded file
router.post('/import/:entityId', importExportController.upload.single('file'), logActivity, importExportController.importData);

// Get import history
router.get('/history', importExportController.getImportHistory);

module.exports = router; 
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const payrollSettingsController = require('../controllers/payrollSettingsController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all payroll settings
router.get('/', payrollSettingsController.getAllSettings);

// Get settings for a specific section
router.get('/:section', payrollSettingsController.getSectionSettings);

// Update settings for a specific section
router.put('/:section', payrollSettingsController.updateSectionSettings);

// Get a specific setting
router.get('/:section/:key', payrollSettingsController.getSetting);

// Delete a specific setting
router.delete('/:section/:key', payrollSettingsController.deleteSetting);

// Initialize default settings
router.post('/initialize', payrollSettingsController.initializeSettings);

// Get settings summary
router.get('/summary', payrollSettingsController.getSettingsSummary);

// Get settings history
router.get('/history', payrollSettingsController.getSettingsHistory);

// Export settings
router.get('/export', payrollSettingsController.exportSettings);

// Import settings
router.post('/import', payrollSettingsController.importSettings);

// Validate settings
router.post('/:section/validate', payrollSettingsController.validateSettings);

// Get calculation rules
router.get('/rules/calculation', payrollSettingsController.getCalculationRules);

// Reset settings to defaults
router.post('/reset', payrollSettingsController.resetToDefaults);

module.exports = router; 
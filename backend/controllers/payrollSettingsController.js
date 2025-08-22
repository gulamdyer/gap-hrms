const PayrollSettings = require('../models/PayrollSettings');
const { validationResult } = require('express-validator');

// Get all payroll settings
const getAllSettings = async (req, res) => {
  try {
    const { countryCode } = req.query;
    
    await PayrollSettings.ensureStructure(req.user?.userId || 1);
    
    let settings;
    if (countryCode) {
      // Get country-specific settings
      settings = await PayrollSettings.getCountrySettings(countryCode);
    } else {
      // Get all settings (default behavior)
      settings = await PayrollSettings.getAllSettings();
    }
    
    res.status(200).json({
      success: true,
      message: 'Payroll settings retrieved successfully',
      data: settings,
      countryCode: countryCode || 'ALL'
    });
  } catch (error) {
    console.error('Error getting payroll settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payroll settings',
      error: error.message
    });
  }
};

// Get settings for a specific section
const getSectionSettings = async (req, res) => {
  try {
    await PayrollSettings.ensureStructure(req.user?.userId || 1);
    const { section } = req.params;
    
    if (!section) {
      return res.status(400).json({
        success: false,
        message: 'Section parameter is required'
      });
    }

    const settings = await PayrollSettings.getSectionSettings(section);
    
    res.status(200).json({
      success: true,
      message: `${section} settings retrieved successfully`,
      data: settings
    });
  } catch (error) {
    console.error('Error getting section settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve section settings',
      error: error.message
    });
  }
};

// Update settings for a specific section
const updateSectionSettings = async (req, res) => {
  try {
    await PayrollSettings.ensureStructure(req.user?.userId || 1);
    const { section } = req.params;
    const settingsData = req.body;
    const userId = req.user.userId;

    if (!section) {
      return res.status(400).json({
        success: false,
        message: 'Section parameter is required'
      });
    }

    if (!settingsData || Object.keys(settingsData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Settings data is required'
      });
    }

    // Validate settings
    const validationErrors = PayrollSettings.validateSettings(section, settingsData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Update settings
    await PayrollSettings.updateSectionSettings(section, settingsData, userId);
    
    res.status(200).json({
      success: true,
      message: `${section} settings updated successfully`,
      data: settingsData
    });
  } catch (error) {
    console.error('Error updating section settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update section settings',
      error: error.message
    });
  }
};

// Initialize default settings
const initializeSettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    await PayrollSettings.initializeDefaultSettings(userId);
    
    res.status(200).json({
      success: true,
      message: 'Default payroll settings initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize default settings',
      error: error.message
    });
  }
};

// Get settings summary
const getSettingsSummary = async (req, res) => {
  try {
    const summary = await PayrollSettings.getSettingsSummary();
    
    res.status(200).json({
      success: true,
      message: 'Settings summary retrieved successfully',
      data: summary
    });
  } catch (error) {
    console.error('Error getting settings summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve settings summary',
      error: error.message
    });
  }
};

// Get settings history
const getSettingsHistory = async (req, res) => {
  try {
    const { section } = req.query;
    
    const history = await PayrollSettings.getSettingsHistory(section);
    
    res.status(200).json({
      success: true,
      message: 'Settings history retrieved successfully',
      data: history
    });
  } catch (error) {
    console.error('Error getting settings history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve settings history',
      error: error.message
    });
  }
};

// Export settings
const exportSettings = async (req, res) => {
  try {
    const exportData = await PayrollSettings.exportSettings();
    
    res.status(200).json({
      success: true,
      message: 'Settings exported successfully',
      data: exportData
    });
  } catch (error) {
    console.error('Error exporting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export settings',
      error: error.message
    });
  }
};

// Import settings
const importSettings = async (req, res) => {
  try {
    const importData = req.body;
    const userId = req.user.userId;

    if (!importData || !importData.settings) {
      return res.status(400).json({
        success: false,
        message: 'Invalid import data format'
      });
    }

    await PayrollSettings.importSettings(importData, userId);
    
    res.status(200).json({
      success: true,
      message: 'Settings imported successfully'
    });
  } catch (error) {
    console.error('Error importing settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import settings',
      error: error.message
    });
  }
};

// Delete a specific setting
const deleteSetting = async (req, res) => {
  try {
    const { section, key } = req.params;
    
    if (!section || !key) {
      return res.status(400).json({
        success: false,
        message: 'Section and key parameters are required'
      });
    }

    await PayrollSettings.deleteSetting(section, key);
    
    res.status(200).json({
      success: true,
      message: `Setting ${section}.${key} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete setting',
      error: error.message
    });
  }
};

// Get a specific setting
const getSetting = async (req, res) => {
  try {
    const { section, key } = req.params;
    
    if (!section || !key) {
      return res.status(400).json({
        success: false,
        message: 'Section and key parameters are required'
      });
    }

    const setting = await PayrollSettings.getSetting(section, key);
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Setting retrieved successfully',
      data: setting
    });
  } catch (error) {
    console.error('Error getting setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve setting',
      error: error.message
    });
  }
};

// Validate settings
const validateSettings = async (req, res) => {
  try {
    const { section } = req.params;
    const settingsData = req.body;
    
    if (!section) {
      return res.status(400).json({
        success: false,
        message: 'Section parameter is required'
      });
    }

    if (!settingsData) {
      return res.status(400).json({
        success: false,
        message: 'Settings data is required'
      });
    }

    const validationErrors = PayrollSettings.validateSettings(section, settingsData);
    
    res.status(200).json({
      success: true,
      message: 'Settings validation completed',
      data: {
        isValid: validationErrors.length === 0,
        errors: validationErrors
      }
    });
  } catch (error) {
    console.error('Error validating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate settings',
      error: error.message
    });
  }
};

// Get payroll calculation rules
const getCalculationRules = async (req, res) => {
  try {
    const settings = await PayrollSettings.getAllSettings();
    
    // Extract calculation rules from settings
    const calculationRules = {
      overtime: {
        enabled: settings.general?.overtimeEnabled || false,
        rate: settings.general?.overtimeRate || 1.5
      },
      holidayPay: {
        enabled: settings.general?.holidayPayEnabled || false,
        rate: settings.general?.holidayPayRate || 2.0
      },
      deductions: {
        pf: {
          enabled: settings.deductions?.pfEnabled || false,
          employeeRate: settings.deductions?.pfEmployeeRate || 12,
          employerRate: settings.deductions?.pfEmployerRate || 12,
          maxWage: settings.deductions?.pfMaxWage || 15000
        },
        esi: {
          enabled: settings.deductions?.esiEnabled || false,
          employeeRate: settings.deductions?.esiEmployeeRate || 0.75,
          employerRate: settings.deductions?.esiEmployerRate || 3.25,
          maxWage: settings.deductions?.esiMaxWage || 21000
        },
        professionalTax: {
          enabled: settings.deductions?.professionalTaxEnabled || false,
          amount: settings.deductions?.professionalTaxAmount || 200
        }
      },
      allowances: {
        hra: {
          enabled: settings.allowances?.hraEnabled || false,
          exemptionMethod: settings.allowances?.hraExemptionMethod || 'ACTUAL_RENT'
        },
        conveyance: settings.allowances?.conveyanceAllowance || 1600,
        medical: settings.allowances?.medicalAllowance || 15000,
        lta: {
          enabled: settings.allowances?.ltaEnabled || false,
          exemptionLimit: settings.allowances?.ltaExemptionLimit || 80000
        }
      },
      tax: {
        calculationMethod: settings.tax?.taxCalculationMethod || 'SLAB_BASED',
        basicExemption: settings.tax?.basicExemption || 250000,
        standardDeduction: settings.tax?.standardDeduction || 50000,
        tds: {
          enabled: settings.tax?.tdsEnabled || false,
          threshold: settings.tax?.tdsThreshold || 250000
        }
      }
    };
    
    res.status(200).json({
      success: true,
      message: 'Calculation rules retrieved successfully',
      data: calculationRules
    });
  } catch (error) {
    console.error('Error getting calculation rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve calculation rules',
      error: error.message
    });
  }
};

// Reset settings to defaults
const resetToDefaults = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    await PayrollSettings.initializeDefaultSettings(userId);
    
    res.status(200).json({
      success: true,
      message: 'Settings reset to defaults successfully'
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset settings',
      error: error.message
    });
  }
};

module.exports = {
  getAllSettings,
  getSectionSettings,
  updateSectionSettings,
  initializeSettings,
  getSettingsSummary,
  getSettingsHistory,
  exportSettings,
  importSettings,
  deleteSetting,
  getSetting,
  validateSettings,
  getCalculationRules,
  resetToDefaults
}; 
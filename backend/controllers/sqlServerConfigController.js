const SqlServerConfig = require('../models/SqlServerConfig');
const { validationResult } = require('express-validator');

// Get all SQL Server configurations
const getAllConfigs = async (req, res) => {
  try {
    console.log('Getting all SQL Server configs...');
    console.log('User:', req.user);
    console.log('Query params:', req.query);
    
    const { isActive, search, page = 1, limit = 10 } = req.query;
    
    const filters = {};
    if (isActive !== undefined) filters.isActive = parseInt(isActive);
    if (search) filters.search = search;
    
    console.log('Filters:', filters);
    
    const configs = await SqlServerConfig.getAllConfigs(filters);
    console.log('Configs fetched:', configs.length);
    
    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedConfigs = configs.slice(startIndex, endIndex);
    
    res.status(200).json({
      success: true,
      data: paginatedConfigs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(configs.length / limit),
        totalItems: configs.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching SQL Server configs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SQL Server configurations',
      error: error.message
    });
  }
};

// Get SQL Server configuration by ID
const getConfigById = async (req, res) => {
  try {
    const { id } = req.params;
    const config = await SqlServerConfig.findById(id);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'SQL Server configuration not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching SQL Server config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SQL Server configuration',
      error: error.message
    });
  }
};

// Create new SQL Server configuration
const createConfig = async (req, res) => {
  try {
    console.log('🔍 Creating SQL Server config...');
    console.log('Request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    // Clean the data - convert empty strings to null for optional fields
    const cleanData = {};
    Object.keys(req.body).forEach(key => {
      if (req.body[key] === '' || req.body[key] === undefined) {
        cleanData[key] = null;
      } else {
        cleanData[key] = req.body[key];
      }
    });
    
    const configData = {
      ...cleanData,
      createdBy: req.user.userId
    };
    
    console.log('📝 Config data to save:', configData);
    
    const configId = await SqlServerConfig.create(configData);
    const config = await SqlServerConfig.findById(configId);
    
    console.log('✅ SQL Server config created successfully with ID:', configId);
    
    res.status(201).json({
      success: true,
      message: 'SQL Server configuration created successfully',
      data: config
    });
  } catch (error) {
    console.error('❌ Error creating SQL Server config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create SQL Server configuration',
      error: error.message
    });
  }
};

// Update SQL Server configuration
const updateConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const config = await SqlServerConfig.findById(id);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'SQL Server configuration not found'
      });
    }
    
    await SqlServerConfig.update(id, req.body);
    const updatedConfig = await SqlServerConfig.findById(id);
    
    res.status(200).json({
      success: true,
      message: 'SQL Server configuration updated successfully',
      data: updatedConfig
    });
  } catch (error) {
    console.error('Error updating SQL Server config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update SQL Server configuration',
      error: error.message
    });
  }
};

// Delete SQL Server configuration
const deleteConfig = async (req, res) => {
  try {
    const { id } = req.params;
    
    const config = await SqlServerConfig.findById(id);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'SQL Server configuration not found'
      });
    }
    
    await SqlServerConfig.delete(id);
    
    res.status(200).json({
      success: true,
      message: 'SQL Server configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting SQL Server config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete SQL Server configuration',
      error: error.message
    });
  }
};

// Get active SQL Server configurations
const getActiveConfigs = async (req, res) => {
  try {
    const configs = await SqlServerConfig.getActiveConfigs();
    
    res.status(200).json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('Error fetching active SQL Server configs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active SQL Server configurations',
      error: error.message
    });
  }
};

// Get SQL Server configuration statistics
const getConfigStatistics = async (req, res) => {
  try {
    const statistics = await SqlServerConfig.getStatistics();
    
    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error fetching SQL Server config statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SQL Server configuration statistics',
      error: error.message
    });
  }
};

// Test SQL Server connection
const testConnection = async (req, res) => {
  try {
    const { id } = req.params;
    
    const config = await SqlServerConfig.findById(id);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'SQL Server configuration not found'
      });
    }
    
    const testResult = await SqlServerConfig.testConnection(config);
    
    if (testResult.success) {
      res.status(200).json({
        success: true,
        message: testResult.message,
        data: testResult.details
      });
    } else {
      res.status(400).json({
        success: false,
        message: testResult.message,
        error: testResult.error,
        data: testResult.details
      });
    }
  } catch (error) {
    console.error('Error testing SQL Server connection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test SQL Server connection',
      error: error.message
    });
  }
};

module.exports = {
  getAllConfigs,
  getConfigById,
  createConfig,
  updateConfig,
  deleteConfig,
  getActiveConfigs,
  getConfigStatistics,
  testConnection
}; 
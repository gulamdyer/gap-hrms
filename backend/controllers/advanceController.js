const Advance = require('../models/Advance');
const { validationResult } = require('express-validator');

// Get all advances
const getAllAdvances = async (req, res) => {
  try {
    console.log('Getting all advances...');
    console.log('User:', req.user);
    console.log('Query params:', req.query);
    
    const { advanceType, employeeId, search, page = 1, limit = 10 } = req.query;
    
    const filters = {};
    if (advanceType) filters.advanceType = advanceType;
    if (employeeId) filters.employeeId = employeeId;
    if (search) filters.search = search;
    
    console.log('Filters:', filters);
    
    const advances = await Advance.getAllAdvances(filters);
    console.log('Advances fetched:', advances.length);
    
    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedAdvances = advances.slice(startIndex, endIndex);
    
    res.status(200).json({
      success: true,
      data: paginatedAdvances,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(advances.length / limit),
        totalItems: advances.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching advances:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch advances',
      error: error.message
    });
  }
};

// Get advance by ID
const getAdvanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const advance = await Advance.findById(id);
    
    if (!advance) {
      return res.status(404).json({
        success: false,
        message: 'Advance not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: advance
    });
  } catch (error) {
    console.error('Error fetching advance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch advance',
      error: error.message
    });
  }
};

// Create new advance
const createAdvance = async (req, res) => {
  try {
    console.log('🔍 Creating advance...');
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
    
    const advanceData = {
      ...cleanData,
      createdBy: req.user.userId
    };
    
    console.log('📝 Advance data to save:', advanceData);
    
    const advanceId = await Advance.create(advanceData);
    const advance = await Advance.findById(advanceId);
    
    console.log('✅ Advance created successfully with ID:', advanceId);
    
    res.status(201).json({
      success: true,
      message: 'Advance created successfully',
      data: advance
    });
  } catch (error) {
    console.error('❌ Error creating advance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create advance',
      error: error.message
    });
  }
};

// Update advance
const updateAdvance = async (req, res) => {
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
    
    const advance = await Advance.findById(id);
    if (!advance) {
      return res.status(404).json({
        success: false,
        message: 'Advance not found'
      });
    }
    
    await Advance.update(id, req.body);
    const updatedAdvance = await Advance.findById(id);
    
    res.status(200).json({
      success: true,
      message: 'Advance updated successfully',
      data: updatedAdvance
    });
  } catch (error) {
    console.error('Error updating advance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update advance',
      error: error.message
    });
  }
};

// Delete advance
const deleteAdvance = async (req, res) => {
  try {
    const { id } = req.params;
    
    const advance = await Advance.findById(id);
    if (!advance) {
      return res.status(404).json({
        success: false,
        message: 'Advance not found'
      });
    }
    
    await Advance.delete(id);
    
    res.status(200).json({
      success: true,
      message: 'Advance deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting advance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete advance',
      error: error.message
    });
  }
};



// Get advances by employee ID
const getAdvancesByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const advances = await Advance.getByEmployeeId(employeeId);
    
    res.status(200).json({
      success: true,
      data: advances
    });
  } catch (error) {
    console.error('Error fetching employee advances:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee advances',
      error: error.message
    });
  }
};

// Get advance statistics
const getAdvanceStatistics = async (req, res) => {
  try {
    const statistics = await Advance.getStatistics();
    
    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error fetching advance statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch advance statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllAdvances,
  getAdvanceById,
  createAdvance,
  updateAdvance,
  deleteAdvance,
  getAdvancesByEmployee,
  getAdvanceStatistics
}; 
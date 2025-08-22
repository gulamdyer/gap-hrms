const Deduction = require('../models/Deduction');
const { validationResult } = require('express-validator');

// Create a new deduction
const createDeduction = async (req, res) => {
  try {
    console.log('Received deduction creation request:', JSON.stringify(req.body, null, 2));
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', JSON.stringify(errors.array(), null, 2));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const deductionData = {
      ...req.body,
      appliedBy: req.user.userId
    };

    // Auto-generate effectiveFromMonth from deductionDate if not provided
    if (!deductionData.effectiveFromMonth && deductionData.deductionDate) {
      const date = new Date(deductionData.deductionDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      deductionData.effectiveFromMonth = `${year}-${month}`;
    }

    console.log('Creating deduction with data:', JSON.stringify(deductionData, null, 2));

    const result = await Deduction.create(deductionData);
    
    res.status(201).json({
      success: true,
      message: result.message,
      data: { deductionId: result.deductionId }
    });
    
  } catch (error) {
    console.error('Error in createDeduction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create deduction',
      error: error.message
    });
  }
};

// Get all deductions with filtering and pagination
const listDeductions = async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search,
      deductionType: req.query.deductionType,
      deductionCategory: req.query.deductionCategory,
      status: req.query.status,
      employeeId: req.query.employeeId,
      effectiveMonth: req.query.effectiveMonth
    };

    const result = await Deduction.getAll(filters);
    
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
    
  } catch (error) {
    console.error('Error in listDeductions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deductions',
      error: error.message
    });
  }
};

// Get a specific deduction by ID
const getDeductionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await Deduction.findById(id);
    
    if (!result.data) {
      return res.status(404).json({
        success: false,
        message: 'Deduction not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: result.data
    });
    
  } catch (error) {
    console.error('❌ Error in getDeductionById:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deduction',
      error: error.message
    });
  }
};

// Update a deduction
const updateDeduction = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    
    // Check if deduction exists
    const existingDeduction = await Deduction.findById(id);
    if (!existingDeduction.data) {
      return res.status(404).json({
        success: false,
        message: 'Deduction not found'
      });
    }

    const updateData = { ...req.body };

    // Auto-generate effectiveFromMonth from deductionDate if not provided
    if (!updateData.effectiveFromMonth && updateData.deductionDate) {
      const date = new Date(updateData.deductionDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      updateData.effectiveFromMonth = `${year}-${month}`;
    }

    console.log('Updating deduction with data:', updateData); // Debug log

    const result = await Deduction.update(id, updateData);
    
    res.status(200).json({
      success: true,
      message: result.message
    });
    
  } catch (error) {
    console.error('Error in updateDeduction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update deduction',
      error: error.message
    });
  }
};

// Delete a deduction
const deleteDeduction = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if deduction exists
    const existingDeduction = await Deduction.findById(id);
    if (!existingDeduction.data) {
      return res.status(404).json({
        success: false,
        message: 'Deduction not found'
      });
    }

    const result = await Deduction.delete(id);
    
    res.status(200).json({
      success: true,
      message: result.message
    });
    
  } catch (error) {
    console.error('Error in deleteDeduction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete deduction',
      error: error.message
    });
  }
};

// Update deduction status (approve/reject/cancel)
const updateDeductionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    
    // Validate status
    const validStatuses = ['ACTIVE', 'COMPLETED', 'CANCELLED', 'PENDING'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided'
      });
    }

    // Check if deduction exists
    const existingDeduction = await Deduction.findById(id);
    if (!existingDeduction.data) {
      return res.status(404).json({
        success: false,
        message: 'Deduction not found'
      });
    }

    const statusData = {
      status,
      approvedBy: req.user.userId,
      comments
    };

    const result = await Deduction.updateStatus(id, statusData);
    
    res.status(200).json({
      success: true,
      message: result.message
    });
    
  } catch (error) {
    console.error('Error in updateDeductionStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update deduction status',
      error: error.message
    });
  }
};

// Get deductions by employee ID
const getDeductionsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const filters = {
      employeeId,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      status: req.query.status,
      deductionType: req.query.deductionType
    };

    const result = await Deduction.getAll(filters);
    
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
    
  } catch (error) {
    console.error('Error in getDeductionsByEmployee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee deductions',
      error: error.message
    });
  }
};

// Get deduction summary statistics
const getDeductionSummary = async (req, res) => {
  try {
    const { employeeId, month } = req.query;
    
    // Get all deductions for summary calculation
    const filters = {};
    if (employeeId) filters.employeeId = employeeId;
    if (month) filters.effectiveMonth = month;

    const result = await Deduction.getAll({ ...filters, limit: 1000 });
    const deductions = result.data;
    
    // Calculate summary statistics
    const summary = {
      totalDeductions: deductions.length,
      activeDeductions: deductions.filter(d => d.STATUS === 'ACTIVE').length,
      completedDeductions: deductions.filter(d => d.STATUS === 'COMPLETED').length,
      pendingDeductions: deductions.filter(d => d.STATUS === 'PENDING').length,
      totalAmount: deductions.reduce((sum, d) => sum + (d.AMOUNT || 0), 0),
      totalDeducted: deductions.reduce((sum, d) => sum + (d.DEDUCTED_AMOUNT || 0), 0),
      totalRemaining: deductions.reduce((sum, d) => sum + (d.REMAINING_AMOUNT || 0), 0),
      byType: {},
      byCategory: {}
    };

    // Group by type
    deductions.forEach(d => {
      const type = d.DEDUCTION_TYPE || 'OTHER';
      if (!summary.byType[type]) {
        summary.byType[type] = { count: 0, amount: 0 };
      }
      summary.byType[type].count++;
      summary.byType[type].amount += d.AMOUNT || 0;
    });

    // Group by category
    deductions.forEach(d => {
      const category = d.DEDUCTION_CATEGORY || 'OTHER';
      if (!summary.byCategory[category]) {
        summary.byCategory[category] = { count: 0, amount: 0 };
      }
      summary.byCategory[category].count++;
      summary.byCategory[category].amount += d.AMOUNT || 0;
    });
    
    res.status(200).json({
      success: true,
      data: summary
    });
    
  } catch (error) {
    console.error('Error in getDeductionSummary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deduction summary',
      error: error.message
    });
  }
};

module.exports = {
  createDeduction,
  listDeductions,
  getDeductionById,
  updateDeduction,
  deleteDeduction,
  updateDeductionStatus,
  getDeductionsByEmployee,
  getDeductionSummary
}; 
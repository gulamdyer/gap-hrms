const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const Settings = require('../models/Settings');

// Create new leave
const createLeave = async (req, res) => {
  try {
    const {
      employeeId,
      leaveType,
      availableDays,
      startDate,
      endDate,
      totalDays,
      reason,
      attachmentUrl
    } = req.body;

    // Validate required fields
    if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: employeeId, leaveType, startDate, endDate, reason'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be after end date'
      });
    }

    if (start < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be in the past'
      });
    }

    // Calculate total days if not provided
    let calculatedTotalDays = totalDays;
    if (!totalDays) {
      calculatedTotalDays = Leave.calculateTotalDays(startDate, endDate);
    }

    const leaveData = {
      employeeId,
      leaveType,
      availableDays: availableDays || 0,
      startDate,
      endDate,
      totalDays: calculatedTotalDays,
      reason,
      attachmentUrl,
      createdBy: req.user.userId
    };

    const leaveId = await Leave.create(leaveData);
    
    // Get the created leave with details
    const leave = await Leave.findById(leaveId);

    res.status(201).json({
      success: true,
      message: 'Leave created successfully',
      data: leave
    });
  } catch (error) {
    console.error('Error creating leave:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create leave',
      error: error.message
    });
  }
};

// Get all leaves with filters
const getAllLeaves = async (req, res) => {
  try {
    const {
      search,
      leaveType,
      status,
      employeeId,
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = req.query;

    const filters = {};
    
    if (search) filters.search = search;
    if (leaveType) filters.leaveType = leaveType;
    if (status) filters.status = status;
    if (employeeId) filters.employeeId = parseInt(employeeId);
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const leaves = await Leave.getAllLeaves(filters);

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedLeaves = leaves.slice(startIndex, endIndex);

    const totalPages = Math.ceil(leaves.length / limit);

    res.json({
      success: true,
      data: paginatedLeaves,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: leaves.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaves',
      error: error.message
    });
  }
};

// Get leave by ID
const getLeaveById = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findById(parseInt(id));

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found'
      });
    }

    res.json({
      success: true,
      data: leave
    });
  } catch (error) {
    console.error('Error fetching leave:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave',
      error: error.message
    });
  }
};

// Update leave
const updateLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      employeeId,
      leaveType,
      availableDays,
      startDate,
      endDate,
      totalDays,
      reason,
      status,
      attachmentUrl
    } = req.body;

    // Check if leave exists
    const existingLeave = await Leave.findById(parseInt(id));
    if (!existingLeave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found'
      });
    }

    // Validate required fields
    if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: employeeId, leaveType, startDate, endDate, reason'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be after end date'
      });
    }

    // Calculate total days if not provided
    let calculatedTotalDays = totalDays;
    if (!totalDays) {
      calculatedTotalDays = Leave.calculateTotalDays(startDate, endDate);
    }

    const leaveData = {
      employeeId,
      leaveType,
      availableDays: availableDays || 0,
      startDate,
      endDate,
      totalDays: calculatedTotalDays,
      reason,
      status: status || existingLeave.STATUS,
      attachmentUrl
    };

    await Leave.update(parseInt(id), leaveData);
    
    // Get the updated leave
    const updatedLeave = await Leave.findById(parseInt(id));

    res.json({
      success: true,
      message: 'Leave updated successfully',
      data: updatedLeave
    });
  } catch (error) {
    console.error('Error updating leave:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update leave',
      error: error.message
    });
  }
};

// Approve/Reject leave
const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approvalComments } = req.body;

    // Check if leave exists
    const existingLeave = await Leave.findById(parseInt(id));
    if (!existingLeave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found'
      });
    }

    // Validate status
    const validStatuses = ['APPROVED', 'REJECTED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: APPROVED, REJECTED, CANCELLED'
      });
    }

    await Leave.updateStatus(parseInt(id), status, req.user.userId, approvalComments);
    
    // Get the updated leave
    const updatedLeave = await Leave.findById(parseInt(id));

    res.json({
      success: true,
      message: `Leave ${status.toLowerCase()} successfully`,
      data: updatedLeave
    });
  } catch (error) {
    console.error('Error updating leave status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update leave status',
      error: error.message
    });
  }
};

// Delete leave
const deleteLeave = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if leave exists
    const existingLeave = await Leave.findById(parseInt(id));
    if (!existingLeave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found'
      });
    }

    // Check if leave can be deleted (only pending leaves can be deleted)
    if (existingLeave.STATUS !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Only pending leaves can be deleted'
      });
    }

    await Leave.delete(parseInt(id));

    res.json({
      success: true,
      message: 'Leave deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting leave:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete leave',
      error: error.message
    });
  }
};

// Get leaves by employee ID
const getLeavesByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const leaves = await Leave.getByEmployeeId(parseInt(employeeId));

    res.json({
      success: true,
      data: leaves
    });
  } catch (error) {
    console.error('Error fetching employee leaves:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee leaves',
      error: error.message
    });
  }
};

// Get leave statistics
const getLeaveStatistics = async (req, res) => {
  try {
    const statistics = await Leave.getStatistics();

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error fetching leave statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave statistics',
      error: error.message
    });
  }
};

// Get leaves by status
const getLeavesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const leaves = await Leave.getByStatus(status);

    res.json({
      success: true,
      data: leaves
    });
  } catch (error) {
    console.error('Error fetching leaves by status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaves by status',
      error: error.message
    });
  }
};

// Get dropdown data for leave form
const getLeaveFormData = async (req, res) => {
  try {
    const employees = await Employee.getEmployeesForDropdown();

    res.json({
      success: true,
      data: {
        employees
      }
    });
  } catch (error) {
    console.error('Error fetching leave form data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave form data',
      error: error.message
    });
  }
};

module.exports = {
  createLeave,
  getAllLeaves,
  getLeaveById,
  updateLeave,
  updateLeaveStatus,
  deleteLeave,
  getLeavesByEmployee,
  getLeaveStatistics,
  getLeavesByStatus,
  getLeaveFormData
}; 
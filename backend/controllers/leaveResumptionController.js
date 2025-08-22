const LeaveResumption = require('../models/LeaveResumption');
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');

// Create new leave resumption
const createResumption = async (req, res) => {
  try {
    const {
      leaveId,
      employeeId,
      plannedResumptionDate,
      actualResumptionDate,
      reason,
      attachmentUrl
    } = req.body;

    // Validate required fields
    if (!leaveId || !employeeId || !plannedResumptionDate || !actualResumptionDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: leaveId, employeeId, plannedResumptionDate, actualResumptionDate'
      });
    }

    // Check if leave exists and is approved
    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found'
      });
    }

    if (leave.STATUS !== 'APPROVED' && leave.STATUS !== 'ON_LEAVE') {
      return res.status(400).json({
        success: false,
        message: 'Can only apply for resumption on approved or active leaves'
      });
    }

    // Check if resumption already applied for this leave
    const existingResumption = await LeaveResumption.getByLeaveId(leaveId);
    if (existingResumption.length > 0 && existingResumption.some(r => r.STATUS === 'PENDING' || r.STATUS === 'APPROVED')) {
      return res.status(400).json({
        success: false,
        message: 'Resumption already applied or approved for this leave'
      });
    }

    // Validate dates
    const actualDate = new Date(actualResumptionDate);
    const leaveStartDate = new Date(leave.START_DATE);
    
    if (actualDate <= leaveStartDate) {
      return res.status(400).json({
        success: false,
        message: 'Resumption date cannot be before or on leave start date'
      });
    }

    const resumptionData = {
      leaveId: parseInt(leaveId),
      employeeId: parseInt(employeeId),
      plannedResumptionDate,
      actualResumptionDate,
      reason,
      attachmentUrl,
      appliedBy: req.user.userId,
      appliedByRole: req.user.role
    };

    const resumptionId = await LeaveResumption.create(resumptionData);
    
    // Get the created resumption with details
    const resumption = await LeaveResumption.findById(resumptionId);

    // Update the main leave record
    await Leave.updateLeaveResumptionStatus(leaveId, {
      resumptionApplied: 1,
      actualResumptionDate,
      resumptionStatus: resumption.STATUS
    });

    res.status(201).json({
      success: true,
      message: 'Leave resumption applied successfully',
      data: resumption
    });
  } catch (error) {
    console.error('Error creating leave resumption:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create leave resumption',
      error: error.message
    });
  }
};

// Get all leave resumptions with filters
const getAllResumptions = async (req, res) => {
  try {
    const {
      search,
      status,
      resumptionType,
      employeeId,
      page = 1,
      limit = 10
    } = req.query;

    const filters = {};
    
    if (search) filters.search = search;
    if (status) filters.status = status;
    if (resumptionType) filters.resumptionType = resumptionType;
    if (employeeId) filters.employeeId = parseInt(employeeId);

    const resumptions = await LeaveResumption.getAllResumptions(filters);

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedResumptions = resumptions.slice(startIndex, endIndex);

    const totalPages = Math.ceil(resumptions.length / limit);

    res.json({
      success: true,
      data: paginatedResumptions,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: resumptions.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching leave resumptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave resumptions',
      error: error.message
    });
  }
};

// Get resumption by ID
const getResumptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const resumption = await LeaveResumption.findById(parseInt(id));

    if (!resumption) {
      return res.status(404).json({
        success: false,
        message: 'Leave resumption not found'
      });
    }

    res.json({
      success: true,
      data: resumption
    });
  } catch (error) {
    console.error('Error fetching leave resumption:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave resumption',
      error: error.message
    });
  }
};

// Update resumption status (approve/reject)
const updateResumptionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be APPROVED or REJECTED'
      });
    }

    // Check if resumption exists
    const resumption = await LeaveResumption.findById(parseInt(id));
    if (!resumption) {
      return res.status(404).json({
        success: false,
        message: 'Leave resumption not found'
      });
    }

    if (resumption.STATUS !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Can only approve/reject pending resumptions'
      });
    }

    await LeaveResumption.updateStatus(
      parseInt(id),
      status,
      req.user.userId,
      comments || ''
    );

    // Update the main leave record
    await Leave.updateLeaveResumptionStatus(resumption.LEAVE_ID, {
      resumptionStatus: status,
      ...(status === 'APPROVED' && { status: 'RESUMED' })
    });

    res.json({
      success: true,
      message: `Leave resumption ${status.toLowerCase()} successfully`
    });
  } catch (error) {
    console.error('Error updating resumption status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update resumption status',
      error: error.message
    });
  }
};

// Get resumptions by employee ID
const getResumptionsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const resumptions = await LeaveResumption.getByEmployeeId(parseInt(employeeId));

    res.json({
      success: true,
      data: resumptions
    });
  } catch (error) {
    console.error('Error fetching employee resumptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee resumptions',
      error: error.message
    });
  }
};

// Get resumptions by leave ID
const getResumptionsByLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const resumptions = await LeaveResumption.getByLeaveId(parseInt(leaveId));

    res.json({
      success: true,
      data: resumptions
    });
  } catch (error) {
    console.error('Error fetching leave resumptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave resumptions',
      error: error.message
    });
  }
};

// Get resumption statistics
const getResumptionStatistics = async (req, res) => {
  try {
    const stats = await LeaveResumption.getStatistics();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching resumption statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resumption statistics',
      error: error.message
    });
  }
};

// Get approved leaves eligible for resumption
const getEligibleLeaves = async (req, res) => {
  try {
    const { employeeId } = req.query;
    
    let filters = {
      status: 'APPROVED'
    };
    
    if (employeeId) {
      filters.employeeId = parseInt(employeeId);
    }

    // Get approved leaves that haven't been resumed yet
    const leaves = await Leave.getAllLeaves(filters);
    
    // Filter out leaves that already have approved resumptions
    const eligibleLeaves = [];
    
    for (const leave of leaves) {
      const resumptions = await LeaveResumption.getByLeaveId(leave.LEAVE_ID);
      const hasApprovedResumption = resumptions.some(r => r.STATUS === 'APPROVED');
      
      if (!hasApprovedResumption && leave.STATUS !== 'RESUMED') {
        eligibleLeaves.push(leave);
      }
    }

    res.json({
      success: true,
      data: eligibleLeaves
    });
  } catch (error) {
    console.error('Error fetching eligible leaves:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch eligible leaves',
      error: error.message
    });
  }
};

// Mark integration as updated (attendance/payroll)
const markIntegrationUpdated = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    if (!type || !['attendance', 'payroll'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be attendance or payroll'
      });
    }

    await LeaveResumption.markIntegrationUpdated(parseInt(id), type);

    res.json({
      success: true,
      message: `${type} integration marked as updated`
    });
  } catch (error) {
    console.error('Error marking integration updated:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark integration as updated',
      error: error.message
    });
  }
};

// Delete resumption
const deleteResumption = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if resumption exists
    const resumption = await LeaveResumption.findById(parseInt(id));
    if (!resumption) {
      return res.status(404).json({
        success: false,
        message: 'Leave resumption not found'
      });
    }

    if (resumption.STATUS === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete approved resumption'
      });
    }

    await LeaveResumption.delete(parseInt(id));

    // Update the main leave record
    await Leave.updateLeaveResumptionStatus(resumption.LEAVE_ID, {
      resumptionApplied: 0,
      actualResumptionDate: null,
      resumptionStatus: null
    });

    res.json({
      success: true,
      message: 'Leave resumption deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting leave resumption:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete leave resumption',
      error: error.message
    });
  }
};

module.exports = {
  createResumption,
  getAllResumptions,
  getResumptionById,
  updateResumptionStatus,
  getResumptionsByEmployee,
  getResumptionsByLeave,
  getResumptionStatistics,
  getEligibleLeaves,
  markIntegrationUpdated,
  deleteResumption
}; 
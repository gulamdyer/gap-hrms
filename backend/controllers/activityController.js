const Activity = require('../models/Activity');
const { validationResult } = require('express-validator');

// Get all activities
const getAllActivities = async (req, res) => {
  try {
    console.log('Getting all activities...');
    console.log('Query params:', req.query);
    
    const { page, limit, module, action, entityType, userId, employeeId } = req.query;
    
    const filters = {};
    if (page) filters.page = page;
    if (limit) filters.limit = limit;
    if (module) filters.module = module;
    if (action) filters.action = action;
    if (entityType) filters.entityType = entityType;
    if (userId) filters.userId = userId;
    if (employeeId) filters.employeeId = employeeId;
    
    console.log('Filters:', filters);
    
    const result = await Activity.getAllActivities(filters);
    console.log('Activities fetched:', result.activities.length);
    
    res.status(200).json({
      success: true,
      data: result.activities,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
      error: error.message
    });
  }
};

// Get recent activities for dashboard
const getRecentActivities = async (req, res) => {
  try {
    console.log('🔍 Getting recent activities for dashboard...');
    console.log('User:', req.user);
    console.log('Query params:', req.query);
    
    const { limit = 10 } = req.query;
    console.log('Limit:', limit);
    
    try {
      const activities = await Activity.getRecentActivities(parseInt(limit));
      console.log('Raw activities fetched:', activities.length);
      
      // Format activities for dashboard
      const formattedActivities = activities.map(activity => 
        Activity.formatActivityForDashboard(activity)
      );
      
      console.log('Recent activities fetched:', formattedActivities.length);
      console.log('Sample formatted activity:', formattedActivities[0]);
      
      res.status(200).json({
        success: true,
        data: formattedActivities
      });
    } catch (dbError) {
      console.log('⚠️ Database error, returning mock activities:', dbError.message);
      
      // Return mock activities when database is not available
      const mockActivities = [
        {
          id: 1,
          type: 'employee_updated',
          message: 'Updated employee information for John Doe',
          time: '2 hours ago',
          status: 'completed',
          action: 'UPDATE',
          hasOldValues: true,
          hasNewValues: true
        },
        {
          id: 2,
          type: 'leave_request',
          message: 'Leave request submitted by Jane Smith',
          time: '4 hours ago',
          status: 'pending',
          action: 'CREATE',
          hasOldValues: false,
          hasNewValues: true
        },
        {
          id: 3,
          type: 'employee_added',
          message: 'New employee Sarah Johnson added to system',
          time: '1 day ago',
          status: 'completed',
          action: 'CREATE',
          hasOldValues: false,
          hasNewValues: true
        },
        {
          id: 4,
          type: 'leave_approved',
          message: 'Leave request approved for Mike Wilson',
          time: '2 days ago',
          status: 'completed',
          action: 'UPDATE',
          hasOldValues: true,
          hasNewValues: true
        },
        {
          id: 5,
          type: 'payroll_processed',
          message: 'Monthly payroll processed for all employees',
          time: '3 days ago',
          status: 'completed',
          action: 'CREATE',
          hasOldValues: false,
          hasNewValues: true
        }
      ];
      
      console.log('Returning mock activities:', mockActivities.length);
      
      res.status(200).json({
        success: true,
        data: mockActivities
      });
    }
  } catch (error) {
    console.error('❌ Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities',
      error: error.message
    });
  }
};

// Get activity by ID
const getActivityById = async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await Activity.findById(id);
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity',
      error: error.message
    });
  }
};

// Get activity statistics
const getActivityStatistics = async (req, res) => {
  try {
    console.log('Getting activity statistics...');
    
    const stats = await Activity.getStatistics();
    console.log('Activity statistics:', stats);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching activity statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity statistics',
      error: error.message
    });
  }
};

// Delete activity
const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    
    const activity = await Activity.findById(id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    await Activity.delete(id);
    
    res.status(200).json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete activity',
      error: error.message
    });
  }
};

module.exports = {
  getAllActivities,
  getRecentActivities,
  getActivityById,
  getActivityStatistics,
  deleteActivity
}; 
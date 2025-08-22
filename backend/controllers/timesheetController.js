const Timesheet = require('../models/Timesheet');
const TimesheetEntry = require('../models/TimesheetEntry');
const Project = require('../models/Project');

// Get all timesheets with pagination and filters
const getAllTimesheets = async (req, res) => {
  try {
    const { page = 1, limit = 10, employeeId, status, startDate, endDate } = req.query;
    
    // Build filters object
    const filters = {};
    if (employeeId) filters.employeeId = parseInt(employeeId);
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    const timesheets = await Timesheet.findAll(filters);
    
    // Calculate pagination
    const totalItems = timesheets.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTimesheets = timesheets.slice(startIndex, endIndex);
    
    res.json({
      data: paginatedTimesheets,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching timesheets:', error);
    res.status(500).json({ message: 'Failed to fetch timesheets', error: error.message });
  }
};

// Get timesheet by ID with entries
const getTimesheetById = async (req, res) => {
  try {
    const { id } = req.params;
    const timesheet = await Timesheet.findById(parseInt(id));
    
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }
    
    // Get timesheet entries
    const entries = await TimesheetEntry.findByTimesheetId(parseInt(id));
    timesheet.entries = entries;
    
    res.json({ data: timesheet });
  } catch (error) {
    console.error('Error fetching timesheet by ID:', error);
    res.status(500).json({ message: 'Failed to fetch timesheet', error: error.message });
  }
};

// Create new timesheet
const createTimesheet = async (req, res) => {
  try {
    const timesheetData = {
      ...req.body,
      createdBy: req.user.userId
    };

    // Validate required fields
    if (!timesheetData.employeeId || !timesheetData.timesheetDate) {
      return res.status(400).json({ 
        message: 'Employee ID and timesheet date are required',
        errors: [
          { field: 'employeeId', message: 'Employee ID is required' },
          { field: 'timesheetDate', message: 'Timesheet date is required' }
        ]
      });
    }

    const result = await Timesheet.create(timesheetData);
    
    if (result.success) {
      // Fetch the created timesheet to return complete data
      const newTimesheet = await Timesheet.findById(result.timesheetId);
      res.status(201).json({ 
        message: 'Timesheet created successfully', 
        data: newTimesheet 
      });
    } else {
      res.status(400).json({ message: 'Failed to create timesheet' });
    }
  } catch (error) {
    console.error('Error creating timesheet:', error);
    
    if (error.message.includes('ORA-00001')) {
      return res.status(400).json({ 
        message: 'A timesheet for this employee and date already exists',
        errors: [{ field: 'timesheetDate', message: 'Timesheet already exists for this date' }]
      });
    }
    
    res.status(500).json({ message: 'Failed to create timesheet', error: error.message });
  }
};

// Update timesheet
const updateTimesheet = async (req, res) => {
  try {
    const { id } = req.params;
    const timesheetData = req.body;

    // Check if timesheet exists
    const existingTimesheet = await Timesheet.findById(parseInt(id));
    if (!existingTimesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    // Check if user can edit (only draft timesheets can be edited)
    if (existingTimesheet.STATUS !== 'DRAFT') {
      return res.status(400).json({ 
        message: 'Only draft timesheets can be edited' 
      });
    }

    const result = await Timesheet.update(parseInt(id), timesheetData);
    
    if (result.success) {
      const updatedTimesheet = await Timesheet.findById(parseInt(id));
      res.json({ 
        message: 'Timesheet updated successfully', 
        data: updatedTimesheet 
      });
    } else {
      res.status(400).json({ message: 'Failed to update timesheet' });
    }
  } catch (error) {
    console.error('Error updating timesheet:', error);
    res.status(500).json({ message: 'Failed to update timesheet', error: error.message });
  }
};

// Update timesheet status (submit, approve, reject)
const updateTimesheetStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approvalComments, rejectionReason } = req.body;

    // Validate status
    const validStatuses = ['SUBMITTED', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be one of: SUBMITTED, APPROVED, REJECTED' 
      });
    }

    // Check if timesheet exists
    const existingTimesheet = await Timesheet.findById(parseInt(id));
    if (!existingTimesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    const statusData = {
      status,
      approvedBy: req.user.userId,
      approvalComments,
      rejectionReason
    };

    const result = await Timesheet.updateStatus(parseInt(id), statusData);
    
    if (result.success) {
      const updatedTimesheet = await Timesheet.findById(parseInt(id));
      res.json({ 
        message: `Timesheet ${status.toLowerCase()} successfully`, 
        data: updatedTimesheet 
      });
    } else {
      res.status(400).json({ message: 'Failed to update timesheet status' });
    }
  } catch (error) {
    console.error('Error updating timesheet status:', error);
    res.status(500).json({ message: 'Failed to update timesheet status', error: error.message });
  }
};

// Delete timesheet
const deleteTimesheet = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if timesheet exists
    const existingTimesheet = await Timesheet.findById(parseInt(id));
    if (!existingTimesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    // Check if user can delete (only draft timesheets can be deleted)
    if (existingTimesheet.STATUS !== 'DRAFT') {
      return res.status(400).json({ 
        message: 'Only draft timesheets can be deleted' 
      });
    }

    const result = await Timesheet.delete(parseInt(id));
    
    if (result.success) {
      res.json({ message: 'Timesheet deleted successfully' });
    } else {
      res.status(400).json({ message: 'Failed to delete timesheet' });
    }
  } catch (error) {
    console.error('Error deleting timesheet:', error);
    res.status(500).json({ message: 'Failed to delete timesheet', error: error.message });
  }
};

// Get timesheet statistics
const getTimesheetStatistics = async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    
    const filters = {};
    if (employeeId) filters.employeeId = parseInt(employeeId);
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    const stats = await Timesheet.getStatistics(filters);
    
    res.json({ data: stats });
  } catch (error) {
    console.error('Error fetching timesheet statistics:', error);
    res.status(500).json({ message: 'Failed to fetch statistics', error: error.message });
  }
};

// Timesheet Entry Controllers
// Get all entries for a timesheet
const getTimesheetEntries = async (req, res) => {
  try {
    const { timesheetId } = req.params;
    
    const entries = await TimesheetEntry.findByTimesheetId(parseInt(timesheetId));
    
    res.json({ data: entries });
  } catch (error) {
    console.error('Error fetching timesheet entries:', error);
    res.status(500).json({ message: 'Failed to fetch timesheet entries', error: error.message });
  }
};

// Create new timesheet entry
const createTimesheetEntry = async (req, res) => {
  try {
    const entryData = {
      ...req.body,
      timesheetId: parseInt(req.params.timesheetId),
      createdBy: req.user.userId
    };

    // Validate required fields
    if (!entryData.taskDescription || !entryData.totalHours) {
      return res.status(400).json({ 
        message: 'Task description and total hours are required',
        errors: [
          { field: 'taskDescription', message: 'Task description is required' },
          { field: 'totalHours', message: 'Total hours is required' }
        ]
      });
    }

    // Check if parent timesheet exists and is editable
    const timesheet = await Timesheet.findById(entryData.timesheetId);
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    if (timesheet.STATUS !== 'DRAFT') {
      return res.status(400).json({ 
        message: 'Cannot add entries to non-draft timesheets' 
      });
    }

    const result = await TimesheetEntry.create(entryData);
    
    if (result.success) {
      const newEntry = await TimesheetEntry.findById(result.entryId);
      res.status(201).json({ 
        message: 'Timesheet entry created successfully', 
        data: newEntry 
      });
    } else {
      res.status(400).json({ message: 'Failed to create timesheet entry' });
    }
  } catch (error) {
    console.error('Error creating timesheet entry:', error);
    res.status(500).json({ message: 'Failed to create timesheet entry', error: error.message });
  }
};

// Update timesheet entry
const updateTimesheetEntry = async (req, res) => {
  try {
    const { entryId } = req.params;
    const entryData = req.body;

    // Check if entry exists
    const existingEntry = await TimesheetEntry.findById(parseInt(entryId));
    if (!existingEntry) {
      return res.status(404).json({ message: 'Timesheet entry not found' });
    }

    // Check if parent timesheet is editable
    const timesheet = await Timesheet.findById(existingEntry.TIMESHEET_ID);
    if (timesheet.STATUS !== 'DRAFT') {
      return res.status(400).json({ 
        message: 'Cannot edit entries in non-draft timesheets' 
      });
    }

    entryData.timesheetId = existingEntry.TIMESHEET_ID;
    const result = await TimesheetEntry.update(parseInt(entryId), entryData);
    
    if (result.success) {
      const updatedEntry = await TimesheetEntry.findById(parseInt(entryId));
      res.json({ 
        message: 'Timesheet entry updated successfully', 
        data: updatedEntry 
      });
    } else {
      res.status(400).json({ message: 'Failed to update timesheet entry' });
    }
  } catch (error) {
    console.error('Error updating timesheet entry:', error);
    res.status(500).json({ message: 'Failed to update timesheet entry', error: error.message });
  }
};

// Delete timesheet entry
const deleteTimesheetEntry = async (req, res) => {
  try {
    const { entryId } = req.params;

    // Check if entry exists
    const existingEntry = await TimesheetEntry.findById(parseInt(entryId));
    if (!existingEntry) {
      return res.status(404).json({ message: 'Timesheet entry not found' });
    }

    // Check if parent timesheet is editable
    const timesheet = await Timesheet.findById(existingEntry.TIMESHEET_ID);
    if (timesheet.STATUS !== 'DRAFT') {
      return res.status(400).json({ 
        message: 'Cannot delete entries from non-draft timesheets' 
      });
    }

    const result = await TimesheetEntry.delete(parseInt(entryId));
    
    if (result.success) {
      res.json({ message: 'Timesheet entry deleted successfully' });
    } else {
      res.status(400).json({ message: 'Failed to delete timesheet entry' });
    }
  } catch (error) {
    console.error('Error deleting timesheet entry:', error);
    res.status(500).json({ message: 'Failed to delete timesheet entry', error: error.message });
  }
};

// Project Controllers
// Get all projects
const getAllProjects = async (req, res) => {
  try {
    const { status, isBillable, clientName, projectName } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (isBillable !== undefined) filters.isBillable = isBillable === 'true';
    if (clientName) filters.clientName = clientName;
    if (projectName) filters.projectName = projectName;
    
    const projects = await Project.findAll(filters);
    
    res.json({ data: projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Failed to fetch projects', error: error.message });
  }
};

// Get projects for dropdown
const getProjectsDropdown = async (req, res) => {
  try {
    const projects = await Project.getDropdownList();
    res.json({ data: projects });
  } catch (error) {
    console.error('Error fetching projects dropdown:', error);
    res.status(500).json({ message: 'Failed to fetch projects', error: error.message });
  }
};

// Get project by ID
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(parseInt(id));
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.json({ data: project });
  } catch (error) {
    console.error('Error fetching project by ID:', error);
    res.status(500).json({ message: 'Failed to fetch project', error: error.message });
  }
};

// Create new project
const createProject = async (req, res) => {
  try {
    const projectData = {
      ...req.body,
      createdBy: req.user.userId
    };
    
    const result = await Project.create(projectData);
    
    if (result.success) {
      const newProject = await Project.findById(result.projectId);
      res.status(201).json({ 
        message: 'Project created successfully', 
        data: newProject 
      });
    } else {
      res.status(400).json({ message: 'Failed to create project' });
    }
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Failed to create project', error: error.message });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Project.update(parseInt(id), req.body);
    
    if (result.success) {
      const updatedProject = await Project.findById(parseInt(id));
      res.json({ 
        message: 'Project updated successfully', 
        data: updatedProject 
      });
    } else {
      res.status(400).json({ message: 'Failed to update project' });
    }
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Failed to update project', error: error.message });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if project has associated timesheet entries
    const entries = await TimesheetEntry.findByProjectId(parseInt(id));
    if (entries.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete project with associated timesheet entries. Please remove all timesheet entries first.' 
      });
    }
    
    const result = await Project.delete(parseInt(id));
    
    if (result.success) {
      res.json({ message: 'Project deleted successfully' });
    } else {
      res.status(400).json({ message: 'Failed to delete project' });
    }
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Failed to delete project', error: error.message });
  }
};

// Get time tracking statistics
const getTimeTrackingStats = async (req, res) => {
  try {
    const { employeeId, projectId, startDate, endDate } = req.query;
    
    const filters = {};
    if (employeeId) filters.employeeId = parseInt(employeeId);
    if (projectId) filters.projectId = parseInt(projectId);
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    const stats = await TimesheetEntry.getTimeTrackingStats(filters);
    
    res.json({ data: stats });
  } catch (error) {
    console.error('Error fetching time tracking statistics:', error);
    res.status(500).json({ message: 'Failed to fetch time tracking statistics', error: error.message });
  }
};

module.exports = {
  // Timesheet controllers
  getAllTimesheets,
  getTimesheetById,
  createTimesheet,
  updateTimesheet,
  updateTimesheetStatus,
  deleteTimesheet,
  getTimesheetStatistics,
  
  // Timesheet Entry controllers
  getTimesheetEntries,
  createTimesheetEntry,
  updateTimesheetEntry,
  deleteTimesheetEntry,
  
  // Project controllers
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectsDropdown,
  
  // Statistics controllers
  getTimeTrackingStats
}; 
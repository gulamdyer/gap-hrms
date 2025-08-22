const Employee = require('../models/Employee');
const { validationResult } = require('express-validator');
const MultiCountryPayrollService = require('../services/MultiCountryPayrollService');

// Import Leave model with error handling
let Leave;
try {
  Leave = require('../models/Leave');
} catch (error) {
  console.warn('⚠️ Leave model not available:', error.message);
  Leave = null;
}

// Get all employees
const getAllEmployees = async (req, res) => {
  try {
    console.log('Getting all employees...');
    console.log('User:', req.user);
    console.log('Query params:', req.query);
    
    const { status, search, page = 1, limit = 10 } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (search) filters.search = search;
    
    console.log('Filters:', filters);
    
    const employees = await Employee.getAllEmployees(filters);
    console.log('Employees fetched:', employees.length);
    
    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedEmployees = employees.slice(startIndex, endIndex);
    
    res.status(200).json({
      success: true,
      data: paginatedEmployees,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(employees.length / limit),
        totalItems: employees.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message
    });
  }
};

// Get employee by ID
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    if (employee && employee.PAYROLL_COMPANIES && typeof employee.PAYROLL_COMPANIES === 'string') {
      employee.PAYROLL_COMPANIES = employee.PAYROLL_COMPANIES.split(',');
    }
    
    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee',
      error: error.message
    });
  }
};

// Create new employee
const createEmployee = async (req, res) => {
  try {
    console.log('🔍 Creating employee...');
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
    // Parse payrollCompanies as array if sent as string
    if (cleanData.payrollCompanies && typeof cleanData.payrollCompanies === 'string') {
      cleanData.payrollCompanies = cleanData.payrollCompanies.split(',');
    }
    // In createEmployee, ensure new fields are included in cleanData and employeeData
    if (cleanData.airTicketEligible !== undefined) {
      cleanData.airTicketEligible = Number(cleanData.airTicketEligible);
    }
    
    const employeeData = {
      ...cleanData,
      createdBy: req.user.userId
    };
    
    console.log('📝 Employee data to save:', employeeData);
    
    const employeeId = await Employee.create(employeeData);
    const employee = await Employee.findById(employeeId);
    
    console.log('✅ Employee created successfully with ID:', employeeId);
    
    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });
  } catch (error) {
    console.error('❌ Error creating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create employee',
      error: error.message
    });
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
    console.log('🔍 Employee controller: updateEmployee called');
    console.log('🔍 Employee controller: req.user:', req.user);
    console.log('🔍 Employee controller: req.oldData:', req.oldData);
    console.log('🔍 Employee controller: req.body:', req.body);
    
    const { id } = req.params;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    const updateData = { ...req.body };
    if (updateData.payrollCompanies && typeof updateData.payrollCompanies === 'string') {
      updateData.payrollCompanies = updateData.payrollCompanies.split(',');
    }
    // In updateEmployee, ensure airTicketEligible is a number if present
    if (updateData.airTicketEligible !== undefined) {
      updateData.airTicketEligible = Number(updateData.airTicketEligible);
    }
    await Employee.update(id, updateData);
    const updatedEmployee = await Employee.findById(id);
    
    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employee',
      error: error.message
    });
  }
};

// Delete employee
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    try {
      await Employee.delete(id);
    } catch (err) {
      // Handle common FK constraint errors to provide user-friendly messages
      const msg = err.message || '';
      if (msg.includes('ORA-02292') || msg.toUpperCase().includes('CHILD RECORD FOUND')) {
        return res.status(409).json({
          success: false,
          code: 'FK_CONSTRAINT',
          message: 'Cannot delete employee because there are related records linked to this employee (e.g., payroll, attendance, loans, advances, resignations). Remove or reassign those records first.'
        });
      }
      if (msg.includes('ORA-00054')) {
        return res.status(423).json({
          success: false,
          code: 'LOCKED',
          message: 'Employee record is currently in use. Please try again shortly.'
        });
      }
      throw err;
    }
    
    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ success: false, message: 'Failed to delete employee', error: error.message });
  }
};

// Get employees for dropdown (reporting structure)
const getEmployeesForDropdown = async (req, res) => {
  try {
    const employees = await Employee.getEmployeesForDropdown();
    
    res.status(200).json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error('Error fetching employees for dropdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees for dropdown',
      error: error.message
    });
  }
};

// Update employee status
const updateEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    await Employee.updateStatus(id, status);
    
    res.status(200).json({
      success: true,
      message: 'Employee status updated successfully'
    });
  } catch (error) {
    console.error('Error updating employee status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employee status',
      error: error.message
    });
  }
};

// Upload employee avatar
const uploadAvatar = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Create full URL for the avatar
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const avatarUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;
    
    await Employee.update(id, { avatarUrl });
    
    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: { avatarUrl }
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload avatar',
      error: error.message
    });
  }
};

// Upload document
const uploadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { documentType } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Create full URL for the document
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const documentUrl = `${baseUrl}/uploads/documents/${req.file.filename}`;
    
    const updateData = {};
    updateData[`${documentType.toLowerCase()}ImageUrl`] = documentUrl;
    
    await Employee.update(id, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: { documentUrl }
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    console.log('🔍 Getting dashboard statistics...');
    console.log('User:', req.user);
    console.log('Headers:', req.headers);
    
    // Try to get real data first
    try {
      // Get all employees for statistics
      const allEmployees = await Employee.getAllEmployees({});
      console.log('Total employees fetched:', allEmployees.length);
      
      // Calculate statistics
      const totalEmployees = allEmployees.length;
      const activeEmployees = allEmployees.filter(emp => emp.STATUS === 'ACTIVE').length;
      const inactiveEmployees = allEmployees.filter(emp => emp.STATUS === 'INACTIVE').length;
      const terminatedEmployees = allEmployees.filter(emp => emp.STATUS === 'TERMINATED').length;
      const onboardingEmployees = allEmployees.filter(emp => emp.STATUS === 'ONBOARDING').length;
      
      console.log('Employee statistics:', {
        total: totalEmployees,
        active: activeEmployees,
        inactive: inactiveEmployees,
        terminated: terminatedEmployees,
        onboarding: onboardingEmployees
      });
      
      // Get leave statistics from the Leave model
      let leaveStats = { pendingLeaves: 0, onLeave: 0, approvedLeaves: 0 };
      try {
        // Check if Leave model and getLeaveStatistics method exist
        if (Leave && typeof Leave.getLeaveStatistics === 'function') {
          leaveStats = await Leave.getLeaveStatistics();
          console.log('Leave statistics:', leaveStats);
        } else {
          console.log('⚠️ Leave model or getLeaveStatistics not available, using fallback values');
        }
      } catch (error) {
        console.error('Error fetching leave statistics:', error);
        // Continue with default values if leave stats fail
      }
      
      const onLeave = leaveStats.onLeave;
      const pendingLeaves = leaveStats.pendingLeaves;
      const approvedLeaves = leaveStats.approvedLeaves;
      
      // Calculate percentage changes (mock data for now)
      const totalEmployeesChange = '+12%';
      const activeEmployeesChange = '+5%';
      
      const responseData = {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        terminatedEmployees,
        onboardingEmployees,
        onLeave,
        pendingLeaves,
        approvedLeaves,
        totalEmployeesChange,
        activeEmployeesChange
      };
      
      console.log('Final response data:', responseData);
      
      res.status(200).json({
        success: true,
        data: responseData
      });
    } catch (dbError) {
      console.log('⚠️ Database error, returning mock data:', dbError.message);
      
      // Return mock data when database is not available
      const mockData = {
        totalEmployees: 25,
        activeEmployees: 20,
        inactiveEmployees: 3,
        terminatedEmployees: 1,
        onboardingEmployees: 1,
        onLeave: 2,
        pendingLeaves: 3,
        approvedLeaves: 15,
        totalEmployeesChange: '+12%',
        activeEmployeesChange: '+5%'
      };
      
      console.log('Returning mock data:', mockData);
      
      res.status(200).json({
        success: true,
        data: mockData
      });
    }
  } catch (error) {
    console.error('❌ Error fetching dashboard statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

// Get all active countries for dropdown
const getCountriesDropdown = async (req, res) => {
  console.log('🔍 [getCountriesDropdown] Called');
  const start = Date.now();
  try {
    console.log('🔍 [getCountriesDropdown] Fetching countries from MultiCountryPayrollService...');
    const countries = await MultiCountryPayrollService.getAvailableCountries();
    console.log('🔍 [getCountriesDropdown] Countries fetched:', countries.length, 'Elapsed:', Date.now() - start, 'ms');
    res.status(200).json({ success: true, data: countries.map(c => ({ code: c.COUNTRY_CODE, name: c.COUNTRY_NAME })) });
  } catch (error) {
    console.error('❌ [getCountriesDropdown] Error fetching countries:', error, 'Elapsed:', Date.now() - start, 'ms');
    res.status(500).json({ success: false, message: 'Failed to fetch countries', error: error.message });
  }
};

// Calculate real-time CTC based on country and compensation
const calculateRealTimeCTC = async (req, res) => {
  try {
    console.log('🔍 [calculateRealTimeCTC] Called with body:', req.body);
    const { employeeData, compensationData } = req.body;
    
    if (!employeeData || !employeeData.countryCode) {
      return res.status(400).json({
        success: false,
        message: 'Employee data with country code is required'
      });
    }

    if (!compensationData || !Array.isArray(compensationData)) {
      return res.status(400).json({
        success: false,
        message: 'Compensation data array is required'
      });
    }

    const ctcCalculation = await MultiCountryPayrollService.calculateRealTimeCTC(employeeData, compensationData);
    
    res.status(200).json({
      success: true,
      data: ctcCalculation,
      message: 'CTC calculated successfully'
    });
  } catch (error) {
    console.error('❌ [calculateRealTimeCTC] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate CTC',
      error: error.message
    });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeesForDropdown,
  updateEmployeeStatus,
  uploadAvatar,
  uploadDocument,
  getDashboardStats,
  getCountriesDropdown,
  calculateRealTimeCTC
}; 
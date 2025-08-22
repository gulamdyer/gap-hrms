const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const EmployeeCompensation = require('../models/EmployeeCompensation');
const PayrollSettings = require('../models/PayrollSettings');

// @desc    Create payroll period
// @route   POST /api/payroll/periods
// @access  Private (ADMIN, HR)
const createPayrollPeriod = async (req, res) => {
  try {
    const { periodName, periodType, startDate, endDate, payDate } = req.body;
    const createdBy = req.user.userId;

    const periodData = {
      periodName,
      periodType,
      startDate,
      endDate,
      payDate,
      status: 'DRAFT'
    };

    const periodId = await Payroll.createPayrollPeriod(periodData, createdBy);

    res.status(201).json({
      success: true,
      message: 'Payroll period created successfully',
      data: { periodId }
    });

  } catch (error) {
    console.error('Error creating payroll period:', error);
    
    if (error.message.includes('ORA-00001')) {
      return res.status(400).json({
        success: false,
        message: 'A payroll period with these dates already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create payroll period',
      error: error.message
    });
  }
};

// @desc    Get all payroll periods
// @route   GET /api/payroll/periods
// @access  Private (ADMIN, HR)
const getAllPayrollPeriods = async (req, res) => {
  try {
    const { status, periodType, search } = req.query;
    const filters = { status, periodType, search };

    const periods = await Payroll.getAllPayrollPeriods(filters);

    res.status(200).json({
      success: true,
      data: periods
    });

  } catch (error) {
    console.error('Error fetching payroll periods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll periods',
      error: error.message
    });
  }
};

// @desc    Get payroll period by ID
// @route   GET /api/payroll/periods/:id
// @access  Private (ADMIN, HR)
const getPayrollPeriodById = async (req, res) => {
  try {
    const { id } = req.params;
    const period = await Payroll.getPayrollPeriodById(id);

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Payroll period not found'
      });
    }

    res.status(200).json({
      success: true,
      data: period
    });

  } catch (error) {
    console.error('Error fetching payroll period:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll period',
      error: error.message
    });
  }
};

// @desc    Update payroll period
// @route   PUT /api/payroll/periods/:id
// @access  Private (ADMIN, HR)
const updatePayrollPeriod = async (req, res) => {
  try {
    const { id } = req.params;
    const { periodName, periodType, startDate, endDate, payDate } = req.body;
    const updatedBy = req.user.userId;

    // Check if period exists
    const existingPeriod = await Payroll.getPayrollPeriodById(id);
    if (!existingPeriod) {
      return res.status(404).json({
        success: false,
        message: 'Payroll period not found'
      });
    }

    // Check if period is in a state that can be updated
    if (existingPeriod.STATUS !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Only DRAFT periods can be updated'
      });
    }

    const updateData = {
      periodName,
      periodType,
      startDate,
      endDate,
      payDate
    };

    await Payroll.updatePayrollPeriod(id, updateData, updatedBy);

    res.status(200).json({
      success: true,
      message: 'Payroll period updated successfully'
    });

  } catch (error) {
    console.error('Error updating payroll period:', error);
    
    if (error.message.includes('ORA-00001')) {
      return res.status(400).json({
        success: false,
        message: 'A payroll period with these dates already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update payroll period',
      error: error.message
    });
  }
};

// @desc    Process payroll for a period
// @route   POST /api/payroll/process
// @access  Private (ADMIN, HR)
const processPayroll = async (req, res) => {
  try {
    console.log('🔍 processPayroll called with body:', req.body);
    const { periodId, employeeIds } = req.body;
    const createdBy = req.user.userId;

    console.log('📊 Processing payroll for periodId:', periodId, 'createdBy:', createdBy);

    // Get period details
    console.log('🔍 Getting period details...');
    const period = await Payroll.getPayrollPeriodById(periodId);
    console.log('📊 Period details:', period);
    
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Payroll period not found'
      });
    }

    if (period.STATUS !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Payroll period is not in DRAFT status'
      });
    }

    // Create payroll run
    console.log('🔍 Creating payroll run...');
    const runData = {
      periodId,
      runName: `Payroll Run - ${period.PERIOD_NAME}`,
      runType: employeeIds ? 'PARTIAL' : 'FULL',
      status: 'IN_PROGRESS'
    };

    console.log('📊 Run data:', runData);
    const runId = await Payroll.createPayrollRun(runData, createdBy);
    console.log('📊 Created run with ID:', runId);

    // Get employees to process
    console.log('🔍 Getting employees to process...');
    let employees = [];
    if (employeeIds && employeeIds.length > 0) {
      // Process specific employees
      console.log('📊 Processing specific employees:', employeeIds);
      for (const employeeId of employeeIds) {
        const employee = await Employee.findById(employeeId);
        if (employee) {
          employees.push(employee);
        }
      }
    } else {
      // Process all active employees
      console.log('📊 Processing all active employees...');
      try {
        employees = await Employee.getAllEmployees({ status: 'ACTIVE' });
        console.log('📊 Found employees:', employees.length);
      } catch (error) {
        console.log('⚠️ Error getting employees, using test employee');
        // Create a test employee if none found
        employees = [{
          EMPLOYEE_ID: 1,
          FIRST_NAME: 'Test',
          LAST_NAME: 'Employee',
          EMPLOYEE_CODE: 'EMP001',
          STATUS: 'ACTIVE'
        }];
      }
    }

    const results = {
      totalEmployees: employees.length,
      processedEmployees: 0,
      failedEmployees: 0,
      errors: []
    };

    console.log('🔍 Starting payroll calculation for employees...');

    // Process each employee
    for (const employee of employees) {
      try {
        console.log(`🔍 Processing employee: ${employee.EMPLOYEE_ID} - ${employee.FIRST_NAME} ${employee.LAST_NAME}`);
        await Payroll.calculateEmployeePayroll(employee.EMPLOYEE_ID, periodId, runId, createdBy);
        results.processedEmployees++;
        console.log(`✅ Successfully processed employee: ${employee.EMPLOYEE_ID}`);
      } catch (error) {
        console.error(`❌ Error processing employee ${employee.EMPLOYEE_ID}:`, error);
        results.failedEmployees++;
        results.errors.push({
          employeeId: employee.EMPLOYEE_ID,
          employeeName: `${employee.FIRST_NAME} ${employee.LAST_NAME}`,
          error: error.message
        });
      }
    }

    console.log('📊 Processing results:', results);

    // Create user-friendly error summary
    let userFriendlyErrorSummary = null;
    if (results.errors.length > 0) {
      userFriendlyErrorSummary = Payroll.createUserFriendlyErrorSummary(results.errors);
      console.log('📊 User-friendly error summary created');
    }

    // Update run status
    const runStatus = results.failedEmployees === 0 ? 'COMPLETED' : 'COMPLETED_WITH_ERRORS';
    
    // Store both technical and user-friendly error messages
    const errorMessage = results.errors.length > 0 ? 
      JSON.stringify({
        technical: results.errors,
        userFriendly: userFriendlyErrorSummary
      }) : null;
    
    await Payroll.updatePayrollRunStatus(runId, runStatus, null, errorMessage);

    // Update period status
    if (results.failedEmployees === 0) {
      // Update period totals
      const statistics = await Payroll.getPayrollStatistics(periodId);
      // TODO: Update period totals in HRMS_PAYROLL_PERIODS table
    }

    res.status(200).json({
      success: true,
      message: 'Payroll processing completed',
      data: {
        runId,
        results
      }
    });

  } catch (error) {
    console.error('❌ Error processing payroll:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to process payroll',
      error: error.message,
      details: error.stack
    });
  }
};

// @desc    Get payroll details by period
// @route   GET /api/payroll/periods/:id/details
// @access  Private (ADMIN, HR)
const getPayrollDetailsByPeriod = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, search } = req.query;

    console.log('Fetching payroll details for period ID:', id);

    const payrollDetails = await Payroll.getPayrollDetailsByPeriod(id);
    console.log('Payroll details fetched:', payrollDetails?.length || 0);

    // Apply pagination and search if needed
    let filteredData = payrollDetails || [];
    
    if (search) {
      filteredData = filteredData.filter(item => 
        item.EMPLOYEE_FIRST_NAME?.toLowerCase().includes(search.toLowerCase()) ||
        item.EMPLOYEE_LAST_NAME?.toLowerCase().includes(search.toLowerCase()) ||
        item.EMPLOYEE_CODE?.toLowerCase().includes(search.toLowerCase())
      );
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedData = filteredData.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: paginatedData,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredData.length / limit),
        totalItems: filteredData.length,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching payroll details:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll details',
      error: error.message,
      details: error.stack
    });
  }
};

// @desc    Get payroll detail by ID
// @route   GET /api/payroll/details/:id
// @access  Private (ADMIN, HR)
const getPayrollDetailById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching payroll detail for ID:', id);

    const payrollDetail = await Payroll.getPayrollDetailById(id);
    console.log('Payroll detail result:', payrollDetail ? 'Found' : 'Not found');

    if (!payrollDetail) {
      return res.status(404).json({
        success: false,
        message: 'Payroll detail not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payrollDetail
    });

  } catch (error) {
    console.error('Error fetching payroll detail:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll detail',
      error: error.message,
      details: error.stack
    });
  }
};

// @desc    Approve payroll
// @route   POST /api/payroll/details/:id/approve
// @access  Private (ADMIN, HR)
const approvePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const approvedBy = req.user.userId;

    const payrollDetail = await Payroll.getPayrollDetailById(id);
    if (!payrollDetail) {
      return res.status(404).json({
        success: false,
        message: 'Payroll detail not found'
      });
    }

    if (payrollDetail.STATUS !== 'CALCULATED') {
      return res.status(400).json({
        success: false,
        message: 'Payroll is not in CALCULATED status'
      });
    }

    await Payroll.approvePayroll(id, approvedBy, comments);

    res.status(200).json({
      success: true,
      message: 'Payroll approved successfully'
    });

  } catch (error) {
    console.error('Error approving payroll:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve payroll',
      error: error.message
    });
  }
};

// @desc    Get payroll statistics
// @route   GET /api/payroll/periods/:id/statistics
// @access  Private (ADMIN, HR)
const getPayrollStatistics = async (req, res) => {
  try {
    const { id } = req.params;
    const statistics = await Payroll.getPayrollStatistics(id);

    res.status(200).json({
      success: true,
      data: statistics
    });

  } catch (error) {
    console.error('Error fetching payroll statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll statistics',
      error: error.message
    });
  }
};

// @desc    Get payroll dashboard data
// @route   GET /api/payroll/dashboard
// @access  Private (ADMIN, HR)
const getPayrollDashboard = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Get all payroll periods (not just completed ones)
    const allPeriods = await Payroll.getAllPayrollPeriods();

    // Get recent periods (all periods, ordered by creation date)
    const recentPeriods = allPeriods.slice(0, 10);

    // Get payroll statistics for the date range
    let periodStatistics = [];
    if (startDate && endDate) {
      // TODO: Implement date range statistics
    }

    // Get pending approvals
    // TODO: Implement pending approvals query

    const dashboardData = {
      recentPeriods: recentPeriods,
      periodStatistics,
      pendingApprovals: [],
      summary: {
        totalPeriods: allPeriods.length,
        totalProcessed: allPeriods.filter(p => p.STATUS === 'COMPLETED').length,
        totalPending: allPeriods.filter(p => p.STATUS === 'DRAFT').length
      }
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching payroll dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll dashboard',
      error: error.message
    });
  }
};

// @desc    Initialize payroll settings
// @route   POST /api/payroll/initialize-settings
// @access  Private (ADMIN)
const initializePayrollSettings = async (req, res) => {
  try {
    const createdBy = req.user.userId;
    await Payroll.initializeDefaultSettings(createdBy);

    res.status(200).json({
      success: true,
      message: 'Payroll settings initialized successfully'
    });

  } catch (error) {
    console.error('Error initializing payroll settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize payroll settings',
      error: error.message
    });
  }
};

// @desc    Get payroll runs
// @route   GET /api/payroll/runs
// @access  Private (ADMIN, HR)
const getPayrollRuns = async (req, res) => {
  try {
    const { periodId } = req.query;
    
    // TODO: Implement getPayrollRuns method in Payroll model
    const runs = []; // Placeholder

    res.status(200).json({
      success: true,
      data: runs
    });

  } catch (error) {
    console.error('Error fetching payroll runs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll runs',
      error: error.message
    });
  }
};

// @desc    Process month-end payroll
// @route   POST /api/payroll/month-end
// @access  Private (ADMIN, HR)
const processMonthEndPayroll = async (req, res) => {
  try {
    const { month, year, processType = 'FULL' } = req.body;
    const createdBy = req.user?.userId;

    console.log('🔍 Month-end payroll processing request:', {
      month,
      year,
      processType,
      createdBy,
      user: req.user ? { userId: req.user.userId, username: req.user.username } : 'NO_USER'
    });

    // Validate month and year
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    // Validate user authentication
    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required. Please log in again.'
      });
    }

    // Call Oracle stored procedure to process month-end payroll
    const result = await Payroll.processMonthEndPayrollProcedure(month, year, processType, createdBy);

    res.status(200).json({
      success: true,
      message: 'Month-end payroll processing completed',
      data: {
        ...result
      }
    });

  } catch (error) {
    console.error('Error processing month-end payroll:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process month-end payroll',
      error: error.message
    });
  }
};

// @desc    Get month-end processing status
// @route   GET /api/payroll/month-end/status
// @access  Private (ADMIN, HR)
const getMonthEndStatus = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDayOfMonth}`;

    // Check if period exists
    const period = await Payroll.getPayrollPeriodByDateRange(startDate, endDate);
    
    if (!period) {
      return res.status(200).json({
        success: true,
        data: {
          exists: false,
          message: 'No payroll period found for this month'
        }
      });
    }

    // Get processing statistics
    const statistics = await Payroll.getPayrollStatistics(period.PERIOD_ID);
    const runs = await Payroll.getPayrollRunsByPeriod(period.PERIOD_ID);

    res.status(200).json({
      success: true,
      data: {
        exists: true,
        period,
        statistics,
        runs,
        status: period.STATUS
      }
    });

  } catch (error) {
    console.error('Error getting month-end status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get month-end status',
      error: error.message
    });
  }
};

// @desc    Approve month-end payroll
// @route   POST /api/payroll/month-end/:periodId/approve
// @access  Private (ADMIN, HR)
const approveMonthEndPayroll = async (req, res) => {
  try {
    const { periodId } = req.params;
    const { comments } = req.body;
    const approvedBy = req.user.userId;

    const period = await Payroll.getPayrollPeriodById(periodId);
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Payroll period not found'
      });
    }

    if (period.STATUS !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Payroll period is not in COMPLETED status'
      });
    }

    // Approve all payroll details for this period
    await Payroll.approvePayrollPeriod(periodId, approvedBy, comments);

    // Update period status
    await Payroll.updatePeriodStatus(periodId, 'APPROVED');

    res.status(200).json({
      success: true,
      message: 'Month-end payroll approved successfully'
    });

  } catch (error) {
    console.error('Error approving month-end payroll:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve month-end payroll',
      error: error.message
    });
  }
};

// @desc    Generate month-end reports
// @route   GET /api/payroll/month-end/:periodId/reports
// @access  Private (ADMIN, HR)
const generateMonthEndReports = async (req, res) => {
  try {
    const { periodId } = req.params;
    const { reportType = 'SUMMARY' } = req.query;

    const period = await Payroll.getPayrollPeriodById(periodId);
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Payroll period not found'
      });
    }

    let reportData = {};

    switch (reportType) {
      case 'SUMMARY':
        reportData = await Payroll.generateSummaryReport(periodId);
        break;
      case 'DETAILED':
        reportData = await Payroll.generateDetailedReport(periodId);
        break;
      case 'DEPARTMENT':
        reportData = await Payroll.generateDepartmentReport(periodId);
        break;
      case 'TAX':
        reportData = await Payroll.generateTaxReport(periodId);
        break;
      case 'PF':
        reportData = await Payroll.generatePFReport(periodId);
        break;
      case 'ESI':
        reportData = await Payroll.generateESIReport(periodId);
        break;
      case 'BANK':
        reportData = await Payroll.generateBankReport(periodId);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    res.status(200).json({
      success: true,
      data: {
        period,
        reportType,
        reportData
      }
    });

  } catch (error) {
    console.error('Error generating month-end reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate month-end reports',
      error: error.message
    });
  }
};

// @desc    Get payroll runs by period
// @route   GET /api/payroll/periods/:id/runs
// @access  Private (ADMIN, HR)
const getPayrollRunsByPeriod = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Getting payroll runs for period ID:', id);

    // Get period details first
    const period = await Payroll.getPayrollPeriodById(id);
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Payroll period not found'
      });
    }

    // Get payroll runs for this period
    const runs = await Payroll.getPayrollRunsByPeriod(id);
    console.log('📊 Found payroll runs:', runs.length);

    res.status(200).json({
      success: true,
      data: {
        period,
        runs
      }
    });

  } catch (error) {
    console.error('Error fetching payroll runs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll runs',
      error: error.message
    });
  }
};



module.exports = {
  createPayrollPeriod,
  getAllPayrollPeriods,
  getPayrollPeriodById,
  updatePayrollPeriod,
  processPayroll,
  getPayrollDetailsByPeriod,
  getPayrollDetailById,
  approvePayroll,
  getPayrollStatistics,
  getPayrollDashboard,
  initializePayrollSettings,
  getPayrollRuns,
  processMonthEndPayroll,
  getMonthEndStatus,
  approveMonthEndPayroll,
  generateMonthEndReports,
  getPayrollRunsByPeriod
}; 

// --- New endpoints for attendance processing at month-end ---

// @desc    Preview attendance summary for month-end
// @route   GET /api/payroll/month-end/attendance/summary?month=&year=
// @access  Private (ADMIN, HR)
const getMonthEndAttendanceSummary = async (req, res) => {
  try {
    const { month, year, source, recalculate } = req.query;
    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }

    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (source === 'existing') {
      const existing = await Payroll.getExistingAttendanceSummary(m, y);
      return res.status(200).json({ success: true, data: existing, meta: { source: 'existing' } });
    }

    const existence = await Payroll.attendanceSummaryExists(m, y);

    // If explicit recalc requested: recompute and persist (merge) regardless of existence; FINAL_* preserved
    if (recalculate === 'true' || recalculate === '1') {
      await Payroll.runProcessAttendanceProcedure(m, y, req.user.userId);
      const saved = await Payroll.getExistingAttendanceSummary(m, y);
      return res.status(200).json({ success: true, data: saved, meta: { source: 'procedure' } });
    }

    // Default behavior: compute and snapshot only if nothing exists yet
    if (!existence.exists) {
      await Payroll.runProcessAttendanceProcedure(m, y, req.user.userId);
    }
    const saved = await Payroll.getExistingAttendanceSummary(m, y);
    res.status(200).json({ success: true, data: saved || [], meta: { source: 'procedure', alreadyExists: true } });
  } catch (error) {
    console.error('Error getting attendance summary:', error);
    res.status(500).json({ success: false, message: 'Failed to get attendance summary', error: error.message });
  }
};

// @desc    Persist attendance summary for month-end
// @route   POST /api/payroll/month-end/attendance/confirm
// @access  Private (ADMIN, HR)
const confirmMonthEndAttendanceSummary = async (req, res) => {
  try {
    const { month, year } = req.body;
    const createdBy = req.user.userId;

    console.log('🔄 Processing attendance summary confirmation:', { month, year, createdBy });

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }

    // Validate month and year
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    if (monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ success: false, message: 'Invalid month. Must be between 1 and 12' });
    }
    
    if (yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({ success: false, message: 'Invalid year. Must be between 2000 and 2100' });
    }

    console.log('✅ Parameters validated. Ensuring attendance summary table...');
    await Payroll.ensureAttendanceSummaryTable();
    
    console.log('✅ Table ensured. Saving monthly attendance summary...');
    const result = await Payroll.saveMonthlyAttendanceSummary(monthNum, yearNum, createdBy);
    
    console.log('✅ Attendance summary saved successfully:', result);
    res.status(200).json({ success: true, message: 'Attendance summary saved', data: result });
  } catch (error) {
    console.error('❌ Error saving attendance summary:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to save attendance summary';
    if (error.message.includes('ORA-00942')) {
      errorMessage = 'Required database tables are missing. Please check your database setup.';
    } else if (error.message.includes('ORA-01722')) {
      errorMessage = 'Invalid number format in date calculations.';
    } else if (error.message.includes('ORA-01847') || error.message.includes('ORA-01861')) {
      errorMessage = 'Invalid date format in calculations.';
    } else if (error.message.includes('FK_ATT_SUMMARY_CREATED_BY') || error.message.includes('ORA-02291')) {
      errorMessage = 'Invalid user ID for created_by field.';
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage, 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Process attendance for step-based workflow
// @route   POST /api/payroll/process-attendance
// @access  Private (ADMIN, HR)
const processAttendance = async (req, res) => {
  try {
    const { month, year } = req.body;
    const createdBy = req.user.userId;

    console.log('🔄 Step 3: Processing attendance for step-based workflow:', { month, year, createdBy });

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }

    // Validate month and year
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    if (monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ success: false, message: 'Invalid month. Must be between 1 and 12' });
    }
    
    if (yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({ success: false, message: 'Invalid year. Must be between 2000 and 2100' });
    }

    // Check if attendance already processed
    const existingData = await Payroll.checkAttendanceProcessed(monthNum, yearNum);
    if (existingData) {
      console.log('✅ Attendance already processed, returning existing data');
      return res.status(200).json({ 
        success: true, 
        attendanceSummary: existingData,
        saved: true,
        alreadyProcessed: true
      });
    }

    console.log('✅ Processing attendance data using stored procedure...');
    
    // First, ensure the attendance summary table and stored procedure exist
    await Payroll.ensureAttendanceSummaryTable();
    await Payroll.ensureProcessAttendanceProcedure();
    
    // Check if there's any raw attendance data for the period
    console.log('🔍 Checking for raw attendance data...');
    const rawAttendanceCount = await Payroll.getRawAttendanceCount(monthNum, yearNum);
    console.log(`📊 Found ${rawAttendanceCount} raw attendance records for ${yearNum}-${monthNum}`);
    
    // If no raw attendance data exists, create default attendance records for active employees
    if (rawAttendanceCount === 0) {
      console.log('⚠️ No raw attendance data found, creating default attendance records...');
      await Payroll.createDefaultAttendanceRecords(monthNum, yearNum, createdBy);
      console.log('✅ Default attendance records created');
    }
    
    // Run the stored procedure to process raw attendance into summary
    await Payroll.runProcessAttendanceProcedure(monthNum, yearNum, createdBy);
    console.log('✅ Attendance processing procedure completed');
    
    // Now get the processed monthly attendance summary
    console.log('✅ Getting monthly attendance summary...');
    const attendanceSummary = await Payroll.getMonthlyAttendanceSummary(monthNum, yearNum);
    console.log('✅ Attendance summary retrieved with', attendanceSummary?.length || 0, 'employees');
    
    if (attendanceSummary && attendanceSummary.length > 0) {
      console.log('🔍 DEBUG: Controller - First employee data:', attendanceSummary[0]);
      console.log('🔍 DEBUG: Controller - PRESENT_DAYS:', attendanceSummary[0].PRESENT_DAYS);
      console.log('🔍 DEBUG: Controller - TOTAL_WORK_HOURS:', attendanceSummary[0].TOTAL_WORK_HOURS);
    }
    
    console.log('🔍 DEBUG: Controller - Full response being sent:', {
      success: true, 
      attendanceSummary,
      saved: false,
      alreadyProcessed: false
    });
    
    res.status(200).json({ 
      success: true, 
      attendanceSummary,
      saved: false,
      alreadyProcessed: false
    });
  } catch (error) {
    console.error('❌ Error in Step 3 - Process Attendance:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to process attendance';
    if (error.message.includes('ORA-01036')) {
      errorMessage = 'Database parameter binding error. Please try again or use simplified processing.';
    } else if (error.message.includes('ORA-00942')) {
      errorMessage = 'Required database tables are missing. Please check your database setup.';
    } else if (error.message.includes('ORA-01722')) {
      errorMessage = 'Invalid number format in date calculations.';
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage, 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Save attendance summary for step-based workflow
// @route   POST /api/payroll/save-attendance
// @access  Private (ADMIN, HR)
const saveAttendanceSummary = async (req, res) => {
  try {
    const { month, year, attendanceSummary } = req.body;
    const createdBy = req.user.userId;

    console.log('🔄 Saving attendance summary:', { month, year, createdBy, recordCount: attendanceSummary?.length || 0 });

    if (!month || !year || !attendanceSummary) {
      return res.status(400).json({ success: false, message: 'Month, year, and attendance summary are required' });
    }

    // Validate month and year
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    if (monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ success: false, message: 'Invalid month. Must be between 1 and 12' });
    }
    
    if (yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({ success: false, message: 'Invalid year. Must be between 2000 and 2100' });
    }

    console.log('✅ Ensuring attendance summary table...');
    await Payroll.ensureAttendanceSummaryTable();
    
    console.log('✅ Saving monthly attendance summary...');
    const result = await Payroll.saveMonthlyAttendanceSummary(monthNum, yearNum, createdBy);
    
    console.log('✅ Attendance summary saved successfully:', result);
    res.status(200).json({ 
      success: true, 
      message: 'Attendance summary saved successfully',
      data: result 
    });
  } catch (error) {
    console.error('❌ Error saving attendance summary:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to save attendance summary';
    if (error.message.includes('ORA-01036')) {
      errorMessage = 'Database parameter binding error. Please try again.';
    } else if (error.message.includes('ORA-00942')) {
      errorMessage = 'Required database tables are missing. Please check your database setup.';
    } else if (error.message.includes('ORA-02291')) {
      errorMessage = 'Invalid user ID for created_by field.';
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage, 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports.getMonthEndAttendanceSummary = getMonthEndAttendanceSummary;
module.exports.confirmMonthEndAttendanceSummary = confirmMonthEndAttendanceSummary;
module.exports.processAttendance = processAttendance;
module.exports.saveAttendanceSummary = saveAttendanceSummary;

// @desc    Update FINAL_* editable fields for an employee/month row
// @route   PUT /api/payroll/month-end/attendance/final
// @access  Private (ADMIN, HR)
const updateMonthEndAttendanceFinal = async (req, res) => {
  try {
    const { month, year, employeeId, finalValues, baseValues } = req.body;
    const userId = req.user.userId;
    
    if (!month || !year || !employeeId || !finalValues) {
      return res.status(400).json({ success: false, message: 'month, year, employeeId and finalValues are required' });
    }
    
    await Payroll.upsertAttendanceFinal(parseInt(month, 10), parseInt(year, 10), employeeId, finalValues, baseValues || {}, userId);
    res.status(200).json({ success: true, message: 'Final attendance values saved' });
  } catch (error) {
    console.error('Error updating final attendance values:', error);
    res.status(500).json({ success: false, message: 'Failed to save final attendance values', error: error.message });
  }
};

module.exports.updateMonthEndAttendanceFinal = updateMonthEndAttendanceFinal;

// @desc    Clean data for a given month/year
// @route   DELETE /api/payroll/month-end/clean
// @access  Private (ADMIN, HR)
const cleanMonthEndData = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const result = await Payroll.cleanMonthData(m, y);
    res.status(200).json({ success: true, message: 'Month data cleaned', data: result });
  } catch (error) {
    console.error('Error cleaning month-end data:', error);
    res.status(500).json({ success: false, message: 'Failed to clean month-end data', error: error.message });
  }
};

module.exports.cleanMonthEndData = cleanMonthEndData;

// @desc    Validate month-end payroll prerequisites
// @route   GET /api/payroll/month-end/validate
// @access  Private (ADMIN, HR)
const validateMonthEndPrerequisites = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDayOfMonth}`;

    // Initialize validation results
    const validation = {
      month,
      year,
      startDate,
      endDate,
      checks: {
        activeEmployees: { status: 'PENDING', count: 0, issues: [] },
        calendarAssignment: { status: 'PENDING', count: 0, issues: [] },
        shiftAssignment: { status: 'PENDING', count: 0, issues: [] },
        compensationInfo: { status: 'PENDING', count: 0, issues: [] },
        holidayConfiguration: { status: 'PENDING', count: 0, issues: [] },
        weeklyOffConfiguration: { status: 'PENDING', count: 0, issues: [] }
      },
      overallStatus: 'PENDING',
      summary: {
        totalChecks: 6,
        passedChecks: 0,
        failedChecks: 0,
        warnings: 0
      },
      totalEmployees: 0,
      passedEmployees: 0
    };

    // Check 1: Active Employees
    try {
      const activeEmployees = await Employee.getAllEmployees({ status: 'ACTIVE' });
      validation.checks.activeEmployees.count = activeEmployees.length;
      validation.totalEmployees = activeEmployees.length; // Set total employees for frontend
      
      if (activeEmployees.length === 0) {
        validation.checks.activeEmployees.status = 'FAILED';
        validation.checks.activeEmployees.issues.push('No active employees found');
        validation.summary.failedChecks++;
      } else {
        validation.checks.activeEmployees.status = 'PASSED';
        validation.summary.passedChecks++;
      }
    } catch (error) {
      validation.checks.activeEmployees.status = 'FAILED';
      validation.checks.activeEmployees.issues.push(`Error fetching employees: ${error.message}`);
      validation.summary.failedChecks++;
    }

    // Check 2: Calendar Assignment
    try {
      const employeesWithCalendar = await Employee.getAllEmployees({ status: 'ACTIVE' });
      let calendarIssues = 0;
      let calendarAssigned = 0;

      for (const emp of employeesWithCalendar) {
        if (!emp.CALENDAR_ID) {
          calendarIssues++;
          validation.checks.calendarAssignment.issues.push(
            `Employee ${emp.EMPLOYEE_CODE} (${emp.FIRST_NAME} ${emp.LAST_NAME}) has no calendar assigned`
          );
        } else {
          calendarAssigned++;
        }
      }

      validation.checks.calendarAssignment.count = calendarAssigned;
      
      if (calendarIssues === 0) {
        validation.checks.calendarAssignment.status = 'PASSED';
        validation.summary.passedChecks++;
      } else if (calendarAssigned > 0) {
        validation.checks.calendarAssignment.status = 'WARNING';
        validation.summary.warnings++;
      } else {
        validation.checks.calendarAssignment.status = 'FAILED';
        validation.summary.failedChecks++;
      }
    } catch (error) {
      validation.checks.calendarAssignment.status = 'FAILED';
      validation.checks.calendarAssignment.issues.push(`Error checking calendar assignment: ${error.message}`);
      validation.summary.failedChecks++;
    }

    // Check 3: Shift Assignment
    try {
      const employeesWithShift = await Employee.getAllEmployees({ status: 'ACTIVE' });
      let shiftIssues = 0;
      let shiftAssigned = 0;

      for (const emp of employeesWithShift) {
        if (!emp.SHIFT_ID) {
          shiftIssues++;
          validation.checks.shiftAssignment.issues.push(
            `Employee ${emp.EMPLOYEE_CODE} (${emp.FIRST_NAME} ${emp.LAST_NAME}) has no shift assigned`
          );
        } else {
          shiftAssigned++;
        }
      }

      validation.checks.shiftAssignment.count = shiftAssigned;
      
      if (shiftIssues === 0) {
        validation.checks.shiftAssignment.status = 'PASSED';
        validation.summary.passedChecks++;
      } else if (shiftAssigned > 0) {
        validation.checks.shiftAssignment.status = 'WARNING';
        validation.summary.warnings++;
      } else {
        validation.checks.shiftAssignment.status = 'FAILED';
        validation.summary.failedChecks++;
      }
    } catch (error) {
      validation.checks.shiftAssignment.status = 'FAILED';
      validation.checks.shiftAssignment.issues.push(`Error checking shift assignment: ${error.message}`);
      validation.summary.failedChecks++;
    }

    // Check 4: Compensation Information
    try {
      const EmployeeCompensation = require('../models/EmployeeCompensation');
      const activeEmployees = await Employee.getAllEmployees({ status: 'ACTIVE' });
      let compensationIssues = 0;
      let compensationValid = 0;

      for (const emp of activeEmployees) {
        try {
          const compensation = await EmployeeCompensation.getActiveCompensation(emp.EMPLOYEE_ID, startDate);
          if (compensation.length === 0) {
            compensationIssues++;
            validation.checks.compensationInfo.issues.push(
              `Employee ${emp.EMPLOYEE_CODE} (${emp.FIRST_NAME} ${emp.LAST_NAME}) has no active compensation for ${startDate}`
            );
          } else {
            compensationValid++;
          }
        } catch (compError) {
          compensationIssues++;
          validation.checks.compensationInfo.issues.push(
            `Error checking compensation for ${emp.EMPLOYEE_CODE}: ${compError.message}`
          );
        }
      }

      validation.checks.compensationInfo.count = compensationValid;
      validation.passedEmployees = compensationValid; // Set passed employees for frontend
      
      if (compensationIssues === 0) {
        validation.checks.compensationInfo.status = 'PASSED';
        validation.summary.passedChecks++;
      } else if (compensationValid > 0) {
        validation.checks.compensationInfo.status = 'WARNING';
        validation.summary.warnings++;
      } else {
        validation.checks.compensationInfo.status = 'FAILED';
        validation.summary.failedChecks++;
      }
    } catch (error) {
      validation.checks.compensationInfo.status = 'FAILED';
      validation.checks.compensationInfo.issues.push(`Error checking compensation: ${error.message}`);
      validation.summary.failedChecks++;
    }

    // Check 5: Holiday Configuration
    try {
      const Calendar = require('../models/Calendar');
      const activeEmployees = await Employee.getAllEmployees({ status: 'ACTIVE' });
      let holidayIssues = 0;
      let holidayValid = 0;

      for (const emp of activeEmployees) {
        if (emp.CALENDAR_ID) {
          try {
            const holidays = await Calendar.getWeeklyHolidays(emp.CALENDAR_ID);
            if (holidays.length === 0) {
              holidayIssues++;
              validation.checks.holidayConfiguration.issues.push(
                `Calendar ${emp.CALENDAR_ID} has no holidays configured`
              );
            } else {
              holidayValid++;
            }
          } catch (holidayError) {
            holidayIssues++;
            validation.checks.holidayConfiguration.issues.push(
              `Error checking holidays for calendar ${emp.CALENDAR_ID}: ${holidayError.message}`
            );
          }
        }
      }

      validation.checks.holidayConfiguration.count = holidayValid;
      
      if (holidayIssues === 0) {
        validation.checks.holidayConfiguration.status = 'PASSED';
        validation.summary.passedChecks++;
      } else if (holidayValid > 0) {
        validation.checks.holidayConfiguration.status = 'WARNING';
        validation.summary.warnings++;
      } else {
        validation.checks.holidayConfiguration.status = 'FAILED';
        validation.summary.failedChecks++;
      }
    } catch (error) {
      validation.checks.holidayConfiguration.status = 'FAILED';
      validation.checks.holidayConfiguration.issues.push(`Error checking holiday configuration: ${error.message}`);
      validation.summary.failedChecks++;
    }

    // Check 6: Weekly Off Configuration
    try {
      const Calendar = require('../models/Calendar');
      const activeEmployees = await Employee.getAllEmployees({ status: 'ACTIVE' });
      let weeklyOffIssues = 0;
      let weeklyOffValid = 0;

      for (const emp of activeEmployees) {
        if (emp.CALENDAR_ID) {
          try {
            const calendar = await Calendar.getById(emp.CALENDAR_ID);
            if (!calendar || !calendar.WEEKLY_HOLIDAYS) {
              weeklyOffIssues++;
              validation.checks.weeklyOffConfiguration.issues.push(
                `Calendar ${emp.CALENDAR_ID} has no weekly off configuration`
              );
            } else {
              weeklyOffValid++;
            }
          } catch (weeklyOffError) {
            weeklyOffIssues++;
            validation.checks.weeklyOffConfiguration.issues.push(
              `Error checking weekly off for calendar ${emp.CALENDAR_ID}: ${weeklyOffError.message}`
            );
          }
        }
      }

      validation.checks.weeklyOffConfiguration.count = weeklyOffValid;
      
      if (weeklyOffIssues === 0) {
        validation.checks.weeklyOffConfiguration.status = 'PASSED';
        validation.summary.passedChecks++;
      } else if (weeklyOffValid > 0) {
        validation.checks.weeklyOffConfiguration.status = 'WARNING';
        validation.summary.warnings++;
      } else {
        validation.checks.weeklyOffConfiguration.status = 'FAILED';
        validation.summary.failedChecks++;
      }
    } catch (error) {
      validation.checks.weeklyOffConfiguration.status = 'FAILED';
      validation.checks.weeklyOffConfiguration.issues.push(`Error checking weekly off configuration: ${error.message}`);
      validation.summary.failedChecks++;
    }

    // Calculate overall status
    if (validation.summary.failedChecks === 0 && validation.summary.warnings === 0) {
      validation.overallStatus = 'READY';
    } else if (validation.summary.failedChecks === 0) {
      validation.overallStatus = 'READY_WITH_WARNINGS';
    } else {
      validation.overallStatus = 'NOT_READY';
    }

    res.status(200).json({
      success: true,
      message: 'Month-end payroll validation completed',
      data: validation
    });

  } catch (error) {
    console.error('Error validating month-end prerequisites:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate month-end prerequisites',
      error: error.message
    });
  }
};

module.exports.validateMonthEndPrerequisites = validateMonthEndPrerequisites;

// Utility endpoint to force-create/install the attendance procedure
// @route   POST /api/payroll/month-end/attendance/procedure/install
// @access  Private (ADMIN)
const installAttendanceProcedure = async (req, res) => {
  try {
    const result = await Payroll.installAttendanceProcedure();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to install procedure', error: error.message });
  }
};

module.exports.installAttendanceProcedure = installAttendanceProcedure;
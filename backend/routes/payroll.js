const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const payrollController = require('../controllers/payrollController');

// All routes require authentication
router.use(authenticateToken);

// Payroll periods
router.post('/periods', 
  authorizeRoles('ADMIN', 'HR'), 
  payrollController.createPayrollPeriod
);

router.get('/periods', 
  authorizeRoles('ADMIN', 'HR'), 
  payrollController.getAllPayrollPeriods
);

router.get('/periods/:id', 
  authorizeRoles('ADMIN', 'HR'), 
  payrollController.getPayrollPeriodById
);

router.put('/periods/:id', 
  authorizeRoles('ADMIN', 'HR'), 
  payrollController.updatePayrollPeriod
);

router.get('/periods/:id/details', 
  authorizeRoles('ADMIN', 'HR'), 
  payrollController.getPayrollDetailsByPeriod
);

router.get('/periods/:id/runs', 
  authorizeRoles('ADMIN', 'HR'), 
  payrollController.getPayrollRunsByPeriod
);

router.get('/periods/:id/statistics', 
  authorizeRoles('ADMIN', 'HR'), 
  payrollController.getPayrollStatistics
);

// Payroll processing
router.post('/process', 
  authorizeRoles('ADMIN', 'HR'), 
  payrollController.processPayroll
);

// Payroll details
router.get('/details/:id', 
  authorizeRoles('ADMIN', 'HR'), 
  payrollController.getPayrollDetailById
);

router.post('/details/:id/approve', 
  authorizeRoles('ADMIN', 'HR'), 
  payrollController.approvePayroll
);

// Payroll runs
router.get('/runs', 
  authorizeRoles('ADMIN', 'HR'), 
  payrollController.getPayrollRuns
);

// Payroll dashboard
router.get('/dashboard', 
  authorizeRoles('ADMIN', 'HR'), 
  payrollController.getPayrollDashboard
);

// Payroll settings (Admin only)
router.post('/initialize-settings', 
  authorizeRoles('ADMIN'), 
  payrollController.initializePayrollSettings
);

// Month-end payroll processing
router.post('/month-end', 
  authorizeRoles('ADMIN', 'HR'), 
  payrollController.processMonthEndPayroll
);

router.get('/month-end/status', 
  authorizeRoles('ADMIN', 'HR'), 
  payrollController.getMonthEndStatus
);

router.get('/month-end/validate', 
  authorizeRoles('ADMIN', 'HR'), 
  payrollController.validateMonthEndPrerequisites
);

router.post('/month-end/:periodId/approve', 
  authorizeRoles('ADMIN', 'HR'), 
  payrollController.approveMonthEndPayroll
);

router.get('/month-end/:periodId/reports', 
  authorizeRoles('ADMIN', 'HR'), 
  payrollController.generateMonthEndReports
);

// Month-end attendance processing (preview and confirm)
router.get('/month-end/attendance/summary', 
  authorizeRoles('ADMIN', 'HR'), 
  payrollController.getMonthEndAttendanceSummary
);

router.post('/month-end/attendance/confirm', 
  authorizeRoles('ADMIN', 'HR'), 
  payrollController.confirmMonthEndAttendanceSummary
);

router.put('/month-end/attendance/final',
  authorizeRoles('ADMIN', 'HR'),
  payrollController.updateMonthEndAttendanceFinal
);

// Install DB procedure explicitly
router.post('/month-end/attendance/procedure/install',
  authorizeRoles('ADMIN'),
  payrollController.installAttendanceProcedure
);

// Clean month data
router.delete('/month-end/clean',
  authorizeRoles('ADMIN', 'HR'),
  payrollController.cleanMonthEndData
);

// Step-based workflow routes for new UI
router.post('/process-attendance', 
  authorizeRoles('ADMIN', 'HR'), 
  payrollController.processAttendance
);

router.post('/save-attendance', 
  authorizeRoles('ADMIN', 'HR'), 
  payrollController.saveAttendanceSummary
);

module.exports = router; 
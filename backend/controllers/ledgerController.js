const Ledger = require('../models/Ledger');
const { validationResult } = require('express-validator');

class LedgerController {
  // Get all employees ledger summary
  static async getAllEmployeesLedger(req, res) {
    try {
      const { page = 1, limit = 20, search, departmentId, transactionType, startDate, endDate } = req.query;
      
      const filters = {};
      if (search) filters.search = search;
      if (departmentId) filters.departmentId = departmentId;
      if (transactionType) filters.transactionType = transactionType;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const result = await Ledger.getAllEmployeesLedgerSummary(
        parseInt(page), 
        parseInt(limit), 
        filters
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('❌ Error getting all employees ledger:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get employees ledger summary',
        error: error.message
      });
    }
  }

  // Get employee ledger details
  static async getEmployeeLedger(req, res) {
    try {
      const { employeeId } = req.params;
      const { page = 1, limit = 20, transactionType, startDate, endDate, periodMonth } = req.query;
      
      const filters = {};
      if (transactionType) filters.transactionType = transactionType;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (periodMonth) filters.periodMonth = periodMonth;

      const result = await Ledger.getEmployeeLedger(
        parseInt(employeeId),
        parseInt(page),
        parseInt(limit),
        filters
      );

      // Get employee summary
      const summary = await Ledger.getEmployeeLedgerSummary(parseInt(employeeId));

      res.json({
        success: true,
        data: result.data,
        summary,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('❌ Error getting employee ledger:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get employee ledger',
        error: error.message
      });
    }
  }

  // Get employee ledger summary
  static async getEmployeeLedgerSummary(req, res) {
    try {
      const { employeeId } = req.params;
      
      const summary = await Ledger.getEmployeeLedgerSummary(parseInt(employeeId));
      
      if (!summary) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('❌ Error getting employee ledger summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get employee ledger summary',
        error: error.message
      });
    }
  }

  // Get transaction types
  static async getTransactionTypes(req, res) {
    try {
      const transactionTypes = await Ledger.getTransactionTypes();
      
      res.json({
        success: true,
        data: transactionTypes
      });
    } catch (error) {
      console.error('❌ Error getting transaction types:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get transaction types',
        error: error.message
      });
    }
  }

  // Reverse a ledger entry
  static async reverseLedgerEntry(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { ledgerId } = req.params;
      const { reason } = req.body;
      const createdBy = req.user.userId;

      const reversedLedgerId = await Ledger.reverseEntry(parseInt(ledgerId), reason, createdBy);

      res.json({
        success: true,
        message: 'Ledger entry reversed successfully',
        data: { ledgerId: reversedLedgerId }
      });
    } catch (error) {
      console.error('❌ Error reversing ledger entry:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reverse ledger entry',
        error: error.message
      });
    }
  }

  // Get ledger entry by ID
  static async getLedgerEntry(req, res) {
    try {
      const { ledgerId } = req.params;
      
      const entry = await Ledger.getEntryById(parseInt(ledgerId));
      
      if (!entry) {
        return res.status(404).json({
          success: false,
          message: 'Ledger entry not found'
        });
      }

      res.json({
        success: true,
        data: entry
      });
    } catch (error) {
      console.error('❌ Error getting ledger entry:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get ledger entry',
        error: error.message
      });
    }
  }

  // Get ledger statistics
  static async getLedgerStatistics(req, res) {
    try {
      const { startDate, endDate, departmentId } = req.query;
      
      // This would need to be implemented in the Ledger model
      // For now, returning basic structure
      const statistics = {
        totalEmployees: 0,
        totalCredits: 0,
        totalDebits: 0,
        netBalance: 0,
        averageBalance: 0,
        topDebtors: [],
        topCreditors: []
      };

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('❌ Error getting ledger statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get ledger statistics',
        error: error.message
      });
    }
  }

  // Export ledger data
  static async exportLedgerData(req, res) {
    try {
      const { employeeId, format = 'excel', startDate, endDate, transactionType } = req.query;
      
      // This would need to be implemented in the Ledger model
      // For now, returning basic structure
      const exportData = {
        format,
        data: [],
        filename: `ledger_export_${new Date().toISOString().split('T')[0]}.${format}`
      };

      res.json({
        success: true,
        data: exportData
      });
    } catch (error) {
      console.error('❌ Error exporting ledger data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export ledger data',
        error: error.message
      });
    }
  }

  // Create manual ledger entry
  static async createManualEntry(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        employeeId,
        transactionType,
        debitAmount,
        creditAmount,
        referenceDescription,
        periodMonth,
        periodYear
      } = req.body;

      const createdBy = req.user.userId;

      // Validate that either debit or credit is provided, not both
      if ((debitAmount && creditAmount) || (!debitAmount && !creditAmount)) {
        return res.status(400).json({
          success: false,
          message: 'Either debit amount or credit amount must be provided, not both'
        });
      }

      const ledgerData = {
        employeeId: parseInt(employeeId),
        transactionType,
        debitAmount: debitAmount ? parseFloat(debitAmount) : 0,
        creditAmount: creditAmount ? parseFloat(creditAmount) : 0,
        referenceDescription,
        periodMonth,
        periodYear: periodYear ? parseInt(periodYear) : null,
        createdBy
      };

      const ledgerId = await Ledger.createEntry(ledgerData);

      res.status(201).json({
        success: true,
        message: 'Manual ledger entry created successfully',
        data: { ledgerId }
      });
    } catch (error) {
      console.error('❌ Error creating manual ledger entry:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create manual ledger entry',
        error: error.message
      });
    }
  }

  // Get ledger dashboard data
  static async getLedgerDashboard(req, res) {
    try {
      // This would need to be implemented in the Ledger model
      // For now, returning basic structure
      const dashboardData = {
        totalEmployees: 0,
        totalBalance: 0,
        recentTransactions: [],
        topTransactions: [],
        monthlyTrends: []
      };

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error('❌ Error getting ledger dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get ledger dashboard',
        error: error.message
      });
    }
  }
}

module.exports = LedgerController;

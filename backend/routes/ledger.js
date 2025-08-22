const express = require('express');
const router = express.Router();
const LedgerController = require('../controllers/ledgerController');
const { authenticateToken } = require('../middleware/auth');
const { body } = require('express-validator');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all employees ledger summary
router.get('/employees', LedgerController.getAllEmployeesLedger);

// Get employee ledger details
router.get('/employees/:employeeId', LedgerController.getEmployeeLedger);

// Get employee ledger summary
router.get('/employees/:employeeId/summary', LedgerController.getEmployeeLedgerSummary);

// Get transaction types
router.get('/transaction-types', LedgerController.getTransactionTypes);

// Get ledger entry by ID
router.get('/entries/:ledgerId', LedgerController.getLedgerEntry);

// Get ledger statistics
router.get('/statistics', LedgerController.getLedgerStatistics);

// Get ledger dashboard
router.get('/dashboard', LedgerController.getLedgerDashboard);

// Export ledger data
router.get('/export', LedgerController.exportLedgerData);

// Create manual ledger entry
router.post('/entries', [
  body('employeeId').isInt().withMessage('Employee ID must be a valid integer'),
  body('transactionType').isIn(['ADVANCE', 'LOAN', 'DEDUCTION', 'PAYROLL', 'BONUS', 'ALLOWANCE', 'REFUND', 'ADJUSTMENT']).withMessage('Invalid transaction type'),
  body('debitAmount').optional().isFloat({ min: 0 }).withMessage('Debit amount must be a positive number'),
  body('creditAmount').optional().isFloat({ min: 0 }).withMessage('Credit amount must be a positive number'),
  body('referenceDescription').optional().isLength({ max: 500 }).withMessage('Reference description must be less than 500 characters'),
  body('periodMonth').optional().matches(/^\d{4}-\d{2}$/).withMessage('Period month must be in YYYY-MM format'),
  body('periodYear').optional().isInt({ min: 1900, max: 2100 }).withMessage('Period year must be between 1900 and 2100')
], LedgerController.createManualEntry);

// Reverse ledger entry
router.post('/entries/:ledgerId/reverse', [
  body('reason').notEmpty().withMessage('Reason is required for reversal')
], LedgerController.reverseLedgerEntry);

module.exports = router;

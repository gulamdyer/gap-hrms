const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const userController = require('../controllers/userController');

// Temporarily disable authentication for all user endpoints for testing
// router.use((req, res, next) => {
//   // Skip authentication for status update endpoint
//   if (req.path.includes('/status') && req.method === 'PATCH') {
//     return next();
//   }
//   return authenticateToken(req, res, next);
// });

// Get all users with filters and pagination
router.get('/', userController.getAllUsers);

// Get user statistics
router.get('/statistics', userController.getUserStatistics);

// Get users for dropdown
router.get('/dropdown', userController.getUsersDropdown);

// Get pay grades for dropdown
router.get('/pay-grades/dropdown', userController.getPayGradesDropdown);

// Create new user
router.post('/', userController.userValidationRules.create, userController.createUser);

// Update user status (no authentication required for testing) - MUST come before /:id
router.patch('/:id/status', userController.updateUserStatus);

// Update user password - MUST come before /:id
router.patch('/:id/password', userController.updateUserPassword);

// Get user by ID
router.get('/:id', userController.getUserById);

// Update user
router.put('/:id', userController.userValidationRules.update, userController.updateUser);

// Delete user
router.delete('/:id', userController.deleteUser);

module.exports = router; 
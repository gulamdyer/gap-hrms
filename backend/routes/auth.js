const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateLogin, 
  validateRegistration, 
  validatePasswordChange, 
  validateUserUpdate 
} = require('../middleware/validation');

// Public routes
router.post('/login', validateLogin, authController.login);
router.post('/register', validateRegistration, authController.register);

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, validateUserUpdate, authController.updateProfile);
router.put('/change-password', authenticateToken, validatePasswordChange, authController.changePassword);
router.post('/logout', authenticateToken, authController.logout);

module.exports = router; 
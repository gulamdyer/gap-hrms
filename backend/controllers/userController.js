const User = require('../models/User');
const { body, validationResult } = require('express-validator');

// Get all users with filters and pagination
const getAllUsers = async (req, res) => {
  try {
    console.log('🔍 getAllUsers called with filters:', req.query);
    
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      status: req.query.status,
      role: req.query.role
    };

    console.log('🔍 Calling User.getAllUsers with filters:', filters);
    
    const result = await User.getAllUsers(filters);
    
    console.log('✅ getAllUsers result:', result);
    
    res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.getById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove sensitive information
    delete user.PASSWORD_HASH;
    delete user.PASSWORD_RESET_TOKEN;
    delete user.PASSWORD_RESET_EXPIRES;

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userData = req.body;
    const createdBy = req.user.userId;

    // Validate user data
    const validationErrors = User.validateUserData(userData, false);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Check if username already exists
    const usernameExists = await User.usernameExists(userData.username);
    if (usernameExists) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Check if email already exists
    const emailExists = await User.emailExists(userData.email);
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const userId = await User.create(userData, createdBy);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { userId }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if user exists
    const existingUser = await User.getById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Validate user data
    const validationErrors = User.validateUserData(userData, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Check if username already exists (excluding current user)
    if (userData.username && userData.username !== existingUser.USERNAME) {
      const usernameExists = await User.usernameExists(userData.username, id);
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }
    }

    // Check if email already exists (excluding current user)
    if (userData.email && userData.email !== existingUser.EMAIL) {
      const emailExists = await User.emailExists(userData.email, id);
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    await User.update(id, userData);
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if user exists
    const existingUser = await User.getById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting own account
    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await User.delete(id);
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// Update user status
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Check if user exists
    const existingUser = await User.getById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Temporarily disable self-update check for testing
    // if (parseInt(id) === req.user.userId) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Cannot update your own status'
    //   });
    // }

    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    await User.updateStatus(id, status);
    
    res.status(200).json({
      success: true,
      message: 'User status updated successfully'
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
};

// Update user password
const updateUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check if user exists
    const existingUser = await User.getById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await User.updatePassword(id, password);
    
    res.status(200).json({
      success: true,
      message: 'User password updated successfully'
    });
  } catch (error) {
    console.error('Error updating user password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user password',
      error: error.message
    });
  }
};

// Get user statistics
const getUserStatistics = async (req, res) => {
  try {
    const statistics = await User.getStatistics();
    
    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message
    });
  }
};

// Get users for dropdown
const getUsersDropdown = async (req, res) => {
  try {
    const users = await User.getDropdownList();
    
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users dropdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users dropdown',
      error: error.message
    });
  }
};

// Get Pay Grades for dropdown
const getPayGradesDropdown = async (req, res) => {
  try {
    const { executeQuery } = require('../config/database');
    
    const sql = `
      SELECT PAY_GRADE_ID, GRADE_CODE, GRADE_NAME
      FROM HRMS_PAY_GRADES
      WHERE STATUS = 'ACTIVE'
      ORDER BY GRADE_NAME
    `;
    
    const result = await executeQuery(sql);
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching pay grades dropdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pay grades dropdown',
      error: error.message
    });
  }
};

// Validation rules
const userValidationRules = {
  create: [
    body('username')
      .trim()
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters long')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please enter a valid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
    body('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required'),
    body('lastName')
      .trim()
      .notEmpty()
      .withMessage('Last name is required'),
    body('role')
      .optional()
      .isIn(['ADMIN', 'HR', 'MANAGER', 'USER'])
      .withMessage('Invalid role selected'),
    body('status')
      .optional()
      .isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
      .withMessage('Invalid status selected'),
    body('phone')
      .optional()
      .matches(/^[\d\s\-\+\(\)]+$/)
      .withMessage('Please enter a valid phone number'),
    body('payGradeId')
      .optional()
      .isNumeric()
      .withMessage('Pay Grade ID must be a number')
  ],
  update: [
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters long')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please enter a valid email address'),
    body('firstName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('First name is required'),
    body('lastName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Last name is required'),
    body('role')
      .optional()
      .isIn(['ADMIN', 'HR', 'MANAGER', 'USER'])
      .withMessage('Invalid role selected'),
    body('status')
      .optional()
      .isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
      .withMessage('Invalid status selected'),
    body('phone')
      .optional()
      .matches(/^[\d\s\-\+\(\)]+$/)
      .withMessage('Please enter a valid phone number'),
    body('payGradeId')
      .optional()
      .isNumeric()
      .withMessage('Pay Grade ID must be a number')
  ]
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  updateUserPassword,
  getUserStatistics,
  getUsersDropdown,
  getPayGradesDropdown,
  userValidationRules
}; 
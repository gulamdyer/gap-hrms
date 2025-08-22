const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// @desc    User login
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findByUsername(username);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (user.STATUS !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active. Please contact administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await User.verifyPassword(password, user.PASSWORD_HASH);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login timestamp
    await User.updateLastLogin(user.USER_ID);

    // Generate JWT token
    const token = generateToken(user.USER_ID);

    // Prepare user data (exclude password)
    const userData = {
      userId: user.USER_ID,
      username: user.USERNAME,
      email: user.EMAIL,
      firstName: user.FIRST_NAME,
      lastName: user.LAST_NAME,
      role: user.ROLE,
      status: user.STATUS,
      lastLogin: user.LAST_LOGIN
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token,
        expiresIn: process.env.JWT_EXPIRES_IN
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    User registration
// @route   POST /api/auth/register
// @access  Public (or Admin only in production)
const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role = 'EMPLOYEE' } = req.body;

    // Check if username already exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Check if email already exists
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Create new user
    const userId = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role
    }, req.user?.userId); // Pass the current user as creator

    // Get the created user
    const newUser = await User.findById(userId);

    // Generate JWT token
    const token = generateToken(userId);

    // Prepare user data
    const userData = {
      userId: newUser.USER_ID,
      username: newUser.USERNAME,
      email: newUser.EMAIL,
      firstName: newUser.FIRST_NAME,
      lastName: newUser.LAST_NAME,
      role: newUser.ROLE,
      status: newUser.STATUS
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userData,
        token,
        expiresIn: process.env.JWT_EXPIRES_IN
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = {
      userId: user.USER_ID,
      username: user.USERNAME,
      email: user.EMAIL,
      firstName: user.FIRST_NAME,
      lastName: user.LAST_NAME,
      role: user.ROLE,
      status: user.STATUS,
      lastLogin: user.LAST_LOGIN,
      createdAt: user.CREATED_AT,
      updatedAt: user.UPDATED_AT
    };

    res.status(200).json({
      success: true,
      data: userData
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    const userId = req.user.userId;

    // Check if email is being changed and if it already exists
    if (email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.USER_ID !== userId) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Update user profile
    const updateFields = [];
    const bindValues = [];

    if (firstName) {
      updateFields.push('FIRST_NAME = :firstName');
      bindValues.push(firstName);
    }

    if (lastName) {
      updateFields.push('LAST_NAME = :lastName');
      bindValues.push(lastName);
    }

    if (email) {
      updateFields.push('EMAIL = :email');
      bindValues.push(email);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateFields.push('UPDATED_AT = CURRENT_TIMESTAMP');
    bindValues.push(userId);

    const sql = `
      UPDATE HRMS_USERS 
      SET ${updateFields.join(', ')}
      WHERE USER_ID = :userId
    `;

    const { executeQuery } = require('../config/database');
    await executeQuery(sql, bindValues);

    // Get updated user
    const updatedUser = await User.findById(userId);

    const userData = {
      userId: updatedUser.USER_ID,
      username: updatedUser.USERNAME,
      email: updatedUser.EMAIL,
      firstName: updatedUser.FIRST_NAME,
      lastName: updatedUser.LAST_NAME,
      role: updatedUser.ROLE,
      status: updatedUser.STATUS,
      lastLogin: updatedUser.LAST_LOGIN,
      createdAt: updatedUser.CREATED_AT,
      updatedAt: updatedUser.UPDATED_AT
    };

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: userData
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Get current user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await User.verifyPassword(currentPassword, user.PASSWORD_HASH);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    await User.updatePassword(userId, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Logout (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // Server can maintain a blacklist of tokens if needed
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  login,
  register,
  getProfile,
  updateProfile,
  changePassword,
  logout
}; 
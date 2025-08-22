const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist and are active
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.STATUS !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'User account is not active'
      });
    }

    // Add user info to request object
    req.user = {
      userId: user.USER_ID,
      username: user.USERNAME,
      email: user.EMAIL,
      firstName: user.FIRST_NAME,
      lastName: user.LAST_NAME,
      role: user.ROLE,
      status: user.STATUS
    };

    console.log('🔍 Token authentication successful:');
    console.log('User data from DB:', {
      USER_ID: user.USER_ID,
      USERNAME: user.USERNAME,
      ROLE: user.ROLE,
      STATUS: user.STATUS
    });
    console.log('User data set in request:', req.user);

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Token verification failed'
      });
    }
  }
};

// Role-based authorization middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    console.log('🔍 Role authorization check:');
    console.log('User:', req.user);
    console.log('User role:', req.user?.role);
    console.log('Required roles:', roles);
    console.log('User role type:', typeof req.user?.role);
    console.log('Roles array:', roles.map(r => ({ role: r, type: typeof r })));
    
    if (!req.user) {
      console.log('❌ No user found in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const hasRole = roles.includes(req.user.role);
    console.log('Has required role:', hasRole);
    
    if (!hasRole) {
      console.log('❌ Insufficient permissions');
      return res.status(403).json({
        success: false,
        message: `Insufficient permissions. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`
      });
    }

    console.log('✅ Role authorization successful');
    next();
  };
};

// Admin only middleware
const requireAdmin = authorizeRoles('ADMIN');

// HR and Admin middleware
const requireHR = authorizeRoles('ADMIN', 'HR');

// Manager and above middleware
const requireManager = authorizeRoles('ADMIN', 'HR', 'MANAGER');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  requireAdmin,
  requireHR,
  requireManager,
  generateToken
}; 
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
            message: 'GAP HRMS Backend is running',
    timestamp: new Date().toISOString(),
    environment: 'development'
  });
});

// Mock authentication middleware (for testing)
const mockAuth = (req, res, next) => {
  req.user = {
    userId: 1,
    username: 'admin',
    role: 'ADMIN'
  };
  next();
};

// User routes
app.get('/api/users', mockAuth, (req, res) => {
  res.json({
    success: true,
    data: [
      {
        USER_ID: 21,
        USERNAME: 'admin',
        EMAIL: 'admin@example.com',
        FIRST_NAME: 'Admin',
        LAST_NAME: 'User',
        ROLE: 'ADMIN',
        STATUS: 'ACTIVE',
        CREATED_AT: '2025-07-23T20:25:20.297Z',
        UPDATED_AT: '2025-08-05T18:16:55.561Z'
      },
      {
        USER_ID: 22,
        USERNAME: 'hr_user',
        EMAIL: 'hr@example.com',
        FIRST_NAME: 'HR',
        LAST_NAME: 'Manager',
        ROLE: 'HR',
        STATUS: 'ACTIVE',
        CREATED_AT: '2025-07-23T20:25:20.297Z',
        UPDATED_AT: '2025-08-05T18:16:55.561Z'
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1
    }
  });
});

app.get('/api/users/:id', mockAuth, (req, res) => {
  const { id } = req.params;
  
  if (id === '21') {
    res.json({
      success: true,
      data: {
        USER_ID: 21,
        USERNAME: 'admin',
        EMAIL: 'admin@example.com',
        FIRST_NAME: 'Admin',
        LAST_NAME: 'User',
        ROLE: 'ADMIN',
        STATUS: 'ACTIVE',
        PHONE: null,
        CREATED_AT: '2025-07-23T20:25:20.297Z',
        UPDATED_AT: '2025-08-05T18:16:55.561Z'
      }
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
});

app.put('/api/users/:id', mockAuth, (req, res) => {
  const { id } = req.params;
  const userData = req.body;
  
  console.log('Update user request:', { id, userData });
  
  res.json({
    success: true,
    message: 'User updated successfully'
  });
});

app.patch('/api/users/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  console.log('Status update request:', { id, status });
  
  if (!status || !['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status'
    });
  }
  
  res.json({
    success: true,
    message: 'User status updated successfully'
  });
});

app.delete('/api/users/:id', mockAuth, (req, res) => {
  const { id } = req.params;
  
  console.log('Delete user request:', { id });
  
  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

app.get('/api/users/statistics', mockAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      TOTAL_USERS: 2,
      ACTIVE_USERS: 2,
      INACTIVE_USERS: 0,
      SUSPENDED_USERS: 0,
      ADMIN_USERS: 1,
      HR_USERS: 1,
      MANAGER_USERS: 0,
      USER_USERS: 0
    }
  });
});

app.get('/api/users/dropdown', mockAuth, (req, res) => {
  res.json({
    success: true,
    data: [
      {
        USER_ID: 21,
        FULL_NAME: 'Admin User',
        ROLE: 'ADMIN'
      },
      {
        USER_ID: 22,
        FULL_NAME: 'HR Manager',
        ROLE: 'HR'
      }
    ]
  });
});

// Auth routes (mock)
app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    message: 'Login successful',
    token: 'mock-jwt-token',
    user: {
      userId: 1,
      username: 'admin',
      role: 'ADMIN'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to GAP HRMS Backend API',
    version: '1.0.0',
    status: 'running'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 GAP HRMS Working Server running on port ${PORT}`);
  console.log(`📊 Environment: development`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Documentation: http://localhost:${PORT}/`);
  console.log(`🔗 Users: http://localhost:${PORT}/api/users`);
  console.log(`🔗 Status update: PATCH http://localhost:${PORT}/api/users/21/status`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
}); 
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables with explicit path
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import database and error handling
const { initializeDatabase, closeDatabase } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { authenticateToken, authorizeRoles } = require('./middleware/auth');
const { validateRequest } = require('./middleware/validation');
const { logActivity } = require('./middleware/activityLogger');

// Import routes
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const settingsRoutes = require('./routes/settings');
const advanceRoutes = require('./routes/advances');
const loanRoutes = require('./routes/loans');
const leaveRoutes = require('./routes/leaves');
const leaveResumptionRoutes = require('./routes/leaveResumptions');
const resignationRoutes = require('./routes/resignations');
const deductionRoutes = require('./routes/deductions');
const timesheetRoutes = require('./routes/timesheets');
const shiftRoutes = require('./routes/shifts');
const employeeCompensationRoutes = require('./routes/employeeCompensation');
const calendarRoutes = require('./routes/calendars');
const attendanceRoutes = require('./routes/attendance');
const payrollRoutes = require('./routes/payroll');
const payrollSettingsRoutes = require('./routes/payrollSettings');
const sqlServerConfigRoutes = require('./routes/sqlServerConfigs');
const importExportRoutes = require('./routes/importExport');
const userRoutes = require('./routes/users');
const activityRoutes = require('./routes/activities');
const ledgerRoutes = require('./routes/ledger');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "http://localhost:5000", "http://localhost:3000"],
      connectSrc: ["'self'", "http://localhost:5000", "http://localhost:3000"]
    }
  }
}));
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const isProduction = process.env.NODE_ENV === 'production';
const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || (isProduction ? 15 * 60 * 1000 : 60 * 1000); // 15 min prod, 1 min dev
const rateLimitMaxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (isProduction ? 500 : 1000); // 500 prod, 1000 dev

const limiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: rateLimitMaxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks, OPTIONS, and dropdown reads to avoid UI stalls
    if (req.method === 'OPTIONS' || req.path === '/health') return true;
    if (req.method === 'GET' && (
      req.path.startsWith('/api/settings/dropdown/') ||
      req.path.startsWith('/api/calendars/dropdown') ||
      req.path.startsWith('/api/shifts/dropdown') ||
      req.path.startsWith('/api/employees/dropdown')
    )) return true;
    return false;
  }
});

app.use('/api/', limiter);

if (isProduction) {
  console.log('🔒 Rate limiting enabled for production:', rateLimitMaxRequests, 'requests per', rateLimitWindowMs / 1000 / 60, 'minutes');
} else {
  console.log('🚀 Development rate limiting enabled:', rateLimitMaxRequests, 'requests per', rateLimitWindowMs / 1000 / 60, 'minutes');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
            message: 'GAP HRMS Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Public endpoints (no authentication required)
const employeeController = require('./controllers/employeeController');
app.get('/api/public/countries', employeeController.getCountriesDropdown);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes); // Mount this first so public endpoints are accessible
app.use('/api/employees', employeeCompensationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/advances', advanceRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/leave-resumptions', leaveResumptionRoutes);
app.use('/api/resignations', resignationRoutes);
app.use('/api/deductions', deductionRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/calendars', calendarRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/payroll/settings', payrollSettingsRoutes);
app.use('/api/sql-server-configs', sqlServerConfigRoutes);
app.use('/api/import-export', importExportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/ledger', ledgerRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to GAP HRMS Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        profile: 'GET /api/auth/profile',
        updateProfile: 'PUT /api/auth/profile',
        changePassword: 'PUT /api/auth/change-password',
        logout: 'POST /api/auth/logout'
      },
      employees: {
        getAll: 'GET /api/employees',
        getById: 'GET /api/employees/:id',
        create: 'POST /api/employees',
        update: 'PUT /api/employees/:id',
        delete: 'DELETE /api/employees/:id',
        updateStatus: 'PATCH /api/employees/:id/status',
        uploadAvatar: 'POST /api/employees/:id/avatar',
        uploadDocument: 'POST /api/employees/:id/document',
        getDropdown: 'GET /api/employees/dropdown/list'
      },
      settings: {
        designations: {
          getAll: 'GET /api/settings/designations',
          getById: 'GET /api/settings/designations/:id',
          create: 'POST /api/settings/designations',
          update: 'PUT /api/settings/designations/:id',
          delete: 'DELETE /api/settings/designations/:id'
        },
        roles: {
          getAll: 'GET /api/settings/roles',
          getById: 'GET /api/settings/roles/:id',
          create: 'POST /api/settings/roles',
          update: 'PUT /api/settings/roles/:id',
          delete: 'DELETE /api/settings/roles/:id'
        },
        positions: {
          getAll: 'GET /api/settings/positions',
          getById: 'GET /api/settings/positions/:id',
          create: 'POST /api/settings/positions',
          update: 'PUT /api/settings/positions/:id',
          delete: 'DELETE /api/settings/positions/:id'
        },
        locations: {
          getAll: 'GET /api/settings/locations',
          getById: 'GET /api/settings/locations/:id',
          create: 'POST /api/settings/locations',
          update: 'PUT /api/settings/locations/:id',
          delete: 'DELETE /api/settings/locations/:id'
        },
        costCenters: {
          getAll: 'GET /api/settings/cost-centers',
          getById: 'GET /api/settings/cost-centers/:id',
          create: 'POST /api/settings/cost-centers',
          update: 'PUT /api/settings/cost-centers/:id',
          delete: 'DELETE /api/settings/cost-centers/:id'
        },
        dropdowns: {
          designations: 'GET /api/settings/dropdown/designations',
          roles: 'GET /api/settings/dropdown/roles',
          positions: 'GET /api/settings/dropdown/positions',
          locations: 'GET /api/settings/dropdown/locations',
          costCenters: 'GET /api/settings/dropdown/cost-centers'
        }
      }
    }
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  try {
    await closeDatabase();
  } catch (error) {
    console.log('ℹ️ Database cleanup completed');
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  try {
    await closeDatabase();
  } catch (error) {
    console.log('ℹ️ Database cleanup completed');
  }
  process.exit(0);
});

// Unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', err);
  process.exit(1);
});

// Uncaught exceptions
process.on('uncaughtException', async (err) => {
  console.error('Uncaught Exception:', err);
  try {
    await closeDatabase();
  } catch (error) {
    console.log('ℹ️ Database cleanup completed');
  }
  process.exit(1);
});

// Server configuration
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log('🔄 Starting GAP HRMS Backend server...');
    
    // Initialize database first
    console.log('📦 Initializing database connection pool...');
    let dbInitialized = false;
    try {
      dbInitialized = await initializeDatabase();
      if (dbInitialized) {
        console.log('✅ Database initialization complete');
      } else {
        console.log('⚠️ Database initialization failed, using mock data mode');
      }
    } catch (dbError) {
      console.error('⚠️ Database initialization failed:', dbError.message);
      console.log('⚠️ Starting server without database connection...');
    }
    
    // Start server regardless of database status
    const server = http.createServer(app);
    
    // Only initialize Socket.IO if explicitly enabled
    const enableSocketIO = false; // Disabled to prevent websocket errors
    let io = null;
    let userSockets = null;

    if (enableSocketIO) {
      io = new Server(server, {
        cors: {
          origin: 'http://localhost:3000', // Adjust as needed
          methods: ['GET', 'POST']
        }
      });

      // Store userId to socket mapping
      userSockets = new Map();

      // Authenticate socket connections (example using JWT)
      io.use((socket, next) => {
        const token = socket.handshake.auth && socket.handshake.auth.token;
        // TODO: Verify JWT and extract userId
        // If valid:
        //   socket.userId = decoded.userId;
        //   next();
        // Else:
        //   next(new Error('Authentication error'));
        next(); // TEMP: Allow all for now
      });

      // On connection
      io.on('connection', (socket) => {
        // TODO: Set socket.userId after JWT verification
        if (socket.userId) {
          userSockets.set(socket.userId, socket);
        }

        socket.on('disconnect', () => {
          if (socket.userId) {
            userSockets.delete(socket.userId);
          }
        });
      });

      console.log('📡 Socket.IO server initialized');
    } else {
      console.log('📡 Socket.IO disabled (set ENABLE_SOCKET_IO=true to enable)');
    }

    // Helper to emit notification to a user
    function emitNotificationToUser(userId, notification) {
      if (enableSocketIO && userSockets) {
        const socket = userSockets.get(userId);
        if (socket) {
          socket.emit('notification', notification);
        }
      }
    }

    // Export for use in controllers
    module.exports.emitNotificationToUser = emitNotificationToUser;

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 GAP HRMS Backend server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/`);
      if (!dbInitialized) {
        console.log('💡 Using mock data mode - create .env file with database credentials for real data');
      }
    });

    // Handle server errors
    server.on('error', async (error) => {
      console.error('❌ Server error:', error.message);
      if (error.code === 'EADDRINUSE') {
        console.error('❌ Port 5000 is already in use. Please stop other services using this port.');
      }
      try {
        await closeDatabase();
      } catch (closeError) {
        console.error('❌ Failed to close database:', closeError.message);
      }
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Attempt to close database connection if it exists
    try {
      await closeDatabase();
    } catch (closeError) {
      console.error('❌ Failed to close database:', closeError.message);
    }
    
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app; 
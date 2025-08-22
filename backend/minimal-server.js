const express = require('express');
const cors = require('cors');

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
            message: 'GAP HRMS Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Mock user status update endpoint
app.patch('/api/users/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  console.log('Status update request:', { id, status });
  
  res.json({
    success: true,
    message: 'User status updated successfully'
  });
});

// Mock get users endpoint
app.get('/api/users', (req, res) => {
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
        STATUS: 'ACTIVE'
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1
    }
  });
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`🚀 Minimal server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`🔗 Users: http://localhost:${PORT}/api/users`);
  console.log(`🔗 Status update: PATCH http://localhost:${PORT}/api/users/21/status`);
}); 
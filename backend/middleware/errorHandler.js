// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', err);

  // Oracle database errors
  if (err.code && err.code.startsWith('ORA-')) {
    switch (err.code) {
      case 'ORA-00001':
        error.message = 'Duplicate entry found';
        error.statusCode = 400;
        break;
      case 'ORA-00942':
        error.message = 'Table or view does not exist';
        error.statusCode = 500;
        break;
      case 'ORA-00955':
        error.message = 'Name is already being used by an existing object';
        error.statusCode = 400;
        break;
      case 'ORA-01400':
        error.message = 'Cannot insert NULL value';
        error.statusCode = 400;
        break;
      case 'ORA-01407':
        error.message = 'Cannot update NULL value';
        error.statusCode = 400;
        break;
      case 'ORA-02291':
        error.message = 'Integrity constraint violated - parent key not found';
        error.statusCode = 400;
        break;
      case 'ORA-02292':
        error.message = 'Integrity constraint violated - child record found';
        error.statusCode = 400;
        break;
      case 'ORA-12541':
        error.message = 'Database connection failed - TNS listener not available';
        error.statusCode = 503;
        break;
      case 'ORA-12514':
        error.message = 'Database connection failed - service not found';
        error.statusCode = 503;
        break;
      case 'ORA-01017':
        error.message = 'Database authentication failed - invalid username/password';
        error.statusCode = 503;
        break;
      case 'ORA-12154':
        error.message = 'Database connection failed - TNS could not resolve service name';
        error.statusCode = 503;
        break;
      default:
        error.message = 'Database error occurred';
        error.statusCode = 500;
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error.message = message;
    error.statusCode = 400;
  }

  // Cast errors (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    error.message = 'Invalid resource identifier';
    error.statusCode = 400;
  }

  // Duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `${field} already exists`;
    error.statusCode = 400;
  }

  // Default error response
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404 handler for undefined routes
const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
};

module.exports = {
  errorHandler,
  notFound
}; 
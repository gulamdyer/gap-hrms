# 🚀 GAP HRMS Backend - Quick Start Guide

Get your GAP HRMS backend up and running in minutes!

## ⚡ Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Run Setup Script
```bash
npm run setup
```
This will:
- ✅ Check Node.js version
- ✅ Verify Oracle Instant Client
- ✅ Create `.env` file with secure JWT secret
- ✅ Configure environment variables

### 3. Test Oracle Connection
```bash
npm run test-oracle
```

### 4. Start Development Server
```bash
npm run dev
```

## 🎯 What's Included

### ✅ Complete Authentication System
- **User Registration** with validation
- **JWT Login/Logout** with secure tokens
- **Password Management** with bcrypt hashing
- **Role-Based Access Control** (ADMIN, HR, MANAGER, EMPLOYEE)
- **Profile Management** (view/update)

### ✅ Oracle Database Integration
- **Thick Mode** for enhanced security
- **Connection Pooling** for performance
- **Automatic Table Creation** (HRMS_USERS)
- **Comprehensive Error Handling**

### ✅ Security Features
- **Input Validation** with express-validator
- **Rate Limiting** (100 requests/15min)
- **CORS Protection** with configurable origins
- **Helmet Security Headers**
- **JWT Token Authentication**

### ✅ Production Ready
- **Error Handling** with detailed Oracle error messages
- **Logging** with Morgan
- **Graceful Shutdown** handling
- **Environment Configuration**
- **Health Check Endpoints**

## 📋 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Register new user | ❌ |
| `POST` | `/api/auth/login` | User login | ❌ |
| `GET` | `/api/auth/profile` | Get user profile | ✅ |
| `PUT` | `/api/auth/profile` | Update profile | ✅ |
| `PUT` | `/api/auth/change-password` | Change password | ✅ |
| `POST` | `/api/auth/logout` | Logout | ✅ |
| `GET` | `/health` | Health check | ❌ |
| `GET` | `/` | API documentation | ❌ |

## 🧪 Quick Test

### 1. Health Check
```bash
curl http://localhost:5000/health
```

### 2. Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@company.com",
    "password": "AdminPass123!",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "AdminPass123!"
  }'
```

### 4. Get Profile (use token from login)
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🔧 Configuration

### Environment Variables (auto-configured)
```env
PORT=5000
NODE_ENV=development
ORACLE_USER=BOLTOAI
ORACLE_PASSWORD=MonuDyer$25_DB
ORACLE_CONNECT_STRING=(your connection string)
JWT_SECRET=(auto-generated)
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:3000
```

### Oracle Database
- **Host**: 10.0.1.44 (OCI)
- **Service**: BOLTO_PDB1.sub12260832001.ikramvcn.oraclevcn.com
- **User**: BOLTOAI
- **Table Prefix**: HRMS_

## 🛠 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with nodemon |
| `npm run test-oracle` | Test Oracle database connection |
| `npm run setup` | Run initial setup and configuration |
| `npm test` | Run tests (when implemented) |

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # Oracle database configuration
├── controllers/
│   └── authController.js    # Authentication logic
├── middleware/
│   ├── auth.js             # JWT authentication
│   ├── validation.js       # Input validation
│   └── errorHandler.js     # Global error handling
├── models/
│   └── User.js             # User model and database operations
├── routes/
│   └── auth.js             # Authentication routes
├── server.js               # Main Express server
├── test-oracle.js          # Oracle connection test
├── setup.js                # Initial setup script
├── package.json            # Dependencies and scripts
├── env.example             # Environment variables template
└── README.md               # Detailed documentation
```

## 🚨 Troubleshooting

### Oracle Connection Issues
```bash
npm run test-oracle
```
This will provide specific guidance for:
- Oracle Instant Client installation
- Database connection problems
- Authentication issues
- Network connectivity

### Common Solutions
1. **Install Oracle Instant Client** if not detected
2. **Restart terminal/IDE** after PATH changes
3. **Verify .env file** exists and is configured
4. **Check database credentials** and connectivity

## 🎉 Success Indicators

✅ **Server running**: `🚀 GAP HRMS Backend server running on port 5000`
✅ **Database connected**: `✅ Oracle database pool created successfully (thick mode)`
✅ **Table created**: `✅ HRMS_USERS table created successfully`
✅ **Health check**: `{"success": true, "message": "GAP HRMS Backend is running"}`

## 📚 Next Steps

1. **Test all endpoints** using the API testing guide
2. **Integrate with frontend** (React app)
3. **Add more HRMS modules** (employees, leaves, payroll)
4. **Deploy to production** (OCI)

## 🆘 Need Help?

- 📖 **Full Documentation**: `README.md`
- 🧪 **API Testing Guide**: `API_TESTING.md`
- 🔧 **Troubleshooting**: Run `npm run test-oracle`
- 💡 **Oracle Setup**: Check Oracle Instant Client installation

---

**🎯 You're all set! Your GAP HRMS backend is ready for development and testing.** 
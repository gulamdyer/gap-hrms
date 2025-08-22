# GAP HRMS Backend API

A modern HRMS (Human Resource Management System) backend built with Node.js, Express, and Oracle Database.

## 🚀 Features

- **JWT Authentication** with role-based access control
- **Oracle Database Integration** with thick mode support
- **Input Validation** using express-validator
- **Security Middleware** (Helmet, CORS, Rate Limiting)
- **Error Handling** with detailed Oracle error messages
- **User Management** (CRUD operations)
- **Password Security** with bcrypt hashing

## 📋 Prerequisites

- Node.js 18+ or 20 LTS
- Oracle Instant Client (for thick mode)
- Oracle Database 19c/21c (OCI hosted)
- Access to Oracle Cloud Infrastructure

## 🛠 Installation

### 1. Clone and Install Dependencies

```bash
cd backend
npm install
```

### 2. Oracle Instant Client Setup

#### Windows:
1. Download Oracle Instant Client from [Oracle website](https://www.oracle.com/database/technologies/instant-client/winx64-downloads.html)
2. Extract to `C:\oracle\instantclient_21_8` (or your preferred directory)
3. Add to system PATH:
   ```cmd
   set PATH=%PATH%;C:\oracle\instantclient_21_8
   set ORACLE_HOME=C:\oracle\instantclient_21_8
   ```
4. Restart your terminal/IDE

#### Linux:
```bash
# Download and install Oracle Instant Client
wget https://download.oracle.com/otn_software/linux/instantclient/218000/instantclient-basic-linux.x64-21.8.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-21.8.0.0.0dbru.zip
sudo mv instantclient_21_8 /opt/oracle/
export ORACLE_HOME=/opt/oracle/instantclient_21_8
export PATH=$PATH:$ORACLE_HOME
```

### 3. Environment Configuration

Copy the environment example and configure your settings:

```bash
cp env.example .env
```

Edit `.env` with your Oracle credentials:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Oracle Database Configuration (OCI)
ORACLE_USER=BOLTOAI
ORACLE_PASSWORD=MonuDyer$25_DB
ORACLE_CONNECT_STRING=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.0.1.44)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SERVICE_NAME=BOLTO_PDB1.sub12260832001.ikramvcn.oraclevcn.com)(SID=BOLTODB)))
ORACLE_POOL_MIN=2
ORACLE_POOL_MAX=10
ORACLE_POOL_INCREMENT=1

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Generate Secure JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Replace `your_secure_jwt_secret_here` with the generated secret.

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Test Oracle Connection
```bash
npm run test-oracle
```

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/login
User login with username and password.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "userId": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "EMPLOYEE",
      "status": "ACTIVE",
      "lastLogin": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "jane_smith",
  "email": "jane@example.com",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "EMPLOYEE"
}
```

#### GET /api/auth/profile
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

#### PUT /api/auth/profile
Update user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "firstName": "John Updated",
  "lastName": "Doe Updated",
  "email": "john.updated@example.com"
}
```

#### PUT /api/auth/change-password
Change user password (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass456!",
  "confirmPassword": "NewSecurePass456!"
}
```

#### POST /api/auth/logout
Logout user (client-side token removal).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### Health Check

#### GET /health
Check server status.

**Response:**
```json
{
  "success": true,
  "message": "GAP HRMS Backend is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

## 🔐 Role-Based Access Control

The system supports the following roles:

- **ADMIN**: Full system access
- **HR**: Human resources management
- **MANAGER**: Team and project management
- **EMPLOYEE**: Basic user access

## 🗄 Database Schema

### HRMS_USERS Table

```sql
CREATE TABLE HRMS_USERS (
  USER_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  USERNAME VARCHAR2(50) UNIQUE NOT NULL,
  EMAIL VARCHAR2(100) UNIQUE NOT NULL,
  PASSWORD_HASH VARCHAR2(255) NOT NULL,
  FIRST_NAME VARCHAR2(50) NOT NULL,
  LAST_NAME VARCHAR2(50) NOT NULL,
  ROLE VARCHAR2(20) DEFAULT 'EMPLOYEE' CHECK (ROLE IN ('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE')),
  STATUS VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (STATUS IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
  LAST_LOGIN TIMESTAMP,
  CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🛡 Security Features

- **JWT Authentication** with configurable expiration
- **Password Hashing** using bcrypt with 12 salt rounds
- **Input Validation** with express-validator
- **Rate Limiting** to prevent abuse
- **CORS Protection** with configurable origins
- **Helmet Security Headers**
- **Oracle Thick Mode** for enhanced security

## 🔧 Troubleshooting

### Common Oracle Issues

#### ORA-12541: TNS listener not available
- Verify Oracle database is running
- Check connection string format
- Test with SQL*Plus first

#### ORA-01017: Invalid username/password
- Verify credentials in .env file
- Check if user account is locked
- Ensure user has proper permissions

#### ORA-12154: TNS could not resolve service name
- Verify service name in connection string
- Check network connectivity
- Ensure Oracle Instant Client is properly installed

### Node.js Issues

#### Module not found errors
```bash
npm install
```

#### Port already in use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5000
kill -9 <PID>
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment mode | development |
| `ORACLE_USER` | Oracle database username | - |
| `ORACLE_PASSWORD` | Oracle database password | - |
| `ORACLE_CONNECT_STRING` | Oracle connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | JWT expiration time | 24h |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:3000 |

## Rate Limiting

The backend uses global rate limiting for all API endpoints to prevent abuse.

- **Default Production Limit:** 500 requests per 15 minutes per IP
- **Development Limit:** 1000 requests per minute per IP

You can override these defaults using the following environment variables in your `.env` file:

```
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=500  # 500 requests per window per IP
```

Settings are defined in `server.js` and applied globally to all `/api/` routes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review Oracle documentation
- Create an issue in the repository 
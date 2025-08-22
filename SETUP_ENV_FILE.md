# Environment File Setup Guide

## Issue
The dashboard is showing 500 errors because the `.env` file is missing, which contains the database configuration.

## Solution

### Step 1: Create the .env file

Create a file named `.env` in the `backend` directory with the following content:

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Oracle Database Configuration
ORACLE_USER=hrms_user
ORACLE_PASSWORD=hrms_password
ORACLE_CONNECT_STRING=localhost:1521/XE
ORACLE_POOL_MIN=2
ORACLE_POOL_MAX=10
ORACLE_POOL_INCREMENT=1

# JWT Configuration
JWT_SECRET=ai_hrms_jwt_secret_2024_secure_key_for_production_use_only
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Currency Configuration
CURRENCY_SYMBOL=₹
CURRENCY_CODE=INR
CURRENCY_NAME=Indian Rupee
```

### Step 2: For Development (No Database Required)

If you don't have Oracle database set up, the application will now work with mock data. The dashboard will show:

- **Mock Statistics**: 25 total employees, 20 active, etc.
- **Mock Activities**: Sample activities with View buttons for UPDATE actions
- **Full Functionality**: All UI features work without database

### Step 3: For Production (With Oracle Database)

If you have Oracle database access, update the database configuration:

```bash
# Replace with your actual database credentials
ORACLE_USER=your_username
ORACLE_PASSWORD=your_password
ORACLE_CONNECT_STRING=your_host:1521/your_service_name
```

### Step 4: Restart the Backend Server

```bash
cd backend
npm start
```

### Step 5: Test the Dashboard

Navigate to `http://localhost:3000/dashboard` and the errors should be resolved.

## File Location

The `.env` file should be created at:
```
GAP-HRMS/
└── backend/
    └── .env  ← Create this file here
```

## Verification

After creating the `.env` file:

1. **Restart the backend server**
2. **Check browser console** - no more 500 errors
3. **Dashboard loads** with statistics and activities
4. **View buttons appear** for UPDATE activities

## Troubleshooting

### If you still get errors:

1. **Check file location**: Ensure `.env` is in the `backend` directory
2. **Check file format**: No spaces around `=` signs
3. **Restart server**: Stop and restart the backend server
4. **Clear browser cache**: Hard refresh the dashboard page

### For Oracle Database Setup:

1. **Install Oracle Instant Client**
2. **Set environment variables**:
   ```bash
   set ORACLE_HOME=C:\oracle\instantclient_21_8
   set PATH=%PATH%;C:\oracle\instantclient_21_8
   ```
3. **Test connection** with SQL*Plus first
4. **Update .env** with correct credentials

## Current Status

✅ **Fixed**: Dashboard now works with mock data when database is unavailable
✅ **Fixed**: View button functionality implemented
✅ **Fixed**: Graceful error handling
✅ **Fixed**: Better error messages

The dashboard will now load successfully and show the View button for activities with UPDATE actions! 
# 🔧 GAP HRMS Troubleshooting Guide

This guide helps resolve common issues when setting up and running the GAP HRMS application.

## 🚨 Common Issues & Solutions

### 1. Login Error (401 Unauthorized)

**Symptoms:**
- Frontend shows "Invalid credentials" error
- Backend logs show 401 status for login requests
- Cannot authenticate with test credentials

**Solutions:**

#### A. Check Test User Exists
```bash
cd backend
npm run create-test-user
```

#### B. Run Complete Health Check
```bash
cd backend
npm run health-check
```

#### C. Verify Environment Variables
Ensure your `.env` file has all required variables:
```env
PORT=5000
NODE_ENV=development
ORACLE_USER=BOLTOAI
ORACLE_PASSWORD=MonuDyer$25_DB
ORACLE_CONNECT_STRING=(your connection string)
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=24h
```

#### D. Test Backend API Directly
```bash
# Test health endpoint
curl http://localhost:5000/health

# Test login endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test_user","password":"TestPass123!"}'
```

### 2. Oracle Database Connection Issues

**Symptoms:**
- "Oracle Client library not found" error
- "ORA-12541: TNS listener not available" error
- "ORA-01017: Invalid username/password" error

**Solutions:**

#### A. Install Oracle Instant Client
1. Download from [Oracle website](https://www.oracle.com/database/technologies/instant-client/winx64-downloads.html)
2. Extract to `C:\oracle\instantclient_21_8`
3. Add to PATH:
   ```cmd
   set PATH=%PATH%;C:\oracle\instantclient_21_8
   set ORACLE_HOME=C:\oracle\instantclient_21_8
   ```
4. Restart terminal/IDE

#### B. Test Database Connection
```bash
cd backend
npm run test-oracle
```

#### C. Verify Connection String
Check your Oracle connection string format:
```
(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.0.1.44)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SERVICE_NAME=BOLTO_PDB1.sub12260832001.ikramvcn.oraclevcn.com)(SID=BOLTODB)))
```

### 3. Frontend-Backend Connection Issues

**Symptoms:**
- "Network Error" in frontend
- CORS errors in browser console
- API calls failing

**Solutions:**

#### A. Ensure Backend is Running
```bash
cd backend
npm run dev
```
Check: `http://localhost:5000/health`

#### B. Check CORS Configuration
Backend should have CORS enabled for `http://localhost:3000`

#### C. Verify Proxy Configuration
Frontend `package.json` should have:
```json
{
  "proxy": "http://localhost:5000"
}
```

### 4. Frontend Build/Start Issues

**Symptoms:**
- `npm start` fails
- Missing dependencies
- Build errors

**Solutions:**

#### A. Install Dependencies
```bash
cd frontend
npm install
```

#### B. Clear Cache and Reinstall
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### C. Check Node.js Version
Ensure you're using Node.js 18+:
```bash
node --version
```

### 5. Manifest.json 404 Error

**Symptoms:**
- Browser console shows 404 for `/manifest.json`
- PWA features not working

**Solution:**
The `manifest.json` file should exist in `frontend/public/`. If missing, it will be created automatically.

## 🔍 Diagnostic Commands

### Backend Diagnostics
```bash
cd backend

# Check environment
npm run health-check

# Test Oracle connection
npm run test-oracle

# Create test user
npm run create-test-user

# Check server logs
npm run dev
```

### Frontend Diagnostics
```bash
cd frontend

# Check dependencies
npm list

# Clear cache
npm start -- --reset-cache

# Build for production
npm run build
```

### Database Diagnostics
```bash
# Test with SQL*Plus (if available)
sqlplus BOLTOAI/MonuDyer$25_DB@10.0.1.44:1521/BOLTODB

# Check if you can connect to Oracle
```

## 📋 Step-by-Step Setup Verification

### 1. Backend Setup
```bash
cd backend
npm install
npm run setup
npm run health-check
npm run dev
```

**Expected Output:**
- ✅ All environment variables are set
- ✅ Database connection successful
- ✅ Database tables are ready
- ✅ Test user created/verified
- ✅ Server running on port 5000

### 2. Frontend Setup
```bash
cd frontend
npm install
npm start
```

**Expected Output:**
- ✅ React app opens at http://localhost:3000
- ✅ Login page displays correctly
- ✅ No console errors

### 3. Integration Test
1. Open http://localhost:3000
2. Use credentials: `test_user` / `TestPass123!`
3. Should successfully login and redirect to dashboard

## 🐛 Debug Mode

### Enable Backend Debug Logging
Set in `.env`:
```env
NODE_ENV=development
```

### Enable Frontend Debug Logging
Open browser DevTools and check:
- Console for JavaScript errors
- Network tab for API call failures
- Application tab for localStorage issues

## 📞 Getting Help

### Before Asking for Help
1. ✅ Run `npm run health-check` in backend
2. ✅ Check browser console for errors
3. ✅ Verify both servers are running
4. ✅ Test with provided credentials
5. ✅ Check this troubleshooting guide

### Common Error Messages

| Error | Likely Cause | Solution |
|-------|-------------|----------|
| `ORA-12541` | Database not accessible | Check network/firewall |
| `ORA-01017` | Wrong credentials | Verify .env file |
| `Oracle Client library` | Missing Oracle Instant Client | Install and configure |
| `Network Error` | Backend not running | Start backend server |
| `401 Unauthorized` | Invalid credentials | Create test user |
| `CORS error` | Frontend-backend mismatch | Check CORS configuration |

## 🎯 Quick Fix Checklist

- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 3000
- [ ] Oracle Instant Client installed and in PATH
- [ ] .env file configured correctly
- [ ] Test user created (`npm run create-test-user`)
- [ ] Database connection working (`npm run test-oracle`)
- [ ] No console errors in browser
- [ ] CORS properly configured

---

**💡 Still having issues? Check the logs, run diagnostics, and ensure all prerequisites are met.** 
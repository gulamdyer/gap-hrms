# Dashboard API Troubleshooting Guide

## Issue Description
The dashboard is showing API errors when trying to fetch statistics and activities. The errors appear as:
```
❌ API Response Error: Object
❌ Error fetching dashboard stats: AxiosError
```

## Root Cause Analysis

The errors are likely caused by one or more of the following issues:

1. **Authentication Issues**: Missing or invalid JWT token
2. **Database Connection Issues**: Oracle database not accessible
3. **Missing Tables**: Required database tables don't exist
4. **Model Import Issues**: Leave model or other dependencies not loading
5. **Backend Server Issues**: Server not running or port conflicts

## Step-by-Step Troubleshooting

### Step 1: Check Backend Server Status

1. **Verify server is running**:
   ```bash
   cd backend
   npm start
   ```

2. **Check if port 5000 is available**:
   ```bash
   netstat -an | grep 5000
   ```

3. **Test health endpoint**:
   ```bash
   curl http://localhost:5000/health
   ```

### Step 2: Test API Endpoints

Run the API endpoint test:
```bash
cd backend
node test-api-endpoints.js
```

This will test:
- Health check endpoint
- API documentation
- Dashboard stats endpoint
- Activities endpoint

### Step 3: Debug Database Issues

Run the database debug script:
```bash
cd backend
node debug-dashboard-issue.js
```

This will test:
- Database connection
- Employee model functionality
- Leave model functionality
- Required table existence

### Step 4: Check Authentication

1. **Verify user is logged in**:
   - Check browser console for authentication state
   - Ensure JWT token is present in localStorage

2. **Test authentication endpoint**:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/employees/test-auth
   ```

### Step 5: Check Database Tables

Verify required tables exist:

```sql
-- Check if tables exist
SELECT table_name FROM user_tables WHERE table_name IN (
  'HRMS_EMPLOYEES',
  'HRMS_LEAVES', 
  'HRMS_ACTIVITIES',
  'HRMS_USERS'
);

-- Check table counts
SELECT 'HRMS_EMPLOYEES' as table_name, COUNT(*) as count FROM HRMS_EMPLOYEES
UNION ALL
SELECT 'HRMS_LEAVES', COUNT(*) FROM HRMS_LEAVES
UNION ALL
SELECT 'HRMS_ACTIVITIES', COUNT(*) FROM HRMS_ACTIVITIES
UNION ALL
SELECT 'HRMS_USERS', COUNT(*) FROM HRMS_USERS;
```

## Common Solutions

### Solution 1: Fix Authentication Issues

If you're getting 401 errors:

1. **Clear browser storage**:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Re-login** to get a fresh token

3. **Check token expiration** in browser console

### Solution 2: Fix Database Connection

If database connection fails:

1. **Check Oracle connection**:
   ```bash
   # Test connection
   sqlplus username/password@host:port/service
   ```

2. **Verify environment variables**:
   ```bash
   # Check .env file
   cat backend/.env
   ```

3. **Restart database service** if needed

### Solution 3: Create Missing Tables

If tables don't exist, run the setup scripts:

```bash
cd backend
node setup.js
```

### Solution 4: Fix Model Import Issues

If Leave model fails to load:

1. **Check file permissions**:
   ```bash
   ls -la backend/models/Leave.js
   ```

2. **Verify file syntax**:
   ```bash
   node -c backend/models/Leave.js
   ```

3. **Check for circular dependencies**

### Solution 5: Fix Port Conflicts

If port 5000 is in use:

1. **Find process using port**:
   ```bash
   lsof -i :5000
   ```

2. **Kill the process**:
   ```bash
   kill -9 PID
   ```

3. **Or change port** in backend/.env:
   ```
   PORT=5001
   ```

## Frontend Debugging

### Check Browser Console

1. **Open Developer Tools** (F12)
2. **Go to Network tab**
3. **Refresh dashboard page**
4. **Look for failed requests** to:
   - `/api/employees/dashboard/stats`
   - `/api/activities/recent`

### Check Authentication State

```javascript
// In browser console
console.log('Auth state:', useAuthStore.getState());
```

### Test API Calls Manually

```javascript
// In browser console
fetch('http://localhost:5000/api/employees/dashboard/stats', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
}).then(r => r.json()).then(console.log);
```

## Backend Debugging

### Enable Detailed Logging

Add to backend/server.js:
```javascript
// Add before routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    headers: req.headers,
    body: req.body,
    user: req.user
  });
  next();
});
```

### Check Server Logs

```bash
cd backend
npm start 2>&1 | tee server.log
```

### Test Individual Endpoints

```bash
# Test health
curl http://localhost:5000/health

# Test dashboard stats (with auth)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/employees/dashboard/stats

# Test activities (with auth)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/activities/recent
```

## Prevention

### 1. Add Better Error Handling

The dashboard now has improved error handling with specific messages for different error types.

### 2. Add Health Checks

The backend includes health check endpoints to monitor service status.

### 3. Add Database Validation

The debug script checks for required tables and models.

### 4. Add Graceful Degradation

The dashboard shows fallback values when API calls fail.

## Quick Fix Checklist

- [ ] Backend server is running on port 5000
- [ ] Database connection is working
- [ ] User is authenticated with valid token
- [ ] Required tables exist in database
- [ ] No port conflicts
- [ ] Environment variables are set correctly
- [ ] Models are loading without errors
- [ ] API endpoints are accessible

## Emergency Fallback

If all else fails, the dashboard will show:
- 0 for all statistics
- Empty activities list
- Appropriate error messages
- Loading states for better UX

This ensures the application remains functional even when backend services are unavailable. 
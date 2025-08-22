# API Testing Guide

This guide provides examples for testing all GAP HRMS Backend API endpoints.

## 🚀 Quick Start

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Test Oracle connection:**
   ```bash
   npm run test-oracle
   ```

3. **Use the examples below to test endpoints**

## 📋 Prerequisites

- Server running on `http://localhost:5000`
- Oracle database connected
- Tools: Postman, curl, or any HTTP client

## 🔐 Authentication Endpoints

### 1. User Registration

**POST** `http://localhost:5000/api/auth/register`

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "EMPLOYEE"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "userId": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "EMPLOYEE",
      "status": "ACTIVE"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

### 2. User Login

**POST** `http://localhost:5000/api/auth/login`

```json
{
  "username": "john_doe",
  "password": "SecurePass123!"
}
```

**Expected Response:**
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

### 3. Get User Profile

**GET** `http://localhost:5000/api/auth/profile`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "EMPLOYEE",
    "status": "ACTIVE",
    "lastLogin": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Update User Profile

**PUT** `http://localhost:5000/api/auth/profile`

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

**Expected Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "userId": 1,
    "username": "john_doe",
    "email": "john.updated@example.com",
    "firstName": "John Updated",
    "lastName": "Doe Updated",
    "role": "EMPLOYEE",
    "status": "ACTIVE",
    "lastLogin": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### 5. Change Password

**PUT** `http://localhost:5000/api/auth/change-password`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!",
  "confirmPassword": "NewSecurePass456!"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### 6. Logout

**POST** `http://localhost:5000/api/auth/logout`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## 🔍 System Endpoints

### Health Check

**GET** `http://localhost:5000/health`

**Expected Response:**
```json
{
  "success": true,
  "message": "GAP HRMS Backend is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

### API Documentation

**GET** `http://localhost:5000/`

**Expected Response:**
```json
{
  "success": true,
  "message": "Welcome to GAP HRMS Backend API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "auth": {
      "login": "POST /api/auth/login",
      "register": "POST /api/auth/register",
      "profile": "GET /api/auth/profile",
      "updateProfile": "PUT /api/auth/profile",
      "changePassword": "PUT /api/auth/change-password",
      "logout": "POST /api/auth/logout"
    }
  }
}
```

## 🧪 Testing with cURL

### Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "EMPLOYEE"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "password": "SecurePass123!"
  }'
```

### Get Profile (with token)
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## 🧪 Testing with Postman

1. **Create a new collection** called "GAP HRMS API"
2. **Set up environment variables:**
   - `base_url`: `http://localhost:5000`
   - `token`: (will be set after login)

3. **Create requests for each endpoint:**
   - Set method and URL
   - Add headers: `Content-Type: application/json`
   - Add request body for POST/PUT requests
   - For protected routes, add: `Authorization: Bearer {{token}}`

4. **Test flow:**
   1. Register a new user
   2. Login and save the token
   3. Test protected endpoints with the token

## ⚠️ Error Testing

### Invalid Login
```json
{
  "username": "nonexistent",
  "password": "wrongpassword"
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### Invalid Token
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer invalid_token"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid token"
}
```

### Validation Errors
```json
{
  "username": "a",
  "password": "123"
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "username",
      "message": "Username must be between 3 and 50 characters",
      "value": "a"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters long",
      "value": "123"
    }
  ]
}
```

## 🔧 Troubleshooting

### Common Issues

1. **Connection refused:**
   - Ensure server is running: `npm run dev`
   - Check port 5000 is not in use

2. **Database connection errors:**
   - Run: `npm run test-oracle`
   - Check Oracle Instant Client installation
   - Verify .env configuration

3. **JWT token issues:**
   - Ensure token is properly formatted: `Bearer <token>`
   - Check token hasn't expired
   - Verify JWT_SECRET in .env

4. **Validation errors:**
   - Check request body format
   - Ensure all required fields are present
   - Verify data types and formats

### Debug Mode

Enable debug logging by setting in `.env`:
```env
NODE_ENV=development
```

This will show detailed request logs and error information.

## 📊 Performance Testing

### Rate Limiting Test
```bash
# Send multiple requests quickly
for i in {1..110}; do
  curl -X GET http://localhost:5000/health
done
```

After 100 requests, you should see rate limiting in effect.

### Load Testing
Use tools like Apache Bench or Artillery:
```bash
ab -n 1000 -c 10 http://localhost:5000/health
```

## 🎯 Next Steps

1. **Test all endpoints** using the examples above
2. **Verify error handling** with invalid inputs
3. **Test rate limiting** with multiple requests
4. **Check security headers** in responses
5. **Validate database operations** are working correctly

Once testing is complete, the API is ready for frontend integration! 
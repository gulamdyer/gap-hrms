<<<<<<< HEAD
# gap-hrms
=======
# GAP HRMS - Human Resource Management System

A comprehensive, multi-country HRMS application built with Node.js, Express, Oracle Database, and React. Supports 7 countries with complete payroll, compliance, and statutory calculations.

> 🌍 **Multi-Country Support**: India, UAE, Saudi Arabia, Oman, Bahrain, Qatar, Egypt  
> 💰 **Advanced Payroll**: Country-specific calculations, statutory compliance, air ticket allowances  
> ⚖️ **Regulatory Compliance**: WPS, GOSI, PASI, GPSSA, and more

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
npm install
npm run setup
npm run test-oracle
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

**Backend**: `http://localhost:5000`  
**Frontend**: `http://localhost:3000`

## 🎯 Features

### 🌍 Multi-Country Payroll System
- **7 Countries Supported**: India 🇮🇳, UAE 🇦🇪, Saudi Arabia 🇸🇦, Oman 🇴🇲, Bahrain 🇧🇭, Qatar 🇶🇦, Egypt 🇪🇬
- **Statutory Compliance**: PF, ESI, GOSI, PASI, GPSSA, Social Insurance
- **WPS Integration**: Wage Protection System for GCC countries
- **Air Ticket Allowance**: Biennial allowance with monthly accrual (GCC)
- **Country-Specific Allowances**: Housing, transport, education, family allowances
- **Dynamic Leave Policies**: Country-specific leave entitlements and holidays
- **Multi-Currency Support**: Proper currency symbols and formatting

### ✅ Backend (Node.js + Express + Oracle)
- **JWT Authentication** with role-based access control
- **Oracle Database Integration** with thick mode support
- **Multi-Country Payroll Engine** with factory pattern
- **Input Validation** with express-validator
- **Security Middleware** (Helmet, CORS, Rate Limiting)
- **Comprehensive API** with 15+ modules
- **Activity Logging** for complete audit trail
- **File Upload System** for documents and avatars

### ✅ Frontend (React + TailwindCSS)
- **Modern React 18** with functional components and hooks
- **Beautiful UI** with TailwindCSS and responsive design
- **Multi-Country Settings Interface** with flag-based selection
- **Real-time Payroll Configuration** with live previews
- **Protected Routes** with role-based access control
- **Comprehensive Dashboard** with statistics and activities
- **Mobile-First Design** with responsive sidebar
- **Advanced State Management** with Zustand

## 📁 Project Structure

```
GAP HRMS/
├── backend/                    # Node.js + Express API
│   ├── config/
│   │   └── database.js         # Oracle database configuration
│   ├── controllers/
│   │   └── authController.js   # Authentication logic
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   ├── validation.js      # Input validation
│   │   └── errorHandler.js    # Global error handling
│   ├── models/
│   │   └── User.js            # User model and database operations
│   ├── routes/
│   │   └── auth.js            # Authentication routes
│   ├── server.js              # Main Express server
│   ├── test-oracle.js         # Oracle connection test
│   ├── setup.js               # Initial setup script
│   └── README.md              # Backend documentation
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── layouts/          # Layout components
│   │   ├── services/         # API service layer
│   │   ├── store/            # State management
│   │   └── App.jsx           # Main app component
│   ├── package.json          # Frontend dependencies
│   └── README.md             # Frontend documentation
├── PROJECT_CONTEXT.md         # Project requirements
└── README.md                 # This file
```

## 🔐 Authentication System

### User Roles
- **ADMIN**: Full system access
- **HR**: Human resources management
- **MANAGER**: Team and project management
- **EMPLOYEE**: Basic user access

### Core API Endpoints
| Module | Method | Endpoint | Description | Auth Required |
|--------|--------|----------|-------------|---------------|
| **Auth** | `POST` | `/api/auth/register` | Register new user | ❌ |
| **Auth** | `POST` | `/api/auth/login` | User login | ❌ |
| **Auth** | `GET` | `/api/auth/profile` | Get user profile | ✅ |
| **Payroll** | `GET` | `/api/payroll/settings` | Get payroll settings | ✅ |
| **Payroll** | `GET` | `/api/payroll/settings?countryCode=UAE` | **Country-specific settings** | ✅ |
| **Payroll** | `POST` | `/api/payroll/process` | Process payroll | ✅ |
| **Employees** | `GET` | `/api/employees` | List employees | ✅ |
| **Employees** | `POST` | `/api/employees` | Create employee | ✅ |
| **Attendance** | `GET` | `/api/attendance` | Get attendance records | ✅ |
| **Leaves** | `GET` | `/api/leaves` | Get leave applications | ✅ |
| **Health** | `GET` | `/health` | Health check | ❌ |

> **New**: Multi-country payroll endpoints support country-specific configurations

## 🗄 Database Schema

### 🆕 Multi-Country Enhancement
The database now supports multi-country operations with new tables and enhanced existing ones:

| Table | Purpose | Enhancement |
|-------|---------|-------------|
| `HRMS_PAYROLL_SETTINGS` | Payroll configurations | ✅ **Added `PAYROLL_COUNTRY` column** |
| `HRMS_PAYROLL_COUNTRY_POLICIES` | Statutory policies | ✅ **New table for government rates** |
| `HRMS_EMPLOYEES` | Employee master | ✅ **Added `PAYROLL_COUNTRY` column** |
| `HRMS_EMPLOYEE_COMPENSATION` | CTC packages | ✅ **Multi-currency support** |

### Key Tables Overview
```sql
-- Enhanced Payroll Settings
CREATE TABLE HRMS_PAYROLL_SETTINGS (
  SETTING_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  SECTION VARCHAR2(50) NOT NULL,
  SETTING_KEY VARCHAR2(100) NOT NULL,
  SETTING_VALUE CLOB NOT NULL,
  SETTING_TYPE VARCHAR2(20) DEFAULT 'STRING',
  PAYROLL_COUNTRY VARCHAR2(3) DEFAULT 'IND',  -- NEW: Country support
  IS_ACTIVE NUMBER(1) DEFAULT 1,
  CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- New: Country-Specific Policies
CREATE TABLE HRMS_PAYROLL_COUNTRY_POLICIES (
  POLICY_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  COUNTRY_CODE VARCHAR2(3) NOT NULL,
  POLICY_TYPE VARCHAR2(50) NOT NULL,
  POLICY_NAME VARCHAR2(100) NOT NULL,
  PERCENTAGE_RATE NUMBER(7,4),
  IS_MANDATORY NUMBER(1) DEFAULT 1,
  EFFECTIVE_FROM DATE,
  IS_ACTIVE NUMBER(1) DEFAULT 1
);

-- Enhanced Employees Table
CREATE TABLE HRMS_EMPLOYEES (
  EMPLOYEE_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  EMPLOYEE_NUMBER VARCHAR2(20) UNIQUE NOT NULL,
  FIRST_NAME VARCHAR2(50) NOT NULL,
  LAST_NAME VARCHAR2(50) NOT NULL,
  EMAIL VARCHAR2(100) UNIQUE,
  PAYROLL_COUNTRY VARCHAR2(3) DEFAULT 'IND',  -- NEW: Country assignment
  CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🛠 Technology Stack

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express.js** - Web framework
- **Oracle Database** - Primary database (OCI hosted)
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing

### Frontend
- **React 18** - UI library
- **TailwindCSS** - CSS framework
- **React Router** - Client-side routing
- **Zustand** - State management
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **Heroicons** - Icon library

## 🚀 Deployment

### Backend Deployment
1. **Oracle Cloud Infrastructure (OCI)**
   - Deploy to OCI compute instance
   - Configure Oracle database connection
   - Set environment variables
   - Use PM2 for process management

2. **Environment Variables**
   ```env
   PORT=5000
   NODE_ENV=production
   ORACLE_USER=your_oracle_user
   ORACLE_PASSWORD=your_oracle_password
   ORACLE_CONNECT_STRING=your_connection_string
   JWT_SECRET=your_secure_jwt_secret
   ```

### Frontend Deployment
1. **Build for Production**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy Options**
   - **Netlify**: Drag and drop `build` folder
   - **Vercel**: Connect GitHub repository
   - **AWS S3**: Upload `build` folder
   - **Docker**: Use nginx to serve static files

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

## 🌍 Multi-Country Implementation

### Supported Countries & Features
| Country | Currency | Statutory Features | Special Benefits |
|---------|----------|-------------------|------------------|
| 🇮🇳 India | INR (₹) | PF (12%), ESI (0.75%/3.25%), Professional Tax | Gratuity, LTA |
| 🇦🇪 UAE | AED (د.إ) | GPSSA (5%/12.5% for nationals) | Air Ticket, Housing Allowance |
| 🇸🇦 Saudi Arabia | SAR (ر.س) | GOSI (10%/12% nationals, 2% expats) | Air Ticket, MUDAWALA |
| 🇴🇲 Oman | OMR (ر.ع.) | PASI (7%/10.5% for nationals) | Air Ticket, WPS |
| 🇧🇭 Bahrain | BHD (د.ب) | GOSI (6%/12% for nationals) | Air Ticket, LMRA |
| 🇶🇦 Qatar | QAR (ر.ق) | No mandatory for expats | Air Ticket, ADLSA |
| 🇪🇬 Egypt | EGP (£) | Social Insurance (14%/26%) | EOSB |

### Key Implementation Features

#### 🏛️ Statutory Compliance
- **Automatic Calculation**: Government-mandated rates applied automatically
- **National vs Expatriate**: Different rates based on employee nationality
- **Compliance Tracking**: Built-in regulatory requirement management

#### ✈️ Air Ticket Allowance (GCC Countries)
- **Biennial Cycle**: Every 2 years as per GCC standards
- **Monthly Accrual**: Automatic monthly accrual over 24 months
- **Class Options**: Economy, Business, First class configurations
- **FIFO Utilization**: First-in-first-out utilization tracking

#### 🏠 Country-Specific Allowances
- **Housing**: Percentage of basic salary or fixed amounts
- **Transport**: Monthly transport allowances in local currency
- **Education**: Annual education allowances for dependents
- **Phone/Utilities**: Communication and utility allowances

#### 🔧 Access Multi-Country Settings
1. Navigate to **Settings** → **Payroll Settings**
2. URL: `http://localhost:3000/settings/payroll`
3. Select country flag to switch configurations
4. Edit and save settings per country

### Migration & Deployment
```bash
# Deploy multi-country payroll system
cd scripts
node deploy-multi-country-payroll.js

# Insert country-specific settings
# Execute scripts/insert-country-payroll-settings.sql manually
```

## 📖 Documentation Index

| Document | Purpose |
|----------|---------|
| [`CODEBASE_INDEX.md`](./CODEBASE_INDEX.md) | Complete codebase reference |
| [`MULTI_COUNTRY_PAYROLL_IMPLEMENTATION.md`](./MULTI_COUNTRY_PAYROLL_IMPLEMENTATION.md) | Multi-country setup guide |
| [`ENHANCED_STATUTORY_CALCULATIONS.md`](./ENHANCED_STATUTORY_CALCULATIONS.md) | Statutory compliance details |
| [`WPS_IMPLEMENTATION_GUIDE.md`](./WPS_IMPLEMENTATION_GUIDE.md) | WPS integration guide |
| [`DATABASE_MIGRATION_GUIDE.md`](./DATABASE_MIGRATION_GUIDE.md) | Database migration instructions |

### Backend Testing
```bash
cd backend
npm run test-oracle  # Test Oracle connection
npm test            # Run unit tests
```

### Frontend Testing
```bash
cd frontend
npm test            # Run React tests
```

### Manual Testing
1. **Backend**: Test API endpoints with Postman or curl
2. **Frontend**: Test UI components and user flows
3. **Integration**: Test full authentication flow
4. **Database**: Verify data persistence and relationships

## 🔧 Development

### Prerequisites
- Node.js 18+ or 20 LTS
- Oracle Instant Client (for backend)
- Oracle Database 19c/21c (OCI hosted)
- Modern web browser

### Development Workflow
1. **Start Backend**: `cd backend && npm run dev`
2. **Start Frontend**: `cd frontend && npm start`
3. **Test Integration**: Login/register flow
4. **Add Features**: Extend both backend and frontend
5. **Test Thoroughly**: Manual and automated testing

### Code Style
- **Backend**: Follow Express.js best practices
- **Frontend**: Use functional components with hooks
- **Database**: Use prepared statements and proper indexing
- **Security**: Implement proper validation and authentication

## 🐛 Troubleshooting

### Common Issues

1. **Oracle Connection Failed**
   - Install Oracle Instant Client
   - Verify connection string
   - Check firewall settings
   - Test with SQL*Plus

2. **Frontend-Backend Connection**
   - Ensure backend is running on port 5000
   - Check CORS configuration
   - Verify API endpoints
   - Check network connectivity

3. **Authentication Issues**
   - Verify JWT secret configuration
   - Check token expiration settings
   - Clear browser localStorage
   - Test with demo credentials

4. **Build Errors**
   - Clear node_modules and reinstall
   - Check for missing dependencies
   - Verify environment variables
   - Check import paths

## 📚 Documentation

- **Backend**: [backend/README.md](backend/README.md)
- **Frontend**: [frontend/README.md](frontend/README.md)
- **API Testing**: [backend/API_TESTING.md](backend/API_TESTING.md)
- **Quick Start**: [backend/QUICK_START.md](backend/QUICK_START.md) | [frontend/QUICK_START.md](frontend/QUICK_START.md)

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
- Review documentation in each directory
- Create an issue in the repository
- Contact the development team

---

**🎉 GAP HRMS is ready for development! Start building amazing HR features for your organization.**

>>>>>>> feat: initial commit of GAP-HRMS (ignore node_modules, backup, temp_uploads, test-output)

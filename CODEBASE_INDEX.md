# GAP HRMS - Codebase Index

## 📚 Documentation Overview

| Document | Purpose | Status |
|----------|---------|---------|
| [`README.md`](./README.md) | Main project documentation | ✅ Current |
| [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) | Development context for Cursor IDE | ✅ Current |
| [`CODEBASE_INDEX.md`](./CODEBASE_INDEX.md) | This comprehensive index | ✅ Current |

## 🏗️ Project Architecture

### Core Structure
```
GAP-HRMS/
├── 📂 backend/                    # Node.js + Express + Oracle API
├── 📂 frontend/                   # React 18 + TailwindCSS SPA
├── 📂 scripts/                    # Database migration & deployment scripts
├── 📄 *.md                       # Documentation files
└── 📄 package files              # Dependencies management
```

---

## 🚀 Backend Architecture (`/backend/`)

### 📁 Directory Structure
```
backend/
├── 📂 config/                    # Configuration files
├── 📂 controllers/               # Business logic controllers
├── 📂 middleware/                # Express middleware
├── 📂 models/                    # Database models & Oracle interactions
├── 📂 routes/                    # API route definitions
├── 📂 services/                  # Business services & utilities
├── 📂 uploads/                   # File uploads storage
├── 📂 utils/                     # Utility functions
├── 📄 server.js                  # Main Express server
└── 📄 setup.js                   # Database initialization
```

### 🎛️ Core Configuration (`/backend/config/`)
| File | Purpose | Status |
|------|---------|---------|
| `database.js` | Oracle DB connection pool & thick mode | ✅ Production Ready |

### 🎯 Controllers (`/backend/controllers/`)
| Controller | Module | Features | Status |
|------------|---------|----------|---------|
| `authController.js` | Authentication | JWT, Login, Register, Profile | ✅ Complete |
| `employeeController.js` | Employee Management | CRUD, Search, Avatar Upload | ✅ Complete |
| `payrollController.js` | Payroll Processing | Month-end, Reports, Calculations | ✅ Complete |
| `payrollSettingsController.js` | **Multi-Country Payroll** | **7-Country Support, Dynamic Settings** | ✅ **Enhanced** |
| `attendanceController.js` | Attendance | Biometric integration, Reports | ✅ Complete |
| `leaveController.js` | Leave Management | Policies, Approvals, Balances | ✅ Complete |
| `advanceController.js` | Advance Management | Salary advances, Approvals | ✅ Complete |
| `loanController.js` | Loan Management | Employee loans, EMI tracking | ✅ Complete |
| `deductionController.js` | Deductions | Salary deductions, Categories | ✅ Complete |
| `ledgerController.js` | Employee Ledger | Financial transactions, History | ✅ Complete |
| `settingsController.js` | System Settings | Company, Departments, Roles | ✅ Complete |
| `calendarController.js` | Calendar Management | Holidays, Work schedules | ✅ Complete |
| `resignationController.js` | Exit Management | Resignation workflow | ✅ Complete |
| `leaveResumptionController.js` | Leave Resumption | Return from leave | ✅ Complete |
| `timesheetController.js` | Timesheet | Project time tracking | ✅ Complete |
| `shiftController.js` | Shift Management | Work shifts, Overtime | ✅ Complete |
| `activityController.js` | Activity Logging | System audit trail | ✅ Complete |
| `importExportController.js` | Data Migration | CSV import/export | ✅ Complete |
| `sqlServerConfigController.js` | SQL Config | External DB connections | ✅ Complete |
| `userController.js` | User Management | Admin user operations | ✅ Complete |
| `employeeCompensationController.js` | Compensation | Salary packages, CTC | ✅ Complete |

### 🛡️ Middleware (`/backend/middleware/`)
| Middleware | Purpose | Features | Status |
|------------|---------|----------|---------|
| `auth.js` | Authentication | JWT validation, Role-based access | ✅ Complete |
| `validation.js` | Input Validation | express-validator rules | ✅ Complete |
| `errorHandler.js` | Error Management | Global error handling | ✅ Complete |
| `activityLogger.js` | Audit Trail | Automatic activity logging | ✅ Complete |
| `upload.js` | File Upload | Multer configuration | ✅ Complete |

### 📊 Models (`/backend/models/`)
| Model | Database Table | Features | Status |
|-------|----------------|----------|---------|
| `User.js` | `HRMS_USERS` | Authentication, Profiles | ✅ Complete |
| `Employee.js` | `HRMS_EMPLOYEES` | Employee master data | ✅ Complete |
| `Payroll.js` | `HRMS_PAYROLL_*` | Payroll calculations | ✅ Complete |
| `PayrollSettings.js` | `HRMS_PAYROLL_SETTINGS` | **Multi-country configurations** | ✅ **Enhanced** |
| `Attendance.js` | `HRMS_ATTENDANCE` | Attendance tracking | ✅ Complete |
| `Leave.js` | `HRMS_LEAVES` | Leave management | ✅ Complete |
| `Advance.js` | `HRMS_ADVANCES` | Salary advances | ✅ Complete |
| `Loan.js` | `HRMS_LOANS` | Employee loans | ✅ Complete |
| `Deduction.js` | `HRMS_DEDUCTIONS` | Salary deductions | ✅ Complete |
| `Ledger.js` | `HRMS_LEDGER` | Financial transactions | ✅ Complete |
| `Settings.js` | `HRMS_*_SETTINGS` | System configurations | ✅ Complete |
| `Calendar.js` | `HRMS_CALENDAR` | Calendar management | ✅ Complete |
| `Resignation.js` | `HRMS_RESIGNATIONS` | Exit management | ✅ Complete |
| `Activity.js` | `HRMS_ACTIVITIES` | Audit logging | ✅ Complete |
| `EmployeeCompensation.js` | `HRMS_EMPLOYEE_COMPENSATION` | CTC packages | ✅ Complete |

### 🛤️ Routes (`/backend/routes/`)
| Route File | Endpoint Base | Purpose | Status |
|------------|---------------|---------|---------|
| `auth.js` | `/api/auth` | Authentication endpoints | ✅ Complete |
| `employees.js` | `/api/employees` | Employee management | ✅ Complete |
| `payroll.js` | `/api/payroll` | Payroll processing | ✅ Complete |
| `payrollSettings.js` | `/api/payroll/settings` | **Multi-country payroll config** | ✅ **Enhanced** |
| `attendance.js` | `/api/attendance` | Attendance management | ✅ Complete |
| `leaves.js` | `/api/leaves` | Leave management | ✅ Complete |
| `advances.js` | `/api/advances` | Advance management | ✅ Complete |
| `loans.js` | `/api/loans` | Loan management | ✅ Complete |
| `deductions.js` | `/api/deductions` | Deduction management | ✅ Complete |
| `ledger.js` | `/api/ledger` | Ledger operations | ✅ Complete |
| `settings.js` | `/api/settings` | System settings | ✅ Complete |
| `calendar.js` | `/api/calendar` | Calendar operations | ✅ Complete |
| `resignations.js` | `/api/resignations` | Resignation workflow | ✅ Complete |
| `leaveResumptions.js` | `/api/leave-resumptions` | Leave resumption | ✅ Complete |
| `timesheets.js` | `/api/timesheets` | Timesheet management | ✅ Complete |
| `shifts.js` | `/api/shifts` | Shift management | ✅ Complete |
| `activities.js` | `/api/activities` | Activity logs | ✅ Complete |
| `importExport.js` | `/api/import-export` | Data migration | ✅ Complete |
| `sqlServerConfigs.js` | `/api/sql-server-configs` | External DB config | ✅ Complete |
| `users.js` | `/api/users` | User management | ✅ Complete |

### 🔧 Services (`/backend/services/`)
| Service | Purpose | Features | Status |
|---------|---------|----------|---------|
| `ActivityService.js` | Activity Management | Audit trail operations | ✅ Complete |
| `AttendanceService.js` | Attendance Processing | Biometric integration | ✅ Complete |
| `CalendarService.js` | Calendar Operations | Holiday management | ✅ Complete |
| `EmailService.js` | Email Notifications | SMTP integration | ✅ Complete |
| `PayrollService.js` | Payroll Calculations | Complex payroll logic | ✅ Complete |
| `ValidationService.js` | Data Validation | Business rule validation | ✅ Complete |

---

## 🎨 Frontend Architecture (`/frontend/`)

### 📁 Directory Structure
```
frontend/
├── 📂 public/                    # Static assets
├── 📂 src/
│   ├── 📂 components/            # Reusable UI components
│   ├── 📂 config/               # App configuration
│   ├── 📂 layouts/              # Layout components
│   ├── 📂 pages/                # Page components
│   ├── 📂 services/             # API service layer
│   ├── 📂 store/               # State management
│   ├── 📂 utils/               # Utility functions
│   ├── 📄 App.jsx              # Main app component
│   └── 📄 index.js             # App entry point
├── 📄 package.json             # Dependencies
└── 📄 tailwind.config.js       # TailwindCSS config
```

### 🧩 Components (`/frontend/src/components/`)
| Component | Purpose | Features | Status |
|-----------|---------|----------|---------|
| `Header.jsx` | Navigation header | User menu, notifications | ✅ Complete |
| `Sidebar.jsx` | Navigation sidebar | **Multi-country menu updates** | ✅ **Enhanced** |
| `LoadingSpinner.jsx` | Loading states | Spinner animations | ✅ Complete |
| `Modal.jsx` | Modal dialogs | Reusable modal wrapper | ✅ Complete |
| `ProtectedRoute.jsx` | Route protection | Role-based access control | ✅ Complete |
| `ActivityDetailModal.jsx` | Activity details | Audit trail viewer | ✅ Complete |
| `PayrollValidationButton.jsx` | Payroll validation | Validation helper | ✅ Complete |
| `SettingsList.jsx` | Settings navigation | **Updated for payroll settings** | ✅ **Enhanced** |
| `ValidationHelp.jsx` | Form validation | Validation assistance | ✅ Complete |

### 📄 Core Pages (`/frontend/src/pages/`)
| Page | Route | Purpose | Features | Status |
|------|-------|---------|----------|---------|
| `Login.jsx` | `/login` | Authentication | JWT login, Remember me | ✅ Complete |
| `Register.jsx` | `/register` | User registration | Form validation | ✅ Complete |
| `Dashboard.jsx` | `/dashboard` | Main dashboard | Statistics, activities | ✅ Complete |
| `Settings.jsx` | `/settings` | **Settings hub** | **Updated with payroll settings** | ✅ **Enhanced** |

### 🏢 Employee Management Pages
| Page | Route | Features | Status |
|------|-------|----------|---------|
| `EmployeeList.jsx` | `/employees` | Employee listing, search | ✅ Complete |
| `EmployeeDetail.jsx` | `/employees/:id` | Employee profile | ✅ Complete |
| `EmployeeOnboarding.jsx` | `/employees/new` | **Multi-country onboarding** | ✅ **Enhanced** |

### 💰 Payroll Management Pages
| Page | Route | Features | Status |
|------|-------|----------|---------|
| `PayrollDashboard.jsx` | `/payroll` | Payroll overview | ✅ Complete |
| `PayrollDetail.jsx` | `/payroll/:id` | Payroll details | ✅ Complete |
| `MonthEndPayroll.jsx` | `/payroll/month-end` | **Multi-country processing** | ✅ **Enhanced** |
| `EnhancedMultiCountryPayrollSettings.jsx` | `/settings/payroll` | **7-Country Configuration** | ✅ **New Feature** |

### ⚙️ Settings Pages (`/frontend/src/pages/settings/`)
| Page | Purpose | Features | Status |
|------|---------|----------|---------|
| `DesignationList.jsx` & `DesignationForm.jsx` | Job titles | CRUD operations | ✅ Complete |
| `RoleList.jsx` & `RoleForm.jsx` | User roles | Permission management | ✅ Complete |
| `DepartmentList.jsx` & `DepartmentForm.jsx` | Departments | Organizational structure | ✅ Complete |
| `LocationList.jsx` & `LocationForm.jsx` | Office locations | Geographic management | ✅ Complete |
| `PayGradeList.jsx` & `PayGradeForm.jsx` | Salary grades | Compensation structure | ✅ Complete |
| `PayComponentList.jsx` & `PayComponentForm.jsx` | Salary components | Earnings/deductions | ✅ Complete |
| `LeavePolicyList.jsx` & `LeavePolicyForm.jsx` | Leave policies | **Country-specific policies** | ✅ **Enhanced** |
| `CalendarList.jsx` & `CalendarForm.jsx` | Work calendars | Holiday management | ✅ Complete |
| `ShiftList.jsx` & `ShiftForm.jsx` | Work shifts | Schedule management | ✅ Complete |

### 📊 Other Feature Pages
| Module | Pages | Features | Status |
|--------|-------|----------|---------|
| **Attendance** | List, Detail, Form, Dashboard, Mark | Biometric integration | ✅ Complete |
| **Leave** | List, Detail, Form | Approval workflow | ✅ Complete |
| **Advances** | List, Detail, Form | Salary advances | ✅ Complete |
| **Loans** | List, Detail, Form | Employee loans | ✅ Complete |
| **Deductions** | List, Detail, Form | Salary deductions | ✅ Complete |
| **Ledger** | List, Detail | Financial history | ✅ Complete |
| **Resignations** | List, Detail, Form | Exit workflow | ✅ Complete |
| **Timesheets** | List, Detail, Form | Project tracking | ✅ Complete |
| **Reports** | Reports.jsx | Analytics & reports | ✅ Complete |

### 🛠️ Services & Store (`/frontend/src/services/` & `/frontend/src/store/`)
| File | Purpose | Features | Status |
|------|---------|----------|---------|
| `api.js` | API client | **Enhanced payroll APIs** | ✅ **Enhanced** |
| `authStore.js` | Auth state | JWT management | ✅ Complete |

### 🎨 Utilities (`/frontend/src/utils/`)
| Utility | Purpose | Features | Status |
|---------|---------|----------|---------|
| `avatar.js` | Avatar management | Profile pictures | ✅ Complete |
| `currency.js` | Currency formatting | **Multi-currency support** | ✅ **Enhanced** |

---

## 🌍 Multi-Country Payroll System (New Feature)

### 📋 Supported Countries
| Country | Code | Currency | Features | Status |
|---------|------|----------|----------|---------|
| 🇮🇳 India | `IND` | INR (₹) | PF, ESI, Professional Tax, Gratuity | ✅ Complete |
| 🇦🇪 UAE | `UAE` | AED (د.إ) | GPSSA, EOSB, Air Ticket, WPS | ✅ Complete |
| 🇸🇦 Saudi Arabia | `SAU` | SAR (ر.س) | GOSI, EOSB, MUDAWALA, Air Ticket | ✅ Complete |
| 🇴🇲 Oman | `OMN` | OMR (ر.ع.) | PASI, EOSB, Air Ticket, WPS | ✅ Complete |
| 🇧🇭 Bahrain | `BHR` | BHD (د.ب) | GOSI, EOSB, Air Ticket, LMRA | ✅ Complete |
| 🇶🇦 Qatar | `QAT` | QAR (ر.ق) | EOSB, Air Ticket, ADLSA | ✅ Complete |
| 🇪🇬 Egypt | `EGY` | EGP (£) | Social Insurance, EOSB | ✅ Complete |

### 🔧 Enhanced Features
| Feature Category | Implementation | Status |
|------------------|----------------|---------|
| **Country Selection** | Flag-based UI with instant adaptation | ✅ Complete |
| **Statutory Calculations** | Government-mandated rates (auto-applied) | ✅ Complete |
| **Allowances Management** | Country-specific allowance configurations | ✅ Complete |
| **Compliance Settings** | WPS, reporting requirements, toggles | ✅ Complete |
| **Air Ticket System** | Biennial allowance with monthly accrual (GCC) | ✅ Complete |
| **Leave Policies** | Country-specific leave entitlements | ✅ Complete |
| **Currency Display** | Multi-currency with proper symbols | ✅ Complete |

---

## 📦 Database Schema

### 🗄️ Core Tables (Oracle DB)
| Table | Purpose | Records | Status |
|-------|---------|---------|---------|
| `HRMS_USERS` | User authentication | Users & admins | ✅ Production |
| `HRMS_EMPLOYEES` | Employee master | **Multi-country employees** | ✅ **Enhanced** |
| `HRMS_PAYROLL_SETTINGS` | **Multi-country payroll config** | **7-country settings** | ✅ **Enhanced** |
| `HRMS_PAYROLL_COUNTRY_POLICIES` | **Statutory policies** | **Government rates** | ✅ **New** |
| `HRMS_PAYROLL_PERIODS` | Payroll periods | Monthly cycles | ✅ Production |
| `HRMS_PAYROLL_RUNS` | Payroll execution | Processing history | ✅ Production |
| `HRMS_PAYROLL_DETAILS` | Individual payslips | Employee payroll | ✅ Production |
| `HRMS_EMPLOYEE_COMPENSATION` | CTC packages | **Multi-country CTC** | ✅ **Enhanced** |
| `HRMS_ATTENDANCE` | Attendance tracking | Daily records | ✅ Production |
| `HRMS_LEAVES` | Leave management | Leave applications | ✅ Production |
| `HRMS_ADVANCES` | Salary advances | Financial advances | ✅ Production |
| `HRMS_LOANS` | Employee loans | Loan records | ✅ Production |
| `HRMS_DEDUCTIONS` | Salary deductions | Deduction records | ✅ Production |
| `HRMS_ACTIVITIES` | Audit trail | System activities | ✅ Production |

### 🆕 New Database Features
| Enhancement | Purpose | Impact | Status |
|-------------|---------|---------|---------|
| **Country Policies Table** | Store statutory rates | Government compliance | ✅ Implemented |
| **Employee Country Assignment** | Multi-country employees | Payroll filtering | ✅ Implemented |
| **Multi-currency Support** | Currency handling | Global operations | ✅ Implemented |
| **Air Ticket Accruals** | GCC-specific benefit | Employee benefits | ✅ Implemented |

---

## 📚 Documentation Files

### 📄 Main Documentation
| Document | Purpose | Last Updated | Status |
|----------|---------|--------------|---------|
| `README.md` | Project overview | Current | ✅ Updated |
| `PROJECT_CONTEXT.md` | Development context | Current | ✅ Updated |
| `CODEBASE_INDEX.md` | This comprehensive index | Current | ✅ New |

### 📋 Implementation Guides
| Guide | Purpose | Status |
|-------|---------|---------|
| `MULTI_COUNTRY_PAYROLL_IMPLEMENTATION.md` | Multi-country setup | ✅ Complete |
| `ENHANCED_STATUTORY_CALCULATIONS.md` | Statutory compliance | ✅ Complete |
| `COUNTRY_BASED_PAYROLL_PROCESSING.md` | Processing workflow | ✅ Complete |
| `WPS_IMPLEMENTATION_GUIDE.md` | WPS compliance | ✅ Complete |
| `DATABASE_MIGRATION_GUIDE.md` | Database changes | ✅ Complete |
| `CURRENCY_CONFIGURATION_GUIDE.md` | Currency handling | ✅ Complete |
| `DATE_HANDLING_GUIDE.md` | Date formatting | ✅ Complete |

### 🛠️ Technical Documentation
| Document | Purpose | Status |
|----------|---------|---------|
| `backend/README.md` | Backend documentation | ✅ Complete |
| `frontend/README.md` | Frontend documentation | ✅ Complete |
| `backend/API_TESTING.md` | API testing guide | ✅ Complete |
| `backend/VALIDATION_RULES.md` | Validation documentation | ✅ Complete |
| `PRODUCTION_DEPLOYMENT_GUIDE.md` | Deployment instructions | ✅ Complete |
| `TROUBLESHOOTING.md` | Common issues & fixes | ✅ Complete |

---

## 🚀 Deployment & Scripts

### 📂 Migration Scripts (`/scripts/`)
| Script | Purpose | Status |
|--------|---------|---------|
| `complete-migration.js` | Full database migration | ✅ Ready |
| `manual-deployment.sql` | Manual SQL deployment | ✅ Ready |
| `insert-country-payroll-settings.sql` | **Country settings data** | ✅ **New** |
| `deploy-multi-country-payroll.js` | **Multi-country deployment** | ✅ **New** |

### ⚙️ Utility Scripts (`/backend/`)
| Script | Purpose | Status |
|--------|---------|---------|
| `setup.js` | Initial database setup | ✅ Production |
| `server.js` | Main application server | ✅ Production |
| `test-oracle-queries.js` | Database connectivity test | ✅ Production |

---

## 🎯 Current Status & Capabilities

### ✅ Fully Implemented Features
- **🔐 Authentication System** - JWT-based with role management
- **👥 Employee Management** - Complete CRUD with multi-country support
- **💰 Payroll Processing** - Advanced payroll with 7-country support
- **⚙️ Multi-Country Settings** - Complete configuration system
- **📊 Attendance Management** - Biometric integration ready
- **🏖️ Leave Management** - Country-specific policies
- **💳 Financial Management** - Advances, loans, deductions
- **📈 Reporting & Analytics** - Comprehensive reports
- **🔍 Activity Logging** - Complete audit trail
- **📅 Calendar Management** - Holiday and schedule management

### 🆕 Recent Enhancements (Multi-Country Payroll)
- **🌍 7-Country Support** - India, UAE, Saudi, Oman, Bahrain, Qatar, Egypt
- **🏛️ Statutory Compliance** - Government-mandated calculations
- **✈️ Air Ticket System** - Biennial allowance with monthly accrual
- **🏠 Country-Specific Allowances** - Housing, transport, education, etc.
- **⚖️ Compliance Management** - WPS, reporting, regulatory requirements
- **🏖️ Dynamic Leave Policies** - Country-specific leave entitlements
- **💱 Multi-Currency Support** - Proper currency formatting and symbols

### 🎯 Production Readiness
- **🚀 Backend**: Fully production-ready with Oracle integration
- **🎨 Frontend**: Modern React SPA with responsive design
- **🗄️ Database**: Comprehensive schema with multi-country support
- **📚 Documentation**: Complete implementation and deployment guides
- **🧪 Testing**: API testing and validation frameworks in place

---

## 🔮 Technology Stack Summary

### Backend Technology
- **Node.js 18+** - JavaScript runtime
- **Express.js** - Web framework
- **Oracle Database** - Primary database (thick mode)
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Multer** - File upload handling

### Frontend Technology
- **React 18** - UI library with hooks
- **TailwindCSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **Axios** - HTTP client
- **React Router** - Client-side routing
- **React Hot Toast** - Notifications

### Database & Infrastructure
- **Oracle Cloud Infrastructure (OCI)** - Hosting platform
- **Oracle 19c/21c** - Database engine
- **JWT Authentication** - Stateless auth
- **File Upload System** - Document management
- **Activity Logging** - Comprehensive audit trail

---

*This index is automatically maintained and updated with each significant development. Last updated: Current Session*

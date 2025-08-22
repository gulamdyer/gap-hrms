# PROJECT_CONTEXT.md (Cursor IDE Context)

## 🎯 Project Goal

To design and develop a modern HRMS & Payroll web and mobile application using React.js for frontend and Node.js for backend. The system will integrate with Oracle Database hosted on Oracle Cloud Infrastructure (OCI).

This document tells Cursor IDE what the developer is trying to build.

---

## ✅ Modules Overview

1. **Authentication & Authorization** - JWT-based with role management
2. **Multi-Country Dashboard** - Insights with country-specific metrics
3. **Employee Management** - Complete CRUD with multi-country support
4. **Advanced Payroll System** - 7-country support with statutory compliance
5. **Attendance Management** - Biometric integration with country policies
6. **Leave Management** - Country-specific leave policies and entitlements
7. **Financial Management** - Advances, loans, deductions with multi-currency
8. **Multi-Country Payroll Settings** - Dynamic configuration per country
9. **Compliance Management** - WPS, GOSI, PASI, GPSSA integrations
10. **Air Ticket Management** - Biennial allowance system (GCC countries)
11. **Statutory Calculations** - Government-mandated rates and contributions
12. **Activity Logging** - Comprehensive audit trail
13. **Document Management** - File uploads and document generation
14. **Workflow Approval System** - Submit/approve/reject/amend workflows
15. **Reporting & Analytics** - Multi-country reports and insights
16. **Role-Based Access Control** - Granular permissions system

### 🌍 Multi-Country Features
- **7 Countries Supported**: India, UAE, Saudi Arabia, Oman, Bahrain, Qatar, Egypt
- **Dynamic Country Selection**: Flag-based UI with instant adaptation
- **Currency Support**: Multi-currency with proper symbols and formatting
- **Statutory Compliance**: Country-specific government rates and regulations
- **Cultural Considerations**: Ramadan hours, Hajj leave, local holidays

---

## 🧩 Tech Stack

- React 18+, TailwindCSS
- Node.js 18+ / 20 LTS
- Express.js
- oracledb Node.js driver
- Oracle 19c/21c (OCI hosted)
- PDFMake / html-pdf
- JWT, dotenv, cors
- Cursor IDE

---

## 🌐 Hosting / Deployment

- Oracle Cloud Infrastructure (OCI)
- Load Balancer + Listener + Backend Set
- Development on Windows, Deployment to OCI Linux

---


## ⚙ Oracle DB Environment

These environment variables are used for DB connection: 

```
PORT=5000
ORACLE_USER=BOLTOAI
ORACLE_PASSWORD=MonuDyer$25_DB
ORACLE_CONNECT_STRING=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.0.1.44)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SERVICE_NAME=BOLTO_PDB1.sub12260832001.ikramvcn.oraclevcn.com)(SID=BOLTODB)))
```

Make sure to use Oracle Thick Client

---

## 📦 Table Prefix Convention

All Oracle DB tables must be created with the prefix:
```
HRMS_
```

Example table names:
- `HRMS_USERS`
- `HRMS_EMPLOYEES`
- `HRMS_LEAVES`

---

## 👩‍💻 Developer Notes

This project is developed inside Cursor IDE with comprehensive multi-country HRMS capabilities:

### 📁 Project Structure
- `frontend/` - React 18 SPA with TailwindCSS
- `backend/` - Node.js Express API with Oracle integration
- `scripts/` - Database migration and deployment scripts
- `*.md` - Comprehensive documentation and guides

### 🎯 Current Implementation Status
- ✅ **Authentication System** - Complete with JWT and RBAC
- ✅ **Employee Management** - Multi-country employee master data
- ✅ **Multi-Country Payroll** - 7-country support with statutory compliance
- ✅ **Payroll Settings Interface** - Dynamic country-specific configurations
- ✅ **Financial Modules** - Advances, loans, deductions, ledger
- ✅ **Attendance & Leave** - Biometric integration with country policies
- ✅ **Activity Logging** - Complete audit trail system
- ✅ **File Management** - Document upload and avatar system

### 🔄 Auto-Update System
**Important**: This documentation (README.md, PROJECT_CONTEXT.md, CODEBASE_INDEX.md) is automatically maintained and updated with each significant development. Any new features, enhancements, or structural changes will be reflected in these files automatically.

### 📋 Development Guidelines
1. All new database tables use `HRMS_` prefix
2. Multi-country features must support all 7 countries
3. Currency handling must include proper symbols and formatting
4. Statutory calculations must be government-compliant
5. UI must follow the established design patterns
6. All changes must update relevant documentation automatically

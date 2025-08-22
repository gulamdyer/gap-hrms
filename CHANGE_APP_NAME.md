# Changing Application Name Guide

To change the application name from "BOLTO HRMS" to any other name, follow these steps:

## 1. Update Configuration File
Edit `frontend/src/config/appConfig.js` and change:
```javascript
APP_NAME: "BOLTO HRMS",
APP_FULL_NAME: "BOLTO HRMS - Human Resource Management System",
```

## 2. Update HTML Meta Tags
Edit `frontend/public/index.html`:
- Update the `<title>` tag
- Update the meta description

## 3. Update Manifest
Edit `frontend/public/manifest.json`:
- Update `short_name`
- Update `name`

## 4. Update Package.json Files
Edit both `frontend/package.json` and `backend/package.json`:
- Update the `description` field

## 5. Update Documentation Files
Update the following files to reflect the new name:
- `README.md`
- `PRODUCTION_CHECKLIST.md`
- `PRODUCTION_DEPLOYMENT_GUIDE.md`
- `TROUBLESHOOTING.md`
- `CURRENCY_CONFIGURATION_GUIDE.md`
- `DATE_HANDLING_GUIDE.md`
- `frontend/README.md`
- `frontend/QUICK_START.md`
- `backend/README.md`
- `backend/QUICK_START.md`
- `backend/API_TESTING.md`

## 6. Update Print Templates
The following files contain hardcoded application names in print templates:
- `frontend/src/pages/LoanList.jsx`
- `frontend/src/pages/LoanDetail.jsx`
- `frontend/src/pages/TimesheetList.jsx`
- `frontend/src/pages/TimesheetDetail.jsx`
- `frontend/src/pages/DeductionList.jsx`
- `frontend/src/pages/DeductionDetail.jsx`
- `frontend/src/pages/AdvanceList.jsx`
- `frontend/src/pages/AdvanceDetail.jsx`
- `frontend/src/pages/ResignationList.jsx`
- `frontend/src/pages/LeaveResumptionList.jsx`

## 7. Update Backend Messages
Edit backend files to update server messages:
- `backend/server.js`
- `backend/working-server.js`
- `backend/minimal-server.js`
- `backend/setup.js`
- `backend/health-check.js`

## Quick Change Script
You can use this simple script to change the app name:

```bash
# Replace "BOLTO HRMS" with your new app name
find . -type f -name "*.js" -o -name "*.jsx" -o -name "*.md" -o -name "*.json" -o -name "*.html" | xargs sed -i 's/BOLTO HRMS/YOUR_NEW_NAME/g'
```

## Notes
- The login page now uses the configuration file for the app name
- The sidebar uses the configuration file for the app name
- Most components now reference the centralized configuration
- Print templates still need manual updates as they contain hardcoded text

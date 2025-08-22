import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import { ErrorProvider } from './context/ErrorContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/EmployeeList';
import EmployeeOnboarding from './pages/EmployeeOnboarding';
import EmployeeDetail from './pages/EmployeeDetail';
import AdvanceList from './pages/AdvanceList';
import AdvanceForm from './pages/AdvanceForm';
import AdvanceDetail from './pages/AdvanceDetail';
import LoanList from './pages/LoanList';
import LoanForm from './pages/LoanForm';
import LoanDetail from './pages/LoanDetail';
import Settings from './pages/Settings';
import DesignationList from './pages/settings/DesignationList';
import DesignationForm from './pages/settings/DesignationForm';
import RoleList from './pages/settings/RoleList';
import RoleForm from './pages/settings/RoleForm';
import PositionList from './pages/settings/PositionList';
import PositionForm from './pages/settings/PositionForm';
import LocationList from './pages/settings/LocationList';
import LocationForm from './pages/settings/LocationForm';
import CostCenterList from './pages/settings/CostCenterList';
import CostCenterForm from './pages/settings/CostCenterForm';
import PayGradeList from './pages/settings/PayGradeList';
import PayGradeForm from './pages/settings/PayGradeForm';
import PayGradeDetail from './pages/settings/PayGradeDetail';
import PayComponentList from './pages/settings/PayComponentList';
import PayComponentForm from './pages/settings/PayComponentForm';
import DepartmentList from './pages/settings/DepartmentList';
import DepartmentForm from './pages/settings/DepartmentForm';
import WorkcenterList from './pages/settings/WorkcenterList';
import WorkcenterForm from './pages/settings/WorkcenterForm';
import EmploymentTypeList from './pages/settings/EmploymentTypeList';
import EmploymentTypeForm from './pages/settings/EmploymentTypeForm';
import LeavePolicyList from './pages/settings/LeavePolicyList';
import LeavePolicyForm from './pages/settings/LeavePolicyForm';
import ProjectList from './pages/settings/ProjectList';
import ProjectForm from './pages/settings/ProjectForm';
import LeaveList from './pages/LeaveList';
import LeaveForm from './pages/LeaveForm';
import LeaveDetail from './pages/LeaveDetail';
import LeaveResumptionList from './pages/LeaveResumptionList';
import LeaveResumptionForm from './pages/LeaveResumptionForm';
import LeaveResumptionDetail from './pages/LeaveResumptionDetail';
import ResignationList from './pages/ResignationList';
import ResignationForm from './pages/ResignationForm';
import ResignationDetail from './pages/ResignationDetail';
import DeductionList from './pages/DeductionList';
import DeductionForm from './pages/DeductionForm';
import DeductionDetail from './pages/DeductionDetail';
import TimesheetList from './pages/TimesheetList';
import TimesheetForm from './pages/TimesheetForm';
import TimesheetDetail from './pages/TimesheetDetail';
import useAuthStore from './store/authStore';
import ShiftList from './pages/settings/ShiftList';
import ShiftForm from './pages/settings/ShiftForm';
import Calendar from './pages/Calendar';
import CalendarList from './pages/settings/CalendarList';
import CalendarFormEnhanced from './pages/settings/CalendarFormEnhanced'; // Updated import
import AttendanceList from './pages/AttendanceList';
import AttendanceDashboard from './pages/AttendanceDashboard';
import MarkAttendance from './pages/MarkAttendance';
import AttendanceDetail from './pages/AttendanceDetail';
import AttendanceForm from './pages/AttendanceForm';
import PayrollDashboard from './pages/PayrollDashboard';
import MonthEndPayroll from './pages/MonthEndPayroll';
import PayrollPeriodForm from './pages/PayrollPeriodForm';
import PayrollPeriodDetail from './pages/PayrollPeriodDetail';
import PayrollPeriodDetails from './pages/PayrollPeriodDetails';
import PayrollPeriodsList from './pages/PayrollPeriodsList';
import PayrollDetail from './pages/PayrollDetail';
import PayrollSettings from './pages/EnhancedMultiCountryPayrollSettings';
import Reports from './pages/Reports';
import SqlServerConfigList from './pages/SqlServerConfigList';
import ImportExport from './pages/ImportExport';
import SqlServerConfigForm from './pages/SqlServerConfigForm';
import SqlServerConfigDetail from './pages/SqlServerConfigDetail';
import UserList from './pages/UserList';
import UserForm from './pages/UserForm';
import UserDetail from './pages/UserDetail';
import LedgerList from './pages/LedgerList';
import LedgerDetail from './pages/LedgerDetail';
import { NotificationProvider } from './components/NotificationProvider';
import NotificationHistory from './pages/NotificationHistory';

const App = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <ErrorProvider>
      <NotificationProvider>
        <Router>
        <div className="App">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <Routes>
            {/* Public routes */}
            <Route 
              path="/login" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
              } 
            />
            <Route 
              path="/register" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
              } 
            />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Employee routes */}
            <Route
              path="/employees"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <EmployeeList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/onboarding"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <EmployeeOnboarding />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <EmployeeDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/:id/edit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <EmployeeOnboarding />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Advance routes */}
            <Route
              path="/advances"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <AdvanceList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/advances/new"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <AdvanceForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/advances/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <AdvanceDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/advances/:id/edit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <AdvanceForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Loan routes */}
            <Route
              path="/loans"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LoanList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/loans/new"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LoanForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/loans/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LoanDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/loans/:id/edit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LoanForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Leave routes */}
            <Route
              path="/leaves"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LeaveList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaves/new"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LeaveForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaves/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LeaveDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaves/:id/edit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LeaveForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Leave Resumption routes */}
            <Route
              path="/leave-resumptions"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LeaveResumptionList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave-resumptions/new"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LeaveResumptionForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave-resumptions/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LeaveResumptionDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave-resumptions/:id/edit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LeaveResumptionForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Timesheet routes */}
            <Route
              path="/timesheets"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <TimesheetList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/timesheets/new"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <TimesheetForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/timesheets/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <TimesheetDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/timesheets/:id/edit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <TimesheetForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Resignation routes */}
            <Route
              path="/resignations"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ResignationList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/resignations/new"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ResignationForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/resignations/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ResignationDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/resignations/:id/edit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ResignationForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Deductions routes */}
            <Route
              path="/deductions"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DeductionList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/deductions/new"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DeductionForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/deductions/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DeductionDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/deductions/:id/edit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DeductionForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Settings routes */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Settings />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Department routes */}
            <Route
              path="/settings/departments"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DepartmentList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/departments/create"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DepartmentForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/departments/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DepartmentForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/departments/:id/edit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DepartmentForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Workcenter routes */}
            <Route
              path="/settings/workcenters"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <WorkcenterList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/workcenters/create"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <WorkcenterForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/workcenters/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <WorkcenterForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/workcenters/:id/edit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <WorkcenterForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Employment Type routes */}
            <Route
              path="/settings/employment-types"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <EmploymentTypeList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/employment-types/create"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <EmploymentTypeForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/employment-types/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <EmploymentTypeForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/employment-types/:id/edit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <EmploymentTypeForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Designation routes */}
            <Route
              path="/settings/designations"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DesignationList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/designations/create"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DesignationForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/designations/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DesignationForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/designations/:id/edit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DesignationForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Role routes */}
            <Route
              path="/settings/roles"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <RoleList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/roles/create"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <RoleForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/roles/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <RoleForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/roles/:id/edit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <RoleForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Position routes */}
            <Route
              path="/settings/positions"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PositionList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/positions/create"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PositionForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/positions/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PositionForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/positions/:id/edit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PositionForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Location routes */}
            <Route
              path="/settings/locations"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LocationList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/locations/create"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LocationForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/locations/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LocationForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/locations/:id/edit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LocationForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Cost Center routes */}
            <Route
              path="/settings/cost-centers"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <CostCenterList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/cost-centers/create"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <CostCenterForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/cost-centers/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <CostCenterForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/cost-centers/:id/edit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <CostCenterForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Pay Grade routes */}
            <Route
              path="/settings/pay-grades"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PayGradeList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/pay-grades/create"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PayGradeForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/pay-grades/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PayGradeDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/pay-grades/:id/edit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PayGradeForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Pay Component routes */}
            <Route
              path="/settings/pay-components"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PayComponentList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/pay-components/create"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PayComponentForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/pay-components/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PayComponentForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/pay-components/:id/edit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PayComponentForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Leave Policy routes */}
            <Route
              path="/settings/leave-policies"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LeavePolicyList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/leave-policies/create"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LeavePolicyForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/leave-policies/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LeavePolicyForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/leave-policies/:id/edit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LeavePolicyForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Project routes */}
            <Route
              path="/settings/projects"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ProjectList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/projects/create"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ProjectForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/projects/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ProjectForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/projects/:id/edit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ProjectForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Shift Management routes */}
            <Route
              path="/settings/shifts"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ShiftList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/shifts/create"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ShiftForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/shifts/:id/edit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ShiftForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Attendance routes */}
            <Route
              path="/attendance"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <AttendanceList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <AttendanceDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance/mark"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <MarkAttendance />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <AttendanceDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance/:id/edit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <AttendanceForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance/create"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <AttendanceForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Payroll routes */}
            <Route
              path="/payroll"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PayrollDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Reports */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Reports />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            {/* Month End Payroll routes */}
            <Route
              path="/payroll/month-end"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <MonthEndPayroll />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Payroll Period routes */}
            <Route
              path="/payroll/periods"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PayrollPeriodsList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/periods/create"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PayrollPeriodForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/periods/:id/edit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PayrollPeriodForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/periods/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PayrollPeriodDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/periods/:id/details"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PayrollPeriodDetails />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/details/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PayrollDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Payroll Settings moved to Settings submenu */}
            <Route
              path="/settings/payroll"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PayrollSettings />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

                  {/* SQL Server Configuration routes */}
        <Route
          path="/sql-server-configs"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <SqlServerConfigList />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Import/Export routes */}
        <Route
          path="/import-export"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ImportExport />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* User Management routes */}
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <UserList />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/create"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <UserForm />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:id"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <UserDetail />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:id/edit"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <UserForm />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
          <Route
            path="/sql-server-configs/new"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SqlServerConfigForm />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sql-server-configs/:id"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SqlServerConfigDetail />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sql-server-configs/:id/edit"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SqlServerConfigForm />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Calendar routes */}
          <Route
            path="/settings/calendar"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Calendar />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/calendars"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CalendarList />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/calendars/new"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CalendarFormEnhanced />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/calendars/:id"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CalendarFormEnhanced />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/calendars/:id/edit"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CalendarFormEnhanced />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Ledger routes */}
          <Route
            path="/ledger"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <LedgerList />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ledger/employees/:employeeId"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <LedgerDetail />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Notification history route */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <NotificationHistory />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Redirect root to dashboard or login */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Catch all route */}
          <Route
            path="*"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </div>
    </Router>
      </NotificationProvider>
    </ErrorProvider>
  );
};

export default App; 
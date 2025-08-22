import axios from 'axios';
import useAuthStore from '../store/authStore';

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const authState = useAuthStore.getState();
    const token = authState.token;
    const user = authState.user;
    
    console.log('🔍 API Request Debug:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      userRole: user?.role,
      userData: user
    });
    
    // Temporarily skip authentication for user endpoints
    if (config.url && config.url.includes('/api/users')) {
      console.log('🔧 Skipping authentication for user endpoints');
      return config;
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.log('❌ API Response Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    
    // Surface 429 (Too Many Requests) to callers to handle backoff per page
    // No automatic global retry to avoid feedback loops across multiple components
    
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  // Login
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  // Register
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  // Get profile
  getProfile: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/api/auth/profile', profileData);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.put('/api/auth/change-password', passwordData);
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

// Employee API calls
export const employeeAPI = {
  // Get all employees
  getAll: async (params = {}) => {
    const response = await api.get('/api/employees', { params });
    return response.data;
  },

  // Get employee by ID
  getById: async (id) => {
    const response = await api.get(`/api/employees/${id}`);
    return response.data;
  },

  // Create employee
  create: async (employeeData) => {
    const response = await api.post('/api/employees', employeeData);
    return response.data;
  },

  // Update employee
  update: async (id, employeeData) => {
    const response = await api.put(`/api/employees/${id}`, employeeData);
    return response.data;
  },

  // Delete employee
  delete: async (id) => {
    const response = await api.delete(`/api/employees/${id}`);
    return response.data;
  },

  // Update employee status
  updateStatus: async (id, status) => {
    const response = await api.patch(`/api/employees/${id}/status`, { status });
    return response.data;
  },

  // Upload avatar
  uploadAvatar: async (id, file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post(`/api/employees/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Upload document
  uploadDocument: async (id, documentType, file) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);
    const response = await api.post(`/api/employees/${id}/document`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Get employees for dropdown
  getDropdown: async () => {
    const response = await api.get('/api/employees/dropdown/list');
    return response.data;
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get('/api/employees/dashboard/stats');
    return response.data;
  },

  // Get countries for dropdown (public endpoint)
  getCountriesDropdown: async () => {
    const response = await api.get('/api/public/countries');
    return response.data;
  },

  // Calculate real-time CTC based on country and compensation
  calculateRealTimeCTC: async (employeeData, compensationData) => {
    const response = await api.post('/api/employees/calculate-ctc', {
      employeeData,
      compensationData
    });
    return response.data;
  },
};

// Activity API calls
export const activityAPI = {
  // Get all activities
  getAll: async (params = {}) => {
    const response = await api.get('/api/activities', { params });
    return response.data;
  },

  // Get recent activities for dashboard
  getRecent: async (limit = 10) => {
    const response = await api.get('/api/activities/recent', { params: { limit } });
    return response.data;
  },

  // Get activity by ID
  getById: async (id) => {
    const response = await api.get(`/api/activities/${id}`);
    return response.data;
  },

  // Get activity statistics
  getStatistics: async () => {
    const response = await api.get('/api/activities/stats/overview');
    return response.data;
  },

  // Delete activity
  delete: async (id) => {
    const response = await api.delete(`/api/activities/${id}`);
    return response.data;
  }
};

// Advance API calls
export const advanceAPI = {
  // Get all advances
  getAll: async (params = {}) => {
    const response = await api.get('/api/advances', { params });
    return response.data;
  },

  // Get advance by ID
  getById: async (id) => {
    const response = await api.get(`/api/advances/${id}`);
    return response.data;
  },

  // Create advance
  create: async (advanceData) => {
    const response = await api.post('/api/advances', advanceData);
    return response.data;
  },

  // Update advance
  update: async (id, advanceData) => {
    const response = await api.put(`/api/advances/${id}`, advanceData);
    return response.data;
  },

  // Delete advance
  delete: async (id) => {
    const response = await api.delete(`/api/advances/${id}`);
    return response.data;
  },

  // Get advances by employee ID
  getByEmployee: async (employeeId) => {
    const response = await api.get(`/api/advances/employee/${employeeId}`);
    return response.data;
  },

  // Get advance statistics
  getStatistics: async () => {
    const response = await api.get('/api/advances/statistics/overview');
    return response.data;
  },
};

// Loan API calls
export const loanAPI = {
  // Get all loans
  getAll: async (params = {}) => {
    const response = await api.get('/api/loans', { params });
    return response.data;
  },

  // Get loan by ID
  getById: async (id) => {
    const response = await api.get(`/api/loans/${id}`);
    return response.data;
  },

  // Create loan
  create: async (loanData) => {
    const response = await api.post('/api/loans', loanData);
    return response.data;
  },

  // Update loan
  update: async (id, loanData) => {
    const response = await api.put(`/api/loans/${id}`, loanData);
    return response.data;
  },

  // Delete loan
  delete: async (id) => {
    const response = await api.delete(`/api/loans/${id}`);
    return response.data;
  },

  // Get loans by employee
  getByEmployee: async (employeeId) => {
    const response = await api.get(`/api/loans/employee/${employeeId}`);
    return response.data;
  },

  // Get loan statistics
  getStatistics: async () => {
    const response = await api.get('/api/loans/statistics');
    return response.data;
  },
};

// Leave API calls
export const leaveAPI = {
  // Get all leaves
  getAll: async (params = {}) => {
    const response = await api.get('/api/leaves', { params });
    return response.data;
  },

  // Get leave by ID
  getById: async (id) => {
    const response = await api.get(`/api/leaves/${id}`);
    return response.data;
  },

  // Create leave
  create: async (leaveData) => {
    const response = await api.post('/api/leaves', leaveData);
    return response.data;
  },

  // Update leave
  update: async (id, leaveData) => {
    const response = await api.put(`/api/leaves/${id}`, leaveData);
    return response.data;
  },

  // Delete leave
  delete: async (id) => {
    const response = await api.delete(`/api/leaves/${id}`);
    return response.data;
  },

  // Update leave status
  updateStatus: async (id, statusData) => {
    const response = await api.patch(`/api/leaves/${id}/status`, statusData);
    return response.data;
  },

  // Get leaves by employee ID
  getByEmployee: async (employeeId) => {
    const response = await api.get(`/api/leaves/employee/${employeeId}`);
    return response.data;
  },

  // Get leave statistics
  getStatistics: async () => {
    const response = await api.get('/api/leaves/statistics/overview');
    return response.data;
  },

  // Get leaves by status
  getByStatus: async (status) => {
    const response = await api.get(`/api/leaves/status/${status}`);
    return response.data;
  },

  // Get form data (employees and leave policies)
  getFormData: async () => {
    const response = await api.get('/api/leaves/form/data');
    return response.data;
  },
};

// Leave Resumption API calls
export const leaveResumptionAPI = {
  // Get all leave resumptions
  getAll: async (params = {}) => {
    const response = await api.get('/api/leave-resumptions', { params });
    return response.data;
  },

  // Get resumption by ID
  getById: async (id) => {
    const response = await api.get(`/api/leave-resumptions/${id}`);
    return response.data;
  },

  // Create leave resumption
  create: async (resumptionData) => {
    const response = await api.post('/api/leave-resumptions', resumptionData);
    return response.data;
  },

  // Update resumption status (approve/reject)
  updateStatus: async (id, statusData) => {
    const response = await api.put(`/api/leave-resumptions/${id}/status`, statusData);
    return response.data;
  },

  // Delete resumption
  delete: async (id) => {
    const response = await api.delete(`/api/leave-resumptions/${id}`);
    return response.data;
  },

  // Get resumptions by employee ID
  getByEmployee: async (employeeId) => {
    const response = await api.get(`/api/leave-resumptions/employee/${employeeId}`);
    return response.data;
  },

  // Get resumptions by leave ID
  getByLeave: async (leaveId) => {
    const response = await api.get(`/api/leave-resumptions/leave/${leaveId}`);
    return response.data;
  },

  // Get resumption statistics
  getStatistics: async () => {
    const response = await api.get('/api/leave-resumptions/statistics');
    return response.data;
  },

  // Get approved leaves eligible for resumption
  getEligibleLeaves: async (params = {}) => {
    const response = await api.get('/api/leave-resumptions/eligible-leaves', { params });
    return response.data;
  },

  // Mark integration as updated
  markIntegrationUpdated: async (id, type) => {
    const response = await api.put(`/api/leave-resumptions/${id}/integration`, { type });
    return response.data;
  },
};

// Resignation API calls
export const resignationAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/api/resignations', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/api/resignations/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/api/resignations', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/api/resignations/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/resignations/${id}`);
    return response.data;
  },
};

// Deduction API calls
export const deductionAPI = {
  // Get all deductions with filtering and pagination
  getAll: async (params = {}) => {
    const response = await api.get('/api/deductions', { params });
    return response.data;
  },

  // Get specific deduction by ID
  getById: async (id) => {
    const response = await api.get(`/api/deductions/${id}`);
    return response.data;
  },

  // Create new deduction
  create: async (data) => {
    const response = await api.post('/api/deductions', data);
    return response.data;
  },

  // Update deduction
  update: async (id, data) => {
    const response = await api.put(`/api/deductions/${id}`, data);
    return response.data;
  },

  // Delete deduction
  delete: async (id) => {
    const response = await api.delete(`/api/deductions/${id}`);
    return response.data;
  },

  // Update deduction status (approve/reject/cancel)
  updateStatus: async (id, statusData) => {
    const response = await api.patch(`/api/deductions/${id}/status`, statusData);
    return response.data;
  },

  // Get deductions by employee ID
  getByEmployee: async (employeeId, params = {}) => {
    const response = await api.get(`/api/deductions/employee/${employeeId}`, { params });
    return response.data;
  },

  // Get deduction summary statistics
  getSummary: async (params = {}) => {
    const response = await api.get('/api/deductions/summary', { params });
    return response.data;
  },
};

// Attendance API calls
export const attendanceAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/api/attendance', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/api/attendance/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/api/attendance', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/api/attendance/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/attendance/${id}`);
    return response.data;
  },
  bulkCreate: async (data) => {
    const response = await api.post('/api/attendance/bulk', data);
    return response.data;
  },
  getStatistics: async (params = {}) => {
    const response = await api.get('/api/attendance/statistics/employee', { params });
    return response.data;
  },
  getDashboard: async (params = {}) => {
    const response = await api.get('/api/attendance/dashboard/overview', { params });
    return response.data;
  },
  markAttendance: async (data) => {
    const response = await api.post('/api/attendance/mark', data);
    return response.data;
  },
  getBiometricDevices: async () => {
    const response = await api.get('/api/attendance/devices/biometric');
    return response.data;
  },
  createBiometricDevice: async (data) => {
    const response = await api.post('/api/attendance/devices/biometric', data);
    return response.data;
  },
  getStatusForDropdown: async () => {
    const response = await api.get('/api/attendance/dropdown/statuses');
    return response.data;
  }
};

// Settings API calls
export const settingsAPI = {
  // Designations
  getAllDesignations: async (params = {}) => {
    const response = await api.get('/api/settings/designations', { params });
    return response.data;
  },

  getDesignationById: async (id) => {
    const response = await api.get(`/api/settings/designations/${id}`);
    return response.data;
  },

  createDesignation: async (designationData) => {
    const response = await api.post('/api/settings/designations', designationData);
    return response.data;
  },

  updateDesignation: async (id, designationData) => {
    const response = await api.put(`/api/settings/designations/${id}`, designationData);
    return response.data;
  },

  deleteDesignation: async (id) => {
    const response = await api.delete(`/api/settings/designations/${id}`);
    return response.data;
  },

  // Roles
  getAllRoles: async (params = {}) => {
    const response = await api.get('/api/settings/roles', { params });
    return response.data;
  },

  getRoleById: async (id) => {
    const response = await api.get(`/api/settings/roles/${id}`);
    return response.data;
  },

  createRole: async (roleData) => {
    const response = await api.post('/api/settings/roles', roleData);
    return response.data;
  },

  updateRole: async (id, roleData) => {
    const response = await api.put(`/api/settings/roles/${id}`, roleData);
    return response.data;
  },

  deleteRole: async (id) => {
    const response = await api.delete(`/api/settings/roles/${id}`);
    return response.data;
  },

  // Positions
  getAllPositions: async (params = {}) => {
    const response = await api.get('/api/settings/positions', { params });
    return response.data;
  },

  getPositionById: async (id) => {
    const response = await api.get(`/api/settings/positions/${id}`);
    return response.data;
  },

  createPosition: async (positionData) => {
    const response = await api.post('/api/settings/positions', positionData);
    return response.data;
  },

  updatePosition: async (id, positionData) => {
    const response = await api.put(`/api/settings/positions/${id}`, positionData);
    return response.data;
  },

  deletePosition: async (id) => {
    const response = await api.delete(`/api/settings/positions/${id}`);
    return response.data;
  },

  // Locations
  getAllLocations: async (params = {}) => {
    const response = await api.get('/api/settings/locations', { params });
    return response.data;
  },

  getLocationById: async (id) => {
    const response = await api.get(`/api/settings/locations/${id}`);
    return response.data;
  },

  createLocation: async (locationData) => {
    const response = await api.post('/api/settings/locations', locationData);
    return response.data;
  },

  updateLocation: async (id, locationData) => {
    const response = await api.put(`/api/settings/locations/${id}`, locationData);
    return response.data;
  },

  deleteLocation: async (id) => {
    const response = await api.delete(`/api/settings/locations/${id}`);
    return response.data;
  },

  // Cost Centers
  getAllCostCenters: async (params = {}) => {
    const response = await api.get('/api/settings/cost-centers', { params });
    return response.data;
  },

  // Departments
  getAllDepartments: async (params = {}) => {
    const response = await api.get('/api/settings/departments', { params });
    return response.data;
  },
  getDepartmentById: async (id) => { const response = await api.get(`/api/settings/departments/${id}`); return response.data; },
  createDepartment: async (data) => { const response = await api.post('/api/settings/departments', data); return response.data; },
  updateDepartment: async (id, data) => { const response = await api.put(`/api/settings/departments/${id}`, data); return response.data; },
  deleteDepartment: async (id) => { const response = await api.delete(`/api/settings/departments/${id}`); return response.data; },

  // Workcenters
  getAllWorkcenters: async (params = {}) => { const response = await api.get('/api/settings/workcenters', { params }); return response.data; },
  getWorkcenterById: async (id) => { const response = await api.get(`/api/settings/workcenters/${id}`); return response.data; },
  createWorkcenter: async (data) => { const response = await api.post('/api/settings/workcenters', data); return response.data; },
  updateWorkcenter: async (id, data) => { const response = await api.put(`/api/settings/workcenters/${id}`, data); return response.data; },
  deleteWorkcenter: async (id) => { const response = await api.delete(`/api/settings/workcenters/${id}`); return response.data; },

  // Employment Types
  getAllEmploymentTypes: async (params = {}) => { const response = await api.get('/api/settings/employment-types', { params }); return response.data; },
  getEmploymentTypeById: async (id) => { const response = await api.get(`/api/settings/employment-types/${id}`); return response.data; },
  createEmploymentType: async (data) => { const response = await api.post('/api/settings/employment-types', data); return response.data; },
  updateEmploymentType: async (id, data) => { const response = await api.put(`/api/settings/employment-types/${id}`, data); return response.data; },
  deleteEmploymentType: async (id) => { const response = await api.delete(`/api/settings/employment-types/${id}`); return response.data; },

  getCostCenterById: async (id) => {
    const response = await api.get(`/api/settings/cost-centers/${id}`);
    return response.data;
  },

  createCostCenter: async (costCenterData) => {
    const response = await api.post('/api/settings/cost-centers', costCenterData);
    return response.data;
  },

  updateCostCenter: async (id, costCenterData) => {
    const response = await api.put(`/api/settings/cost-centers/${id}`, costCenterData);
    return response.data;
  },

  deleteCostCenter: async (id) => {
    const response = await api.delete(`/api/settings/cost-centers/${id}`);
    return response.data;
  },

  // Pay Grades
  getAllPayGrades: async (params = {}) => {
    const response = await api.get('/api/settings/pay-grades', { params });
    return response.data;
  },

  getPayGradeById: async (id) => {
    const response = await api.get(`/api/settings/pay-grades/${id}`);
    return response.data;
  },

  createPayGrade: async (payGradeData) => {
    const response = await api.post('/api/settings/pay-grades', payGradeData);
    return response.data;
  },

  updatePayGrade: async (id, payGradeData) => {
    const response = await api.put(`/api/settings/pay-grades/${id}`, payGradeData);
    return response.data;
  },

  deletePayGrade: async (id) => {
    const response = await api.delete(`/api/settings/pay-grades/${id}`);
    return response.data;
  },

  // Pay Components
  getAllPayComponents: async (params = {}) => {
    const response = await api.get('/api/settings/pay-components', { params });
    return response.data;
  },

  getPayComponentById: async (id) => {
    const response = await api.get(`/api/settings/pay-components/${id}`);
    return response.data;
  },

  createPayComponent: async (payComponentData) => {
    const response = await api.post('/api/settings/pay-components', payComponentData);
    return response.data;
  },

  updatePayComponent: async (id, payComponentData) => {
    const response = await api.put(`/api/settings/pay-components/${id}`, payComponentData);
    return response.data;
  },

  deletePayComponent: async (id) => {
    const response = await api.delete(`/api/settings/pay-components/${id}`);
    return response.data;
  },

  // Dropdown APIs
  getDesignationsForDropdown: async () => {
    const response = await api.get('/api/settings/dropdown/designations');
    return response.data;
  },

  getRolesForDropdown: async () => {
    const response = await api.get('/api/settings/dropdown/roles');
    return response.data;
  },

  getPositionsForDropdown: async () => {
    const response = await api.get('/api/settings/dropdown/positions');
    return response.data;
  },

  getLocationsForDropdown: async () => {
    const response = await api.get('/api/settings/dropdown/locations');
    return response.data;
  },

  getCostCentersForDropdown: async () => {
    const response = await api.get('/api/settings/dropdown/cost-centers');
    return response.data;
  },

  getPayComponentsForDropdown: async () => {
    const response = await api.get('/api/settings/dropdown/pay-components');
    return response.data;
  },

  getPayGradesForDropdown: async () => {
    const response = await api.get('/api/settings/dropdown/pay-grades');
    return response.data;
  },

  getDepartmentsForDropdown: async () => {
    const response = await api.get('/api/settings/dropdown/departments');
    return response.data;
  },
  getWorkcentersForDropdown: async () => {
    const response = await api.get('/api/settings/dropdown/workcenters');
    return response.data;
  },
  getEmploymentTypesForDropdown: async () => {
    const response = await api.get('/api/settings/dropdown/employment-types');
    return response.data;
  },

  // Leave Policies
  getAllLeavePolicies: async (params = {}) => {
    const response = await api.get('/api/settings/leave-policies', { params });
    return response.data;
  },

  getLeavePolicyById: async (id) => {
    const response = await api.get(`/api/settings/leave-policies/${id}`);
    return response.data;
  },

  createLeavePolicy: async (leavePolicyData) => {
    const response = await api.post('/api/settings/leave-policies', leavePolicyData);
    return response.data;
  },

  updateLeavePolicy: async (id, leavePolicyData) => {
    const response = await api.put(`/api/settings/leave-policies/${id}`, leavePolicyData);
    return response.data;
  },

  deleteLeavePolicy: async (id) => {
    const response = await api.delete(`/api/settings/leave-policies/${id}`);
    return response.data;
  },

  getLeavePoliciesForDropdown: async () => {
    const response = await api.get('/api/settings/dropdown/leave-policies');
    return response.data;
  },

  // Currency configuration
  getCurrencyConfig: async () => {
    const response = await api.get('/api/settings/currency-config');
    return response.data;
  }
};

// Timesheet API calls
export const timesheetAPI = {
  // Get all timesheets
  getAll: async (params = {}) => {
    const response = await api.get('/api/timesheets', { params });
    return response.data;
  },

  // Get timesheet by ID
  getById: async (id) => {
    const response = await api.get(`/api/timesheets/${id}`);
    return response.data;
  },

  // Create timesheet
  create: async (timesheetData) => {
    const response = await api.post('/api/timesheets', timesheetData);
    return response.data;
  },

  // Update timesheet
  update: async (id, timesheetData) => {
    const response = await api.put(`/api/timesheets/${id}`, timesheetData);
    return response.data;
  },

  // Update timesheet status
  updateStatus: async (id, statusData) => {
    const response = await api.patch(`/api/timesheets/${id}/status`, statusData);
    return response.data;
  },

  // Delete timesheet
  delete: async (id) => {
    const response = await api.delete(`/api/timesheets/${id}`);
    return response.data;
  },

  // Get timesheet statistics
  getStatistics: async (params = {}) => {
    const response = await api.get('/api/timesheets/statistics', { params });
    return response.data;
  },

  // Get time tracking statistics
  getTimeTrackingStats: async (params = {}) => {
    const response = await api.get('/api/timesheets/stats/time-tracking', { params });
    return response.data;
  },

  // Timesheet Entry APIs
  // Get timesheet entries
  getEntries: async (timesheetId) => {
    const response = await api.get(`/api/timesheets/${timesheetId}/entries`);
    return response.data;
  },

  // Create timesheet entry
  createEntry: async (timesheetId, entryData) => {
    const response = await api.post(`/api/timesheets/${timesheetId}/entries`, entryData);
    return response.data;
  },

  // Update timesheet entry
  updateEntry: async (timesheetId, entryId, entryData) => {
    const response = await api.put(`/api/timesheets/${timesheetId}/entries/${entryId}`, entryData);
    return response.data;
  },

  // Delete timesheet entry
  deleteEntry: async (timesheetId, entryId) => {
    const response = await api.delete(`/api/timesheets/${timesheetId}/entries/${entryId}`);
    return response.data;
  },

  // Project APIs
  // Get all projects
  getAllProjects: async (params = {}) => {
    const response = await api.get('/api/timesheets/projects/all', { params });
    return response.data;
  },

  // Get projects for dropdown
  getProjectsDropdown: async () => {
    const response = await api.get('/api/timesheets/projects/dropdown');
    return response.data;
  },
};

// Project API calls (for Settings management)
export const projectAPI = {
  // Get all projects
  getAll: async (params = {}) => {
    const response = await api.get('/api/timesheets/projects/all', { params });
    return response.data;
  },

  // Get project by ID
  getById: async (id) => {
    const response = await api.get(`/api/timesheets/projects/${id}`);
    return response.data;
  },

  // Create project
  create: async (projectData) => {
    const response = await api.post('/api/timesheets/projects', projectData);
    return response.data;
  },

  // Update project
  update: async (id, projectData) => {
    const response = await api.put(`/api/timesheets/projects/${id}`, projectData);
    return response.data;
  },

  // Delete project
  delete: async (id) => {
    const response = await api.delete(`/api/timesheets/projects/${id}`);
    return response.data;
  },

  // Get projects for dropdown
  getDropdown: async () => {
    const response = await api.get('/api/timesheets/projects/dropdown');
    return response.data;
  },
};

export const shiftAPI = {
  getAll: async () => {
    const response = await api.get('/api/shifts');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/api/shifts/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/api/shifts', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/api/shifts/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/shifts/${id}`);
    return response.data;
  },
  getDropdown: async () => {
    const response = await api.get('/api/shifts/dropdown');
    return response.data;
  },
};

// Employee Compensation API
export const compensationAPI = {
  // Get all compensation for an employee
  getByEmployeeId: async (employeeId) => {
    const response = await api.get(`/api/employees/${employeeId}/compensation`);
    return response.data;
  },

  // Get active compensation for an employee
  getActiveByEmployeeId: async (employeeId, date = null) => {
    const params = date ? { date } : {};
    const response = await api.get(`/api/employees/${employeeId}/compensation/active`, { params });
    return response.data;
  },

  // Get compensation summary for an employee
  getSummary: async (employeeId) => {
    const response = await api.get(`/api/employees/${employeeId}/compensation/summary`);
    return response.data;
  },

  // Create compensation record
  create: async (employeeId, compensationData) => {
    const response = await api.post(`/api/employees/${employeeId}/compensation`, compensationData);
    return response.data;
  },

  // Update compensation record
  update: async (compensationId, compensationData) => {
    const response = await api.put(`/api/employees/compensation/${compensationId}`, compensationData);
    return response.data;
  },

  // Delete compensation record
  delete: async (compensationId) => {
    const response = await api.delete(`/api/employees/compensation/${compensationId}`);
    return response.data;
  },

  // Bulk update compensation for an employee
  bulkUpdate: async (employeeId, compensationData) => {
    const response = await api.put(`/api/employees/${employeeId}/compensation/bulk`, { compensationData });
    return response.data;
  }
};

// Calendar API
export const calendarAPI = {
  // Calendar Management
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/api/calendars?${queryString}`);
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/api/calendars/${id}`);
    return response.data;
  },
  create: async (calendarData) => {
    const response = await api.post('/api/calendars', calendarData);
    return response.data;
  },
  update: async (id, calendarData) => {
    const response = await api.put(`/api/calendars/${id}`, calendarData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/calendars/${id}`);
    return response.data;
  },
  getDropdown: async () => {
    const response = await api.get('/api/calendars/dropdown');
    return response.data;
  },
  getWeeklyHolidays: async (calendarId) => {
    const response = await api.get(`/api/calendars/${calendarId}/weekly-holidays`);
    return response.data;
  },

  // Holiday Management
  getAllHolidays: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/api/calendars/holidays?${queryString}`);
    return response.data;
  },
  getHolidayById: async (id) => {
    const response = await api.get(`/api/calendars/holidays/${id}`);
    return response.data;
  },
  createHoliday: async (holidayData) => {
    const response = await api.post('/api/calendars/holidays', holidayData);
    return response.data;
  },
  updateHoliday: async (id, holidayData) => {
    const response = await api.put(`/api/calendars/holidays/${id}`, holidayData);
    return response.data;
  },
  deleteHoliday: async (id) => {
    const response = await api.delete(`/api/calendars/holidays/${id}`);
    return response.data;
  },
  getHolidayTypes: async () => {
    const response = await api.get('/api/calendars/holidays/types');
    return response.data;
  },
  getHolidaysByCalendar: async (calendarId, year) => {
    const response = await api.get(`/api/calendars/${calendarId}/holidays/${year}`);
    return response.data;
  },

  // Enhanced Holiday Management
  getHolidayPatterns: async () => {
    const response = await api.get('/api/calendars/holidays/patterns');
    return response.data;
  },
  getDayOfWeekOptions: async () => {
    const response = await api.get('/api/calendars/holidays/day-options');
    return response.data;
  },
  getWeekOfMonthOptions: async () => {
    const response = await api.get('/api/calendars/holidays/week-options');
    return response.data;
  },
  getNamedHolidayTemplates: async () => {
    const response = await api.get('/api/calendars/holidays/templates');
    return response.data;
  },
  createHolidayFromTemplate: async (templateData) => {
    const response = await api.post('/api/calendars/holidays/template', templateData);
    return response.data;
  },
  createRecurringHoliday: async (recurringData) => {
    const response = await api.post('/api/calendars/holidays/recurring', recurringData);
    return response.data;
  }
};

// Payroll API
export const payrollAPI = {
  // Payroll periods
  createPeriod: async (data) => {
    const response = await api.post('/api/payroll/periods', data);
    return response.data;
  },
  getPeriods: async (params = {}) => {
    const response = await api.get('/api/payroll/periods', { params });
    return response.data;
  },
  getAllPeriods: async (filters = {}) => {
    const response = await api.get('/api/payroll/periods', { params: filters });
    return response.data;
  },
  getPeriodById: async (id) => {
    const response = await api.get(`/api/payroll/periods/${id}`);
    return response.data;
  },
  updatePeriod: async (id, data) => {
    const response = await api.put(`/api/payroll/periods/${id}`, data);
    return response.data;
  },
  getPeriodDetails: async (id, params = {}) => {
    const response = await api.get(`/api/payroll/periods/${id}/details`, { params });
    return response.data;
  },
  getPeriodStatistics: async (id) => {
    const response = await api.get(`/api/payroll/periods/${id}/statistics`);
    return response.data;
  },

  getPeriodRuns: async (id) => {
    const response = await api.get(`/api/payroll/periods/${id}/runs`);
    return response.data;
  },

  // Payroll processing
  processPayroll: async (data) => {
    const response = await api.post('/api/payroll/process', data);
    return response.data;
  },

  // Payroll details
  getPayrollDetail: async (id) => {
    const response = await api.get(`/api/payroll/details/${id}`);
    return response.data;
  },
  approvePayroll: async (id, data) => {
    const response = await api.post(`/api/payroll/details/${id}/approve`, data);
    return response.data;
  },

  // Payroll runs
  getRuns: async (params = {}) => {
    const response = await api.get('/api/payroll/runs', { params });
    return response.data;
  },

  // Payroll dashboard
  getDashboard: async (params = {}) => {
    const response = await api.get('/api/payroll/dashboard', { params });
    return response.data;
  },

  // Payroll settings
  initializeSettings: async () => {
    const response = await api.post('/api/payroll/initialize-settings');
    return response.data;
  },

  // Get payroll settings
  getSettings: async () => {
    const response = await api.get('/api/payroll/settings');
    return response.data?.data || {};
  },

  // Get country-specific settings
  getCountrySettings: async (countryCode) => {
    const response = await api.get(`/api/payroll/settings?countryCode=${countryCode}`);
    return response.data?.data || {};
  },

  // Update payroll settings
  updateSettings: async (section, settingsData) => {
    const response = await api.put(`/api/payroll/settings/${section}`, settingsData);
    return response.data;
  },

  // Get specific payroll setting section
  getSettingsSection: async (section) => {
    const response = await api.get(`/api/payroll/settings/${section}`);
    return response.data?.data || {};
  },

  // Month-end payroll processing (removed duplicate - using the one with individual parameters below)
  getMonthEndStatus: async (params) => {
    const response = await api.get('/api/payroll/month-end/status', { params });
    return response.data;
  },
  approveMonthEnd: async (periodId, data = {}) => {
    const response = await api.post(`/api/payroll/month-end/${periodId}/approve`, data);
    return response.data;
  },
  generateMonthEndReport: async (periodId, reportType) => {
    const response = await api.get(`/api/payroll/month-end/${periodId}/reports`, { 
      params: { reportType } 
    });
    return response.data;
  },
  // Month-end attendance processing
  getAttendanceSummary: async (params) => {
    const response = await api.get('/api/payroll/month-end/attendance/summary', { params });
    return response.data;
  },
  confirmAttendanceSummary: async (data) => {
    const response = await api.post('/api/payroll/month-end/attendance/confirm', data);
    return response.data;
  },
  runAttendanceProcedure: async (params) => {
    const response = await api.get('/api/payroll/month-end/attendance/summary', { params: { ...params, recalculate: true } });
    return response.data;
  },
  updateAttendanceFinal: async (data) => {
    const response = await api.put('/api/payroll/month-end/attendance/final', data);
    return response.data;
  },
  cleanMonth: async (params) => {
    const response = await api.delete('/api/payroll/month-end/clean', { params });
    return response.data;
  },

  // Month-end payroll validation
  validateMonthEndPrerequisites: async (month, year) => {
    try {
      const response = await api.get(`/api/payroll/month-end/validate?month=${month}&year=${year}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Step-based workflow APIs
  processAttendance: async (month, year) => {
    const response = await api.post('/api/payroll/process-attendance', { month, year });
    return response.data;
  },
  saveAttendanceSummary: async (month, year, attendanceSummary) => {
    const response = await api.post('/api/payroll/save-attendance', { 
      month, 
      year, 
      attendanceSummary 
    });
    return response.data;
  },
  processMonthEnd: async (month, year, processType = 'FULL') => {
    const response = await api.post('/api/payroll/month-end', { 
      month, 
      year, 
      processType 
    });
    return response.data;
  },
  cleanMonthData: async (month, year) => {
    const response = await api.delete('/api/payroll/month-end/clean', { 
      params: { month, year } 
    });
    return response.data;
  }
};

// SQL Server Config API calls
export const sqlServerConfigAPI = {
  // Get all configurations
  getAll: async (params = {}) => {
    const response = await api.get('/api/sql-server-configs', { params });
    return response.data;
  },

  // Get configuration by ID
  getById: async (id) => {
    const response = await api.get(`/api/sql-server-configs/${id}`);
    return response.data;
  },

  // Create new configuration
  create: async (configData) => {
    const response = await api.post('/api/sql-server-configs', configData);
    return response.data;
  },

  // Update configuration
  update: async (id, configData) => {
    const response = await api.put(`/api/sql-server-configs/${id}`, configData);
    return response.data;
  },

  // Delete configuration
  delete: async (id) => {
    const response = await api.delete(`/api/sql-server-configs/${id}`);
    return response.data;
  },

  // Get active configurations
  getActive: async () => {
    const response = await api.get('/api/sql-server-configs/active');
    return response.data;
  },

  // Get statistics
  getStatistics: async () => {
    const response = await api.get('/api/sql-server-configs/statistics');
    return response.data;
  },

  // Test connection
  testConnection: async (id) => {
    const response = await api.post(`/api/sql-server-configs/${id}/test`);
    return response.data;
  }
};

// Import/Export API calls
export const importExportAPI = {
  // Get available entities for import/export
  getAvailableEntities: async () => {
    const response = await api.get('/api/import-export/entities');
    return response.data;
  },

  // Export data from a specific entity
  exportData: async (entityId, format = 'excel') => {
    const response = await api.get(`/api/import-export/export/${entityId}/${format}`, {
      responseType: 'blob'
    });
    return response;
  },

  // Generate template for a specific entity
  generateTemplate: async (entityId, format = 'excel') => {
    const response = await api.get(`/api/import-export/template/${entityId}/${format}`, {
      responseType: 'blob'
    });
    return response;
  },

  // Import data from uploaded file
  importData: async (entityId, formData) => {
    const response = await api.post(`/api/import-export/import/${entityId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Get import history
  getImportHistory: async () => {
    const response = await api.get('/api/import-export/history');
    return response.data;
  }
};

// User Management API calls
export const userAPI = {
  // Get all users with filters and pagination
  getAll: async (filters = {}) => {
    const response = await api.get('/api/users', { params: filters });
    return response.data;
  },

  // Get user by ID
  getById: async (id) => {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },

  // Create new user
  create: async (userData) => {
    const response = await api.post('/api/users', userData);
    return response.data;
  },

  // Update user
  update: async (id, userData) => {
    const response = await api.put(`/api/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  delete: async (id) => {
    const response = await api.delete(`/api/users/${id}`);
    return response.data;
  },

  // Update user status
  updateStatus: async (id, status) => {
    const response = await api.patch(`/api/users/${id}/status`, { status });
    return response.data;
  },

  // Update user password
  updatePassword: async (id, password) => {
    const response = await api.patch(`/api/users/${id}/password`, { password });
    return response.data;
  },

  // Get user statistics
  getStatistics: async () => {
    const response = await api.get('/api/users/statistics');
    return response.data;
  },

  // Get users for dropdown
  getDropdown: async () => {
    const response = await api.get('/api/users/dropdown');
    return response.data;
  },

  // Get pay grades for dropdown
  getPayGradesDropdown: async () => {
    const response = await api.get('/api/users/pay-grades/dropdown');
    return response.data;
  }
};

export default api;
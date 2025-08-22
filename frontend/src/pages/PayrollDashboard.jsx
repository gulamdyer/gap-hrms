import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CurrencyDollarIcon, 
  CalendarIcon, 
  UserGroupIcon, 
  ClockIcon,
  PlusIcon,
  PlayIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { payrollAPI, employeeAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

// Date handling helper functions from DATE_HANDLING_GUIDE.md
const convertToDDMMYYYY = (dateString) => {
  if (!dateString || dateString === '') return '';
  
  // If already in DD-MM-YYYY format, return as is
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
    return dateString;
  }
  
  // If in YYYY-MM-DD format, convert to DD-MM-YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  }
  
  // Try to parse other formats
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
  }
  
  return '';
};

// Convert DD-MM-YYYY to YYYY-MM-DD for backend
const convertToYYYYMMDD = (dateString) => {
  if (!dateString || dateString === '') return null;
  
  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // If in DD-MM-YYYY format, convert to YYYY-MM-DD
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split('-');
    return `${year}-${month}-${day}`;
  }
  
  // Try to parse other formats
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
  }
  
  return null;
};

const PayrollDashboard = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalPeriods: 0,
    totalProcessed: 0,
    totalPending: 0,
    recentPeriods: []
  });
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  const [cleaningPayroll, setCleaningPayroll] = useState(false);
  const [periodRuns, setPeriodRuns] = useState({});
  
  // Clean data modal states
  const [showCleanModal, setShowCleanModal] = useState(false);
  const [showCleanCompleteModal, setShowCleanCompleteModal] = useState(false);
  const [periodToClean, setPeriodToClean] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await payrollAPI.getDashboard();
      
      // Fix data structure - extract summary counts and add activeEmployees
      const dashboardPayload = {
        ...response.data,
        totalPeriods: response.data.summary?.totalPeriods || 0,
        totalProcessed: response.data.summary?.totalProcessed || 0,
        totalPending: response.data.summary?.totalPending || 0,
        activeEmployees: 0 // Will be fetched separately
      };
      
      setDashboardData(dashboardPayload);
      
      // Fetch active employees count
      try {
        const employeesData = await employeeAPI.getDropdownList();
        const activeCount = employeesData.data?.filter(emp => emp.STATUS === 'ACTIVE')?.length || 0;
        setDashboardData(prev => ({ ...prev, activeEmployees: activeCount }));
      } catch (error) {
        console.error('Error fetching active employees count:', error);
      }
      
      // Fetch run status for each period
      const runsData = {};
      for (const period of response.data.recentPeriods) {
        try {
          const runsResponse = await payrollAPI.getPeriodRuns(period.PERIOD_ID);
          runsData[period.PERIOD_ID] = runsResponse.data.runs || [];
        } catch (error) {
          console.error(`Error fetching runs for period ${period.PERIOD_ID}:`, error);
          runsData[period.PERIOD_ID] = [];
        }
      }
      setPeriodRuns(runsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanPayroll = (periodId) => {
    // Find the period and store it for modal use
    const period = dashboardData.recentPeriods.find(p => p.PERIOD_ID === periodId);
    if (!period) {
      toast.error('Period not found');
      return;
    }
    setPeriodToClean(period);
    setShowCleanModal(true);
  };

  const confirmCleanPayroll = async () => {
    if (!periodToClean) return;
    
    try {
      setCleaningPayroll(true);
      setShowCleanModal(false);
      
      // Extract month and year from START_DATE (format: YYYY-MM-DD)
      const startDate = new Date(periodToClean.START_DATE);
      const month = startDate.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
      const year = startDate.getFullYear();
      
      // Use clean month data endpoint
      await payrollAPI.cleanMonthData(month, year);
      setShowCleanCompleteModal(true);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error cleaning payroll:', error);
      toast.error(error.response?.data?.message || 'Failed to clean payroll data');
    } finally {
      setCleaningPayroll(false);
    }
  };

  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'DRAFT':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'PROCESSING':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'APPROVED':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'PAID':
        return <CurrencyDollarIcon className="h-5 w-5 text-green-700" />;
      default:
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PAID':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  const getRunStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'COMPLETED_WITH_ERRORS':
        return <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />;
      case 'IN_PROGRESS':
        return <ClockIcon className="h-4 w-4 text-blue-500" />;
      case 'FAILED':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'CANCELLED':
        return <XCircleIcon className="h-4 w-4 text-gray-500" />;
      default:
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
    }
  };

  const getRunStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED_WITH_ERRORS':
        return 'bg-orange-100 text-orange-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  const getLatestRunStatus = (periodId) => {
    const runs = periodRuns[periodId] || [];
    if (runs.length === 0) return null;
    return runs[0]; // Most recent run
  };

  const getErrorSummary = (run) => {
    if (!run || !run.ERROR_MESSAGE) return null;
    
    try {
      const errorData = JSON.parse(run.ERROR_MESSAGE);
      if (errorData.userFriendly) {
        const errorTypes = Object.keys(errorData.userFriendly.errorTypes);
        if (errorTypes.length > 0) {
          const firstError = errorData.userFriendly.errorTypes[errorTypes[0]];
          return {
            type: firstError.details.title,
            count: errorData.userFriendly.totalErrors,
            severity: firstError.details.severity
          };
        }
      }
    } catch (e) {
      // Fallback for old format
      return {
        type: 'Processing Error',
        count: 1,
        severity: 'HIGH'
      };
    }
    return null;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return convertToDDMMYYYY(dateString);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Dashboard</h1>
          <p className="text-gray-600">Manage and process employee payroll</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/payroll/periods/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Period
          </Link>

          <Link
            to="/payroll/periods"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            View All
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Periods
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardData.totalPeriods}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Processed
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardData.totalProcessed}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardData.totalPending}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Employees
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardData.activeEmployees}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payroll Periods */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Payroll Periods
            </h3>
            <Link
              to="/payroll/periods"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              View all
            </Link>
          </div>

          {dashboardData.recentPeriods.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No payroll periods</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new payroll period.
              </p>
              <div className="mt-6">
                <Link
                  to="/payroll/periods/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Period
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Range
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pay Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Run Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.recentPeriods.map((period) => {
                    const latestRun = getLatestRunStatus(period.PERIOD_ID);
                    return (
                      <tr key={period.PERIOD_ID} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {period.PERIOD_NAME}
                          </div>
                          <div className="text-sm text-gray-500">
                            {period.PERIOD_TYPE}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(period.START_DATE)} - {formatDate(period.END_DATE)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(period.PAY_DATE)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(period.STATUS)}
                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(period.STATUS)}`}>
                              {period.STATUS}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {latestRun ? (
                            <div className="flex items-center">
                              {getRunStatusIcon(latestRun.STATUS)}
                              <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRunStatusColor(latestRun.STATUS)}`}>
                                {latestRun.STATUS}
                              </span>
                              {latestRun.STATUS === 'COMPLETED_WITH_ERRORS' && (
                                <div className="ml-2">
                                  {(() => {
                                    const errorSummary = getErrorSummary(latestRun);
                                    if (errorSummary) {
                                      return (
                                        <div className="flex items-center">
                                          <ExclamationTriangleIcon className="h-3 w-3 text-orange-500 mr-1" />
                                          <span className="text-xs text-orange-700">
                                            {errorSummary.count} error{errorSummary.count > 1 ? 's' : ''}
                                          </span>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">No runs</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link
                              to={`/payroll/periods/${period.PERIOD_ID}`}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="View Period"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Link>
                            {period.STATUS !== 'APPROVED' && (
                              <>
                                <Link
                                  to="/payroll/month-end"
                                  className="text-green-600 hover:text-green-900"
                                  title="Go to Month-End Processing"
                                >
                                  <PlayIcon className="h-4 w-4" />
                                </Link>
                                <button
                                  onClick={() => handleCleanPayroll(period.PERIOD_ID)}
                                  disabled={cleaningPayroll}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                  title="Clean Payroll Data"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            <Link
                              to={`/payroll/periods/${period.PERIOD_ID}/details`}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              Details
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/payroll/periods/create"
              className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
            >
              <div className="flex-shrink-0">
                <PlusIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">
                  Create Payroll Period
                </p>
                <p className="text-sm text-gray-500">
                  Set up a new payroll period
                </p>
              </div>
            </Link>

            <Link
              to="/payroll/periods"
              className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
            >
              <div className="flex-shrink-0">
                <EyeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">
                  View All Periods
                </p>
                <p className="text-sm text-gray-500">
                  Manage payroll periods
                </p>
              </div>
            </Link>

            <Link
              to="/payroll/settings"
              className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
            >
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">
                  Payroll Settings
                </p>
                <p className="text-sm text-gray-500">
                  Configure payroll rules
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Clean Month Data Confirmation Modal */}
      {showCleanModal && periodToClean && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
              <h3 className="text-lg font-medium text-gray-900 mt-5">Clean Payroll Data</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  This will permanently delete all payroll processing data for {periodToClean.PERIOD_NAME}, including:
                </p>
                <ul className="mt-3 text-sm text-gray-500 text-left">
                  <li>• Attendance summary records</li>
                  <li>• Payroll calculation data</li>
                  <li>• Period and run information</li>
                  <li>• All related processing data</li>
                </ul>
                <p className="text-sm text-red-600 mt-3 font-medium">
                  This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={confirmCleanPayroll}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 mr-2"
                >
                  Yes, Clean Data
                </button>
                <button
                  onClick={() => setShowCleanModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clean Complete Modal */}
      {showCleanCompleteModal && periodToClean && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
              <h3 className="text-lg font-medium text-gray-900 mt-5">Payroll Data Cleaned Successfully!</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 mb-3">
                  All payroll data for {periodToClean.PERIOD_NAME} has been successfully cleaned.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 font-medium">
                    ✨ Ready to Start Fresh!
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    You can now process payroll for this period again from scratch.
                  </p>
                </div>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => {
                    setShowCleanCompleteModal(false);
                    setPeriodToClean(null);
                  }}
                  className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollDashboard; 
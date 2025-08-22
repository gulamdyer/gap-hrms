import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  PlayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  XCircleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { payrollAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

// Date handling helper functions
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

const PayrollPeriodsList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    periodType: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [processingPayroll, setProcessingPayroll] = useState(false);
  const [periodRuns, setPeriodRuns] = useState({});

  useEffect(() => {
    fetchPeriods();
  }, [filters]);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const response = await payrollAPI.getAllPeriods(filters);
      setPeriods(response.data);
      
      // Fetch run status for each period
      const runsData = {};
      for (const period of response.data) {
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
      console.error('Error fetching payroll periods:', error);
      toast.error('Failed to fetch payroll periods');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      periodType: '',
      search: ''
    });
  };

  const handleProcessPayroll = async (periodId) => {
    try {
      setProcessingPayroll(true);
      
      // Find the period to get month and year
      const period = periods.find(p => p.PERIOD_ID === periodId);
      if (!period) {
        throw new Error('Period not found');
      }
      
      // Extract month and year from START_DATE (format: YYYY-MM-DD)
      const startDate = new Date(period.START_DATE);
      const month = startDate.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
      const year = startDate.getFullYear();
      
      // Use month-end processing endpoint
      await payrollAPI.processMonthEnd(month, year, 'FULL');
      toast.success('Month-end payroll processing started successfully');
      fetchPeriods(); // Refresh data
    } catch (error) {
      console.error('Error processing payroll:', error);
      toast.error(error.response?.data?.message || 'Failed to process payroll');
    } finally {
      setProcessingPayroll(false);
    }
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return convertToDDMMYYYY(dateString);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Periods</h1>
          <p className="text-gray-600">Manage and view all payroll periods</p>
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
            to="/payroll"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Dashboard
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search periods..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>
            <div className="mt-3 sm:mt-0 sm:ml-4">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>

              <div>
                <label htmlFor="periodType" className="block text-sm font-medium text-gray-700">
                  Period Type
                </label>
                <select
                  id="periodType"
                  name="periodType"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={filters.periodType}
                  onChange={(e) => handleFilterChange('periodType', e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="BIWEEKLY">Bi-weekly</option>
                  <option value="QUARTERLY">Quarterly</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Periods List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {periods.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No payroll periods found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.search || filters.status || filters.periodType 
                  ? 'Try adjusting your filters or search terms.'
                  : 'Get started by creating a new payroll period.'
                }
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
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {periods.map((period) => {
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
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">No runs</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {period.TOTAL_NET_PAY ? formatCurrency(period.TOTAL_NET_PAY) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link
                              to={`/payroll/periods/${period.PERIOD_ID}`}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Link>
                            {period.STATUS === 'DRAFT' && (
                              <Link
                                to={`/payroll/periods/${period.PERIOD_ID}/edit`}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit Period"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Link>
                            )}
                            {period.STATUS === 'DRAFT' && (
                              <button
                                onClick={() => handleProcessPayroll(period.PERIOD_ID)}
                                disabled={processingPayroll}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                title="Process Payroll"
                              >
                                <PlayIcon className="h-4 w-4" />
                              </button>
                            )}
                            <Link
                              to={`/payroll/periods/${period.PERIOD_ID}/details`}
                              className="text-gray-600 hover:text-gray-900"
                              title="View Payroll Details"
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

      {/* Summary Stats */}
      {periods.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <CalendarIcon className="h-6 w-6 text-blue-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Total Periods</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {periods.length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Completed</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {periods.filter(p => p.STATUS === 'COMPLETED' || p.STATUS === 'APPROVED' || p.STATUS === 'PAID').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Draft</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {periods.filter(p => p.STATUS === 'DRAFT').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <ClockIcon className="h-6 w-6 text-blue-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Processing</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {periods.filter(p => p.STATUS === 'PROCESSING').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollPeriodsList; 
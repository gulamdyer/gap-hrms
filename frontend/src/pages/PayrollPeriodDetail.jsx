import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { payrollAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import currencyConfig from '../utils/currency';

// Date handling helper functions from DATE_HANDLING_GUIDE.md
const convertToDDMMYYYY = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const PayrollPeriodDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(null);
  const [payrollRuns, setPayrollRuns] = useState([]);

  useEffect(() => {
    fetchPeriodDetails();
  }, [id]);

  const fetchPeriodDetails = async () => {
    try {
      setLoading(true);
      const [periodResponse, runsResponse] = await Promise.all([
        payrollAPI.getPeriodById(id),
        payrollAPI.getPeriodRuns(id)
      ]);
      setPeriod(periodResponse.data);
      setPayrollRuns(runsResponse.data.runs || []);
    } catch (error) {
      console.error('Error fetching period details:', error);
      toast.error('Failed to fetch period details');
    } finally {
      setLoading(false);
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
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
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
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'COMPLETED_WITH_ERRORS':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      case 'IN_PROGRESS':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'FAILED':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'CANCELLED':
        return <XCircleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return convertToDDMMYYYY(dateString);
  };

  const formatCurrency = (amount) => {
    if (!amount) return currencyConfig.formatAmount(0);
    return currencyConfig.formatAmount(amount);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!period) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Period not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The payroll period you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/payroll"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Payroll
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/payroll')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {period.PERIOD_NAME}
            </h1>
            <p className="text-gray-600">
              Payroll Period Details
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          {period.STATUS === 'DRAFT' ? (
            <Link
              to={`/payroll/periods/${id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </Link>
          ) : (
            <button
              disabled
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed opacity-50"
              title="Edit is only available for DRAFT periods"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Period Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Period Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Period Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{period.PERIOD_NAME}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Period Type</dt>
              <dd className="mt-1 text-sm text-gray-900">{period.PERIOD_TYPE}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <div className="flex items-center">
                  {getStatusIcon(period.STATUS)}
                  <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(period.STATUS)}`}>
                    {period.STATUS}
                  </span>
                </div>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Start Date</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(period.START_DATE)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">End Date</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(period.END_DATE)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Pay Date</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(period.PAY_DATE)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created By</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {period.CREATED_BY_FIRST_NAME} {period.CREATED_BY_LAST_NAME}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(period.CREATED_AT)}</dd>
            </div>
            {period.UPDATED_AT && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(period.UPDATED_AT)}</dd>
              </div>
            )}
            {payrollRuns.length > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Latest Run Status</dt>
                <dd className="mt-1">
                  <div className="flex items-center">
                    {getRunStatusIcon(payrollRuns[0].STATUS)}
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRunStatusColor(payrollRuns[0].STATUS)}`}>
                      {payrollRuns[0].STATUS}
                    </span>
                  </div>
                </dd>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payroll Runs */}
      {payrollRuns.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Payroll Runs
            </h3>
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Run Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employees Processed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Failed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Run Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payrollRuns.map((run) => (
                    <tr key={run.RUN_ID}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {run.RUN_NAME}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {run.RUN_TYPE}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getRunStatusIcon(run.STATUS)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRunStatusColor(run.STATUS)}`}>
                            {run.STATUS}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {run.TOTAL_EMPLOYEES_PROCESSED || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {run.TOTAL_EMPLOYEES_FAILED || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(run.RUN_DATE)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {run.COMPLETED_AT ? formatDate(run.COMPLETED_AT) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {payrollRuns.some(run => run.ERROR_MESSAGE) && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Error Details</h4>
                {payrollRuns.map((run) => {
                  if (!run.ERROR_MESSAGE) return null;
                  
                  let errorData;
                  try {
                    errorData = JSON.parse(run.ERROR_MESSAGE);
                  } catch (e) {
                    // Fallback for old format
                    errorData = { technical: [{ error: run.ERROR_MESSAGE }] };
                  }

                  const userFriendly = errorData.userFriendly;
                  const technical = errorData.technical;

                  return (
                    <div key={run.RUN_ID} className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                      <div className="flex">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5" />
                        <div className="ml-3 flex-1">
                          <h3 className="text-sm font-medium text-red-800 mb-2">
                            Run {run.RUN_NAME} - {run.STATUS}
                          </h3>
                          
                          {userFriendly ? (
                            <div className="space-y-3">
                              {/* Summary */}
                              <div className="bg-white rounded-md p-3 border border-red-100">
                                <h4 className="text-sm font-semibold text-red-800 mb-2">Summary</h4>
                                <p className="text-sm text-red-700 whitespace-pre-line">
                                  {userFriendly.summary}
                                </p>
                              </div>

                              {/* Error Types */}
                              {Object.entries(userFriendly.errorTypes).map(([type, errorInfo]) => (
                                <div key={type} className="bg-white rounded-md p-3 border border-red-100">
                                  <h4 className="text-sm font-semibold text-red-800 mb-2">
                                    {errorInfo.details.title} ({errorInfo.count} employee{errorInfo.count > 1 ? 's' : ''})
                                  </h4>
                                  <p className="text-sm text-red-700 mb-2">{errorInfo.details.message}</p>
                                  
                                  <div className="mb-2">
                                    <p className="text-sm font-medium text-red-800">{errorInfo.details.action}</p>
                                    <ul className="mt-1 space-y-1">
                                      {errorInfo.details.fields.map((field, index) => (
                                        <li key={index} className="text-sm text-red-700 flex items-start">
                                          <span className="text-red-500 mr-2">•</span>
                                          {field}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
                                    <p className="text-xs font-medium text-yellow-800 mb-1">Example:</p>
                                    <p className="text-xs text-yellow-700">{errorInfo.details.example}</p>
                                  </div>
                                  
                                  <div className="mt-2">
                                    <p className="text-xs font-medium text-red-800">Affected employees:</p>
                                    <p className="text-xs text-red-700">{errorInfo.employees.join(', ')}</p>
                                  </div>
                                </div>
                              ))}

                              {/* Technical Details (Collapsible) */}
                              <details className="bg-gray-50 rounded-md p-3">
                                <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                                  Technical Details (Click to expand)
                                </summary>
                                <div className="mt-2">
                                  <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-white p-2 rounded border">
                                    {JSON.stringify(technical, null, 2)}
                                  </pre>
                                </div>
                              </details>
                            </div>
                          ) : (
                            // Fallback for old format
                            <div className="text-sm text-red-700">
                              <pre className="whitespace-pre-wrap">{run.ERROR_MESSAGE}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Resolution Guide */}
      {payrollRuns.some(run => run.STATUS === 'COMPLETED_WITH_ERRORS' || run.STATUS === 'FAILED') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-blue-900 mb-4">
              <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 inline mr-2" />
              Error Resolution Guide
            </h3>
            <div className="space-y-4">
              <div className="bg-white rounded-md p-4 border border-blue-100">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">Common Issues & Solutions</h4>
                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-medium text-blue-700">📅 Date Format Issues</h5>
                    <p className="text-sm text-blue-600">Ensure all dates are in DD-MM-YYYY format (e.g., 25-12-2024)</p>
                    <p className="text-xs text-blue-500 mt-1">Check: Employee joining date, compensation dates, attendance dates</p>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-blue-700">💰 Missing Compensation</h5>
                    <p className="text-sm text-blue-600">Add compensation details for employees before processing payroll</p>
                    <p className="text-xs text-blue-500 mt-1">Go to: Employee Management → Compensation → Add New</p>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-blue-700">👥 Missing Employee Data</h5>
                    <p className="text-sm text-blue-600">Complete employee profile with department and position assignments</p>
                    <p className="text-xs text-blue-500 mt-1">Go to: Employee Management → Edit Employee</p>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-blue-700">📊 Attendance Issues</h5>
                    <p className="text-sm text-blue-600">Mark attendance for the payroll period before processing</p>
                    <p className="text-xs text-blue-500 mt-1">Go to: Attendance → Mark Attendance</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <h4 className="text-sm font-semibold text-yellow-800 mb-2">💡 Quick Actions</h4>
                <div className="space-y-2">
                  <p className="text-sm text-yellow-700">
                    <strong>1.</strong> Fix the data issues mentioned in the error details above
                  </p>
                  <p className="text-sm text-yellow-700">
                    <strong>2.</strong> Verify all employee information is complete and accurate
                  </p>
                  <p className="text-sm text-yellow-700">
                    <strong>3.</strong> Re-run the payroll processing after fixing the issues
                  </p>
                  <p className="text-sm text-yellow-700">
                    <strong>4.</strong> Contact system administrator if issues persist
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Statistics */}
      {period.STATUS !== 'DRAFT' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Payroll Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <UserGroupIcon className="h-6 w-6 text-blue-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Total Employees</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {period.TOTAL_EMPLOYEES || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Gross Pay</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(period.TOTAL_GROSS_PAY)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-6 w-6 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Total Deductions</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(period.TOTAL_DEDUCTIONS)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Net Pay</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(period.TOTAL_NET_PAY)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to={`/payroll/periods/${id}/details`}
              className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
            >
              <div className="flex-shrink-0">
                <EyeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">
                  View Payroll Details
                </p>
                <p className="text-sm text-gray-500">
                  See individual employee payrolls
                </p>
              </div>
            </Link>

            <Link
              to={`/payroll/periods/${id}/reports`}
              className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
            >
              <div className="flex-shrink-0">
                <CalendarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">
                  Generate Reports
                </p>
                <p className="text-sm text-gray-500">
                  Create payroll reports
                </p>
              </div>
            </Link>

            <Link
              to="/payroll"
              className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
            >
              <div className="flex-shrink-0">
                <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">
                  Back to Dashboard
                </p>
                <p className="text-sm text-gray-500">
                  Return to payroll overview
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollPeriodDetail; 
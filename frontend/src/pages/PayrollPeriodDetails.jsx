import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  CurrencyDollarIcon,
  UserIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
  DocumentTextIcon
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

const PayrollPeriodDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(null);
  const [payrollDetails, setPayrollDetails] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    department: ''
  });

  useEffect(() => {
    fetchPeriodAndDetails();
  }, [id]);

  const fetchPeriodAndDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch period info
      const periodResponse = await payrollAPI.getPeriodById(id);
      setPeriod(periodResponse.data);
      
      // Fetch payroll details
      const detailsResponse = await payrollAPI.getPeriodDetails(id);
      
      // Handle different response structures
      let detailsData = [];
      if (detailsResponse && detailsResponse.data) {
        detailsData = Array.isArray(detailsResponse.data) ? detailsResponse.data : [];
      } else if (Array.isArray(detailsResponse)) {
        detailsData = detailsResponse;
      }
      
      // Transform the data to match frontend expectations
      const transformedDetails = detailsData.map(detail => ({
        ...detail,
        EMPLOYEE_NAME: `${detail.EMPLOYEE_FIRST_NAME || ''} ${detail.EMPLOYEE_LAST_NAME || ''}`.trim(),
        EMPLOYEE_ID: detail.EMPLOYEE_ID,
        DEPARTMENT: detail.DEPARTMENT,
        BASIC_SALARY: detail.BASIC_SALARY,
        GROSS_PAY: detail.GROSS_SALARY, // Backend returns GROSS_SALARY
        TOTAL_DEDUCTIONS: detail.TOTAL_DEDUCTIONS,
        NET_PAY: detail.NET_SALARY, // Backend returns NET_SALARY
        STATUS: detail.STATUS,
        PAYROLL_ID: detail.PAYROLL_ID
      }));
      
      setPayrollDetails(transformedDetails);
      
    } catch (error) {
      console.error('Error fetching payroll details:', error);
      
      // If it's a 404 or no data, that's okay - just set empty array
      if (error.response?.status === 404 || error.response?.status === 200) {
        setPayrollDetails([]);
      } else if (error.response?.status === 500) {
        // For 500 errors, check if it's because there are no payroll details
        console.log('500 error - likely no payroll details yet');
        setPayrollDetails([]);
      } else {
        toast.error('Failed to fetch payroll details');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'CALCULATED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'APPROVED':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'PAID':
        return <CurrencyDollarIcon className="h-5 w-5 text-green-700" />;
      case 'PENDING':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'ERROR':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CALCULATED':
        return 'bg-green-100 text-green-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const filteredPayrollDetails = payrollDetails.filter(detail => {
    const matchesSearch = !filters.search || 
      detail.EMPLOYEE_NAME?.toLowerCase().includes(filters.search.toLowerCase()) ||
      detail.EMPLOYEE_ID?.toString().includes(filters.search);
    
    const matchesStatus = !filters.status || detail.STATUS === filters.status;
    const matchesDepartment = !filters.department || detail.DEPARTMENT === filters.department;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

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
            onClick={() => navigate(`/payroll/periods/${id}`)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Payroll Details - {period.PERIOD_NAME}
            </h1>
            <p className="text-gray-600">
              Individual employee payroll calculations
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Employees
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {payrollDetails.length}
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
                <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Gross Pay
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(payrollDetails.reduce((sum, detail) => sum + (detail.GROSS_PAY || 0), 0))}
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
                <CurrencyDollarIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Deductions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(payrollDetails.reduce((sum, detail) => sum + (detail.TOTAL_DEDUCTIONS || 0), 0))}
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
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Net Pay
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(payrollDetails.reduce((sum, detail) => sum + (detail.NET_PAY || 0), 0))}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Employee
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search by name or ID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="CALCULATED">Calculated</option>
                <option value="APPROVED">Approved</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="ERROR">Error</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                value={filters.department}
                onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Departments</option>
                {Array.from(new Set(payrollDetails.map(detail => detail.DEPARTMENT).filter(Boolean))).map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Details Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Employee Payroll Details
            </h3>
            <span className="text-sm text-gray-500">
              {filteredPayrollDetails.length} of {payrollDetails.length} employees
            </span>
          </div>

          {/* Generate Reports */}
          <div className="flex justify-end mb-4">
            <div className="relative inline-block text-left space-x-2">
              <button
                onClick={async () => {
                  try {
                    // Fetch detailed report
                    const res = await payrollAPI.generateMonthEndReport(id, 'DETAILED');
                    const rows = Array.isArray(res?.data?.reportData) ? res.data.reportData : (res?.data || []);
                    // Build a flat dataset for Excel
                    const sheetRows = rows.map(r => ({
                      Days: r.WORK_DAYS ?? '',
                      Code: r.EMPLOYEE_CODE ?? '',
                      Name: `${r.EMPLOYEE_FIRST_NAME ?? ''} ${r.EMPLOYEE_LAST_NAME ?? ''}`.trim(),
                      DOJ: r.DATE_OF_JOINING || '',
                      Department: r.DEPARTMENT || '',
                      Designation: r.DESIGNATION || '',
                      Basic: r.BASIC_AMOUNT ?? r.BASIC_SALARY ?? 0,
                      HRA: r.HRA_AMOUNT ?? 0,
                      TotalSalary: r.GROSS_SALARY ?? 0,
                      CheckInDays: r.PRESENT_DAYS ?? '',
                      BasicAmount: r.BASIC_AMOUNT ?? r.BASIC_SALARY ?? 0,
                      HRAEarned: r.HRA_AMOUNT ?? 0,
                      OtherAllowance: r.OTHER_ALLOWANCE ?? 0,
                      EarnedTotal: (r.BASIC_AMOUNT ?? r.BASIC_SALARY ?? 0) + (r.HRA_AMOUNT ?? 0) + (r.OTHER_ALLOWANCE ?? 0),
                      PFEarnBasic: '',
                      ESI: '',
                      PF: '',
                      TDS: '',
                      Advance: '',
                      TotalDeduction: r.TOTAL_DEDUCTION_AMOUNT ?? r.TOTAL_DEDUCTIONS ?? 0,
                      SalaryPayable: r.NET_SALARY ?? 0
                    }));
                    // Export to XLSX
                    const XLSX = await import('xlsx');
                    const wb = XLSX.utils.book_new();
                    const ws = XLSX.utils.json_to_sheet(sheetRows);
                    XLSX.utils.book_append_sheet(wb, ws, 'Salary Sheet');
                    XLSX.writeFile(wb, `salary_sheet_period_${id}.xlsx`);
                  } catch (e) {
                    console.error('Report export failed:', e);
                  }
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Salary Sheet (Excel)
              </button>

              <button
                onClick={async () => {
                  try {
                    const res = await payrollAPI.generateMonthEndReport(id, 'PF');
                    const rows = Array.isArray(res?.data?.reportData) ? res.data.reportData : (res?.data || []);
                    const sheetRows = rows.map((r, idx) => ({
                      'S. No.': idx + 1,
                      'EMPLOYEE CODE': r.EMPLOYEE_CODE || '',
                      'UAN': r.UAN_NUMBER || '',
                      'Name of the Employee': `${r.EMPLOYEE_FIRST_NAME ?? ''} ${r.EMPLOYEE_LAST_NAME ?? ''}`.trim(),
                      'GROSS WAGES': r.GROSS_SALARY ?? 0,
                      'EPF WAGES': r.EPF_WAGES ?? r.PF_WAGE_BASE ?? 0,
                      'EPS WAGES': r.EPS_WAGES ?? Math.min(r.EPF_WAGES ?? r.PF_WAGE_BASE ?? 0, 15000),
                      'EDLI': r.EDLI_WAGES ?? Math.min(r.GROSS_SALARY ?? 0, 15000),
                      'EE SHARE 12%': r.PF_EE ?? 0,
                      'EPS CONTRIBUTION SHARE 8.33%': r.EPS_ER ?? 0,
                      'ER SHARE 3.67%': r.EPF_ER ?? 0,
                      'NCP DAYS': r.NCP_DAYS ?? 0,
                      'REFUND ADVANCE': r.PF_REFUND_ADV ?? 0
                    }));
                    const XLSX = await import('xlsx');
                    const wb = XLSX.utils.book_new();
                    const ws = XLSX.utils.json_to_sheet(sheetRows);
                    XLSX.utils.book_append_sheet(wb, ws, 'PF Statement');
                    XLSX.writeFile(wb, `pf_statement_period_${id}.xlsx`);
                  } catch (e) {
                    console.error('PF report export failed:', e);
                  }
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                PF Report (Excel)
              </button>

              <button
                onClick={async () => {
                  try {
                    const res = await payrollAPI.generateMonthEndReport(id, 'ESI');
                    const rows = Array.isArray(res?.data?.reportData) ? res.data.reportData : (res?.data || []);
                    const sheetRows = rows.map((r, idx) => ({
                      'S. NO.': idx + 1,
                      'EMPLOYEE ID': r.EMPLOYEE_CODE || '',
                      'NAME': `${r.EMPLOYEE_FIRST_NAME ?? ''} ${r.EMPLOYEE_LAST_NAME ?? ''}`.trim(),
                      'NO OF DAYS': r.WORK_DAYS ?? '',
                      'ESI NO.': r.ESI_NUMBER || '',
                      'ESI WAGES': r.ESI_WAGES ?? r.ESI_WAGE_BASE ?? 0,
                      'EE CONT.': r.ESI_EE ?? 0,
                      'ER CONT.': r.ESI_ER ?? 0,
                      'TOTAL': (r.ESI_EE ?? 0) + (r.ESI_ER ?? 0)
                    }));
                    const XLSX = await import('xlsx');
                    const wb = XLSX.utils.book_new();
                    const ws = XLSX.utils.json_to_sheet(sheetRows);
                    XLSX.utils.book_append_sheet(wb, ws, 'ESI Statement');
                    XLSX.writeFile(wb, `esi_statement_period_${id}.xlsx`);
                  } catch (e) {
                    console.error('ESI report export failed:', e);
                  }
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                ESI Report (Excel)
              </button>

              <button
                onClick={async () => {
                  try {
                    const res = await payrollAPI.generateMonthEndReport(id, 'BANK');
                    const rows = Array.isArray(res?.data?.reportData) ? res.data.reportData : (res?.data || []);
                    const sheetRows = rows.map((r) => ({
                      'Code No.': r.EMPLOYEE_CODE || '',
                      'Name of the Employee': `${r.EMPLOYEE_FIRST_NAME ?? ''} ${r.EMPLOYEE_LAST_NAME ?? ''}`.trim(),
                      'IFSC': r.IFSC_CODE || '',
                      'BANK ACCOUNT NO.': r.ACCOUNT_NUMBER || '',
                      'Payable': r.NET_SALARY ?? r.SALARY_PAYABLE ?? 0
                    }));
                    const XLSX = await import('xlsx');
                    const wb = XLSX.utils.book_new();
                    const ws = XLSX.utils.json_to_sheet(sheetRows);
                    XLSX.utils.book_append_sheet(wb, ws, 'Bank Transfer');
                    XLSX.writeFile(wb, `bank_transfer_period_${id}.xlsx`);
                  } catch (e) {
                    console.error('Bank report export failed:', e);
                  }
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Bank Transfer (Excel)
              </button>
            </div>
          </div>

          {filteredPayrollDetails.length === 0 ? (
            <div className="text-center py-8">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No payroll details found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {payrollDetails.length === 0 
                  ? "No payroll has been processed for this period yet. Process the payroll first to see employee details."
                  : "No employees match the current filters."
                }
              </p>
              {payrollDetails.length === 0 && period?.STATUS === 'DRAFT' && (
                <div className="mt-6">
                  <button
                    onClick={() => navigate(`/payroll/periods/${id}`)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Process Payroll
                  </button>
                </div>
              )}
              {payrollDetails.length === 0 && period?.STATUS !== 'DRAFT' && (
                <div className="mt-6">
                  {period?.STATUS === 'COMPLETED' ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <ExclamationTriangleIcon className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">
                            Payroll Period Completed
                          </h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <p>
                              This payroll period has been completed. Individual employee payroll details are not available for completed periods.
                            </p>
                            <p className="mt-2">
                              You can view the overall period summary and statistics from the main payroll dashboard.
                            </p>
                          </div>
                          <div className="mt-4">
                            <Link
                              to={`/payroll/periods/${id}`}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              View Period Summary
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      The payroll period is in <span className="font-medium">{period?.STATUS}</span> status. 
                      {period?.STATUS === 'PROCESSING' && ' Payroll is currently being processed.'}
                      {period?.STATUS === 'APPROVED' && ' Payroll has been approved.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Basic Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gross Pay
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deductions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Pay
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayrollDetails.map((detail) => (
                    <tr key={detail.PAYROLL_ID} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {detail.EMPLOYEE_NAME}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {detail.EMPLOYEE_ID}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {detail.DEPARTMENT || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(detail.BASIC_SALARY)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(detail.GROSS_PAY)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(detail.TOTAL_DEDUCTIONS)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(detail.NET_PAY)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(detail.STATUS)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(detail.STATUS)}`}>
                            {detail.STATUS}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {detail.PAYROLL_ID && detail.PAYROLL_ID > 0 ? (
                          <Link
                            to={`/payroll/details/${detail.PAYROLL_ID}`}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="View detailed breakdown"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                        ) : (
                          <span className="text-gray-400 cursor-not-allowed" title="No detailed view available for this payroll record">
                            <EyeIcon className="h-4 w-4" />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayrollPeriodDetails; 
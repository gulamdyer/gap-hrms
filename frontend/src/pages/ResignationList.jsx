import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { resignationAPI, employeeAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const ResignationList = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [resignations, setResignations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [printingId, setPrintingId] = useState(null);

  const resignationReasons = [
    { value: 'BETTER_OPPORTUNITY', label: 'Better Opportunity' },
    { value: 'CAREER_GROWTH', label: 'Career Growth' },
    { value: 'HIGHER_STUDIES', label: 'Higher Studies' },
    { value: 'PERSONAL_REASONS', label: 'Personal Reasons' },
    { value: 'FAMILY_REASONS', label: 'Family Reasons' },
    { value: 'HEALTH_ISSUES', label: 'Health Issues' },
    { value: 'RELOCATION', label: 'Relocation' },
    { value: 'WORK_LIFE_BALANCE', label: 'Work-Life Balance' },
    { value: 'COMPENSATION', label: 'Compensation Issues' },
    { value: 'WORK_ENVIRONMENT', label: 'Work Environment' },
    { value: 'RETIREMENT', label: 'Retirement' },
    { value: 'PERFORMANCE_ISSUES', label: 'Performance Issues' },
    { value: 'POLICY_VIOLATION', label: 'Policy Violation' },
    { value: 'MISCONDUCT', label: 'Misconduct' },
    { value: 'RESTRUCTURING', label: 'Company Restructuring' },
    { value: 'BUSINESS_CLOSURE', label: 'Business Closure' },
    { value: 'OTHER', label: 'Other' }
  ];

  const resignationTypes = [
    { value: 'RESIGNATION', label: 'Resignation' },
    { value: 'TERMINATION', label: 'Termination' }
  ];

  const resignationStatuses = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'WITHDRAWN', label: 'Withdrawn' }
  ];

  const formatReason = (reasonValue) => {
    const reason = resignationReasons.find(r => r.value === reasonValue);
    return reason ? reason.label : reasonValue || '-';
  };

  // Fetch employees only once on auth changes (avoid repeated dropdown calls)
  useEffect(() => {
    if (isAuthenticated) {
      fetchEmployees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Backoff/Retry flags
  const resignationsRetriedRef = useRef(false);
  const employeesRetriedRef = useRef(false);

  // Fetch resignations whenever filters/pagination change
  useEffect(() => {
    if (isAuthenticated) {
      fetchResignations();
    }
  }, [isAuthenticated, pagination.currentPage, pagination.itemsPerPage, searchTerm, statusFilter, typeFilter, employeeFilter]);

  const fetchResignations = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        employeeId: employeeFilter || undefined
      };
      const response = await resignationAPI.getAll(params);
      if (response.success) {
        setResignations(response.data || []);
        resignationsRetriedRef.current = false;
        if (response.pagination) {
          setPagination(prev => ({ ...prev, ...response.pagination }));
        }
      } else {
        throw new Error(response.message || 'Failed to fetch resignations');
      }
    } catch (error) {
      if (error?.response?.status === 429) {
        if (!resignationsRetriedRef.current) {
          resignationsRetriedRef.current = true;
          toast.error('Rate limited while loading resignations. Retrying in 5 seconds...');
          setTimeout(() => {
            fetchResignations();
          }, 5000);
        } else {
          toast.error('Rate limited. Please try again in a moment.');
        }
      } else {
        setError(error.message || 'Failed to load resignations');
        setResignations([]);
      }
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, typeFilter, employeeFilter, pagination.currentPage, pagination.itemsPerPage]);

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getDropdown();
      setEmployees(response.data);
      employeesRetriedRef.current = false;
    } catch (error) {
      if (error?.response?.status === 429) {
        if (!employeesRetriedRef.current) {
          employeesRetriedRef.current = true;
          toast.error('Rate limited while loading employees. Retrying in 5 seconds...');
          setTimeout(() => {
            fetchEmployees();
          }, 5000);
        }
      } else {
        console.error('Error fetching employees:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const handleDelete = (resignationId, employeeName) => {
    setDeleteItem({ id: resignationId, employeeName });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;
    try {
      const response = await resignationAPI.delete(deleteItem.id);
      if (response.success) {
        toast.success('Resignation deleted successfully');
        fetchResignations();
      } else {
        throw new Error(response.message || 'Failed to delete resignation');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete resignation');
    } finally {
      setShowDeleteModal(false);
      setDeleteItem(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteItem(null);
  };

  const handlePrint = async (resignation) => {
    setPrintingId(resignation.RESIGNATION_ID);
    try {
      // Create a temporary div for the print content
      const printContent = document.createElement('div');
      printContent.innerHTML = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 15px; max-width: 595px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh;">
          <!-- Header with Gradient Background -->
          <div style="text-align: center; padding: 20px 15px; background: rgba(255,255,255,0.1); border-radius: 10px; margin-bottom: 20px; backdrop-filter: blur(10px);">
            <div style="background: white; width: 50px; height: 50px; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
              <div style="font-size: 20px; color: #667eea; font-weight: bold;">📋</div>
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">GAP HRMS</h1>
            <h2 style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px; font-weight: 300;">Resignation Certificate</h2>
            <div style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 15px; display: inline-block; margin-top: 8px;">
              <p style="color: white; margin: 0; font-size: 11px; font-weight: 500;">Generated on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}</p>
            </div>
          </div>

          <!-- Employee Information Card -->
          <div style="background: rgba(255,255,255,0.95); border-radius: 10px; padding: 15px; margin-bottom: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <div style="background: linear-gradient(135deg, #667eea, #764ba2); width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
                <div style="font-size: 14px; color: white;">👤</div>
              </div>
              <h3 style="color: #1f2937; margin: 0; font-size: 16px; font-weight: 600;">Employee Information</h3>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div style="background: #f8fafc; padding: 10px; border-radius: 6px; border-left: 3px solid #667eea;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Employee Name</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${resignation.FIRST_NAME} ${resignation.LAST_NAME}</div>
              </div>
              <div style="background: #f8fafc; padding: 10px; border-radius: 6px; border-left: 3px solid #667eea;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Employee Code</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${resignation.EMPLOYEE_CODE}</div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px; backdrop-filter: blur(10px);">
            <div style="background: white; width: 40px; height: 40px; border-radius: 50%; margin: 0 auto 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
              <div style="font-size: 16px;">🔒</div>
            </div>
            <p style="color: rgba(255,255,255,0.8); font-size: 11px; margin: 0; font-weight: 500;">This is an official computer-generated document from GAP HRMS</p>
            <p style="color: rgba(255,255,255,0.6); font-size: 9px; margin: 3px 0 0 0;">Document ID: RES-${resignation.RESIGNATION_ID}-${new Date().getTime()}</p>
          </div>
        </div>
      `;

      // Add to DOM temporarily
      document.body.appendChild(printContent);

      // Generate PDF
      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download PDF
      pdf.save(`resignation-${resignation.RESIGNATION_ID}-${resignation.FIRST_NAME}-${resignation.LAST_NAME}.pdf`);

      // Clean up
      document.body.removeChild(printContent);
      toast.success('PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setPrintingId(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
    setEmployeeFilter('');
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Authentication Required</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please log in to access resignations.
        </p>
        <div className="mt-6">
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resignations / Terminations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage employee resignation and termination requests
          </p>
        </div>
        <Link
          to="/resignations/new"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Request
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by employee or reason..."
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Types</option>
                {resignationTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Employee Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee
              </label>
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Employees</option>
                {employees.map(employee => (
                  <option key={employee.EMPLOYEE_ID} value={employee.EMPLOYEE_ID}>
                    {employee.EMPLOYEE_CODE} - {employee.FIRST_NAME} {employee.LAST_NAME}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Statuses</option>
                {resignationStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Clear Filters */}
        {(searchTerm || statusFilter || typeFilter || employeeFilter) && (
          <div className="mt-4">
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Resignations List */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notice Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Working
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {resignations.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No resignations found</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          {searchTerm || statusFilter || typeFilter || employeeFilter
                            ? 'Try adjusting your filters'
                            : 'Get started by creating a new resignation request'}
                        </p>
                        {!searchTerm && !statusFilter && !typeFilter && !employeeFilter && (
                          <Link
                            to="/resignations/new"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Create Resignation
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  resignations.map((r) => (
                    <tr key={r.RESIGNATION_ID} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{r.FIRST_NAME} {r.LAST_NAME}</div>
                          <div className="text-sm text-gray-500">{r.EMPLOYEE_CODE} • {r.DESIGNATION}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{r.TYPE}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(r.NOTICE_DATE)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(r.LAST_WORKING_DATE)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          r.STATUS === 'PENDING' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : r.STATUS === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : r.STATUS === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {r.STATUS}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatReason(r.REASON)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/resignations/${r.RESIGNATION_ID}`}
                            className="text-primary-600 hover:text-primary-900"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handlePrint(r)}
                            disabled={printingId === r.RESIGNATION_ID}
                            className={`${printingId === r.RESIGNATION_ID ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:text-green-900'}`}
                            title={printingId === r.RESIGNATION_ID ? 'Generating PDF...' : 'Print PDF'}
                          >
                            {printingId === r.RESIGNATION_ID ? (
                              <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                            ) : (
                              <PrinterIcon className="h-4 w-4" />
                            )}
                          </button>
                          {(user?.role === 'ADMIN' || user?.role === 'HR') && (
                            <>
                              <Link
                                to={`/resignations/${r.RESIGNATION_ID}/edit`}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Link>
                              {user?.role === 'ADMIN' && (
                                <button
                                  onClick={() => handleDelete(r.RESIGNATION_ID, `${r.FIRST_NAME} ${r.LAST_NAME}`)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}
                    </span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{pagination.totalItems}</span>
                    {' '}results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.currentPage
                            ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Delete Resignation
              </h3>
              
              {/* Message */}
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 text-center">
                  Are you sure you want to delete the resignation for{' '}
                  <span className="font-semibold text-gray-900">{deleteItem?.employeeName}</span>?
                </p>
                <p className="text-xs text-gray-400 text-center mt-2">
                  This action cannot be undone.
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 mt-4">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResignationList; 
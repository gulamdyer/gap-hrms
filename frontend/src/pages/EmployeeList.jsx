import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { employeeAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { AvatarDisplay } from '../utils/avatar';

const EmployeeList = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchEmployees();
    }
  }, [currentPage, debouncedSearchTerm, statusFilter, isAuthenticated]);

  const fetchEmployees = async () => {
    try {
      // Use searchLoading for search operations, regular loading for initial load
      if (debouncedSearchTerm || statusFilter) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }
      
      console.log('Fetching employees...');
      console.log('Current user:', user);
      console.log('Is authenticated:', isAuthenticated);
      
      const params = {
        page: currentPage,
        limit: 10,
        search: debouncedSearchTerm || undefined,
        status: statusFilter || undefined
      };
      
      console.log('API params:', params);
      
      const response = await employeeAPI.getAll(params);
      console.log('API response:', response);
      
      setEmployees(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching employees:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error('Failed to fetch employees: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  // In-app delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ id: null, name: '' });

  const openDelete = (employeeId, employeeName) => {
    setDeleteTarget({ id: employeeId, name: employeeName });
    setShowDeleteModal(true);
  };

  const closeDelete = () => {
    setShowDeleteModal(false);
    setDeleteTarget({ id: null, name: '' });
  };

  const confirmDelete = async () => {
    if (!deleteTarget.id) return;
    try {
      await employeeAPI.delete(deleteTarget.id);
      toast.success('Employee deleted successfully');
      closeDelete();
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      const status = error.response?.status;
      const apiMessage = error.response?.data?.message;
      const code = error.response?.data?.code;
      if (status === 409 && code === 'FK_CONSTRAINT') {
        toast.error(apiMessage || 'Cannot delete employee: related records exist (payroll, attendance, loans, advances, resignations).');
      } else if (status === 423 && code === 'LOCKED') {
        toast.error(apiMessage || 'Employee record is currently in use. Please try again shortly.');
      } else if (status === 404) {
        toast.error('Employee not found');
      } else {
        toast.error(apiMessage || 'Failed to delete employee');
      }
      closeDelete();
    }
  };

  const handleStatusChange = async (employeeId, newStatus) => {
    try {
      await employeeAPI.updateStatus(employeeId, newStatus);
      toast.success('Employee status updated successfully');
      fetchEmployees();
    } catch (error) {
      console.error('Error updating employee status:', error);
      toast.error('Failed to update employee status');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'ACTIVE': { color: 'bg-green-100 text-green-800', label: 'Active' },
      'INACTIVE': { color: 'bg-gray-100 text-gray-800', label: 'Inactive' },
      'TERMINATED': { color: 'bg-red-100 text-red-800', label: 'Terminated' },
      'ONBOARDING': { color: 'bg-blue-100 text-blue-800', label: 'Onboarding' }
    };

    const config = statusConfig[status] || statusConfig['INACTIVE'];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getDepartmentBadge = (department) => {
    if (!department) return null;
    
    const departmentConfig = {
      'IT': { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'IT' },
      'HR': { color: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Human Resources' },
      'FINANCE': { color: 'bg-green-50 text-green-700 border-green-200', label: 'Finance' },
      'MARKETING': { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Marketing' },
      'SALES': { color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Sales' },
      'OPERATIONS': { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Operations' }
    };

    const config = departmentConfig[department.toUpperCase()] || { 
      color: 'bg-gray-50 text-gray-700 border-gray-200', 
      label: department 
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Authentication Required</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please log in to access employee management.
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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage employee information and onboarding
          </p>
          {user && (
            <p className="mt-1 text-xs text-gray-400">
              Logged in as: {user.firstName} {user.lastName} ({user.role})
            </p>
          )}
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link
            to="/employees/onboarding"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <UserPlusIcon className="h-4 w-4 mr-2" />
            New Onboarding
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              {searchLoading && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                </div>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="TERMINATED">Terminated</option>
              <option value="ONBOARDING">Onboarding</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Results Count */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {searchLoading ? 'Searching...' : `${employees.length} employee${employees.length !== 1 ? 's' : ''} found`}
              {debouncedSearchTerm && !searchLoading && (
                <span className="ml-2 text-gray-500">
                  for "{debouncedSearchTerm}"
                </span>
              )}
            </p>
            {searchLoading && (
              <div className="flex items-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                Searching...
              </div>
            )}
          </div>
        </div>
        
        {employees.length === 0 ? (
          <div className="text-center py-12">
            <UserPlusIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No employees found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new employee.
            </p>
            <div className="mt-6">
              <Link
                to="/employees/onboarding"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <UserPlusIcon className="h-4 w-4 mr-2" />
                New Onboarding
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              {/* Table Header */}
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joining Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              
              {/* Table Body */}
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => (
                  <tr key={employee.EMPLOYEE_ID} className="hover:bg-gray-50">
                    {/* Employee Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <AvatarDisplay
                            avatarUrl={employee.AVATAR_URL}
                            name={`${employee.FIRST_NAME} ${employee.LAST_NAME}`}
                            size="md"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.FIRST_NAME} {employee.LAST_NAME}
                          </div>
                          <div className="text-sm text-gray-500">
                            {employee.DESIGNATION || 'No designation'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {employee.EMPLOYEE_CODE}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getDepartmentBadge(employee.DEPARTMENT || employee.ROLE)}
                    </td>

                    {/* Status Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(employee.STATUS)}
                    </td>

                    {/* Joining Date Column */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(employee.DATE_OF_JOINING)}
                    </td>

                    {/* Contact Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 space-y-1">
                        {employee.EMAIL && (
                          <div className="flex items-center">
                            <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm">{employee.EMAIL}</span>
                          </div>
                        )}
                        {employee.MOBILE && (
                          <div className="flex items-center">
                            <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm">{employee.MOBILE}</span>
                          </div>
                        )}
                        {!employee.EMAIL && !employee.MOBILE && (
                          <span className="text-sm text-gray-400">No contact info</span>
                        )}
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <Link
                          to={`/employees/${employee.EMPLOYEE_ID}`}
                          className="text-gray-600 hover:text-gray-900 transition-colors"
                          title="View"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        <Link
                          to={`/employees/${employee.EMPLOYEE_ID}/edit`}
                          className="text-gray-600 hover:text-gray-900 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => openDelete(employee.EMPLOYEE_ID, `${employee.FIRST_NAME} ${employee.LAST_NAME}`)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center mb-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-100 mr-3">
                <TrashIcon className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Employee</h3>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              Are you sure you want to delete <span className="font-semibold">{deleteTarget.name}</span>? This action cannot be undone.
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Note: If there are related records (payroll, attendance, loans, advances, resignations), deletion will be blocked. You’ll see a clear message if that happens.
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={closeDelete} className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
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
  );
};

export default EmployeeList; 
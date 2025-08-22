import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { timesheetAPI, employeeAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const TimesheetList = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [timesheets, setTimesheets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [printingId, setPrintingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  const timesheetStatuses = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' }
  ];

  const activityTypes = [
    { value: 'DEVELOPMENT', label: 'Development' },
    { value: 'TESTING', label: 'Testing' },
    { value: 'MEETING', label: 'Meeting' },
    { value: 'DOCUMENTATION', label: 'Documentation' },
    { value: 'TRAINING', label: 'Training' },
    { value: 'SUPPORT', label: 'Support' },
    { value: 'RESEARCH', label: 'Research' },
    { value: 'OTHER', label: 'Other' }
  ];

  useEffect(() => {
    if (isAuthenticated) {
      fetchTimesheets();
      fetchEmployees();
    }
  }, [isAuthenticated, pagination.currentPage, searchTerm, employeeFilter, statusFilter, dateFilter]);

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        employeeId: employeeFilter || undefined,
        status: statusFilter || undefined,
        startDate: dateFilter || undefined
      };

      const response = await timesheetAPI.getAll(params);
      setTimesheets(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      toast.error('Failed to fetch timesheets');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getDropdown();
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleDelete = async (id, employeeName, timesheetDate) => {
    setDeleteItem({ id, employeeName, timesheetDate });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await timesheetAPI.delete(deleteItem.id);
      toast.success('Timesheet deleted successfully');
      fetchTimesheets();
    } catch (error) {
      console.error('Error deleting timesheet:', error);
      toast.error('Failed to delete timesheet');
    } finally {
      setShowDeleteModal(false);
      setDeleteItem(null);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const statusData = { status };
      if (status === 'APPROVED' || status === 'REJECTED') {
        statusData.approvedBy = user.userId;
      }
      await timesheetAPI.updateStatus(id, statusData);
      toast.success(`Timesheet ${status.toLowerCase()} successfully`);
      fetchTimesheets();
    } catch (error) {
      console.error('Error updating timesheet status:', error);
      toast.error('Failed to update timesheet status');
    }
  };

  const handlePrint = async (timesheet) => {
    try {
      setPrintingId(timesheet.TIMESHEET_ID);
      toast.loading('Generating PDF...');

      // Create a printable content
      const printContent = document.createElement('div');
      printContent.style.cssText = `
        width: 800px; 
        padding: 30px; 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #1f2937;
        line-height: 1.6;
      `;

      printContent.innerHTML = `
        <div style="background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 25px; color: white; text-align: center;">
            <div style="background: rgba(255,255,255,0.2); width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
              <div style="font-size: 24px;">⏰</div>
            </div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Timesheet Details</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">GAP HRMS Employee Time Tracking</p>
          </div>

          <!-- Employee Info -->
          <div style="background: rgba(255,255,255,0.95); border-radius: 10px; padding: 20px; margin: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <div style="background: linear-gradient(135deg, #667eea, #764ba2); width: 35px; height: 35px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                <div style="font-size: 16px; color: white;">👤</div>
              </div>
              <h2 style="color: #1f2937; margin: 0; font-size: 18px; font-weight: 600;">Employee Information</h2>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border-left: 4px solid #667eea;">
                <div style="color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Employee Name</div>
                <div style="color: #1f2937; font-size: 15px; font-weight: 600;">${timesheet.EMPLOYEE_NAME}</div>
              </div>
              <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border-left: 4px solid #667eea;">
                <div style="color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Employee Code</div>
                <div style="color: #1f2937; font-size: 15px; font-weight: 600;">${timesheet.EMPLOYEE_CODE}</div>
              </div>
            </div>
          </div>

          <!-- Timesheet Details -->
          <div style="background: rgba(255,255,255,0.95); border-radius: 10px; padding: 20px; margin: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <div style="background: linear-gradient(135deg, #10b981, #059669); width: 35px; height: 35px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                <div style="font-size: 16px; color: white;">⏰</div>
              </div>
              <h3 style="color: #1f2937; margin: 0; font-size: 18px; font-weight: 600;">Timesheet Details</h3>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
              <div style="background: #ecfdf5; padding: 12px; border-radius: 8px; border-left: 4px solid #10b981;">
                <div style="color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Date</div>
                <div style="color: #1f2937; font-size: 15px; font-weight: 600;">${formatDate(timesheet.TIMESHEET_DATE)}</div>
              </div>
              <div style="background: #ecfdf5; padding: 12px; border-radius: 8px; border-left: 4px solid #10b981;">
                <div style="color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Total Hours</div>
                <div style="color: #1f2937; font-size: 15px; font-weight: 600;">${timesheet.TOTAL_HOURS || 0}h</div>
              </div>
              <div style="background: #ecfdf5; padding: 12px; border-radius: 8px; border-left: 4px solid #10b981;">
                <div style="color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Status</div>
                <div style="color: #1f2937; font-size: 15px; font-weight: 600;">${timesheet.STATUS}</div>
              </div>
            </div>
          </div>

          <!-- Week Range -->
          <div style="background: rgba(255,255,255,0.95); border-radius: 10px; padding: 15px; margin: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
                <div style="font-size: 14px; color: white;">📅</div>
              </div>
              <h3 style="color: #1f2937; margin: 0; font-size: 16px; font-weight: 600;">Week Period</h3>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div style="background: #faf5ff; padding: 10px; border-radius: 6px; border-left: 3px solid #8b5cf6;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Week Start</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${formatDate(timesheet.WEEK_START_DATE)}</div>
              </div>
              <div style="background: #faf5ff; padding: 10px; border-radius: 6px; border-left: 3px solid #8b5cf6;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Week End</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${formatDate(timesheet.WEEK_END_DATE)}</div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px; backdrop-filter: blur(10px);">
            <div style="background: white; width: 40px; height: 40px; border-radius: 50%; margin: 0 auto 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
              <div style="font-size: 16px;">🔒</div>
            </div>
            <p style="color: rgba(255,255,255,0.8); font-size: 11px; margin: 0; font-weight: 500;">This is an official computer-generated document from GAP HRMS</p>
            <p style="color: rgba(255,255,255,0.6); font-size: 9px; margin: 3px 0 0 0;">Document ID: TIMESHEET-${timesheet.TIMESHEET_ID}-${new Date().getTime()}</p>
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
      pdf.save(`timesheet-${timesheet.TIMESHEET_ID}-${timesheet.EMPLOYEE_NAME}-${formatDate(timesheet.TIMESHEET_DATE)}.pdf`);

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

  // Convert any date format to DD-MM-YYYY for display
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return convertToDDMMYYYY(dateString);
  };

  const formatHours = (hours) => {
    return hours ? `${hours}h` : '0h';
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setEmployeeFilter('');
    setStatusFilter('');
    setDateFilter('');
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Authentication Required</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please log in to access timesheets.
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
          <h1 className="text-2xl font-bold text-gray-900">Timesheets</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track time and manage timesheet entries
          </p>
        </div>
        <Link
          to="/timesheets/new"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Timesheet
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
                  placeholder="Search by employee name..."
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
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
                {timesheetStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date From
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        )}

        {/* Clear Filters */}
        {(searchTerm || employeeFilter || statusFilter || dateFilter) && (
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

      {/* Timesheets List */}
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
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Week Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entries
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
                {timesheets.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No timesheets found</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          {searchTerm || employeeFilter || statusFilter || dateFilter
                            ? 'Try adjusting your filters'
                            : 'Get started by creating a new timesheet'}
                        </p>
                        {!searchTerm && !employeeFilter && !statusFilter && !dateFilter && (
                          <Link
                            to="/timesheets/new"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            New Timesheet
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  timesheets.map((timesheet) => (
                    <tr key={timesheet.TIMESHEET_ID} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-600 font-medium text-sm">
                                {timesheet.EMPLOYEE_NAME?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {timesheet.EMPLOYEE_NAME}
                            </div>
                            <div className="text-sm text-gray-500">
                              {timesheet.EMPLOYEE_CODE}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(timesheet.TIMESHEET_DATE)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="text-xs text-gray-500">
                          {formatDate(timesheet.WEEK_START_DATE)} - {formatDate(timesheet.WEEK_END_DATE)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                          {formatHours(timesheet.TOTAL_HOURS)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {timesheet.ENTRY_COUNT || 0} entries
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(timesheet.STATUS)}`}>
                          {timesheet.STATUS}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/timesheets/${timesheet.TIMESHEET_ID}`}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>

                          {timesheet.STATUS === 'DRAFT' && (
                            <Link
                              to={`/timesheets/${timesheet.TIMESHEET_ID}/edit`}
                              className="text-yellow-600 hover:text-yellow-900 p-1 rounded-md hover:bg-yellow-50"
                              title="Edit Timesheet"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Link>
                          )}

                          {timesheet.STATUS === 'SUBMITTED' && (user.role === 'ADMIN' || user.role === 'HR') && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(timesheet.TIMESHEET_ID, 'APPROVED')}
                                className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-50"
                                title="Approve Timesheet"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(timesheet.TIMESHEET_ID, 'REJECTED')}
                                className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                                title="Reject Timesheet"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handlePrint(timesheet)}
                            disabled={printingId === timesheet.TIMESHEET_ID}
                            className="text-purple-600 hover:text-purple-900 p-1 rounded-md hover:bg-purple-50 disabled:opacity-50"
                            title="Print Timesheet"
                          >
                            {printingId === timesheet.TIMESHEET_ID ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                            ) : (
                              <PrinterIcon className="h-4 w-4" />
                            )}
                          </button>

                          {timesheet.STATUS === 'DRAFT' && (
                            <button
                              onClick={() => handleDelete(timesheet.TIMESHEET_ID, timesheet.EMPLOYEE_NAME, timesheet.TIMESHEET_DATE)}
                              className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                              title="Delete Timesheet"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
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
                      {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{pagination.totalItems}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {[...Array(pagination.totalPages)].map((_, index) => {
                      const page = index + 1;
                      return (
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
                      );
                    })}
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
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-5">Delete Timesheet</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete the timesheet for{' '}
                  <span className="font-medium">{deleteItem?.employeeName}</span> on{' '}
                  <span className="font-medium">{formatDate(deleteItem?.timesheetDate)}</span>?
                  This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimesheetList; 
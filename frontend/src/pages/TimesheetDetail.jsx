import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  UserIcon,
  ClockIcon,
  CalendarIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  PrinterIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { timesheetAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const TimesheetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [timesheet, setTimesheet] = useState(null);
  const [entries, setEntries] = useState([]);
  const [printingTimesheet, setPrintingTimesheet] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const activityTypeLabels = {
    'DEVELOPMENT': 'Development',
    'TESTING': 'Testing',
    'MEETING': 'Meeting',
    'DOCUMENTATION': 'Documentation',
    'TRAINING': 'Training',
    'SUPPORT': 'Support',
    'RESEARCH': 'Research',
    'OTHER': 'Other'
  };

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchTimesheet();
    }
  }, [id, isAuthenticated]);

  const fetchTimesheet = async () => {
    try {
      setLoading(true);
      const [timesheetResponse, entriesResponse] = await Promise.all([
        timesheetAPI.getById(id),
        timesheetAPI.getEntries(id)
      ]);
      
      setTimesheet(timesheetResponse.data);
      setEntries(entriesResponse.data || []);
    } catch (error) {
      console.error('Error fetching timesheet:', error);
      toast.error('Failed to fetch timesheet details');
      navigate('/timesheets');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      const statusData = { status };
      if (status === 'APPROVED' || status === 'REJECTED') {
        statusData.approvedBy = user.userId;
      }
      await timesheetAPI.updateStatus(id, statusData);
      toast.success(`Timesheet ${status.toLowerCase()} successfully`);
      fetchTimesheet();
    } catch (error) {
      console.error('Error updating timesheet status:', error);
      toast.error('Failed to update timesheet status');
    }
  };

  const handleDelete = async () => {
    try {
      await timesheetAPI.delete(id);
      toast.success('Timesheet deleted successfully');
      navigate('/timesheets');
    } catch (error) {
      console.error('Error deleting timesheet:', error);
      toast.error('Failed to delete timesheet');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handlePrint = async () => {
    try {
      setPrintingTimesheet(true);
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

          <!-- Timesheet Summary -->
          <div style="background: rgba(255,255,255,0.95); border-radius: 10px; padding: 20px; margin: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Timesheet Summary</h3>
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

          <!-- Time Entries -->
          <div style="background: rgba(255,255,255,0.95); border-radius: 10px; padding: 20px; margin: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Time Entries (${entries.length})</h3>
            ${entries.map((entry, index) => `
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #667eea;">
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 15px; margin-bottom: 10px;">
                  <div>
                    <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Task Description</div>
                    <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${entry.TASK_DESCRIPTION || '-'}</div>
                  </div>
                  <div>
                    <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Hours</div>
                    <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${entry.TOTAL_HOURS || 0}h</div>
                  </div>
                  <div>
                    <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Activity</div>
                    <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${activityTypeLabels[entry.ACTIVITY_TYPE] || entry.ACTIVITY_TYPE}</div>
                  </div>
                </div>
                ${entry.PROJECT_NAME ? `
                  <div style="color: #6b7280; font-size: 11px;">Project: ${entry.PROJECT_NAME}</div>
                ` : ''}
              </div>
            `).join('')}
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
      setPrintingTimesheet(false);
    }
  };

  // Convert any date format to DD-MM-YYYY for display
  const convertToDDMMYYYY = (dateString) => {
    if (!dateString || dateString === '') return '';
    
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      return dateString;
    }
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return `${day}-${month}-${year}`;
    }
    
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

  const canEdit = () => {
    return timesheet && timesheet.STATUS === 'DRAFT';
  };

  const canApprove = () => {
    return timesheet && timesheet.STATUS === 'SUBMITTED' && (user.role === 'ADMIN' || user.role === 'HR');
  };

  const canDelete = () => {
    return timesheet && timesheet.STATUS === 'DRAFT';
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Authentication Required</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please log in to access timesheet details.
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

  if (!timesheet) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Timesheet Not Found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The timesheet you're looking for doesn't exist or has been removed.
        </p>
        <div className="mt-6">
          <Link
            to="/timesheets"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Back to Timesheets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/timesheets"
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Timesheets
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Timesheet Details</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage timesheet information
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {canEdit() && (
            <Link
              to={`/timesheets/${id}/edit`}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </Link>
          )}

          <button
            onClick={handlePrint}
            disabled={printingTimesheet}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {printingTimesheet ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
            ) : (
              <PrinterIcon className="h-4 w-4 mr-2" />
            )}
            Print
          </button>

          {canApprove() && (
            <>
              <button
                onClick={() => handleStatusUpdate('APPROVED')}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                Approve
              </button>
              <button
                onClick={() => handleStatusUpdate('REJECTED')}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Reject
              </button>
            </>
          )}

          {canDelete() && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Timesheet Information */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Timesheet Information
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Employee timesheet details and entries
              </p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(timesheet.STATUS)}`}>
              {timesheet.STATUS}
            </span>
          </div>
        </div>

        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <UserIcon className="h-4 w-4 mr-2" />
                Employee
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                <div className="font-medium">{timesheet.EMPLOYEE_NAME}</div>
                <div className="text-gray-500">{timesheet.EMPLOYEE_CODE}</div>
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Timesheet Date
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(timesheet.TIMESHEET_DATE)}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <ClockIcon className="h-4 w-4 mr-2" />
                Total Hours
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatHours(timesheet.TOTAL_HOURS)}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">
                Week Period
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(timesheet.WEEK_START_DATE)} - {formatDate(timesheet.WEEK_END_DATE)}
              </dd>
            </div>

            {timesheet.APPROVED_BY_NAME && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Approved By
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {timesheet.APPROVED_BY_NAME}
                </dd>
              </div>
            )}

            {timesheet.APPROVED_AT && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Approved At
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(timesheet.APPROVED_AT)}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Time Entries */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Time Entries ({entries.length})
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Individual time entries for this timesheet
          </p>
        </div>

        {entries.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No time entries</h3>
            <p className="mt-1 text-sm text-gray-500">No time entries have been added to this timesheet yet.</p>
          </div>
        ) : (
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              {entries.map((entry, index) => (
                <div key={entry.ENTRY_ID} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task Description
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {entry.TASK_DESCRIPTION || '-'}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {entry.PROJECT_NAME ? (
                          <div>
                            <div className="font-medium">{entry.PROJECT_NAME}</div>
                            <div className="text-gray-500 text-xs">{entry.PROJECT_CODE}</div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activity / Hours
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <div>{activityTypeLabels[entry.ACTIVITY_TYPE] || entry.ACTIVITY_TYPE}</div>
                        <div className="text-primary-600 font-medium">{formatHours(entry.TOTAL_HOURS)}</div>
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Billable
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          entry.IS_BILLABLE ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {entry.IS_BILLABLE ? 'Yes' : 'No'}
                        </span>
                      </dd>
                    </div>
                  </div>

                  {entry.COMMENTS && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Comments
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {entry.COMMENTS}
                      </dd>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
                  Are you sure you want to delete this timesheet for{' '}
                  <span className="font-medium">{timesheet.EMPLOYEE_NAME}</span> on{' '}
                  <span className="font-medium">{formatDate(timesheet.TIMESHEET_DATE)}</span>?
                  This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleDelete}
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

export default TimesheetDetail; 
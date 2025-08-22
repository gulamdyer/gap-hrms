import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { leaveResumptionAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const LeaveResumptionDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [resumption, setResumption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Date conversion function
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

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      return '';
    }
  };

  // Fetch resumption details
  const fetchResumption = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 Loading resumption details for ID:', id);
      
      const response = await leaveResumptionAPI.getById(id);
      console.log('📋 Resumption response:', response);

      if (response.success) {
        setResumption(response.data);
        console.log('✅ Resumption details loaded successfully');
      } else {
        throw new Error(response.message || 'Failed to fetch resumption details');
      }
    } catch (error) {
      console.error('❌ Error fetching resumption:', error);
      setError(error.message || 'Failed to load resumption details');
    } finally {
      setLoading(false);
    }
  };

  // Add delete handler (if delete is supported)
  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await leaveResumptionAPI.delete(id);
      if (response.success) {
        toast.success('Resumption deleted successfully');
        navigate('/leave-resumptions');
      } else {
        throw new Error(response.message || 'Failed to delete resumption');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete resumption');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  // Refactor status update to use toast notifications
  const handleStatusUpdate = async (status) => {
    const comments = status === 'REJECTED' 
      ? prompt('Please provide a reason for rejection:')
      : prompt('Any comments (optional):') || '';
    
    if (status === 'REJECTED' && !comments) {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      setUpdating(true);
      const response = await leaveResumptionAPI.updateStatus(id, {
        status,
        comments
      });
      if (response.success) {
        toast.success('Status updated successfully');
        fetchResumption(); // Refresh data
      } else {
        throw new Error(response.message || 'Failed to update status');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get resumption type badge color
  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'EARLY':
        return 'bg-blue-100 text-blue-800';
      case 'EXTENDED':
        return 'bg-orange-100 text-orange-800';
      case 'ON_TIME':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate days difference
  const calculateDaysDifference = (plannedDate, actualDate) => {
    if (!plannedDate || !actualDate) return 0;
    
    try {
      const planned = new Date(plannedDate);
      const actual = new Date(actualDate);
      const diffTime = actual - planned;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      return 0;
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (id) {
      fetchResumption();
    }
  }, [id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate('/leave-resumptions')}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  if (!resumption) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <p className="text-gray-600">Resumption not found</p>
          <button
            onClick={() => navigate('/leave-resumptions')}
            className="mt-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  const daysDiff = calculateDaysDifference(
    resumption.PLANNED_RESUMPTION_DATE,
    resumption.ACTUAL_RESUMPTION_DATE
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Leave Resumption Details
            </h1>
            {/* In the header, use icon buttons for actions */}
            <div className="flex space-x-3">
              {resumption.STATUS === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate('APPROVED')}
                    disabled={updating}
                    className="inline-flex items-center px-3 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    title="Approve"
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    {updating ? 'Updating...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('REJECTED')}
                    disabled={updating}
                    className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    title="Reject"
                  >
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    {updating ? 'Updating...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => navigate(`/leave-resumptions/${id}/edit`)}
                    className="inline-flex items-center px-3 py-2 border border-yellow-300 rounded-md shadow-sm text-sm font-medium text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                </>
              )}
              <button
                onClick={() => navigate('/leave-resumptions')}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Back to List
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Type */}
          <div className="flex space-x-4">
            <div>
              <span className="text-sm font-medium text-gray-500">Status:</span>
              <span className={`ml-2 inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeColor(resumption.STATUS)}`}>
                {resumption.STATUS}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Type:</span>
              <span className={`ml-2 inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getTypeBadgeColor(resumption.RESUMPTION_TYPE)}`}>
                {resumption.RESUMPTION_TYPE}
              </span>
            </div>
          </div>

          {/* Employee and Leave Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Employee Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Employee Name</label>
                <p className="mt-1 text-sm text-gray-900">
                  {resumption.EMPLOYEE_FIRST_NAME} {resumption.EMPLOYEE_LAST_NAME}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Employee Code</label>
                <p className="mt-1 text-sm text-gray-900">{resumption.EMPLOYEE_CODE}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Designation</label>
                <p className="mt-1 text-sm text-gray-900">{resumption.DESIGNATION}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Leave Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Leave Type</label>
                <p className="mt-1 text-sm text-gray-900">{resumption.LEAVE_TYPE}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Original Leave Period</label>
                <p className="mt-1 text-sm text-gray-900">
                  {convertToDDMMYYYY(resumption.LEAVE_START_DATE)} to {convertToDDMMYYYY(resumption.LEAVE_END_DATE)}
                </p>
              </div>
            </div>
          </div>

          {/* Resumption Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Resumption Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">Planned Resumption Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {convertToDDMMYYYY(resumption.PLANNED_RESUMPTION_DATE)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Actual Resumption Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {convertToDDMMYYYY(resumption.ACTUAL_RESUMPTION_DATE)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Days Difference</label>
                <p className="mt-1 text-sm text-gray-900">
                  {daysDiff === 0 ? 'On time' : 
                   daysDiff > 0 ? `${daysDiff} days late` : 
                   `${Math.abs(daysDiff)} days early`}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Reason</label>
              <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                {resumption.REASON || 'No reason provided'}
              </p>
            </div>

            {resumption.ATTACHMENT_URL && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Attachment</label>
                <a
                  href={resumption.ATTACHMENT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  View Attachment
                </a>
              </div>
            )}
          </div>

          {/* Application Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Application Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">Applied By</label>
                <p className="mt-1 text-sm text-gray-900">
                  {resumption.APPLIED_BY_FIRST_NAME} {resumption.APPLIED_BY_LAST_NAME}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Applied On</label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatTimestamp(resumption.CREATED_AT)}
                </p>
              </div>

              {resumption.APPROVED_BY_FIRST_NAME && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Approved By</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {resumption.APPROVED_BY_FIRST_NAME} {resumption.APPROVED_BY_LAST_NAME}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Approved On</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatTimestamp(resumption.APPROVED_AT)}
                    </p>
                  </div>
                </>
              )}
            </div>

            {resumption.APPROVAL_COMMENTS && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Approval Comments</label>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {resumption.APPROVAL_COMMENTS}
                </p>
              </div>
            )}
          </div>

          {/* Integration Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Integration Status</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">Attendance Updated</label>
                <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  resumption.ATTENDANCE_UPDATED ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {resumption.ATTENDANCE_UPDATED ? 'Yes' : 'No'}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Payroll Updated</label>
                <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  resumption.PAYROLL_UPDATED ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {resumption.PAYROLL_UPDATED ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Delete Leave Resumption
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 text-center">
                  Are you sure you want to delete this leave resumption?
                </p>
                <p className="text-xs text-gray-400 text-center mt-2">
                  This action cannot be undone.
                </p>
              </div>
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

export default LeaveResumptionDetail; 
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  UserIcon,
  PaperClipIcon,
  ChatBubbleLeftIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { leaveAPI } from '../services/api';

const LeaveDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState({
    status: '',
    comments: ''
  });

  // Fetch leave data
  const fetchLeaveData = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await leaveAPI.getById(id);
      if (response.data.success) {
        setLeave(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching leave data:', error);
      toast.error('Failed to fetch leave data');
      navigate('/leaves');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchLeaveData();
  }, [id, fetchLeaveData]);

  // Format date to DD-MM-YYYY
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  // Format datetime
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB');
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
      APPROVED: { color: 'bg-green-100 text-green-800', icon: CheckIcon },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: XMarkIcon },
      CANCELLED: { color: 'bg-gray-100 text-gray-800', icon: XMarkIcon }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4 mr-2" />
        {status}
      </span>
    );
  };

  // Get leave type badge
  const getLeaveTypeBadge = (type) => {
    const typeConfig = {
      ANNUAL: 'bg-blue-100 text-blue-800',
      SICK: 'bg-red-100 text-red-800',
      CASUAL: 'bg-purple-100 text-purple-800',
      MATERNITY: 'bg-pink-100 text-pink-800',
      PATERNITY: 'bg-indigo-100 text-indigo-800',
      BEREAVEMENT: 'bg-gray-100 text-gray-800',
      COMPENSATORY: 'bg-orange-100 text-orange-800',
      UNPAID: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${typeConfig[type] || typeConfig.ANNUAL}`}>
        {type}
      </span>
    );
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!approvalData.status) {
      toast.error('Please select a status');
      return;
    }

    try {
      setUpdating(true);
      await leaveAPI.updateStatus(id, approvalData);
      toast.success(`Leave ${approvalData.status.toLowerCase()} successfully`);
      setShowApprovalModal(false);
      setApprovalData({ status: '', comments: '' });
      fetchLeaveData();
    } catch (error) {
      console.error('Error updating leave status:', error);
      toast.error('Failed to update leave status');
    } finally {
      setUpdating(false);
    }
  };

  // Handle leave deletion
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this leave? This action cannot be undone.')) {
      return;
    }

    try {
      await leaveAPI.delete(id);
      toast.success('Leave deleted successfully');
      navigate('/leaves');
    } catch (error) {
      console.error('Error deleting leave:', error);
      toast.error('Failed to delete leave');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!leave) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Leave not found</h3>
        <p className="mt-1 text-sm text-gray-500">The leave request you're looking for doesn't exist.</p>
        <div className="mt-6">
          <Link
            to="/leaves"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Back to Leaves
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
          <button
            onClick={() => navigate('/leaves')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leave Request Details</h1>
            <p className="mt-1 text-sm text-gray-500">
              Leave ID: {leave.LEAVE_ID}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {leave.STATUS === 'PENDING' && (
            <>
              <button
                onClick={() => {
                  setApprovalData({ status: 'APPROVED', comments: '' });
                  setShowApprovalModal(true);
                }}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                Approve
              </button>
              <button
                onClick={() => {
                  setApprovalData({ status: 'REJECTED', comments: '' });
                  setShowApprovalModal(true);
                }}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Reject
              </button>
            </>
          )}
          {(leave.STATUS === 'APPROVED' || leave.STATUS === 'ON_LEAVE') && (
            <Link
              to="/leave-resumptions/new"
              state={{ leaveId: leave.LEAVE_ID }}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Apply for Resumption
            </Link>
          )}
          <Link
            to={`/leaves/${id}/edit`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </Link>
          {leave.STATUS === 'PENDING' && (
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <div className={`rounded-lg p-4 ${
        leave.STATUS === 'APPROVED' ? 'bg-green-50 border border-green-200' :
        leave.STATUS === 'REJECTED' ? 'bg-red-50 border border-red-200' :
        leave.STATUS === 'CANCELLED' ? 'bg-gray-50 border border-gray-200' :
        'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {getStatusBadge(leave.STATUS)}
            <span className="ml-3 text-sm text-gray-600">
              {leave.STATUS === 'PENDING' && 'Awaiting approval'}
              {leave.STATUS === 'APPROVED' && 'Leave request approved'}
              {leave.STATUS === 'REJECTED' && 'Leave request rejected'}
              {leave.STATUS === 'CANCELLED' && 'Leave request cancelled'}
            </span>
          </div>
          {leave.APPROVED_AT && (
            <span className="text-sm text-gray-500">
              {formatDateTime(leave.APPROVED_AT)}
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leave Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Leave Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Leave Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {getLeaveTypeBadge(leave.LEAVE_TYPE)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Available Days</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {leave.AVAILABLE_DAYS || 0} day(s)
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(leave.START_DATE)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">End Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(leave.END_DATE)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Days</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {leave.TOTAL_DAYS} day(s)
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Request Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(leave.REQUEST_DATE)}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Reason for Leave
              </h3>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {leave.REASON}
              </p>
            </div>
          </div>

          {/* Attachment */}
          {leave.ATTACHMENT_URL && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  <PaperClipIcon className="w-5 h-5 inline mr-2" />
                  Attachment
                </h3>
                <a
                  href={leave.ATTACHMENT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PaperClipIcon className="w-4 h-4 mr-2" />
                  View Attachment
                </a>
              </div>
            </div>
          )}

          {/* Approval Comments */}
          {leave.APPROVAL_COMMENTS && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  <ChatBubbleLeftIcon className="w-5 h-5 inline mr-2" />
                  Approval Comments
                </h3>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {leave.APPROVAL_COMMENTS}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Employee Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                <UserIcon className="w-5 h-5 inline mr-2" />
                Employee Information
              </h3>
              <div className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {leave.EMPLOYEE_FIRST_NAME} {leave.EMPLOYEE_LAST_NAME}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Employee Code</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {leave.EMPLOYEE_CODE}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Designation</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {leave.DESIGNATION}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Request Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Request Information
              </h3>
              <div className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created By</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {leave.CREATED_BY_FIRST_NAME} {leave.CREATED_BY_LAST_NAME}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created At</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDateTime(leave.CREATED_AT)}
                  </dd>
                </div>
                {leave.APPROVED_BY && (
                  <>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Approved By</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {leave.APPROVED_BY_FIRST_NAME} {leave.APPROVED_BY_LAST_NAME}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Approved At</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatDateTime(leave.APPROVED_AT)}
                      </dd>
                    </div>
                  </>
                )}
                {leave.UPDATED_AT && leave.UPDATED_AT !== leave.CREATED_AT && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDateTime(leave.UPDATED_AT)}
                    </dd>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {approvalData.status === 'APPROVED' ? 'Approve' : 'Reject'} Leave Request
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments (Optional)
                </label>
                <textarea
                  value={approvalData.comments}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, comments: e.target.value }))}
                  rows={3}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder={`Add comments for ${approvalData.status.toLowerCase()}...`}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={updating}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    approvalData.status === 'APPROVED'
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {updating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {approvalData.status === 'APPROVED' ? 'Approving...' : 'Rejecting...'}
                    </>
                  ) : (
                    <>{approvalData.status === 'APPROVED' ? 'Approve' : 'Reject'}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveDetail; 
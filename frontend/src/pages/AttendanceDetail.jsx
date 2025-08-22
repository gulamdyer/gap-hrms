import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';
import { attendanceAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const AttendanceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchAttendance();
    }
  }, [isAuthenticated, id]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getById(id);
      setAttendance(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to fetch attendance details');
      navigate('/attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) {
      return;
    }

    try {
      await attendanceAPI.delete(id);
      toast.success('Attendance record deleted successfully');
      navigate('/attendance');
    } catch (error) {
      console.error('Error deleting attendance:', error);
      toast.error('Failed to delete attendance record');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PRESENT': { color: 'bg-green-100 text-green-800', label: 'Present' },
      'ABSENT': { color: 'bg-red-100 text-red-800', label: 'Absent' },
      'HALF_DAY': { color: 'bg-yellow-100 text-yellow-800', label: 'Half Day' },
      'LEAVE': { color: 'bg-blue-100 text-blue-800', label: 'Leave' },
      'HOLIDAY': { color: 'bg-purple-100 text-purple-800', label: 'Holiday' },
      'WEEKEND': { color: 'bg-gray-100 text-gray-800', label: 'Weekend' }
    };

    const config = statusConfig[status] || statusConfig['ABSENT'];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return timeString;
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Authentication Required</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please log in to access attendance details.
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

  if (!attendance) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Attendance Record Not Found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The attendance record you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/attendance"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Back to Attendance List
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
            to="/attendance"
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to List
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Details</h1>
            <p className="mt-1 text-sm text-gray-500">
              Record ID: {attendance.ATTENDANCE_ID}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to={`/attendance/${id}/edit`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Attendance Information</h3>
        </div>
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee Information */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Employee Information
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Employee Name</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {attendance.FIRST_NAME} {attendance.LAST_NAME}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Employee Code</label>
                  <p className="mt-1 text-sm text-gray-900">{attendance.EMPLOYEE_CODE}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Department</label>
                  <p className="mt-1 text-sm text-gray-900">{attendance.DEPARTMENT_NAME || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Designation</label>
                  <p className="mt-1 text-sm text-gray-900">{attendance.DESIGNATION_NAME || '-'}</p>
                </div>
              </div>
            </div>

            {/* Attendance Details */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                Attendance Details
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(attendance.ATTENDANCE_DATE)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">{getStatusBadge(attendance.STATUS)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Shift</label>
                  <p className="mt-1 text-sm text-gray-900">{attendance.SHIFT_NAME || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Work Hours</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {attendance.WORK_HOURS ? `${attendance.WORK_HOURS} hours` : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Time Information */}
          <div className="mt-8 space-y-4">
            <h4 className="text-md font-medium text-gray-900 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2" />
              Time Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Check In Time</label>
                  <p className="mt-1 text-sm text-gray-900">{formatTime(attendance.ACTUAL_IN_TIME)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Check In Method</label>
                  <p className="mt-1 text-sm text-gray-900">{attendance.IN_METHOD || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Check In Location</label>
                  <p className="mt-1 text-sm text-gray-900">{attendance.IN_LOCATION || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Check In Device</label>
                  <p className="mt-1 text-sm text-gray-900">{attendance.IN_DEVICE_ID || '-'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Check Out Time</label>
                  <p className="mt-1 text-sm text-gray-900">{formatTime(attendance.ACTUAL_OUT_TIME)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Check Out Method</label>
                  <p className="mt-1 text-sm text-gray-900">{attendance.OUT_METHOD || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Check Out Location</label>
                  <p className="mt-1 text-sm text-gray-900">{attendance.OUT_LOCATION || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Check Out Device</label>
                  <p className="mt-1 text-sm text-gray-900">{attendance.OUT_DEVICE_ID || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-8 space-y-4">
            <h4 className="text-md font-medium text-gray-900 flex items-center">
              <DevicePhoneMobileIcon className="h-5 w-5 mr-2" />
              Additional Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Overtime Hours</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {attendance.OVERTIME_HOURS ? `${attendance.OVERTIME_HOURS} hours` : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Late Minutes</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {attendance.LATE_MINUTES ? `${attendance.LATE_MINUTES} minutes` : '-'}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Created By</label>
                  <p className="mt-1 text-sm text-gray-900">{attendance.CREATED_BY || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Created Date</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {attendance.CREATED_DATE ? formatDate(attendance.CREATED_DATE) : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDetail; 
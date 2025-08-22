import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { attendanceAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const AttendanceDashboard = () => {
  const { isAuthenticated } = useAuthStore();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // Today
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getDashboard(dateRange);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (key, value) => {
    setDateRange(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getStatusColor = (status) => {
    const colors = {
      'PRESENT': 'text-green-600 bg-green-100',
      'ABSENT': 'text-red-600 bg-red-100',
      'HALF_DAY': 'text-yellow-600 bg-yellow-100',
      'LEAVE': 'text-blue-600 bg-blue-100',
      'HOLIDAY': 'text-purple-600 bg-purple-100',
      'WEEKEND': 'text-gray-600 bg-gray-100'
    };
    return colors[status] || colors['ABSENT'];
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatHours = (hours) => {
    return `${Math.round(hours * 100) / 100}h`;
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Authentication Required</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please log in to access the attendance dashboard.
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

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">No Data Available</h3>
        <p className="mt-1 text-sm text-gray-500">
          No attendance data found for the selected period.
        </p>
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
            Back to Attendance
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Overview of attendance statistics and trends
            </p>
          </div>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Period Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <CalendarIcon className="h-5 w-5 text-blue-600 mr-2" />
          <span className="text-sm font-medium text-blue-900">
            Period: {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Records */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(dashboardData.summary.totalRecords)}
              </p>
            </div>
          </div>
        </div>

        {/* Present Count */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Present</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(dashboardData.summary.presentCount)}
              </p>
              <p className="text-sm text-green-600">
                {dashboardData.summary.attendanceRate}% attendance rate
              </p>
            </div>
          </div>
        </div>

        {/* Absent Count */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Absent</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(dashboardData.summary.absentCount)}
              </p>
              <p className="text-sm text-red-600">
                {dashboardData.summary.totalRecords > 0 ? 
                  Math.round((dashboardData.summary.absentCount / dashboardData.summary.totalRecords) * 100) : 0}% absence rate
              </p>
            </div>
          </div>
        </div>

        {/* Leave Count */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">On Leave</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(dashboardData.summary.leaveCount)}
              </p>
              <p className="text-sm text-yellow-600">
                {dashboardData.summary.halfDayCount} half days
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hours Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Work Hours */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Work Hours</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatHours(dashboardData.hours.totalWorkHours)}
              </p>
              <p className="text-sm text-indigo-600">
                Avg: {formatHours(dashboardData.hours.averageWorkHours)} per day
              </p>
            </div>
          </div>
        </div>

        {/* Overtime Hours */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Overtime Hours</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatHours(dashboardData.hours.totalOvertimeHours)}
              </p>
              <p className="text-sm text-orange-600">
                {dashboardData.hours.totalWorkHours > 0 ? 
                  Math.round((dashboardData.hours.totalOvertimeHours / dashboardData.hours.totalWorkHours) * 100) : 0}% of total hours
              </p>
            </div>
          </div>
        </div>

        {/* Late Minutes */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Late Minutes</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(dashboardData.hours.totalLateMinutes)}
              </p>
              <p className="text-sm text-red-600">
                {Math.round(dashboardData.hours.totalLateMinutes / 60)} hours total
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Attendance Records</h3>
        </div>
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
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Work Hours
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
              {dashboardData.recentAttendance.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No recent attendance records found
                  </td>
                </tr>
              ) : (
                dashboardData.recentAttendance.map((record) => (
                  <tr key={record.ATTENDANCE_ID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {record.FIRST_NAME} {record.LAST_NAME}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.EMPLOYEE_CODE}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.ATTENDANCE_DATE).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.ACTUAL_IN_TIME || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.ACTUAL_OUT_TIME || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.WORK_HOURS ? `${record.WORK_HOURS}h` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.STATUS)}`}>
                        {record.STATUS}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/attendance/${record.ATTENDANCE_ID}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {dashboardData.recentAttendance.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Link
              to="/attendance"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              View all attendance records →
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/attendance/mark"
            className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ClockIcon className="h-6 w-6 text-primary-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Mark Attendance</p>
              <p className="text-sm text-gray-500">Check in/out for employees</p>
            </div>
          </Link>
          
          <Link
            to="/attendance/create"
            className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <UserGroupIcon className="h-6 w-6 text-primary-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Add Record</p>
              <p className="text-sm text-gray-500">Create new attendance record</p>
            </div>
          </Link>
          
          <Link
            to="/attendance"
            className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ChartBarIcon className="h-6 w-6 text-primary-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">View All</p>
              <p className="text-sm text-gray-500">Browse all attendance records</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDashboard; 
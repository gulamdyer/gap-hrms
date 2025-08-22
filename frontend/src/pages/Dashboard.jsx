import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import useAuthStore from '../store/authStore';
import { employeeAPI, activityAPI } from '../services/api';
import toast from 'react-hot-toast';
import ActivityDetailModal from '../components/ActivityDetailModal';

const Dashboard = () => {
  const { user, isAuthenticated, token } = useAuthStore();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    onLeave: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    totalEmployeesChange: '',
    activeEmployeesChange: '',
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  // Debug authentication state
  useEffect(() => {
    console.log('🔍 Dashboard Authentication Debug:', {
      isAuthenticated,
      hasUser: !!user,
      hasToken: !!token,
      userData: user
    });
  }, [isAuthenticated, user, token]);

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching dashboard statistics...');
      
      // Check authentication
      if (!isAuthenticated || !token) {
        console.error('❌ User not authenticated');
        toast.error('Please log in to view dashboard');
        return;
      }
      
      console.log('✅ User authenticated, proceeding with API calls...');
      
      // Fetch dashboard statistics and recent activities in parallel
      const [statsResponse, activitiesResponse] = await Promise.all([
        employeeAPI.getDashboardStats(),
        activityAPI.getRecent(10)
      ]);
      
      console.log('✅ Dashboard stats:', statsResponse.data);
      console.log('✅ Recent activities:', activitiesResponse.data);
      
      setStats({
        totalEmployees: statsResponse.data.totalEmployees || 0,
        activeEmployees: statsResponse.data.activeEmployees || 0,
        onLeave: statsResponse.data.onLeave || 0,
        pendingLeaves: statsResponse.data.pendingLeaves || 0,
        approvedLeaves: statsResponse.data.approvedLeaves || 0,
        totalEmployeesChange: statsResponse.data.totalEmployeesChange || '+0%',
        activeEmployeesChange: statsResponse.data.activeEmployeesChange || '+0%',
        recentActivities: activitiesResponse.data || []
      });
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      // Show more specific error message
      let errorMessage = 'Failed to load dashboard statistics';
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. You do not have permission to view this data.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Dashboard service not found. Please check if the backend is running.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      
      // Set fallback values
      setStats(prev => ({
        ...prev,
        totalEmployees: 0,
        activeEmployees: 0,
        onLeave: 0,
        pendingLeaves: 0,
        approvedLeaves: 0,
        totalEmployeesChange: '+0%',
        activeEmployeesChange: '+0%',
        recentActivities: []
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchDashboardStats();
    }
  }, [isAuthenticated, token]);

  const StatCard = ({ title, value, icon: Icon, change, changeType, color, loading = false }) => (
    <div className="card h-full">
      <div className="flex items-center justify-between h-full">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mt-1"></div>
            </div>
          ) : (
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          )}
          {change && !loading && (
            <div className="flex items-center mt-2">
              {changeType === 'increase' ? (
                <ArrowUpIcon className="h-4 w-4 text-success-500" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 text-danger-500" />
              )}
              <span className={`text-sm font-medium ml-1 ${
                changeType === 'increase' ? 'text-success-600' : 'text-danger-600'
              }`}>
                {change}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg flex-shrink-0 ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => {
    const getIcon = () => {
      switch (activity.type) {
        case 'leave_request':
          return <CalendarIcon className="h-5 w-5 text-warning-500" />;
        case 'document_upload':
          return <DocumentTextIcon className="h-5 w-5 text-primary-500" />;
        case 'employee_added':
        case 'employee_updated':
          return <UsersIcon className="h-5 w-5 text-success-500" />;
        case 'leave_approved':
          return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
        case 'payroll_processed':
          return <ChartBarIcon className="h-5 w-5 text-purple-500" />;
        case 'loan_created':
        case 'loan_updated':
          return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
        default:
          return <ClockIcon className="h-5 w-5 text-gray-500" />;
      }
    };

    const handleViewDetails = () => {
      setSelectedActivityId(activity.id);
      setIsActivityModalOpen(true);
    };

    // Check if this is an update action that has old/new values
    const hasUpdateDetails = activity.action === 'UPDATE' && activity.hasOldValues && activity.hasNewValues;

    return (
      <div className="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-b-0">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900">{activity.message}</p>
          <p className="text-xs text-gray-500">{activity.time}</p>
        </div>
        <div className="flex-shrink-0 flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            activity.status === 'pending' 
              ? 'bg-warning-100 text-warning-800'
              : 'bg-success-100 text-success-800'
          }`}>
            {activity.status}
          </span>
                     {hasUpdateDetails && (
             <button
               onClick={handleViewDetails}
               className="inline-flex items-center justify-center p-1.5 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors border border-primary-200 hover:border-primary-300"
               title="View detailed changes"
             >
               <EyeIcon className="h-4 w-4" />
             </button>
           )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 w-full">
      {/* Welcome Section */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your organization today.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <p className="text-sm text-gray-500">Current Time</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Check */}
      {!isAuthenticated || !token ? (
        <div className="card">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 w-full">
            <StatCard
              title="Total Employees"
              value={stats.totalEmployees}
              icon={UsersIcon}
              change={stats.totalEmployeesChange}
              changeType="increase"
              color="bg-primary-500"
              loading={loading}
            />
            <StatCard
              title="Active Employees"
              value={stats.activeEmployees}
              icon={CheckCircleIcon}
              change={stats.activeEmployeesChange}
              changeType="increase"
              color="bg-success-500"
              loading={loading}
            />
            <StatCard
              title="On Leave"
              value={stats.onLeave}
              icon={ClockIcon}
              change="+3"
              changeType="increase"
              color="bg-blue-500"
              loading={loading}
            />
            <StatCard
              title="Pending Leaves"
              value={stats.pendingLeaves}
              icon={CalendarIcon}
              change="-2"
              changeType="decrease"
              color="bg-warning-500"
              loading={loading}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
            {/* Employee Distribution Chart */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Employee Distribution</h2>
                <div className="flex space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    Active: {stats.activeEmployees}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    On Leave: {stats.onLeave}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Inactive: {stats.totalEmployees - stats.activeEmployees - stats.onLeave}
                  </span>
                </div>
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Chart visualization will be added here</p>
                </div>
              </div>
            </div>

            {/* Leave Requests Chart */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Leave Requests</h2>
                <div className="flex space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                    Pending: {stats.pendingLeaves}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                    Approved: {stats.approvedLeaves}
                  </span>
                </div>
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Chart visualization will be added here</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 lg:gap-6 w-full">
            {/* Recent Activities */}
            <div className="xl:col-span-3">
              <div className="card h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
                  <button className="text-sm text-primary-600 hover:text-primary-500 font-medium">
                    View all
                  </button>
                </div>
                <div className="space-y-2">
                  {loading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, index) => (
                        <div key={index} className="flex items-start space-x-3 py-3">
                          <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                          </div>
                          <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  ) : stats.recentActivities.length > 0 ? (
                    stats.recentActivities.map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No recent activities</p>
                      <p className="text-gray-400 text-xs mt-1">Activities will appear here as they occur</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions & System Status */}
            <div className="space-y-4 lg:space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full btn-primary flex items-center justify-center">
                    <UsersIcon className="h-5 w-5 mr-2" />
                    Add Employee
                  </button>
                  <button className="w-full btn-secondary flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    Request Leave
                  </button>
                  <button className="w-full btn-secondary flex items-center justify-center">
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    Upload Document
                  </button>
                  <button className="w-full btn-secondary flex items-center justify-center">
                    <ChartBarIcon className="h-5 w-5 mr-2" />
                    Generate Report
                  </button>
                </div>
              </div>

              {/* System Status */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Database</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                      Online
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">API Services</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                      Online
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">File Storage</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                      Online
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Backup System</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                      Scheduled
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Activity Detail Modal */}
      <ActivityDetailModal
        isOpen={isActivityModalOpen}
        onClose={() => {
          setIsActivityModalOpen(false);
          setSelectedActivityId(null);
        }}
        activityId={selectedActivityId}
      />
    </div>
  );
};

export default Dashboard; 
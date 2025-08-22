import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  ServerIcon,
  UserIcon,
  KeyIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  WifiIcon,
  ClockIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { sqlServerConfigAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const SqlServerConfigDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchConfig();
    }
  }, [isAuthenticated, id]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await sqlServerConfigAPI.getById(id);
      setConfig(response.data);
    } catch (error) {
      console.error('Error fetching SQL Server config:', error);
      toast.error('Failed to fetch SQL Server configuration details');
      navigate('/sql-server-configs');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      const response = await sqlServerConfigAPI.testConnection(id);
      
      if (response.success) {
        toast.success('Connection test successful! Database is accessible.');
      } else {
        toast.error('Connection test failed. Please check your configuration.');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Connection test failed. ';
      
      if (error.response?.status === 404) {
        errorMessage += 'Configuration not found.';
      } else if (error.response?.status === 400) {
        const errorData = error.response?.data;
        if (errorData?.error) {
          if (errorData.error.includes('timeout')) {
            errorMessage += 'Connection timed out. Please check if the server is running and accessible.';
          } else if (errorData.error.includes('authentication')) {
            errorMessage += 'Authentication failed. Please verify your username and password.';
          } else if (errorData.error.includes('network')) {
            errorMessage += 'Network error. Please check your IP address and port number.';
          } else if (errorData.error.includes('database')) {
            errorMessage += 'Database not found. Please verify the database name.';
          } else {
            errorMessage += errorData.error;
          }
        } else {
          errorMessage += 'Server error occurred. Please try again later.';
        }
      } else if (error.response?.status === 500) {
        errorMessage += 'Server error occurred. Please try again later.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage += 'Network error. Please check your internet connection.';
      } else {
        errorMessage += 'An unexpected error occurred. Please try again.';
      }
      
      toast.error(errorMessage);
    } finally {
      setTestingConnection(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB');
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Authentication Required</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please log in to access SQL Server configuration details.
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

  if (!config) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Configuration Not Found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The SQL Server configuration you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/sql-server-configs"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Back to Configurations
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
            to="/sql-server-configs"
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              SQL Server Configuration Details
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Configuration ID: #{config.CONFIG_ID}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {(user?.role === 'ADMIN' || user?.role === 'HR') && (
            <Link
              to={`/sql-server-configs/${config.CONFIG_ID}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Edit Configuration
            </Link>
          )}
          <button
            onClick={handleTestConnection}
            disabled={testingConnection}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              testingConnection 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
            }`}
          >
            {testingConnection ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Testing...
              </>
            ) : (
              <>
                <WifiIcon className="h-4 w-4 mr-2" />
                Test Connection
              </>
            )}
          </button>
        </div>
      </div>

      {/* Configuration Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <ServerIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Database Name</label>
              <p className="mt-1 text-sm text-gray-900 font-mono">{config.DB_NAME}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">User ID</label>
              <p className="mt-1 text-sm text-gray-900">{config.USER_ID}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">Password</label>
              <div className="mt-1 flex items-center">
                <span className="text-sm font-mono">
                  {showPassword ? config.PASSWORD : '••••••••••••••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  config.IS_ACTIVE === 1
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {config.IS_ACTIVE === 1 ? (
                    <>
                      <CheckIcon className="h-3 w-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <XMarkIcon className="h-3 w-3 mr-1" />
                      Inactive
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Details */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Connection Details</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">IP Address</label>
              <p className="mt-1 text-sm text-gray-900 font-mono">{config.IP_ADDRESS}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">Port</label>
              <p className="mt-1 text-sm text-gray-900">{config.PORT}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">Connection String</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                <code className="text-xs text-gray-800 font-mono break-all">
                  Server={config.IP_ADDRESS},{config.PORT};Database={config.DB_NAME};User Id={config.USER_ID};Password={config.PASSWORD ? '***' : ''};
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {config.DESCRIPTION && (
          <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Description</h3>
            </div>
            <p className="text-sm text-gray-700">{config.DESCRIPTION}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
          <div className="flex items-center mb-4">
            <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Metadata</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Created By</label>
              <div className="mt-1 flex items-center">
                <UserCircleIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">
                  {config.CREATED_BY_FIRST_NAME} {config.CREATED_BY_LAST_NAME}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">Created At</label>
              <p className="mt-1 text-sm text-gray-900">{formatDate(config.CREATED_AT)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">Last Updated</label>
              <p className="mt-1 text-sm text-gray-900">{formatDate(config.UPDATED_AT)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3">
        <Link
          to="/sql-server-configs"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Back to List
        </Link>
        
        <button
          onClick={handleTestConnection}
          disabled={testingConnection}
          className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
            testingConnection 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {testingConnection ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Testing...
            </>
          ) : (
            <>
              <WifiIcon className="h-4 w-4 mr-2" />
              Test Connection
            </>
          )}
        </button>
        
        {(user?.role === 'ADMIN' || user?.role === 'HR') && (
          <Link
            to={`/sql-server-configs/${config.CONFIG_ID}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Edit Configuration
          </Link>
        )}
      </div>
    </div>
  );
};

export default SqlServerConfigDetail; 
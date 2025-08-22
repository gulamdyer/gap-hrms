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
  EyeIcon,
  EyeSlashIcon,
  WifiIcon
} from '@heroicons/react/24/outline';
import { sqlServerConfigAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const SqlServerConfigForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    dbName: '',
    userId: '',
    password: '',
    ipAddress: '',
    port: '',
    description: '',
    isActive: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated) {
      if (id) {
        fetchConfig();
      }
    }
  }, [id, isAuthenticated]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await sqlServerConfigAPI.getById(id);
      const config = response.data;
      
      setFormData({
        dbName: config.DB_NAME || '',
        userId: config.USER_ID || '',
        password: config.PASSWORD || '',
        ipAddress: config.IP_ADDRESS || '',
        port: config.PORT?.toString() || '',
        description: config.DESCRIPTION || '',
        isActive: config.IS_ACTIVE === 1
      });
    } catch (error) {
      console.error('Error fetching SQL Server config:', error);
      toast.error('Failed to fetch SQL Server configuration details');
      navigate('/sql-server-configs');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.dbName.trim()) {
      newErrors.dbName = 'Database name is required';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.dbName)) {
      newErrors.dbName = 'Database name can only contain letters, numbers, and underscores';
    }

    if (!formData.userId.trim()) {
      newErrors.userId = 'User ID is required';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }

    if (!formData.ipAddress.trim()) {
      newErrors.ipAddress = 'IP Address is required';
    } else if (!/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(formData.ipAddress)) {
      newErrors.ipAddress = 'Please provide a valid IP address';
    }

    if (!formData.port.trim()) {
      newErrors.port = 'Port is required';
    } else {
      const portNum = parseInt(formData.port);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        newErrors.port = 'Port must be a number between 1 and 65535';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTestConnection = async () => {
    // Validate required fields for testing
    if (!formData.dbName || !formData.userId || !formData.password || !formData.ipAddress || !formData.port) {
      toast.error('Please fill in all required fields before testing connection');
      return;
    }

    try {
      setTestingConnection(true);
      
      if (id) {
        // If editing existing config, test the saved configuration
        const response = await sqlServerConfigAPI.testConnection(id);
        
        if (response.success) {
          toast.success('Connection test successful! Database is accessible.');
        } else {
          toast.error('Connection test failed. Please check your configuration.');
        }
      } else {
        // If creating new config, we need to test with current form data
        // For now, we'll show a message that testing is only available after saving
        toast.info('Please save the configuration first, then test the connection from the list page.');
      }
      
    } catch (error) {
      console.error('Error testing connection:', error);
      
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      
      const submitData = {
        dbName: formData.dbName.trim(),
        userId: formData.userId.trim(),
        password: formData.password,
        ipAddress: formData.ipAddress.trim(),
        port: parseInt(formData.port),
        description: formData.description.trim() || null,
        isActive: formData.isActive ? 1 : 0
      };

      if (id) {
        await sqlServerConfigAPI.update(id, submitData);
        toast.success('SQL Server configuration updated successfully');
      } else {
        await sqlServerConfigAPI.create(submitData);
        toast.success('SQL Server configuration created successfully');
      }
      
      navigate('/sql-server-configs');
    } catch (error) {
      console.error('Error saving SQL Server config:', error);
      toast.error(error.response?.data?.message || 'Failed to save SQL Server configuration');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Authentication Required</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please log in to access SQL Server configuration management.
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
              {id ? 'Edit SQL Server Configuration' : 'New SQL Server Configuration'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {id ? 'Update SQL Server connection details' : 'Create a new SQL Server connection configuration'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Database Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ServerIcon className="h-4 w-4 inline mr-1" />
                Database Name *
              </label>
              <input
                type="text"
                name="dbName"
                value={formData.dbName}
                onChange={handleInputChange}
                placeholder="Enter database name"
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.dbName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.dbName && (
                <p className="mt-1 text-sm text-red-600">{errors.dbName}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Only letters, numbers, and underscores allowed</p>
            </div>

            {/* User ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserIcon className="h-4 w-4 inline mr-1" />
                User ID *
              </label>
              <input
                type="text"
                name="userId"
                value={formData.userId}
                onChange={handleInputChange}
                placeholder="Enter user ID"
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.userId ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.userId && (
                <p className="mt-1 text-sm text-red-600">{errors.userId}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <KeyIcon className="h-4 w-4 inline mr-1" />
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter password"
                  className={`w-full border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* IP Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <GlobeAltIcon className="h-4 w-4 inline mr-1" />
                IP Address *
              </label>
              <input
                type="text"
                name="ipAddress"
                value={formData.ipAddress}
                onChange={handleInputChange}
                placeholder="192.168.1.1"
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.ipAddress ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.ipAddress && (
                <p className="mt-1 text-sm text-red-600">{errors.ipAddress}</p>
              )}
            </div>

            {/* Port */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ServerIcon className="h-4 w-4 inline mr-1" />
                Port *
              </label>
              <input
                type="number"
                name="port"
                value={formData.port}
                onChange={handleInputChange}
                placeholder="1433"
                min="1"
                max="65535"
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.port ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.port && (
                <p className="mt-1 text-sm text-red-600">{errors.port}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Default SQL Server port is 1433</p>
            </div>

            {/* Active Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CheckIcon className="h-4 w-4 inline mr-1" />
                Status
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Active Configuration
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">Only active configurations will be used for connections</p>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Enter a description for this configuration (optional)..."
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Connection String Preview */}
        {formData.dbName && formData.userId && formData.ipAddress && formData.port && (
          <div className="bg-gray-50 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Connection String Preview</h3>
            <div className="bg-white border border-gray-200 rounded-md p-4">
              <code className="text-sm text-gray-800 font-mono break-all">
                Server={formData.ipAddress},{formData.port};Database={formData.dbName};User Id={formData.userId};Password={formData.password ? '***' : ''};
              </code>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              This is the connection string that will be used to connect to the SQL Server database.
            </p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Link
            to="/sql-server-configs"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </Link>
          
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testingConnection || (!id && (!formData.dbName || !formData.userId || !formData.password || !formData.ipAddress || !formData.port))}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
              testingConnection || (!id && (!formData.dbName || !formData.userId || !formData.password || !formData.ipAddress || !formData.port))
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
                {id ? 'Test Connection' : 'Test After Save'}
              </>
            )}
          </button>
          
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                {id ? 'Update Configuration' : 'Create Configuration'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SqlServerConfigForm; 
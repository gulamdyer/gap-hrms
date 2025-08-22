import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { authAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { getAppName, getAppFullName, APP_CONFIG } from '../config/appConfig';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, setLoading, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [backendErrors, setBackendErrors] = useState({});
  const [connectionStatus, setConnectionStatus] = useState({ 
    isChecking: false, 
    isConnected: null, 
    error: null 
  });

  // Check backend connection on component mount
  useEffect(() => {
    checkBackendConnection();
  }, []);

  // Check backend server connection
  const checkBackendConnection = async () => {
    setConnectionStatus({ isChecking: true, isConnected: null, error: null });
    
    try {
      const response = await fetch('http://localhost:5000/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setConnectionStatus({ isChecking: false, isConnected: true, error: null });
      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Backend connection error:', error);
      setConnectionStatus({ 
        isChecking: false, 
        isConnected: false, 
        error: error.message.includes('fetch') 
          ? 'Cannot connect to backend server. Make sure the server is running on port 5000.'
          : error.message
      });
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (useAuthStore.getState().isAuthenticated) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (backendErrors[name]) {
      setBackendErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Helper function to get combined errors for a field
  const getFieldError = (fieldName) => {
    return errors[fieldName] || backendErrors[fieldName] || '';
  };

  // Helper function to get field CSS classes
  const getFieldClasses = (fieldName, baseClasses = '') => {
    const hasError = errors[fieldName] || backendErrors[fieldName];
    return `${baseClasses} ${hasError ? 'border-red-500' : 'border-gray-300'}`;
  };

  // Function to process backend validation errors
  const processBackendErrors = (errorArray) => {
    const fieldErrors = {};
    const generalErrors = [];
    
    if (Array.isArray(errorArray)) {
      errorArray.forEach(error => {
        if (error.path || error.field) {
          const fieldName = error.path || error.field;
          fieldErrors[fieldName] = error.msg || error.message;
        } else {
          generalErrors.push(error.msg || error.message || error);
        }
      });
    }
    
    return { fieldErrors, generalErrors };
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    // Clear previous backend errors
    setBackendErrors({});
    
    if (!validateForm()) {
      return;
    }

    // Check connection before attempting login
    if (connectionStatus.isConnected === false) {
      toast.error('Cannot connect to server. Please check if the backend is running.');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔍 Attempting login with:', { 
        username: formData.username, 
        passwordLength: formData.password.length 
      });
      
      const response = await authAPI.login(formData);
      console.log('✅ Login response:', response);
      
      if (response.success) {
        login(response.data.user, response.data.token);
        toast.success('Login successful!');
        
        // Redirect to intended page or dashboard
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Clear any previous backend errors
      setBackendErrors({});
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response) {
        console.log('Error response:', error.response);
        
        // Handle different response formats
        if (error.response.data) {
          // Check for validation errors
          if (error.response.data.errors) {
            const { fieldErrors, generalErrors } = processBackendErrors(error.response.data.errors);
            
            // Set field-specific errors
            setBackendErrors(fieldErrors);
            
            // Show field errors as toast for immediate feedback
            const allErrors = Object.values(fieldErrors).concat(generalErrors);
            if (allErrors.length > 0) {
              errorMessage = `Validation errors: ${allErrors.join(', ')}`;
            }
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          }
        }
        
        // Handle specific HTTP status codes
        if (error.response.status === 401) {
          errorMessage = 'Invalid username or password. Please check your credentials.';
        } else if (error.response.status >= 500) {
          errorMessage = 'Server error. Please try again later or contact support.';
        } else if (error.response.status === 0 || !error.response.status) {
          errorMessage = 'Cannot connect to server. Please check if the backend is running.';
        }
      } else if (error.request) {
        console.log('Request error:', error.request);
        errorMessage = 'Cannot connect to server. Please check your internet connection and if the backend is running.';
        // Update connection status
        setConnectionStatus({ 
          isChecking: false, 
          isConnected: false, 
          error: 'Server connection lost' 
        });
      } else {
        console.log('Other error:', error.message);
        errorMessage = error.message || 'An unexpected error occurred.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-center px-12 text-white">
          {/* Logo */}
          <div className="mb-8">
            <img 
              src={APP_CONFIG.BRAND_LOGO_URL} 
              alt="GAP HRMS Logo" 
              className="h-24 w-auto mb-6"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="hidden h-24 w-24 bg-white rounded-full flex items-center justify-center mb-6">
              <svg className="h-12 w-12 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          
          {/* App Name */}
          <h1 className="text-4xl font-bold mb-4">
            {getAppName()}
          </h1>
          
          {/* Tagline */}
          <p className="text-xl text-primary-100 mb-8">
            {APP_CONFIG.BRAND_TAGLINE}
          </p>
          
          {/* Description */}
          <p className="text-lg text-primary-200 max-w-md leading-relaxed">
            Streamline your human resource management with our comprehensive HRMS solution. 
            Manage employees, payroll, attendance, and more with ease.
          </p>
          
          {/* Bottom Text */}
          <div className="absolute bottom-12 text-center">
            <p className="text-sm text-primary-200 mb-2">
              Powered by GAP HRMS Solutions
            </p>
            <p className="text-xs text-primary-300">
              Empowering businesses with innovative technology
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full space-y-8">
          {/* Mobile Header (only visible on mobile) */}
          <div className="lg:hidden text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
              <img 
                src={APP_CONFIG.BRAND_LOGO_URL} 
                alt="BOLTO ERP Logo" 
                className="h-8 w-auto"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="hidden h-8 w-8 bg-white rounded-full flex items-center justify-center">
                <svg className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your {getAppName()} account
            </p>
          </div>

          {/* Desktop Header (only visible on desktop) */}
          <div className="hidden lg:block text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your {getAppName()} account
            </p>
          </div>

          {/* Login Form */}
          <div className="card">
            {/* Connection Status Banner */}
            {connectionStatus.isChecking && (
              <div className="bg-blue-50 border border-blue-200 rounded-t-lg p-4">
                <div className="flex items-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2 text-sm text-blue-700">Checking server connection...</span>
                </div>
              </div>
            )}
            
            {connectionStatus.isConnected === false && (
              <div className="bg-red-50 border border-red-200 rounded-t-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Server Connection Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{connectionStatus.error}</p>
                      <button
                        type="button"
                        onClick={checkBackendConnection}
                        className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                      >
                        Retry Connection
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {connectionStatus.isConnected === true && (
              <div className="bg-green-50 border border-green-200 rounded-t-lg p-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-4 w-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="ml-2 text-sm text-green-700">Server connected successfully</span>
                </div>
              </div>
            )}

            {/* Validation Summary */}
            {(Object.keys(errors).length > 0 || Object.keys(backendErrors).length > 0) && (
              <div className="bg-red-50 border border-red-200 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Please fix the following errors:
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <ul className="list-disc pl-5 space-y-1">
                        {Object.entries(errors).map(([field, error]) => (
                          <li key={`frontend-${field}`}>
                            <strong>{field}:</strong> {error}
                          </li>
                        ))}
                        {Object.entries(backendErrors).map(([field, error]) => (
                          <li key={`backend-${field}`}>
                            <strong>{field}:</strong> {error} <span className="text-red-500">(Server validation)</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form className="space-y-6 p-6" onSubmit={handleSubmit}>
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className={getFieldClasses('username', 'w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500')}
                  placeholder="Enter your username"
                  disabled={isLoading || connectionStatus.isConnected === false}
                />
                {getFieldError('username') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('username')}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className={getFieldClasses('password', 'w-full border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500')}
                    placeholder="Enter your password"
                    disabled={isLoading || connectionStatus.isConnected === false}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                    disabled={isLoading || connectionStatus.isConnected === false}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {getFieldError('password') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('password')}</p>
                )}
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading || connectionStatus.isConnected === false}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                    ${isLoading || connectionStatus.isConnected === false 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                    } transition duration-150 ease-in-out`}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <LoadingSpinner size="sm" color="white" />
                      <span className="ml-2">Signing in...</span>
                    </div>
                  ) : connectionStatus.isConnected === false ? (
                    'Cannot Connect to Server'
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Username:</strong> test_user</p>
                <p><strong>Password:</strong> TestPass123!</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 
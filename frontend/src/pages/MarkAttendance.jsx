import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  ClockIcon,
  UserIcon,
  FingerPrintIcon,
  DevicePhoneMobileIcon,
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { attendanceAPI, employeeAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const MarkAttendance = () => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [logType, setLogType] = useState('IN');
  const [verificationMethod, setVerificationMethod] = useState('MANUAL');
  const [deviceId, setDeviceId] = useState('');
  const [location, setLocation] = useState('');
  const [biometricData, setBiometricData] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastAttendance, setLastAttendance] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchEmployees();
      // Update current time every second
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(timer);
    } else {
      console.log('🔍 User not authenticated, redirecting to login...');
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (selectedEmployee) {
      fetchLastAttendance();
    }
  }, [selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      console.log('🔍 Fetching employees...');
      console.log('Auth state:', { isAuthenticated, user });
      const response = await employeeAPI.getDropdown();
      console.log('Employees response:', response);
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    }
  };

  const fetchLastAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await attendanceAPI.getAll({
        employeeId: selectedEmployee,
        startDate: today,
        endDate: today
      });
      
      if (response.data && response.data.length > 0) {
        setLastAttendance(response.data[0]);
      } else {
        setLastAttendance(null);
      }
    } catch (error) {
      console.error('Error fetching last attendance:', error);
    }
  };

  const handleMarkAttendance = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to mark attendance');
      navigate('/login');
      return;
    }

    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    if (!logType) {
      toast.error('Please select log type');
      return;
    }

    try {
      setLoading(true);
      
      console.log('🔍 Marking attendance...');
      console.log('Auth state:', { isAuthenticated, user });
      
      const attendanceData = {
        employeeId: parseInt(selectedEmployee),
        logType,
        deviceId: deviceId || null,
        location: location || null,
        method: verificationMethod,
        biometricData: biometricData || null
      };
      
      console.log('Attendance data:', attendanceData);

      const response = await attendanceAPI.markAttendance(attendanceData);
      console.log('Attendance response:', response);
      
      toast.success(response.data.message || 'Attendance marked successfully');
      
      // Reset form
      setSelectedEmployee('');
      setLogType('IN');
      setVerificationMethod('MANUAL');
      setDeviceId('');
      setLocation('');
      setBiometricData('');
      setLastAttendance(null);
      
      // Navigate to attendance list after a short delay
      setTimeout(() => {
        navigate('/attendance');
      }, 2000);
      
    } catch (error) {
      console.error('Error marking attendance:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const getVerificationMethodIcon = (method) => {
    const icons = {
      'FINGERPRINT': FingerPrintIcon,
      'FACE': UserIcon,
      'CARD': CreditCardIcon,
      'MOBILE': DevicePhoneMobileIcon,
      'MANUAL': UserIcon
    };
    return icons[method] || UserIcon;
  };

  const getLogTypeColor = (type) => {
    return type === 'IN' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const getLogTypeIcon = (type) => {
    return type === 'IN' ? CheckCircleIcon : XCircleIcon;
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Authentication Required</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please log in to mark attendance.
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
    <div className="max-w-2xl mx-auto space-y-6">
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
            <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
            <p className="mt-1 text-sm text-gray-500">
              Check in/out for employees with biometric integration
            </p>
          </div>
        </div>
      </div>

      {/* Current Time Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-center">
          <ClockIcon className="h-6 w-6 text-blue-600 mr-3" />
          <span className="text-xl font-mono font-bold text-blue-900">
            {currentTime.toLocaleTimeString()}
          </span>
        </div>
        <div className="text-center mt-2">
          <span className="text-sm text-blue-700">
            {currentTime.toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Attendance Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Attendance Details</h3>
        
        <div className="space-y-6">
          {/* Employee Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Employee *
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={loading}
            >
              <option value="">Choose an employee...</option>
              {employees.map((employee) => (
                <option key={employee.EMPLOYEE_ID} value={employee.EMPLOYEE_ID}>
                  {employee.EMPLOYEE_CODE} - {employee.FIRST_NAME} {employee.LAST_NAME}
                </option>
              ))}
            </select>
          </div>

          {/* Log Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Log Type *
            </label>
            <div className="grid grid-cols-2 gap-4">
              {['IN', 'OUT'].map((type) => {
                const Icon = getLogTypeIcon(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setLogType(type)}
                    disabled={loading}
                    className={`flex items-center justify-center p-4 border-2 rounded-lg transition-colors ${
                      logType === type
                        ? `${getLogTypeColor(type)} border-current`
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    <span className="font-medium">Check {type}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Verification Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Method
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { value: 'MANUAL', label: 'Manual', icon: UserIcon },
                { value: 'FINGERPRINT', label: 'Fingerprint', icon: FingerPrintIcon },
                { value: 'FACE', label: 'Face Recognition', icon: UserIcon },
                { value: 'CARD', label: 'Card', icon: CreditCardIcon },
                { value: 'MOBILE', label: 'Mobile', icon: DevicePhoneMobileIcon }
              ].map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setVerificationMethod(method.value)}
                    disabled={loading}
                    className={`flex items-center justify-center p-3 border rounded-lg transition-colors ${
                      verificationMethod === method.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    <span className="text-sm">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Device ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Device ID (Optional)
            </label>
            <input
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="Enter device identifier..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={loading}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location (Optional)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={loading}
            />
          </div>

          {/* Biometric Data */}
          {verificationMethod === 'FINGERPRINT' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Biometric Data (Optional)
              </label>
              <textarea
                value={biometricData}
                onChange={(e) => setBiometricData(e.target.value)}
                placeholder="Enter biometric data..."
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={loading}
              />
            </div>
          )}
        </div>

        {/* Last Attendance Info */}
        {lastAttendance && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Last Attendance Today</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Check In:</span>
                <span className="ml-2 font-medium">
                  {lastAttendance.ACTUAL_IN_TIME || 'Not recorded'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Check Out:</span>
                <span className="ml-2 font-medium">
                  {lastAttendance.ACTUAL_OUT_TIME || 'Not recorded'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="ml-2 font-medium">{lastAttendance.STATUS}</span>
              </div>
              <div>
                <span className="text-gray-500">Work Hours:</span>
                <span className="ml-2 font-medium">
                  {lastAttendance.WORK_HOURS ? `${lastAttendance.WORK_HOURS}h` : 'Not calculated'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-6">
          <button
            onClick={handleMarkAttendance}
            disabled={loading || !selectedEmployee}
            className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <ClockIcon className="h-4 w-4 mr-2" />
                Mark Attendance
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/attendance"
            className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ClockIcon className="h-6 w-6 text-primary-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">View Attendance</p>
              <p className="text-sm text-gray-500">Browse all attendance records</p>
            </div>
          </Link>
          
          <Link
            to="/attendance/dashboard"
            className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ExclamationTriangleIcon className="h-6 w-6 text-primary-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Dashboard</p>
              <p className="text-sm text-gray-500">View attendance statistics</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance; 
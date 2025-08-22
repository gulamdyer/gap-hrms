import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  CalendarIcon, 
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { payrollAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

// Date helper functions from DATE_HANDLING_GUIDE.md
const convertToDDMMYYYY = (dateString) => {
  if (!dateString || dateString === '') return '';
  
  // If already in DD-MM-YYYY format, return as is
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
    return dateString;
  }
  
  // If in YYYY-MM-DD format, convert to DD-MM-YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  }
  
  // Try to parse other formats
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

const convertToYYYYMMDD = (dateString) => {
  if (!dateString || dateString === '') return null;
  
  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // If in DD-MM-YYYY format, convert to YYYY-MM-DD
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split('-');
    return `${year}-${month}-${day}`;
  }
  
  // Try to parse other formats
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
  }
  
  return null;
};

const validateDateFormat = (dateString) => {
  if (!dateString || dateString === '') return true; // Empty is valid
  
  // Check if it matches DD-MM-YYYY format
  const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
  const match = dateString.match(dateRegex);
  
  if (!match) return false;
  
  const [, day, month, year] = match;
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);
  
  // Basic validation
  if (monthNum < 1 || monthNum > 12) return false;
  if (dayNum < 1 || dayNum > 31) return false;
  if (yearNum < 1900 || yearNum > 2100) return false;
  
  // Check for valid days in each month
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  // Handle leap years
  if (monthNum === 2 && yearNum % 4 === 0 && (yearNum % 100 !== 0 || yearNum % 400 === 0)) {
    daysInMonth[1] = 29;
  }
  
  return dayNum <= daysInMonth[monthNum - 1];
};

const PayrollPeriodForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [period, setPeriod] = useState({
    periodName: '',
    periodType: 'MONTHLY',
    startDate: '',
    endDate: '',
    payDate: ''
  });

  const periodTypes = [
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'BIWEEKLY', label: 'Bi-weekly' },
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'QUARTERLY', label: 'Quarterly' }
  ];

  useEffect(() => {
    if (id) {
      fetchPeriod();
    }
  }, [id]);

  const fetchPeriod = async () => {
    try {
      setLoading(true);
      const response = await payrollAPI.getPeriodById(id);
      const periodData = response.data;
      
      // Convert dates to DD-MM-YYYY format for display
      setPeriod({
        periodName: periodData.PERIOD_NAME || '',
        periodType: periodData.PERIOD_TYPE || 'MONTHLY',
        startDate: periodData.START_DATE ? convertToDDMMYYYY(periodData.START_DATE) : '',
        endDate: periodData.END_DATE ? convertToDDMMYYYY(periodData.END_DATE) : '',
        payDate: periodData.PAY_DATE ? convertToDDMMYYYY(periodData.PAY_DATE) : ''
      });
    } catch (error) {
      console.error('Error fetching period:', error);
      toast.error('Failed to fetch payroll period');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for date fields
    if (['startDate', 'endDate', 'payDate'].includes(name)) {
      // Allow only digits and hyphens
      const cleanedValue = value.replace(/[^\d-]/g, '');
      
      // Auto-format as user types
      let formattedValue = cleanedValue;
      if (cleanedValue.length >= 2 && !cleanedValue.includes('-')) {
        formattedValue = cleanedValue.slice(0, 2) + '-' + cleanedValue.slice(2);
      }
      if (formattedValue.length >= 5 && formattedValue.split('-').length === 2) {
        formattedValue = formattedValue.slice(0, 5) + '-' + formattedValue.slice(5);
      }
      
      // Validate the date format
      if (formattedValue.length === 10 && !validateDateFormat(formattedValue)) {
        setValidationErrors(prev => ({
          ...prev,
          [name]: 'Please enter a valid date in DD-MM-YYYY format'
        }));
      } else if (validationErrors[name]) {
        setValidationErrors(prev => ({
          ...prev,
          [name]: undefined
        }));
      }
      
      setPeriod(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      // Handle non-date fields normally
      setPeriod(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!period.periodName.trim()) {
      errors.periodName = 'Period name is required';
    }
    if (!period.startDate) {
      errors.startDate = 'Start date is required';
    } else if (!validateDateFormat(period.startDate)) {
      errors.startDate = 'Please enter a valid start date in DD-MM-YYYY format';
    }
    if (!period.endDate) {
      errors.endDate = 'End date is required';
    } else if (!validateDateFormat(period.endDate)) {
      errors.endDate = 'Please enter a valid end date in DD-MM-YYYY format';
    }
    if (!period.payDate) {
      errors.payDate = 'Pay date is required';
    } else if (!validateDateFormat(period.payDate)) {
      errors.payDate = 'Please enter a valid pay date in DD-MM-YYYY format';
    }
    
    // Date logic validation
    if (period.startDate && period.endDate && validateDateFormat(period.startDate) && validateDateFormat(period.endDate)) {
      const startDate = new Date(convertToYYYYMMDD(period.startDate));
      const endDate = new Date(convertToYYYYMMDD(period.endDate));
      if (startDate >= endDate) {
        errors.endDate = 'End date must be after start date';
      }
    }
    
    if (period.endDate && period.payDate && validateDateFormat(period.endDate) && validateDateFormat(period.payDate)) {
      const endDate = new Date(convertToYYYYMMDD(period.endDate));
      const payDate = new Date(convertToYYYYMMDD(period.payDate));
      if (payDate <= endDate) {
        errors.payDate = 'Pay date must be after end date';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Show first error message
      const firstError = Object.values(validationErrors)[0];
      if (firstError) {
        toast.error(firstError);
      }
      return;
    }

    try {
      setSaving(true);
      
      // Convert dates to YYYY-MM-DD format for backend
      const periodData = {
        ...period,
        startDate: convertToYYYYMMDD(period.startDate),
        endDate: convertToYYYYMMDD(period.endDate),
        payDate: convertToYYYYMMDD(period.payDate)
      };
      
      if (id) {
        // Update existing period
        await payrollAPI.updatePeriod(id, periodData);
        toast.success('Payroll period updated successfully');
      } else {
        // Create new period
        await payrollAPI.createPeriod(periodData);
        toast.success('Payroll period created successfully');
      }
      
      navigate('/payroll');
    } catch (error) {
      console.error('Error saving period:', error);
      toast.error(error.response?.data?.message || 'Failed to save payroll period');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/payroll');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleCancel}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {id ? 'Edit Payroll Period' : 'Create Payroll Period'}
            </h1>
            <p className="text-gray-600">
              {id ? 'Update payroll period details' : 'Set up a new payroll period'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Period Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period Name *
              </label>
              <input
                type="text"
                name="periodName"
                value={period.periodName}
                onChange={handleInputChange}
                placeholder="e.g., January 2024"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  validationErrors.periodName ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {validationErrors.periodName && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.periodName}</p>
              )}
            </div>

            {/* Period Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period Type *
              </label>
              <select
                name="periodType"
                value={period.periodType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                {periodTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="startDate"
                  value={period.startDate}
                  onChange={handleInputChange}
                  placeholder="DD-MM-YYYY (e.g., 01-01-2024)"
                  maxLength={10}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                    validationErrors.startDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              {validationErrors.startDate && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.startDate}</p>
              )}
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="endDate"
                  value={period.endDate}
                  onChange={handleInputChange}
                  placeholder="DD-MM-YYYY (e.g., 31-01-2024)"
                  maxLength={10}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                    validationErrors.endDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              {validationErrors.endDate && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.endDate}</p>
              )}
            </div>

            {/* Pay Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pay Date *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="payDate"
                  value={period.payDate}
                  onChange={handleInputChange}
                  placeholder="DD-MM-YYYY (e.g., 05-02-2024)"
                  maxLength={10}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                    validationErrors.payDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              {validationErrors.payDate && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.payDate}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  {id ? 'Update Period' : 'Create Period'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Guidelines</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Period name should be descriptive (e.g., "January 2024", "Q1 2024")</li>
          <li>• Start date should be the first day of the payroll period</li>
          <li>• End date should be the last day of the payroll period</li>
          <li>• Pay date should be after the end date (typically 5th of next month)</li>
          <li>• Monthly periods are most common for regular payroll processing</li>
          <li>• All dates must be in DD-MM-YYYY format (e.g., 25-12-2024)</li>
        </ul>
      </div>
    </div>
  );
};

export default PayrollPeriodForm; 
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  UserIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CalendarIcon,
  CheckIcon,
  TagIcon,
  MinusCircleIcon
} from '@heroicons/react/24/outline';
import { deductionAPI, employeeAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import currencyConfig from '../utils/currency';

const DeductionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    deductionType: '',
    deductionCategory: '',
    amount: '',
    reason: '',
    deductionDate: '',
    effectiveFromMonth: '',
    effectiveToMonth: '',
    isRecurring: 'N',
    recurringMonths: '',
    attachmentUrl: '',
    comments: ''
  });
  const [errors, setErrors] = useState({});
  const [backendErrors, setBackendErrors] = useState({});

  const deductionTypes = [
    { value: 'FINE', label: 'Fine' },
    { value: 'PENALTY', label: 'Penalty' },
    { value: 'SALARY_ADVANCE_RECOVERY', label: 'Salary Advance Recovery' },
    { value: 'LOAN_RECOVERY', label: 'Loan Recovery' },
    { value: 'MISCELLANEOUS', label: 'Miscellaneous' },
    { value: 'DISCIPLINARY', label: 'Disciplinary Action' },
    { value: 'ATTENDANCE', label: 'Attendance Deduction' },
    { value: 'OTHER', label: 'Other' }
  ];

  const deductionCategories = [
    { value: 'STATUTORY', label: 'Statutory' },
    { value: 'VOLUNTARY', label: 'Voluntary' },
    { value: 'RECOVERY', label: 'Recovery' },
    { value: 'PENALTY', label: 'Penalty' }
  ];

  // Date helper functions as per DATE_HANDLING_GUIDE.md
  // Convert any date format to DD-MM-YYYY for display
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

  // Convert DD-MM-YYYY to YYYY-MM-DD for backend
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
    
    return null;
  };

  // Validate DD-MM-YYYY format with proper date logic
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

  // Helper function to convert YYYY-MM format to DD-MM-YYYY for effective month display
  const convertMonthToDisplay = (monthStr) => {
    if (!monthStr) return '';
    // Convert "2025-07" to "01-07-2025" for display
    const [year, month] = monthStr.split('-');
    return `01-${month}-${year}`;
  };

  // Helper function to convert DD-MM-YYYY date to YYYY-MM format for database
  const convertDateToMonth = (dateStr) => {
    if (!dateStr) return '';
    // Convert DD-MM-YYYY to YYYY-MM
    const backendDate = convertToYYYYMMDD(dateStr);
    if (backendDate) {
      return backendDate.substring(0, 7);
    }
    return '';
  };

  const isEdit = !!id;

  useEffect(() => {
    if (isAuthenticated) {
      fetchEmployees();
      if (id) {
        fetchDeduction();
      }
    }
  }, [id, isAuthenticated]);

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getDropdown();
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    }
  };

  const fetchDeduction = async () => {
    try {
      console.log('🔍 Fetching deduction for edit, ID:', id);
      setLoading(true);
      const response = await deductionAPI.getById(id);
      const deduction = response.data;
      
      const formDataToSet = {
        employeeId: deduction.EMPLOYEE_ID?.toString() || '',
        deductionType: deduction.DEDUCTION_TYPE || '',
        deductionCategory: deduction.DEDUCTION_CATEGORY || '',
        amount: deduction.AMOUNT?.toString() || '',
        reason: deduction.REASON || '',
        deductionDate: convertToDDMMYYYY(deduction.DEDUCTION_DATE) || '',
        effectiveFromMonth: deduction.EFFECTIVE_FROM_MONTH || '',
        effectiveToMonth: convertToDDMMYYYY(convertMonthToDisplay(deduction.EFFECTIVE_TO_MONTH)) || '',
        isRecurring: deduction.IS_RECURRING || 'N',
        recurringMonths: deduction.RECURRING_MONTHS?.toString() || '',
        attachmentUrl: deduction.ATTACHMENT_URL || '',
        comments: deduction.COMMENTS || ''
      };
      
      setFormData(formDataToSet);
    } catch (error) {
      console.error('Error fetching deduction:', error);
      toast.error('Failed to fetch deduction details');
      navigate('/deductions');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for date fields
    if (['deductionDate', 'effectiveToMonth'].includes(name)) {
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
      
      // Limit to 10 characters (DD-MM-YYYY)
      if (formattedValue.length > 10) {
        formattedValue = formattedValue.slice(0, 10);
      }
      
      // Validate the date format
      if (formattedValue.length === 10 && !validateDateFormat(formattedValue)) {
        setErrors(prev => ({
          ...prev,
          [name]: 'Please enter a valid date in DD-MM-YYYY format'
        }));
      } else if (errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
      
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
      
      // Auto-populate effective from month based on deduction date
      if (name === 'deductionDate' && formattedValue.length === 10 && validateDateFormat(formattedValue)) {
        const backendDate = convertToYYYYMMDD(formattedValue);
        if (backendDate) {
          const date = new Date(backendDate);
          const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          setFormData(prev => ({ ...prev, effectiveFromMonth: monthYear }));
        }
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (backendErrors[name]) {
      setBackendErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Clear recurring months if not recurring
    if (name === 'isRecurring' && value === 'N') {
      setFormData(prev => ({ ...prev, recurringMonths: '' }));
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
    
    if (!formData.employeeId) {
      newErrors.employeeId = 'Employee is required';
    }
    
    if (!formData.deductionType) {
      newErrors.deductionType = 'Deduction type is required';
    }
    
    if (!formData.deductionCategory) {
      newErrors.deductionCategory = 'Deduction category is required';
    }
    
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (!formData.reason || formData.reason.trim().length < 10) {
      newErrors.reason = 'Reason is required (minimum 10 characters)';
    } else if (formData.reason.trim().length > 1000) {
      newErrors.reason = 'Reason cannot exceed 1000 characters';
    }
    
    if (!formData.deductionDate) {
      newErrors.deductionDate = 'Deduction date is required';
    }
    
    if (formData.isRecurring === 'Y') {
      if (!formData.recurringMonths) {
        newErrors.recurringMonths = 'Recurring months is required when recurring is enabled';
      } else if (parseInt(formData.recurringMonths) < 1 || parseInt(formData.recurringMonths) > 60) {
        newErrors.recurringMonths = 'Recurring months must be between 1 and 60';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous backend errors
    setBackendErrors({});
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare submit data with proper data types and date conversions
      const submitData = {
        employeeId: parseInt(formData.employeeId),
        deductionType: formData.deductionType,
        deductionCategory: formData.deductionCategory,
        amount: parseFloat(formData.amount),
        reason: formData.reason.trim(),
        deductionDate: convertToYYYYMMDD(formData.deductionDate),
        effectiveFromMonth: formData.effectiveFromMonth || (() => {
          const backendDate = convertToYYYYMMDD(formData.deductionDate);
          if (backendDate) {
            return backendDate.substring(0, 7);
          }
          return null;
        })(),
        effectiveToMonth: formData.effectiveToMonth ? convertDateToMonth(formData.effectiveToMonth) : null,
        isRecurring: formData.isRecurring,
        recurringMonths: formData.isRecurring === 'Y' && formData.recurringMonths ? parseInt(formData.recurringMonths) : null,
        attachmentUrl: formData.attachmentUrl || null,
        comments: formData.comments || null
      };

      if (isEdit) {
        await deductionAPI.update(id, submitData);
        toast.success('Deduction updated successfully');
      } else {
        await deductionAPI.create(submitData);
        toast.success('Deduction created successfully');
      }

      // Clear all errors on success
      setErrors({});
      setBackendErrors({});
      
      navigate('/deductions');
    } catch (error) {
      console.error('Error saving deduction:', error);
      
      // Clear any previous backend errors
      setBackendErrors({});
      
      let errorMessage = 'Failed to save deduction';
      
      // Show specific validation errors if available
      if (error.response?.data?.errors) {
        const { fieldErrors, generalErrors } = processBackendErrors(error.response.data.errors);
        
        // Set field-specific errors
        setBackendErrors(fieldErrors);
        
        // Show general errors as toast
        if (generalErrors.length > 0) {
          toast.error(`Validation errors: ${generalErrors.join(', ')}`);
        }
        
        // Show field errors as toast for immediate feedback
        const allErrors = Object.values(fieldErrors).concat(generalErrors);
        if (allErrors.length > 0) {
          toast.error(`Please fix the following errors: ${allErrors.join(', ')}`);
        }
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getSelectedEmployee = () => {
    return employees.find(emp => emp.EMPLOYEE_ID.toString() === formData.employeeId);
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Authentication Required</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please log in to access deduction management.
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
            to="/deductions"
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Deduction' : 'New Deduction'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEdit ? 'Update deduction details' : 'Create a new deduction record'}
            </p>
          </div>
        </div>
      </div>

      {/* Validation Summary */}
      {(Object.keys(errors).length > 0 || Object.keys(backendErrors).length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Please fix the following validation errors:
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserIcon className="h-4 w-4 inline mr-1" />
                Employee *
              </label>
              <select
                name="employeeId"
                value={formData.employeeId}
                onChange={handleInputChange}
                disabled={isEdit} // Don't allow changing employee on edit
                className={getFieldClasses('employeeId', `w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${isEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`)}
              >
                <option value="">Select Employee</option>
                {employees.map(employee => (
                  <option key={employee.EMPLOYEE_ID} value={employee.EMPLOYEE_ID}>
                    {employee.EMPLOYEE_CODE} - {employee.FIRST_NAME} {employee.LAST_NAME} ({employee.DESIGNATION})
                  </option>
                ))}
              </select>
              {getFieldError('employeeId') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('employeeId')}</p>
              )}
              {formData.employeeId && getSelectedEmployee() && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    <strong>Selected:</strong> {getSelectedEmployee().FIRST_NAME} {getSelectedEmployee().LAST_NAME} 
                    ({getSelectedEmployee().EMPLOYEE_CODE}) - {getSelectedEmployee().DESIGNATION}
                  </p>
                </div>
              )}
            </div>

            {/* Deduction Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TagIcon className="h-4 w-4 inline mr-1" />
                Deduction Type *
              </label>
              <select
                name="deductionType"
                value={formData.deductionType}
                onChange={handleInputChange}
                className={getFieldClasses('deductionType', 'w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500')}
              >
                <option value="">Select Type</option>
                {deductionTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {getFieldError('deductionType') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('deductionType')}</p>
              )}
            </div>

            {/* Deduction Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MinusCircleIcon className="h-4 w-4 inline mr-1" />
                Deduction Category *
              </label>
              <select
                name="deductionCategory"
                value={formData.deductionCategory}
                onChange={handleInputChange}
                className={getFieldClasses('deductionCategory', 'w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500')}
              >
                <option value="">Select Category</option>
                {deductionCategories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              {getFieldError('deductionCategory') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('deductionCategory')}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                Amount ({currencyConfig.getSymbol()}) *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className={getFieldClasses('amount', 'w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500')}
              />
              {getFieldError('amount') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('amount')}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Enter the total deduction amount in INR</p>
            </div>

            {/* Deduction Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Deduction Date *
              </label>
              <input
                type="text"
                name="deductionDate"
                value={formData.deductionDate}
                onChange={handleInputChange}
                placeholder="DD-MM-YYYY (e.g., 25-12-1990)"
                maxLength={10}
                className={getFieldClasses('deductionDate', 'w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500')}
              />
              {getFieldError('deductionDate') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('deductionDate')}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Effective month will be auto-populated from this date</p>
            </div>

            {/* Is Recurring and Effective To Date (when not recurring) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Recurring Deduction
              </label>
              <select
                name="isRecurring"
                value={formData.isRecurring}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="N">No</option>
                <option value="Y">Yes</option>
              </select>
            </div>

            {/* Effective To Date (when not recurring) */}
            {formData.isRecurring === 'N' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Effective To Date
                </label>
                <input
                  type="text"
                  name="effectiveToMonth"
                  value={formData.effectiveToMonth}
                  onChange={handleInputChange}
                  placeholder="DD-MM-YYYY (e.g., 25-12-1990)"
                  maxLength={10}
                  className={getFieldClasses('effectiveToMonth', 'w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500')}
                />
                {getFieldError('effectiveToMonth') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('effectiveToMonth')}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Optional: End date for the deduction period</p>
              </div>
            )}

            {/* Recurring Months (when recurring) */}
            {formData.isRecurring === 'Y' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Recurring Months *
                </label>
                <input
                  type="number"
                  name="recurringMonths"
                  value={formData.recurringMonths}
                  onChange={handleInputChange}
                  min="1"
                  max="60"
                  placeholder="Enter number of months"
                  className={getFieldClasses('recurringMonths', 'w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500')}
                />
                {getFieldError('recurringMonths') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('recurringMonths')}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Maximum 60 months (5 years)</p>
              </div>
            )}

            {/* Effective To Date (when recurring - next row) */}
            {formData.isRecurring === 'Y' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Effective To Date
                </label>
                <input
                  type="text"
                  name="effectiveToMonth"
                  value={formData.effectiveToMonth}
                  onChange={handleInputChange}
                  placeholder="DD-MM-YYYY (e.g., 25-12-1990)"
                  maxLength={10}
                  className={getFieldClasses('effectiveToMonth', 'w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500')}
                />
                {getFieldError('effectiveToMonth') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('effectiveToMonth')}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Optional: End date for the deduction period</p>
              </div>
            )}

            {/* Attachment URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                Attachment URL
              </label>
              <input
                type="url"
                name="attachmentUrl"
                value={formData.attachmentUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/document.pdf"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">Optional: Link to supporting document</p>
            </div>

            {/* Hidden fields */}
            <input type="hidden" name="effectiveFromMonth" value={formData.effectiveFromMonth} />
            <input type="hidden" name="comments" value={formData.comments} />

            {/* Reason */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                Reason *
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                rows={3}
                maxLength={1000}
                placeholder="Provide detailed reason for the deduction..."
                className={getFieldClasses('reason', 'w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500')}
              />
              {getFieldError('reason') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('reason')}</p>
              )}
              <div className="mt-1 flex justify-between">
                <p className="text-xs text-gray-500">Minimum 10 characters required</p>
                <p className="text-xs text-gray-500">
                  {formData.reason.length}/1000 characters
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Link
            to="/deductions"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </Link>
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
                {isEdit ? 'Update Deduction' : 'Create Deduction'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DeductionForm; 
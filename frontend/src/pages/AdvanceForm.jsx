import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  UserIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CalendarIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { advanceAPI, employeeAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import currencyConfig from '../utils/currency';

const AdvanceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    advanceType: '',
    amount: '',
    reason: '',
    amountRequiredOnDate: '',
    deductionMonth: ''
  });
  const [errors, setErrors] = useState({});

  const advanceTypes = [
    { value: 'SALARY', label: 'Salary Advance' },
    { value: 'TRAVEL', label: 'Travel Advance' },
    { value: 'MEDICAL', label: 'Medical Advance' },
    { value: 'EDUCATION', label: 'Education Advance' },
    { value: 'HOUSING', label: 'Housing Advance' },
    { value: 'OTHER', label: 'Other' }
  ];

  // Generate deduction month options for 2025
  const deductionMonths = [
    { value: 'Jan-2025', label: 'January 2025' },
    { value: 'Feb-2025', label: 'February 2025' },
    { value: 'Mar-2025', label: 'March 2025' },
    { value: 'Apr-2025', label: 'April 2025' },
    { value: 'May-2025', label: 'May 2025' },
    { value: 'Jun-2025', label: 'June 2025' },
    { value: 'Jul-2025', label: 'July 2025' },
    { value: 'Aug-2025', label: 'August 2025' },
    { value: 'Sep-2025', label: 'September 2025' },
    { value: 'Oct-2025', label: 'October 2025' },
    { value: 'Nov-2025', label: 'November 2025' },
    { value: 'Dec-2025', label: 'December 2025' }
  ];

  useEffect(() => {
    if (isAuthenticated) {
      fetchEmployees();
      if (id) {
        fetchAdvance();
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

  // Date format conversion helpers
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
    if (!dateString || dateString === '') return '';
    
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
    
    return '';
  };

  const fetchAdvance = async () => {
    try {
      setLoading(true);
      const response = await advanceAPI.getById(id);
      const advance = response.data;
      
      setFormData({
        employeeId: advance.EMPLOYEE_ID?.toString() || '',
        advanceType: advance.ADVANCE_TYPE || '',
        amount: advance.AMOUNT?.toString() || '',
        reason: advance.REASON || '',
        amountRequiredOnDate: advance.AMOUNT_REQUIRED_ON_DATE ? convertToDDMMYYYY(advance.AMOUNT_REQUIRED_ON_DATE) : '',
        deductionMonth: advance.DEDUCTION_MONTH || ''
      });
    } catch (error) {
      console.error('Error fetching advance:', error);
      toast.error('Failed to fetch advance details');
      navigate('/advances');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleDateChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    // Auto-format as DD-MM-YYYY
    if (value.length <= 2) {
      // Just day
      value = value;
    } else if (value.length <= 4) {
      // Day and month
      value = value.slice(0, 2) + '-' + value.slice(2);
    } else if (value.length <= 8) {
      // Day, month and year
      value = value.slice(0, 2) + '-' + value.slice(2, 4) + '-' + value.slice(4, 8);
    } else {
      // Limit to 8 digits (DDMMYYYY)
      value = value.slice(0, 2) + '-' + value.slice(2, 4) + '-' + value.slice(4, 8);
    }
    
    setFormData(prev => ({
      ...prev,
      amountRequiredOnDate: value
    }));
    
    // Clear error when user starts typing
    if (errors.amountRequiredOnDate) {
      setErrors(prev => ({
        ...prev,
        amountRequiredOnDate: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.employeeId) {
      newErrors.employeeId = 'Employee is required';
    }

    if (!formData.advanceType) {
      newErrors.advanceType = 'Advance type is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    }

    // Validate date format if provided
    if (formData.amountRequiredOnDate && formData.amountRequiredOnDate.trim()) {
      const dateValue = formData.amountRequiredOnDate.trim();
      if (!/^\d{2}-\d{2}-\d{4}$/.test(dateValue)) {
        newErrors.amountRequiredOnDate = 'Date must be in DD-MM-YYYY format (e.g., 31-12-2024)';
      } else {
        // Validate if it's a valid date
        const [day, month, year] = dateValue.split('-');
        const dayNum = parseInt(day, 10);
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);
        
        // Basic range validation
        if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
          newErrors.amountRequiredOnDate = 'Please enter a valid date';
        } else {
          // Check if date actually exists
          const date = new Date(yearNum, monthNum - 1, dayNum);
          if (date.getDate() !== dayNum || date.getMonth() !== monthNum - 1 || date.getFullYear() !== yearNum) {
            newErrors.amountRequiredOnDate = 'Please enter a valid date';
          }
        }
      }
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      
      const submitData = {
        employeeId: parseInt(formData.employeeId),
        advanceType: formData.advanceType,
        amount: parseFloat(formData.amount),
        reason: formData.reason,
        amountRequiredOnDate: formData.amountRequiredOnDate ? convertToYYYYMMDD(formData.amountRequiredOnDate) : null,
        deductionMonth: formData.deductionMonth || null
      };

      if (id) {
        await advanceAPI.update(id, submitData);
        toast.success('Advance updated successfully');
      } else {
        await advanceAPI.create(submitData);
        toast.success('Advance created successfully');
      }
      
      navigate('/advances');
    } catch (error) {
      console.error('Error saving advance:', error);
      toast.error(error.response?.data?.message || 'Failed to save advance');
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
          Please log in to access advance management.
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
            to="/advances"
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {id ? 'Edit Advance' : 'New Advance'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {id ? 'Update advance request details' : 'Create a new advance request'}
            </p>
          </div>
        </div>
      </div>

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
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.employeeId ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={id} // Cannot change employee for existing advance
              >
                <option value="">Select Employee</option>
                {employees.map(employee => (
                  <option key={employee.EMPLOYEE_ID} value={employee.EMPLOYEE_ID}>
                    {employee.EMPLOYEE_CODE} - {employee.FIRST_NAME} {employee.LAST_NAME} ({employee.DESIGNATION})
                  </option>
                ))}
              </select>
              {errors.employeeId && (
                <p className="mt-1 text-sm text-red-600">{errors.employeeId}</p>
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

            {/* Advance Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                Advance Type *
              </label>
              <select
                name="advanceType"
                value={formData.advanceType}
                onChange={handleInputChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.advanceType ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Type</option>
                {advanceTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.advanceType && (
                <p className="mt-1 text-sm text-red-600">{errors.advanceType}</p>
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
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            {/* Amount Required on Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Amount Required on Date
              </label>
              <input
                type="text"
                name="amountRequiredOnDate"
                value={formData.amountRequiredOnDate || ''}
                onChange={handleDateChange}
                placeholder="DD-MM-YYYY"
                maxLength="10"
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.amountRequiredOnDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <p className="mt-1 text-xs text-gray-500">Format: DD-MM-YYYY (e.g., 31-12-2024)</p>
              {errors.amountRequiredOnDate && (
                <p className="mt-1 text-sm text-red-600">{errors.amountRequiredOnDate}</p>
              )}
            </div>

            {/* Deduction Month */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Amount to be deducted in month of payroll
              </label>
              <select
                name="deductionMonth"
                value={formData.deductionMonth}
                onChange={handleInputChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.deductionMonth ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Month</option>
                {deductionMonths.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              {errors.deductionMonth && (
                <p className="mt-1 text-sm text-red-600">{errors.deductionMonth}</p>
              )}
            </div>

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
                placeholder="Please provide a detailed reason for the advance request..."
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.reason ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
              )}
            </div>


          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Link
            to="/advances"
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
                {id ? 'Update Advance' : 'Create Advance'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdvanceForm; 
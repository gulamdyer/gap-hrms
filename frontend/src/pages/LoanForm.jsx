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
import { loanAPI, employeeAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import currencyConfig from '../utils/currency';

const LoanForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    loanType: '',
    loanAmount: '',
    totalMonths: '',
    monthlyDeductionAmount: '',
    reason: '',
    firstDeductionMonth: '',
    lastDeductionMonth: ''
  });
  const [errors, setErrors] = useState({});

  const loanTypes = [
    { value: 'PERSONAL', label: 'Personal Loan' },
    { value: 'HOME', label: 'Home Loan' },
    { value: 'VEHICLE', label: 'Vehicle Loan' },
    { value: 'EDUCATION', label: 'Education Loan' },
    { value: 'MEDICAL', label: 'Medical Loan' },
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
        fetchLoan();
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

  const fetchLoan = async () => {
    try {
      setLoading(true);
      const response = await loanAPI.getById(id);
      const loan = response.data;
      
      setFormData({
        employeeId: loan.EMPLOYEE_ID?.toString() || '',
        loanType: loan.LOAN_TYPE || '',
        loanAmount: loan.LOAN_AMOUNT?.toString() || '',
        totalMonths: loan.TOTAL_MONTHS?.toString() || '',
        monthlyDeductionAmount: loan.MONTHLY_DEDUCTION_AMOUNT?.toString() || '',
        reason: loan.REASON || '',
        firstDeductionMonth: loan.FIRST_DEDUCTION_MONTH || '',
        lastDeductionMonth: '' // Will be calculated automatically
      });
    } catch (error) {
      console.error('Error fetching loan:', error);
      toast.error('Failed to fetch loan details');
      navigate('/loans');
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

    // Auto-calculate based on user input
    if (name === 'loanAmount' || name === 'monthlyDeductionAmount' || name === 'totalMonths') {
      calculateFields(name, value);
    }
    
    // Auto-calculate Last Deduction Month when First Deduction Month or Total Months changes
    if (name === 'firstDeductionMonth' || name === 'totalMonths') {
      const calculatedLastMonth = calculateLastDeductionMonth();
      if (calculatedLastMonth) {
        setFormData(prev => ({
          ...prev,
          lastDeductionMonth: calculatedLastMonth
        }));
      }
    }
  };

  const calculateFields = (changedField, value) => {
    const loanAmount = parseFloat(formData.loanAmount) || 0;
    const monthlyDeduction = parseFloat(formData.monthlyDeductionAmount) || 0;
    const totalMonths = parseInt(formData.totalMonths) || 0;

    if (changedField === 'monthlyDeductionAmount' && value && loanAmount) {
      // If user inputs monthly deduction, calculate total months
      const calculatedMonths = Math.ceil(loanAmount / parseFloat(value));
      setFormData(prev => ({
        ...prev,
        totalMonths: calculatedMonths.toString()
      }));
    } else if (changedField === 'totalMonths' && value && loanAmount) {
      // If user inputs total months, calculate monthly deduction
      const calculatedMonthlyDeduction = (loanAmount / parseInt(value)).toFixed(2);
      setFormData(prev => ({
        ...prev,
        monthlyDeductionAmount: calculatedMonthlyDeduction
      }));
    } else if (changedField === 'loanAmount' && value) {
      // If user changes loan amount, recalculate based on what's already filled
      if (monthlyDeduction > 0) {
        const calculatedMonths = Math.ceil(parseFloat(value) / monthlyDeduction);
        setFormData(prev => ({
          ...prev,
          totalMonths: calculatedMonths.toString()
        }));
      } else if (totalMonths > 0) {
        const calculatedMonthlyDeduction = (parseFloat(value) / totalMonths).toFixed(2);
        setFormData(prev => ({
          ...prev,
          monthlyDeductionAmount: calculatedMonthlyDeduction
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.employeeId) {
      newErrors.employeeId = 'Employee is required';
    }

    if (!formData.loanType) {
      newErrors.loanType = 'Loan type is required';
    }

    if (!formData.loanAmount || parseFloat(formData.loanAmount) <= 0) {
      newErrors.loanAmount = 'Loan amount must be greater than 0';
    }

    if (!formData.monthlyDeductionAmount || parseFloat(formData.monthlyDeductionAmount) <= 0) {
      newErrors.monthlyDeductionAmount = 'Monthly deduction amount must be greater than 0';
    }

    if (!formData.totalMonths || parseInt(formData.totalMonths) <= 0) {
      newErrors.totalMonths = 'Total months must be greater than 0';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    }

    // Validate that monthly deduction * total months doesn't exceed loan amount
    if (formData.monthlyDeductionAmount && formData.totalMonths && formData.loanAmount) {
      const totalDeduction = parseFloat(formData.monthlyDeductionAmount) * parseInt(formData.totalMonths);
      const loanAmount = parseFloat(formData.loanAmount);
      
      if (totalDeduction > loanAmount) {
        newErrors.monthlyDeductionAmount = 'Total deduction amount cannot exceed loan amount';
      }
    }

    // Validate first deduction month is selected if total months is provided
    if (formData.totalMonths && !formData.firstDeductionMonth) {
      newErrors.firstDeductionMonth = 'First deduction month is required when total months is specified';
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
        loanType: formData.loanType,
        loanAmount: parseFloat(formData.loanAmount),
        totalMonths: parseInt(formData.totalMonths),
        monthlyDeductionAmount: parseFloat(formData.monthlyDeductionAmount),
        reason: formData.reason,
        firstDeductionMonth: formData.firstDeductionMonth || null,
        lastDeductionMonth: calculateLastDeductionMonth() || null
      };

      if (id) {
        await loanAPI.update(id, submitData);
        toast.success('Loan updated successfully');
      } else {
        await loanAPI.create(submitData);
        toast.success('Loan created successfully');
      }
      
      navigate('/loans');
    } catch (error) {
      console.error('Error saving loan:', error);
      toast.error(error.response?.data?.message || 'Failed to save loan');
    } finally {
      setSubmitting(false);
    }
  };

  const getSelectedEmployee = () => {
    return employees.find(emp => emp.EMPLOYEE_ID.toString() === formData.employeeId);
  };

  const calculateLastDeductionMonth = () => {
    if (!formData.firstDeductionMonth || !formData.totalMonths) {
      return '';
    }
    
    // Parse the first deduction month (e.g., "Jan-2025")
    const monthMap = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    const [monthStr, yearStr] = formData.firstDeductionMonth.split('-');
    const month = monthMap[monthStr];
    const year = parseInt(yearStr);
    const totalMonths = parseInt(formData.totalMonths);
    
    if (month === undefined || isNaN(year) || isNaN(totalMonths)) {
      return '';
    }
    
    // Calculate the last deduction month
    const totalMonthsFromStart = month + totalMonths - 1; // -1 because first month is included
    const lastYear = year + Math.floor(totalMonthsFromStart / 12);
    const lastMonth = totalMonthsFromStart % 12;
    
    // Convert back to month string
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return `${monthNames[lastMonth]}-${lastYear}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Authentication Required</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please log in to access loan management.
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
            to="/loans"
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {id ? 'Edit Loan' : 'New Loan'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {id ? 'Update loan request details' : 'Create a new loan request'}
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
                disabled={id} // Cannot change employee for existing loan
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

            {/* Loan Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                Loan Type *
              </label>
              <select
                name="loanType"
                value={formData.loanType}
                onChange={handleInputChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.loanType ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Type</option>
                {loanTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.loanType && (
                <p className="mt-1 text-sm text-red-600">{errors.loanType}</p>
              )}
            </div>

            {/* Loan Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                Loan Amount ({currencyConfig.getSymbol()}) *
              </label>
              <input
                type="number"
                name="loanAmount"
                value={formData.loanAmount}
                onChange={handleInputChange}
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.loanAmount ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.loanAmount && (
                <p className="mt-1 text-sm text-red-600">{errors.loanAmount}</p>
              )}
            </div>

            {/* Total Months */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Total Months *
              </label>
              <input
                type="number"
                name="totalMonths"
                value={formData.totalMonths}
                onChange={handleInputChange}
                min="1"
                max="120"
                placeholder="12"
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.totalMonths ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.totalMonths && (
                <p className="mt-1 text-sm text-red-600">{errors.totalMonths}</p>
              )}
            </div>

            {/* Monthly Deduction Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                Monthly Deduction Amount ({currencyConfig.getSymbol()}) *
              </label>
              <input
                type="number"
                name="monthlyDeductionAmount"
                value={formData.monthlyDeductionAmount}
                onChange={handleInputChange}
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.monthlyDeductionAmount ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.monthlyDeductionAmount && (
                <p className="mt-1 text-sm text-red-600">{errors.monthlyDeductionAmount}</p>
              )}
            </div>

            {/* First Deduction Month */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                First Deduction Month
              </label>
              <select
                name="firstDeductionMonth"
                value={formData.firstDeductionMonth}
                onChange={handleInputChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.firstDeductionMonth ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Month</option>
                {deductionMonths.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              {errors.firstDeductionMonth && (
                <p className="mt-1 text-sm text-red-600">{errors.firstDeductionMonth}</p>
              )}
            </div>

            {/* Last Deduction Month */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Last Deduction Month
              </label>
              <input
                type="text"
                value={calculateLastDeductionMonth()}
                readOnly
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">Auto-calculated: First Deduction Month + Total Months</p>
            </div>

            {/* Repaid Amount (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                Repaid Amount ({currencyConfig.getSymbol()})
              </label>
              <input
                type="text"
                value=""
                readOnly
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">Value will be populated from database</p>
            </div>

            {/* Balance Amount (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                Balance Amount ({currencyConfig.getSymbol()})
              </label>
              <input
                type="text"
                value=""
                readOnly
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">Value will be populated from database</p>
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
                placeholder="Please provide a detailed reason for the loan request..."
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
            to="/loans"
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
                {id ? 'Update Loan' : 'Create Loan'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoanForm; 
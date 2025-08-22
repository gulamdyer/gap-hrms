import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  PaperClipIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { leaveResumptionAPI, leaveAPI, employeeAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const LeaveResumptionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const isEditing = Boolean(id);
  
  // Get leaveId from location state or URL params
  const leaveIdFromState = location.state?.leaveId;
  const [leaveId, setLeaveId] = useState(leaveIdFromState || '');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    leaveId: leaveIdFromState || '',
    employeeId: '',
    plannedResumptionDate: '',
    actualResumptionDate: '',
    reason: '',
    attachmentUrl: ''
  });

  const [dropdownData, setDropdownData] = useState({
    eligibleLeaves: [],
    employees: []
  });

  const [selectedLeave, setSelectedLeave] = useState(null);
  const [errors, setErrors] = useState({});

  // Date conversion functions (following DATE_HANDLING_GUIDE.md)
  const convertToDDMMYYYY = (dateString) => {
    if (!dateString || dateString === '') return '';
    
    // If already in DD-MM-YYYY format
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      return dateString;
    }
    
    // If in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return `${day}-${month}-${year}`;
    }
    
    // Try to parse as date object
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
    
    // If already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // If in DD-MM-YYYY format
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('-');
      return `${year}-${month}-${day}`;
    }
    
    return null;
  };

  const validateDateFormat = (dateString) => {
    if (!dateString || dateString === '') return true;
    
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
    
    // Days in month validation
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (monthNum === 2 && yearNum % 4 === 0 && (yearNum % 100 !== 0 || yearNum % 400 === 0)) {
      daysInMonth[1] = 29; // Leap year
    }
    
    return dayNum <= daysInMonth[monthNum - 1];
  };

  // Format date as user types
  const formatDateInput = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Apply DD-MM-YYYY format
    if (digits.length >= 2) {
      if (digits.length >= 4) {
        return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 8)}`;
      } else {
        return `${digits.slice(0, 2)}-${digits.slice(2)}`;
      }
    }
    
    return digits;
  };

  // Fetch dropdown data
  const fetchDropdownData = useCallback(async () => {
    try {
      console.log('🔄 Loading dropdown data...');
      setLoading(true);
      
      const [eligibleLeavesRes, employeesRes] = await Promise.all([
        leaveResumptionAPI.getEligibleLeaves(),
        employeeAPI.getAll()
      ]);

      console.log('📋 Eligible leaves response:', eligibleLeavesRes);
      console.log('👥 Employees response:', employeesRes);

      const eligibleLeaves = eligibleLeavesRes?.data || [];
      const employees = employeesRes?.data || [];

      setDropdownData({
        eligibleLeaves,
        employees
      });

      console.log('✅ Dropdown data loaded successfully:', {
        eligibleLeavesCount: eligibleLeaves.length,
        employeesCount: employees.length
      });

      // Show message if no eligible leaves
      if (eligibleLeaves.length === 0) {
        toast.error('No approved leaves found that are eligible for resumption');
      }
      
    } catch (error) {
      console.error('❌ Error loading dropdown data:', error);
      setErrors({ general: 'Failed to load form data. Please try again.' });
      toast.error('Failed to load form data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch resumption data for editing
  const fetchResumptionData = useCallback(async () => {
    if (!isEditing || !id) return;

    try {
      console.log('🔄 Loading resumption data for editing...');
      const response = await leaveResumptionAPI.getById(id);
      
      if (response.success) {
        const resumption = response.data;
        console.log('📝 Resumption data:', resumption);
        
        setFormData({
          leaveId: resumption.LEAVE_ID,
          employeeId: resumption.EMPLOYEE_ID,
          plannedResumptionDate: convertToDDMMYYYY(resumption.PLANNED_RESUMPTION_DATE),
          actualResumptionDate: convertToDDMMYYYY(resumption.ACTUAL_RESUMPTION_DATE),
          reason: resumption.REASON || '',
          attachmentUrl: resumption.ATTACHMENT_URL || ''
        });
        
        setLeaveId(resumption.LEAVE_ID);
        console.log('✅ Resumption data loaded for editing');
      }
    } catch (error) {
      console.error('❌ Error loading resumption data:', error);
      setErrors({ general: 'Failed to load resumption data' });
    }
  }, [id, isEditing]);

  // Load leave details when leaveId changes
  const loadLeaveDetails = useCallback(async (selectedLeaveId) => {
    if (!selectedLeaveId) return;

    try {
      console.log('🔄 Loading leave details for ID:', selectedLeaveId);
      const response = await leaveAPI.getById(selectedLeaveId);
      
      if (response.success) {
        const leave = response.data;
        console.log('📋 Leave details:', leave);
        
        setSelectedLeave(leave);
        setFormData(prev => ({
          ...prev,
          employeeId: leave.EMPLOYEE_ID,
          plannedResumptionDate: convertToDDMMYYYY(leave.END_DATE)
        }));
        
        console.log('✅ Leave details loaded');
      }
    } catch (error) {
      console.error('❌ Error loading leave details:', error);
    }
  }, []);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`📝 Field changed: ${name} = ${value}`);

    if (name === 'plannedResumptionDate' || name === 'actualResumptionDate') {
      const formattedValue = formatDateInput(value);
      console.log(`📅 Formatted ${name}:`, formattedValue);
      
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));

      // Clear date-specific errors
      if (errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: null
        }));
      }
    } else if (name === 'leaveId') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      setLeaveId(value);
      loadLeaveDetails(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear general errors
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.leaveId) {
      newErrors.leaveId = 'Please select a leave';
    }

    if (!formData.employeeId) {
      newErrors.employeeId = 'Employee is required';
    }

    if (!formData.plannedResumptionDate) {
      newErrors.plannedResumptionDate = 'Planned resumption date is required';
    } else if (!validateDateFormat(formData.plannedResumptionDate)) {
      newErrors.plannedResumptionDate = 'Please enter a valid date in DD-MM-YYYY format';
    }

    if (!formData.actualResumptionDate) {
      newErrors.actualResumptionDate = 'Actual resumption date is required';
    } else if (!validateDateFormat(formData.actualResumptionDate)) {
      newErrors.actualResumptionDate = 'Please enter a valid date in DD-MM-YYYY format';
    }

    // Validate date logic
    if (formData.plannedResumptionDate && formData.actualResumptionDate && 
        validateDateFormat(formData.plannedResumptionDate) && 
        validateDateFormat(formData.actualResumptionDate)) {
      
      const plannedDate = new Date(convertToYYYYMMDD(formData.plannedResumptionDate));
      const actualDate = new Date(convertToYYYYMMDD(formData.actualResumptionDate));
      
      if (selectedLeave) {
        const leaveStartDate = new Date(selectedLeave.START_DATE);
        
        if (actualDate <= leaveStartDate) {
          newErrors.actualResumptionDate = 'Resumption date cannot be before or on leave start date';
        }
      }
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    }

    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🚀 Form submission started');

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      if (validationErrors.general) {
        toast.error(validationErrors.general);
      }
      console.log('❌ Validation errors:', validationErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const submitData = {
        leaveId: parseInt(formData.leaveId),
        employeeId: parseInt(formData.employeeId),
        plannedResumptionDate: convertToYYYYMMDD(formData.plannedResumptionDate),
        actualResumptionDate: convertToYYYYMMDD(formData.actualResumptionDate),
        reason: formData.reason.trim(),
        attachmentUrl: formData.attachmentUrl?.trim() || null
      };

      console.log('📤 Submitting resumption data:', submitData);

      if (isEditing) {
        await leaveResumptionAPI.update(id, submitData);
        toast.success('Leave resumption updated successfully');
      } else {
        await leaveResumptionAPI.create(submitData);
        toast.success('Leave resumption applied successfully');
      }

      navigate('/leave-resumptions');
    } catch (error) {
      console.error('❌ Error saving resumption:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save leave resumption';
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      await fetchDropdownData();
      if (isEditing) {
        await fetchResumptionData();
      } else if (leaveIdFromState) {
        await loadLeaveDetails(leaveIdFromState);
      }
    };

    loadData();
  }, [fetchDropdownData, fetchResumptionData, isEditing, leaveIdFromState, loadLeaveDetails]);

  // Check authentication
  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Authentication Required</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please log in to access leave resumption management.
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

  const getSelectedEmployee = () => {
    return dropdownData.employees.find(emp => emp.EMPLOYEE_ID.toString() === formData.employeeId);
  };

  const getSelectedLeave = () => {
    return dropdownData.eligibleLeaves.find(leave => leave.LEAVE_ID.toString() === formData.leaveId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/leave-resumptions"
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Leave Resumption' : 'Apply for Leave Resumption'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEditing ? 'Update leave resumption details' : 'Apply for returning to work from approved leave'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{errors.general}</p>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Leave Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Leave Request <span className="text-red-500">*</span>
              </label>
              <select
                name="leaveId"
                value={formData.leaveId}
                onChange={handleChange}
                disabled={isEditing || leaveIdFromState}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.leaveId ? 'border-red-500' : 'border-gray-300'
                } ${(isEditing || leaveIdFromState) ? 'bg-gray-100' : ''}`}
              >
                <option value="">Select a leave request</option>
                {dropdownData.eligibleLeaves.map((leave) => (
                  <option key={leave.LEAVE_ID} value={leave.LEAVE_ID}>
                    {leave.EMPLOYEE_FIRST_NAME} {leave.EMPLOYEE_LAST_NAME} - {leave.LEAVE_TYPE} 
                    ({convertToDDMMYYYY(leave.START_DATE)} to {convertToDDMMYYYY(leave.END_DATE)})
                  </option>
                ))}
              </select>
              {errors.leaveId && (
                <p className="mt-1 text-sm text-red-600">{errors.leaveId}</p>
              )}
              {formData.leaveId && getSelectedLeave() && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    <strong>Selected:</strong> {getSelectedLeave().LEAVE_TYPE} leave from{' '}
                    {convertToDDMMYYYY(getSelectedLeave().START_DATE)} to{' '}
                    {convertToDDMMYYYY(getSelectedLeave().END_DATE)}
                  </p>
                </div>
              )}
            </div>

            {/* Employee (Auto-filled) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserIcon className="h-4 w-4 inline mr-1" />
                Employee <span className="text-red-500">*</span>
              </label>
              <select
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                disabled={true}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 focus:outline-none"
              >
                <option value="">Select employee</option>
                {dropdownData.employees.map((employee) => (
                  <option key={employee.EMPLOYEE_ID} value={employee.EMPLOYEE_ID}>
                    {employee.FIRST_NAME} {employee.LAST_NAME} ({employee.EMPLOYEE_CODE}) - {employee.DESIGNATION}
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

            {/* Date Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ClockIcon className="h-4 w-4 inline mr-1" />
                Planned Resumption Date <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="plannedResumptionDate"
                value={formData.plannedResumptionDate}
                onChange={handleChange}
                placeholder="DD-MM-YYYY (e.g., 25-12-2024)"
                maxLength={10}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.plannedResumptionDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.plannedResumptionDate && (
                <p className="mt-1 text-sm text-red-600">{errors.plannedResumptionDate}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Format: DD-MM-YYYY (e.g., 31-12-2024)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Actual Resumption Date <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="actualResumptionDate"
                value={formData.actualResumptionDate}
                onChange={handleChange}
                placeholder="DD-MM-YYYY (e.g., 23-12-2024)"
                maxLength={10}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.actualResumptionDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.actualResumptionDate && (
                <p className="mt-1 text-sm text-red-600">{errors.actualResumptionDate}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">When you will actually resume work</p>
            </div>

            {/* Reason */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows={4}
                placeholder="Please provide reason for early/late resumption or any other relevant details..."
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.reason ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
              )}
            </div>

            {/* Attachment URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <PaperClipIcon className="h-4 w-4 inline mr-1" />
                Attachment URL
              </label>
              <input
                type="url"
                name="attachmentUrl"
                value={formData.attachmentUrl}
                onChange={handleChange}
                placeholder="https://example.com/medical-certificate.pdf"
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.attachmentUrl ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.attachmentUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.attachmentUrl}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Optional: Medical certificate, manager approval email, etc.
              </p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/leave-resumptions')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : (isEditing ? 'Update Resumption' : 'Apply for Resumption')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LeaveResumptionForm; 
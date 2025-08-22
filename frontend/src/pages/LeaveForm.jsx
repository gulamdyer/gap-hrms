import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
  PaperClipIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { leaveAPI, settingsAPI } from '../services/api';

const LeaveForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveType: '',
    availableDays: '',
    startDate: '',
    endDate: '',
    totalDays: '',
    reason: '',
    attachmentUrl: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [dropdownData, setDropdownData] = useState({
    employees: [],
    leavePolicies: []
  });

  // Fetch form data for dropdowns
  const fetchFormData = async () => {
    try {
      console.log('🔄 Fetching form data...');
      
      // Fetch employees separately
      const employeesResponse = await leaveAPI.getFormData();
      console.log('📋 Employees response:', employeesResponse);
      
      // Fetch policies separately  
      const leavePoliciesResponse = await settingsAPI.getLeavePoliciesForDropdown();
      console.log('📋 Leave policies response:', leavePoliciesResponse);
      

      
      // Extract employees data (correct path: response.data.employees)
      const employeesData = employeesResponse?.data?.employees || [];
      console.log('✅ Extracted employees:', employeesData);
      console.log('✅ Employees count:', employeesData.length);
      
      // Extract policies data (correct path: response.data)
      const policiesData = leavePoliciesResponse?.data || [];
      console.log('✅ Extracted policies:', policiesData);
      console.log('✅ Policies count:', policiesData.length);
      console.log('✅ First policy:', policiesData[0]);
      
      // Set both data at once
      setDropdownData({
        employees: employeesData,
        leavePolicies: policiesData
      });
      
      console.log('✅ Final dropdown data set:', { 
        employees: employeesData, 
        leavePolicies: policiesData 
      });
      
      return { employees: employeesData, leavePolicies: policiesData };
    } catch (error) {
      console.error('❌ Error fetching form data:', error);
      toast.error('Failed to fetch form data');
      throw error;
    }
  };

  // Fetch leave data for editing
  const fetchLeaveData = React.useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching leave data for ID:', id);
      
      const response = await leaveAPI.getById(id);
      console.log('📋 Leave API response:', response);
      
      if (response.success) {
        const leave = response.data;
        console.log('✅ Leave data to populate:', leave);
        
        setFormData({
          employeeId: leave.EMPLOYEE_ID?.toString() || '',
          leaveType: leave.LEAVE_TYPE || '',
          availableDays: leave.AVAILABLE_DAYS?.toString() || '',
          startDate: convertToDDMMYYYY(leave.START_DATE),
          endDate: convertToDDMMYYYY(leave.END_DATE),
          totalDays: leave.TOTAL_DAYS?.toString() || '',
          reason: leave.REASON || '',
          attachmentUrl: leave.ATTACHMENT_URL || ''
        });
        
        console.log('✅ Form data set for editing');
      } else {
        console.error('❌ API returned error:', response);
        toast.error(response.message || 'Failed to fetch leave data');
      }
    } catch (error) {
      console.error('❌ Error fetching leave data:', error);
      toast.error('Failed to fetch leave data');
      navigate('/leaves');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    // Small delay to ensure auth token is available
    const timer = setTimeout(async () => {
      console.log('🔄 Loading form data...', { isEditing, id });
      
      // Always load dropdown data first
      await fetchFormData();
      console.log('✅ Dropdown data loaded');
      
      // Then load leave data for editing if needed
      if (isEditing && id) {
        console.log('🔄 Loading leave data for editing...');
        await fetchLeaveData();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [id, isEditing, fetchLeaveData]);

  // Monitor form data changes for debugging
  useEffect(() => {
    console.log('📝 Form data changed:', formData);
  }, [formData]);

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

  // Validate DD-MM-YYYY format
  const validateDateFormat = (dateString) => {
    if (!dateString || dateString === '') return true;
    
    const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
    const match = dateString.match(dateRegex);
    
    if (!match) return false;
    
    const [, day, month, year] = match;
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    if (monthNum < 1 || monthNum > 12) return false;
    if (dayNum < 1 || dayNum > 31) return false;
    if (yearNum < 1900 || yearNum > 2100) return false;
    
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    if (monthNum === 2 && yearNum % 4 === 0 && (yearNum % 100 !== 0 || yearNum % 400 === 0)) {
      daysInMonth[1] = 29;
    }
    
    return dayNum <= daysInMonth[monthNum - 1];
  };

  // Calculate total days between two dates (excluding weekends)
  const calculateTotalDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    
    // Convert DD-MM-YYYY to Date objects
    const startYYYYMMDD = convertToYYYYMMDD(startDate);
    const endYYYYMMDD = convertToYYYYMMDD(endDate);
    
    if (!startYYYYMMDD || !endYYYYMMDD) return 0;
    
    const start = new Date(startYYYYMMDD);
    const end = new Date(endYYYYMMDD);
    
    if (start > end) return 0;
    
    let totalDays = 0;
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        totalDays++;
      }
    }
    
    return totalDays;
  };

  // Get selected leave policy
  const getSelectedLeavePolicy = () => {
    return dropdownData.leavePolicies.find(policy => policy.LEAVE_TYPE === formData.leaveType);
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for date fields
    if (['startDate', 'endDate'].includes(name)) {
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
        setFormErrors(prev => ({
          ...prev,
          [name]: 'Please enter a valid date in DD-MM-YYYY format'
        }));
      } else if (formErrors[name]) {
        setFormErrors(prev => ({ ...prev, [name]: '' }));
      }
      
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
      
      // Auto-calculate total days when dates change
      const startDateValue = name === 'startDate' ? formattedValue : formData.startDate;
      const endDateValue = name === 'endDate' ? formattedValue : formData.endDate;
      
      if (startDateValue && endDateValue && startDateValue.length === 10 && endDateValue.length === 10) {
        const totalDays = calculateTotalDays(startDateValue, endDateValue);
        setFormData(prev => ({ ...prev, totalDays: totalDays.toString() }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Clear error for this field
      if (formErrors[name]) {
        setFormErrors(prev => ({ ...prev, [name]: '' }));
      }
    }

    // Auto-fill available days when leave type changes
    if (name === 'leaveType') {
      const selectedPolicy = dropdownData.leavePolicies.find(policy => policy.LEAVE_TYPE === value);
      if (selectedPolicy) {
        setFormData(prev => ({ 
          ...prev, 
          availableDays: selectedPolicy.DEFAULT_DAYS?.toString() || ''
        }));
      }
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.employeeId) {
      errors.employeeId = 'Employee is required';
    }

    if (!formData.leaveType) {
      errors.leaveType = 'Leave type is required';
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    }

    if (!validateDateFormat(formData.startDate)) {
      errors.startDate = 'Please enter a valid date in DD-MM-YYYY format';
    }

    if (!validateDateFormat(formData.endDate)) {
      errors.endDate = 'Please enter a valid date in DD-MM-YYYY format';
    }

    if (formData.startDate && formData.endDate && validateDateFormat(formData.startDate) && validateDateFormat(formData.endDate)) {
      const startYYYYMMDD = convertToYYYYMMDD(formData.startDate);
      const endYYYYMMDD = convertToYYYYMMDD(formData.endDate);
      
      if (startYYYYMMDD && endYYYYMMDD) {
        const start = new Date(startYYYYMMDD);
        const end = new Date(endYYYYMMDD);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to compare dates only
        
        if (start > end) {
          errors.endDate = 'End date cannot be before start date';
        }

        if (start < today) {
          errors.startDate = 'Start date cannot be in the past';
        }
      }
    }

    if (!formData.reason) {
      errors.reason = 'Reason is required';
    }

    if (formData.reason && formData.reason.length > 500) {
      errors.reason = 'Reason cannot exceed 500 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setSubmitting(true);
      
      const submitData = {
        ...formData,
        employeeId: parseInt(formData.employeeId),
        availableDays: parseFloat(formData.availableDays) || 0,
        startDate: convertToYYYYMMDD(formData.startDate),
        endDate: convertToYYYYMMDD(formData.endDate),
        totalDays: parseFloat(formData.totalDays) || calculateTotalDays(formData.startDate, formData.endDate)
      };

      if (isEditing) {
        await leaveAPI.update(id, submitData);
        toast.success('Leave updated successfully');
      } else {
        await leaveAPI.create(submitData);
        toast.success('Leave created successfully');
      }

      navigate('/leaves');
    } catch (error) {
      console.error('Error submitting form:', error);
      const message = error.response?.data?.message || 'Failed to save leave';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload an image, PDF, or Word document');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();

      if (result.success) {
        setFormData(prev => ({ ...prev, attachmentUrl: result.url }));
        toast.success('File uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

  if (loading && isEditing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/leaves')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Leave Request' : 'New Leave Request'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEditing ? 'Update leave request details' : 'Create a new leave request'}
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
                onChange={handleChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  formErrors.employeeId ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isEditing}
              >
                <option value="">Select Employee</option>
                {dropdownData.employees.map((employee) => (
                  <option key={employee.EMPLOYEE_ID} value={employee.EMPLOYEE_ID}>
                    {employee.EMPLOYEE_CODE} - {employee.FIRST_NAME} {employee.LAST_NAME} ({employee.DESIGNATION})
                  </option>
                ))}
              </select>
              {formErrors.employeeId && (
                <p className="mt-1 text-sm text-red-600">{formErrors.employeeId}</p>
              )}
            </div>

            {/* Leave Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                Leave Type *
              </label>
              <select
                name="leaveType"
                value={formData.leaveType}
                onChange={handleChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  formErrors.leaveType ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Leave Type</option>
                {dropdownData.leavePolicies && dropdownData.leavePolicies.length > 0 ? (
                  dropdownData.leavePolicies.map((policy) => (
                    <option key={policy.LEAVE_POLICY_ID} value={policy.LEAVE_TYPE}>
                      {policy.LEAVE_CODE} - {policy.POLICY_NAME} ({policy.LEAVE_TYPE})
                    </option>
                  ))
                ) : (
                  <option disabled>Loading policies...</option>
                )}
              </select>
              {formErrors.leaveType && (
                <p className="mt-1 text-sm text-red-600">{formErrors.leaveType}</p>
              )}
            </div>

            {/* Available Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Available Days
              </label>
              <input
                type="number"
                name="availableDays"
                value={formData.availableDays}
                onChange={handleChange}
                min="0"
                step="0.5"
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700 cursor-not-allowed"
                placeholder="Auto-filled from policy"
                readOnly
              />
              <p className="mt-1 text-xs text-gray-500">
                Auto-filled from selected leave policy
              </p>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Start Date *
              </label>
              <input
                type="text"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                placeholder="DD-MM-YYYY (e.g., 25-12-2024)"
                maxLength={10}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  formErrors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.startDate && (
                <p className="mt-1 text-sm text-red-600">{formErrors.startDate}</p>
              )}
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                End Date *
              </label>
              <input
                type="text"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                placeholder="DD-MM-YYYY (e.g., 25-12-2024)"
                maxLength={10}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  formErrors.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.endDate && (
                <p className="mt-1 text-sm text-red-600">{formErrors.endDate}</p>
              )}
            </div>

            {/* Total Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Total Days
              </label>
              <input
                type="number"
                name="totalDays"
                value={formData.totalDays}
                onChange={handleChange}
                min="0.5"
                step="0.5"
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700 cursor-not-allowed"
                placeholder="Auto-calculated"
                readOnly
              />
              <p className="mt-1 text-xs text-gray-500">
                Automatically calculated (excluding weekends)
              </p>
            </div>

            {/* Attachment */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <PaperClipIcon className="h-4 w-4 inline mr-1" />
                Attachment (Optional)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {formData.attachmentUrl && (
                  <a
                    href={formData.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-500 text-sm"
                  >
                    View Attachment
                  </a>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Supported formats: JPG, PNG, GIF, PDF, DOC, DOCX (Max 5MB)
              </p>
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
                onChange={handleChange}
                rows={3}
                maxLength={500}
                placeholder="Please provide a detailed reason for the leave request..."
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  formErrors.reason ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="mt-1 flex justify-between">
                <p className="text-xs text-gray-500">
                  {formData.reason.length}/500 characters
                </p>
                {formErrors.reason && (
                  <p className="text-sm text-red-600">{formErrors.reason}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/leaves')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                {isEditing ? 'Update Leave' : 'Create Leave'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveForm; 
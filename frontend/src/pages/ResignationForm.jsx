import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, UserIcon, DocumentTextIcon, CalendarIcon, CheckIcon } from '@heroicons/react/24/outline';
import { resignationAPI, employeeAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const ResignationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    type: '',
    reason: '',
    noticeDate: '',
    lastWorkingDate: '',
    attachmentUrl: '',
    comments: ''
  });
  const [errors, setErrors] = useState({});

  const resignationTypes = [
    { value: 'RESIGNATION', label: 'Resignation' },
    { value: 'TERMINATION', label: 'Termination' }
  ];

  const resignationReasons = [
    { value: 'BETTER_OPPORTUNITY', label: 'Better Opportunity' },
    { value: 'CAREER_GROWTH', label: 'Career Growth' },
    { value: 'HIGHER_STUDIES', label: 'Higher Studies' },
    { value: 'PERSONAL_REASONS', label: 'Personal Reasons' },
    { value: 'FAMILY_REASONS', label: 'Family Reasons' },
    { value: 'HEALTH_ISSUES', label: 'Health Issues' },
    { value: 'RELOCATION', label: 'Relocation' },
    { value: 'WORK_LIFE_BALANCE', label: 'Work-Life Balance' },
    { value: 'COMPENSATION', label: 'Compensation Issues' },
    { value: 'WORK_ENVIRONMENT', label: 'Work Environment' },
    { value: 'RETIREMENT', label: 'Retirement' },
    { value: 'PERFORMANCE_ISSUES', label: 'Performance Issues' },
    { value: 'POLICY_VIOLATION', label: 'Policy Violation' },
    { value: 'MISCONDUCT', label: 'Misconduct' },
    { value: 'RESTRUCTURING', label: 'Company Restructuring' },
    { value: 'BUSINESS_CLOSURE', label: 'Business Closure' },
    { value: 'OTHER', label: 'Other' }
  ];

  useEffect(() => {
    if (isAuthenticated) {
      fetchEmployees();
      if (isEditing) {
        fetchResignation();
      }
    }
  }, [id, isAuthenticated]);

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getDropdown();
      setEmployees(response.data);
    } catch (error) {
      toast.error('Failed to fetch employees');
    }
  };

  const fetchResignation = async () => {
    try {
      setLoading(true);
      const response = await resignationAPI.getById(id);
      const resignation = response.data;
      setFormData({
        employeeId: resignation.EMPLOYEE_ID?.toString() || '',
        type: resignation.TYPE || '',
        reason: resignation.REASON || '',
        noticeDate: resignation.NOTICE_DATE ? convertToDDMMYYYY(resignation.NOTICE_DATE) : '',
        lastWorkingDate: resignation.LAST_WORKING_DATE ? convertToDDMMYYYY(resignation.LAST_WORKING_DATE) : '',
        attachmentUrl: resignation.ATTACHMENT_URL || '',
        comments: resignation.COMMENTS || ''
      });
    } catch (error) {
      toast.error('Failed to fetch resignation details');
      navigate('/resignations');
    } finally {
      setLoading(false);
    }
  };

  // Date format helpers
  const convertToDDMMYYYY = (dateString) => {
    if (!dateString) return '';
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) return dateString;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return `${day}-${month}-${year}`;
    }
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      }
    } catch {
      return '';
    }
    return '';
  };
  const convertToYYYYMMDD = (dateString) => {
    if (!dateString) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('-');
      return `${year}-${month}-${day}`;
    }
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch {
      return '';
    }
    return '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDateChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 2) {
      value = value;
    } else if (value.length <= 4) {
      value = value.slice(0, 2) + '-' + value.slice(2);
    } else if (value.length <= 8) {
      value = value.slice(0, 2) + '-' + value.slice(2, 4) + '-' + value.slice(4, 8);
    } else {
      value = value.slice(0, 2) + '-' + value.slice(2, 4) + '-' + value.slice(4, 8);
    }
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.employeeId) newErrors.employeeId = 'Employee is required';
    if (!formData.type) newErrors.type = 'Type is required';
    if (!formData.reason) newErrors.reason = 'Reason is required';
    if (!formData.noticeDate) newErrors.noticeDate = 'Notice date is required';
    else if (!/^\d{2}-\d{2}-\d{4}$/.test(formData.noticeDate)) newErrors.noticeDate = 'Date must be in DD-MM-YYYY format';
    if (!formData.lastWorkingDate) newErrors.lastWorkingDate = 'Last working date is required';
    else if (!/^\d{2}-\d{2}-\d{4}$/.test(formData.lastWorkingDate)) newErrors.lastWorkingDate = 'Date must be in DD-MM-YYYY format';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      const submitData = {
        employeeId: parseInt(formData.employeeId),
        type: formData.type,
        reason: formData.reason,
        noticeDate: convertToYYYYMMDD(formData.noticeDate),
        lastWorkingDate: convertToYYYYMMDD(formData.lastWorkingDate),
        attachmentUrl: formData.attachmentUrl || null,
        comments: formData.comments || null
      };
      if (isEditing) {
        await resignationAPI.update(id, submitData);
        toast.success('Resignation updated successfully');
      } else {
        await resignationAPI.create(submitData);
        toast.success('Resignation created successfully');
      }
      navigate('/resignations');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save resignation');
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
        <p className="mt-1 text-sm text-gray-500">Please log in to access resignation management.</p>
        <div className="mt-6">
          <Link to="/login" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">Go to Login</Link>
        </div>
      </div>
    );
  }
  if (loading) return <LoadingSpinner />;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/resignations" className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            <ArrowLeftIcon className="h-4 w-4 mr-2" /> Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Resignation' : 'New Resignation'}</h1>
            <p className="mt-1 text-sm text-gray-500">{isEditing ? 'Update resignation/termination details' : 'Create a new resignation/termination request'}</p>
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2"><UserIcon className="h-4 w-4 inline mr-1" />Employee *</label>
              <select
                name="employeeId"
                value={formData.employeeId}
                onChange={handleInputChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.employeeId ? 'border-red-500' : 'border-gray-300'}`}
                disabled={isEditing}
              >
                <option value="">Select Employee</option>
                {employees.map(employee => (
                  <option key={employee.EMPLOYEE_ID} value={employee.EMPLOYEE_ID}>
                    {employee.EMPLOYEE_CODE} - {employee.FIRST_NAME} {employee.LAST_NAME} ({employee.DESIGNATION})
                  </option>
                ))}
              </select>
              {errors.employeeId && <p className="mt-1 text-sm text-red-600">{errors.employeeId}</p>}
              {formData.employeeId && getSelectedEmployee() && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600"><strong>Selected:</strong> {getSelectedEmployee().FIRST_NAME} {getSelectedEmployee().LAST_NAME} ({getSelectedEmployee().EMPLOYEE_CODE}) - {getSelectedEmployee().DESIGNATION}</p>
                </div>
              )}
            </div>
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2"><DocumentTextIcon className="h-4 w-4 inline mr-1" />Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.type ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select Type</option>
                {resignationTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
            </div>
            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2"><DocumentTextIcon className="h-4 w-4 inline mr-1" />Reason *</label>
              <select
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.reason ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select Reason</option>
                {resignationReasons.map(reason => (
                  <option key={reason.value} value={reason.value}>{reason.label}</option>
                ))}
              </select>
              {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason}</p>}
            </div>
            {/* Notice Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2"><CalendarIcon className="h-4 w-4 inline mr-1" />Notice Date *</label>
              <input
                type="text"
                name="noticeDate"
                value={formData.noticeDate}
                onChange={handleDateChange}
                placeholder="DD-MM-YYYY"
                maxLength="10"
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.noticeDate ? 'border-red-500' : 'border-gray-300'}`}
              />
              <p className="mt-1 text-xs text-gray-500">Format: DD-MM-YYYY (e.g., 31-12-2024)</p>
              {errors.noticeDate && <p className="mt-1 text-sm text-red-600">{errors.noticeDate}</p>}
            </div>
            {/* Last Working Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2"><CalendarIcon className="h-4 w-4 inline mr-1" />Last Working Date *</label>
              <input
                type="text"
                name="lastWorkingDate"
                value={formData.lastWorkingDate}
                onChange={handleDateChange}
                placeholder="DD-MM-YYYY"
                maxLength="10"
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.lastWorkingDate ? 'border-red-500' : 'border-gray-300'}`}
              />
              <p className="mt-1 text-xs text-gray-500">Format: DD-MM-YYYY (e.g., 31-12-2024)</p>
              {errors.lastWorkingDate && <p className="mt-1 text-sm text-red-600">{errors.lastWorkingDate}</p>}
            </div>
            {/* Attachment URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Attachment URL</label>
              <input
                type="url"
                name="attachmentUrl"
                value={formData.attachmentUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/resignation-letter.pdf"
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300"
              />
              <p className="mt-1 text-xs text-gray-500">Optional: Resignation letter, supporting documents, etc.</p>
            </div>
            {/* Comments */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
                rows={2}
                placeholder="Any additional comments..."
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end space-x-4">
          <Link to="/resignations" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">Cancel</Link>
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
                {isEditing ? 'Update Resignation' : 'Create Resignation'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResignationForm; 
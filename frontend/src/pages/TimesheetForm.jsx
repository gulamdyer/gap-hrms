import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  UserIcon,
  ClockIcon,
  CalendarIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { timesheetAPI, employeeAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const TimesheetForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    timesheetDate: '',
    status: 'DRAFT'
  });
  const [entries, setEntries] = useState([]);
  const [errors, setErrors] = useState({});
  const [entryErrors, setEntryErrors] = useState([]);
  
  // Ref to prevent double API calls and track loaded ID
  const loadedId = useRef(null);

  const activityTypes = [
    { value: 'DEVELOPMENT', label: 'Development' },
    { value: 'TESTING', label: 'Testing' },
    { value: 'MEETING', label: 'Meeting' },
    { value: 'DOCUMENTATION', label: 'Documentation' },
    { value: 'TRAINING', label: 'Training' },
    { value: 'SUPPORT', label: 'Support' },
    { value: 'RESEARCH', label: 'Research' },
    { value: 'OTHER', label: 'Other' }
  ];

  const isEdit = !!id;

  useEffect(() => {
    if (isAuthenticated && loadedId.current !== id) {
      loadedId.current = id;
      
      fetchEmployees();
      fetchProjects();
      if (id) {
        fetchTimesheet();
      }
    } else if (!isAuthenticated) {
      loadedId.current = null;
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

  const fetchProjects = async () => {
    try {
      const response = await timesheetAPI.getProjectsDropdown();
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects');
    }
  };

  const fetchTimesheet = async () => {
    try {
      setLoading(true);
      const response = await timesheetAPI.getById(id);
      const timesheet = response.data;
      

      
      const formDataToSet = {
        employeeId: timesheet.EMPLOYEE_ID?.toString() || '',
        timesheetDate: convertToDDMMYYYY(timesheet.TIMESHEET_DATE) || '',
        status: timesheet.STATUS || 'DRAFT'
      };
      
      setFormData(formDataToSet);

      // Use entries from the main response if available, otherwise fetch separately
      let rawEntries = [];
      if (timesheet.entries && timesheet.entries.length > 0) {
        rawEntries = timesheet.entries;
      } else {
        const entriesResponse = await timesheetAPI.getEntries(id);
        rawEntries = entriesResponse.data || [];
      }

      // Transform backend data format to frontend format
      const transformedEntries = rawEntries.map(entry => ({
        id: entry.ENTRY_ID,
        projectId: entry.PROJECT_ID,
        taskDescription: entry.TASK_DESCRIPTION || '',
        startTime: entry.START_TIME || '',
        endTime: entry.END_TIME || '',
        totalHours: entry.TOTAL_HOURS || 0,
        activityType: entry.ACTIVITY_TYPE || 'DEVELOPMENT',
        isBillable: entry.IS_BILLABLE === 1,
        comments: entry.COMMENTS || '',
        ENTRY_ID: entry.ENTRY_ID // Keep original ID for updates
      }));
      
      setEntries(transformedEntries);
    } catch (error) {
      console.error('Error fetching timesheet:', error);
      toast.error('Failed to fetch timesheet details');
      navigate('/timesheets');
    } finally {
      setLoading(false);
    }
  };

  // Date helper functions (same as DeductionForm)
  const convertToDDMMYYYY = (dateString) => {
    if (!dateString || dateString === '') return '';
    
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      return dateString;
    }
    
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
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
    }
    
    return '';
  };

  const convertToYYYYMMDD = (dateString) => {
    if (!dateString || dateString === '') return null;
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
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
    
    if (monthNum < 1 || monthNum > 12) return false;
    if (dayNum < 1 || dayNum > 31) return false;
    if (yearNum < 1900 || yearNum > 2100) return false;
    
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    if (monthNum === 2 && yearNum % 4 === 0 && (yearNum % 100 !== 0 || yearNum % 400 === 0)) {
      daysInMonth[1] = 29;
    }
    
    return dayNum <= daysInMonth[monthNum - 1];
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for date fields
    if (name === 'timesheetDate') {
      const cleanedValue = value.replace(/[^\d-]/g, '');
      
      let formattedValue = cleanedValue;
      if (cleanedValue.length >= 2 && !cleanedValue.includes('-')) {
        formattedValue = cleanedValue.slice(0, 2) + '-' + cleanedValue.slice(2);
      }
      if (formattedValue.length >= 5 && formattedValue.split('-').length === 2) {
        formattedValue = formattedValue.slice(0, 5) + '-' + formattedValue.slice(5);
      }
      
      if (formattedValue.length > 10) {
        formattedValue = formattedValue.slice(0, 10);
      }
      
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
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addNewEntry = () => {
    const newEntry = {
      id: Date.now(), // Temporary ID for new entries
      projectId: '',
      taskDescription: '',
      startTime: '',
      endTime: '',
      totalHours: 0,
      activityType: 'DEVELOPMENT',
      isBillable: true,
      comments: ''
    };
    setEntries(prev => [...prev, newEntry]);
    setEntryErrors(prev => [...prev, {}]); // Add empty error object for new entry
  };

  const removeEntry = (index) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
    setEntryErrors(prev => prev.filter((_, i) => i !== index)); // Remove corresponding error
  };

  const updateEntry = (index, field, value) => {
    setEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ));
    setEntryErrors(prev => prev.map((entryError, i) => 
      i === index ? { ...entryError, [field]: '' } : entryError
    )); // Clear error for updated field
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.employeeId) {
      newErrors.employeeId = 'Employee is required';
    }
    
    if (!formData.timesheetDate) {
      newErrors.timesheetDate = 'Timesheet date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Validate all time entries before submitting
    let hasEntryError = false;
    const newEntryErrors = entries.map((entry, idx) => {
      const errors = {};
      if (!entry.taskDescription || entry.taskDescription.trim() === '') {
        errors.taskDescription = 'Task description is required';
        hasEntryError = true;
      }
      if (!entry.totalHours || isNaN(entry.totalHours) || parseFloat(entry.totalHours) <= 0) {
        errors.totalHours = 'Total hours must be greater than 0';
        hasEntryError = true;
      }
      return errors;
    });
    setEntryErrors(newEntryErrors);
    if (hasEntryError) {
      toast.error('Please fix errors in your time entries before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      
      const submitData = {
        employeeId: parseInt(formData.employeeId),
        timesheetDate: convertToYYYYMMDD(formData.timesheetDate),
        status: formData.status
      };

      let timesheetId;
      
      if (isEdit) {
        await timesheetAPI.update(id, submitData);
        timesheetId = id;
        toast.success('Timesheet updated successfully');
      } else {
        const createResponse = await timesheetAPI.create(submitData);
        timesheetId = createResponse.data.TIMESHEET_ID;
        toast.success('Timesheet created successfully');
      }

      // Save time entries
      if (entries.length > 0) {
        console.log('📊 Saving', entries.length, 'time entries...');
        
        for (const entry of entries) {
          // Skip entries with temporary IDs that are empty
          if (!entry.taskDescription && entry.totalHours === 0) {
            continue;
          }
          
          const entryData = {
            projectId: entry.projectId ? parseInt(entry.projectId) : null,
            taskDescription: entry.taskDescription,
            totalHours: parseFloat(entry.totalHours) || 0,
            activityType: entry.activityType || 'DEVELOPMENT',
            isBillable: entry.isBillable !== false, // Default to true
            comments: entry.comments || ''
          };
          
          try {
            if (entry.ENTRY_ID && typeof entry.ENTRY_ID === 'number') {
              // Update existing entry (only if it has a real database ID)
              await timesheetAPI.updateEntry(timesheetId, entry.ENTRY_ID, entryData);
              console.log('✅ Updated entry:', entry.ENTRY_ID);
            } else {
              // Create new entry (for temporary IDs or no ID)
              await timesheetAPI.createEntry(timesheetId, entryData);
              console.log('✅ Created new entry for timesheet:', timesheetId);
            }
          } catch (entryError) {
            console.error('❌ Error saving entry:', entryError);
            toast.error(`Failed to save time entry: ${entry.taskDescription}`);
          }
        }
        
        toast.success('Time entries saved successfully');
      }

      navigate('/timesheets');
    } catch (error) {
      console.error('Error saving timesheet:', error);
      toast.error('Failed to save timesheet');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Authentication Required</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please log in to access timesheet management.
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

  // Don't render form until we have data in edit mode
  if (isEdit && !formData.employeeId) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/timesheets"
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Timesheet' : 'New Timesheet'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEdit ? 'Update timesheet details' : 'Create a new timesheet entry'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form 
        key={`timesheet-form-${id}-${formData.employeeId}-${formData.timesheetDate}`}
        onSubmit={handleSubmit} 
        className="space-y-6"
      >
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Timesheet Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserIcon className="h-4 w-4 inline mr-1" />
                Employee *
              </label>
              <select
                name="employeeId"
                value={formData.employeeId}
                onChange={handleInputChange}
                disabled={isEdit}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.employeeId ? 'border-red-500' : 'border-gray-300'
                } ${isEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">Select Employee</option>
                {employees.map(employee => (
                  <option key={employee.EMPLOYEE_ID} value={employee.EMPLOYEE_ID}>
                    {employee.EMPLOYEE_CODE} - {employee.FIRST_NAME} {employee.LAST_NAME}
                  </option>
                ))}
              </select>
              {errors.employeeId && (
                <p className="mt-1 text-sm text-red-600">{errors.employeeId}</p>
              )}
            </div>

            {/* Timesheet Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Timesheet Date *
              </label>
              <input
                type="text"
                name="timesheetDate"
                value={formData.timesheetDate}
                onChange={handleInputChange}
                placeholder="DD-MM-YYYY (e.g., 25-12-1990)"
                maxLength={10}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.timesheetDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.timesheetDate && (
                <p className="mt-1 text-sm text-red-600">{errors.timesheetDate}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Enter the date for this timesheet</p>
            </div>
          </div>
        </div>

        {/* Time Entries Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Time Entries</h3>
            <button
              type="button"
              onClick={addNewEntry}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Entry
            </button>
          </div>

          {entries.length === 0 ? (
            <div className="text-center py-8">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No time entries</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding your first time entry.</p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={addNewEntry}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Time Entry
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry, index) => (
                <div key={entry.id || index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Project */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Project
                      </label>
                      <select
                        value={entry.projectId || ''}
                        onChange={(e) => updateEntry(index, 'projectId', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Select Project</option>
                        {projects.map(project => (
                          <option key={project.PROJECT_ID} value={project.PROJECT_ID}>
                            {project.PROJECT_CODE} - {project.PROJECT_NAME}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Activity Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Activity Type
                      </label>
                      <select
                        value={entry.activityType || 'DEVELOPMENT'}
                        onChange={(e) => updateEntry(index, 'activityType', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        {activityTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Total Hours */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Hours
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        max="24"
                        value={entry.totalHours || ''}
                        onChange={(e) => updateEntry(index, 'totalHours', e.target.value)}
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${entryErrors[index]?.totalHours ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {entryErrors[index]?.totalHours && (
                        <p className="mt-1 text-sm text-red-600">{entryErrors[index].totalHours}</p>
                      )}
                    </div>

                    {/* Task Description */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Task Description
                      </label>
                      <input
                        type="text"
                        value={entry.taskDescription || ''}
                        onChange={(e) => updateEntry(index, 'taskDescription', e.target.value)}
                        placeholder="Describe the work performed..."
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${entryErrors[index]?.taskDescription ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {entryErrors[index]?.taskDescription && (
                        <p className="mt-1 text-sm text-red-600">{entryErrors[index].taskDescription}</p>
                      )}
                    </div>

                    {/* Remove Button */}
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeEntry(index)}
                        className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Link
            to="/timesheets"
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
                {isEdit ? 'Update Timesheet' : 'Create Timesheet'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TimesheetForm; 
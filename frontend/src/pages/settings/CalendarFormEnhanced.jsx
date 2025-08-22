import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { calendarAPI } from '../../services/api';
import { 
  CalendarIcon, 
  PlusIcon, 
  TrashIcon, 
  XMarkIcon,
  CheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const CalendarFormEnhanced = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Form state
  const [formData, setFormData] = useState({
    calendarCode: '',
    calendarName: '',
    description: '',
    isActive: 1,
    weeklyHolidays: []
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showWeeklyHolidayModal, setShowWeeklyHolidayModal] = useState(false);
  const [weeklyHolidayForm, setWeeklyHolidayForm] = useState({
    dayOfWeek: 0,
    label: ''
  });

  // Day options for weekly holidays
  const dayOptions = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  useEffect(() => {
    if (isEditing) {
      loadCalendar();
    }
  }, [id]);

  const loadCalendar = async () => {
    try {
      setLoading(true);
      const response = await calendarAPI.getById(id);
      const calendar = response.data;
      
      setFormData({
        calendarCode: calendar.CALENDAR_CODE || '',
        calendarName: calendar.CALENDAR_NAME || '',
        description: calendar.DESCRIPTION || '',
        isActive: calendar.IS_ACTIVE || 1,
        weeklyHolidays: calendar.WEEKLY_HOLIDAYS || []
      });
    } catch (error) {
      console.error('Error loading calendar:', error);
      toast.error('Failed to load calendar details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.calendarCode.trim()) {
      errors.calendarCode = 'Calendar code is required';
    } else if (!/^[A-Z0-9_]+$/.test(formData.calendarCode)) {
      errors.calendarCode = 'Calendar code can only contain uppercase letters, numbers, and underscores';
    }

    if (!formData.calendarName.trim()) {
      errors.calendarName = 'Calendar name is required';
    }

    if (formData.calendarCode.length > 50) {
      errors.calendarCode = 'Calendar code cannot exceed 50 characters';
    }

    if (formData.calendarName.length > 200) {
      errors.calendarName = 'Calendar name cannot exceed 200 characters';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      Object.values(errors).forEach(error => toast.error(error));
      return;
    }

    try {
      setSaving(true);
      
      if (isEditing) {
        await calendarAPI.update(id, formData);
        toast.success('Calendar updated successfully');
      } else {
        await calendarAPI.create(formData);
        toast.success('Calendar created successfully');
      }
      
      navigate('/settings/calendars');
    } catch (error) {
      console.error('Error saving calendar:', error);
      const errorMessage = error.response?.data?.error || 'Failed to save calendar';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Weekly Holiday Management
  const openWeeklyHolidayModal = () => {
    setWeeklyHolidayForm({ dayOfWeek: 0, label: '' });
    setShowWeeklyHolidayModal(true);
  };

  const closeWeeklyHolidayModal = () => {
    setShowWeeklyHolidayModal(false);
    setWeeklyHolidayForm({ dayOfWeek: 0, label: '' });
  };

  const handleWeeklyHolidayInputChange = (e) => {
    const { name, value } = e.target;
    setWeeklyHolidayForm(prev => ({
      ...prev,
      [name]: name === 'dayOfWeek' ? parseInt(value) : value
    }));
  };

  const validateWeeklyHolidayForm = () => {
    const errors = {};

    if (!weeklyHolidayForm.label.trim()) {
      errors.label = 'Holiday label is required';
    }

    if (weeklyHolidayForm.label.length > 100) {
      errors.label = 'Holiday label cannot exceed 100 characters';
    }

    // Check for duplicate day
    const existingDay = formData.weeklyHolidays.find(
      holiday => holiday.dayOfWeek === weeklyHolidayForm.dayOfWeek
    );
    if (existingDay) {
      errors.dayOfWeek = 'This day is already marked as a holiday';
    }

    return errors;
  };

  const saveWeeklyHoliday = () => {
    const errors = validateWeeklyHolidayForm();
    if (Object.keys(errors).length > 0) {
      Object.values(errors).forEach(error => toast.error(error));
      return;
    }

    setFormData(prev => ({
      ...prev,
      weeklyHolidays: [...prev.weeklyHolidays, { ...weeklyHolidayForm }]
    }));

    closeWeeklyHolidayModal();
    toast.success('Weekly holiday added successfully');
  };

  const deleteWeeklyHoliday = (index) => {
    setFormData(prev => ({
      ...prev,
      weeklyHolidays: prev.weeklyHolidays.filter((_, i) => i !== index)
    }));
    toast.success('Weekly holiday removed successfully');
  };

  const getDayLabel = (dayOfWeek) => {
    return dayOptions.find(day => day.value === dayOfWeek)?.label || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Calendar' : 'Create New Calendar'}
            </h1>
            <p className="text-gray-600">
              {isEditing ? 'Update calendar details and weekly holidays' : 'Set up a new calendar with custom weekly holidays'}
            </p>
          </div>
        </div>
        <Link
          to="/settings/calendars"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <XMarkIcon className="h-4 w-4 mr-2" />
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Calendar Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Calendar Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="calendarCode" className="block text-sm font-medium text-gray-700 mb-2">
                Calendar Code *
              </label>
              <input
                type="text"
                id="calendarCode"
                name="calendarCode"
                value={formData.calendarCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., MAIN_CALENDAR"
                maxLength={50}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Use uppercase letters, numbers, and underscores only
              </p>
            </div>

            <div>
              <label htmlFor="calendarName" className="block text-sm font-medium text-gray-700 mb-2">
                Calendar Name *
              </label>
              <input
                type="text"
                id="calendarName"
                name="calendarName"
                value={formData.calendarName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Main Company Calendar"
                maxLength={200}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the calendar and its purpose..."
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive === 1}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Active Calendar</span>
              </label>
            </div>
          </div>
        </div>

        {/* Weekly Holidays Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Weekly Holidays</h2>
            <button
              type="button"
              onClick={openWeeklyHolidayModal}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Weekly Holiday
            </button>
          </div>

          {formData.weeklyHolidays.length === 0 ? (
            <div className="text-center py-8">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No weekly holidays</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add recurring weekly holidays like weekends or specific days off.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={openWeeklyHolidayModal}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Weekly Holiday
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.weeklyHolidays.map((holiday, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckIcon className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {getDayLabel(holiday.dayOfWeek)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {holiday.label}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteWeeklyHoliday(index)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <Link
            to="/settings/calendars"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                {isEditing ? 'Update Calendar' : 'Create Calendar'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Weekly Holiday Modal */}
      {showWeeklyHolidayModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add Weekly Holiday</h3>
                <button
                  onClick={closeWeeklyHolidayModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="modal-dayOfWeek" className="block text-sm font-medium text-gray-700 mb-2">
                    Day of Week *
                  </label>
                  <select
                    id="modal-dayOfWeek"
                    name="dayOfWeek"
                    value={weeklyHolidayForm.dayOfWeek}
                    onChange={handleWeeklyHolidayInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {dayOptions.map(day => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="modal-label" className="block text-sm font-medium text-gray-700 mb-2">
                    Holiday Label *
                  </label>
                  <input
                    type="text"
                    id="modal-label"
                    name="label"
                    value={weeklyHolidayForm.label}
                    onChange={handleWeeklyHolidayInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Weekend Holiday, Sunday Off"
                    maxLength={100}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Custom label for this weekly holiday
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeWeeklyHolidayModal}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveWeeklyHoliday}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Add Holiday
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarFormEnhanced; 
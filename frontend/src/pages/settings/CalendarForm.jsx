import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  CalendarDaysIcon, 
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  ClockIcon,
  CalendarIcon,
  StarIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { calendarAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const CalendarForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calendar, setCalendar] = useState({
    calendarCode: '',
    calendarName: '',
    description: '',
    isActive: 1
  });
  const [errors, setErrors] = useState({});

  // Holiday management state
  const [holidays, setHolidays] = useState([]);
  const [holidayTypes, setHolidayTypes] = useState([]);
  const [holidayPatterns, setHolidayPatterns] = useState([]);
  const [dayOfWeekOptions, setDayOfWeekOptions] = useState([]);
  const [weekOfMonthOptions, setWeekOfMonthOptions] = useState([]);
  const [namedHolidayTemplates, setNamedHolidayTemplates] = useState([]);
  const [showHolidaySection, setShowHolidaySection] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [modalHoliday, setModalHoliday] = useState({
    holidayName: '',
    holidayDate: '',
    holidayType: 'PUBLIC_HOLIDAY',
    holidayPattern: 'SPECIFIC_DATE',
    dayOfWeek: null,
    monthOfYear: null,
    dayOfMonth: null,
    weekOfMonth: null,
    description: ''
  });
  const [modalErrors, setModalErrors] = useState({});

  const isEditMode = !!id;

  useEffect(() => {
    if (isAuthenticated) {
      if (isEditMode) {
        fetchCalendar();
        fetchHolidays();
      }
      fetchHolidayOptions();
    }
  }, [isAuthenticated, id]);

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      const response = await calendarAPI.getById(id);
      setCalendar(response.data);
    } catch (error) {
      console.error('Error fetching calendar:', error);
      toast.error('Failed to fetch calendar details');
      navigate('/settings/calendars');
    } finally {
      setLoading(false);
    }
  };

  const fetchHolidays = async () => {
    if (!id) return;
    
    try {
      const response = await calendarAPI.getAllHolidays({ calendarId: id });
      setHolidays(response.data);
    } catch (error) {
      console.error('Error fetching holidays:', error);
    }
  };

  const fetchHolidayOptions = async () => {
    try {
      const [typesRes, patternsRes, dayOptionsRes, weekOptionsRes, templatesRes] = await Promise.all([
        calendarAPI.getHolidayTypes(),
        calendarAPI.getHolidayPatterns(),
        calendarAPI.getDayOfWeekOptions(),
        calendarAPI.getWeekOfMonthOptions(),
        calendarAPI.getNamedHolidayTemplates()
      ]);

      setHolidayTypes(typesRes.data);
      setHolidayPatterns(patternsRes.data);
      setDayOfWeekOptions(dayOptionsRes.data);
      setWeekOfMonthOptions(weekOptionsRes.data);
      setNamedHolidayTemplates(templatesRes.data);
    } catch (error) {
      console.error('Error fetching holiday options:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Calendar Code validation
    if (!calendar.calendarCode.trim()) {
      newErrors.calendarCode = 'Calendar code is required';
    } else if (!/^[A-Z0-9_]+$/.test(calendar.calendarCode)) {
      newErrors.calendarCode = 'Calendar code can only contain uppercase letters, numbers, and underscores';
    } else if (calendar.calendarCode.length > 50) {
      newErrors.calendarCode = 'Calendar code cannot exceed 50 characters';
    }

    // Calendar Name validation
    if (!calendar.calendarName.trim()) {
      newErrors.calendarName = 'Calendar name is required';
    } else if (calendar.calendarName.length > 200) {
      newErrors.calendarName = 'Calendar name cannot exceed 200 characters';
    }

    // Description validation (optional)
    if (calendar.description && calendar.description.length > 1000) {
      newErrors.description = 'Description cannot exceed 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateHolidayForm = () => {
    const newErrors = {};

    if (!modalHoliday.holidayName.trim()) {
      newErrors.holidayName = 'Holiday name is required';
    }

    if (modalHoliday.holidayPattern === 'SPECIFIC_DATE' && !modalHoliday.holidayDate) {
      newErrors.holidayDate = 'Holiday date is required for specific date pattern';
    }

    if (modalHoliday.holidayPattern === 'WEEKLY' && modalHoliday.dayOfWeek === null) {
      newErrors.dayOfWeek = 'Day of week is required for weekly pattern';
    }

    if (modalHoliday.holidayPattern === 'YEARLY') {
      if (modalHoliday.monthOfYear === null) {
        newErrors.monthOfYear = 'Month is required for yearly pattern';
      }
      if (modalHoliday.dayOfMonth === null && modalHoliday.weekOfMonth === null) {
        newErrors.dayOfMonth = 'Either day of month or week of month is required for yearly pattern';
      }
    }

    setModalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setSaving(true);
      
      if (isEditMode) {
        await calendarAPI.update(id, calendar);
        toast.success('Calendar updated successfully');
      } else {
        const response = await calendarAPI.create(calendar);
        toast.success('Calendar created successfully');
        // Navigate to the new calendar's edit page to add holidays
        navigate(`/settings/calendars/${response.data.data.CALENDAR_ID}/edit`);
        return;
      }
      
      navigate('/settings/calendars');
    } catch (error) {
      console.error('Error saving calendar:', error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error(isEditMode ? 'Failed to update calendar' : 'Failed to create calendar');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCalendar(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleHolidayInputChange = (e) => {
    const { name, value } = e.target;
    setModalHoliday(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (modalErrors[name]) {
      setModalErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const openHolidayModal = () => {
    setModalHoliday({
      holidayName: '',
      holidayDate: '',
      holidayType: 'PUBLIC_HOLIDAY',
      holidayPattern: 'SPECIFIC_DATE',
      dayOfWeek: null,
      monthOfYear: null,
      dayOfMonth: null,
      weekOfMonth: null,
      description: ''
    });
    setModalErrors({});
    setShowHolidayModal(true);
  };

  const closeHolidayModal = () => {
    setShowHolidayModal(false);
    setModalHoliday({
      holidayName: '',
      holidayDate: '',
      holidayType: 'PUBLIC_HOLIDAY',
      holidayPattern: 'SPECIFIC_DATE',
      dayOfWeek: null,
      monthOfYear: null,
      dayOfMonth: null,
      weekOfMonth: null,
      description: ''
    });
    setModalErrors({});
  };

  const saveHoliday = async () => {
    if (!validateHolidayForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      const holidayData = {
        calendarId: parseInt(id),
        holidayName: modalHoliday.holidayName,
        holidayDate: modalHoliday.holidayDate || null,
        holidayType: modalHoliday.holidayType,
        holidayPattern: modalHoliday.holidayPattern,
        dayOfWeek: modalHoliday.dayOfWeek ? parseInt(modalHoliday.dayOfWeek) : null,
        monthOfYear: modalHoliday.monthOfYear ? parseInt(modalHoliday.monthOfYear) : null,
        dayOfMonth: modalHoliday.dayOfMonth ? parseInt(modalHoliday.dayOfMonth) : null,
        weekOfMonth: modalHoliday.weekOfMonth ? parseInt(modalHoliday.weekOfMonth) : null,
        description: modalHoliday.description
      };

      await calendarAPI.createHoliday(holidayData);
      toast.success('Holiday added successfully');
      closeHolidayModal();
      fetchHolidays();
    } catch (error) {
      console.error('Error saving holiday:', error);
      toast.error('Failed to save holiday');
    }
  };

  const openTemplateModal = () => {
    setShowTemplateModal(true);
  };

  const closeTemplateModal = () => {
    setShowTemplateModal(false);
  };

  const createHolidayFromTemplate = async (template) => {
    try {
      await calendarAPI.createHolidayFromTemplate({
        calendarId: parseInt(id),
        templateCode: template.templateCode,
        customName: template.templateName
      });
      toast.success(`${template.templateName} holiday added successfully`);
      closeTemplateModal();
      fetchHolidays();
    } catch (error) {
      console.error('Error creating holiday from template:', error);
      toast.error('Failed to create holiday from template');
    }
  };

  const deleteHoliday = async (holidayId, holidayName) => {
    if (!window.confirm(`Are you sure you want to delete "${holidayName}"?`)) {
      return;
    }

    try {
      await calendarAPI.deleteHoliday(holidayId);
      toast.success('Holiday deleted successfully');
      fetchHolidays();
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast.error('Failed to delete holiday');
    }
  };

  const getHolidayTypeColor = (holidayType) => {
    switch (holidayType) {
      case 'PUBLIC_HOLIDAY':
        return 'bg-red-100 text-red-800';
      case 'COMPANY_HOLIDAY':
        return 'bg-blue-100 text-blue-800';
      case 'OPTIONAL_HOLIDAY':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESTRICTED_HOLIDAY':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getHolidayPatternLabel = (pattern) => {
    const patternObj = holidayPatterns.find(p => p.value === pattern);
    return patternObj ? patternObj.label : pattern;
  };

  const getDayOfWeekLabel = (dayOfWeek) => {
    const dayObj = dayOfWeekOptions.find(d => d.value === dayOfWeek);
    return dayObj ? dayObj.label : `Day ${dayOfWeek}`;
  };

  const formatHolidayDisplay = (holiday) => {
    if (holiday.HOLIDAY_PATTERN === 'SPECIFIC_DATE' && holiday.HOLIDAY_DATE) {
      const date = new Date(holiday.HOLIDAY_DATE);
      return date.toLocaleDateString('en-GB');
    } else if (holiday.HOLIDAY_PATTERN === 'WEEKLY') {
      return `Every ${getDayOfWeekLabel(holiday.DAY_OF_WEEK)}`;
    } else if (holiday.HOLIDAY_PATTERN === 'YEARLY') {
      if (holiday.DAY_OF_MONTH) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${holiday.DAY_OF_MONTH} ${monthNames[holiday.MONTH_OF_YEAR - 1]}`;
      } else if (holiday.WEEK_OF_MONTH) {
        const weekLabel = weekOfMonthOptions.find(w => w.value === holiday.WEEK_OF_MONTH)?.label;
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${weekLabel} ${monthNames[holiday.MONTH_OF_YEAR - 1]}`;
      }
    }
    return 'Custom Pattern';
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Authentication Required</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please log in to access calendar management.
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
        <div className="flex items-center">
          <Link
            to="/settings/calendars"
            className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <CalendarDaysIcon className="h-7 w-7 text-cyan-500 mr-2" />
              {isEditMode ? 'Edit Calendar' : 'New Calendar'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEditMode ? 'Update calendar information and manage holidays' : 'Create a new company calendar'}
            </p>
          </div>
        </div>
      </div>

      {/* Calendar Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Calendar Code */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calendar Code *
              </label>
              <input
                type="text"
                name="calendarCode"
                value={calendar.calendarCode}
                onChange={handleInputChange}
                placeholder="e.g., MAIN_CALENDAR"
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.calendarCode ? 'border-red-500' : 'border-gray-300'
                }`}
                maxLength={50}
                disabled={isEditMode}
              />
              {errors.calendarCode && (
                <p className="mt-1 text-sm text-red-600">{errors.calendarCode}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Use uppercase letters, numbers, and underscores only
              </p>
            </div>

            {/* Calendar Name */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calendar Name *
              </label>
              <input
                type="text"
                name="calendarName"
                value={calendar.calendarName}
                onChange={handleInputChange}
                placeholder="e.g., Main Company Calendar"
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.calendarName ? 'border-red-500' : 'border-gray-300'
                }`}
                maxLength={200}
              />
              {errors.calendarName && (
                <p className="mt-1 text-sm text-red-600">{errors.calendarName}</p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={calendar.description}
                onChange={handleInputChange}
                placeholder="Enter calendar description (optional)"
                rows={4}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                maxLength={1000}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {calendar.description.length}/1000 characters
              </p>
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={calendar.isActive === 1}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Active Calendar</span>
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Inactive calendars will not be available for employee assignments
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              to="/settings/calendars"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  {isEditMode ? 'Update Calendar' : 'Create Calendar'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Holiday Management Section - Only show in edit mode */}
      {isEditMode && (
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <button
                  onClick={() => setShowHolidaySection(!showHolidaySection)}
                  className="flex items-center text-lg font-semibold text-gray-900"
                >
                  <CalendarIcon className="h-6 w-6 mr-2 text-cyan-500" />
                  Holiday Management
                  {showHolidaySection ? (
                    <ChevronUpIcon className="h-5 w-5 ml-2" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 ml-2" />
                  )}
                </button>
              </div>
              {showHolidaySection && (
                <div className="flex space-x-2">
                  <button
                    onClick={openTemplateModal}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <StarIcon className="h-4 w-4 mr-2" />
                    Templates
                  </button>
                  <button
                    onClick={openHolidayModal}
                    className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Holiday
                  </button>
                </div>
              )}
            </div>

            {showHolidaySection && (
              <div className="space-y-4">
                {holidays.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No holidays configured</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Add holidays to define when employees will have time off
                    </p>
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={openTemplateModal}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <StarIcon className="h-4 w-4 mr-2" />
                        Use Templates
                      </button>
                      <button
                        onClick={openHolidayModal}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Custom Holiday
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {holidays.map((holiday) => (
                      <div key={holiday.HOLIDAY_ID} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-medium text-gray-900">{holiday.HOLIDAY_NAME}</h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHolidayTypeColor(holiday.HOLIDAY_TYPE)}`}>
                                {holidayTypes.find(t => t.value === holiday.HOLIDAY_TYPE)?.label || holiday.HOLIDAY_TYPE}
                              </span>
                              {holiday.IS_RECURRING === 1 && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <ClockIcon className="h-3 w-3 mr-1" />
                                  Recurring
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">Pattern:</span> {getHolidayPatternLabel(holiday.HOLIDAY_PATTERN)}
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">When:</span> {formatHolidayDisplay(holiday)}
                            </div>
                            {holiday.DESCRIPTION && (
                              <p className="text-sm text-gray-600">{holiday.DESCRIPTION}</p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteHoliday(holiday.HOLIDAY_ID, holiday.HOLIDAY_NAME)}
                            className="text-red-600 hover:text-red-900 ml-4"
                            title="Delete Holiday"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Calendar Management Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Calendar codes should be unique and descriptive (e.g., MAIN_CALENDAR, BRANCH_OFFICE)</li>
          <li>• Use clear, descriptive names that employees will understand</li>
          <li>• Inactive calendars cannot be assigned to employees</li>
          <li>• After creating a calendar, you can add holidays using templates or custom patterns</li>
          <li>• Recurring holidays (like weekends) will automatically apply to all future dates</li>
          <li>• Named holidays (like Diwali) can be added using predefined templates</li>
        </ul>
      </div>

      {/* Holiday Modal */}
      {showHolidayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add Custom Holiday</h3>

            <div className="space-y-4">
              {/* Holiday Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Holiday Name *
                </label>
                <input
                  type="text"
                  name="holidayName"
                  value={modalHoliday.holidayName}
                  onChange={handleHolidayInputChange}
                  placeholder="e.g., Company Foundation Day"
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    modalErrors.holidayName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {modalErrors.holidayName && (
                  <p className="mt-1 text-sm text-red-600">{modalErrors.holidayName}</p>
                )}
              </div>

              {/* Holiday Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Holiday Type
                </label>
                <select
                  name="holidayType"
                  value={modalHoliday.holidayType}
                  onChange={handleHolidayInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {holidayTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Holiday Pattern */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pattern Type *
                </label>
                <select
                  name="holidayPattern"
                  value={modalHoliday.holidayPattern}
                  onChange={handleHolidayInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {holidayPatterns.map(pattern => (
                    <option key={pattern.value} value={pattern.value}>
                      {pattern.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pattern-specific fields */}
              {modalHoliday.holidayPattern === 'SPECIFIC_DATE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Holiday Date *
                  </label>
                  <input
                    type="date"
                    name="holidayDate"
                    value={modalHoliday.holidayDate}
                    onChange={handleHolidayInputChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      modalErrors.holidayDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {modalErrors.holidayDate && (
                    <p className="mt-1 text-sm text-red-600">{modalErrors.holidayDate}</p>
                  )}
                </div>
              )}

              {modalHoliday.holidayPattern === 'WEEKLY' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day of Week *
                  </label>
                  <select
                    name="dayOfWeek"
                    value={modalHoliday.dayOfWeek || ''}
                    onChange={handleHolidayInputChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      modalErrors.dayOfWeek ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Day</option>
                    {dayOfWeekOptions.map(day => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                  {modalErrors.dayOfWeek && (
                    <p className="mt-1 text-sm text-red-600">{modalErrors.dayOfWeek}</p>
                  )}
                </div>
              )}

              {modalHoliday.holidayPattern === 'YEARLY' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Month *
                    </label>
                    <select
                      name="monthOfYear"
                      value={modalHoliday.monthOfYear || ''}
                      onChange={handleHolidayInputChange}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        modalErrors.monthOfYear ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Month</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>
                          {new Date(2024, month - 1).toLocaleDateString('en-US', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                    {modalErrors.monthOfYear && (
                      <p className="mt-1 text-sm text-red-600">{modalErrors.monthOfYear}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Day of Month
                    </label>
                    <select
                      name="dayOfMonth"
                      value={modalHoliday.dayOfMonth || ''}
                      onChange={handleHolidayInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Day</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Or Week of Month
                    </label>
                    <select
                      name="weekOfMonth"
                      value={modalHoliday.weekOfMonth || ''}
                      onChange={handleHolidayInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Week</option>
                      {weekOfMonthOptions.map(week => (
                        <option key={week.value} value={week.value}>
                          {week.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={modalHoliday.description}
                  onChange={handleHolidayInputChange}
                  placeholder="Optional description"
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={closeHolidayModal}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700"
                onClick={saveHoliday}
              >
                Save Holiday
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add Holiday from Template</h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose from predefined holiday templates to quickly add common holidays to your calendar.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {namedHolidayTemplates.map((template) => (
                <div key={template.templateCode} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{template.templateName}</h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getHolidayTypeColor(template.holidayType)}`}>
                      {holidayTypes.find(t => t.value === template.holidayType)?.label || template.holidayType}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <button
                    onClick={() => createHolidayFromTemplate(template)}
                    className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add to Calendar
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={closeTemplateModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarForm; 
import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  CalendarDaysIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserGroupIcon,
  MapPinIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { calendarAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

// Helper to get days in month
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Helper to get day of week for first day of month
function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

// Helper to convert YYYY-MM-DD to DD-MM-YYYY
function convertToDDMMYYYY(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}-${month}-${year}`;
}

// Helper to convert DD-MM-YYYY to YYYY-MM-DD
function convertToYYYYMMDD(dateString) {
  if (!dateString) return '';
  const [day, month, year] = dateString.split('-');
  return `${year}-${month}-${day}`;
}

// Helper to auto-format date as user types
function formatDateInput(value) {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Add dashes at appropriate positions
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 8)}`;
}

// Helper to validate date format
function validateDateFormat(dateString) {
  if (!dateString) return false;
  const regex = /^\d{2}-\d{2}-\d{4}$/;
  if (!regex.test(dateString)) return false;
  
  const [day, month, year] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.getDate() === day && 
         date.getMonth() === month - 1 && 
         date.getFullYear() === year &&
         year >= 1900 && year <= 2100;
}

const Calendar = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendar, setSelectedCalendar] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [holidayTypes, setHolidayTypes] = useState([]);
  const [modalHoliday, setModalHoliday] = useState({
    holidayName: '',
    holidayDate: '',
    holidayType: 'PUBLIC_HOLIDAY',
    description: ''
  });
  const [errors, setErrors] = useState({});

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeek(year, month);
  const days = [...Array(daysInMonth).keys()].map(i => new Date(year, month, i + 1));

  useEffect(() => {
    if (isAuthenticated) {
      fetchCalendars();
      fetchHolidayTypes();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedCalendar) {
      fetchHolidays();
    }
  }, [selectedCalendar, year]);

  const fetchCalendars = async () => {
    try {
      setLoading(true);
      const response = await calendarAPI.getDropdown();
      setCalendars(response.data);
      if (response.data.length > 0) {
        setSelectedCalendar(response.data[0].CALENDAR_ID);
      }
    } catch (error) {
      console.error('Error fetching calendars:', error);
      toast.error('Failed to fetch calendars');
    } finally {
      setLoading(false);
    }
  };

  const fetchHolidayTypes = async () => {
    try {
      const response = await calendarAPI.getHolidayTypes();
      setHolidayTypes(response.data);
    } catch (error) {
      console.error('Error fetching holiday types:', error);
    }
  };

  const fetchHolidays = async () => {
    if (!selectedCalendar) return;
    
    try {
      const response = await calendarAPI.getHolidaysByCalendar(selectedCalendar, year);
      setHolidays(response.data);
    } catch (error) {
      console.error('Error fetching holidays:', error);
      toast.error('Failed to fetch holidays');
    }
  };

  const openHolidayModal = (date = null) => {
    if (date) {
      const dateString = date.toISOString().split('T')[0];
      setModalHoliday({
        holidayName: '',
        holidayDate: convertToDDMMYYYY(dateString),
        holidayType: 'PUBLIC_HOLIDAY',
        description: ''
      });
    } else {
      setModalHoliday({
        holidayName: '',
        holidayDate: '',
        holidayType: 'PUBLIC_HOLIDAY',
        description: ''
      });
    }
    setErrors({});
    setShowHolidayModal(true);
  };

  const closeHolidayModal = () => {
    setShowHolidayModal(false);
    setModalHoliday({
      holidayName: '',
      holidayDate: '',
      holidayType: 'PUBLIC_HOLIDAY',
      description: ''
    });
    setErrors({});
  };

  const validateHolidayForm = () => {
    const newErrors = {};

    if (!modalHoliday.holidayName.trim()) {
      newErrors.holidayName = 'Holiday name is required';
    }

    if (!modalHoliday.holidayDate) {
      newErrors.holidayDate = 'Holiday date is required';
    } else if (!validateDateFormat(modalHoliday.holidayDate)) {
      newErrors.holidayDate = 'Please enter a valid date in DD-MM-YYYY format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveHoliday = async () => {
    if (!validateHolidayForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      const holidayData = {
        calendarId: selectedCalendar,
        holidayName: modalHoliday.holidayName,
        holidayDate: convertToYYYYMMDD(modalHoliday.holidayDate),
        holidayType: modalHoliday.holidayType,
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

  const handleDateInputChange = (e) => {
    const { value } = e.target;
    const formattedValue = formatDateInput(value);
    setModalHoliday(prev => ({ ...prev, holidayDate: formattedValue }));
    
    if (errors.holidayDate) {
      setErrors(prev => ({ ...prev, holidayDate: '' }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setModalHoliday(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const getHolidayForDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return holidays.find(holiday => holiday.HOLIDAY_DATE === dateString);
  };

  const getWeeklyHolidayForDate = (date) => {
    if (!selectedCalendar || !selectedCalendar.WEEKLY_HOLIDAYS) return null;
    
    const dayOfWeek = date.getDay();
    return selectedCalendar.WEEKLY_HOLIDAYS.find(holiday => holiday.dayOfWeek === dayOfWeek);
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

  const getHolidayTypeLabel = (holidayType) => {
    const type = holidayTypes.find(t => t.value === holidayType);
    return type ? type.label : holidayType;
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Authentication Required</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please log in to access the calendar.
        </p>
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <CalendarDaysIcon className="h-7 w-7 text-cyan-500 mr-2" />
            Holiday Calendar
          </h1>
          <p className="mt-1 text-sm text-gray-500">Manage company holidays and employee schedules</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        <button
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            onClick={() => openHolidayModal()}
        >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Holiday
        </button>
      </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Calendar Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calendar
              </label>
              <select
                value={selectedCalendar || ''}
                onChange={(e) => setSelectedCalendar(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select Calendar</option>
                {calendars.map(calendar => (
                  <option key={calendar.CALENDAR_ID} value={calendar.CALENDAR_ID}>
                    {calendar.CALENDAR_NAME} ({calendar.CALENDAR_CODE})
                  </option>
                ))}
              </select>
            </div>

            {/* Year Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                value={year}
                onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), month, 1))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100">
            <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
          </button>
          <div className="text-lg font-semibold text-gray-900">
            {currentDate.toLocaleString('default', { month: 'long' })} {year}
          </div>
          <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100">
            <ChevronRightIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-500 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {Array(firstDayOfWeek).fill(null).map((_, i) => <div key={i}></div>)}
          {days.map(date => {
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const holiday = getHolidayForDate(date);
            const weeklyHoliday = getWeeklyHolidayForDate(date);
            
            return (
              <button
                key={date.toDateString()}
                className={`rounded-lg p-2 w-full h-20 flex flex-col items-center justify-center border transition-all relative
                  ${isSelected ? 'bg-cyan-100 border-cyan-400 text-cyan-900 font-bold' : 
                    isToday ? 'border-cyan-200 bg-cyan-50' : 
                    holiday ? 'border-red-200 bg-red-50' : 
                    weeklyHoliday ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-white'}
                  hover:bg-cyan-50`}
                onClick={() => setSelectedDate(date)}
              >
                <span className="text-sm">{date.getDate()}</span>
                {holiday && (
                  <div className="absolute top-1 right-1">
                    <div className={`w-2 h-2 rounded-full ${getHolidayTypeColor(holiday.HOLIDAY_TYPE).split(' ')[0]}`}></div>
                  </div>
                )}
                {weeklyHoliday && !holiday && (
                  <div className="absolute top-1 right-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  </div>
                )}
                {holiday && (
                  <span className="text-xs text-gray-600 mt-1 truncate w-full">
                    {holiday.HOLIDAY_NAME}
                  </span>
                )}
                {weeklyHoliday && !holiday && (
                  <span className="text-xs text-blue-600 mt-1 truncate w-full">
                    {weeklyHoliday.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Holiday List for Selected Day */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold text-gray-900">
            Holidays for {selectedDate.toLocaleDateString('en-GB')}
          </div>
          <button
            onClick={() => openHolidayModal(selectedDate)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Holiday
          </button>
        </div>
        
        {(() => {
          const dayHolidays = holidays.filter(holiday => {
            const holidayDate = new Date(holiday.HOLIDAY_DATE);
            return holidayDate.toDateString() === selectedDate.toDateString();
          });
          const weeklyHoliday = getWeeklyHolidayForDate(selectedDate);

          if (dayHolidays.length === 0 && !weeklyHoliday) {
            return (
              <div className="text-gray-400 text-center py-8">
                <CalendarDaysIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No holidays for this day</p>
                <p className="text-sm">Click "Add Holiday" to create one</p>
              </div>
            );
          }

          return (
            <div className="space-y-3">
              {/* Weekly Holiday */}
              {weeklyHoliday && (
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-blue-900">{weeklyHoliday.label}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Weekly Holiday
                        </span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Recurring weekly holiday - every {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][weeklyHoliday.dayOfWeek]}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Date-based Holidays */}
              {dayHolidays.map(holiday => (
                <div key={holiday.HOLIDAY_ID} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900">{holiday.HOLIDAY_NAME}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHolidayTypeColor(holiday.HOLIDAY_TYPE)}`}>
                          {getHolidayTypeLabel(holiday.HOLIDAY_TYPE)}
                        </span>
                      </div>
                      {holiday.DESCRIPTION && (
                        <p className="text-sm text-gray-600">{holiday.DESCRIPTION}</p>
                      )}
                    </div>
          </div>
        </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Holiday Type Legend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Holiday Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {holidayTypes.map(type => (
            <div key={type.value} className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getHolidayTypeColor(type.value).split(' ')[0]}`}></div>
              <span className="text-sm text-gray-700">{type.label}</span>
                </div>
          ))}
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-700">Weekly Holiday</span>
          </div>
        </div>
      </div>

      {/* Holiday Modal */}
      {showHolidayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Holiday</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Holiday Name *
                </label>
                <input
                  type="text"
                  name="holidayName"
                  value={modalHoliday.holidayName}
                  onChange={handleInputChange}
                  placeholder="e.g., New Year's Day"
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.holidayName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.holidayName && (
                  <p className="mt-1 text-sm text-red-600">{errors.holidayName}</p>
        )}
      </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Holiday Date *
                </label>
            <input
              type="text"
                  name="holidayDate"
                  value={modalHoliday.holidayDate}
                  onChange={handleDateInputChange}
                  placeholder="DD-MM-YYYY (e.g., 25-12-2024)"
                  maxLength={10}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.holidayDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.holidayDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.holidayDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Holiday Type
                </label>
                <select
                  name="holidayType"
                  value={modalHoliday.holidayType}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {holidayTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
            <textarea
                  name="description"
                  value={modalHoliday.description}
                  onChange={handleInputChange}
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
    </div>
  );
};

export default Calendar; 
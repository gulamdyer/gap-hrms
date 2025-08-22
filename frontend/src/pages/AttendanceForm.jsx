import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  CheckIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { attendanceAPI, employeeAPI, shiftAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

// Date conversion functions from DATE_HANDLING_GUIDE.md
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
  
  // Try to parse other formats
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
  }
  
  return null;
};

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

const AttendanceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attendance, setAttendance] = useState(null);
  const [dropdownData, setDropdownData] = useState({
    employees: [],
    shifts: []
  });
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    employeeId: '',
    attendanceDate: '',
    status: 'PRESENT',
    actualInTime: '',
    actualOutTime: '',
    workHours: '',
    overtimeHours: '',
    lateMinutes: '',
    earlyLeaveMinutes: '',
    inMethod: 'MANUAL',
    outMethod: 'MANUAL',
    inLocation: '',
    outLocation: '',
    inDeviceId: '',
    outDeviceId: '',
    remarks: ''
  });

  // Auto-calc: work hours, overtime hours, late minutes
  useEffect(() => {
    if (!formData.actualInTime || !formData.actualOutTime) return;
    const inTime = new Date(`2000-01-01T${formData.actualInTime}:00`);
    const outTime = new Date(`2000-01-01T${formData.actualOutTime}:00`);
    let workHrs = Math.max(0, (outTime - inTime) / (1000 * 60 * 60));
    workHrs = Math.round(workHrs * 100) / 100;

    // Find selected employee's shift
    const employee = (dropdownData.employees || []).find(e => String(e.EMPLOYEE_ID ?? e.employeeId) === String(formData.employeeId));
    const shiftId = employee?.SHIFT_ID ?? employee?.shiftId ?? null;
    const shift = (dropdownData.shifts || []).find(s => String(s.SHIFT_ID ?? s.shiftId) === String(shiftId));

    let overtimeHrs = 0;
    let lateMins = 0;
    let earlyMins = 0;
    if (shift) {
      const start = String(shift.START_TIME || shift.startTime || '09:00');
      const end = String(shift.END_TIME || shift.endTime || '18:00');
      const tolLate = Number(shift.LATE_COMING_TOLERANCE || shift.lateComingTolerance || 0);
      const tolEarly = Number(shift.EARLY_GOING_TOLERANCE || shift.earlyGoingTolerance || 0);
      const flexEnabled = (shift.FLEXIBLE_TIME_APPLICABLE === 1) || String(shift.flexibleTimeApplicable || '').toUpperCase() === 'Y';
      const otEnabled = (shift.OVERTIME_APPLICABLE === 1) || String(shift.overtimeApplicable || '').toUpperCase() === 'Y';
      const otCap = Number(shift.OVERTIME_CAP_HOURS || shift.overtimeCapHours || 0);

      const shiftStart = new Date(`2000-01-01T${start}:00`);
      const shiftEnd = new Date(`2000-01-01T${end}:00`);
      const shiftDurationHrs = Math.max(0, (shiftEnd - shiftStart) / (1000 * 60 * 60));

      if (otEnabled) {
        overtimeHrs = Math.max(0, workHrs - shiftDurationHrs);
        if (otCap > 0) overtimeHrs = Math.min(overtimeHrs, otCap);
        overtimeHrs = Math.round(overtimeHrs * 100) / 100;
      }

      if (!flexEnabled) {
        const allowedIn = new Date(shiftStart.getTime() + tolLate * 60000);
        if (inTime > allowedIn) {
          lateMins = Math.round((inTime - allowedIn) / 60000);
        }

        const allowedOut = new Date(shiftEnd.getTime() - tolEarly * 60000);
        if (outTime < allowedOut) {
          earlyMins = Math.round((allowedOut - outTime) / 60000);
        }
      }
    }

    setFormData(prev => ({
      ...prev,
      workHours: workHrs,
      overtimeHours: overtimeHrs,
      lateMinutes: lateMins,
      earlyLeaveMinutes: earlyMins
    }));
  }, [formData.actualInTime, formData.actualOutTime, formData.employeeId, dropdownData.employees, dropdownData.shifts]);

  const formatHoursToHHMM = (hours) => {
    const totalMinutes = Math.round(Number(hours || 0) * 60);
    const hh = Math.floor(totalMinutes / 60);
    const mm = totalMinutes % 60;
    return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
  };

  const formatMinutesToHHMM = (minutes) => {
    const totalMinutes = Math.round(Number(minutes || 0));
    const hh = Math.floor(totalMinutes / 60);
    const mm = totalMinutes % 60;
    return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDropdownData();
      if (id) {
        fetchAttendance();
      } else {
        setLoading(false);
      }
    }
  }, [isAuthenticated, id]);

  const fetchDropdownData = async () => {
    try {
      const [employeesRes, shiftsRes] = await Promise.all([
        employeeAPI.getDropdown(),
        shiftAPI.getDropdown()
      ]);

      setDropdownData({
        employees: employeesRes.data || [],
        shifts: shiftsRes.data || []
      });
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      toast.error('Failed to fetch dropdown data');
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getById(id);
      const attendanceData = response.data;
      
      setAttendance(attendanceData);
      setFormData({
        employeeId: attendanceData.EMPLOYEE_ID || '',
        attendanceDate: convertToDDMMYYYY(attendanceData.ATTENDANCE_DATE) || '',
        status: attendanceData.STATUS || 'PRESENT',
        actualInTime: attendanceData.ACTUAL_IN_TIME || '',
        actualOutTime: attendanceData.ACTUAL_OUT_TIME || '',
        workHours: attendanceData.WORK_HOURS || '',
        overtimeHours: attendanceData.OVERTIME_HOURS || '',
        lateMinutes: attendanceData.LATE_MINUTES || '',
        inMethod: attendanceData.IN_METHOD || 'MANUAL',
        outMethod: attendanceData.OUT_METHOD || 'MANUAL',
        inLocation: attendanceData.IN_LOCATION || '',
        outLocation: attendanceData.OUT_LOCATION || '',
        inDeviceId: attendanceData.IN_DEVICE_ID || '',
        outDeviceId: attendanceData.OUT_DEVICE_ID || '',
        remarks: attendanceData.REMARKS || ''
      });
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to fetch attendance details');
      navigate('/attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for date fields
    if (name === 'attendanceDate') {
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
        setValidationErrors(prev => ({
          ...prev,
          [name]: 'Please enter a valid date in DD-MM-YYYY format'
        }));
      } else if (validationErrors[name]) {
        setValidationErrors(prev => ({
          ...prev,
          [name]: undefined
        }));
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      // Handle non-date fields normally
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate attendance date
    if (formData.attendanceDate && !validateDateFormat(formData.attendanceDate)) {
      toast.error('Please enter a valid attendance date in DD-MM-YYYY format');
      return;
    }
    
    try {
      setSaving(true);
      
      // Convert date to backend format
      const submitData = {
        ...formData,
        attendanceDate: convertToYYYYMMDD(formData.attendanceDate)
      };
      
      if (id) {
        // Update existing attendance
        await attendanceAPI.update(id, submitData);
        toast.success('Attendance record updated successfully');
      } else {
        // Create new attendance
        await attendanceAPI.create(submitData);
        toast.success('Attendance record created successfully');
      }
      
      navigate('/attendance');
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('Failed to save attendance record');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Authentication Required</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please log in to access attendance form.
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
            to="/attendance"
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to List
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {id ? 'Edit Attendance' : 'Add Attendance'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {id ? 'Update attendance record details' : 'Create a new attendance record'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Attendance Information</h3>
          </div>
          <div className="px-6 py-6 space-y-6">
            {/* Employee and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee <span className="text-red-500">*</span>
                </label>
                <select
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Employee</option>
                  {dropdownData.employees.map((employee) => (
                    <option key={employee.EMPLOYEE_ID} value={employee.EMPLOYEE_ID}>
                      {employee.EMPLOYEE_CODE} - {employee.FIRST_NAME} {employee.LAST_NAME}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attendance Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="attendanceDate"
                  value={formData.attendanceDate}
                  onChange={handleInputChange}
                  required
                  maxLength={10}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="DD-MM-YYYY (e.g., 25-12-1990)"
                />
                {validationErrors.attendanceDate && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.attendanceDate}</p>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="LEAVE">Leave</option>
                <option value="HOLIDAY">Holiday</option>
                <option value="WEEKEND">Weekend</option>
              </select>
            </div>

            {/* Time Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check In Time
                </label>
                <input
                  type="time"
                  name="actualInTime"
                  value={formData.actualInTime}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check Out Time
                </label>
                <input
                  type="time"
                  name="actualOutTime"
                  value={formData.actualOutTime}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Hours and Minutes */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Work Hours
                </label>
                <input
                  type="text"
                  name="workHoursDisplay"
                  value={formatHoursToHHMM(formData.workHours)}
                  readOnly
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Overtime Hours
                </label>
                <input
                  type="text"
                  name="overtimeHoursDisplay"
                  value={formatHoursToHHMM(formData.overtimeHours)}
                  readOnly
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Late Came Hours
                </label>
                <input
                  type="text"
                  name="lateDisplay"
                  value={formatMinutesToHHMM(formData.lateMinutes)}
                  readOnly
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Early Leave Hours
                </label>
                <input
                  type="text"
                  name="earlyLeaveDisplay"
                  value={formatMinutesToHHMM(formData.earlyLeaveMinutes)}
                  readOnly
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700"
                />
              </div>
            </div>

            {/* Method Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check In Method
                </label>
                <select
                  name="inMethod"
                  value={formData.inMethod}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="MANUAL">Manual</option>
                  <option value="BIOMETRIC">Biometric</option>
                  <option value="CARD">Card</option>
                  <option value="MOBILE">Mobile</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check Out Method
                </label>
                <select
                  name="outMethod"
                  value={formData.outMethod}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="MANUAL">Manual</option>
                  <option value="BIOMETRIC">Biometric</option>
                  <option value="CARD">Card</option>
                  <option value="MOBILE">Mobile</option>
                </select>
              </div>
            </div>

            {/* Location & Device fields intentionally hidden to keep form minimal */}

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows={3}
                placeholder="Enter any additional remarks"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <Link
            to="/attendance"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <CheckIcon className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : (id ? 'Update' : 'Create')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AttendanceForm; 
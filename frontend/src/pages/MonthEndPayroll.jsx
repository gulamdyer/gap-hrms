import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarIcon, 
  PlayIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  EyeIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  UserIcon,
  ArrowDownOnSquareIcon,
  PencilIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { payrollAPI, employeeAPI, compensationAPI } from '../services/api';
import { AvatarDisplay } from '../utils/avatar';
import useAuthStore from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import PayrollValidationButton from '../components/PayrollValidationButton';
import { useError } from '../context/ErrorContext';
import toast from 'react-hot-toast';

// Date helper functions from DATE_HANDLING_GUIDE.md
const convertToDDMMYYYY = (dateString) => {
  if (!dateString || dateString === '') return '-';
  
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
  
  return '-';
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

// Helper functions for time conversion
const minutesToHHMM = (minutes) => {
  if (!minutes || minutes === 0) return '00:00';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const hoursToHHMM = (hours) => {
  if (!hours || hours === 0) return '00:00';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const hhmmToMinutes = (hhmmString) => {
  if (!hhmmString || hhmmString === '00:00') return 0;
  const [hours, minutes] = hhmmString.split(':').map(Number);
  return (hours * 60) + minutes;
};

const hhmmToHours = (hhmmString) => {
  if (!hhmmString || hhmmString === '00:00') return 0;
  const [hours, minutes] = hhmmString.split(':').map(Number);
  return hours + (minutes / 60);
};

// Flexible parsing like the referenced snippet: accepts H, H:MM, or H:MM:SS
const getSecondsFromFlexible = (value) => {
  if (typeof value !== 'string') return 0;
  const [str1, str2, str3] = value.split(':');
  const val1 = Number(str1);
  const val2 = Number(str2);
  const val3 = Number(str3);
  if (!isNaN(val1) && isNaN(val2) && isNaN(val3)) {
    return Math.max(0, val1);
  }
  if (!isNaN(val1) && !isNaN(val2) && isNaN(val3)) {
    return Math.max(0, val1) * 60 + Math.max(0, val2);
  }
  if (!isNaN(val1) && !isNaN(val2) && !isNaN(val3)) {
    return Math.max(0, val1) * 3600 + Math.max(0, val2) * 60 + Math.max(0, val3);
  }
  return 0;
};

// Normalize to H:MM (no leading zero on hours)
const normalizeToHhMm = (value) => {
  const secs = Math.max(0, getSecondsFromFlexible(value));
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor(secs / 60) % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

// Parse HH:MM format specifically for time inputs (accepts H, H:MM formats)
const parseHoursMinutes = (value) => {
  if (typeof value !== 'string') return 0;
  const [str1, str2] = value.split(':');
  const hours = Number(str1);
  const minutes = Number(str2);
  
  if (!isNaN(hours) && isNaN(minutes)) {
    // Just hours (e.g., "33")
    return Math.max(0, hours);
  }
  if (!isNaN(hours) && !isNaN(minutes)) {
    // Hours and minutes (e.g., "33:45")
    return Math.max(0, hours) + Math.max(0, minutes) / 60;
  }
  return 0;
};

// Normalize HH:MM input to H:MM format for the four specific time inputs
const normalizeHoursMinutes = (value) => {
  const totalHours = Math.max(0, parseHoursMinutes(value));
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

const validateInput = (value, fieldName) => {
  if (value === '' || value === null || value === undefined) {
    return false; // Don't allow blank values
  }
  const numValue = parseFloat(value);
  if (isNaN(numValue) || numValue < 0) {
    return false; // Don't allow negative values
  }
  return true;
};

const MonthEndPayroll = () => {
  const { user } = useAuthStore();
  const { showError } = useError();
  const navigate = useNavigate();
  
  // Core state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [processType, setProcessType] = useState('FULL');
  
  // Step progress state
  const [currentStep, setCurrentStep] = useState(1);
  const [stepStatus, setStepStatus] = useState({
    step1: 'active', // active, completed, disabled
    step2: 'pending', // pending, active, completed, failed, disabled
    step3: 'pending',
    step4: 'pending'
  });
  
  // Step 1: Month/Year/Type Selection (always enabled)
  
  // Step 2: Pre-Payroll Checks
  const [validationResults, setValidationResults] = useState(null);
  const [validationLoading, setValidationLoading] = useState(false);
  
  // Step 3: Process Attendance
  const [attendanceProcessing, setAttendanceProcessing] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);
  const [showAttendanceSummary, setShowAttendanceSummary] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [editEmployeeDetail, setEditEmployeeDetail] = useState(null);
  const [editEmployeeCompensation, setEditEmployeeCompensation] = useState([]);
  // Raw input mirrors to avoid formatter fighting user typing (HH:MM)
  const [rawFinalWorkHhmm, setRawFinalWorkHhmm] = useState('');
  const [rawFinalOtHhmm, setRawFinalOtHhmm] = useState('');
  const [rawFinalLateHhmm, setRawFinalLateHhmm] = useState('');
  const [rawFinalShortHhmm, setRawFinalShortHhmm] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Step 4: Process Month-End Payroll
  const [payrollProcessing, setPayrollProcessing] = useState(false);
  const [processingResults, setProcessingResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [cleanedJustNow, setCleanedJustNow] = useState(false);
  const [statusJustRefreshed, setStatusJustRefreshed] = useState(false);
  

  
  // Clean data functionality
  const [cleaning, setCleaning] = useState(false);
  const [showCleanModal, setShowCleanModal] = useState(false);
  const [showCleanCompleteModal, setShowCleanCompleteModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  
  // Status tracking
  const [monthEndStatus, setMonthEndStatus] = useState(null);

  // Check current status on load and when month/year changes
  useEffect(() => {
    checkMonthEndStatus();
  }, [currentMonth, currentYear]);

  useEffect(() => {
    updateStepStatus();
  }, [validationResults, attendanceData, processingResults, payrollProcessing]);

  // Debug useEffect for showSuccessMessage
  useEffect(() => {
    console.log('🔍 showSuccessMessage state changed to:', showSuccessMessage);
  }, [showSuccessMessage]);

  // Validation state for Final Overrides
  const [payableDaysValidation, setPayableDaysValidation] = useState({ isValid: true, message: '' });

  // Helper function to get days in current month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  // Helper function to get shift hours (assuming 8 hours default if not available)
  const getShiftHours = (employee) => {
    // You can enhance this to get actual shift hours from employee data
    // For now, using a default of 8 hours per day
    return 8;
  };

  // Auto-calculation function for Final Overrides
  const calculateFinalValues = (updatedValues, currentEditRow) => {
    const shiftHours = getShiftHours(currentEditRow);
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    
    // 1. Auto-calculate Final Payable Days
    const finalPresentDays = Number(updatedValues.FINAL_PRESENT_DAYS) || 0;
    const finalWeeklyOffDays = Number(updatedValues.FINAL_WEEKLY_OFF_DAYS) || 0;
    const finalHolidayDays = Number(updatedValues.FINAL_HOLIDAY_DAYS) || 0;
    const finalPaidLeaveDays = Number(updatedValues.FINAL_PAID_LEAVE_DAYS) || 0;
    const finalUnpaidLeaveDays = Number(updatedValues.FINAL_UNPAID_LEAVE_DAYS) || 0;
    
    const calculatedPayableDays = finalPresentDays + finalWeeklyOffDays + finalHolidayDays + finalPaidLeaveDays;
    
    // 2. Validate Final Payable Days
    const isPayableDaysValid = calculatedPayableDays <= daysInMonth;
    const validationMessage = isPayableDaysValid ? '' : 
      `Final Payable Days (${calculatedPayableDays}) cannot exceed days in ${getMonthName(currentMonth)} ${currentYear} (${daysInMonth} days)`;
    
    setPayableDaysValidation({
      isValid: isPayableDaysValid,
      message: validationMessage
    });
    
    // 3-6. Auto-calculate hours based on shift hours
    const finalWeeklyOffHours = finalWeeklyOffDays * shiftHours;
    const finalHolidayHours = finalHolidayDays * shiftHours;
    const finalPaidLeaveHours = finalPaidLeaveDays * shiftHours;
    const finalUnpaidLeaveHours = finalUnpaidLeaveDays * shiftHours;
    
    // Calculate Final Payable Hours = Work + Weekly Off + Holiday + Paid Leave Hours
    const finalWorkHours = Number(updatedValues.FINAL_WORK_HOURS) || 0;
    const calculatedPayableHours = finalWorkHours + finalWeeklyOffHours + finalHolidayHours + finalPaidLeaveHours;
    const finalRequiredHours = calculatedPayableDays * shiftHours;
    
    // Calculate OT Hours if shift has overtime enabled
    // Check if overtime is applicable for this employee's shift
    const isOvertimeEnabled = (editEmployeeDetail?.OVERTIME_APPLICABLE === 1) || 
                             (currentEditRow?.OVERTIME_APPLICABLE === 1) || 
                             false;
    const calculatedOtHours = (isOvertimeEnabled && calculatedPayableHours > finalRequiredHours) 
      ? Math.max(0, calculatedPayableHours - finalRequiredHours) 
      : (updatedValues.FINAL_OT_HOURS || 0);
    
    const calculatedValues = {
      ...updatedValues,
      FINAL_PAYABLE_DAYS: calculatedPayableDays,
      FINAL_WEEKLY_OFF_HOURS: finalWeeklyOffHours,
      FINAL_HOLIDAY_HOURS: finalHolidayHours,
      FINAL_PAID_LEAVE_HOURS: finalPaidLeaveHours,
      FINAL_UNPAID_LEAVE_HOURS: finalUnpaidLeaveHours,
      FINAL_TOTAL_HOURS: calculatedPayableHours, // This is now "Final Payable Hours"
      FINAL_REQUIRED_HOURS: finalRequiredHours,
      FINAL_OT_HOURS: calculatedOtHours
    };
    
    return calculatedValues;
  };

  // Enhanced handleEditValueChange with auto-calculations
  const handleEditValueChange = (field, value) => {
    // Keep raw HH:MM mirrors in sync so UI shows exactly what user types
    if (field === 'FINAL_WORK_HOURS') setRawFinalWorkHhmm(value);
    if (field === 'FINAL_OT_HOURS') setRawFinalOtHhmm(value);
    if (field === 'FINAL_LATE_MINUTES') setRawFinalLateHhmm(value);
    if (field === 'FINAL_SHORT_HOURS') setRawFinalShortHhmm(value);
    // Convert HH:MM format back to decimal for storage
    let processedValue = value;
    
    const isHhmm = typeof value === 'string' && value.includes(':');
    if (field === 'FINAL_LATE_MINUTES') {
      // store minutes - use parseHoursMinutes and convert to minutes
      processedValue = isHhmm ? parseHoursMinutes(value) * 60 : Number(value ?? 0);
    } else if (
      field === 'FINAL_WORK_HOURS' ||
      field === 'FINAL_OT_HOURS' ||
      field === 'FINAL_SHORT_HOURS'
    ) {
      // store decimal hours - use parseHoursMinutes for these specific fields
      processedValue = isHhmm ? parseHoursMinutes(value) : Number(value ?? 0);
    } else if (field.includes('HOURS')) {
      // store decimal hours - use original hhmmToHours for other hour fields
      processedValue = isHhmm ? hhmmToHours(value) : Number(value ?? 0);
    }
    
    const updatedValues = {
      ...editValues,
      [field]: processedValue
    };
    
    // Trigger auto-calculations if relevant fields changed
    const fieldsToRecalculate = [
      'FINAL_PRESENT_DAYS', 'FINAL_WEEKLY_OFF_DAYS', 'FINAL_HOLIDAY_DAYS', 
      'FINAL_PAID_LEAVE_DAYS', 'FINAL_UNPAID_LEAVE_DAYS', 'FINAL_WORK_HOURS'
    ];
    
    if (fieldsToRecalculate.includes(field)) {
      const calculatedValues = calculateFinalValues(updatedValues, editRow);
      setEditValues(calculatedValues);
      // Also reflect calculated numeric back to raw mirrors so the shown HH:MM stays in sync
      // Use normalizeHoursMinutes format for the 4 specific time inputs
      // BUT skip updating the raw input for the field being currently edited to avoid interference
      const workHours = calculatedValues.FINAL_WORK_HOURS ?? 0;
      const otHours = calculatedValues.FINAL_OT_HOURS ?? 0;
      const lateMinutes = calculatedValues.FINAL_LATE_MINUTES ?? 0;
      const shortHours = calculatedValues.FINAL_SHORT_HOURS ?? 0;
      
      if (field !== 'FINAL_WORK_HOURS') {
        setRawFinalWorkHhmm(`${Math.floor(workHours)}:${Math.round((workHours - Math.floor(workHours)) * 60).toString().padStart(2, '0')}`);
      }
      if (field !== 'FINAL_OT_HOURS') {
        setRawFinalOtHhmm(`${Math.floor(otHours)}:${Math.round((otHours - Math.floor(otHours)) * 60).toString().padStart(2, '0')}`);
      }
      if (field !== 'FINAL_LATE_MINUTES') {
        setRawFinalLateHhmm(`${Math.floor(lateMinutes / 60)}:${Math.round(lateMinutes % 60).toString().padStart(2, '0')}`);
      }
      if (field !== 'FINAL_SHORT_HOURS') {
        setRawFinalShortHhmm(`${Math.floor(shortHours)}:${Math.round((shortHours - Math.floor(shortHours)) * 60).toString().padStart(2, '0')}`);
      }
    } else {
      setEditValues(updatedValues);
    }
  };

  const handleEditSave = async () => {
    // Check validation before saving
    if (!payableDaysValidation.isValid) {
      alert('Please fix validation errors before saving.');
      return;
    }
    
    try {
      // Prepare data for API call
      const toNumber = (v) => (v === '' || v === undefined || v === null ? null : Number(v));
      const finalValues = {
        finalPresentDays: toNumber(editValues.FINAL_PRESENT_DAYS),
        finalWorkHours: toNumber(editValues.FINAL_WORK_HOURS),
        finalOtHours: toNumber(editValues.FINAL_OT_HOURS),
        finalLateMinutes: toNumber(editValues.FINAL_LATE_MINUTES),
        finalShortHours: toNumber(editValues.FINAL_SHORT_HOURS),
        finalPaidLeaveDays: toNumber(editValues.FINAL_PAID_LEAVE_DAYS),
        finalUnpaidLeaveDays: toNumber(editValues.FINAL_UNPAID_LEAVE_DAYS),
        finalPayableDays: toNumber(editValues.FINAL_PAYABLE_DAYS),
        finalWeeklyOffDays: toNumber(editValues.FINAL_WEEKLY_OFF_DAYS),
        finalWeeklyOffHours: toNumber(editValues.FINAL_WEEKLY_OFF_HOURS),
        finalHolidayDays: toNumber(editValues.FINAL_HOLIDAY_DAYS),
        finalHolidayHours: toNumber(editValues.FINAL_HOLIDAY_HOURS),
        finalPaidLeaveHours: toNumber(editValues.FINAL_PAID_LEAVE_HOURS),
        finalUnpaidLeaveHours: toNumber(editValues.FINAL_UNPAID_LEAVE_HOURS),
        finalTotalHours: toNumber(editValues.FINAL_TOTAL_HOURS),
        finalRequiredHours: toNumber(editValues.FINAL_REQUIRED_HOURS),
        finalRemarks: editRemarks || null,
      };

      const baseValues = {
        presentDays: toNumber(editRow.PRESENT_DAYS),
        totalWorkHours: toNumber(editRow.TOTAL_WORK_HOURS),
        totalOtHours: toNumber(editRow.TOTAL_OT_HOURS),
        totalLateMinutes: toNumber(editRow.TOTAL_LATE_MINUTES),
        totalShortHours: toNumber(editRow.TOTAL_SHORT_HOURS),
        paidLeaveDays: toNumber(editRow.PAID_LEAVE_DAYS),
        unpaidLeaveDays: toNumber(editRow.UNPAID_LEAVE_DAYS),
        payableDays: toNumber(editRow.PAYABLE_DAYS),
        weeklyOffDays: toNumber(editRow.WEEKLY_OFF_DAYS),
        weeklyOffHours: toNumber(editRow.WEEKLY_OFF_HOURS),
        holidayDays: toNumber(editRow.HOLIDAY_DAYS),
        holidayHours: toNumber(editRow.HOLIDAY_HOURS),
        paidLeaveHours: toNumber(editRow.PAID_LEAVE_HOURS),
        totalHours: toNumber(editRow.TOTAL_HOURS),
        requiredHours: toNumber(editRow.REQUIRED_HOURS),
      };

      const payload = {
        month: currentMonth,
        year: currentYear,
        employeeId: editRow.EMPLOYEE_ID,
        finalValues,
        baseValues,
      };

      console.log('Calling API to update HRMS_PAYROLL_ATTENDANCE_SUMMARY with payload:', payload);
      
      // Call API to update the database
      const response = await payrollAPI.updateAttendanceFinal(payload);
      
      console.log('API response for attendance final update:', response);

      // Update the UI table with the edited FINAL_ values only after successful API call
      setAttendanceSummary((prev) =>
        prev.map((emp) =>
          emp.EMPLOYEE_ID === editRow.EMPLOYEE_ID
            ? { 
                ...emp, 
                // Update all FINAL_ prefixed columns with the edited values
                FINAL_PRESENT_DAYS: editValues.FINAL_PRESENT_DAYS,
                FINAL_WEEKLY_OFF_DAYS: editValues.FINAL_WEEKLY_OFF_DAYS,
                FINAL_HOLIDAY_DAYS: editValues.FINAL_HOLIDAY_DAYS,
                FINAL_PAID_LEAVE_DAYS: editValues.FINAL_PAID_LEAVE_DAYS,
                FINAL_UNPAID_LEAVE_DAYS: editValues.FINAL_UNPAID_LEAVE_DAYS,
                FINAL_PAYABLE_DAYS: editValues.FINAL_PAYABLE_DAYS,
                FINAL_WORK_HOURS: editValues.FINAL_WORK_HOURS,
                FINAL_WEEKLY_OFF_HOURS: editValues.FINAL_WEEKLY_OFF_HOURS,
                FINAL_HOLIDAY_HOURS: editValues.FINAL_HOLIDAY_HOURS,
                FINAL_PAID_LEAVE_HOURS: editValues.FINAL_PAID_LEAVE_HOURS,
                FINAL_UNPAID_LEAVE_HOURS: editValues.FINAL_UNPAID_LEAVE_HOURS,
                FINAL_TOTAL_HOURS: editValues.FINAL_TOTAL_HOURS,
                FINAL_REQUIRED_HOURS: editValues.FINAL_REQUIRED_HOURS,
                FINAL_OT_HOURS: editValues.FINAL_OT_HOURS,
                FINAL_LATE_MINUTES: editValues.FINAL_LATE_MINUTES,
                FINAL_SHORT_HOURS: editValues.FINAL_SHORT_HOURS,
                REMARKS: editRemarks
              }
            : emp
        )
      );
      
      console.log('Successfully updated FINAL_ values in database and UI table');
      setShowEditModal(false);
    } catch (error) {
      console.error('Error saving edit values to database:', error);
      // Show error message to user
      alert('Failed to save changes. Please try again.');
    }
  };





  // Clean month function
  const confirmCleanMonth = async () => {
    setCleaning(true);
    try {
      await payrollAPI.cleanMonthData(currentMonth, currentYear);
      setShowCleanModal(false);
      setShowCleanCompleteModal(true);
      
      // Reset all states
      setValidationResults(null);
      setAttendanceData(null);
      setProcessingResults(null);
      setAttendanceSummary([]);
      setShowAttendanceSummary(false);
      setShowResults(false);
      setShowSuccessMessage(false);
      setMonthEndStatus(null);
      
      // Reset step status
      setStepStatus({
        step1: 'completed',
        step2: 'active',
        step3: 'pending',
        step4: 'pending'
      });
      
      setCleanedJustNow(true);
      setTimeout(() => setCleanedJustNow(false), 3000);
    } catch (error) {
      console.error('Error cleaning month data:', error);
      toast.error('Failed to clean month data');
    } finally {
      setCleaning(false);
    }
  };

  const updateStepStatus = () => {
    const newStatus = { ...stepStatus };
    
    // Step 1 is always completed once month/year are selected
    newStatus.step1 = 'completed';
    
    // Step 2 depends on validation results
    if (validationResults) {
      if (validationResults.overallStatus === 'READY' && 
          validationResults.totalEmployees === validationResults.passedEmployees) {
        newStatus.step2 = 'completed';
        newStatus.step3 = 'active';
      } else {
        newStatus.step2 = 'failed';
        newStatus.step3 = 'disabled';
        newStatus.step4 = 'disabled';
      }
    } else {
      newStatus.step2 = 'active';
      newStatus.step3 = 'disabled';
      newStatus.step4 = 'disabled';
    }
    
    // Step 3 depends on attendance processing
    if (attendanceData && newStatus.step2 === 'completed') {
      newStatus.step3 = 'completed';
      newStatus.step4 = 'active';
    }
    
    // Step 4 depends on payroll processing
    if (processingResults && newStatus.step3 === 'completed') {
      newStatus.step4 = 'completed';
    } else if (payrollProcessing) {
      newStatus.step4 = 'active';
    }
    
    setStepStatus(newStatus);
  };

  // Check if can proceed to step
  const canProceedToStep = (step) => {
    switch (step) {
      case 1:
        return true; // Always can proceed to step 1
      case 2:
        return stepStatus.step1 === 'completed';
      case 3:
        return stepStatus.step2 === 'completed';
      case 4:
        return stepStatus.step3 === 'completed';
      default:
        return false;
    }
  };

  // Get step color for train station
  const getStepColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'active':
        return 'bg-indigo-500 text-white';
      case 'failed':
        return 'bg-red-500 text-white';
      case 'pending':
      case 'disabled':
      default:
        return 'bg-gray-300 text-gray-600';
    }
  };

  // Get step icon for train station
  const getStepIcon = (stepNumber, status) => {
    if (status === 'completed') {
      return <CheckCircleIcon className="h-5 w-5" />;
    } else if (status === 'failed') {
      return <XCircleIcon className="h-5 w-5" />;
    } else {
      return stepNumber;
    }
  };

  const checkMonthEndStatus = async () => {
    try {
      const response = await payrollAPI.getMonthEndStatus({ month: currentMonth, year: currentYear });
      setMonthEndStatus(response.data);
      
      // Set step status based on existing data
      if (response.data?.exists) {
        const period = response.data.period;
        if (period.STATUS === 'COMPLETED') {
          setStepStatus({
            step1: 'completed',
            step2: 'completed', 
            step3: 'completed',
            step4: 'completed'
          });
          setCurrentStep(4);
        } else if (period.STATUS === 'PROCESSING') {
          setStepStatus({
            step1: 'completed',
            step2: 'completed',
            step3: 'completed', 
            step4: 'active'
          });
          setCurrentStep(4);
        }
      }
    } catch (error) {
      console.error('Error checking month-end status:', error);
      showError({
        title: "Failed to Check Month-End Status",
        message: "Unable to retrieve month-end payroll status. Please refresh the page and try again.",
        details: error.message
      });
    }
  };

  const handleValidationComplete = (results) => {
    setValidationResults(results);
    if (results.overallStatus === 'READY' && 
        results.totalEmployees === results.passedEmployees) {
      setCurrentStep(3);
    }
  };

  const handleProcessAttendance = async () => {
    if (attendanceData) {
      // If attendance already processed, just show the data
      setShowAttendanceSummary(true);
      return;
    }

    setAttendanceProcessing(true);
    try {
      const response = await payrollAPI.processAttendance(currentMonth, currentYear);
      if (response.success) {
        // Mark as saved if it's already processed or if we just processed it successfully
        const attendanceDataWithSaved = { 
          ...response, 
          saved: response.alreadyProcessed || response.success 
        };
        setAttendanceData(attendanceDataWithSaved);
        setAttendanceSummary(response.attendanceSummary || []);
        setShowAttendanceSummary(true);
        setCurrentStep(4);
      }
    } catch (error) {
      console.error('Error processing attendance:', error);
      showError({
        title: "Attendance Processing Failed",
        message: "There was an error processing attendance data. This could be due to missing database tables or data integrity issues.",
        details: error.response?.data?.message || error.message,
        actionButton: (
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
            onClick={() => {
              // Clear error and retry
              setAttendanceProcessing(false);
              setTimeout(() => handleProcessAttendance(), 100);
            }}
          >
            Try Again
          </button>
        )
      });
    } finally {
      setAttendanceProcessing(false);
    }
  };

  const handleProcessPayroll = async () => {
    setPayrollProcessing(true);
    try {
      console.log('🚀 Starting payroll processing for:', currentMonth, currentYear, processType);
      const response = await payrollAPI.processMonthEnd(currentMonth, currentYear, processType);
      console.log('📡 API Response:', response);
      console.log('📊 Response data:', response.data);

      // Some backends return { success, message, data }, where response.data is the payload
      // Others return { success, data } with success nested. Use a robust success detector.
      const apiSuccess = (response && response.success === true)
        || (response && response.status === 200 && response.data && !('success' in response.data))
        || (response && response.data && response.data.success === true);
      console.log('✅ Success flag (normalized):', apiSuccess);
      
      if (apiSuccess) {
        console.log('🎉 Setting success message to true');
        console.log('🔍 Before state update:');
        console.log('  - showSuccessMessage:', showSuccessMessage);
        console.log('  - processingResults:', processingResults);
        console.log('  - showResults:', showResults);
        
        // Prefer nested data if present, else use response.data directly
        const payload = (response && response.data && response.data.data) ? response.data.data : response.data;
        setProcessingResults(payload);
        setShowResults(true);
        setShowSuccessMessage(true);
        
        console.log('🔍 After state update calls:');
        console.log('  - setShowSuccessMessage(true) called');
        console.log('  - setProcessingResults(payload) called');
        console.log('  - setShowResults(true) called');
        
        // Check state after a brief delay to see if it actually updated
        setTimeout(() => {
          console.log('🔍 State check after 100ms:');
          console.log('  - showSuccessMessage:', showSuccessMessage);
          console.log('  - processingResults:', processingResults);
          console.log('  - showResults:', showResults);
        }, 100);
        
        console.log('🔄 Refreshing status data...');
        // Refresh status data to ensure Current Status section shows latest info
        await checkMonthEndStatus();
        updateStepStatus(); // Update step completion status
        
        // Show status refresh indicator briefly
        setStatusJustRefreshed(true);
        setTimeout(() => {
          setStatusJustRefreshed(false);
        }, 3000);
        
        // Keep success message visible until the user navigates away
        
        console.log('✅ Payroll processing completed successfully');
      } else {
        console.log('❌ API indicated failure');
        console.log('📝 Response data:', response.data);
      }
    } catch (error) {
      console.error('Error processing payroll:', error);
      console.error('Full error response:', error.response);
      console.error('Error response data:', error.response?.data);
      
      // Handle specific error cases
      const errorMessage = error.response?.data?.message || error.message;
      const errorData = error.response?.data;
      const errorDetails = error.response?.data?.error || error.response?.data?.details || error.stack;
      
      if (errorMessage === "Payroll period already exists for this month") {
        showError({
          title: "Payroll Period Already Exists",
          message: `The payroll period for ${getMonthName(currentMonth)} ${currentYear} has already been created and processed.`,
          details: errorData?.data?.periodId ? `Period ID: ${errorData.data.periodId}` : null,
          actionButton: (
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
              onClick={() => navigate(`/payroll/periods/${errorData?.data?.periodId}`)}
            >
              View Existing Period
            </button>
          )
        });
      } else if (errorMessage.includes("No payroll period exists")) {
        showError({
          title: "Payroll Period Required",
          message: `No payroll period found for ${getMonthName(currentMonth)} ${currentYear}. You must create a payroll period before processing payroll.`,
          details: `To process payroll for ${getMonthName(currentMonth)} ${currentYear}, please:
          
1. Create a new payroll period for this month and year
2. Configure the period dates and settings
3. Ensure the period status is set to 'DRAFT' or 'PROCESSING'
4. Return to month-end processing once the period is created

Technical Error: ${errorMessage}`,
          actionButton: (
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
              onClick={() => navigate('/payroll/periods/new')}
            >
              Create Payroll Period
            </button>
          )
        });
      } else if (errorMessage.includes("Invalid period ID or period is not in processable status")) {
        showError({
          title: "Payroll Period Status Issue",
          message: `The payroll period for ${getMonthName(currentMonth)} ${currentYear} exists but cannot be processed due to its current status.`,
          details: `The stored procedure requires a valid payroll period to be in a processable status. Please ensure:
          
1. The period status allows processing (DRAFT or PROCESSING status)
2. The period is not already completed or locked
3. All required period data is properly configured
4. Previous month's payroll (if any) has been completed

Technical Error: ${errorMessage}`,
          actionButton: (
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
              onClick={() => navigate('/payroll/periods')}
            >
              Go to Payroll Periods
            </button>
          )
        });
      } else if (errorMessage.includes("Stored procedure error")) {
        // Extract the actual procedure error message
        const procedureError = errorMessage.replace("Stored procedure error: ", "");
        showError({
          title: "Payroll Processing Error",
          message: "The payroll processing procedure encountered an error. Please review the details and contact your system administrator if the issue persists.",
          details: `Procedure Error: ${procedureError}
          
This error typically occurs when:
- Required data is missing or incomplete
- Database constraints are violated
- Business rules validation fails
- System configuration issues exist

Month: ${getMonthName(currentMonth)} ${currentYear}
Process Type: ${processType}`,
          actionButton: (
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          )
        });
      } else {
        showError({
          title: "Payroll Processing Failed",
          message: "An error occurred while processing the month-end payroll. Please review the details below and try again.",
          details: errorDetails || errorMessage,
          actionButton: (
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
              onClick={() => handleProcessPayroll()}
            >
              Try Again
            </button>
          )
        });
      }
    } finally {
      setPayrollProcessing(false);
    }
  };

  const handleSaveAttendanceSummary = async () => {
    setSavingAttendance(true);
    try {
      const response = await payrollAPI.saveAttendanceSummary(currentMonth, currentYear, attendanceSummary);
      if (response.data.success) {
        setAttendanceData({ ...attendanceData, saved: true });
        setShowAttendanceModal(false);
      }
    } catch (error) {
      console.error('Error saving attendance summary:', error);
      alert('Failed to save attendance summary. Please check the console for details.');
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleCleanMonth = () => {
    setShowCleanModal(true);
  };





  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const isStepDisabled = (step) => {
    return stepStatus[`step${step}`] === 'disabled';
  };

  const isStepCompleted = (step) => {
    return stepStatus[`step${step}`] === 'completed';
  };



  // Label width alignment per section (labels above inputs)
  const scDaysLabelRefs = React.useRef([]);
  const scHoursLabelRefs = React.useRef([]);
  const foDaysLabelRefs = React.useRef([]);
  const foHoursLabelRefs = React.useRef([]);
  const [scDaysInputPx, setScDaysInputPx] = useState(110);
  const [scHoursInputPx, setScHoursInputPx] = useState(110);
  const [foDaysInputPx, setFoDaysInputPx] = useState(110);
  const [foHoursInputPx, setFoHoursInputPx] = useState(110);

  useEffect(() => {
    if (!showEditModal) return;
    // Defer to next paint to ensure DOM is ready
    requestAnimationFrame(() => {
      const maxWidth = (nodes) => Math.max(110, ...nodes.map(n => (n && n.offsetWidth) || 0));
      setScDaysInputPx(maxWidth(scDaysLabelRefs.current));
      setScHoursInputPx(maxWidth(scHoursLabelRefs.current));
      setFoDaysInputPx(maxWidth(foDaysLabelRefs.current));
      setFoHoursInputPx(maxWidth(foHoursLabelRefs.current));
    });
  }, [showEditModal, editRow]);

  const handleEditClick = (row) => {
    setEditRow(row);
    // Fetch employee details and compensation to show avatar and key fields
    if (row?.EMPLOYEE_ID) {
      (async () => {
        try {
          const empRes = await employeeAPI.getById(row.EMPLOYEE_ID);
          setEditEmployeeDetail(empRes.data);
        } catch (e) {
          console.error('Failed to fetch employee detail for edit modal', e);
        }
        try {
          const compRes = await compensationAPI.getByEmployeeId(row.EMPLOYEE_ID);
          setEditEmployeeCompensation(compRes.data || []);
        } catch (e) {
          console.error('Failed to fetch employee compensation for edit modal', e);
        }
      })();
    } else {
      setEditEmployeeDetail(null);
      setEditEmployeeCompensation([]);
    }
    
    // Initial values based on existing data
    const initialValues = {
      // Days section
      FINAL_PRESENT_DAYS: row.FINAL_PRESENT_DAYS ?? row.PRESENT_DAYS ?? 0,
      FINAL_WEEKLY_OFF_DAYS: row.FINAL_WEEKLY_OFF_DAYS ?? row.WEEKLY_OFF_DAYS ?? 0,
      FINAL_HOLIDAY_DAYS: row.FINAL_HOLIDAY_DAYS ?? row.HOLIDAY_DAYS ?? 0,
      FINAL_PAID_LEAVE_DAYS: row.FINAL_PAID_LEAVE_DAYS ?? row.PAID_LEAVE_DAYS ?? 0,
      FINAL_UNPAID_LEAVE_DAYS: row.FINAL_UNPAID_LEAVE_DAYS ?? row.UNPAID_LEAVE_DAYS ?? 0,
      FINAL_PAYABLE_DAYS: row.FINAL_PAYABLE_DAYS ?? row.PAYABLE_DAYS ?? 0,
      // Hours section
      FINAL_WORK_HOURS: row.FINAL_WORK_HOURS ?? row.TOTAL_WORK_HOURS ?? 0,
      FINAL_WEEKLY_OFF_HOURS: row.FINAL_WEEKLY_OFF_HOURS ?? row.WEEKLY_OFF_HOURS ?? 0,
      FINAL_HOLIDAY_HOURS: row.FINAL_HOLIDAY_HOURS ?? row.HOLIDAY_HOURS ?? 0,
      FINAL_PAID_LEAVE_HOURS: row.FINAL_PAID_LEAVE_HOURS ?? row.PAID_LEAVE_HOURS ?? 0,
      FINAL_UNPAID_LEAVE_HOURS: row.FINAL_UNPAID_LEAVE_HOURS ?? 0,
      FINAL_TOTAL_HOURS: row.FINAL_TOTAL_HOURS ?? row.TOTAL_HOURS ?? 0,
      FINAL_REQUIRED_HOURS: row.FINAL_REQUIRED_HOURS ?? row.REQUIRED_HOURS ?? 0,
      FINAL_OT_HOURS: row.FINAL_OT_HOURS ?? row.TOTAL_OT_HOURS ?? 0,
      FINAL_LATE_MINUTES: row.FINAL_LATE_MINUTES ?? row.TOTAL_LATE_MINUTES ?? 0,
      FINAL_SHORT_HOURS: row.FINAL_SHORT_HOURS ?? row.TOTAL_SHORT_HOURS ?? 0,
    };
    
    // Apply auto-calculations to ensure consistency
    const calculatedValues = calculateFinalValues(initialValues, row);
    setEditValues(calculatedValues);
    // Initialize raw mirrors to what user sees (H:MM format without leading zeros)
    const initWorkHours = calculatedValues.FINAL_WORK_HOURS ?? 0;
    const initOtHours = calculatedValues.FINAL_OT_HOURS ?? 0;
    const initLateMinutes = calculatedValues.FINAL_LATE_MINUTES ?? 0;
    const initShortHours = calculatedValues.FINAL_SHORT_HOURS ?? 0;
    
    setRawFinalWorkHhmm(`${Math.floor(initWorkHours)}:${Math.round((initWorkHours - Math.floor(initWorkHours)) * 60).toString().padStart(2, '0')}`);
    setRawFinalOtHhmm(`${Math.floor(initOtHours)}:${Math.round((initOtHours - Math.floor(initOtHours)) * 60).toString().padStart(2, '0')}`);
    setRawFinalLateHhmm(`${Math.floor(initLateMinutes / 60)}:${Math.round(initLateMinutes % 60).toString().padStart(2, '0')}`);
    setRawFinalShortHhmm(`${Math.floor(initShortHours)}:${Math.round((initShortHours - Math.floor(initShortHours)) * 60).toString().padStart(2, '0')}`);
    
    setEditRemarks(row.REMARKS || '');
    setShowEditModal(true);
  };



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
        <h1 className="text-3xl font-bold text-gray-900">Month-End Payroll Processing</h1>
        <p className="mt-2 text-gray-600">
          Follow the 4-step process to complete month-end payroll processing for {getMonthName(currentMonth)} {currentYear}
        </p>
          </div>
          <button
            onClick={() => navigate('/payroll')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Payroll
          </button>
        </div>
      </div>

      {/* Train Station Progress Indicator */}
      <div className={`bg-white shadow rounded-lg p-6 mb-8 transition-all duration-500 ${
        cleanedJustNow ? 'ring-2 ring-green-500 ring-opacity-50 bg-green-50' : ''
      }`}>
        {cleanedJustNow && (
          <div className="mb-4 flex items-center justify-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              Reset Complete - Ready to Start Fresh!
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          {/* Step 1 */}
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${getStepColor(stepStatus.step1)}`}>
              {getStepIcon(1, stepStatus.step1)}
            </div>
            <div className="mt-2 text-center">
              <div className="text-xs font-medium text-gray-900">Step 1</div>
              <div className="text-xs text-gray-500">Setup</div>
            </div>
          </div>
          
          {/* Connector */}
          <div className={`flex-1 h-1 mx-2 ${stepStatus.step2 === 'pending' ? 'bg-gray-200' : 'bg-indigo-500'}`}></div>
          
          {/* Step 2 */}
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${getStepColor(stepStatus.step2)}`}>
              {getStepIcon(2, stepStatus.step2)}
            </div>
            <div className="mt-2 text-center">
              <div className="text-xs font-medium text-gray-900">Step 2</div>
              <div className="text-xs text-gray-500">Pre-Checks</div>
            </div>
          </div>
          
          {/* Connector */}
          <div className={`flex-1 h-1 mx-2 ${stepStatus.step3 === 'pending' || stepStatus.step3 === 'disabled' ? 'bg-gray-200' : 'bg-indigo-500'}`}></div>
          
          {/* Step 3 */}
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${getStepColor(stepStatus.step3)}`}>
              {getStepIcon(3, stepStatus.step3)}
            </div>
            <div className="mt-2 text-center">
              <div className="text-xs font-medium text-gray-900">Step 3</div>
              <div className="text-xs text-gray-500">Attendance</div>
            </div>
          </div>
          
          {/* Connector */}
          <div className={`flex-1 h-1 mx-2 ${stepStatus.step4 === 'pending' || stepStatus.step4 === 'disabled' ? 'bg-gray-200' : 'bg-indigo-500'}`}></div>
          
          {/* Step 4 */}
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${getStepColor(stepStatus.step4)}`}>
              {payrollProcessing ? (
                <ClockIcon className="h-5 w-5 animate-spin" />
              ) : (
                getStepIcon(4, stepStatus.step4)
              )}
            </div>
            <div className="mt-2 text-center">
              <div className="text-xs font-medium text-gray-900">Step 4</div>
              <div className="text-xs text-gray-500">
                {payrollProcessing ? 'Processing...' : 'Payroll'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Month/Year/Process Type Selection */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStepColor(stepStatus.step1)} mr-3`}>
            1
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Step 1: Select Processing Parameters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Month
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700">
              {getMonthName(currentMonth)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700">
              {currentYear}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Process Type
            </label>
            <select
              value={processType}
              onChange={(e) => setProcessType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="FULL">Full Processing</option>
              <option value="PARTIAL">Partial Processing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Step 2: Pre-Payroll Checks */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStepColor(stepStatus.step2)} mr-3`}>
              {stepStatus.step2 === 'completed' ? <CheckCircleIcon className="h-5 w-5" /> : 
               stepStatus.step2 === 'failed' ? <XCircleIcon className="h-5 w-5" /> : '2'}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Step 2: Run Pre-Payroll Checks</h2>
          </div>
          <div className="flex items-center space-x-2">
            {stepStatus.step2 === 'completed' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                All Checks Passed
              </span>
            )}
            {stepStatus.step2 === 'failed' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <XCircleIcon className="h-4 w-4 mr-1" />
                Issues Found
              </span>
            )}
          </div>
        </div>
        
        <div className="mb-4">
          {cleanedJustNow && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-blue-500 mr-2" />
                <p className="text-sm text-blue-800 font-medium">
                  Data successfully cleaned! You can now start the payroll process fresh for {getMonthName(currentMonth)} {currentYear}.
                </p>
              </div>
            </div>
          )}
          <p className="text-sm text-gray-600 mb-4">
            Verify that all active employees have proper pay components defined. If Total Employee and Passed Employee counts don't match, 
            you cannot proceed to the next step until all issues are resolved.
          </p>
        </div>

        <PayrollValidationButton 
          month={currentMonth} 
          year={currentYear}
          onValidationComplete={handleValidationComplete}
        />

        {validationResults && (
          <div className="mt-4 p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Validation Results</h4>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                validationResults.overallStatus === 'READY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {validationResults.overallStatus}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Employees:</span>
                <span className="ml-2 font-medium">{validationResults.totalEmployees || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">Passed Employees:</span>
                <span className="ml-2 font-medium">{validationResults.passedEmployees || 0}</span>
              </div>
            </div>
            {validationResults.totalEmployees !== validationResults.passedEmployees && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="text-sm text-yellow-800">
                    {validationResults.totalEmployees - validationResults.passedEmployees} employees have missing pay components. 
                    Please define pay components for all active employees or mark them as inactive before proceeding.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 3: Process Attendance */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStepColor(stepStatus.step3)} mr-3`}>
              {stepStatus.step3 === 'completed' ? <CheckCircleIcon className="h-5 w-5" /> : '3'}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Step 3: Process Attendance</h2>
          </div>
          <div className="flex items-center space-x-2">
            {stepStatus.step3 === 'completed' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Attendance Processed
              </span>
            )}
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-4">
            Process attendance data for all employees. If attendance has already been processed, 
            clicking this button will show the existing data instead of reprocessing.
          </p>
        </div>

        <button
          onClick={handleProcessAttendance}
          disabled={!canProceedToStep(3) || attendanceProcessing}
          className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
            canProceedToStep(3) ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50`}
        >
          {attendanceProcessing ? (
            <>
              <ClockIcon className="h-5 w-5 mr-2 animate-spin" />
              Processing Attendance...
            </>
          ) : attendanceData ? (
            <>
              <EyeIcon className="h-5 w-5 mr-2" />
              View Attendance Data
            </>
          ) : (
            <>
              <UserIcon className="h-5 w-5 mr-2" />
              Process Attendance
            </>
          )}
        </button>

        {!canProceedToStep(3) && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">
                Complete Step 2 successfully before processing attendance.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Step 4: Process Month-End Payroll */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStepColor(stepStatus.step4)} mr-3`}>
              {stepStatus.step4 === 'completed' ? <CheckCircleIcon className="h-5 w-5" /> : '4'}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Step 4: Process Month-End Payroll</h2>
          </div>
          <div className="flex items-center space-x-2">
            {stepStatus.step4 === 'completed' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Payroll Completed
              </span>
            )}
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-4">
            Process the final payroll calculation based on saved attendance data. This will use final working days, 
            overtime hours, late coming hours, and short hours from the attendance processing step.
          </p>
        </div>

        <button
          onClick={handleProcessPayroll}
          disabled={!canProceedToStep(4) || payrollProcessing}
          className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
            canProceedToStep(4) ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50`}
        >
          {payrollProcessing ? (
            <>
              <ClockIcon className="h-5 w-5 mr-2 animate-spin" />
              Processing Payroll...
            </>
          ) : (
            <>
              <CurrencyDollarIcon className="h-5 w-5 mr-2" />
              Process Month-End Payroll
            </>
          )}
        </button>

        {!canProceedToStep(4) && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">
                Complete Step 3 (Process Attendance) before processing payroll.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <CheckCircleIcon className="h-8 w-8 text-green-400 mr-4 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-green-900">
                Step 4: Month-End Payroll Processing Completed Successfully!
              </h3>
              <p className="mt-2 text-sm text-green-700">
                Payroll for <strong>{getMonthName(currentMonth)} {currentYear}</strong> has been processed successfully with the following results:
              </p>
              
              {/* Processing Results Summary */}
              {processingResults && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-center">
                        <UserGroupIcon className="h-5 w-5 text-green-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Employees Processed</p>
                          <p className="text-lg font-semibold text-green-600">
                            {(
                              processingResults?.data?.results?.processedEmployees ??
                              processingResults?.results?.processedEmployees ??
                              processingResults?.data?.results?.totalEmployees ??
                              processingResults?.results?.totalEmployees ??
                              processingResults?.data?.totalEmployees ??
                              processingResults?.totalEmployees ??
                              'N/A'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-5 w-5 text-green-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Total Payroll Amount</p>
                          <p className="text-lg font-semibold text-green-600">
                            {processingResults.data?.totalPayroll ? 
                              `${processingResults.data.totalPayroll.toLocaleString()}` : 
                              processingResults.totalPayroll ? 
                              `${processingResults.totalPayroll.toLocaleString()}` : 
                              'Processed'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-center">
                        <ClockIcon className="h-5 w-5 text-green-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Process Status</p>
                          <p className="text-lg font-semibold text-green-600">COMPLETED</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">What happened:</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>✅ Attendance data has been validated and finalized</li>
                      <li>✅ Payroll calculations completed for all active employees</li>
                      <li>✅ Salary components, overtime, and deductions calculated</li>
                      <li>✅ Payroll period status updated to "COMPLETED"</li>
                      <li>✅ Data is now ready for approval and disbursement</li>
                    </ul>
                  </div>
                </div>
              )}
              
              <p className="mt-4 text-sm text-green-700 font-medium">
                The "Current Status" section below has been refreshed with the latest information.
              </p>
            </div>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="ml-4 flex-shrink-0 rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
       

      {/* Current Status Overview */}
      {(monthEndStatus?.exists || processingResults) && (
        <div className={`bg-white shadow rounded-lg p-6 transition-all duration-500 ${
          statusJustRefreshed ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50' : ''
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
            Current Status for {getMonthName(currentMonth)} {currentYear}
          </h3>
            {statusJustRefreshed && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Status Updated
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {monthEndStatus?.period?.PERIOD_NAME || `${getMonthName(currentMonth)}-${currentYear}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {monthEndStatus?.period ? 
                      `${convertToDDMMYYYY(monthEndStatus.period.START_DATE)} - ${convertToDDMMYYYY(monthEndStatus.period.END_DATE)}` :
                      `01-${currentMonth.toString().padStart(2, '0')}-${currentYear} - ${new Date(currentYear, currentMonth, 0).getDate()}-${currentMonth.toString().padStart(2, '0')}-${currentYear}`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  (monthEndStatus?.period?.STATUS === 'COMPLETED' || stepStatus.step4 === 'completed') ? 'bg-green-100 text-green-800' :
                  (monthEndStatus?.period?.STATUS === 'PROCESSING' || payrollProcessing) ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {stepStatus.step4 === 'completed' ? 'COMPLETED' : 
                   payrollProcessing ? 'PROCESSING' :
                   monthEndStatus?.period?.STATUS || 'DRAFT'}
                </span>
              </div>
            </div>

            {(monthEndStatus?.statistics || processingResults?.data) && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <UserGroupIcon className="h-5 w-5 text-blue-400" />
                    <div className="ml-2">
                      <p className="text-sm font-medium text-blue-900">Employees</p>
                      <p className="text-lg font-semibold text-blue-900">
                        {processingResults?.data?.employeesProcessed || 
                         monthEndStatus?.statistics?.TOTAL_EMPLOYEES || 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 text-green-400" />
                    <div className="ml-2">
                      <p className="text-sm font-medium text-green-900">Gross Pay</p>
                      <p className="text-lg font-semibold text-green-900">
                        {formatCurrency(processingResults?.data?.totalGrossPay || 
                                       monthEndStatus?.statistics?.TOTAL_GROSS_PAY)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 text-purple-400" />
                    <div className="ml-2">
                      <p className="text-sm font-medium text-purple-900">Net Pay</p>
                      <p className="text-lg font-semibold text-purple-900">
                        {formatCurrency(processingResults?.data?.totalNetPay || 
                                       monthEndStatus?.statistics?.TOTAL_NET_PAY)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-2">
                      <p className="text-sm font-medium text-red-900">Deductions</p>
                      <p className="text-lg font-semibold text-red-900">
                        {formatCurrency(processingResults?.data?.totalDeductions || 
                                       monthEndStatus?.statistics?.TOTAL_DEDUCTIONS)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {/* Clean Month Data Confirmation Modal */}
      {showCleanModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
              <h3 className="text-lg font-medium text-gray-900 mt-5">Clean Month Data</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  This will permanently delete all payroll processing data for {getMonthName(currentMonth)} {currentYear}, including:
                </p>
                <ul className="mt-3 text-sm text-gray-500 text-left">
                  <li>• Attendance summary records</li>
                  <li>• Payroll calculation data</li>
                  <li>• Period and run information</li>
                  <li>• All related processing data</li>
                </ul>
                <p className="text-sm text-red-600 mt-3 font-medium">
                  This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={confirmCleanMonth}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 mr-2"
                >
                  Yes, Clean Data
                </button>
                <button
                  onClick={() => setShowCleanModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clean Complete Modal */}
      {showCleanCompleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
              <h3 className="text-lg font-medium text-gray-900 mt-5">Month Data Cleaned Successfully!</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 mb-3">
                  All payroll data for {getMonthName(currentMonth)} {currentYear} has been successfully cleaned.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 font-medium">
                    ✨ Ready to Start Fresh!
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    You can now begin the month-end payroll process again. Start with Step 2: Pre-Payroll Checks.
                </p>
              </div>
              </div>
              <div className="items-center px-4 py-3 space-x-2">
                <button
                  onClick={() => setShowCleanCompleteModal(false)}
                  className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
                >
                  Continue Here
                </button>
                <button
                  onClick={() => {
                    setShowCleanCompleteModal(false);
                    navigate('/payroll');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Go to Payroll
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Summary Modal */}
      {showAttendanceSummary && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <span className="mr-2"><UserGroupIcon className="h-6 w-6 inline text-indigo-500" /></span>
                  Attendance Summary - {getMonthName(currentMonth)} {currentYear}
                </h3>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 border text-sm font-medium">Recalculate</button>
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 border text-sm font-medium">Export</button>
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 border text-sm font-medium">Print</button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present Days</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Hours</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OT Hours</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Late Hours</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Short Hours</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Leave</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unpaid Leave</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payable Days</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceSummary.map((emp, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          <div className="font-semibold">{emp.EMPLOYEE_CODE}</div>
                          <div className="text-xs text-gray-500">{emp.FIRST_NAME} {emp.LAST_NAME}</div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{emp.FINAL_PRESENT_DAYS ?? emp.PRESENT_DAYS ?? 0}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{hoursToHHMM(emp.FINAL_WORK_HOURS ?? emp.TOTAL_WORK_HOURS ?? 0)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{hoursToHHMM(emp.FINAL_OT_HOURS ?? emp.TOTAL_OT_HOURS ?? 0)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{minutesToHHMM(emp.FINAL_LATE_MINUTES ?? emp.TOTAL_LATE_MINUTES ?? 0)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{hoursToHHMM(emp.FINAL_SHORT_HOURS ?? emp.TOTAL_SHORT_HOURS ?? 0)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{emp.FINAL_PAID_LEAVE_DAYS ?? emp.PAID_LEAVE_DAYS ?? 0}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{emp.FINAL_UNPAID_LEAVE_DAYS ?? emp.UNPAID_LEAVE_DAYS ?? 0}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{emp.FINAL_PAYABLE_DAYS ?? emp.PAYABLE_DAYS ?? 0}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-center">
                          <button className="p-1 rounded hover:bg-gray-100" title="Edit" onClick={() => handleEditClick(emp)}>
                            <PencilIcon className="h-5 w-5 text-gray-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => setShowAttendanceSummary(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400"
                >
                  Close
                </button>
                {!attendanceData?.saved && (
                  <button
                    onClick={handleSaveAttendanceSummary}
                    disabled={savingAttendance}
                    className="px-4 py-2 bg-indigo-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-indigo-600 disabled:opacity-50"
                  >
                    {savingAttendance ? (
                      <>
                        <ClockIcon className="h-4 w-4 mr-2 animate-spin inline" />
                        Saving...
                      </>
                    ) : (
                      'Save & Confirm'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editRow && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl p-4 relative">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600" onClick={() => setShowEditModal(false)}>
              <span className="sr-only">Close</span>
              &times;
            </button>
            {/* Headings Row */}
            <div className="grid grid-cols-3 gap-4 mb-2">
              <h1><div className="text-center font-semibold text-xs text-gray-900">Adjust Attendance</div></h1>
              <div className="text-center font-semibold text-xs text-gray-900">System Calculated</div>
              <div className="text-center font-semibold text-xs text-gray-900">Final Overrides</div>
            </div>
            <div className="grid grid-cols-3 gap-8">
              {/* Employee Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 flex flex-col items-start text-sm pr-6 border-r border-gray-200 space-y-3">
                <div className="flex items-center">
                  <AvatarDisplay
                    avatarUrl={editEmployeeDetail?.AVATAR_URL}
                    name={`${editRow.FIRST_NAME ?? ''} ${editRow.LAST_NAME ?? ''}`.trim()}
                    size="2xl"
                    className="mr-3"
                  />
                  <div>
                    <div className="text-xl font-semibold text-gray-900 leading-tight">
                      {editRow.FIRST_NAME} {editRow.LAST_NAME}
                      {editRow.EMPLOYEE_CODE && (
                        <span className="ml-2 text-sm font-normal text-gray-500">({editRow.EMPLOYEE_CODE})</span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {editEmployeeDetail?.EMAIL && (
                      <span className="inline-flex items-center px-2.5 py-1 padding-top 0.0rem padding-bottom 0.0rem rounded-full text-gray-700 text-xs">
                          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-white ring-1 ring-gray-200 mr-1">
                            <EnvelopeIcon className="h-3.5 w-3.5 text-gray-400" />
                          </span>
                          {editEmployeeDetail.EMAIL}
                        </span>
                      )}
                      {editEmployeeDetail?.MOBILE && (
                        <span className="inline-flex items-center px-2.5 py-1 padding-top 0.0rem padding-bottom 0.0rem rounded-full text-gray-700 text-xs">
                          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-white ring-1 ring-gray-200 mr-1">
                            <PhoneIcon className="h-3.5 w-3.5 text-gray-400" />
                          </span>
                          {editEmployeeDetail.MOBILE}
                        </span>
                      )}
                      {editEmployeeDetail?.LOCATION && (
                        <span className="inline-flex items-center px-2.5 py-1 padding-top 0.0rem padding-bottom 0.0rem rounded-full text-gray-700 text-xs">
                          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-white ring-1 ring-gray-200 mr-1">
                            <MapPinIcon className="h-3.5 w-3.5 text-gray-400" />
                          </span>
                          {editEmployeeDetail.LOCATION}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-full">
                  <dl className="grid grid-cols-1 gap-y-3">
                    <div>
                      <dt className="text-[11px] uppercase tracking-wide text-gray-500">Department</dt>
                      <dd className="text-gray-900">{editEmployeeDetail?.DEPARTMENT || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-wide text-gray-500">Designation</dt>
                      <dd className="text-gray-900 font-medium">{editEmployeeDetail?.DESIGNATION || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-wide text-gray-500">Date of Joining</dt>
                      <dd className="text-gray-900">{convertToDDMMYYYY(editEmployeeDetail?.DATE_OF_JOINING)}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-wide text-gray-500">Basic Salary</dt>
                      <dd className="text-gray-900 font-semibold">{formatCurrency((editEmployeeCompensation || []).filter(c => c.STATUS === 'ACTIVE').reduce((sum, c) => {
                        if (c.IS_PERCENTAGE === 1) { return sum + (c.PERCENTAGE || 0); }
                        return sum + (c.AMOUNT || 0);
                      }, 0))}</dd>
                    </div>
                  </dl>
                </div>

                <div className="w-full">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">Remarks</div>
                  <input
                    type="text"
                    className="block w-full border border-gray-300 rounded-lg p-3 text-sm placeholder-gray-400"
                    value={editRemarks}
                    onChange={e => setEditRemarks(e.target.value)}
                    placeholder="Add a short note for this adjustment"
                  />
                </div>
              </div>
              {/* System Calculated */}
              <div className="px-6 border-r border-gray-200">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {/* Days Column */}
                  <div>
                    <div className="font-medium text-xs text-gray-800 mb-1">Days</div>
                    <div className="mb-1">
                      <label ref={(el)=>scDaysLabelRefs.current[0]=el} className="block text-xs leading-tight text-gray-600">Present Days</label>
                      <input style={{width: scDaysInputPx}} className="border rounded-md p-1 text-xs bg-gray-100 text-right focus:outline-none" value={editRow.PRESENT_DAYS ?? 0} readOnly />
                    </div>
                    <div className="mb-1">
                      <label ref={(el)=>scDaysLabelRefs.current[1]=el} className="block text-xs leading-tight text-gray-600">Weekly Off Days</label>
                      <input style={{width: scDaysInputPx}} className="border rounded-md p-1 text-xs bg-gray-100 text-right focus:outline-none" value={editRow.WEEKLY_OFF_DAYS ?? 0} readOnly />
                    </div>
                    <div className="mb-1">
                      <label ref={(el)=>scDaysLabelRefs.current[2]=el} className="block text-xs leading-tight text-gray-600">Holiday Days</label>
                      <input style={{width: scDaysInputPx}} className="border rounded-md p-1 text-xs bg-gray-100 text-right focus:outline-none" value={editRow.HOLIDAY_DAYS ?? 0} readOnly />
                    </div>
                    <div className="mb-1">
                      <label ref={(el)=>scDaysLabelRefs.current[3]=el} className="block text-xs leading-tight text-gray-600">Paid Leave Days</label>
                      <input style={{width: scDaysInputPx}} className="border rounded-md p-1 text-xs bg-gray-100 text-right focus:outline-none" value={editRow.PAID_LEAVE_DAYS ?? 0} readOnly />
                    </div>
                    <div className="mb-1">
                      <label ref={(el)=>scDaysLabelRefs.current[4]=el} className="block text-xs leading-tight text-gray-600">Unpaid Leave Days</label>
                      <input style={{width: scDaysInputPx}} className="border rounded-md p-1 text-xs bg-gray-100 text-right focus:outline-none" value={editRow.UNPAID_LEAVE_DAYS ?? 0} readOnly />
                    </div>
                    <div>
                      <label ref={(el)=>scDaysLabelRefs.current[5]=el} className="block text-xs leading-tight text-gray-600">Payable Days</label>
                      <input style={{width: scDaysInputPx}} className="border rounded-md p-1 text-xs bg-gray-100 text-right focus:outline-none" value={editRow.PAYABLE_DAYS ?? 0} readOnly />
                    </div>
                  </div>
                  {/* Hours Column */}
                  <div>
                    <div className="font-medium text-xs text-gray-800 mb-1">Hours</div>
                    <div className="mb-1"><label ref={(el)=>scHoursLabelRefs.current[0]=el} className="block text-xs leading-tight text-gray-600">Total Work Hours</label><input style={{width: scHoursInputPx}} className="border rounded-md p-1 text-xs bg-gray-100 text-right focus:outline-none" value={hoursToHHMM(editRow.TOTAL_WORK_HOURS ?? 0)} readOnly /></div>
                    <div className="mb-1"><label ref={(el)=>scHoursLabelRefs.current[1]=el} className="block text-xs leading-tight text-gray-600">Weekly Off Hours</label><input style={{width: scHoursInputPx}} className="border rounded-md p-1 text-xs bg-gray-100 text-right focus:outline-none" value={hoursToHHMM(editRow.WEEKLY_OFF_HOURS ?? 0)} readOnly /></div>
                    <div className="mb-1"><label ref={(el)=>scHoursLabelRefs.current[2]=el} className="block text-xs leading-tight text-gray-600">Holiday Hours</label><input style={{width: scHoursInputPx}} className="border rounded-md p-1 text-xs bg-gray-100 text-right focus:outline-none" value={hoursToHHMM(editRow.HOLIDAY_HOURS ?? 0)} readOnly /></div>
                    <div className="mb-1"><label ref={(el)=>scHoursLabelRefs.current[3]=el} className="block text-xs leading-tight text-gray-600">Paid Leave Hours</label><input style={{width: scHoursInputPx}} className="border rounded-md p-1 text-xs bg-gray-100 text-right focus:outline-none" value={hoursToHHMM(editRow.PAID_LEAVE_HOURS ?? 0)} readOnly /></div>
                    <div className="mb-1"><label ref={(el)=>scHoursLabelRefs.current[4]=el} className="block text-xs leading-tight text-gray-600">Total Hours</label><input style={{width: scHoursInputPx}} className="border rounded-md p-1 text-xs bg-gray-100 text-right focus:outline-none" value={hoursToHHMM(editRow.TOTAL_HOURS ?? 0)} readOnly /></div>
                    <div className="mb-1"><label ref={(el)=>scHoursLabelRefs.current[5]=el} className="block text-xs leading-tight text-gray-600">Required Hours</label><input style={{width: scHoursInputPx}} className="border rounded-md p-1 text-xs bg-gray-100 text-right focus:outline-none" value={hoursToHHMM(editRow.REQUIRED_HOURS ?? 0)} readOnly /></div>
                    <div className="mb-1"><label ref={(el)=>scHoursLabelRefs.current[6]=el} className="block text-xs leading-tight text-gray-600">Total OT Hours</label><input style={{width: scHoursInputPx}} className="border rounded-md p-1 text-xs bg-gray-100 text-right focus:outline-none" value={hoursToHHMM(editRow.TOTAL_OT_HOURS ?? 0)} readOnly /></div>
                    <div className="mb-1"><label ref={(el)=>scHoursLabelRefs.current[7]=el} className="block text-xs leading-tight text-gray-600">Total Late Hours</label><input style={{width: scHoursInputPx}} className="border rounded-md p-1 text-xs bg-gray-100 text-right focus:outline-none" value={minutesToHHMM(editRow.TOTAL_LATE_MINUTES ?? 0)} readOnly /></div>
                    <div><label ref={(el)=>scHoursLabelRefs.current[8]=el} className="block text-xs leading-tight text-gray-600">Total Short Hours</label><input style={{width: scHoursInputPx}} className="border rounded-md p-1 text-xs bg-gray-100 text-right focus:outline-none" value={hoursToHHMM(editRow.TOTAL_SHORT_HOURS ?? 0)} readOnly /></div>
                  </div>
                </div>
              </div>
              {/* Final Overrides */}
              <div className="pl-6">
                {/* Validation Message */}
                {!payableDaysValidation.isValid && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-xs text-red-600">{payableDaysValidation.message}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {/* Days Column */}
                  <div>
                    <div className="font-medium text-xs text-gray-600 mb-1">Days</div>
                    <div className="mb-1"><label ref={(el)=>foDaysLabelRefs.current[0]=el} className="block text-xs leading-tight text-gray-600">Final Present Days</label><input style={{width: foDaysInputPx}} className="border rounded-md p-1 text-xs text-right focus:ring-indigo-500 focus:border-indigo-500" value={editValues.FINAL_PRESENT_DAYS ?? ''} onChange={e => handleEditValueChange('FINAL_PRESENT_DAYS', e.target.value)} placeholder="0" /></div>
                    <div className="mb-1"><label ref={(el)=>foDaysLabelRefs.current[1]=el} className="block text-xs leading-tight text-gray-600">Final Weekly Off</label><input style={{width: foDaysInputPx}} className="border rounded-md p-1 text-xs text-right focus:ring-indigo-500 focus:border-indigo-500" value={editValues.FINAL_WEEKLY_OFF_DAYS ?? ''} onChange={e => handleEditValueChange('FINAL_WEEKLY_OFF_DAYS', e.target.value)} placeholder="0" /></div>
                    <div className="mb-1"><label ref={(el)=>foDaysLabelRefs.current[2]=el} className="block text-xs leading-tight text-gray-600">Final Holiday Days</label><input style={{width: foDaysInputPx}} className="border rounded-md p-1 text-xs text-right focus:ring-indigo-500 focus:border-indigo-500" value={editValues.FINAL_HOLIDAY_DAYS ?? ''} onChange={e => handleEditValueChange('FINAL_HOLIDAY_DAYS', e.target.value)} placeholder="0" /></div>
                    <div className="mb-1"><label ref={(el)=>foDaysLabelRefs.current[3]=el} className="block text-xs leading-tight text-gray-600">Final Paid Leave Days</label><input style={{width: foDaysInputPx}} className="border rounded-md p-1 text-xs text-right focus:ring-indigo-500 focus:border-indigo-500" value={editValues.FINAL_PAID_LEAVE_DAYS ?? ''} onChange={e => handleEditValueChange('FINAL_PAID_LEAVE_DAYS', e.target.value)} placeholder="0" /></div>
                    <div className="mb-1"><label ref={(el)=>foDaysLabelRefs.current[4]=el} className="block text-xs leading-tight text-gray-600">Final Unpaid Leave Days</label><input style={{width: foDaysInputPx}} className="border rounded-md p-1 text-xs text-right focus:ring-indigo-500 focus:border-indigo-500" value={editValues.FINAL_UNPAID_LEAVE_DAYS ?? ''} onChange={e => handleEditValueChange('FINAL_UNPAID_LEAVE_DAYS', e.target.value)} placeholder="0" /></div>
                    <div><label ref={(el)=>foDaysLabelRefs.current[5]=el} className="block text-xs leading-tight text-gray-600">Final Payable Days</label><input style={{width: foDaysInputPx}} className="border rounded-md p-1 text-xs text-right bg-gray-100 focus:outline-none" value={editValues.FINAL_PAYABLE_DAYS ?? ''} readOnly placeholder="0" title="Auto-calculated: Present + Weekly Off + Holiday + Paid Leave + Unpaid Leave" /></div>
                  </div>
                  {/* Hours Column */}
                  <div>
                    <div className="font-medium text-xs text-gray-600 mb-1">Hours</div>
                    <div className="mb-1"><label ref={(el)=>foHoursLabelRefs.current[0]=el} className="block text-xs leading-tight text-gray-600">Final Work Hours</label><input type="text" style={{width: foHoursInputPx}} className="border rounded-md p-1 text-xs text-right focus:ring-indigo-500 focus:border-indigo-500" value={rawFinalWorkHhmm} onChange={e => handleEditValueChange('FINAL_WORK_HOURS', e.target.value)} onBlur={(e)=>{ const v = normalizeHoursMinutes(e.target.value); setRawFinalWorkHhmm(v); handleEditValueChange('FINAL_WORK_HOURS', v); }} placeholder="000:00" title="Enter accumulated hours (e.g., 180:30 for 180 hours 30 minutes)" /></div>
                    <div className="mb-1"><label ref={(el)=>foHoursLabelRefs.current[1]=el} className="block text-xs leading-tight text-gray-600">Final Weekly Off Hours</label><input style={{width: foHoursInputPx}} className="border rounded-md p-1 text-xs text-right bg-gray-100 focus:outline-none" value={editValues.FINAL_WEEKLY_OFF_HOURS !== undefined ? hoursToHHMM(editValues.FINAL_WEEKLY_OFF_HOURS) : ''} readOnly placeholder="00:00" title="Auto-calculated: Shift hours × Final Weekly Off Days" /></div>
                    <div className="mb-1"><label ref={(el)=>foHoursLabelRefs.current[2]=el} className="block text-xs leading-tight text-gray-600">Final Holiday Hours</label><input style={{width: foHoursInputPx}} className="border rounded-md p-1 text-xs text-right bg-gray-100 focus:outline-none" value={editValues.FINAL_HOLIDAY_HOURS !== undefined ? hoursToHHMM(editValues.FINAL_HOLIDAY_HOURS) : ''} readOnly placeholder="00:00" title="Auto-calculated: Shift hours × Final Holiday Days" /></div>
                    <div className="mb-1"><label ref={(el)=>foHoursLabelRefs.current[3]=el} className="block text-xs leading-tight text-gray-600">Final Paid Leave Hours</label><input style={{width: foHoursInputPx}} className="border rounded-md p-1 text-xs text-right bg-gray-100 focus:outline-none" value={editValues.FINAL_PAID_LEAVE_HOURS !== undefined ? hoursToHHMM(editValues.FINAL_PAID_LEAVE_HOURS) : ''} readOnly placeholder="00:00" title="Auto-calculated: Shift hours × Final Paid Leave Days" /></div>
                    <div className="mb-1"><label ref={(el)=>foHoursLabelRefs.current[4]=el} className="block text-xs leading-tight text-gray-600">Final Unpaid Leave Hours</label><input style={{width: foHoursInputPx}} className="border rounded-md p-1 text-xs text-right bg-gray-100 focus:outline-none" value={editValues.FINAL_UNPAID_LEAVE_HOURS !== undefined ? hoursToHHMM(editValues.FINAL_UNPAID_LEAVE_HOURS) : ''} readOnly placeholder="00:00" title="Auto-calculated: Shift hours × Final Unpaid Leave Days" /></div>
                    <div className="mb-1"><label ref={(el)=>foHoursLabelRefs.current[5]=el} className="block text-xs leading-tight text-gray-600">Final Payable Hours</label><input style={{width: foHoursInputPx}} className="border rounded-md p-1 text-xs text-right bg-gray-100 focus:outline-none" value={editValues.FINAL_TOTAL_HOURS !== undefined ? hoursToHHMM(editValues.FINAL_TOTAL_HOURS) : ''} readOnly placeholder="00:00" title="Auto-calculated: Work + Weekly Off + Holiday + Paid Leave + Unpaid Leave Hours" /></div>
                    <div className="mb-1"><label ref={(el)=>foHoursLabelRefs.current[6]=el} className="block text-xs leading-tight text-gray-600">Final Required Hours</label><input style={{width: foHoursInputPx}} className="border rounded-md p-1 text-xs text-right bg-gray-100 focus:outline-none" value={editValues.FINAL_REQUIRED_HOURS !== undefined ? hoursToHHMM(editValues.FINAL_REQUIRED_HOURS) : ''} readOnly placeholder="00:00" title="Auto-calculated: Shift hours × Final Payable Days" /></div>
                    <div className="mb-1"><label ref={(el)=>foHoursLabelRefs.current[7]=el} className="block text-xs leading-tight text-gray-600">Final OT Hours</label><input type="text" style={{width: foHoursInputPx}} className="border rounded-md p-1 text-xs text-right focus:ring-indigo-500 focus:border-indigo-500" value={rawFinalOtHhmm} onChange={e => handleEditValueChange('FINAL_OT_HOURS', e.target.value)} onBlur={(e)=>{ const v = normalizeHoursMinutes(e.target.value); setRawFinalOtHhmm(v); handleEditValueChange('FINAL_OT_HOURS', v); }} placeholder="000:00" title="Enter accumulated overtime hours (e.g., 45:15 for 45 hours 15 minutes)" /></div>
                    <div className="mb-1"><label ref={(el)=>foHoursLabelRefs.current[8]=el} className="block text-xs leading-tight text-gray-600">Final Late Hours</label><input type="text" style={{width: foHoursInputPx}} className="border rounded-md p-1 text-xs text-right focus:ring-indigo-500 focus:border-indigo-500" value={rawFinalLateHhmm} onChange={e => handleEditValueChange('FINAL_LATE_MINUTES', e.target.value)} onBlur={(e)=>{ const v = normalizeHoursMinutes(e.target.value); setRawFinalLateHhmm(v); handleEditValueChange('FINAL_LATE_MINUTES', v); }} placeholder="000:00" title="Enter accumulated late hours (e.g., 12:45 for 12 hours 45 minutes)" /></div>
                    <div><label ref={(el)=>foHoursLabelRefs.current[9]=el} className="block text-xs leading-tight text-gray-600">Final Short Hours</label><input type="text" style={{width: foHoursInputPx}} className="border rounded-md p-1 text-xs text-right focus:ring-indigo-500 focus:border-indigo-500" value={rawFinalShortHhmm} onChange={e => handleEditValueChange('FINAL_SHORT_HOURS', e.target.value)} onBlur={(e)=>{ const v = normalizeHoursMinutes(e.target.value); setRawFinalShortHhmm(v); handleEditValueChange('FINAL_SHORT_HOURS', v); }} placeholder="000:00" title="Enter accumulated short hours (e.g., 8:30 for 8 hours 30 minutes)" /></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button 
                className={`px-4 py-2 text-base font-medium rounded-md shadow-sm ${
                  payableDaysValidation.isValid 
                    ? 'bg-indigo-500 text-white hover:bg-indigo-600' 
                    : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                }`}
                onClick={handleEditSave}
                disabled={!payableDaysValidation.isValid}
                title={!payableDaysValidation.isValid ? 'Fix validation errors before saving' : 'Save changes'}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthEndPayroll;
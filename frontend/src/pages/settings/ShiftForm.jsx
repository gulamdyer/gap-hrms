import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { shiftAPI } from '../../services/api';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';

const defaultForm = {
  shiftName: '',
  startTime: '',
  endTime: '',
  shiftHours: '',
  description: '',
  status: 'ACTIVE',
  overtimeApplicable: false,
  overtimeCapHours: '',
  flexibleTimeApplicable: false,
  lateComingTolerance: '',
  earlyGoingTolerance: '',
  hasBreakTime: false,
  breakStartTime: '',
  breakEndTime: '',
  breakHours: ''
};

const ShiftForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      fetchShift();
    }
    // eslint-disable-next-line
  }, [id]);

  // Keep shiftHours always as net = base - break on any relevant change
  useEffect(() => {
    const base = calculateHours(form.startTime, form.endTime);
    const bVal = form.hasBreakTime ? (calculateHours(form.breakStartTime, form.breakEndTime) || 0) : 0;
    const net = base === '' ? '' : Number((Number(base) - Number(bVal)).toFixed(2));
    if (net !== form.shiftHours) {
      setForm((prev) => ({ ...prev, shiftHours: net }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.startTime, form.endTime, form.hasBreakTime, form.breakStartTime, form.breakEndTime]);

  const fetchShift = async () => {
    setLoading(true);
    try {
      const res = await shiftAPI.getById(id);
      const shift = res.data;
      setForm({
        shiftName: shift.SHIFT_NAME,
        startTime: shift.START_TIME,
        endTime: shift.END_TIME,
        shiftHours: shift.SHIFT_HOURS ?? '',
        description: shift.DESCRIPTION || '',
        status: shift.STATUS,
        overtimeApplicable: shift.OVERTIME_APPLICABLE === 1,
        overtimeCapHours: shift.OVERTIME_CAP_HOURS || '',
        flexibleTimeApplicable: shift.FLEXIBLE_TIME_APPLICABLE === 1,
        lateComingTolerance: shift.LATE_COMING_TOLERANCE || '',
        earlyGoingTolerance: shift.EARLY_GOING_TOLERANCE || '',
        hasBreakTime: shift.HAS_BREAK_TIME === 1,
        breakStartTime: shift.BREAK_START_TIME || '',
        breakEndTime: shift.BREAK_END_TIME || '',
        breakHours: shift.BREAK_HOURS ?? ''
      });
    } catch (err) {
      toast.error('Failed to load shift');
      navigate('/settings/shifts');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const errors = {};
    if (!form.shiftName.trim()) errors.shiftName = 'Shift name is required';
    if (!form.startTime) errors.startTime = 'Start time is required';
    if (!form.endTime) errors.endTime = 'End time is required';
    if (form.startTime && form.endTime) {
      const base = calculateHours(form.startTime, form.endTime);
      if (base === '' || Number(base) <= 0) {
        errors.endTime = 'End time must be after start time (supports overnight)';
      }
    }
    if (form.overtimeApplicable) {
      const val = Number(form.overtimeCapHours);
      if (!form.overtimeCapHours || isNaN(val) || val < 1 || val > 12) {
        errors.overtimeCapHours = 'Overtime Cap Hours must be a number between 1 and 12';
      }
    }
    if (form.lateComingTolerance !== '') {
      const val = Number(form.lateComingTolerance);
      if (isNaN(val) || val < 0 || val > 60) {
        errors.lateComingTolerance = 'Late Coming Tolerance must be between 0 and 60 minutes';
      }
    }
    if (form.earlyGoingTolerance !== '') {
      const val = Number(form.earlyGoingTolerance);
      if (isNaN(val) || val < 0 || val > 60) {
        errors.earlyGoingTolerance = 'Early Going Tolerance must be between 0 and 60 minutes';
      }
    }
    if (form.hasBreakTime) {
      if (!form.breakStartTime) errors.breakStartTime = 'Break start time is required';
      if (!form.breakEndTime) errors.breakEndTime = 'Break end time is required';
      const breakH = calculateHours(form.breakStartTime, form.breakEndTime);
      if (breakH === '' || Number(breakH) <= 0) {
        errors.breakEndTime = 'Break end time must be after break start time (supports overnight)';
      }
      const base = calculateHours(form.startTime, form.endTime) || 0;
      const net = Number(base) - Number(breakH || 0);
      if (!errors.endTime && net < 0) {
        errors.breakEndTime = 'Break hours cannot exceed total shift hours';
      }
    }
    return errors;
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };

      // Auto-calc Shift Hours when start or end changes
      if (name === 'startTime' || name === 'endTime') {
        const base = calculateHours(
          name === 'startTime' ? value : prev.startTime,
          name === 'endTime' ? value : prev.endTime
        );
        const breakH = prev.hasBreakTime
          ? calculateHours(prev.breakStartTime, prev.breakEndTime) || 0
          : 0;
        next.shiftHours = base === '' ? '' : Number((Number(base) - Number(breakH)).toFixed(2));
      }

      // Auto-calc Break Hours when hasBreakTime or break times change
      if (name === 'hasBreakTime' || name === 'breakStartTime' || name === 'breakEndTime') {
        const breakStart = name === 'breakStartTime' ? value : prev.breakStartTime;
        const breakEnd = name === 'breakEndTime' ? value : prev.breakEndTime;
        const hasBreak = name === 'hasBreakTime' ? checked : prev.hasBreakTime;
        const breakH = hasBreak ? calculateHours(breakStart, breakEnd) : '';
        next.breakHours = breakH;
        const base = calculateHours(next.startTime, next.endTime);
        const bVal = breakH === '' ? 0 : Number(breakH);
        next.shiftHours = base === '' ? '' : Number((Number(base) - bVal).toFixed(2));
        if (!hasBreak) {
          next.breakStartTime = '';
          next.breakEndTime = '';
          next.breakHours = '';
        }
      }

      return next;
    });
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const calculateHours = (start, end) => {
    if (!start || !end) return '';
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMinutes = sh * 60 + sm;
    let endMinutes = eh * 60 + em;
    if (endMinutes < startMinutes) endMinutes += 24 * 60; // handle overnight
    const diffMinutes = endMinutes - startMinutes;
    const hours = diffMinutes / 60;
    return Number(hours.toFixed(2));
  };

  const formatHoursToHHMM = (hoursVal) => {
    if (hoursVal === '' || hoursVal == null || isNaN(Number(hoursVal))) return '';
    const totalMinutes = Math.round(Number(hoursVal) * 60);
    const hh = Math.floor(totalMinutes / 60);
    const mm = totalMinutes % 60;
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(hh)}:${pad(mm)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix errors in the form');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        overtimeApplicable: form.overtimeApplicable,
        overtimeCapHours: form.overtimeApplicable ? form.overtimeCapHours : null,
        flexibleTimeApplicable: form.flexibleTimeApplicable,
        lateComingTolerance: form.lateComingTolerance || 0,
        earlyGoingTolerance: form.earlyGoingTolerance || 0,
        hasBreakTime: form.hasBreakTime,
        breakStartTime: form.hasBreakTime ? form.breakStartTime : null,
        breakEndTime: form.hasBreakTime ? form.breakEndTime : null,
        breakHours: form.hasBreakTime ? form.breakHours : null,
        shiftHours: form.shiftHours || null
      };
      if (isEdit) {
        await shiftAPI.update(id, payload);
        toast.success('Shift updated');
      } else {
        await shiftAPI.create(payload);
        toast.success('Shift created');
      }
      navigate('/settings/shifts');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save shift');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/settings/shifts')}
        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back to Shifts
      </button>
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{isEdit ? 'Edit Shift' : 'Add Shift'}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shift Name *</label>
            <input
              type="text"
              name="shiftName"
              value={form.shiftName}
              onChange={handleFormChange}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${formErrors.shiftName ? 'border-red-500' : 'border-gray-300'}`}
              maxLength={100}
              required
            />
            {formErrors.shiftName && <p className="mt-1 text-sm text-red-600">{formErrors.shiftName}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
              <input
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={handleFormChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${formErrors.startTime ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {formErrors.startTime && <p className="mt-1 text-sm text-red-600">{formErrors.startTime}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
              <input
                type="time"
                name="endTime"
                value={form.endTime}
                onChange={handleFormChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${formErrors.endTime ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {formErrors.endTime && <p className="mt-1 text-sm text-red-600">{formErrors.endTime}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift Hours</label>
              <input
                type="text"
                name="shiftHoursDisplay"
                value={formatHoursToHHMM(form.shiftHours)}
                readOnly
                placeholder="00:00"
                className="w-full border rounded-md px-3 py-2 bg-gray-50 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="hasBreakTime"
                checked={form.hasBreakTime}
                onChange={handleFormChange}
                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Shift has Break Time?</span>
            </label>
          </div>

          {form.hasBreakTime && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Break Start Time</label>
                <input
                  type="time"
                  name="breakStartTime"
                  value={form.breakStartTime}
                  onChange={handleFormChange}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Break End Time</label>
                <input
                  type="time"
                  name="breakEndTime"
                  value={form.breakEndTime}
                  onChange={handleFormChange}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Break Hours</label>
                <input
                  type="text"
                  name="breakHoursDisplay"
                  value={formatHoursToHHMM(form.breakHours)}
                  readOnly
                  placeholder="00:00"
                  className="w-full border rounded-md px-3 py-2 bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>
          )}
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="overtimeApplicable"
                checked={form.overtimeApplicable}
                onChange={handleFormChange}
                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Overtime Applicable?</span>
            </label>
            {form.overtimeApplicable && (
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-700 mr-2">Overtime Cap Hours *</label>
                <input
                  type="number"
                  name="overtimeCapHours"
                  value={form.overtimeCapHours}
                  onChange={handleFormChange}
                  min={1}
                  max={12}
                  step={1}
                  className={`w-28 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${formErrors.overtimeCapHours ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                {formErrors.overtimeCapHours && <p className="ml-2 text-sm text-red-600">{formErrors.overtimeCapHours}</p>}
              </div>
            )}
          </div>
          
          {/* Flexible Time Section */}
          <div className="border-t pt-4">
            <div className="space-y-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="flexibleTimeApplicable"
                    checked={form.flexibleTimeApplicable}
                    onChange={handleFormChange}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Flexible Time Applicable?</span>
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tolerance for Late Coming (minutes)
                  </label>
                  <input
                    type="number"
                    name="lateComingTolerance"
                    value={form.lateComingTolerance}
                    onChange={handleFormChange}
                    min={0}
                    max={60}
                    step={1}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${formErrors.lateComingTolerance ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="0"
                  />
                  {formErrors.lateComingTolerance && <p className="mt-1 text-sm text-red-600">{formErrors.lateComingTolerance}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tolerance for Early Going (minutes)
                  </label>
                  <input
                    type="number"
                    name="earlyGoingTolerance"
                    value={form.earlyGoingTolerance}
                    onChange={handleFormChange}
                    min={0}
                    max={60}
                    step={1}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${formErrors.earlyGoingTolerance ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="0"
                  />
                  {formErrors.earlyGoingTolerance && <p className="mt-1 text-sm text-red-600">{formErrors.earlyGoingTolerance}</p>}
                </div>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleFormChange}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              name="description"
              value={form.description}
              onChange={handleFormChange}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-gray-300"
              maxLength={255}
            />
          </div>
          <div className="flex items-center justify-end space-x-4 mt-4">
            <button
              type="button"
              onClick={() => navigate('/settings/shifts')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={submitting}
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
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  {isEdit ? 'Update Shift' : 'Create Shift'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShiftForm; 
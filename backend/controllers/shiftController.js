const Shift = require('../models/Shift');

// Get all shifts
const getAllShifts = async (req, res) => {
  try {
    const shifts = await Shift.findAll();
    res.json({ data: shifts });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    res.status(500).json({ message: 'Failed to fetch shifts', error: error.message });
  }
};

// Get shift by ID
const getShiftById = async (req, res) => {
  try {
    const { id } = req.params;
    const shift = await Shift.findById(parseInt(id));
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }
    res.json({ data: shift });
  } catch (error) {
    console.error('Error fetching shift:', error);
    res.status(500).json({ message: 'Failed to fetch shift', error: error.message });
  }
};

// Create new shift
const createShift = async (req, res) => {
  try {
    const { 
      shiftName, startTime, endTime, shiftHours, description, status, 
      overtimeApplicable, overtimeCapHours,
      flexibleTimeApplicable, lateComingTolerance, earlyGoingTolerance,
      hasBreakTime, breakStartTime, breakEndTime, breakHours
    } = req.body;
    
    // Basic field validation
    if (!shiftName || !startTime || !endTime) {
      return res.status(400).json({ message: 'Shift name, start time, and end time are required' });
    }
    
    // Overtime validation
    if (overtimeApplicable && (!overtimeCapHours || isNaN(overtimeCapHours) || overtimeCapHours <= 0)) {
      return res.status(400).json({ message: 'Overtime Cap Hours must be a positive number if Overtime is applicable' });
    }
    // Break validation
    if (hasBreakTime) {
      if (!breakStartTime || !breakEndTime) {
        return res.status(400).json({ message: 'Break start time and end time are required when break time is enabled' });
      }
    }
    
    // Tolerance validation
    if (lateComingTolerance && (isNaN(lateComingTolerance) || lateComingTolerance < 0 || lateComingTolerance > 60)) {
      return res.status(400).json({ message: 'Late Coming Tolerance must be between 0 and 60 minutes' });
    }
    
    if (earlyGoingTolerance && (isNaN(earlyGoingTolerance) || earlyGoingTolerance < 0 || earlyGoingTolerance > 60)) {
      return res.status(400).json({ message: 'Early Going Tolerance must be between 0 and 60 minutes' });
    }
    
    // Compute hours server-side to ensure integrity
    const computeHours = (start, end) => {
      if (!start || !end) return null;
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const startMinutes = sh * 60 + sm;
      let endMinutes = eh * 60 + em;
      if (endMinutes < startMinutes) endMinutes += 24 * 60;
      const diffMinutes = endMinutes - startMinutes;
      return Math.round((diffMinutes / 60) * 100) / 100;
    };

    const baseShiftHours = computeHours(startTime, endTime);
    const computedBreakHours = hasBreakTime ? computeHours(breakStartTime, breakEndTime) : null;
    if (hasBreakTime && computedBreakHours != null && baseShiftHours != null && computedBreakHours > baseShiftHours) {
      return res.status(400).json({ message: 'Break hours cannot exceed total shift hours' });
    }
    const computedShiftHours = baseShiftHours == null ? null : Math.round(((baseShiftHours - (computedBreakHours || 0)) * 100)) / 100;

    const shiftId = await Shift.create({ 
      shiftName, startTime, endTime, shiftHours: computedShiftHours, description, status, 
      overtimeApplicable, overtimeCapHours,
      flexibleTimeApplicable, lateComingTolerance, earlyGoingTolerance,
      hasBreakTime, breakStartTime, breakEndTime, breakHours: computedBreakHours
    });
    const newShift = await Shift.findById(shiftId);
    res.status(201).json({ message: 'Shift created successfully', data: newShift });
  } catch (error) {
    console.error('Error creating shift:', error);
    res.status(500).json({ message: 'Failed to create shift', error: error.message });
  }
};

// Update shift
const updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      shiftName, startTime, endTime, shiftHours, description, status, 
      overtimeApplicable, overtimeCapHours,
      flexibleTimeApplicable, lateComingTolerance, earlyGoingTolerance,
      hasBreakTime, breakStartTime, breakEndTime, breakHours
    } = req.body;
    
    // Basic field validation
    if (!shiftName || !startTime || !endTime) {
      return res.status(400).json({ message: 'Shift name, start time, and end time are required' });
    }
    
    // Overtime validation
    if (overtimeApplicable && (!overtimeCapHours || isNaN(overtimeCapHours) || overtimeCapHours <= 0)) {
      return res.status(400).json({ message: 'Overtime Cap Hours must be a positive number if Overtime is applicable' });
    }
    
    // Tolerance validation
    if (lateComingTolerance && (isNaN(lateComingTolerance) || lateComingTolerance < 0 || lateComingTolerance > 60)) {
      return res.status(400).json({ message: 'Late Coming Tolerance must be between 0 and 60 minutes' });
    }
    
    if (earlyGoingTolerance && (isNaN(earlyGoingTolerance) || earlyGoingTolerance < 0 || earlyGoingTolerance > 60)) {
      return res.status(400).json({ message: 'Early Going Tolerance must be between 0 and 60 minutes' });
    }
    
    // Recompute hours server-side
    const computeHours = (start, end) => {
      if (!start || !end) return null;
      const [sh, sm] = start.split(':' ).map(Number);
      const [eh, em] = end.split(':' ).map(Number);
      const startMinutes = sh * 60 + sm;
      let endMinutes = eh * 60 + em;
      if (endMinutes < startMinutes) endMinutes += 24 * 60;
      const diffMinutes = endMinutes - startMinutes;
      return Math.round((diffMinutes / 60) * 100) / 100;
    };

    const baseShiftHours = computeHours(startTime, endTime);
    const computedBreakHours = hasBreakTime ? computeHours(breakStartTime, breakEndTime) : null;
    if (hasBreakTime && computedBreakHours != null && baseShiftHours != null && computedBreakHours > baseShiftHours) {
      return res.status(400).json({ message: 'Break hours cannot exceed total shift hours' });
    }
    const computedShiftHours = baseShiftHours == null ? null : Math.round(((baseShiftHours - (computedBreakHours || 0)) * 100)) / 100;

    const updated = await Shift.update(parseInt(id), { 
      shiftName, startTime, endTime, shiftHours: computedShiftHours, description, status, 
      overtimeApplicable, overtimeCapHours,
      flexibleTimeApplicable, lateComingTolerance, earlyGoingTolerance,
      hasBreakTime, breakStartTime, breakEndTime, breakHours: computedBreakHours
    });
    if (!updated) {
      return res.status(404).json({ message: 'Shift not found' });
    }
    const updatedShift = await Shift.findById(id);
    res.json({ message: 'Shift updated successfully', data: updatedShift });
  } catch (error) {
    console.error('Error updating shift:', error);
    res.status(500).json({ message: 'Failed to update shift', error: error.message });
  }
};

// Delete shift
const deleteShift = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Shift.delete(parseInt(id));
    if (!deleted) {
      return res.status(404).json({ message: 'Shift not found' });
    }
    res.json({ message: 'Shift deleted successfully' });
  } catch (error) {
    console.error('Error deleting shift:', error);
    res.status(500).json({ message: 'Failed to delete shift', error: error.message });
  }
};

// Get shifts for dropdown
const getShiftsForDropdown = async (req, res) => {
  try {
    const shifts = await Shift.getShiftsForDropdown();
    res.json({
      success: true,
      data: shifts,
      message: 'Shifts retrieved successfully for dropdown'
    });
  } catch (error) {
    console.error('Error getting shifts for dropdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve shifts for dropdown',
      error: error.message
    });
  }
};

module.exports = {
  getAllShifts,
  getShiftById,
  createShift,
  updateShift,
  deleteShift,
  getShiftsForDropdown
}; 
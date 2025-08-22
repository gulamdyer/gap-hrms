const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Shift = require('../models/Shift');

// Get all attendance records
const getAllAttendance = async (req, res) => {
  try {
    const filters = {
      employeeId: req.query.employeeId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      status: req.query.status,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit
    };

    const attendance = await Attendance.getAllAttendance(filters);
    
    res.json({
      success: true,
      data: attendance,
      message: 'Attendance records retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve attendance records',
      error: error.message
    });
  }
};

// Get attendance by ID
const getAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const attendance = await Attendance.getAttendanceById(parseInt(id));
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.json({
      success: true,
      data: attendance,
      message: 'Attendance record retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve attendance record',
      error: error.message
    });
  }
};

// Create attendance record
const createAttendance = async (req, res) => {
  try {
    const attendanceData = req.body;
    const createdBy = req.user.userId;

    // Validate required fields
    if (!attendanceData.employeeId || !attendanceData.attendanceDate) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and attendance date are required'
      });
    }

    // Check if attendance already exists for this employee and date
    const existingAttendance = await Attendance.getAllAttendance({
      employeeId: attendanceData.employeeId,
      startDate: attendanceData.attendanceDate,
      endDate: attendanceData.attendanceDate
    });

    if (existingAttendance.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Attendance record already exists for this employee and date'
      });
    }

    const attendanceId = await Attendance.createAttendance(attendanceData, createdBy);
    const newAttendance = await Attendance.getAttendanceById(attendanceId);

    res.status(201).json({
      success: true,
      data: newAttendance,
      message: 'Attendance record created successfully'
    });
  } catch (error) {
    console.error('Error creating attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create attendance record',
      error: error.message
    });
  }
};

// Update attendance record
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const attendanceData = req.body;

    const existingAttendance = await Attendance.getAttendanceById(parseInt(id));
    if (!existingAttendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    await Attendance.updateAttendance(parseInt(id), attendanceData);
    const updatedAttendance = await Attendance.getAttendanceById(parseInt(id));

    res.json({
      success: true,
      data: updatedAttendance,
      message: 'Attendance record updated successfully'
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance record',
      error: error.message
    });
  }
};

// Delete attendance record
const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const existingAttendance = await Attendance.getAttendanceById(parseInt(id));
    if (!existingAttendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    await Attendance.deleteAttendance(parseInt(id));

    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attendance record',
      error: error.message
    });
  }
};

// Bulk create attendance records
const bulkCreateAttendance = async (req, res) => {
  try {
    const { attendanceRecords } = req.body;
    const createdBy = req.user.userId;

    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Attendance records array is required'
      });
    }

    const createdRecords = [];
    const errors = [];

    for (let i = 0; i < attendanceRecords.length; i++) {
      try {
        const record = attendanceRecords[i];
        
        // Validate required fields
        if (!record.employeeId || !record.attendanceDate) {
          errors.push({
            index: i,
            error: 'Employee ID and attendance date are required'
          });
          continue;
        }

        // Check if attendance already exists
        const existingAttendance = await Attendance.getAllAttendance({
          employeeId: record.employeeId,
          startDate: record.attendanceDate,
          endDate: record.attendanceDate
        });

        if (existingAttendance.length > 0) {
          errors.push({
            index: i,
            error: 'Attendance record already exists for this employee and date'
          });
          continue;
        }

        const attendanceId = await Attendance.createAttendance(record, createdBy);
        const newAttendance = await Attendance.getAttendanceById(attendanceId);
        createdRecords.push(newAttendance);
      } catch (error) {
        errors.push({
          index: i,
          error: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        created: createdRecords,
        errors: errors
      },
      message: `Successfully created ${createdRecords.length} attendance records${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
    });
  } catch (error) {
    console.error('Error bulk creating attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk create attendance records',
      error: error.message
    });
  }
};

// Get attendance statistics
const getAttendanceStatistics = async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    if (!employeeId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, start date, and end date are required'
      });
    }

    const statistics = await Attendance.getAttendanceStatistics({
      employeeId: parseInt(employeeId),
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: statistics,
      message: 'Attendance statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting attendance statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve attendance statistics',
      error: error.message
    });
  }
};

// Mark attendance (for biometric/mobile check-in/out)
const markAttendance = async (req, res) => {
  try {
    console.log('🔍 Mark Attendance Debug:');
    console.log('Request body:', req.body);
    console.log('User object:', req.user);
    console.log('User ID:', req.user?.userId);
    
    const { employeeId, logType, deviceId, location, method, biometricData } = req.body;
    const createdBy = req.user?.userId || 1; // Default to user ID 1 if not available
    
    console.log('Extracted data:', {
      employeeId,
      logType,
      deviceId,
      location,
      method,
      biometricData,
      createdBy
    });

    // Validate required fields
    if (!employeeId || !logType) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and log type are required'
      });
    }

    // Validate that user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Validate log type
    if (!['IN', 'OUT', 'BREAK_START', 'BREAK_END'].includes(logType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid log type. Must be IN, OUT, BREAK_START, or BREAK_END'
      });
    }

    const currentTime = new Date();
    const currentDate = currentTime.toISOString().split('T')[0];
    const currentTimeStr = currentTime.toTimeString().slice(0, 5);

    // Map verification method for attendance logs table
    const getLogVerificationMethod = (method) => {
      const methodMap = {
        'MANUAL': 'PIN',
        'FINGERPRINT': 'FINGERPRINT',
        'FACE': 'FACE',
        'CARD': 'CARD',
        'MOBILE': 'MOBILE'
      };
      return methodMap[method] || 'PIN';
    };

    // Map verification method for main attendance table
    const getAttendanceVerificationMethod = (method) => {
      const methodMap = {
        'MANUAL': 'MANUAL',
        'FINGERPRINT': 'BIOMETRIC',
        'FACE': 'BIOMETRIC',
        'CARD': 'CARD',
        'MOBILE': 'MOBILE'
      };
      return methodMap[method] || 'MANUAL';
    };

    // Create attendance log
    const logData = {
      deviceId: deviceId || null,
      employeeId: parseInt(employeeId),
      logTime: currentTime,
      logType,
      biometricData: biometricData || null,
      verificationMethod: getLogVerificationMethod(method || 'MANUAL'),
      verificationStatus: 'SUCCESS',
      deviceResponse: 'Attendance marked successfully'
    };

    console.log('Creating attendance log with data:', logData);
    const logId = await Attendance.createAttendanceLog(logData);
    console.log('Attendance log created with ID:', logId);

    // Check if attendance record exists for today
    console.log('Checking for existing attendance:', {
      employeeId: parseInt(employeeId),
      startDate: currentDate,
      endDate: currentDate
    });
    const existingAttendance = await Attendance.getAllAttendance({
      employeeId: parseInt(employeeId),
      startDate: currentDate,
      endDate: currentDate
    });
    console.log('Existing attendance records:', existingAttendance);

    let attendanceRecord;
    if (existingAttendance.length === 0) {
      // Create new attendance record
      console.log('No existing attendance found, creating new record');
      const attendanceData = {
        employeeId: parseInt(employeeId),
        attendanceDate: currentDate,
        status: 'PRESENT',
        inMethod: getAttendanceVerificationMethod(method || 'MANUAL'),
        inLocation: location || null,
        inDeviceId: deviceId || null
      };

      if (logType === 'IN') {
        attendanceData.actualInTime = currentTimeStr;
      }

      console.log('Creating attendance with data:', attendanceData);
      console.log('Created by user ID:', createdBy);
      const attendanceId = await Attendance.createAttendance(attendanceData, createdBy);
      console.log('Attendance created with ID:', attendanceId);
      attendanceRecord = await Attendance.getAttendanceById(attendanceId);
      console.log('Retrieved attendance record:', attendanceRecord);
    } else {
      // Update existing attendance record
      console.log('Existing attendance found, updating record');
      attendanceRecord = existingAttendance[0];
      console.log('Current attendance record:', attendanceRecord);
      const updateData = {};

      if (logType === 'IN' && !attendanceRecord.ACTUAL_IN_TIME) {
        updateData.actualInTime = currentTimeStr;
        updateData.inMethod = getAttendanceVerificationMethod(method || 'MANUAL');
        updateData.inLocation = location || null;
        updateData.inDeviceId = deviceId || null;
      } else if (logType === 'OUT' && !attendanceRecord.ACTUAL_OUT_TIME) {
        updateData.actualOutTime = currentTimeStr;
        updateData.outMethod = getAttendanceVerificationMethod(method || 'MANUAL');
        updateData.outLocation = location || null;
        updateData.outDeviceId = deviceId || null;

        // Calculate work hours if both in and out times are available
        if (attendanceRecord.ACTUAL_IN_TIME) {
          const inTime = new Date(`2000-01-01T${attendanceRecord.ACTUAL_IN_TIME}:00`);
          const outTime = new Date(`2000-01-01T${currentTimeStr}:00`);
          const workHours = (outTime - inTime) / (1000 * 60 * 60);
          updateData.workHours = Math.round(workHours * 100) / 100;
        }
      }

      if (Object.keys(updateData).length > 0) {
        await Attendance.updateAttendance(attendanceRecord.ATTENDANCE_ID, updateData);
        attendanceRecord = await Attendance.getAttendanceById(attendanceRecord.ATTENDANCE_ID);
      }
    }

    res.json({
      success: true,
      data: {
        logId,
        attendanceRecord,
        message: `Attendance ${logType.toLowerCase()} marked successfully`
      },
      message: 'Attendance marked successfully'
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    console.error('Error stack:', error.stack);
    
    // Handle specific database errors
    if (error.message.includes('ORA-00001')) {
      return res.status(409).json({
        success: false,
        message: 'Attendance record already exists for this employee and date'
      });
    }
    
    if (error.message.includes('ORA-02291')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID or user ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      error: error.message
    });
  }
};

// Get biometric devices
const getBiometricDevices = async (req, res) => {
  try {
    const devices = await Attendance.getAllBiometricDevices();
    
    res.json({
      success: true,
      data: devices,
      message: 'Biometric devices retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting biometric devices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve biometric devices',
      error: error.message
    });
  }
};

// Create biometric device
const createBiometricDevice = async (req, res) => {
  try {
    const deviceData = req.body;
    const createdBy = req.user.userId;

    // Validate required fields
    if (!deviceData.deviceName || !deviceData.deviceCode) {
      return res.status(400).json({
        success: false,
        message: 'Device name and device code are required'
      });
    }

    const deviceId = await Attendance.createBiometricDevice(deviceData, createdBy);
    const newDevice = await Attendance.getAllBiometricDevices();
    const createdDevice = newDevice.find(d => d.DEVICE_ID === deviceId);

    res.status(201).json({
      success: true,
      data: createdDevice,
      message: 'Biometric device created successfully'
    });
  } catch (error) {
    console.error('Error creating biometric device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create biometric device',
      error: error.message
    });
  }
};

// Get attendance for dropdown
const getAttendanceForDropdown = async (req, res) => {
  try {
    const attendance = await Attendance.getAttendanceForDropdown();
    
    res.json({
      success: true,
      data: attendance,
      message: 'Attendance dropdown data retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting attendance dropdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve attendance dropdown data',
      error: error.message
    });
  }
};

// Get status for dropdown
const getStatusForDropdown = async (req, res) => {
  try {
    const statuses = [
      { STATUS: 'PRESENT', LABEL: 'Present' },
      { STATUS: 'ABSENT', LABEL: 'Absent' },
      { STATUS: 'HALF_DAY', LABEL: 'Half Day' },
      { STATUS: 'LEAVE', LABEL: 'Leave' },
      { STATUS: 'HOLIDAY', LABEL: 'Holiday' },
      { STATUS: 'WEEKEND', LABEL: 'Weekend' }
    ];
    
    res.json({
      success: true,
      data: statuses,
      message: 'Status dropdown data retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting status dropdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve status dropdown data',
      error: error.message
    });
  }
};

// Get attendance dashboard data
const getAttendanceDashboard = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Get overall statistics
    const overallStats = await Attendance.getAllAttendance({
      startDate,
      endDate
    });

    // Calculate dashboard metrics
    const totalRecords = overallStats.length;
    const presentCount = overallStats.filter(a => a.STATUS === 'PRESENT').length;
    const absentCount = overallStats.filter(a => a.STATUS === 'ABSENT').length;
    const leaveCount = overallStats.filter(a => a.STATUS === 'LEAVE').length;
    const halfDayCount = overallStats.filter(a => a.STATUS === 'HALF_DAY').length;

    const totalWorkHours = overallStats.reduce((sum, a) => sum + (a.WORK_HOURS || 0), 0);
    const totalOvertimeHours = overallStats.reduce((sum, a) => sum + (a.OVERTIME_HOURS || 0), 0);
    const totalLateMinutes = overallStats.reduce((sum, a) => sum + (a.LATE_MINUTES || 0), 0);

    const dashboardData = {
      period: { startDate, endDate },
      summary: {
        totalRecords,
        presentCount,
        absentCount,
        leaveCount,
        halfDayCount,
        attendanceRate: totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0
      },
      hours: {
        totalWorkHours: Math.round(totalWorkHours * 100) / 100,
        totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
        totalLateMinutes,
        averageWorkHours: totalRecords > 0 ? Math.round((totalWorkHours / totalRecords) * 100) / 100 : 0
      },
      recentAttendance: overallStats.slice(0, 10) // Last 10 records
    };

    res.json({
      success: true,
      data: dashboardData,
      message: 'Attendance dashboard data retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting attendance dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve attendance dashboard data',
      error: error.message
    });
  }
};

module.exports = {
  getAllAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  bulkCreateAttendance,
  getAttendanceStatistics,
  markAttendance,
  getBiometricDevices,
  createBiometricDevice,
  getAttendanceForDropdown,
  getStatusForDropdown,
  getAttendanceDashboard
}; 
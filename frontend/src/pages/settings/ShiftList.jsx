import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import SettingsList from '../../components/SettingsList';
import { shiftAPI } from '../../services/api';

const ShiftList = () => {
  const columns = [
    { key: 'SHIFT_ID', label: 'ID', type: 'text', hidden: true },
    { key: 'SHIFT_NAME', label: 'Shift Name', type: 'text' },
    { key: 'START_TIME', label: 'Start Time', type: 'text' },
    { key: 'END_TIME', label: 'End Time', type: 'text' },
    { key: 'DESCRIPTION', label: 'Description', type: 'text' },
    { key: 'OVERTIME_APPLICABLE', label: 'Overtime?', type: 'boolean' },
    { key: 'OVERTIME_CAP_HOURS', label: 'Overtime Cap Hours', type: 'number' },
    { key: 'FLEXIBLE_TIME_APPLICABLE', label: 'Flexible Time?', type: 'boolean' },
    { key: 'LATE_COMING_TOLERANCE', label: 'Late Tolerance (min)', type: 'number' },
    { key: 'EARLY_GOING_TOLERANCE', label: 'Early Tolerance (min)', type: 'number' },
    { key: 'STATUS', label: 'Status', type: 'status' },
    { key: 'CREATED_AT', label: 'Created At', type: 'date' }
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center space-x-4">
        <Link
          to="/settings"
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Settings
        </Link>
      </div>

      {/* Settings List */}
      <SettingsList
        title="Shifts"
        description="Manage work shifts, timings, and overtime policies"
        apiFunction={shiftAPI.getAll}
        deleteFunction={shiftAPI.delete}
        basePath="/settings/shifts"
        columns={columns}
        searchPlaceholder="Search shifts..."
      />
    </div>
  );
};

export default ShiftList; 
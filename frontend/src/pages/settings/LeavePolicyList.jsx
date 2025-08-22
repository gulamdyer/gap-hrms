import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon } from '@heroicons/react/24/outline';
import SettingsList from '../../components/SettingsList';
import { settingsAPI } from '../../services/api';

const LeavePolicyList = () => {
  const columns = [
    { key: 'LEAVE_POLICY_ID', label: 'ID', type: 'text', hidden: true },
    { key: 'LEAVE_CODE', label: 'Code', type: 'text' },
    { key: 'POLICY_NAME', label: 'Name', type: 'text' },
    { key: 'LEAVE_TYPE', label: 'Type', type: 'text' },
    { key: 'DEFAULT_DAYS', label: 'Default Days', type: 'number' },
    { key: 'MAX_DAYS', label: 'Max Days', type: 'number' },
    { key: 'IS_PAID', label: 'Paid', type: 'boolean' },
    { key: 'REQUIRES_APPROVAL', label: 'Approval Required', type: 'boolean' },
    { key: 'ALLOW_HALF_DAY', label: 'Half Day', type: 'boolean' },
    { key: 'STATUS', label: 'Status', type: 'status' },
    { key: 'CREATED_BY_NAME', label: 'Created By', type: 'text' },
    { key: 'CREATED_AT', label: 'Created At', type: 'date' }
  ];

  const formatBoolean = (value) => {
    return value === 'Y' ? 'Yes' : 'No';
  };

  const formatLeaveType = (value) => {
    const types = {
      'ANNUAL': 'Annual',
      'SICK': 'Sick',
      'CASUAL': 'Casual',
      'MATERNITY': 'Maternity',
      'PATERNITY': 'Paternity',
      'BEREAVEMENT': 'Bereavement',
      'COMPENSATORY': 'Compensatory',
      'UNPAID': 'Unpaid'
    };
    return types[value] || value;
  };

  return (
    <SettingsList
      title="Leave Policies"
      description="Manage employee leave policies and entitlements"
      apiFunction={settingsAPI.getAllLeavePolicies}
      deleteFunction={settingsAPI.deleteLeavePolicy}
      basePath="/settings/leave-policies"
      columns={columns}
      searchPlaceholder="Search by code, name, or description..."
      statusFilter={true}
      customRenderers={{
        IS_PAID: (value) => formatBoolean(value),
        REQUIRES_APPROVAL: (value) => formatBoolean(value),
        ALLOW_HALF_DAY: (value) => formatBoolean(value),
        LEAVE_TYPE: (value) => formatLeaveType(value)
      }}
    />
  );
};

export default LeavePolicyList; 
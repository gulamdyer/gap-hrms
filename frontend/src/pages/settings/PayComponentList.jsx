import React from 'react';
import { Link } from 'react-router-dom';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import SettingsList from '../../components/SettingsList';
import { settingsAPI } from '../../services/api';

const PayComponentList = () => {
  const columns = [
    { key: 'PAY_COMPONENT_ID', label: 'ID', type: 'text', hidden: true },
    { key: 'COMPONENT_CODE', label: 'Code', type: 'text' },
    { key: 'COMPONENT_NAME', label: 'Name', type: 'text' },
    { key: 'COMPONENT_TYPE', label: 'Type', type: 'text' },
  ];

  const formatBoolean = (value) => {
    return value === 'Y' ? 'Yes' : 'No';
  };

  const formatComponentType = (value) => {
    const types = {
      'EARNING': 'Earning',
      'DEDUCTION': 'Deduction',
      'ALLOWANCE': 'Allowance',
      'BONUS': 'Bonus'
    };
    return types[value] || value;
  };

  return (
    <SettingsList
      title="Pay Components"
      description="Manage salary components like earnings, deductions, allowances, and bonuses"
      apiFunction={settingsAPI.getAllPayComponents}
      deleteFunction={settingsAPI.deletePayComponent}
      basePath="/settings/pay-components"
      columns={columns}
      searchPlaceholder="Search by code, name, or description..."
      statusFilter={true}
      customRenderers={{
        COMPONENT_TYPE: (value) => formatComponentType(value)
      }}
    />
  );
};

export default PayComponentList; 
import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import SettingsList from '../../components/SettingsList';
import { settingsAPI } from '../../services/api';

const CostCenterList = () => {
  const columns = [
    { key: 'COST_CENTER_ID', label: 'ID', type: 'text', hidden: true },
    { key: 'COST_CENTER_CODE', label: 'Code', type: 'text' },
    { key: 'COST_CENTER_NAME', label: 'Cost Center Name', type: 'text' },
    { key: 'DESCRIPTION', label: 'Description', type: 'text' },
    { key: 'STATUS', label: 'Status', type: 'status' },
    { key: 'CREATED_BY_NAME', label: 'Created By', type: 'text' },
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
        title="Cost Centers"
        description="Manage cost centers and budgets"
        apiFunction={settingsAPI.getAllCostCenters}
        deleteFunction={settingsAPI.deleteCostCenter}
        basePath="/settings/cost-centers"
        columns={columns}
        searchPlaceholder="Search cost centers..."
      />
    </div>
  );
};

export default CostCenterList; 
import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import SettingsList from '../../components/SettingsList';
import { projectAPI } from '../../services/api';

const ProjectList = () => {
  const columns = [
    { key: 'PROJECT_ID', label: 'ID', type: 'text', hidden: true },
    { key: 'PROJECT_CODE', label: 'Project Code', type: 'text' },
    { key: 'PROJECT_NAME', label: 'Project Name', type: 'text' },
    { key: 'CLIENT_NAME', label: 'Client', type: 'text' },
    { key: 'IS_BILLABLE', label: 'Billable', type: 'boolean' },
    { key: 'HOURLY_RATE', label: 'Hourly Rate', type: 'currency' },
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
        title="Projects"
        description="Manage projects for timesheet tracking and billing"
        apiFunction={projectAPI.getAll}
        deleteFunction={projectAPI.delete}
        basePath="/settings/projects"
        columns={columns}
        searchPlaceholder="Search projects..."
      />
    </div>
  );
};

export default ProjectList; 
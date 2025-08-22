import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import SettingsList from '../../components/SettingsList';
import { settingsAPI } from '../../services/api';

const LocationList = () => {
  const columns = [
    { key: 'LOCATION_ID', label: 'ID', type: 'text', hidden: true },
    { key: 'LOCATION_NAME', label: 'Location Name', type: 'text' },
    { key: 'CITY', label: 'City', type: 'text' },
    { key: 'STATE', label: 'State', type: 'text' },
    { key: 'COUNTRY', label: 'Country', type: 'text' },
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
        title="Locations"
        description="Manage office locations and addresses"
        apiFunction={settingsAPI.getAllLocations}
        deleteFunction={settingsAPI.deleteLocation}
        basePath="/settings/locations"
        columns={columns}
        searchPlaceholder="Search locations..."
      />
    </div>
  );
};

export default LocationList; 
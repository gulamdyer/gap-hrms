import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { settingsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import currencyConfig from '../../utils/currency';
import SettingsList from '../../components/SettingsList';

const PayGradeList = () => {
  const columns = [
    { key: 'PAY_GRADE_ID', label: 'ID', type: 'text', hidden: true },
    { key: 'GRADE_CODE', label: 'Grade Code', type: 'text' },
    { key: 'GRADE_NAME', label: 'Grade Name', type: 'text' },
    { key: 'MIN_SALARY', label: 'Min Salary', type: 'currency' },
    { key: 'MAX_SALARY', label: 'Max Salary', type: 'currency' },
    { key: 'MID_SALARY', label: 'Mid Salary', type: 'currency' },
    { key: 'DESCRIPTION', label: 'Description', type: 'text' },
    { key: 'STATUS', label: 'Status', type: 'status' },
    { key: 'CREATED_BY_NAME', label: 'Created By', type: 'text' },
    { key: 'CREATED_AT', label: 'Created At', type: 'date' }
  ];

  const customRenderers = {
    MIN_SALARY: (value) => value ? currencyConfig.formatAmount(parseFloat(value)) : '-',
    MAX_SALARY: (value) => value ? currencyConfig.formatAmount(parseFloat(value)) : '-',
    MID_SALARY: (value) => value ? currencyConfig.formatAmount(parseFloat(value)) : '-'
  };

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
        title="Pay Grades"
        description="Manage pay grades and salary ranges"
        apiFunction={settingsAPI.getAllPayGrades}
        deleteFunction={settingsAPI.deletePayGrade}
        basePath="/settings/pay-grades"
        columns={columns}
        searchPlaceholder="Search pay grades..."
        customRenderers={customRenderers}
      />
    </div>
  );
};

export default PayGradeList; 
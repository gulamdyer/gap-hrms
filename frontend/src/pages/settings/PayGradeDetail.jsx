import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline';
import { settingsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import currencyConfig from '../../utils/currency';

const PayGradeDetail = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [payGrade, setPayGrade] = useState(null);

  useEffect(() => {
    fetchPayGrade();
  }, [id]);

  const fetchPayGrade = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getPayGradeById(id);
      setPayGrade(response.data);
    } catch (error) {
      console.error('Error fetching pay grade:', error);
      toast.error('Failed to fetch pay grade data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const formatCurrency = (value) => {
    return value ? currencyConfig.formatAmount(parseFloat(value)) : '-';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!payGrade) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Pay grade not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/settings/pay-grades"
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Pay Grades
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pay Grade Details</h1>
            <p className="mt-1 text-sm text-gray-500">
              View pay grade information and salary ranges
            </p>
          </div>
        </div>
        <Link
          to={`/settings/pay-grades/${id}/edit`}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PencilIcon className="h-4 w-4 mr-2" />
          Edit Pay Grade
        </Link>
      </div>

      {/* Pay Grade Information */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Pay Grade Information</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Grade Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade Code
              </label>
              <p className="text-sm text-gray-900">{payGrade.GRADE_CODE}</p>
            </div>

            {/* Grade Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade Name
              </label>
              <p className="text-sm text-gray-900">{payGrade.GRADE_NAME}</p>
            </div>

            {/* Minimum Salary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Salary
              </label>
              <p className="text-sm text-gray-900 font-medium">
                {formatCurrency(payGrade.MIN_SALARY)}
              </p>
            </div>

            {/* Maximum Salary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Salary
              </label>
              <p className="text-sm text-gray-900 font-medium">
                {formatCurrency(payGrade.MAX_SALARY)}
              </p>
            </div>

            {/* Mid Salary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mid Salary
              </label>
              <p className="text-sm text-gray-900 font-medium">
                {formatCurrency(payGrade.MID_SALARY)}
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div>{getStatusBadge(payGrade.STATUS)}</div>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <p className="text-sm text-gray-900">
                {payGrade.DESCRIPTION || 'No description provided'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Salary Range Visualization */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Salary Range</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {/* Salary Range Bar */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Min: {formatCurrency(payGrade.MIN_SALARY)}</span>
                <span>Mid: {formatCurrency(payGrade.MID_SALARY)}</span>
                <span>Max: {formatCurrency(payGrade.MAX_SALARY)}</span>
              </div>
              <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="absolute h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                  style={{
                    left: '0%',
                    width: '100%'
                  }}
                ></div>
                {payGrade.MID_SALARY && (
                  <div 
                    className="absolute top-0 h-full w-1 bg-red-500"
                    style={{
                      left: `${((payGrade.MID_SALARY - payGrade.MIN_SALARY) / (payGrade.MAX_SALARY - payGrade.MIN_SALARY)) * 100}%`
                    }}
                  ></div>
                )}
              </div>
            </div>

            {/* Salary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-blue-900">Range</div>
                <div className="text-lg font-bold text-blue-700">
                  {formatCurrency(payGrade.MAX_SALARY - payGrade.MIN_SALARY)}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-green-900">Mid Point</div>
                <div className="text-lg font-bold text-green-700">
                  {formatCurrency(payGrade.MID_SALARY)}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-purple-900">Compression Ratio</div>
                <div className="text-lg font-bold text-purple-700">
                  {payGrade.MAX_SALARY && payGrade.MIN_SALARY 
                    ? (payGrade.MAX_SALARY / payGrade.MIN_SALARY).toFixed(2) + ':1'
                    : '-'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Information */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Audit Information</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Created By
              </label>
              <p className="text-sm text-gray-900">{payGrade.CREATED_BY_NAME || 'System'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Created At
              </label>
              <p className="text-sm text-gray-900">
                {new Date(payGrade.CREATED_AT).toLocaleDateString('en-IN')}
              </p>
            </div>
            {payGrade.UPDATED_AT && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Updated
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(payGrade.UPDATED_AT).toLocaleDateString('en-IN')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayGradeDetail; 
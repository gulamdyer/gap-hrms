import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { settingsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import currencyConfig from '../../utils/currency';

const PayGradeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    gradeCode: '',
    gradeName: '',
    minSalary: '',
    maxSalary: '',
    midSalary: '',
    description: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    if (isEditing) {
      fetchPayGrade();
    }
  }, [id]);

  const fetchPayGrade = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getPayGradeById(id);
      const payGrade = response.data;
      
      setFormData({
        gradeCode: payGrade.GRADE_CODE || '',
        gradeName: payGrade.GRADE_NAME || '',
        minSalary: payGrade.MIN_SALARY || '',
        maxSalary: payGrade.MAX_SALARY || '',
        midSalary: payGrade.MID_SALARY || '',
        description: payGrade.DESCRIPTION || '',
        status: payGrade.STATUS || 'ACTIVE'
      });
    } catch (error) {
      console.error('Error fetching pay grade:', error);
      toast.error('Failed to fetch pay grade data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSalaryChange = (field, value) => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: numericValue
    }));
  };

  const calculateMidSalary = () => {
    const min = parseFloat(formData.minSalary) || 0;
    const max = parseFloat(formData.maxSalary) || 0;
    if (min > 0 && max > 0 && max >= min) {
      const mid = (min + max) / 2;
      setFormData(prev => ({
        ...prev,
        midSalary: mid.toFixed(2)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate salary ranges
      const minSalary = parseFloat(formData.minSalary);
      const maxSalary = parseFloat(formData.maxSalary);
      
      if (minSalary >= maxSalary) {
        toast.error('Maximum salary must be greater than minimum salary');
        setSubmitting(false);
        return;
      }

      const submitData = {
        ...formData,
        minSalary: minSalary,
        maxSalary: maxSalary,
        midSalary: formData.midSalary ? parseFloat(formData.midSalary) : null
      };

      if (isEditing) {
        await settingsAPI.updatePayGrade(id, submitData);
        toast.success('Pay grade updated successfully!');
      } else {
        await settingsAPI.createPayGrade(submitData);
        toast.success('Pay grade created successfully!');
      }
      
      navigate('/settings/pay-grades');
    } catch (error) {
      console.error('Error submitting form:', error);
      
      if (error.response?.data?.errors) {
        const validationErrors = {};
        error.response.data.errors.forEach(err => {
          validationErrors[err.field] = err.message;
        });
        toast.error('Please fix the validation errors');
      } else {
        toast.error(error.response?.data?.message || 'Failed to save pay grade');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
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
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Pay Grade' : 'Create Pay Grade'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEditing ? 'Update pay grade information' : 'Add a new pay grade'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Grade Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade Code *
              </label>
              <input
                type="text"
                value={formData.gradeCode}
                onChange={(e) => handleInputChange('gradeCode', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter grade code (e.g., G1, G2)"
                required
                maxLength={20}
              />
            </div>

            {/* Grade Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade Name *
              </label>
              <input
                type="text"
                value={formData.gradeName}
                onChange={(e) => handleInputChange('gradeName', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter grade name (e.g., Junior, Senior)"
                required
              />
            </div>

            {/* Minimum Salary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Salary ({currencyConfig.getSymbol()}) *
              </label>
              <input
                type="number"
                value={formData.minSalary}
                onChange={(e) => handleInputChange('minSalary', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter minimum salary"
                min="0"
                step="0.01"
                required
              />
            </div>

            {/* Maximum Salary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Salary ({currencyConfig.getSymbol()}) *
              </label>
              <input
                type="number"
                value={formData.maxSalary}
                onChange={(e) => handleInputChange('maxSalary', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter maximum salary"
                min="0"
                step="0.01"
                required
              />
            </div>

            {/* Mid Salary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mid Salary ({currencyConfig.getSymbol()})
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.midSalary}
                  onChange={(e) => handleSalaryChange('midSalary', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Enter mid salary or calculate"
                />
                <button
                  type="button"
                  onClick={calculateMidSalary}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Calculate
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Automatically calculate mid-point between min and max salary
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter description for this pay grade"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              to="/settings/pay-grades"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : (isEditing ? 'Update Pay Grade' : 'Create Pay Grade')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayGradeForm; 
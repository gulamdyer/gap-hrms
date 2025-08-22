import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { settingsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const PayComponentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    componentCode: '',
    componentName: '',
    componentType: 'EARNING',
    description: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    if (isEditing) {
      fetchPayComponent();
    }
  }, [id]);

  const fetchPayComponent = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getPayComponentById(id);
      const payComponent = response.data;
      
      setFormData({
        componentCode: payComponent.COMPONENT_CODE || '',
        componentName: payComponent.COMPONENT_NAME || '',
        componentType: payComponent.COMPONENT_TYPE || 'EARNING',
        description: payComponent.DESCRIPTION || '',
        status: payComponent.STATUS || 'ACTIVE'
      });
    } catch (error) {
      console.error('Error fetching pay component:', error);
      toast.error('Failed to fetch pay component data');
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

  // Removed statutory presets: calculation driven via Payroll Settings now

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEditing) {
        await settingsAPI.updatePayComponent(id, formData);
        toast.success('Pay Component updated successfully!');
      } else {
        await settingsAPI.createPayComponent(formData);
        toast.success('Pay Component created successfully!');
      }
      
      navigate('/settings/pay-components');
    } catch (error) {
      console.error('Error submitting form:', error);
      
      if (error.response?.data?.errors) {
        const validationErrors = {};
        error.response.data.errors.forEach(err => {
          validationErrors[err.field] = err.message;
        });
        toast.error('Please fix the validation errors');
      } else {
        toast.error(error.response?.data?.message || 'Failed to save pay component');
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
            to="/settings/pay-components"
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Pay Component' : 'Create Pay Component'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEditing ? 'Update pay component information' : 'Add a new pay component'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Component Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Component Code *
              </label>
              <input
                type="text"
                value={formData.componentCode}
                onChange={(e) => handleInputChange('componentCode', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter component code (e.g., BASIC, HRA, DA)"
                required
              />
            </div>

            {/* Component Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Component Name *
              </label>
              <input
                type="text"
                value={formData.componentName}
                onChange={(e) => handleInputChange('componentName', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter component name"
                required
              />
            </div>

            {/* Component Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Component Type *
              </label>
              <select
                value={formData.componentType}
                onChange={(e) => handleInputChange('componentType', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                required
              >
                <option value="EARNING">Earning</option>
                <option value="DEDUCTION">Deduction</option>
                <option value="ALLOWANCE">Allowance</option>
                <option value="BONUS">Bonus</option>
              </select>
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
                placeholder="Enter description"
              />
            </div>

            {/* Note: All statutory and rule-driven fields were removed to avoid confusion.
                Statutory configuration now lives under Payroll Settings. */}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              to="/settings/pay-components"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : (isEditing ? 'Update Pay Component' : 'Create Pay Component')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayComponentForm; 
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { settingsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const LeavePolicyForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    leaveCode: '',
    policyName: '',
    leaveType: 'ANNUAL',
    description: '',
    defaultDays: 0,
    maxDays: 0,
    minDays: 0,
    carryForwardDays: 0,
    carryForwardExpiryMonths: 12,
    isPaid: 'Y',
    requiresApproval: 'Y',
    allowHalfDay: 'N',
    allowAttachment: 'N',
    applicableFromMonths: 0,
    applicableFromDays: 0,
    status: 'ACTIVE'
  });

  useEffect(() => {
    if (isEditing) {
      fetchLeavePolicy();
    }
  }, [id]);

  const fetchLeavePolicy = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getLeavePolicyById(id);
      const leavePolicy = response.data;
      
      setFormData({
        leaveCode: leavePolicy.LEAVE_CODE || '',
        policyName: leavePolicy.POLICY_NAME || '',
        leaveType: leavePolicy.LEAVE_TYPE || 'ANNUAL',
        description: leavePolicy.DESCRIPTION || '',
        defaultDays: leavePolicy.DEFAULT_DAYS || 0,
        maxDays: leavePolicy.MAX_DAYS || 0,
        minDays: leavePolicy.MIN_DAYS || 0,
        carryForwardDays: leavePolicy.CARRY_FORWARD_DAYS || 0,
        carryForwardExpiryMonths: leavePolicy.CARRY_FORWARD_EXPIRY_MONTHS || 12,
        isPaid: leavePolicy.IS_PAID || 'Y',
        requiresApproval: leavePolicy.REQUIRES_APPROVAL || 'Y',
        allowHalfDay: leavePolicy.ALLOW_HALF_DAY || 'N',
        allowAttachment: leavePolicy.ALLOW_ATTACHMENT || 'N',
        applicableFromMonths: leavePolicy.APPLICABLE_FROM_MONTHS || 0,
        applicableFromDays: leavePolicy.APPLICABLE_FROM_DAYS || 0,
        status: leavePolicy.STATUS || 'ACTIVE'
      });
    } catch (error) {
      console.error('Error fetching leave policy:', error);
      toast.error('Failed to fetch leave policy data');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEditing) {
        await settingsAPI.updateLeavePolicy(id, formData);
        toast.success('Leave Policy updated successfully!');
      } else {
        await settingsAPI.createLeavePolicy(formData);
        toast.success('Leave Policy created successfully!');
      }
      
      navigate('/settings/leave-policies');
    } catch (error) {
      console.error('Error submitting form:', error);
      
      if (error.response?.data?.errors) {
        const validationErrors = {};
        error.response.data.errors.forEach(err => {
          validationErrors[err.field] = err.message;
        });
        toast.error('Please fix the validation errors');
      } else {
        toast.error(error.response?.data?.message || 'Failed to save leave policy');
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
            to="/settings/leave-policies"
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Leave Policy' : 'Create Leave Policy'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEditing ? 'Update leave policy information' : 'Add a new leave policy'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Leave Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Code *
              </label>
              <input
                type="text"
                value={formData.leaveCode}
                onChange={(e) => handleInputChange('leaveCode', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter leave code (max 5 characters, e.g., ANL, SIC)"
                maxLength="5"
                required
              />
            </div>

            {/* Policy Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Policy Name *
              </label>
              <input
                type="text"
                value={formData.policyName}
                onChange={(e) => handleInputChange('policyName', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter policy name"
                required
              />
            </div>

            {/* Leave Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Type *
              </label>
              <select
                value={formData.leaveType}
                onChange={(e) => handleInputChange('leaveType', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                required
              >
                <option value="ANNUAL">Annual Leave</option>
                <option value="SICK">Sick Leave</option>
                <option value="CASUAL">Casual Leave</option>
                <option value="MATERNITY">Maternity Leave</option>
                <option value="PATERNITY">Paternity Leave</option>
                <option value="BEREAVEMENT">Bereavement Leave</option>
                <option value="COMPENSATORY">Compensatory Leave</option>
                <option value="UNPAID">Unpaid Leave</option>
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

            {/* Default Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Days
              </label>
              <input
                type="number"
                value={formData.defaultDays}
                onChange={(e) => handleInputChange('defaultDays', parseInt(e.target.value) || 0)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                min="0"
                placeholder="0"
              />
            </div>

            {/* Max Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Days
              </label>
              <input
                type="number"
                value={formData.maxDays}
                onChange={(e) => handleInputChange('maxDays', parseInt(e.target.value) || 0)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                min="0"
                placeholder="0"
              />
            </div>

            {/* Min Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Days
              </label>
              <input
                type="number"
                value={formData.minDays}
                onChange={(e) => handleInputChange('minDays', parseInt(e.target.value) || 0)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                min="0"
                placeholder="0"
              />
            </div>

            {/* Carry Forward Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Carry Forward Days
              </label>
              <input
                type="number"
                value={formData.carryForwardDays}
                onChange={(e) => handleInputChange('carryForwardDays', parseInt(e.target.value) || 0)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                min="0"
                placeholder="0"
              />
            </div>

            {/* Carry Forward Expiry Months */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Carry Forward Expiry (Months)
              </label>
              <input
                type="number"
                value={formData.carryForwardExpiryMonths}
                onChange={(e) => handleInputChange('carryForwardExpiryMonths', parseInt(e.target.value) || 12)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                min="1"
                max="24"
                placeholder="12"
              />
            </div>

            {/* Is Paid */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paid Leave
              </label>
              <select
                value={formData.isPaid}
                onChange={(e) => handleInputChange('isPaid', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="Y">Yes</option>
                <option value="N">No</option>
              </select>
            </div>

            {/* Requires Approval */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requires Approval
              </label>
              <select
                value={formData.requiresApproval}
                onChange={(e) => handleInputChange('requiresApproval', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="Y">Yes</option>
                <option value="N">No</option>
              </select>
            </div>

            {/* Allow Half Day */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allow Half Day
              </label>
              <select
                value={formData.allowHalfDay}
                onChange={(e) => handleInputChange('allowHalfDay', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="N">No</option>
                <option value="Y">Yes</option>
              </select>
            </div>

            {/* Allow Attachment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allow Attachment
              </label>
              <select
                value={formData.allowAttachment}
                onChange={(e) => handleInputChange('allowAttachment', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="N">No</option>
                <option value="Y">Yes</option>
              </select>
            </div>

            {/* Applicable From Months */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Applicable From (Months)
              </label>
              <input
                type="number"
                value={formData.applicableFromMonths}
                onChange={(e) => handleInputChange('applicableFromMonths', parseInt(e.target.value) || 0)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                min="0"
                placeholder="0"
              />
            </div>

            {/* Applicable From Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Applicable From (Days)
              </label>
              <input
                type="number"
                value={formData.applicableFromDays}
                onChange={(e) => handleInputChange('applicableFromDays', parseInt(e.target.value) || 0)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                min="0"
                placeholder="0"
              />
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
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              to="/settings/leave-policies"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : (isEditing ? 'Update Leave Policy' : 'Create Leave Policy')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeavePolicyForm; 
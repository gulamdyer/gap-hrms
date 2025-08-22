import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PencilIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { resignationAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const ResignationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resignation, setResignation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const resignationReasons = [
    { value: 'BETTER_OPPORTUNITY', label: 'Better Opportunity' },
    { value: 'CAREER_GROWTH', label: 'Career Growth' },
    { value: 'HIGHER_STUDIES', label: 'Higher Studies' },
    { value: 'PERSONAL_REASONS', label: 'Personal Reasons' },
    { value: 'FAMILY_REASONS', label: 'Family Reasons' },
    { value: 'HEALTH_ISSUES', label: 'Health Issues' },
    { value: 'RELOCATION', label: 'Relocation' },
    { value: 'WORK_LIFE_BALANCE', label: 'Work-Life Balance' },
    { value: 'COMPENSATION', label: 'Compensation Issues' },
    { value: 'WORK_ENVIRONMENT', label: 'Work Environment' },
    { value: 'RETIREMENT', label: 'Retirement' },
    { value: 'PERFORMANCE_ISSUES', label: 'Performance Issues' },
    { value: 'POLICY_VIOLATION', label: 'Policy Violation' },
    { value: 'MISCONDUCT', label: 'Misconduct' },
    { value: 'RESTRUCTURING', label: 'Company Restructuring' },
    { value: 'BUSINESS_CLOSURE', label: 'Business Closure' },
    { value: 'OTHER', label: 'Other' }
  ];

  const formatReason = (reasonValue) => {
    const reason = resignationReasons.find(r => r.value === reasonValue);
    return reason ? reason.label : reasonValue || '-';
  };

  useEffect(() => {
    fetchResignation();
    // eslint-disable-next-line
  }, [id]);

  const fetchResignation = async () => {
    try {
      setLoading(true);
      const response = await resignationAPI.getById(id);
      setResignation(response.data);
    } catch (error) {
      toast.error('Failed to fetch resignation details');
      navigate('/resignations');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };
  const confirmDelete = async () => {
    try {
      await resignationAPI.delete(id);
      toast.success('Resignation deleted successfully');
      navigate('/resignations');
    } catch (error) {
      toast.error('Failed to delete resignation');
    } finally {
      setShowDeleteModal(false);
    }
  };
  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  if (loading) return <LoadingSpinner />;
  if (!resignation) return null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/resignations')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" /> Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resignation / Termination Details</h1>
            <p className="mt-1 text-sm text-gray-500">Employee: {resignation.FIRST_NAME} {resignation.LAST_NAME} ({resignation.EMPLOYEE_CODE})</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to={`/resignations/${id}/edit`}
            className="inline-flex items-center px-3 py-2 border border-yellow-300 rounded-md shadow-sm text-sm font-medium text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            title="Edit"
          >
            <PencilIcon className="h-4 w-4 mr-2" /> Edit
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            title="Delete"
          >
            <TrashIcon className="h-4 w-4 mr-2" /> Delete
          </button>
        </div>
      </div>
      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Employee Information</h3>
            <p className="text-sm text-gray-700">Name: {resignation.FIRST_NAME} {resignation.LAST_NAME}</p>
            <p className="text-sm text-gray-700">Code: {resignation.EMPLOYEE_CODE}</p>
            <p className="text-sm text-gray-700">Designation: {resignation.DESIGNATION}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Resignation Details</h3>
            <p className="text-sm text-gray-700">Type: {resignation.TYPE}</p>
            <p className="text-sm text-gray-700">Status: {resignation.STATUS}</p>
            <p className="text-sm text-gray-700">Notice Date: {formatDate(resignation.NOTICE_DATE)}</p>
            <p className="text-sm text-gray-700">Last Working Date: {formatDate(resignation.LAST_WORKING_DATE)}</p>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Reason</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{formatReason(resignation.REASON)}</p>
        </div>
        {resignation.ATTACHMENT_URL && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Attachment</h3>
            <a
              href={resignation.ATTACHMENT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              View Attachment
            </a>
          </div>
        )}
        {resignation.COMMENTS && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Comments</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{resignation.COMMENTS}</p>
          </div>
        )}
      </div>
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Delete Resignation</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 text-center">Are you sure you want to delete this resignation?</p>
                <p className="text-xs text-gray-400 text-center mt-2">This action cannot be undone.</p>
              </div>
              <div className="flex items-center justify-end space-x-3 mt-4">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResignationDetail; 
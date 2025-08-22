import React, { useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import useAuthStore from '../store/authStore';
import Modal from '../components/Modal';

const defaultForm = {
  shiftName: '',
  startTime: '',
  endTime: '',
  description: '',
  status: 'ACTIVE',
  overtimeApplicable: false,
  overtimeCapHours: ''
};

const ShiftManagement = () => {
  const { user } = useAuthStore();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/shifts');
      setShifts(res.data.data || []);
    } catch (err) {
      toast.error('Failed to fetch shifts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const openAdd = () => {
    setForm(defaultForm);
    setFormErrors({});
    setEditId(null);
    setModalOpen(true);
  };

  const openEdit = (shift) => {
    setForm({
      shiftName: shift.SHIFT_NAME,
      startTime: shift.START_TIME,
      endTime: shift.END_TIME,
      description: shift.DESCRIPTION || '',
      status: shift.STATUS,
      overtimeApplicable: shift.OVERTIME_APPLICABLE === 1,
      overtimeCapHours: shift.OVERTIME_CAP_HOURS || ''
    });
    setFormErrors({});
    setEditId(shift.SHIFT_ID);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditId(null);
    setForm(defaultForm);
    setFormErrors({});
  };

  const validate = () => {
    const errors = {};
    if (!form.shiftName.trim()) errors.shiftName = 'Shift name is required';
    if (!form.startTime) errors.startTime = 'Start time is required';
    if (!form.endTime) errors.endTime = 'End time is required';
    if (form.overtimeApplicable) {
      const val = Number(form.overtimeCapHours);
      if (!form.overtimeCapHours || isNaN(val) || val < 1 || val > 12) {
        errors.overtimeCapHours = 'Overtime Cap Hours must be a number between 1 and 12';
      }
    }
    return errors;
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix errors in the form');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        overtimeApplicable: form.overtimeApplicable,
        overtimeCapHours: form.overtimeApplicable ? form.overtimeCapHours : null
      };
      if (editId) {
        await api.put(`/api/shifts/${editId}`, payload);
        toast.success('Shift updated');
      } else {
        await api.post('/api/shifts', payload);
        toast.success('Shift created');
      }
      closeModal();
      fetchShifts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save shift');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/shifts/${deleteId}`);
      toast.success('Shift deleted');
      setDeleteId(null);
      fetchShifts();
    } catch (err) {
      toast.error('Failed to delete shift');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shift Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage work shifts, timings, and overtime policies</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Shift
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : shifts.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">No shifts found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first shift.</p>
          <button
            onClick={openAdd}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Shift
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overtime?</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overtime Cap</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shifts.map((shift) => (
                <tr key={shift.SHIFT_ID}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{shift.SHIFT_NAME}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{shift.START_TIME}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{shift.END_TIME}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {shift.OVERTIME_APPLICABLE === 1 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Yes</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{shift.OVERTIME_APPLICABLE === 1 ? shift.OVERTIME_CAP_HOURS : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${shift.STATUS === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>{shift.STATUS}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    <button
                      onClick={() => openEdit(shift)}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => confirmDelete(shift.SHIFT_ID)}
                      className="inline-flex items-center px-2 py-1 border border-red-300 rounded text-xs text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Add/Edit */}
      <Modal open={modalOpen} onClose={closeModal} title={editId ? 'Edit Shift' : 'Add Shift'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shift Name *</label>
            <input
              type="text"
              name="shiftName"
              value={form.shiftName}
              onChange={handleFormChange}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${formErrors.shiftName ? 'border-red-500' : 'border-gray-300'}`}
              maxLength={100}
              required
            />
            {formErrors.shiftName && <p className="mt-1 text-sm text-red-600">{formErrors.shiftName}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
              <input
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={handleFormChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${formErrors.startTime ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {formErrors.startTime && <p className="mt-1 text-sm text-red-600">{formErrors.startTime}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
              <input
                type="time"
                name="endTime"
                value={form.endTime}
                onChange={handleFormChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${formErrors.endTime ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {formErrors.endTime && <p className="mt-1 text-sm text-red-600">{formErrors.endTime}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              name="description"
              value={form.description}
              onChange={handleFormChange}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-gray-300"
              maxLength={255}
            />
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="overtimeApplicable"
                checked={form.overtimeApplicable}
                onChange={handleFormChange}
                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Overtime Applicable?</span>
            </label>
            {form.overtimeApplicable && (
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-700 mr-2">Overtime Cap Hours *</label>
                <input
                  type="number"
                  name="overtimeCapHours"
                  value={form.overtimeCapHours}
                  onChange={handleFormChange}
                  min={1}
                  max={12}
                  step={1}
                  className={`w-28 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${formErrors.overtimeCapHours ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                {formErrors.overtimeCapHours && <p className="ml-2 text-sm text-red-600">{formErrors.overtimeCapHours}</p>}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleFormChange}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="flex items-center justify-end space-x-4 mt-4">
            <button
              type="button"
              onClick={closeModal}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={submitting}
            >
              <XMarkIcon className="h-4 w-4 mr-2" /> Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  {editId ? 'Update Shift' : 'Create Shift'}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Shift?">
        <div className="py-4">
          <p>Are you sure you want to delete this shift? This action cannot be undone.</p>
        </div>
        <div className="flex items-center justify-end space-x-4 mt-4">
          <button
            type="button"
            onClick={() => setDeleteId(null)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={deleting}
          >
            <XMarkIcon className="h-4 w-4 mr-2" /> Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <TrashIcon className="h-4 w-4 mr-2" /> Delete
              </>
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ShiftManagement; 
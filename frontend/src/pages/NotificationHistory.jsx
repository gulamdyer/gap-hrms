import React, { useState, useMemo } from 'react';
import { useNotifications } from '../components/NotificationProvider';
import { CheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const NOTIF_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'APPROVAL', label: 'Approval' },
  { value: 'PAYROLL', label: 'Payroll' },
  { value: 'LEAVE', label: 'Leave' },
  { value: 'OTHER', label: 'Other' },
];

const NotificationHistory = () => {
  const { notifications, markAsRead } = useNotifications();
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Filtered notifications
  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      const matchesStatus = statusFilter ? (statusFilter === 'UNREAD' ? n.status !== 'READ' : n.status === 'READ') : true;
      const matchesType = typeFilter ? n.type?.toUpperCase().includes(typeFilter) : true;
      const matchesSearch = search ? (n.message?.toLowerCase().includes(search.toLowerCase()) || n.type?.toLowerCase().includes(search.toLowerCase())) : true;
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [notifications, statusFilter, typeFilter, search]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification History</h1>
          <p className="mt-1 text-sm text-gray-500">All your notifications in one place</p>
        </div>
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-32 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All</option>
              <option value="UNREAD">Unread</option>
              <option value="READ">Read</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              className="w-40 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {NOTIF_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search notifications..."
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                      <p className="text-sm text-gray-500 mb-4">Try adjusting your filters or check back later.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((notif) => (
                  <tr key={notif.id || notif.createdAt} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary-100 text-primary-800">
                        {notif.type?.replace(/_/g, ' ') || 'Other'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-900">{notif.message}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${notif.status !== 'READ' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {notif.status !== 'READ' ? 'Unread' : 'Read'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {notif.createdAt ? new Date(notif.createdAt).toLocaleString('en-GB') : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-primary-600 hover:text-primary-900 hover:bg-primary-50 mr-2"
                        title="Mark as read"
                        onClick={() => markAsRead(notif.id)}
                        disabled={notif.status === 'READ'}
                      >
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Mark as read
                      </button>
                      {/* Future: View details, delete, etc. */}
                      {/* <button className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                        <EyeIcon className="h-4 w-4 mr-1" /> View
                      </button> */}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(page - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(page * itemsPerPage, filtered.length)}</span> of <span className="font-medium">{filtered.length}</span> notifications
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-l-md text-sm bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 border border-gray-300 text-sm ${p === page ? 'bg-primary-50 text-primary-600' : 'bg-white hover:bg-gray-50'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-r-md text-sm bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationHistory;

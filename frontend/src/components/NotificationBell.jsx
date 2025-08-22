import React, { useState, useRef, useEffect } from 'react';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useNotifications } from './NotificationProvider';

const NotificationBell = () => {
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const bellRef = useRef();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={bellRef}>
      <button
        className="relative p-2 rounded-full bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
      >
        <BellIcon className="h-6 w-6 text-primary-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="origin-top-right absolute right-0 mt-2 w-96 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-2 px-4 border-b flex items-center justify-between">
            <span className="font-semibold text-gray-900">Notifications</span>
            {unreadCount > 0 && (
              <button
                className="text-xs text-primary-600 hover:underline flex items-center"
                onClick={() => { markAllAsRead(); setOpen(false); }}
              >
                <CheckIcon className="h-4 w-4 mr-1" /> Mark all as read
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 && (
              <li className="py-6 text-center text-gray-400">No notifications</li>
            )}
            {notifications.slice(0, 10).map((notif) => (
              <li
                key={notif.id || notif.createdAt}
                className={`flex items-start px-4 py-3 cursor-pointer hover:bg-gray-50 ${notif.status !== 'READ' ? 'bg-primary-50' : ''}`}
                onClick={() => { markAsRead(notif.id); setOpen(false); }}
              >
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 mt-1">
                  <BellIcon className="h-5 w-5 text-primary-600" />
                </span>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">{notif.type.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{notif.createdAt ? new Date(notif.createdAt).toLocaleString('en-GB') : ''}</p>
                </div>
                {notif.status !== 'READ' && (
                  <span className="ml-2 mt-1 inline-block w-2 h-2 bg-red-500 rounded-full" />
                )}
              </li>
            ))}
          </ul>
          <div className="py-2 px-4 text-xs text-gray-400 text-right">
            Showing {Math.min(10, notifications.length)} of {notifications.length} notifications
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

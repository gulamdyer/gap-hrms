import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { connectNotificationSocket, onNotification, disconnectNotificationSocket } from '../services/notificationService';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export function useNotifications() {
  return useContext(NotificationContext);
}

const NOTIF_STORAGE_KEY = 'gaphrms_notifications';

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, token } = useAuthStore();
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem(NOTIF_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  // Connect to socket on login - DISABLED to prevent websocket errors
  useEffect(() => {
    // TODO: Re-enable when notification system is needed
    // if (isAuthenticated && token) {
    //   connectNotificationSocket(token);
    //   onNotification((notif) => {
    //     setNotifications((prev) => [notif, ...prev]);
    //     toast.custom((t) => (
    //       <div className={`max-w-xs w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
    //         <div className="flex-1 w-0 p-4">
    //           <div className="flex items-start">
    //             <div className="flex-shrink-0 pt-0.5">
    //               <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary-100">
    //                 <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 7.165 6 9.388 6 12v2.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
    //               </span>
    //             </div>
    //             <div className="ml-3 flex-1">
    //               <p className="text-sm font-medium text-gray-900">{notif.type.replace(/_/g, ' ')}</p>
    //               <p className="mt-1 text-sm text-gray-500">{notif.message}</p>
    //             </div>
    //           </div>
    //         </div>
    //         <div className="flex border-l border-gray-200">
    //           <button onClick={() => toast.dismiss(t.id)} className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary-600 hover:text-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500">Dismiss</button>
    //         </div>
    //       </div>
    //     ));
    //   });
    // }
    // return () => disconnectNotificationSocket();
  }, [isAuthenticated, token]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, status: 'READ' })));
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, status: 'READ' } : n));
  }, []);

  const unreadCount = notifications.filter((n) => n.status !== 'READ').length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllAsRead, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

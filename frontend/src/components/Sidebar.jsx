import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  DocumentTextIcon,
  CogIcon,
  ChartBarIcon,
  BellIcon,
  ArrowLeftOnRectangleIcon,
  CurrencyDollarIcon,
  MinusCircleIcon,
  ClockIcon,
  FingerPrintIcon,
  ArrowUpTrayIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import useAuthStore from '../store/authStore';
import { getAppName } from '../config/appConfig';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Employees', href: '/employees', icon: UsersIcon },
    { name: 'Attendance', href: '/attendance', icon: FingerPrintIcon },
    { 
      name: 'Payroll', 
      href: '/payroll', 
      icon: CurrencyDollarIcon,
      submenu: [
        { name: 'Dashboard', href: '/payroll' },
        { name: 'Month-End Processing', href: '/payroll/month-end' }
      ]
    },

    { name: 'Advances', href: '/advances', icon: CurrencyDollarIcon },
    { name: 'Loans', href: '/loans', icon: CurrencyDollarIcon },
    { name: 'Deductions', href: '/deductions', icon: MinusCircleIcon },
    { name: 'Ledger', href: '/ledger', icon: BookOpenIcon },
    { name: 'Leaves', href: '/leaves', icon: CalendarIcon },
    { name: 'Resumption', href: '/leave-resumptions', icon: CalendarIcon },
    { name: 'Timesheets', href: '/timesheets', icon: ClockIcon },
    { name: 'Resignations', href: '/resignations', icon: DocumentTextIcon },
    { name: 'Reports', href: '/reports', icon: ChartBarIcon },
    { name: 'Documents', href: '/documents', icon: DocumentTextIcon },
    { 
      name: 'Settings', 
      href: '/settings', 
      icon: CogIcon,
      submenu: [
        { name: 'Designation', href: '/settings/designations' },
        { name: 'Role', href: '/settings/roles' },
        { name: 'Department', href: '/settings/departments' },
        { name: 'Position', href: '/settings/positions' },
        { name: 'Section / Workcenter', href: '/settings/workcenters' },
        { name: 'Location', href: '/settings/locations' },
        { name: 'Cost Center', href: '/settings/cost-centers' },
        { name: 'Pay Grade', href: '/settings/pay-grades' },
        { name: 'Pay Components', href: '/settings/pay-components' },
        { name: 'Employment Type', href: '/settings/employment-types' },
        { name: 'Leave Policies', href: '/settings/leave-policies' },
        { name: 'Payroll Settings', href: '/settings/payroll' },
        { name: 'SQL Server Configs', href: '/sql-server-configs' },
        { name: 'Import/Export', href: '/import-export' },
        { name: 'User Management', href: '/users' }
      ]
    },
  ];

  // Hide specific menus as requested
  const filteredNavigation = navigation.filter((item) =>
    item.name !== 'Timesheets'
  );

  const handleLogout = async () => {
    try {
      logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gradient">{getAppName()}</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.submenu && item.submenu.some(subItem => location.pathname === subItem.href));
              const isSettingsActive = item.name === 'Settings' && isActive;
              
              return (
                <div key={item.name}>
                  <Link
                    to={item.href}
                    className={`sidebar-item ${isActive ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                  
                  {/* Submenu for Settings */}
                  {item.submenu && isSettingsActive && (
                    <div className="ml-8 mt-2 space-y-1">
                      {item.submenu.map((subItem) => {
                        const isSubActive = location.pathname === subItem.href;
                        return (
                          <Link
                            key={subItem.name}
                            to={subItem.href}
                            className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                              isSubActive 
                                ? 'bg-primary-100 text-primary-700' 
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                            onClick={onClose}
                          >
                            {subItem.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="px-4 py-6 border-t border-gray-200 space-y-2">
            {/* Notifications */}
            <button className="sidebar-item w-full justify-start">
              <BellIcon className="h-5 w-5 mr-3" />
              Notifications
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="sidebar-item w-full justify-start text-danger-600 hover:bg-danger-50 hover:text-danger-700"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
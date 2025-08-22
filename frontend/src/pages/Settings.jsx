import React from 'react';
import { Link } from 'react-router-dom';
import {
  UserGroupIcon,
  UserIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  CogIcon,
  CreditCardIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  AcademicCapIcon,
  ServerIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

const Settings = () => {
  const settingsCategories = [
    {
      title: 'Designation',
      description: 'Manage employee designations and titles',
      icon: UserGroupIcon,
      href: '/settings/designations',
      color: 'bg-blue-500'
    },
    {
      title: 'Role',
      description: 'Manage user roles and permissions',
      icon: UserIcon,
      href: '/settings/roles',
      color: 'bg-green-500'
    },
    {
      title: 'Department',
      description: 'Manage company departments',
      icon: BuildingOfficeIcon,
      href: '/settings/departments',
      color: 'bg-sky-500'
    },
    {
      title: 'Section / Workcenter',
      description: 'Manage sections and workcenters',
      icon: BuildingOfficeIcon,
      href: '/settings/workcenters',
      color: 'bg-fuchsia-500'
    },
    {
      title: 'Employment Type',
      description: 'Manage employment types',
      icon: UserGroupIcon,
      href: '/settings/employment-types',
      color: 'bg-lime-600'
    },
    {
      title: 'Position',
      description: 'Manage job positions and titles',
      icon: BuildingOfficeIcon,
      href: '/settings/positions',
      color: 'bg-purple-500'
    },
    {
      title: 'Location',
      description: 'Manage office locations and addresses',
      icon: MapPinIcon,
      href: '/settings/locations',
      color: 'bg-orange-500'
    },
    {
      title: 'Cost Center',
      description: 'Manage cost centers and budgets',
      icon: CurrencyDollarIcon,
      href: '/settings/cost-centers',
      color: 'bg-red-500'
    },
    {
      title: 'Pay Grade',
      description: 'Manage pay grades and salary ranges',
      icon: AcademicCapIcon,
      href: '/settings/pay-grades',
      color: 'bg-emerald-500'
    },
    {
      title: 'Pay Component',
      description: 'Manage salary components and allowances',
      icon: CreditCardIcon,
      href: '/settings/pay-components',
      color: 'bg-indigo-500'
    },
    {
      title: 'Leave Policy',
      description: 'Manage employee leave policies and entitlements',
      icon: CalendarIcon,
      href: '/settings/leave-policies',
      color: 'bg-teal-500'
    },
    {
      title: 'Payroll Settings',
      description: 'Multi-country payroll configurations and statutory rates',
      icon: CogIcon,
      href: '/settings/payroll',
      color: 'bg-blue-600'
    },
    {
      title: 'Project',
      description: 'Manage projects for timesheet tracking and billing',
      icon: ClipboardDocumentListIcon,
      href: '/settings/projects',
      color: 'bg-yellow-500'
    },
    {
      title: 'Shift Management',
      description: 'Manage work shifts, timings, and overtime policies',
      icon: ClockIcon,
      href: '/settings/shifts',
      color: 'bg-pink-500'
    },
    {
      title: 'Calendar',
      description: 'Manage company calendar, events, and holidays',
      icon: CalendarIcon, // Already imported from Heroicons
      href: '/settings/calendar',
      color: 'bg-cyan-500'
    },
    {
      title: 'Calendar Management',
      description: 'Create and manage calendars with holiday schedules',
      icon: CalendarIcon,
      href: '/settings/calendars',
      color: 'bg-indigo-500'
    },
    {
      title: 'SQL Server Configs',
      description: 'Manage SQL Server database connection configurations',
      icon: ServerIcon,
      href: '/sql-server-configs',
      color: 'bg-gray-600'
    },
    {
      title: 'Import/Export',
      description: 'Import and export data for all settings tables',
      icon: ArrowUpTrayIcon,
      href: '/import-export',
      color: 'bg-violet-500'
    },
    {
      title: 'User Management',
      description: 'Manage system users, roles, and permissions',
      icon: UserIcon,
      href: '/users',
      color: 'bg-rose-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage system configurations and master data
          </p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsCategories.map((category) => (
          <Link
            key={category.title}
            to={category.href}
            className="group relative bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-primary-300"
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg ${category.color} text-white`}>
                <category.icon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {category.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {category.description}
                </p>
              </div>
            </div>
            
            {/* Arrow indicator */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
            <CogIcon className="h-4 w-4 mr-2" />
            System Settings
          </button>
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
            <UserIcon className="h-4 w-4 mr-2" />
            User Management
          </button>
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
            <BuildingOfficeIcon className="h-4 w-4 mr-2" />
            Company Info
          </button>
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
            <CurrencyDollarIcon className="h-4 w-4 mr-2" />
            Billing & Plans
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings; 
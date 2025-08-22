import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CurrencyDollarIcon,
  CogIcon,
  CalculatorIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ClockIcon,
  UserGroupIcon,
  BanknotesIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  GlobeAltIcon,
  FlagIcon,
  PencilIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { payrollAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const MultiCountryPayrollSettings = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState('IND');
  const [availableCountries, setAvailableCountries] = useState([]);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {},
    tax: {},
    deductions: {},
    allowances: {},
    compliance: {},
    airTicket: {},
    leave: {}
  });

  // Country configuration with flags and details
  const countryConfig = {
    IND: {
      name: 'India',
      flag: '🇮🇳',
      currency: 'INR',
      symbol: '₹',
      features: ['PF', 'ESI', 'Professional Tax', 'Gratuity']
    },
    UAE: {
      name: 'United Arab Emirates',
      flag: '🇦🇪',
      currency: 'AED',
      symbol: 'د.إ',
      features: ['GPSSA', 'EOSB', 'Air Ticket', 'WPS']
    },
    SAU: {
      name: 'Saudi Arabia',
      flag: '🇸🇦',
      currency: 'SAR',
      symbol: 'ر.س',
      features: ['GOSI', 'EOSB', 'MUDAWALA', 'Air Ticket']
    },
    OMN: {
      name: 'Oman',
      flag: '🇴🇲',
      currency: 'OMR',
      symbol: 'ر.ع.',
      features: ['PASI', 'EOSB', 'Air Ticket', 'WPS']
    },
    BHR: {
      name: 'Bahrain',
      flag: '🇧🇭',
      currency: 'BHD',
      symbol: 'د.ب',
      features: ['GOSI', 'EOSB', 'Air Ticket', 'LMRA']
    },
    QAT: {
      name: 'Qatar',
      flag: '🇶🇦',
      currency: 'QAR',
      symbol: 'ر.ق',
      features: ['EOSB', 'Air Ticket', 'ADLSA']
    },
    EGY: {
      name: 'Egypt',
      flag: '🇪🇬',
      currency: 'EGP',
      symbol: '£',
      features: ['Social Insurance', 'EOSB']
    }
  };

  useEffect(() => {
    fetchAvailableCountries();
    fetchPayrollSettings();
  }, [selectedCountry]);

  const fetchAvailableCountries = async () => {
    try {
      setAvailableCountries(Object.keys(countryConfig));
    } catch (error) {
      console.error('Error fetching countries:', error);
      toast.error('Failed to load countries');
    }
  };

  const fetchPayrollSettings = async () => {
    try {
      setLoading(true);
      const response = await payrollAPI.getSettings();
      
      if (selectedCountry !== 'IND') {
        const countryResponse = await payrollAPI.getCountrySettings?.(selectedCountry) || response;
        setSettings(countryResponse);
      } else {
        setSettings(response);
      }
    } catch (error) {
      console.error('Error fetching payroll settings:', error);
      toast.error('Failed to load payroll settings');
      // Set some default values so forms still work
      setSettings({
        general: {
          currency: countryConfig[selectedCountry]?.currency || 'USD',
          payFrequency: 'MONTHLY',
          payDay: 25,
          workingDaysPerWeek: selectedCountry === 'IND' ? 5 : 6,
          workingHoursPerDay: 8,
          overtimeEnabled: true,
          overtimeRate: selectedCountry === 'IND' ? 2.0 : 1.5,
          holidayPayEnabled: true,
          holidayPayRate: selectedCountry === 'IND' ? 2.0 : 1.5
        },
        tax: {},
        deductions: {},
        allowances: {},
        compliance: {},
        airTicket: {},
        leave: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (countryCode) => {
    setSelectedCountry(countryCode);
    setActiveTab('general');
  };

  const handleSaveSettings = async (section, sectionData) => {
    try {
      await payrollAPI.updateSettings(section, sectionData);
      toast.success(`${section} settings updated successfully`);
      await fetchPayrollSettings();
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const tabs = [
    { id: 'general', name: 'General', icon: CogIcon },
    { id: 'deductions', name: 'Statutory', icon: CalculatorIcon },
    { id: 'allowances', name: 'Allowances', icon: BanknotesIcon },
    { id: 'compliance', name: 'Compliance', icon: ShieldCheckIcon },
    { id: 'airTicket', name: 'Air Ticket', icon: GlobeAltIcon },
    { id: 'leave', name: 'Leave', icon: ClockIcon }
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Link to="/settings" className="text-gray-500 hover:text-gray-700">
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Multi-Country Payroll Settings</h1>
          </div>
          <p className="mt-2 text-sm text-gray-700">
            Configure payroll settings for different countries with statutory compliance
          </p>
        </div>
      </div>

      {/* Country Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-4 mb-6">
          <GlobeAltIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-medium text-gray-900">Select Country</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {availableCountries.map((countryCode) => {
            const country = countryConfig[countryCode];
            const isSelected = selectedCountry === countryCode;
            
            return (
              <button
                key={countryCode}
                onClick={() => handleCountryChange(countryCode)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="text-center space-y-2">
                  <div className="text-3xl">{country.flag}</div>
                  <div className="text-sm font-medium text-gray-900">{country.name}</div>
                  <div className="text-xs text-gray-500">{country.currency}</div>
                  {isSelected && (
                    <div className="flex flex-wrap gap-1 justify-center">
                      {country.features.slice(0, 2).map((feature, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Country Info */}
        {selectedCountry && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{countryConfig[selectedCountry].flag}</span>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {countryConfig[selectedCountry].name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Currency: {countryConfig[selectedCountry].currency} ({countryConfig[selectedCountry].symbol})
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {countryConfig[selectedCountry].features.map((feature, index) => (
                  <span key={index} className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Tabs and Content */}
      <div className="bg-white shadow rounded-lg">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'general' && (
            <GeneralSettings 
              settings={settings.general || {}} 
              country={selectedCountry}
              countryConfig={countryConfig[selectedCountry]}
              onSave={(data) => handleSaveSettings('general', data)}
            />
          )}
          
          {activeTab === 'deductions' && (
            <StatutorySettings 
              settings={settings.deductions || {}} 
              country={selectedCountry}
              countryConfig={countryConfig[selectedCountry]}
              onSave={(data) => handleSaveSettings('deductions', data)}
            />
          )}
          
          {activeTab === 'allowances' && (
            <AllowanceSettings 
              settings={settings.allowances || {}} 
              country={selectedCountry}
              countryConfig={countryConfig[selectedCountry]}
              onSave={(data) => handleSaveSettings('allowances', data)}
            />
          )}
          
          {activeTab === 'compliance' && (
            <ComplianceSettings 
              settings={settings.compliance || {}} 
              country={selectedCountry}
              countryConfig={countryConfig[selectedCountry]}
              onSave={(data) => handleSaveSettings('compliance', data)}
            />
          )}
          
          {activeTab === 'airTicket' && (
            <AirTicketSettings 
              settings={settings.airTicket || {}} 
              country={selectedCountry}
              countryConfig={countryConfig[selectedCountry]}
              onSave={(data) => handleSaveSettings('airTicket', data)}
            />
          )}
          
          {activeTab === 'leave' && (
            <LeaveSettings 
              settings={settings.leave || {}} 
              country={selectedCountry}
              countryConfig={countryConfig[selectedCountry]}
              onSave={(data) => handleSaveSettings('leave', data)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// General Settings Component (keeping existing implementation)
const GeneralSettings = ({ settings, country, countryConfig, onSave }) => {
  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">General Payroll Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Currency</label>
            <input
              type="text"
              value={formData.currency || countryConfig.currency}
              onChange={(e) => setFormData({...formData, currency: e.target.value})}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              readOnly
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Pay Day</label>
            <input
              type="number"
              min="1"
              max="31"
              value={formData.payDay || 25}
              onChange={(e) => setFormData({...formData, payDay: parseInt(e.target.value)})}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Working Days Per Week</label>
            <select
              value={formData.workingDaysPerWeek || (country === 'IND' ? 5 : 6)}
              onChange={(e) => setFormData({...formData, workingDaysPerWeek: parseInt(e.target.value)})}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="5">5 Days</option>
              <option value="6">6 Days</option>
              <option value="7">7 Days</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Working Hours Per Day</label>
            <input
              type="number"
              min="1"
              max="24"
              value={formData.workingHoursPerDay || 8}
              onChange={(e) => setFormData({...formData, workingHoursPerDay: parseInt(e.target.value)})}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {['UAE', 'SAU', 'OMN', 'BHR', 'QAT', 'EGY'].includes(country) && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Ramadan Working Hours</label>
              <input
                type="number"
                min="1"
                max="12"
                value={formData.ramadanWorkingHours || 6}
                onChange={(e) => setFormData({...formData, ramadanWorkingHours: parseInt(e.target.value)})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Overtime Rate (%)</label>
            <input
              type="number"
              min="100"
              max="300"
              step="25"
              value={formData.overtimeRate ? formData.overtimeRate * 100 : (country === 'IND' ? 200 : 150)}
              onChange={(e) => setFormData({...formData, overtimeRate: parseInt(e.target.value) / 100})}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              {country === 'IND' ? 'India: 200% (Double time)' : 
               country === 'SAU' ? 'Saudi: 150%' : 
               'GCC Standard: 125%'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Save General Settings
        </button>
      </div>
    </form>
  );
};

// Statutory Settings Component (keeping existing implementation)
const StatutorySettings = ({ settings, country, countryConfig, onSave }) => {
  const getStatutoryInfo = () => {
    switch (country) {
      case 'IND':
        return {
          title: 'Indian Statutory Deductions',
          items: [
            { name: 'PF Employee Rate', value: '12%', description: 'Provident Fund employee contribution' },
            { name: 'PF Employer Rate', value: '12%', description: 'Provident Fund employer contribution' },
            { name: 'ESI Employee Rate', value: '0.75%', description: 'Employee State Insurance employee contribution' },
            { name: 'ESI Employer Rate', value: '3.25%', description: 'Employee State Insurance employer contribution' },
            { name: 'Professional Tax', value: '₹200', description: 'Monthly professional tax (varies by state)' }
          ]
        };
      case 'UAE':
        return {
          title: 'UAE Statutory Contributions',
          items: [
            { name: 'GPSSA Employee', value: '5%', description: 'For UAE nationals only' },
            { name: 'GPSSA Employer', value: '12.5%', description: 'For UAE nationals only' },
            { name: 'WPS Compliance', value: 'Mandatory', description: 'Wage Protection System' }
          ]
        };
      case 'SAU':
        return {
          title: 'Saudi Arabia GOSI',
          items: [
            { name: 'GOSI Saudi Employee', value: '10%', description: 'For Saudi nationals' },
            { name: 'GOSI Saudi Employer', value: '12%', description: 'For Saudi nationals' },
            { name: 'GOSI Expat Employee', value: '2%', description: 'For expatriates' },
            { name: 'GOSI Expat Employer', value: '2%', description: 'For expatriates' }
          ]
        };
      case 'OMN':
        return {
          title: 'Oman PASI',
          items: [
            { name: 'PASI Employee', value: '7%', description: 'For Omani nationals only' },
            { name: 'PASI Employer', value: '10.5%', description: 'For Omani nationals only' }
          ]
        };
      case 'BHR':
        return {
          title: 'Bahrain GOSI',
          items: [
            { name: 'GOSI Employee', value: '6%', description: 'For Bahraini nationals only' },
            { name: 'GOSI Employer', value: '12%', description: 'For Bahraini nationals only' }
          ]
        };
      case 'QAT':
        return {
          title: 'Qatar Social Security',
          items: [
            { name: 'No mandatory contributions', value: 'N/A', description: 'For expatriate employees' }
          ]
        };
      case 'EGY':
        return {
          title: 'Egypt Social Insurance',
          items: [
            { name: 'Social Insurance Employee', value: '14%', description: 'For all employees' },
            { name: 'Social Insurance Employer', value: '26%', description: 'For all employees' }
          ]
        };
      default:
        return { title: 'Statutory Settings', items: [] };
    }
  };

  const statutoryInfo = getStatutoryInfo();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">{statutoryInfo.title}</h3>
        <p className="text-sm text-gray-600 mb-6">
          These are government-mandated rates and cannot be modified. They are automatically applied based on employee nationality and country.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="space-y-4">
            {statutoryInfo.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
                <div>
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-sm text-gray-500">{item.description}</div>
                </div>
                <div className="text-lg font-semibold text-blue-600">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Automatic Calculation</h4>
              <p className="text-sm text-blue-700 mt-1">
                These statutory rates are automatically calculated during payroll processing based on employee details and cannot be overridden manually.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Complete Allowance Settings Component
const AllowanceSettings = ({ settings, country, countryConfig, onSave }) => {
  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const getAllowanceConfig = () => {
    switch (country) {
      case 'IND':
        return {
          title: 'Indian Allowances',
          allowances: [
            { key: 'hra', name: 'House Rent Allowance (HRA)', defaultValue: 40, isPercentage: true, description: 'Percentage of basic salary' },
            { key: 'conveyance', name: 'Conveyance Allowance', defaultValue: 1600, isPercentage: false, description: 'Monthly transport allowance' },
            { key: 'medical', name: 'Medical Allowance', defaultValue: 1250, isPercentage: false, description: 'Monthly medical allowance' },
            { key: 'lta', name: 'Leave Travel Allowance (LTA)', defaultValue: 15000, isPercentage: false, description: 'Annual travel allowance' },
            { key: 'specialAllowance', name: 'Special Allowance', defaultValue: 20, isPercentage: true, description: 'Additional allowance percentage' }
          ]
        };
      case 'UAE':
        return {
          title: 'UAE Allowances',
          allowances: [
            { key: 'housing', name: 'Housing Allowance', defaultValue: 25, isPercentage: true, description: 'Percentage of basic salary' },
            { key: 'transport', name: 'Transport Allowance', defaultValue: 1000, isPercentage: false, description: 'Monthly transport in AED' },
            { key: 'phone', name: 'Phone Allowance', defaultValue: 200, isPercentage: false, description: 'Monthly phone allowance' },
            { key: 'education', name: 'Education Allowance', defaultValue: 5000, isPercentage: false, description: 'Annual education allowance for children' },
            { key: 'furniture', name: 'Furniture Allowance', defaultValue: 3000, isPercentage: false, description: 'Annual furniture allowance' }
          ]
        };
      case 'SAU':
        return {
          title: 'Saudi Arabia Allowances',
          allowances: [
            { key: 'housing', name: 'Housing Allowance', defaultValue: 25, isPercentage: true, description: 'Percentage of basic salary' },
            { key: 'transport', name: 'Transport Allowance', defaultValue: 500, isPercentage: false, description: 'Monthly transport in SAR' },
            { key: 'family', name: 'Family Allowance', defaultValue: 500, isPercentage: false, description: 'Monthly family allowance' },
            { key: 'education', name: 'Education Allowance', defaultValue: 8000, isPercentage: false, description: 'Annual education allowance' },
            { key: 'hardship', name: 'Hardship Allowance', defaultValue: 10, isPercentage: true, description: 'For remote locations' }
          ]
        };
      case 'OMN':
        return {
          title: 'Oman Allowances',
          allowances: [
            { key: 'housing', name: 'Housing Allowance', defaultValue: 30, isPercentage: true, description: 'Percentage of basic salary' },
            { key: 'transport', name: 'Transport Allowance', defaultValue: 100, isPercentage: false, description: 'Monthly transport in OMR' },
            { key: 'phone', name: 'Phone Allowance', defaultValue: 25, isPercentage: false, description: 'Monthly communication allowance' },
            { key: 'education', name: 'Education Allowance', defaultValue: 1500, isPercentage: false, description: 'Annual education allowance' }
          ]
        };
      case 'BHR':
        return {
          title: 'Bahrain Allowances',
          allowances: [
            { key: 'housing', name: 'Housing Allowance', defaultValue: 25, isPercentage: true, description: 'Percentage of basic salary' },
            { key: 'transport', name: 'Transport Allowance', defaultValue: 50, isPercentage: false, description: 'Monthly transport in BHD' },
            { key: 'family', name: 'Family Allowance', defaultValue: 50, isPercentage: false, description: 'Monthly family allowance' },
            { key: 'education', name: 'Education Allowance', defaultValue: 1000, isPercentage: false, description: 'Annual education allowance' }
          ]
        };
      case 'QAT':
        return {
          title: 'Qatar Allowances',
          allowances: [
            { key: 'housing', name: 'Housing Allowance', defaultValue: 30, isPercentage: true, description: 'Percentage of basic salary' },
            { key: 'transport', name: 'Transport Allowance', defaultValue: 800, isPercentage: false, description: 'Monthly transport in QAR' },
            { key: 'education', name: 'Education Allowance', defaultValue: 10000, isPercentage: false, description: 'Annual education allowance' },
            { key: 'utilities', name: 'Utilities Allowance', defaultValue: 500, isPercentage: false, description: 'Monthly utilities allowance' }
          ]
        };
      case 'EGY':
        return {
          title: 'Egypt Allowances',
          allowances: [
            { key: 'transport', name: 'Transport Allowance', defaultValue: 200, isPercentage: false, description: 'Monthly transport in EGP' },
            { key: 'meal', name: 'Meal Allowance', defaultValue: 150, isPercentage: false, description: 'Monthly meal allowance' },
            { key: 'social', name: 'Social Allowance', defaultValue: 10, isPercentage: true, description: 'Social allowance percentage' },
            { key: 'variable', name: 'Variable Allowance', defaultValue: 300, isPercentage: false, description: 'Monthly variable allowance' }
          ]
        };
      default:
        return { title: 'Allowances', allowances: [] };
    }
  };

  const config = getAllowanceConfig();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">{config.title}</h3>
          <div className="flex items-center space-x-2">
            <PencilIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">Editable</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-6">
          Configure standard allowances for {countryConfig.name}. These will be used as defaults when creating employee compensation packages.
        </p>
        
        <div className="space-y-6">
          {config.allowances.map((allowance) => (
            <div key={allowance.key} className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-gray-900">{allowance.name}</label>
                  <p className="text-xs text-gray-500 mt-1">{allowance.description}</p>
                </div>
                
                <div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step={allowance.isPercentage ? "0.01" : "1"}
                      value={formData[allowance.key] || allowance.defaultValue}
                      onChange={(e) => setFormData({...formData, [allowance.key]: parseFloat(e.target.value) || 0})}
                      className="block w-full pl-3 pr-12 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">
                        {allowance.isPercentage ? '%' : countryConfig.symbol}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    allowance.isPercentage 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {allowance.isPercentage ? 'Percentage of Basic' : 'Fixed Amount'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Allowance Calculation</h4>
              <p className="text-sm text-blue-700 mt-1">
                Percentage-based allowances are calculated based on the basic salary. Fixed allowances are added as flat amounts to the total compensation.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Save Allowance Settings
        </button>
      </div>
    </form>
  );
};

// Complete Compliance Settings Component
const ComplianceSettings = ({ settings, country, countryConfig, onSave }) => {
  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const getComplianceConfig = () => {
    switch (country) {
      case 'IND':
        return {
          title: 'Indian Compliance Requirements',
          items: [
            { type: 'info', title: 'PF Compliance', description: 'Provident Fund compliance with EPFO regulations', status: 'mandatory' },
            { type: 'info', title: 'ESI Compliance', description: 'Employee State Insurance compliance', status: 'mandatory' },
            { type: 'toggle', key: 'ptEnabled', title: 'Professional Tax', description: 'Enable state-wise professional tax deduction' },
            { type: 'toggle', key: 'tdsEnabled', title: 'TDS Deduction', description: 'Enable tax deduction at source' },
            { type: 'info', title: 'Form 16 Generation', description: 'Annual tax certificate generation', status: 'required' }
          ]
        };
      case 'UAE':
        return {
          title: 'UAE Compliance Requirements',
          items: [
            { type: 'info', title: 'WPS Compliance', description: 'Wage Protection System - mandatory for all companies', status: 'mandatory' },
            { type: 'toggle', key: 'wpsEnabled', title: 'WPS File Generation', description: 'Generate WPS files for bank submission' },
            { type: 'select', key: 'wpsBank', title: 'WPS Bank', description: 'Select primary bank for WPS', options: ['ADCB', 'Emirates NBD', 'FAB', 'HSBC', 'CBD'] },
            { type: 'info', title: 'MOL Compliance', description: 'Ministry of Labour reporting requirements', status: 'mandatory' },
            { type: 'toggle', key: 'eosEnabled', title: 'EOSB Calculation', description: 'End of Service Benefits calculation' }
          ]
        };
      case 'SAU':
        return {
          title: 'Saudi Arabia Compliance Requirements',
          items: [
            { type: 'info', title: 'GOSI Compliance', description: 'General Organization for Social Insurance', status: 'mandatory' },
            { type: 'toggle', key: 'mudawalaEnabled', title: 'MUDAWALA Integration', description: 'Ministry of Human Resources reporting' },
            { type: 'toggle', key: 'wpsEnabled', title: 'SARIE Integration', description: 'Saudi Arabian Riyal Interbank Express' },
            { type: 'info', title: 'Labor Law Compliance', description: 'Saudi Labor Law compliance requirements', status: 'mandatory' },
            { type: 'toggle', key: 'saudiization', title: 'Saudiization Tracking', description: 'Track Saudi vs expat employee ratios' }
          ]
        };
      case 'OMN':
        return {
          title: 'Oman Compliance Requirements',
          items: [
            { type: 'info', title: 'PASI Compliance', description: 'Public Authority for Social Insurance', status: 'mandatory' },
            { type: 'toggle', key: 'wpsEnabled', title: 'WPS Compliance', description: 'Wage Protection System for Oman' },
            { type: 'info', title: 'MOL Reporting', description: 'Ministry of Labour compliance', status: 'mandatory' },
            { type: 'toggle', key: 'eosEnabled', title: 'EOSB Calculation', description: 'End of Service Benefits calculation' }
          ]
        };
      case 'BHR':
        return {
          title: 'Bahrain Compliance Requirements',
          items: [
            { type: 'info', title: 'GOSI Compliance', description: 'General Organization for Social Insurance', status: 'mandatory' },
            { type: 'toggle', key: 'lmraEnabled', title: 'LMRA Compliance', description: 'Labour Market Regulatory Authority' },
            { type: 'info', title: 'WPS Compliance', description: 'Wage Protection System', status: 'mandatory' },
            { type: 'toggle', key: 'eosEnabled', title: 'EOSB Calculation', description: 'End of Service Benefits calculation' }
          ]
        };
      case 'QAT':
        return {
          title: 'Qatar Compliance Requirements',
          items: [
            { type: 'toggle', key: 'adlsaEnabled', title: 'ADLSA Integration', description: 'Administrative Development, Labour and Social Affairs' },
            { type: 'info', title: 'WPS Compliance', description: 'Wage Protection System', status: 'mandatory' },
            { type: 'toggle', key: 'eosEnabled', title: 'EOSB Calculation', description: 'End of Service Benefits calculation' },
            { type: 'info', title: 'Labor Law Compliance', description: 'Qatar Labor Law No. 14 of 2004', status: 'mandatory' }
          ]
        };
      case 'EGY':
        return {
          title: 'Egypt Compliance Requirements',
          items: [
            { type: 'info', title: 'Social Insurance', description: 'Egyptian Social Insurance compliance', status: 'mandatory' },
            { type: 'toggle', key: 'taxEnabled', title: 'Income Tax', description: 'Egyptian income tax deduction' },
            { type: 'info', title: 'Labor Law Compliance', description: 'Egyptian Labor Law No. 12 of 2003', status: 'mandatory' },
            { type: 'toggle', key: 'eosEnabled', title: 'EOSB Calculation', description: 'End of Service Benefits calculation' }
          ]
        };
      default:
        return { title: 'Compliance Requirements', items: [] };
    }
  };

  const config = getComplianceConfig();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">{config.title}</h3>
          <div className="flex items-center space-x-2">
            <PencilIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">Configurable</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-6">
          Configure compliance settings and reporting requirements for {countryConfig.name}.
        </p>
        
        <div className="space-y-4">
          {config.items.map((item, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                    {item.status && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.status === 'mandatory' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {item.status}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                </div>
                
                <div className="ml-4">
                  {item.type === 'toggle' && (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData[item.key] || false}
                        onChange={(e) => setFormData({...formData, [item.key]: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  )}
                  
                  {item.type === 'select' && (
                    <select
                      value={formData[item.key] || ''}
                      onChange={(e) => setFormData({...formData, [item.key]: e.target.value})}
                      className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select {item.title}</option>
                      {item.options?.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  )}
                  
                  {item.type === 'info' && (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900">Compliance Notice</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Mandatory compliance items are automatically enforced by the system. Ensure all required settings are properly configured to avoid legal issues.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Save Compliance Settings
        </button>
      </div>
    </form>
  );
};

// Complete Air Ticket Settings Component
const AirTicketSettings = ({ settings, country, countryConfig, onSave }) => {
  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const isGCCCountry = ['UAE', 'SAU', 'OMN', 'BHR', 'QAT'].includes(country);

  if (!isGCCCountry) {
    return (
      <div className="text-center py-12">
        <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Air Ticket Allowance Not Applicable</h3>
        <p className="mt-1 text-sm text-gray-500">
          Air ticket allowance is typically provided in GCC countries only.
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Selected country: {countryConfig.name}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Air Ticket Allowance Configuration</h3>
          <div className="flex items-center space-x-2">
            <PencilIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">Editable</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-6">
          Configure air ticket allowance policies for {countryConfig.name}. Tickets are typically provided once every two years with monthly accrual.
        </p>
        
        <div className="space-y-6">
          {/* Air Ticket Policy */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-4">Air Ticket Policy</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Frequency (Years)</label>
                <select
                  value={formData.ticketFrequency || '2'}
                  onChange={(e) => setFormData({...formData, ticketFrequency: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="1">Annual</option>
                  <option value="2">Biennial (Every 2 Years)</option>
                  <option value="3">Every 3 Years</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Accrual Method</label>
                <select
                  value={formData.accrualMethod || 'monthly'}
                  onChange={(e) => setFormData({...formData, accrualMethod: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="monthly">Monthly Accrual</option>
                  <option value="quarterly">Quarterly Accrual</option>
                  <option value="annual">Annual Allocation</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ticket Classes and Amounts */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-4">Ticket Classes and Amounts ({countryConfig.symbol})</h4>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Economy Class</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.economyAmount || (country === 'UAE' ? 2500 : country === 'SAU' ? 2000 : country === 'OMN' ? 300 : country === 'BHR' ? 250 : 1800)}
                    onChange={(e) => setFormData({...formData, economyAmount: parseFloat(e.target.value)})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Class</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.businessAmount || (formData.economyAmount || 2500) * 2}
                    onChange={(e) => setFormData({...formData, businessAmount: parseFloat(e.target.value)})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Class</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.firstAmount || (formData.economyAmount || 2500) * 3}
                    onChange={(e) => setFormData({...formData, firstAmount: parseFloat(e.target.value)})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Eligibility Rules */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-4">Eligibility Rules</h4>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="expatsOnly"
                  checked={formData.expatsOnly || false}
                  onChange={(e) => setFormData({...formData, expatsOnly: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="expatsOnly" className="text-sm text-gray-900">
                  Expatriates only (exclude nationals)
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Minimum Service (Months)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minServiceMonths || 12}
                    onChange={(e) => setFormData({...formData, minServiceMonths: parseInt(e.target.value)})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Family Members Included</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.familyMembersIncluded || 4}
                    onChange={(e) => setFormData({...formData, familyMembersIncluded: parseInt(e.target.value)})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Calculation Preview */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h4 className="font-medium text-blue-900 mb-4">Calculation Preview</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-blue-700">Economy Class</div>
                <div className="font-semibold text-blue-900">
                  {countryConfig.symbol}{formData.economyAmount || (country === 'UAE' ? 2500 : 2000)} per cycle
                </div>
                <div className="text-blue-600">
                  {countryConfig.symbol}{Math.round((formData.economyAmount || 2500) / (parseInt(formData.ticketFrequency || '2') * 12))} monthly accrual
                </div>
              </div>
              
              <div>
                <div className="text-blue-700">Business Class</div>
                <div className="font-semibold text-blue-900">
                  {countryConfig.symbol}{formData.businessAmount || (formData.economyAmount || 2500) * 2} per cycle
                </div>
                <div className="text-blue-600">
                  {countryConfig.symbol}{Math.round((formData.businessAmount || (formData.economyAmount || 2500) * 2) / (parseInt(formData.ticketFrequency || '2') * 12))} monthly accrual
                </div>
              </div>
              
              <div>
                <div className="text-blue-700">First Class</div>
                <div className="font-semibold text-blue-900">
                  {countryConfig.symbol}{formData.firstAmount || (formData.economyAmount || 2500) * 3} per cycle
                </div>
                <div className="text-blue-600">
                  {countryConfig.symbol}{Math.round((formData.firstAmount || (formData.economyAmount || 2500) * 3) / (parseInt(formData.ticketFrequency || '2') * 12))} monthly accrual
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900">FIFO Utilization System</h4>
              <p className="text-sm text-green-700 mt-1">
                The system automatically tracks air ticket accruals using First-In-First-Out (FIFO) method. Employees can utilize accrued amounts when available, and unused amounts expire after the cycle period.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Save Air Ticket Settings
        </button>
      </div>
    </form>
  );
};

// Complete Leave Settings Component
const LeaveSettings = ({ settings, country, countryConfig, onSave }) => {
  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const getLeaveConfig = () => {
    switch (country) {
      case 'IND':
        return {
          title: 'Indian Leave Policies',
          policies: [
            { key: 'annual', name: 'Annual Leave', days: 21, carryForward: true, description: 'Annual vacation leave as per Factories Act' },
            { key: 'casual', name: 'Casual Leave', days: 12, carryForward: false, description: 'Casual leave for personal needs' },
            { key: 'sick', name: 'Sick Leave', days: 12, carryForward: true, description: 'Medical leave with certificate' },
            { key: 'maternity', name: 'Maternity Leave', days: 180, carryForward: false, description: 'Maternity leave as per law' },
            { key: 'paternity', name: 'Paternity Leave', days: 15, carryForward: false, description: 'Paternity leave for fathers' }
          ]
        };
      case 'UAE':
        return {
          title: 'UAE Leave Policies',
          policies: [
            { key: 'annual', name: 'Annual Leave', days: 30, carryForward: true, description: '30 days per year, pro-rated for first year' },
            { key: 'sick', name: 'Sick Leave', days: 90, carryForward: false, description: '90 days per year (45 full pay, 45 half pay)' },
            { key: 'maternity', name: 'Maternity Leave', days: 60, carryForward: false, description: '60 days full pay maternity leave' },
            { key: 'paternity', name: 'Paternity Leave', days: 5, carryForward: false, description: '5 days paternity leave' },
            { key: 'hajj', name: 'Hajj Leave', days: 30, carryForward: false, description: 'Unpaid Hajj leave (once in service)' }
          ]
        };
      case 'SAU':
        return {
          title: 'Saudi Arabia Leave Policies',
          policies: [
            { key: 'annual', name: 'Annual Leave', days: 21, carryForward: true, description: '21 days minimum, increases with service' },
            { key: 'sick', name: 'Sick Leave', days: 120, carryForward: false, description: '120 days per year (30 full, 60 three-quarters, 30 half)' },
            { key: 'maternity', name: 'Maternity Leave', days: 70, carryForward: false, description: '10 weeks maternity leave' },
            { key: 'paternity', name: 'Paternity Leave', days: 3, carryForward: false, description: '3 days paternity leave' },
            { key: 'hajj', name: 'Hajj Leave', days: 10, carryForward: false, description: 'Paid Hajj leave for Saudis' }
          ]
        };
      case 'OMN':
        return {
          title: 'Oman Leave Policies',
          policies: [
            { key: 'annual', name: 'Annual Leave', days: 30, carryForward: true, description: '30 days annual leave' },
            { key: 'sick', name: 'Sick Leave', days: 45, carryForward: false, description: '45 days sick leave per year' },
            { key: 'maternity', name: 'Maternity Leave', days: 50, carryForward: false, description: '50 days maternity leave' },
            { key: 'paternity', name: 'Paternity Leave', days: 3, carryForward: false, description: '3 days paternity leave' },
            { key: 'study', name: 'Study Leave', days: 10, carryForward: false, description: 'Study leave for examinations' }
          ]
        };
      case 'BHR':
        return {
          title: 'Bahrain Leave Policies',
          policies: [
            { key: 'annual', name: 'Annual Leave', days: 30, carryForward: true, description: '30 days annual leave' },
            { key: 'sick', name: 'Sick Leave', days: 45, carryForward: false, description: '45 days sick leave' },
            { key: 'maternity', name: 'Maternity Leave', days: 60, carryForward: false, description: '60 days maternity leave' },
            { key: 'paternity', name: 'Paternity Leave', days: 1, carryForward: false, description: '1 day paternity leave' },
            { key: 'hajj', name: 'Hajj Leave', days: 15, carryForward: false, description: 'Hajj leave for Muslims' }
          ]
        };
      case 'QAT':
        return {
          title: 'Qatar Leave Policies',
          policies: [
            { key: 'annual', name: 'Annual Leave', days: 21, carryForward: true, description: '21 days minimum annual leave' },
            { key: 'sick', name: 'Sick Leave', days: 45, carryForward: false, description: '45 days sick leave' },
            { key: 'maternity', name: 'Maternity Leave', days: 50, carryForward: false, description: '50 days maternity leave' },
            { key: 'paternity', name: 'Paternity Leave', days: 3, carryForward: false, description: '3 days paternity leave' },
            { key: 'hajj', name: 'Hajj Leave', days: 30, carryForward: false, description: 'Unpaid Hajj leave' }
          ]
        };
      case 'EGY':
        return {
          title: 'Egypt Leave Policies',
          policies: [
            { key: 'annual', name: 'Annual Leave', days: 21, carryForward: true, description: '21 days annual leave' },
            { key: 'sick', name: 'Sick Leave', days: 180, carryForward: false, description: '180 days sick leave per year' },
            { key: 'maternity', name: 'Maternity Leave', days: 90, carryForward: false, description: '90 days maternity leave' },
            { key: 'paternity', name: 'Paternity Leave', days: 3, carryForward: false, description: '3 days paternity leave' },
            { key: 'study', name: 'Study Leave', days: 15, carryForward: false, description: 'Study leave for education' }
          ]
        };
      default:
        return { title: 'Leave Policies', policies: [] };
    }
  };

  const config = getLeaveConfig();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">{config.title}</h3>
          <div className="flex items-center space-x-2">
            <PencilIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">Editable</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-6">
          Configure leave policies and entitlements for {countryConfig.name}. These settings define the standard leave allocations for employees.
        </p>
        
        <div className="space-y-4">
          {config.policies.map((policy) => (
            <div key={policy.key} className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div>
                  <h4 className="font-medium text-gray-900">{policy.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{policy.description}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Days per Year</label>
                  <input
                    type="number"
                    min="0"
                    value={formData[`${policy.key}Days`] || policy.days}
                    onChange={(e) => setFormData({...formData, [`${policy.key}Days`]: parseInt(e.target.value)})}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Carry Forward</label>
                  <select
                    value={formData[`${policy.key}CarryForward`] !== undefined ? formData[`${policy.key}CarryForward`] : policy.carryForward}
                    onChange={(e) => setFormData({...formData, [`${policy.key}CarryForward`]: e.target.value === 'true'})}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="true">Allowed</option>
                    <option value="false">Not Allowed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max Carry Forward</label>
                  <input
                    type="number"
                    min="0"
                    value={formData[`${policy.key}MaxCarryForward`] || Math.min(policy.days, 15)}
                    onChange={(e) => setFormData({...formData, [`${policy.key}MaxCarryForward`]: parseInt(e.target.value)})}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    disabled={!(formData[`${policy.key}CarryForward`] !== undefined ? formData[`${policy.key}CarryForward`] : policy.carryForward)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Leave Accrual</h4>
              <p className="text-sm text-blue-700 mt-1">
                Leave is typically accrued monthly based on the annual entitlement. Special leaves like Hajj and maternity are allocated as needed based on eligibility.
              </p>
            </div>
          </div>
        </div>

        {/* Public Holidays Configuration */}
        <div className="bg-gray-50 rounded-lg p-6 mt-6">
          <h4 className="font-medium text-gray-900 mb-4">Public Holidays Configuration</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Annual Public Holidays</label>
              <input
                type="number"
                min="0"
                max="30"
                value={formData.publicHolidays || (country === 'IND' ? 15 : country === 'SAU' ? 10 : 12)}
                onChange={(e) => setFormData({...formData, publicHolidays: parseInt(e.target.value)})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Holiday Pay Policy</label>
              <select
                value={formData.holidayPayPolicy || 'paid'}
                onChange={(e) => setFormData({...formData, holidayPayPolicy: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="paid">Paid Holiday</option>
                <option value="unpaid">Unpaid Holiday</option>
                <option value="compensatory">Compensatory Off</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Save Leave Settings
        </button>
      </div>
    </form>
  );
};

export default MultiCountryPayrollSettings;

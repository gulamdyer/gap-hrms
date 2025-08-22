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
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { payrollAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const PayrollSettings = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      currency: 'INR',
      payFrequency: 'MONTHLY',
      payDay: 25,
      workingDaysPerWeek: 5,
      workingHoursPerDay: 8,
      overtimeEnabled: true,
      overtimeRate: 1.5,
      holidayPayEnabled: true,
      holidayPayRate: 2.0
    },
    tax: {
      taxYear: new Date().getFullYear(),
      taxCalculationMethod: 'SLAB_BASED',
      basicExemption: 250000,
      standardDeduction: 50000,
      tdsEnabled: true,
      tdsThreshold: 250000,
      surchargeEnabled: false,
      surchargeRate: 0,
      educationCess: 4
    },
    deductions: {
      pfEnabled: true,
      pfEmployeeRate: 12,
      pfEmployerRate: 12,
      pfMaxWage: 15000,
      esiEnabled: false,
      esiEmployeeRate: 0.75,
      esiEmployerRate: 3.25,
      esiMaxWage: 21000,
      professionalTaxEnabled: true,
      professionalTaxAmount: 200
    },
    allowances: {
      hraEnabled: true,
      hraExemptionMethod: 'ACTUAL_RENT',
      conveyanceAllowance: 1600,
      medicalAllowance: 15000,
      ltaEnabled: true,
      ltaExemptionLimit: 80000,
      specialAllowanceEnabled: true
    },
    compliance: {
      pfNumber: '',
      esiNumber: '',
      tanNumber: '',
      panNumber: '',
      gstNumber: '',
      companyName: '',
      companyAddress: '',
      complianceReportingEnabled: true,
      autoCalculationEnabled: true
    }
  });

  const tabs = [
    { id: 'general', name: 'General Settings', icon: CogIcon },
    { id: 'tax', name: 'Tax Configuration', icon: CalculatorIcon },
    { id: 'deductions', name: 'Deductions', icon: ShieldCheckIcon },
    { id: 'allowances', name: 'Allowances', icon: BanknotesIcon },
    { id: 'compliance', name: 'Compliance', icon: DocumentTextIcon }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await payrollAPI.getSettings();
      if (data && Object.keys(data).length) {
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error fetching payroll settings:', error);
      toast.error('Failed to fetch payroll settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (section) => {
    try {
      await payrollAPI.updateSettings(section, settings[section]);
      toast.success(`${tabs.find(tab => tab.id === section)?.name} updated successfully`);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            value={settings.general.currency}
            onChange={(e) => handleInputChange('general', 'currency', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="INR">Indian Rupee (₹)</option>
            <option value="USD">US Dollar ($)</option>
            <option value="EUR">Euro (€)</option>
            <option value="GBP">British Pound (£)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pay Frequency
          </label>
          <select
            value={settings.general.payFrequency}
            onChange={(e) => handleInputChange('general', 'payFrequency', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="WEEKLY">Weekly</option>
            <option value="BI_WEEKLY">Bi-Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pay Day (Day of month)
          </label>
          <input
            type="number"
            min="1"
            max="31"
            value={settings.general.payDay}
            onChange={(e) => handleInputChange('general', 'payDay', parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Working Days Per Week
          </label>
          <input
            type="number"
            min="1"
            max="7"
            value={settings.general.workingDaysPerWeek}
            onChange={(e) => handleInputChange('general', 'workingDaysPerWeek', parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Working Hours Per Day
          </label>
          <input
            type="number"
            min="1"
            max="24"
            value={settings.general.workingHoursPerDay}
            onChange={(e) => handleInputChange('general', 'workingHoursPerDay', parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Overtime Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="overtimeEnabled"
              checked={settings.general.overtimeEnabled}
              onChange={(e) => handleInputChange('general', 'overtimeEnabled', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="overtimeEnabled" className="ml-2 block text-sm text-gray-900">
              Enable Overtime
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overtime Rate (Multiplier)
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              value={settings.general.overtimeRate}
              onChange={(e) => handleInputChange('general', 'overtimeRate', parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Holiday Pay Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="holidayPayEnabled"
              checked={settings.general.holidayPayEnabled}
              onChange={(e) => handleInputChange('general', 'holidayPayEnabled', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="holidayPayEnabled" className="ml-2 block text-sm text-gray-900">
              Enable Holiday Pay
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Holiday Pay Rate (Multiplier)
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              value={settings.general.holidayPayRate}
              onChange={(e) => handleInputChange('general', 'holidayPayRate', parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTaxSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tax Year
          </label>
          <input
            type="number"
            min="2020"
            max="2030"
            value={settings.tax.taxYear}
            onChange={(e) => handleInputChange('tax', 'taxYear', parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tax Calculation Method
          </label>
          <select
            value={settings.tax.taxCalculationMethod}
            onChange={(e) => handleInputChange('tax', 'taxCalculationMethod', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="SLAB_BASED">Slab Based</option>
            <option value="FLAT_RATE">Flat Rate</option>
            <option value="PROGRESSIVE">Progressive</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Basic Exemption (₹)
          </label>
          <input
            type="number"
            value={settings.tax.basicExemption}
            onChange={(e) => handleInputChange('tax', 'basicExemption', parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Standard Deduction (₹)
          </label>
          <input
            type="number"
            value={settings.tax.standardDeduction}
            onChange={(e) => handleInputChange('tax', 'standardDeduction', parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">TDS Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="tdsEnabled"
              checked={settings.tax.tdsEnabled}
              onChange={(e) => handleInputChange('tax', 'tdsEnabled', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="tdsEnabled" className="ml-2 block text-sm text-gray-900">
              Enable TDS
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              TDS Threshold (₹)
            </label>
            <input
              type="number"
              value={settings.tax.tdsThreshold}
              onChange={(e) => handleInputChange('tax', 'tdsThreshold', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Additional Tax Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="surchargeEnabled"
              checked={settings.tax.surchargeEnabled}
              onChange={(e) => handleInputChange('tax', 'surchargeEnabled', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="surchargeEnabled" className="ml-2 block text-sm text-gray-900">
              Enable Surcharge
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Surcharge Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={settings.tax.surchargeRate}
              onChange={(e) => handleInputChange('tax', 'surchargeRate', parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Education Cess (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={settings.tax.educationCess}
              onChange={(e) => handleInputChange('tax', 'educationCess', parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDeductionsSettings = () => (
    <div className="space-y-6">
      <div className="border-b pb-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Provident Fund (PF)</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="pfEnabled"
              checked={settings.deductions.pfEnabled}
              onChange={(e) => handleInputChange('deductions', 'pfEnabled', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="pfEnabled" className="ml-2 block text-sm text-gray-900">
              Enable PF
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="12"
              value={settings.deductions.pfEmployeeRate}
              onChange={(e) => handleInputChange('deductions', 'pfEmployeeRate', parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employer Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="12"
              value={settings.deductions.pfEmployerRate}
              onChange={(e) => handleInputChange('deductions', 'pfEmployerRate', parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Wage (₹)
            </label>
            <input
              type="number"
              value={settings.deductions.pfMaxWage}
              onChange={(e) => handleInputChange('deductions', 'pfMaxWage', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      <div className="border-b pb-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Employee State Insurance (ESI)</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="esiEnabled"
              checked={settings.deductions.esiEnabled}
              onChange={(e) => handleInputChange('deductions', 'esiEnabled', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="esiEnabled" className="ml-2 block text-sm text-gray-900">
              Enable ESI
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee Rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={settings.deductions.esiEmployeeRate}
              onChange={(e) => handleInputChange('deductions', 'esiEmployeeRate', parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employer Rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="5"
              value={settings.deductions.esiEmployerRate}
              onChange={(e) => handleInputChange('deductions', 'esiEmployerRate', parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Wage (₹)
            </label>
            <input
              type="number"
              value={settings.deductions.esiMaxWage}
              onChange={(e) => handleInputChange('deductions', 'esiMaxWage', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Professional Tax</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="professionalTaxEnabled"
              checked={settings.deductions.professionalTaxEnabled}
              onChange={(e) => handleInputChange('deductions', 'professionalTaxEnabled', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="professionalTaxEnabled" className="ml-2 block text-sm text-gray-900">
              Enable Professional Tax
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (₹)
            </label>
            <input
              type="number"
              value={settings.deductions.professionalTaxAmount}
              onChange={(e) => handleInputChange('deductions', 'professionalTaxAmount', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAllowancesSettings = () => (
    <div className="space-y-6">
      <div className="border-b pb-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">House Rent Allowance (HRA)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hraEnabled"
              checked={settings.allowances.hraEnabled}
              onChange={(e) => handleInputChange('allowances', 'hraEnabled', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="hraEnabled" className="ml-2 block text-sm text-gray-900">
              Enable HRA
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exemption Method
            </label>
            <select
              value={settings.allowances.hraExemptionMethod}
              onChange={(e) => handleInputChange('allowances', 'hraExemptionMethod', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ACTUAL_RENT">Actual Rent Paid</option>
              <option value="STANDARD_RATE">Standard Rate</option>
              <option value="CUSTOM">Custom Calculation</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Conveyance Allowance (₹)
          </label>
          <input
            type="number"
            value={settings.allowances.conveyanceAllowance}
            onChange={(e) => handleInputChange('allowances', 'conveyanceAllowance', parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Medical Allowance (₹)
          </label>
          <input
            type="number"
            value={settings.allowances.medicalAllowance}
            onChange={(e) => handleInputChange('allowances', 'medicalAllowance', parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LTA Exemption Limit (₹)
          </label>
          <input
            type="number"
            value={settings.allowances.ltaExemptionLimit}
            onChange={(e) => handleInputChange('allowances', 'ltaExemptionLimit', parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="specialAllowanceEnabled"
            checked={settings.allowances.specialAllowanceEnabled}
            onChange={(e) => handleInputChange('allowances', 'specialAllowanceEnabled', e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="specialAllowanceEnabled" className="ml-2 block text-sm text-gray-900">
            Enable Special Allowance
          </label>
        </div>
      </div>
    </div>
  );

  const renderComplianceSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name
          </label>
          <input
            type="text"
            value={settings.compliance.companyName}
            onChange={(e) => handleInputChange('compliance', 'companyName', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PF Number
          </label>
          <input
            type="text"
            value={settings.compliance.pfNumber}
            onChange={(e) => handleInputChange('compliance', 'pfNumber', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ESI Number
          </label>
          <input
            type="text"
            value={settings.compliance.esiNumber}
            onChange={(e) => handleInputChange('compliance', 'esiNumber', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            TAN Number
          </label>
          <input
            type="text"
            value={settings.compliance.tanNumber}
            onChange={(e) => handleInputChange('compliance', 'tanNumber', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PAN Number
          </label>
          <input
            type="text"
            value={settings.compliance.panNumber}
            onChange={(e) => handleInputChange('compliance', 'panNumber', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GST Number
          </label>
          <input
            type="text"
            value={settings.compliance.gstNumber}
            onChange={(e) => handleInputChange('compliance', 'gstNumber', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Company Address
        </label>
        <textarea
          rows="3"
          value={settings.compliance.companyAddress}
          onChange={(e) => handleInputChange('compliance', 'companyAddress', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="border-t pt-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">System Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="complianceReportingEnabled"
              checked={settings.compliance.complianceReportingEnabled}
              onChange={(e) => handleInputChange('compliance', 'complianceReportingEnabled', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="complianceReportingEnabled" className="ml-2 block text-sm text-gray-900">
              Enable Compliance Reporting
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoCalculationEnabled"
              checked={settings.compliance.autoCalculationEnabled}
              onChange={(e) => handleInputChange('compliance', 'autoCalculationEnabled', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="autoCalculationEnabled" className="ml-2 block text-sm text-gray-900">
              Enable Auto Calculation
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'tax':
        return renderTaxSettings();
      case 'deductions':
        return renderDeductionsSettings();
      case 'allowances':
        return renderAllowancesSettings();
      case 'compliance':
        return renderComplianceSettings();
      default:
        return renderGeneralSettings();
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/payroll"
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Payroll
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payroll Settings</h1>
            <p className="text-gray-600">Configure payroll rules and calculations</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 inline mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg p-6">
        {renderTabContent()}

        {/* Save Button */}
        <div className="mt-8 pt-6 border-t">
          <div className="flex justify-end">
            <button
              onClick={() => handleSave(activeTab)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Save {tabs.find(tab => tab.id === activeTab)?.name}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollSettings; 
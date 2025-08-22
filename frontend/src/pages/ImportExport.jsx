import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  InformationCircleIcon,
  EyeIcon,
  TrashIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { importExportAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const ImportExport = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [entities, setEntities] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState('');
  const [action, setAction] = useState(''); // 'import' or 'export'
  const [fileFormat, setFileFormat] = useState('excel'); // 'excel' or 'csv'
  const [selectedFile, setSelectedFile] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [importHistory, setImportHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchEntities();
    fetchImportHistory();
  }, []);

  const fetchEntities = async () => {
    try {
      setLoading(true);
      const response = await importExportAPI.getAvailableEntities();
      setEntities(response.data);
    } catch (error) {
      console.error('Error fetching entities:', error);
      toast.error('Failed to fetch available entities');
    } finally {
      setLoading(false);
    }
  };

  const fetchImportHistory = async () => {
    try {
      const response = await importExportAPI.getImportHistory();
      setImportHistory(response.data);
    } catch (error) {
      console.error('Error fetching import history:', error);
    }
  };

  const handleEntityChange = (entityId) => {
    setSelectedEntity(entityId);
    setAction('');
    setImportResults(null);
    setSelectedFile(null);
    // Clear file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleActionChange = (newAction) => {
    setAction(newAction);
    setImportResults(null);
    
    // Clear file-related data when switching actions
    setSelectedFile(null);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    
    // Clear all previous import data when a new file is selected
    setImportResults(null);
    
    if (file) {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
        'application/csv'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid Excel or CSV file');
        // Clear the file input
        event.target.value = '';
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB');
        // Clear the file input
        event.target.value = '';
        return;
      }
      
      setSelectedFile(file);
    } else {
      // If no file selected, clear the selected file state
      setSelectedFile(null);
    }
  };

  const handleDownloadTemplate = async () => {
    if (!selectedEntity) {
      toast.error('Please select an entity first');
      return;
    }

    try {
      setDownloading(true);
      const response = await importExportAPI.generateTemplate(selectedEntity, fileFormat);
      
      // Create download link
      const blob = new Blob([response.data], {
        type: fileFormat === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedEntity}_template.${fileFormat === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    } finally {
      setDownloading(false);
    }
  };

  const handleExportData = async () => {
    if (!selectedEntity) {
      toast.error('Please select an entity first');
      return;
    }

    try {
      setDownloading(true);
      const response = await importExportAPI.exportData(selectedEntity, fileFormat);
      
      // Create download link
      const blob = new Blob([response.data], {
        type: fileFormat === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedEntity}_export.${fileFormat === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setDownloading(false);
    }
  };

  const handleImportData = async () => {
    if (!selectedEntity || !selectedFile) {
      toast.error('Please select an entity and file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await importExportAPI.importData(selectedEntity, formData);
      setImportResults(response.data);
      
      if (response.data.success > 0) {
        toast.success(`Import completed! ${response.data.success} records imported successfully`);
      }
      
      if (response.data.errors && response.data.errors.length > 0) {
        toast.error(`${response.data.errors.length} records had errors. Check the details below.`);
      }
      
      // Refresh import history
      fetchImportHistory();
      
    } catch (error) {
      console.error('Error importing data:', error);
      toast.error(error.response?.data?.message || 'Failed to import data');
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'IN_PROGRESS':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'FAILED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import & Export Data</h1>
          <p className="text-gray-600">Import and export data for all settings tables</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            {showHistory ? 'Hide History' : 'Show History'}
          </button>
          <Link
            to="/settings"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Settings
          </Link>
        </div>
      </div>

      {/* Import History */}
      {showHistory && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Import History
            </h3>
            {importHistory.length === 0 ? (
              <p className="text-gray-500">No import history found</p>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Entity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Records
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Success
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Errors
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Skipped
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Imported By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {importHistory.map((record) => (
                      <tr key={record.IMPORT_ID} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {record.ENTITY_ID}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.TOTAL_RECORDS}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {record.SUCCESS_COUNT}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {record.ERROR_COUNT}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                          {record.SKIPPED_COUNT}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.CREATED_BY_NAME || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(record.CREATED_AT).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Import/Export Interface */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Entity Selection */}
            <div>
              <label htmlFor="entity" className="block text-sm font-medium text-gray-700 mb-2">
                Select Entity
              </label>
              <select
                id="entity"
                value={selectedEntity}
                onChange={(e) => handleEntityChange(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">Choose an entity...</option>
                {entities.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name} - {entity.description}
                  </option>
                ))}
              </select>
            </div>

            {/* File Format Selection */}
            <div>
              <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-2">
                File Format
              </label>
              <select
                id="format"
                value={fileFormat}
                onChange={(e) => setFileFormat(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="excel">Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
              </select>
            </div>
          </div>

          {/* Action Selection */}
          {selectedEntity && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose Action
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  onClick={() => handleActionChange('export')}
                  className={`relative p-4 border-2 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    action === 'export'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <ArrowDownTrayIcon className="h-6 w-6 text-indigo-600 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Export Data</h3>
                      <p className="text-sm text-gray-500">Download existing data from the selected table</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleActionChange('import')}
                  className={`relative p-4 border-2 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    action === 'import'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <ArrowUpTrayIcon className="h-6 w-6 text-indigo-600 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Import Data</h3>
                      <p className="text-sm text-gray-500">Upload and import data into the selected table</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Export Actions */}
          {selectedEntity && action === 'export' && (
            <div className="mt-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Export Data</p>
                    <p>Download all existing data from the {entities.find(e => e.id === selectedEntity)?.name} table.</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleExportData}
                disabled={downloading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {downloading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Export Data
                  </>
                )}
              </button>
            </div>
          )}

          {/* Import Actions */}
          {selectedEntity && action === 'import' && (
            <div className="mt-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <InformationCircleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                  <div className="text-sm text-yellow-700">
                    <p className="font-medium">Import Data</p>
                    <p>First download a template, fill it with your data, then upload it here.</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleDownloadTemplate}
                  disabled={downloading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {downloading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full mr-2"></div>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                      Download Template
                    </>
                  )}
                </button>

                <div className="flex-1">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>

                <button
                  onClick={handleImportData}
                  disabled={!selectedFile || uploading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                      Import Data
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Import Results */}
          {importResults && (
            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-md p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Import Results</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-500">Total Records</p>
                  <p className="text-2xl font-bold text-gray-900">{importResults.total}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-600">Successfully Imported</p>
                  <p className="text-2xl font-bold text-green-700">{importResults.success}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-600">Errors</p>
                  <p className="text-2xl font-bold text-red-700">{importResults.errors.length}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-yellow-600">Skipped</p>
                  <p className="text-2xl font-bold text-yellow-700">{importResults.skipped}</p>
                </div>
              </div>

              {importResults.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Import Errors</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {importResults.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700">
                        <span className="font-medium">Row {error.row}:</span> {error.errors.join(', ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportExport; 
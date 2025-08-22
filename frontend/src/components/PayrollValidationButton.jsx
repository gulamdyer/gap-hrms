import React, { useState } from 'react';
import { payrollAPI } from '../services/api';
import { MagnifyingGlassCircleIcon } from '@heroicons/react/24/outline';

const PayrollValidationButton = ({ month, year, onValidationComplete }) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const handleValidation = async () => {
    if (!month || !year) {
      alert('Please select month and year first');
      return;
    }

    setIsValidating(true);
    setValidationResults(null);
    setShowResults(true);

    try {
      const response = await payrollAPI.validateMonthEndPrerequisites(month, year);
      setValidationResults(response.data);
      
      if (onValidationComplete) {
        onValidationComplete(response.data);
      }
    } catch (error) {
      console.error('Validation failed:', error);
      setValidationResults({
        overallStatus: 'ERROR',
        checks: {},
        summary: { totalChecks: 0, passedChecks: 0, failedChecks: 0, warnings: 0 },
        error: error.response?.data?.message || error.message || 'Validation failed'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PASSED':
        return 'text-green-700 bg-green-100';
      case 'FAILED':
        return 'text-red-700 bg-red-100';
      case 'WARNING':
        return 'text-yellow-700 bg-yellow-100';
      case 'PENDING':
        return 'text-gray-700 bg-gray-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getOverallStatusColor = (status) => {
    switch (status) {
      case 'READY':
        return 'text-green-700 bg-green-100 border-green-300';
      case 'READY_WITH_WARNINGS':
        return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'NOT_READY':
        return 'text-red-700 bg-red-100 border-red-300';
      case 'ERROR':
        return 'text-red-700 bg-red-100 border-red-300';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  const getOverallStatusText = (status) => {
    switch (status) {
      case 'READY':
        return 'Ready for Processing';
      case 'READY_WITH_WARNINGS':
        return 'Ready with Warnings';
      case 'NOT_READY':
        return 'Not Ready for Processing';
      case 'ERROR':
        return 'Validation Error';
      default:
        return 'Pending';
    }
  };

  const getCheckIcon = (status) => {
    switch (status) {
      case 'PASSED':
        return '✅';
      case 'FAILED':
        return '❌';
      case 'WARNING':
        return '⚠️';
      case 'PENDING':
        return '⏳';
      default:
        return '❓';
    }
  };

  return (
    <div className="mb-6">
      {/* Validation Button */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={handleValidation}
          disabled={isValidating || !month || !year}
          className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white transition-all duration-200 ${
            isValidating || !month || !year
              ? 'bg-indigo-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          }`}
        >
          {isValidating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
              Validating...
            </>
          ) : (
            <>
              <MagnifyingGlassCircleIcon className="h-5 w-5 mr-2" />
              Run Pre-Processing Checks
            </>
          )}
        </button>
        
        {validationResults && (
          <div className={`px-3 py-1 rounded-md border text-sm font-semibold ${getOverallStatusColor(validationResults.overallStatus)}`}>
            {getOverallStatusText(validationResults.overallStatus)}
          </div>
        )}
      </div>

      {/* Validation Results */}
      {showResults && validationResults && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Payroll Prerequisites Validation Results
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Month: {validationResults.month}/{validationResults.year} |
              {' '}Period: {validationResults.startDate} to {validationResults.endDate}
            </p>
          </div>

          {/* Summary */}
          <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-700">{validationResults.summary.totalChecks}</div>
                <div className="text-sm text-indigo-700">Total Checks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">{validationResults.summary.passedChecks}</div>
                <div className="text-sm text-green-700">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-700">{validationResults.summary.warnings}</div>
                <div className="text-sm text-yellow-700">Warnings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-700">{validationResults.summary.failedChecks}</div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="px-6 py-4">
            {validationResults.error ? (
              <div className="text-red-700 bg-red-50 p-4 rounded-md border border-red-200">
                <strong>Error:</strong> {validationResults.error}
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(validationResults.checks).map(([checkName, checkData]) => (
                  <div key={checkName} className="border border-gray-200 rounded-md p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 capitalize">
                        {checkName.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(checkData.status)}`}>
                        {getCheckIcon(checkData.status)} {checkData.status}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      Count: {checkData.count}
                    </div>
                    
                    {checkData.issues && checkData.issues.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <h5 className="font-medium text-red-800 mb-2">Issues Found:</h5>
                        <ul className="space-y-1">
                          {checkData.issues.map((issue, index) => (
                            <li key={index} className="text-red-700 text-sm flex items-start gap-2">
                              <span className="text-red-500 mt-1">•</span>
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <button
              onClick={() => setShowResults(false)}
              className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Hide Results
            </button>
            
            {validationResults.overallStatus === 'READY' && (
              <div className="text-green-700 font-medium">
                All checks passed. You can proceed with payroll processing.
              </div>
            )}
            
            {validationResults.overallStatus === 'READY_WITH_WARNINGS' && (
              <div className="text-yellow-700 font-medium">
                Ready with warnings. Review issues before processing.
              </div>
            )}
            
            {validationResults.overallStatus === 'NOT_READY' && (
              <div className="text-red-700 font-medium">
                Not ready. Please fix failed checks before processing.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollValidationButton;

import React, { useState } from 'react';
import { QuestionMarkCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ValidationHelp = () => {
  const [isOpen, setIsOpen] = useState(false);

  const validationRules = {
    'Required Fields': {
      'First Name': 'Required, 2-50 characters',
      'Last Name': 'Required, 2-50 characters'
    },
    'Personal Information': {
      'Legal Name': 'Optional, max 100 characters',
      'Gender': 'Optional: MALE, FEMALE, OTHER, or empty',
      'Nationality': 'Optional, max 50 characters',
      'Date of Birth': 'Optional, format: DD-MM-YYYY (e.g., 25-12-1990)',
      'Birth Place': 'Optional, max 100 characters'
    },
    'Job Information': {
      'Report To': 'Optional, must be valid employee ID',
      'Designation': 'Optional, max 100 characters',
      'Role': 'Optional, max 100 characters',
      'Position': 'Optional, max 100 characters',
      'Location': 'Optional, max 100 characters',
      'Cost Center': 'Optional, max 50 characters',
      'Date of Joining': 'Optional, format: DD-MM-YYYY (e.g., 01-01-2024)',
      'Probation Days': 'Optional, 0-365 days',
      'Confirm Date': 'Optional, format: DD-MM-YYYY (e.g., 01-04-2024)',
      'Notice Days': 'Optional, 0-365 days'
    },
    'Address Information': {
      'Address': 'Optional, max 1000 characters',
      'Pincode': 'Optional, 6-10 characters',
      'City': 'Optional, max 50 characters',
      'District': 'Optional, max 50 characters',
      'State': 'Optional, max 50 characters',
      'Country': 'Optional, max 50 characters',
      'Phone': 'Optional, max 20 characters',
      'Mobile': 'Optional, max 20 characters',
      'Email': 'Optional, valid email format'
    },
    'Personal Details': {
      'Father Name': 'Optional, max 100 characters',
      'Marital Status': 'Optional: SINGLE, MARRIED, DIVORCED, WIDOWED, or empty',
      'Spouse Name': 'Optional, max 100 characters',
      'Religion': 'Optional, max 50 characters'
    },
    'Legal Information': {
      'National ID Number': 'Optional, exactly 12 digits',
      'Visa / Personal Number': 'Optional, exactly 10 characters',
      'Driving License': 'Optional, max 20 characters',
      'Education Certificate': 'Optional, max 50 characters'
    },
    'Bank Information': {
      'Bank Name': 'Optional, max 100 characters',
      'Branch Name': 'Optional, max 100 characters',
      'IFSC Code': 'Optional, exactly 11 characters',
      'Account Number': 'Optional, max 50 characters',
      'UAN Number': 'Optional, max 20 characters',
      'Social Security Number': 'Optional, max 20 characters',
      'Insurance Number': 'Optional, max 20 characters'
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        <QuestionMarkCircleIcon className="h-4 w-4 mr-2" />
        Validation Rules
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Employee Form Validation Rules</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {Object.entries(validationRules).map(([category, fields]) => (
                <div key={category} className="mb-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(fields).map(([field, rule]) => (
                      <div key={field} className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-700">{field}:</span>
                        <span className="text-sm text-gray-600 text-right ml-4">{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="bg-blue-50 p-3 rounded-md">
                <h5 className="text-sm font-medium text-blue-800 mb-1">Quick Tips:</h5>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Only First Name and Last Name are required</li>
                  <li>• All other fields are optional and can be left empty</li>
                  <li>• Date fields must be in DD-MM-YYYY format (e.g., 25-12-1990)</li>
                  <li>• Email must be in valid format if provided</li>
                  <li>• Numbers must be within specified ranges</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ValidationHelp; 
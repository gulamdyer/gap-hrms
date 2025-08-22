import React, { createContext, useContext, useState } from 'react';
import ErrorModal from '../components/ErrorModal';

const ErrorContext = createContext();

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

export const ErrorProvider = ({ children }) => {
  const [error, setError] = useState(null);

  const showError = (errorDetails) => {
    // Handle different error formats
    let title = "An Error Occurred";
    let message = "Something went wrong. Please try again.";
    let details = null;
    let actionButton = null;

    if (typeof errorDetails === 'string') {
      message = errorDetails;
    } else if (errorDetails?.response?.data) {
      // Axios error format
      const errorData = errorDetails.response.data;
      title = errorData.message || errorData.error || title;
      message = errorData.details || errorData.message || message;
      details = errorData.error || errorDetails.message;
      
      // Add specific handling for common error types
      if (errorDetails.response.status === 500) {
        title = "Server Error";
        message = "There was a problem processing your request. Please try again or contact support if the issue persists.";
      } else if (errorDetails.response.status === 401) {
        title = "Authentication Required";
        message = "Please log in again to continue.";
        actionButton = (
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
            onClick={() => {
              clearError();
              window.location.href = '/login';
            }}
          >
            Go to Login
          </button>
        );
      } else if (errorDetails.response.status === 403) {
        title = "Access Denied";
        message = "You don't have permission to perform this action.";
      } else if (errorDetails.response.status === 404) {
        title = "Not Found";
        message = "The requested resource could not be found.";
      }
    } else if (errorDetails?.message) {
      // Regular Error object
      message = errorDetails.message;
      details = errorDetails.stack;
    } else if (errorDetails?.title && errorDetails?.message) {
      // Custom error object
      title = errorDetails.title;
      message = errorDetails.message;
      details = errorDetails.details;
      actionButton = errorDetails.actionButton;
    }

    setError({
      title,
      message,
      details,
      actionButton
    });
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <ErrorContext.Provider value={{ showError, clearError }}>
      {children}
      <ErrorModal
        isOpen={!!error}
        onClose={clearError}
        title={error?.title}
        message={error?.message}
        details={error?.details}
        actionButton={error?.actionButton}
      />
    </ErrorContext.Provider>
  );
};

export default ErrorContext;

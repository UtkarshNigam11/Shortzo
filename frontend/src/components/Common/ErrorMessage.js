import React from 'react';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

const ErrorMessage = ({ 
  message = 'Something went wrong', 
  onRetry, 
  showRetry = true,
  type = 'error' // 'error', 'warning', 'info'
}) => {
  const typeStyles = {
    error: {
      container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
      text: 'text-red-800 dark:text-red-200',
      button: 'bg-red-600 hover:bg-red-700 text-white'
    },
    warning: {
      container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-600 dark:text-yellow-400',
      text: 'text-yellow-800 dark:text-yellow-200',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    info: {
      container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      text: 'text-blue-800 dark:text-blue-200',
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  };

  const styles = typeStyles[type];

  return (
    <div className={`border rounded-lg p-4 ${styles.container}`}>
      <div className="flex items-start space-x-3">
        <FiAlertCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${styles.icon}`} />
        <div className="flex-1">
          <p className={`text-sm ${styles.text}`}>{message}</p>
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              className={`mt-3 inline-flex items-center space-x-2 px-3 py-1 rounded text-sm font-medium transition-colors ${styles.button}`}
            >
              <FiRefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;

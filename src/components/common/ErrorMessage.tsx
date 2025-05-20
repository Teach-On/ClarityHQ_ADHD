import { AlertTriangle } from 'lucide-react';

interface ErrorMessageProps {
  message: string | null;
  className?: string;
  onRetry?: () => void;
}

/**
 * Reusable error message component for consistent error display
 */
const ErrorMessage = ({ 
  message, 
  className = '', 
  onRetry 
}: ErrorMessageProps) => {
  if (!message) return null;
  
  return (
    <div className={`rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300 ${className}`}>
      <div className="flex">
        <AlertTriangle className="mr-2 h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          <p>{message}</p>
          
          {onRetry && (
            <button 
              onClick={onRetry}
              className="mt-2 font-medium text-red-700 underline hover:text-red-900 dark:text-red-300 dark:hover:text-red-100"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
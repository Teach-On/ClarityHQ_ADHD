import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { clearAuthStorage } from '../../services/auth';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error: _, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error information
    console.error('Caught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleReset = () => {
    // Clear auth state and redirect to login
    clearAuthStorage();
    window.location.href = '/login?recovery=needed';
  };

  handleGoHome = () => {
    // Just redirect to home without clearing auth
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50 p-4 dark:bg-slate-900">
          <div className="max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            
            <h1 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Something went wrong</h1>
            
            <div className="mb-4 overflow-auto rounded bg-slate-100 p-4 text-sm text-slate-800 dark:bg-slate-900 dark:text-slate-200">
              <p className="font-mono">
                {this.state.error?.toString() || 'Unknown error occurred'}
              </p>
            </div>
            
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
              We apologize for the inconvenience. Here are some actions you can try:
            </p>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={this.handleRefresh}
                className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Page
              </button>
              
              <button
                onClick={this.handleReset}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Reset Account
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { registerSW } from './registerSW.ts';
import ErrorBoundary from './components/common/ErrorBoundary.tsx';

// Log environment info for debugging
console.log(`ClarityHQ v0.1.0 - ${import.meta.env.MODE} mode`);
console.log(`Environment: ${import.meta.env.MODE}`);
console.log(`Host: ${window.location.hostname}`);

// Only register service worker in production environment
if (import.meta.env.PROD) {
  registerSW();
} else {
  console.log('Service worker registration skipped in development mode');
}

// Add unhandled rejection handler for debugging
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

// Add debug query parameter support
const urlParams = new URLSearchParams(window.location.search);
const isDebugMode = urlParams.get('debug') === 'true';

if (isDebugMode) {
  console.log('Debug mode enabled');
  // Expose useful debugging functions
  (window as any).debugClarityHQ = {
    clearAuth: () => {
      localStorage.removeItem('clarityhq-auth-storage');
      console.log('Auth storage cleared');
    },
    resetLocalStorage: () => {
      localStorage.clear();
      console.log('Local storage cleared');
    },
    getAuthData: () => {
      const data = localStorage.getItem('clarityhq-auth-storage');
      return data ? JSON.parse(data) : null;
    },
    version: '0.1.0'
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
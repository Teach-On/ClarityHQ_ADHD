import { Workbox } from 'workbox-window';

export function registerSW() {
  // Only register in production and in supported environments
  if (
    'serviceWorker' in navigator && 
    import.meta.env.MODE === 'production' && 
    !window.location.hostname.includes('stackblitz.io') &&
    !window.location.hostname.includes('webcontainer-')
  ) {
    console.log('Registering service worker');
    
    const wb = new Workbox('/sw.js', {
      // This will unregister the service worker if there's an issue
      // such as a new version with a syntax error
      immediate: true
    });

    wb.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        console.log('New service worker update available');
        if (confirm('New app update available! Click OK to refresh.')) {
          window.location.reload();
        }
      }
    });

    wb.addEventListener('activated', (event) => {
      console.log('Service worker activated');
    });

    wb.addEventListener('redundant', (event) => {
      console.error('Service worker became redundant');
    });

    wb.addEventListener('message', (event) => {
      console.log('Message from service worker:', event.data);
    });

    wb.register().catch(error => {
      console.error('Service worker registration failed:', error);
    });
  } else {
    console.log('Service workers not supported, disabled in this environment, or not in production mode');
  }
}
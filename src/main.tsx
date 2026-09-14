import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register service worker for offline installation (PWA) and handle updates
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
      .then((reg) => {
        console.log('Service Worker registered successfully:', reg.scope);
        // Expose registration for manual update trigger
        (window as any).__swRegistration = reg;
        
        const notifyUpdate = (worker: ServiceWorker) => {
          window.dispatchEvent(new CustomEvent('slippro-update-available', { 
            detail: { worker } 
          }));
        };

        // If there's already a waiting worker
        if (reg.waiting) {
          notifyUpdate(reg.waiting);
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                notifyUpdate(newWorker);
              }
            });
          }
        });

        // Periodically check for updates every 5 minutes
        setInterval(() => {
          reg.update().catch(() => {});
        }, 5 * 60 * 1000);

        // Check for updates when user returns to the tab
        window.addEventListener('focus', () => {
          reg.update().catch(() => {});
        });
      })
      .catch((err) => console.error('Service Worker registration failed:', err));
  });
}


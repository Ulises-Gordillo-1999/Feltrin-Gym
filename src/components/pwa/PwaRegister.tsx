'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    // 1. Registrar Service Worker de forma confiable tanto en producción como en HTTPS
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      (process.env.NODE_ENV === 'production' || window.location.protocol === 'https:')
    ) {
      const registerSW = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('PWA: Service Worker registrado exitosamente. Alcance:', reg.scope);
          })
          .catch((err) => {
            console.warn('PWA: Error registrando Service Worker:', err);
          });
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
    }

    // 2. Capturar evento nativo de instalación antes de que se pierda
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).__deferredInstallPrompt = e;
      window.dispatchEvent(new CustomEvent('pwa-installable'));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return null;
}

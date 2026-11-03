'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    // 1. Registrar Service Worker silenciosamente en producción
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('PWA: Service Worker registrado con alcance:', reg.scope);
          })
          .catch((err) => {
            console.error('PWA: Error registrando Service Worker:', err);
          });
      });
    }

    // 2. Capturar evento de instalación nativo y guardarlo globalmente
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

  return null; // Cero UI en la raíz para no interferir con la pantalla de login
}


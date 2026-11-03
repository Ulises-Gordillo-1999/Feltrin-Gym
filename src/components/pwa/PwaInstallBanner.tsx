'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Detectar si ya está en modo standalone (instalada)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(standalone);

    if (standalone) return;

    // 2. Si el ServiceWorker ya capturó el evento de instalación
    const cachedPrompt = (window as any).__deferredInstallPrompt;
    if (cachedPrompt) {
      setDeferredPrompt(cachedPrompt);
      if (!sessionStorage.getItem('feltrin_dismiss_install')) {
        setShowBanner(true);
      }
    }

    // 3. Escuchar evento si se dispara mientras el usuario navega en el panel
    const handleInstallable = () => {
      const prompt = (window as any).__deferredInstallPrompt;
      if (prompt) {
        setDeferredPrompt(prompt);
        if (!sessionStorage.getItem('feltrin_dismiss_install')) {
          setShowBanner(true);
        }
      }
    };

    window.addEventListener('pwa-installable', handleInstallable);
    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA instalada exitosamente por el usuario.');
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('feltrin_dismiss_install', 'true');
    setShowBanner(false);
  };

  if (isStandalone || !showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 max-w-sm bg-zinc-900/95 border border-emerald-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
          <Download className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-zinc-100">Instalar Feltrin Gym</h4>
          <p className="text-xs text-zinc-400 mt-0.5 leading-snug">
            Instalá la app en tu celular para ingresar rápidamente con huella dactilar y recibir avisos.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors cursor-pointer"
            >
              Instalar App
            </button>
            <button
              onClick={handleDismiss}
              className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
            >
              Ahora no
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone, ArrowUpRight, Share, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'other'>('android');

  useEffect(() => {
    // 1. Detectar si ya está en modo standalone (instalada en pantalla de inicio)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(standalone);

    if (standalone) {
      return;
    }

    // 2. Detectar plataforma del usuario
    const ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua)) {
      setPlatform('ios');
    } else if (/Android/.test(ua)) {
      setPlatform('android');
    } else {
      setPlatform('other');
    }

    // 3. Detectar si el usuario ya descartó el banner en esta sesión
    const isDismissed = sessionStorage.getItem('feltrin_dismiss_install') === 'true';

    // 4. Capturar el prompt nativo de Chrome si está en window
    const cachedPrompt = (window as any).__deferredInstallPrompt;
    if (cachedPrompt) {
      setDeferredPrompt(cachedPrompt);
    }

    // 5. En dispositivos móviles o si hay un prompt nativo listo, mostrar el cartel
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
      window.innerWidth <= 768;

    if (!isDismissed && (isMobile || cachedPrompt)) {
      setShowBanner(true);
    }

    // 6. Escuchar cuando Chrome dispare el evento antes de instalar
    const handleInstallable = () => {
      const prompt = (window as any).__deferredInstallPrompt;
      if (prompt) {
        setDeferredPrompt(prompt);
      }
      if (!isDismissed) {
        setShowBanner(true);
      }
    };

    // 7. Escuchar solicitudes manuales para abrir la instalación (desde Sidebar o Topbar)
    const handleManualOpen = () => {
      setShowBanner(true);
      handleInstallClick();
    };

    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-open-install', handleManualOpen);

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-open-install', handleManualOpen);
    };
  }, []);

  const handleInstallClick = async () => {
    const prompt = deferredPrompt || (window as any).__deferredInstallPrompt;

    if (prompt && typeof prompt.prompt === 'function') {
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
          console.log('PWA: Usuario aceptó la instalación.');
          setShowBanner(false);
          (window as any).__deferredInstallPrompt = null;
          setDeferredPrompt(null);
          return;
        }
      } catch (err) {
        console.warn('PWA: Error al ejecutar prompt nativo, mostrando guía:', err);
      }
    }

    // Si no hay prompt nativo disponible (ej. iOS Safari o Chrome con heurística), mostramos la guía paso a paso
    setShowGuideModal(true);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('feltrin_dismiss_install', 'true');
    setShowBanner(false);
  };

  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Banner flotante inferior */}
      {showBanner && (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-40 max-w-sm bg-zinc-900/95 border border-emerald-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-zinc-100">Instalar Feltrin Gym</h4>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400">
                  App
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 leading-snug">
                Instalá la app en tu celular para ingresar rápidamente con huella dactilar y recibir avisos.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Instalar App</span>
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
                >
                  Ahora no
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-zinc-800/60 cursor-pointer"
              aria-label="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de instrucciones para instalación manual */}
      <Modal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        title="Instalar Feltrin Gym en tu Celular"
        description="Seguí estos sencillos pasos para instalar la aplicación en tu pantalla de inicio:"
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          {platform === 'android' ? (
            <div className="space-y-3 bg-zinc-900/60 rounded-xl p-4 border border-zinc-800">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <Smartphone className="w-4 h-4" />
                <span>En Google Chrome (Android):</span>
              </div>
              <ol className="space-y-2.5 text-xs text-zinc-300 list-decimal list-inside pl-1">
                <li className="leading-relaxed">
                  Tocá los <strong className="text-zinc-100">tres puntos ( ⋮ )</strong> en la esquina superior derecha del navegador Chrome.
                </li>
                <li className="leading-relaxed">
                  Buscá y tocá la opción <strong className="text-emerald-400 font-medium">&quot;Instalar aplicación&quot;</strong> (o <strong className="text-zinc-100">&quot;Agregar a la pantalla principal&quot;</strong>).
                </li>
                <li className="leading-relaxed">
                  Confirmá tocando en <strong className="text-zinc-100">&quot;Instalar&quot;</strong>.
                </li>
              </ol>
            </div>
          ) : platform === 'ios' ? (
            <div className="space-y-3 bg-zinc-900/60 rounded-xl p-4 border border-zinc-800">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                <Share className="w-4 h-4" />
                <span>En Safari (iPhone / iPad):</span>
              </div>
              <ol className="space-y-2.5 text-xs text-zinc-300 list-decimal list-inside pl-1">
                <li className="leading-relaxed">
                  Tocá el botón <strong className="text-zinc-100">Compartir</strong> (ícono de cuadrado con flecha hacia arriba <Share className="inline w-3.5 h-3.5 mx-0.5" /> en la barra inferior).
                </li>
                <li className="leading-relaxed">
                  Desplazate hacia abajo y seleccioná <strong className="text-emerald-400 font-medium">&quot;Agregar a pantalla de inicio&quot;</strong>.
                </li>
                <li className="leading-relaxed">
                  Tocá <strong className="text-zinc-100">&quot;Agregar&quot;</strong> en la esquina superior derecha.
                </li>
              </ol>
            </div>
          ) : (
            <div className="space-y-3 bg-zinc-900/60 rounded-xl p-4 border border-zinc-800">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <ArrowUpRight className="w-4 h-4" />
                <span>Desde el menú de tu navegador:</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Abrí el menú de opciones de tu navegador web y seleccioná <strong className="text-emerald-400 font-medium">&quot;Instalar aplicación&quot;</strong> para fijar Feltrin Gym en tu dispositivo.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Una vez instalada, abrila desde tu pantalla de inicio para habilitar el acceso con huella dactilar.</span>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setShowGuideModal(false);
                setShowBanner(false);
                sessionStorage.setItem('feltrin_dismiss_install', 'true');
              }}
            >
              ¡Entendido!
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

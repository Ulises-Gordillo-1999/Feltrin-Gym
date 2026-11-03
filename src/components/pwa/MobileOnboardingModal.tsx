'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { Fingerprint, Bell, CheckCircle2, Sparkles, X, ShieldCheck } from 'lucide-react';
import { startRegistration } from '@simplewebauthn/browser';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  getRegistrationOptionsAction,
  verifyRegistrationAction,
  getUserPasskeysCountAction,
  savePushSubscriptionAction,
} from '@/app/actions/webauthn.actions';
import type { SessionUser } from '@/types';

export function MobileOnboardingModal({ user }: { user: SessionUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsRegistered, setBiometricsRegistered] = useState(false);
  const [notificationsGranted, setNotificationsGranted] = useState(false);

  const [isBioPending, startBioTransition] = useTransition();
  const [isNotifPending, startNotifTransition] = useTransition();

  const [bioError, setBioError] = useState<string | null>(null);
  const [notifError, setNotifError] = useState<string | null>(null);

  useEffect(() => {
    async function checkEligibility() {
      // 1. Verificar si ya completó el onboarding en este dispositivo
      const storageKey = `feltrin_pwa_onboarded_${user.id}`;
      if (localStorage.getItem(storageKey)) {
        return;
      }

      // 2. Verificar si es entorno móvil o PWA instalada
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;

      const isMobile =
        window.innerWidth <= 768 ||
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (!isStandalone && !isMobile) {
        return;
      }

      // Si está en el navegador móvil y no se ha instalado aún, permitir que el usuario vea
      // e interactúe prioritariamente con el cartel de instalación PWA.
      if (!isStandalone && !sessionStorage.getItem('feltrin_dismiss_install')) {
        return;
      }

      // 3. Verificar si el dispositivo soporta sensor biométrico (Huella / TouchID / FaceID)
      let hasPlatformBio = false;
      if (
        typeof window !== 'undefined' &&
        window.PublicKeyCredential &&
        typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
      ) {
        try {
          hasPlatformBio = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        } catch {
          hasPlatformBio = false;
        }
      }

      // 4. Verificar si ya tiene huella en la base de datos
      const existingCount = await getUserPasskeysCountAction();
      if (existingCount > 0) {
        setBiometricsRegistered(true);
      }

      setBiometricsAvailable(hasPlatformBio);

      // 5. Estado actual de notificaciones
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotificationsGranted(Notification.permission === 'granted');
      }

      // Si tiene huella disponible y aún no la registró, o no tiene notificaciones, mostrar modal
      if ((hasPlatformBio && existingCount === 0) || ('Notification' in window && Notification.permission !== 'granted')) {
        setIsOpen(true);
      }
    }

    checkEligibility();
  }, [user.id]);

  const handleRegisterBiometrics = () => {
    setBioError(null);
    startBioTransition(async () => {
      try {
        const optRes = await getRegistrationOptionsAction();
        if (!optRes.ok) {
          setBioError(optRes.error);
          return;
        }

        // Llamar al prompt nativo de huella / Face ID del dispositivo
        const attResp = await startRegistration({ optionsJSON: optRes.data });

        // Identificar dispositivo amigable
        const ua = navigator.userAgent;
        let deviceName = 'Celular Móvil';
        if (/iPhone/i.test(ua)) deviceName = 'Apple iPhone';
        else if (/iPad/i.test(ua)) deviceName = 'Apple iPad';
        else if (/Samsung/i.test(ua)) deviceName = 'Samsung Galaxy';
        else if (/Android/i.test(ua)) deviceName = 'Dispositivo Android';

        const verifyRes = await verifyRegistrationAction(attResp, deviceName);
        if (verifyRes.ok) {
          setBiometricsRegistered(true);
        } else {
          setBioError(verifyRes.error);
        }
      } catch (err: any) {
        console.error('Error registrando huella:', err);
        if (err.name === 'NotAllowedError') {
          setBioError('Operación cancelada por el usuario.');
        } else {
          setBioError(err.message || 'Error al capturar huella.');
        }
      }
    });
  };

  const handleRequestNotifications = () => {
    setNotifError(null);
    startNotifTransition(async () => {
      if (!('Notification' in window)) {
        setNotifError('Tu navegador no soporta notificaciones push.');
        return;
      }

      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationsGranted(true);

          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            // Registrar suscripción push si el navegador lo permite
            try {
              const sub = await reg.pushManager.getSubscription();
              if (sub) {
                const subJSON = sub.toJSON();
                if (subJSON.endpoint && subJSON.keys) {
                  await savePushSubscriptionAction({
                    endpoint: subJSON.endpoint,
                    keys: {
                      p256dh: subJSON.keys.p256dh || '',
                      auth: subJSON.keys.auth || '',
                    },
                  });
                }
              }
            } catch (subErr) {
              console.log('Push subscription no configurada aún en este navegador:', subErr);
            }
          }
        } else {
          setNotifError('Permiso de notificaciones denegado.');
        }
      } catch (err: any) {
        setNotifError(err.message || 'Error al solicitar notificaciones.');
      }
    });
  };

  const handleClose = () => {
    localStorage.setItem(`feltrin_pwa_onboarded_${user.id}`, 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="md"
      title="¡Bienvenido a la App Feltrin Gym!"
      description="Configurá tu experiencia móvil para ingresar más rápido y mantenerte informado."
    >
      <div className="space-y-4 pt-1">
        {/* Banner de inicio */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900/60 to-teal-950/40 border border-emerald-500/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="text-xs text-zinc-300 leading-snug">
            Detectamos que estás en un dispositivo móvil. Activá estas opciones para usar Feltrin Gym como una app nativa.
          </p>
        </div>

        {/* Tarjeta 1: Huella Dactilar */}
        {biometricsAvailable && (
          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400 flex items-center justify-center shrink-0">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                    Inicio de Sesión con Huella / Face ID
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-snug">
                    Ingresá al instante con tu sensor biométrico sin volver a escribir tu contraseña.
                  </p>
                </div>
              </div>
            </div>

            {bioError && (
              <p className="text-xs text-rose-400 bg-rose-950/40 p-2 rounded-xl border border-rose-900/60">
                {bioError}
              </p>
            )}

            <div className="flex items-center justify-end pt-1">
              {biometricsRegistered ? (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Huella Activada</span>
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRegisterBiometrics}
                  isLoading={isBioPending}
                  icon={<Fingerprint className="w-4 h-4" />}
                >
                  Activar Huella
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Tarjeta 2: Avisos y Alertas */}
        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 text-teal-400 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-100">
                  Alertas y Avisos del Gimnasio
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5 leading-snug">
                  Recibí avisos de profesores, nuevas rutinas asignadas y recordatorios de cuotas.
                </p>
              </div>
            </div>
          </div>

          {notifError && (
            <p className="text-xs text-rose-400 bg-rose-950/40 p-2 rounded-xl border border-rose-900/60">
              {notifError}
            </p>
          )}

          <div className="flex items-center justify-end pt-1">
            {notificationsGranted ? (
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
                <span>Alertas Permitidas</span>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestNotifications}
                isLoading={isNotifPending}
                icon={<Bell className="w-4 h-4" />}
              >
                Permitir Alertas
              </Button>
            )}
          </div>
        </div>

        {/* Botón de cierre / continuar */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Configuración segura de tu cuenta
          </span>
          <Button variant="primary" onClick={handleClose}>
            Continuar al Sistema
          </Button>
        </div>
      </div>
    </Modal>
  );
}


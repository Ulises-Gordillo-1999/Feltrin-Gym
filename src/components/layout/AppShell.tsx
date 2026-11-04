'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';
import { MobileOnboardingModal } from '@/components/pwa/MobileOnboardingModal';
import { PwaInstallBanner } from '@/components/pwa/PwaInstallBanner';
import type { SessionUser } from '@/types';

export interface AppShellProps {
  user: SessionUser;
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex pb-safe">
      {/* Modal de bienvenida/activación de huella y alertas en móvil */}
      <MobileOnboardingModal user={user} />

      {/* Banner de instalación PWA (solo cuando el usuario ha iniciado sesión) */}
      <PwaInstallBanner />

      {/* Sidebar fijo a la izquierda */}
      <Sidebar
        role={user.role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Contenedor principal con offset en desktop */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Topbar user={user} onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Barra de navegación inferior nativa para móviles */}
      <BottomNav role={user.role} onOpenMenu={() => setSidebarOpen(true)} />
    </div>
  );
}

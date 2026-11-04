'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Wallet,
  ShoppingBag,
  Menu,
  ClipboardList,
  Flame,
  CalendarCheck,
  Receipt,
} from 'lucide-react';
import type { Role } from '@/types';

export interface BottomNavProps {
  role: Role;
  onOpenMenu: () => void;
}

interface BottomNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function BottomNav({ role, onOpenMenu }: BottomNavProps) {
  const pathname = usePathname();

  // Configuración de pestañas de acceso rápido según rol
  const getNavItems = (): BottomNavItem[] => {
    switch (role) {
      case 'ADMIN':
        return [
          { label: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
          { label: 'Alumnos', href: '/alumnos', icon: Users },
          { label: 'Caja', href: '/finanzas', icon: Wallet },
          { label: 'POS', href: '/ventas', icon: ShoppingBag },
        ];
      case 'PROFESOR':
        return [
          { label: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
          { label: 'Alumnos', href: '/alumnos', icon: Users },
          { label: 'Rutinas', href: '/rutinas', icon: ClipboardList },
          { label: 'Ejercicios', href: '/ejercicios', icon: Flame },
        ];
      case 'ALUMNO':
        return [
          { label: 'Mi Rutina', href: '/mi-rutina', icon: CalendarCheck },
          { label: 'Mis Pagos', href: '/mis-pagos', icon: Receipt },
        ];
      default:
        return [{ label: 'Inicio', href: '/dashboard', icon: LayoutDashboard }];
    }
  };

  const navItems = getNavItems();

  return (
    <nav
      aria-label="Navegación móvil inferior"
      className="fixed bottom-0 inset-x-0 z-30 lg:hidden border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl pb-safe shadow-[0_-8px_24px_rgba(0,0,0,0.6)]"
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[44px] min-w-[44px] rounded-xl transition-all active:scale-95 cursor-pointer relative group ${
                isActive
                  ? 'text-emerald-400 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {/* Indicador sutil de píldora activa */}
              {isActive && (
                <span className="absolute top-1.5 w-8 h-1 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-in fade-in zoom-in-50 duration-200" />
              )}
              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? 'scale-110 stroke-[2.4]' : 'group-hover:scale-105'
                }`}
              />
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Botón "Más" para abrir el Off-canvas Drawer con todas las opciones */}
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Abrir menú completo"
          className="flex-1 flex flex-col items-center justify-center py-1 min-h-[44px] min-w-[44px] rounded-xl text-zinc-400 hover:text-zinc-200 active:scale-95 transition-all cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Más</span>
        </button>
      </div>
    </nav>
  );
}


'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Dumbbell,
  LayoutDashboard,
  Users,
  CreditCard,
  ClipboardList,
  Flame,
  Wallet,
  Package,
  ShoppingBag,
  ShieldCheck,
  Settings,
  CalendarCheck,
  Receipt,
  X,
} from 'lucide-react';
import type { Role } from '@/types';
import { Badge } from '../ui/Badge';
import { ROLE_LABELS } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ['ADMIN', 'PROFESOR', 'ALUMNO'],
  },
  {
    label: 'Alumnos',
    href: '/alumnos',
    icon: <Users className="w-5 h-5" />,
    roles: ['ADMIN', 'PROFESOR'],
  },
  {
    label: 'Planes de Cuota',
    href: '/planes',
    icon: <CreditCard className="w-5 h-5" />,
    roles: ['ADMIN'],
  },
  {
    label: 'Rutinas',
    href: '/rutinas',
    icon: <ClipboardList className="w-5 h-5" />,
    roles: ['ADMIN', 'PROFESOR'],
  },
  {
    label: 'Banco de Ejercicios',
    href: '/ejercicios',
    icon: <Flame className="w-5 h-5" />,
    roles: ['ADMIN', 'PROFESOR'],
  },
  {
    label: 'Finanzas (Caja)',
    href: '/finanzas',
    icon: <Wallet className="w-5 h-5" />,
    roles: ['ADMIN'],
  },
  {
    label: 'Inventario',
    href: '/inventario',
    icon: <Package className="w-5 h-5" />,
    roles: ['ADMIN'],
  },
  {
    label: 'Ventas de Mostrador',
    href: '/ventas',
    icon: <ShoppingBag className="w-5 h-5" />,
    roles: ['ADMIN'],
  },
  {
    label: 'Usuarios y Accesos',
    href: '/usuarios',
    icon: <ShieldCheck className="w-5 h-5" />,
    roles: ['ADMIN'],
  },
  {
    label: 'Configuración',
    href: '/configuracion',
    icon: <Settings className="w-5 h-5" />,
    roles: ['ADMIN'],
  },
  // Vistas exclusivas para Alumno
  {
    label: 'Mi Rutina de Hoy',
    href: '/mi-rutina',
    icon: <CalendarCheck className="w-5 h-5" />,
    roles: ['ALUMNO'],
  },
  {
    label: 'Mis Pagos y Cuotas',
    href: '/mis-pagos',
    icon: <Receipt className="w-5 h-5" />,
    roles: ['ALUMNO'],
  },
];

export interface SidebarProps {
  role: Role;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ role, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const filteredNav = NAV_ITEMS.filter((item) => item.roles.includes(role));

  const roleBadgeVariant: Record<Role, 'purple' | 'blue' | 'emerald'> = {
    ADMIN: 'purple',
    PROFESOR: 'blue',
    ALUMNO: 'emerald',
  };

  return (
    <>
      {/* Backdrop para móviles */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 border-r border-zinc-800/80 bg-zinc-950/95 backdrop-blur-xl flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800/80">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-zinc-950 shadow-lg shadow-emerald-950/50">
              <Dumbbell className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-zinc-100 uppercase">
                Feltrin Gym
              </span>
              <p className="text-[10px] text-zinc-400 font-medium">Training Center</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rol Badge indicator */}
        <div className="px-6 py-3 border-b border-zinc-900 flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Rol Activo
          </span>
          <Badge variant={roleBadgeVariant[role]} size="sm">
            {ROLE_LABELS[role]}
          </Badge>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredNav.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80'
                }`}
              >
                <span
                  className={isActive ? 'text-emerald-400' : 'text-zinc-400 group-hover:text-zinc-200'}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-zinc-900 text-center">
          <p className="text-[11px] text-zinc-400">Feltrin Gym v1.0 • Coolify Edition</p>
        </div>
      </aside>
    </>
  );
}

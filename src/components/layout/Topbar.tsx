'use client';

import React, { useTransition } from 'react';
import { Menu, LogOut, User as UserIcon, Dumbbell } from 'lucide-react';
import type { SessionUser } from '@/types';
import { logoutAction } from '@/app/actions/auth.actions';
import { ROLE_LABELS } from '@/types';

export interface TopbarProps {
  user: SessionUser;
  onOpenSidebar: () => void;
}

export function Topbar({ user, onOpenSidebar }: TopbarProps) {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="p-2 -ml-1 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 lg:hidden cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-zinc-950 font-bold lg:hidden shadow-sm shadow-emerald-950/50">
            <Dumbbell className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-200 lg:hidden">
            Feltrin Gym
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 hidden lg:inline-block">
            Centro de Entrenamiento Feltrin
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* User Card */}
        <div className="flex items-center gap-3 pl-2">
          <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-300 font-semibold text-xs overflow-hidden">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-4 h-4 text-zinc-400" />
            )}
          </div>

          <div className="hidden sm:block text-left">
            <div className="text-sm font-semibold text-zinc-200 leading-tight">
              {user.fullName}
            </div>
            <div className="text-[11px] text-zinc-400">
              {ROLE_LABELS[user.role]} • {user.email}
            </div>
          </div>
        </div>

        {/* Botón Logout */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isPending}
          className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer border border-transparent hover:border-rose-900/50 min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

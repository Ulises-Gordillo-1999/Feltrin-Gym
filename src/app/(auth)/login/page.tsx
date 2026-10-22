'use client';

import React, { useActionState, useState } from 'react';
import { Dumbbell, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, GraduationCap } from 'lucide-react';
import { loginAction } from '@/app/actions/auth.actions';
import { IDLE } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, IDLE);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const fillCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Luces de fondo ambientales */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 items-center justify-center text-zinc-950 shadow-2xl shadow-emerald-500/20 mb-4">
            <Dumbbell className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Centro de Entrenamiento Feltrin
          </h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            Ingresá a tu cuenta para gestionar el gimnasio o tu rutina
          </p>
        </div>

        {/* Card de Login */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/80">
          <form action={formAction} className="space-y-4">
            {state.status === 'error' && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-900/70 text-rose-300 text-xs font-medium">
                {state.message}
              </div>
            )}

            <Input
              label="Correo Electrónico"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@feltrin.com"
              autoComplete="email"
              required
              leftIcon={<Mail className="w-4 h-4" />}
              error={state.status === 'error' ? state.fieldErrors?.email : undefined}
            />

            <Input
              label="Contraseña"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              leftIcon={<Lock className="w-4 h-4" />}
              error={state.status === 'error' ? state.fieldErrors?.password : undefined}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isPending}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Ingresar al Sistema
              </Button>
            </div>
          </form>

          {/* Accesos rápidos para testing de roles */}
          <div className="mt-8 pt-6 border-t border-zinc-800/80">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 text-center mb-3">
              Cuentas demo para pruebas rápidas
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin@feltrin.com', 'Admin1234!')}
                className="p-2 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800/90 text-zinc-300 hover:text-zinc-100 text-xs font-medium flex flex-col items-center gap-1.5 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('profe@feltrin.com', 'Profe1234!')}
                className="p-2 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800/90 text-zinc-300 hover:text-zinc-100 text-xs font-medium flex flex-col items-center gap-1.5 transition-all cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-sky-400" />
                <span>Profesor</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('alumno@feltrin.com', 'Alumno1234!')}
                className="p-2 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800/90 text-zinc-300 hover:text-zinc-100 text-xs font-medium flex flex-col items-center gap-1.5 transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Alumno</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-400 mt-6">
          Feltrin Gym • Despliegue optimizado en Coolify v4
        </p>
      </div>
    </div>
  );
}

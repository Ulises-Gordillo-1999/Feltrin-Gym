'use client';

import React, { useActionState, useState } from 'react';
import { Dumbbell, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, GraduationCap, Eye, EyeOff } from 'lucide-react';
import { loginAction } from '@/app/actions/auth.actions';
import { IDLE } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, IDLE);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fillCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Luces de fondo ambientales sutiles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-10 right-10 w-80 h-80 bg-teal-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-emerald-500/5 blur-3xl pointer-events-none" />

      {/* Tarjeta Unificada de Acceso */}
      <div className="w-full max-w-md relative z-10">
        <div className="rounded-3xl border border-zinc-800/90 bg-zinc-900/70 backdrop-blur-2xl p-7 sm:p-9 shadow-2xl shadow-black/90 ring-1 ring-white/5">
          {/* Header de Marca Integrado */}
          <div className="text-center">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 items-center justify-center text-zinc-950 shadow-xl shadow-emerald-500/20 mb-4 ring-4 ring-emerald-500/10">
              <Dumbbell className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              Centro de Entrenamiento Feltrin
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Ingresá tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Divisor sutil */}
          <div className="my-6 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

          {/* Formulario de Login */}
          <form action={formAction} className="space-y-4">
            {state.status === 'error' && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-900/80 text-rose-300 text-xs font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <span>{state.message}</span>
              </div>
            )}

            <Input
              label="Correo Electrónico"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              required
              leftIcon={<Mail className="w-4 h-4" />}
              error={state.status === 'error' ? state.fieldErrors?.email : undefined}
            />

            <Input
              label="Contraseña"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 focus:outline-none transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
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

          {/* Badge de Seguridad */}
          <div className="mt-6 pt-5 border-t border-zinc-800/60 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Acceso seguro y encriptado</span>
          </div>

          {/* Accesos rápidos para testing de roles (desactivados en producción) */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="mt-6 pt-5 border-t border-zinc-800/80">
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
          )}
        </div>

        <p className="text-center text-[11px] text-zinc-400 mt-5">
          Feltrin Gym • Panel de Gestión
        </p>
      </div>
    </div>
  );
}

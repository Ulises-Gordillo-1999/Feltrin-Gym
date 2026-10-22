import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'rose' | 'orange' | 'zinc' | 'blue' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export function Badge({
  children,
  variant = 'zinc',
  size = 'md',
  className = '',
  dot = false,
}: BadgeProps) {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  }[size];

  const variantClasses = {
    emerald: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
    amber: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
    rose: 'bg-rose-950/60 text-rose-400 border-rose-800/60',
    orange: 'bg-orange-950/60 text-orange-400 border-orange-800/60',
    zinc: 'bg-zinc-800/70 text-zinc-300 border-zinc-700/60',
    blue: 'bg-sky-950/60 text-sky-400 border-sky-800/60',
    purple: 'bg-purple-950/60 text-purple-400 border-purple-800/60',
  }[variant];

  const dotClasses = {
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400 animate-pulse',
    rose: 'bg-rose-500',
    orange: 'bg-orange-400',
    zinc: 'bg-zinc-400',
    blue: 'bg-sky-400',
    purple: 'bg-purple-400',
  }[variant];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantClasses} ${sizeClasses} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotClasses}`} />}
      <span>{children}</span>
    </span>
  );
}

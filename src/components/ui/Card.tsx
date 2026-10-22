import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = false, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md p-6 shadow-xl shadow-black/40 ${
        hover ? 'hover:border-zinc-700/80 hover:bg-zinc-900/70 transition-all duration-200' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

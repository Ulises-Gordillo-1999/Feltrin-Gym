'use client';

import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, Info } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const isDanger = variant === 'danger';

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="flex items-start gap-4">
        <div
          className={`p-3 rounded-xl border ${
            isDanger
              ? 'bg-rose-950/40 border-rose-900/60 text-rose-400'
              : 'bg-amber-950/40 border-amber-900/60 text-amber-400'
          }`}
        >
          {isDanger ? (
            <AlertTriangle className="w-6 h-6" />
          ) : (
            <Info className="w-6 h-6" />
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/80 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors shadow-lg cursor-pointer disabled:opacity-50 flex items-center gap-2 ${
            isDanger
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
              : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/40'
          }`}
        >
          {isLoading && (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

'use client';

import React, { useState, useTransition, useEffect } from 'react';
import {
  MessageCircle,
  Send,
  Phone,
  AlertCircle,
  Check,
  RotateCcw,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cleanWhatsAppPhone, buildWhatsAppUrl } from '@/utils/whatsapp';
import { recordReminderSentAction } from '@/app/actions/reminders.actions';
import type { ReminderType } from '@/db/schema';

export interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  rawPhone: string | null | undefined;
  planName?: string | null;
  reminderType: ReminderType;
  defaultMessage: string;
  membershipExpiresAtSnapshot?: string | null;
  lastReminderSentAt?: string | null;
  onSuccess?: () => void;
}

export function WhatsAppModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  rawPhone,
  planName,
  reminderType,
  defaultMessage,
  membershipExpiresAtSnapshot,
  lastReminderSentAt,
  onSuccess,
}: WhatsAppModalProps) {
  const [phone, setPhone] = useState(rawPhone || '');
  const [message, setMessage] = useState(defaultMessage);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    setPhone(rawPhone || '');
    setMessage(defaultMessage);
    setErrorMsg(null);
    setSentSuccess(false);
  }, [rawPhone, defaultMessage, isOpen]);

  const cleanPhone = cleanWhatsAppPhone(phone);
  const isValidPhone = Boolean(cleanPhone && cleanPhone.length >= 10);
  const waUrl = isValidPhone ? buildWhatsAppUrl(phone, message) : null;

  const handleSend = () => {
    if (!cleanPhone || !waUrl) {
      setErrorMsg('Por favor ingresa un número de teléfono válido.');
      return;
    }

    if (!message.trim()) {
      setErrorMsg('El mensaje no puede estar vacío.');
      return;
    }

    setErrorMsg(null);

    startTransition(async () => {
      // Registrar en el historial de BD
      const res = await recordReminderSentAction({
        studentId,
        type: reminderType,
        recipientPhone: cleanPhone,
        message,
        membershipExpiresAtSnapshot,
      });

      if (res.ok) {
        setSentSuccess(true);
        // Abrir WhatsApp en nueva pestaña
        window.open(waUrl, '_blank', 'noopener,noreferrer');
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.error || 'Error al registrar recordatorio.');
      }
    });
  };

  const handleResetMessage = () => {
    setMessage(defaultMessage);
  };

  const typeBadgeVariant =
    reminderType === 'VENCIDA' ? 'rose' : reminderType === 'POR_VENCER' ? 'amber' : 'emerald';
  const typeLabel =
    reminderType === 'VENCIDA'
      ? 'Cuota Vencida'
      : reminderType === 'POR_VENCER'
        ? 'Cuota Por Vencer'
        : 'Comprobante de Pago';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enviar Mensaje por WhatsApp"
      description={`Notificación para ${studentName}`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Encabezado informativo */}
        <div className="p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-100">{studentName}</div>
              <div className="text-xs text-zinc-400">
                {planName ? `Plan: ${planName}` : 'Sin plan activo'}
              </div>
            </div>
          </div>
          <Badge variant={typeBadgeVariant}>{typeLabel}</Badge>
        </div>

        {/* Alerta de último envío */}
        {lastReminderSentAt && (
          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>
              Último mensaje enviado:{' '}
              <strong className="text-zinc-200">
                {new Date(lastReminderSentAt).toLocaleString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>
            </span>
          </div>
        )}

        {/* Campo de Teléfono */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Teléfono de Contacto (WhatsApp)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Phone className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej. 11 4444-5555 o 341 612-3456"
              className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            {cleanPhone ? (
              <span className="text-emerald-400 font-mono">
                Formato WhatsApp: +{cleanPhone}
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Ingresa un teléfono con código de área
              </span>
            )}
            <span className="text-zinc-500">Prefijo Argentina auto (+54 9)</span>
          </div>
        </div>

        {/* Mensaje editable */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Mensaje Personalizado
            </label>
            <button
              type="button"
              onClick={handleResetMessage}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar plantilla</span>
            </button>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-xl p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 leading-relaxed resize-none font-sans"
          />
          <div className="mt-1 text-right text-[11px] text-zinc-500">
            {message.length} caracteres
          </div>
        </div>

        {/* Mensaje de error o éxito */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {sentSuccess && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>¡Registrado! Abriendo WhatsApp...</span>
          </div>
        )}

        {/* Botones de acción */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-800">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={!isValidPhone || isPending || sentSuccess}
            className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40"
          >
            {isPending ? (
              <span>Registrando...</span>
            ) : sentSuccess ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                <span>Enviado</span>
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4 mr-2" />
                <span>Abrir WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-70" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

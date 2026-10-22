'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  Search,
  ExternalLink,
  Send,
  UserX,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/format';
import {
  getPendingRemindersAction,
  type PendingReminderItem,
} from '@/app/actions/reminders.actions';
import { WhatsAppModal } from '@/components/reminders/WhatsAppModal';
import type { ReminderType } from '@/db/schema';

export interface DailyRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DailyRemindersModal({ isOpen, onClose }: DailyRemindersModalProps) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PendingReminderItem[]>([]);
  const [gymName, setGymName] = useState('Centro de Entrenamiento Feltrin');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'SENT'>('ALL');

  // Estado del modal individual de WhatsApp
  const [selectedStudent, setSelectedStudent] = useState<PendingReminderItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    const res = await getPendingRemindersAction();
    if (res.ok) {
      setItems(res.data.reminders);
      setGymName(res.data.gymName);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const filteredItems = items.filter((item) => {
    const fullName = `${item.firstName} ${item.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(search.toLowerCase()) || item.dni.includes(search);
    if (!matchesSearch) return false;

    if (filter === 'PENDING') return !item.alreadySentToday;
    if (filter === 'SENT') return item.alreadySentToday;
    return true;
  });

  const pendingCount = items.filter((x) => !x.alreadySentToday).length;
  const sentCount = items.filter((x) => x.alreadySentToday).length;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Bandeja Diaria de Recordatorios WhatsApp"
        description="Detecta automáticamente alumnos con cuota por vencer o vencida para contactarlos"
        maxWidth="3xl"
      >
        <div className="space-y-4">
          {/* Barra de estadísticas y filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-xs text-zinc-400">Total en Alerta</div>
                <div className="text-lg font-bold text-zinc-100">{items.length}</div>
              </div>
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>

            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-xs text-zinc-400">Pendientes Hoy</div>
                <div className="text-lg font-bold text-amber-400">{pendingCount}</div>
              </div>
              <Clock className="w-5 h-5 text-amber-400" />
            </div>

            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-xs text-zinc-400">Notificados Hoy</div>
                <div className="text-lg font-bold text-emerald-400">{sentCount}</div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          {/* Filtros y búsqueda */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between pt-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nombre o DNI..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800 self-start">
              <button
                type="button"
                onClick={() => setFilter('ALL')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  filter === 'ALL'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Todos ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('PENDING')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  filter === 'PENDING'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Pendientes ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('SENT')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  filter === 'SENT'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Enviados ({sentCount})
              </button>
            </div>
          </div>

          {/* Listado de alumnos */}
          <div className="border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800/80 max-h-[380px] overflow-y-auto">
            {loading ? (
              <div className="py-12 text-center text-xs text-zinc-400">
                Calculando recordatorios...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-400 flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400/60" />
                <span>No hay alumnos en la bandeja para los filtros seleccionados.</span>
              </div>
            ) : (
              filteredItems.map((item) => {
                const statusBadge =
                  item.status === 'VENCIDA' ? (
                    <Badge variant="rose" dot>
                      Vencida
                    </Badge>
                  ) : item.status === 'EN_GRACIA' ? (
                    <Badge variant="orange" dot>
                      En Gracia
                    </Badge>
                  ) : (
                    <Badge variant="amber" dot>
                      Por Vencer
                    </Badge>
                  );

                return (
                  <div
                    key={item.studentId}
                    className="p-3.5 hover:bg-zinc-900/60 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-zinc-100 truncate">
                          {item.lastName}, {item.firstName}
                        </span>
                        {statusBadge}
                      </div>

                      <div className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Plan: {item.currentPlanName || 'Sin plan'}</span>
                        <span>•</span>
                        <span>Vence: {formatDate(item.membershipExpiresAt)}</span>
                        <span>•</span>
                        {item.cleanPhone ? (
                          <span className="font-mono text-zinc-300 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-400" />
                            {item.phone}
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1">
                            <UserX className="w-3 h-3" />
                            Sin teléfono cargado
                          </span>
                        )}
                      </div>

                      {item.alreadySentToday && item.lastReminderSentAt && (
                        <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            Notificado hoy a las{' '}
                            {new Date(item.lastReminderSentAt).toLocaleTimeString('es-AR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Botón de Enviar WhatsApp */}
                    <div className="shrink-0">
                      {item.cleanPhone ? (
                        <Button
                          size="sm"
                          variant={item.alreadySentToday ? 'secondary' : 'primary'}
                          onClick={() => setSelectedStudent(item)}
                          className={
                            item.alreadySentToday
                              ? 'border-zinc-700 text-zinc-300'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40'
                          }
                        >
                          <MessageCircle className="w-4 h-4 mr-1.5" />
                          <span>{item.alreadySentToday ? 'Reenviar' : 'Enviar WhatsApp'}</span>
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" disabled title="No tiene teléfono registrado">
                          <Phone className="w-3.5 h-3.5 mr-1 text-zinc-600" />
                          <span className="text-xs text-zinc-600">Sin número</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-800">
            <span>
              Mensajes generados desde plantillas oficiales de <strong>{gymName}</strong>.
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal individual para editar/enviar */}
      {selectedStudent && (
        <WhatsAppModal
          isOpen={Boolean(selectedStudent)}
          onClose={() => setSelectedStudent(null)}
          studentId={selectedStudent.studentId}
          studentName={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
          rawPhone={selectedStudent.phone}
          planName={selectedStudent.currentPlanName}
          reminderType={selectedStudent.status === 'POR_VENCER' ? 'POR_VENCER' : 'VENCIDA'}
          defaultMessage={selectedStudent.defaultMessage}
          membershipExpiresAtSnapshot={selectedStudent.membershipExpiresAt}
          lastReminderSentAt={selectedStudent.lastReminderSentAt}
          onSuccess={() => {
            loadData();
          }}
        />
      )}
    </>
  );
}

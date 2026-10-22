import React from 'react';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { students, membershipPayments } from '@/db/schema';
import { requireRole } from '@/utils/session';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/utils/format';
import { getMembershipStatus } from '@/utils/membership';
import { CreditCard, Download, Receipt, AlertCircle } from 'lucide-react';

export default async function MisPagosPage() {
  const session = await requireRole('ALUMNO');

  const student = await db.query.students.findFirst({
    where: eq(students.userId, session.id),
    with: {
      currentPlan: true,
      payments: {
        orderBy: [desc(membershipPayments.paidAt)],
      },
    },
  });

  if (!student) {
    return (
      <Card className="py-16 text-center max-w-lg mx-auto">
        <Receipt className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-zinc-100">Sin Ficha de Alumno</h2>
        <p className="text-xs text-zinc-400 mt-2">
          Comunicate con recepción para asociar tu legajo de alumno.
        </p>
      </Card>
    );
  }

  const statusInfo = getMembershipStatus(student.membershipExpiresAt);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          Mis Pagos y Membresía
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Consulta el estado de tu cuota y descargá tus comprobantes de pago oficiales en PDF.
        </p>
      </div>

      {/* Tarjeta de Estado Actual */}
      <Card className="bg-gradient-to-br from-zinc-900/90 to-zinc-950 border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-zinc-800 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                Plan Activo
              </span>
              <h2 className="text-xl font-bold text-zinc-100">
                {student.currentPlan?.name || 'Sin plan asignado'}
              </h2>
            </div>
          </div>

          <Badge
            variant={
              statusInfo.status === 'AL_DIA'
                ? 'emerald'
                : statusInfo.status === 'POR_VENCER'
                ? 'amber'
                : statusInfo.status === 'EN_GRACIA'
                ? 'orange'
                : 'rose'
            }
            dot
          >
            {statusInfo.label}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <span className="text-[11px] text-zinc-400 block">Fecha Último Pago</span>
            <span className="text-sm font-semibold text-zinc-100 mt-1 block">
              {formatDate(student.lastPaymentAt)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <span className="text-[11px] text-zinc-400 block">Fecha de Vencimiento</span>
            <span className="text-sm font-semibold text-zinc-100 mt-1 block">
              {formatDate(student.membershipExpiresAt)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <span className="text-[11px] text-zinc-400 block">Días Restantes</span>
            <span
              className={`text-sm font-extrabold mt-1 block ${
                statusInfo.status === 'AL_DIA'
                  ? 'text-emerald-400'
                  : statusInfo.status === 'POR_VENCER'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {statusInfo.daysRemaining !== null
                ? statusInfo.daysRemaining >= 0
                  ? `${statusInfo.daysRemaining} días`
                  : `Venció hace ${Math.abs(statusInfo.daysRemaining)} días`
                : '—'}
            </span>
          </div>
        </div>
      </Card>

      {/* Historial de Pagos */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-100">
            Historial de Cuotas Pagadas
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Descargá el comprobante digital de cualquiera de tus pagos anteriores.
          </p>
        </div>

        {student.payments.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            No se registran pagos en tu historial.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Recibo N°</th>
                  <th className="py-3 px-4">Fecha de Pago</th>
                  <th className="py-3 px-4">Plan / Concepto</th>
                  <th className="py-3 px-4">Período de Cobertura</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4">Monto</th>
                  <th className="py-3 px-4 text-right">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {student.payments.map((p) => {
                  const isVoid = p.status === 'ANULADO';
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-zinc-900/40 transition-colors ${
                        isVoid ? 'opacity-50 line-through' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-xs text-zinc-300">
                        #{String(p.receiptNumber).padStart(6, '0')}
                      </td>
                      <td className="py-3 px-4 text-xs text-zinc-300">
                        {formatDate(p.paidAt)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-zinc-200">
                        {p.planNameSnapshot}
                      </td>
                      <td className="py-3 px-4 text-xs text-zinc-300">
                        {formatDate(p.periodStart)} al {formatDate(p.periodEnd)}
                      </td>
                      <td className="py-3 px-4 text-xs text-zinc-400">
                        {p.paymentMethod.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-400 text-sm">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={`/api/pdf/receipt/${p.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Descargar PDF</span>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

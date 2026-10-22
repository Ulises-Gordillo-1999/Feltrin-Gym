import { addDuration, diffInDays, getTodayBusinessDate } from './dates';

export type MembershipStatusType =
  | 'AL_DIA'
  | 'POR_VENCER'
  | 'EN_GRACIA'
  | 'VENCIDA'
  | 'SIN_PAGOS';

export interface MembershipStatusInfo {
  status: MembershipStatusType;
  label: string;
  daysRemaining: number | null;
  badgeClass: string;
  dotColor: string;
}

/**
 * Calcula el nuevo período y fecha de vencimiento según las reglas acordadas:
 * - Si tiene vencimiento activo o dentro del período de gracia (<= gracePeriodDays),
 *   el nuevo período inicia en el vencimiento actual (renovación continua).
 * - Si está vencido más allá del período de gracia o no tiene pagos previos,
 *   el nuevo período inicia hoy.
 */
export function calculatePaymentPeriod(options: {
  currentExpiry: string | null;
  durationValue: number;
  durationUnit: 'DIA' | 'MES';
  gracePeriodDays: number;
  todayDate?: string;
}): { periodStart: string; periodEnd: string } {
  const today = options.todayDate ?? getTodayBusinessDate();
  const currentExpiry = options.currentExpiry;

  let periodStart = today;

  if (currentExpiry) {
    const daysSinceExpiry = diffInDays(today, currentExpiry);
    // Si hoy <= vencimiento + gracePeriodDays (es decir daysSinceExpiry <= gracePeriodDays)
    // Se mantiene la continuidad desde el vencimiento anterior
    if (daysSinceExpiry <= options.gracePeriodDays) {
      // Si el vencimiento es posterior a hoy, o está dentro de la gracia
      periodStart = currentExpiry;
    }
  }

  const periodEnd = addDuration(periodStart, options.durationValue, options.durationUnit);
  return { periodStart, periodEnd };
}

/**
 * Evalúa el estado visual de la membresía de un alumno.
 */
export function getMembershipStatus(
  expiresAt: string | null,
  gracePeriodDays = 3,
  warningDays = 5,
  todayDate?: string,
): MembershipStatusInfo {
  if (!expiresAt) {
    return {
      status: 'SIN_PAGOS',
      label: 'Sin pagos registrados',
      daysRemaining: null,
      badgeClass: 'bg-zinc-800 text-zinc-400 border-zinc-700',
      dotColor: 'bg-zinc-500',
    };
  }

  const today = todayDate ?? getTodayBusinessDate();
  // diasRestantes = expiresAt - today
  const daysRemaining = diffInDays(expiresAt, today);

  if (daysRemaining > warningDays) {
    return {
      status: 'AL_DIA',
      label: `Al día (${daysRemaining} días)`,
      daysRemaining,
      badgeClass: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
      dotColor: 'bg-emerald-400',
    };
  }

  if (daysRemaining >= 0 && daysRemaining <= warningDays) {
    const label =
      daysRemaining === 0 ? 'Vence hoy' : daysRemaining === 1 ? 'Vence mañana' : `Vence en ${daysRemaining} días`;
    return {
      status: 'POR_VENCER',
      label,
      daysRemaining,
      badgeClass: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
      dotColor: 'bg-amber-400 animate-pulse',
    };
  }

  // Si venció hace pocos días (dentro de los días de gracia)
  const daysOverdue = Math.abs(daysRemaining);
  if (daysOverdue <= gracePeriodDays) {
    return {
      status: 'EN_GRACIA',
      label: `En gracia (venció hace ${daysOverdue} ${daysOverdue === 1 ? 'día' : 'días'})`,
      daysRemaining,
      badgeClass: 'bg-orange-950/60 text-orange-400 border-orange-800/60',
      dotColor: 'bg-orange-400',
    };
  }

  return {
    status: 'VENCIDA',
    label: `Vencida (hace ${daysOverdue} días)`,
    daysRemaining,
    badgeClass: 'bg-rose-950/60 text-rose-400 border-rose-800/60',
    dotColor: 'bg-rose-500',
  };
}

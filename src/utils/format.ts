import { GYM_TIMEZONE } from './dates';

/**
 * Formatea un número como moneda en Pesos Argentinos (ARS)
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(num)) return '$ 0';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Formatea una fecha YYYY-MM-DD o Date a formato legible argentino: DD/MM/AAAA
 */
export function formatDate(
  dateValue: string | Date | null | undefined,
  options?: { includeDayOfWeek?: boolean },
): string {
  if (!dateValue) return '—';

  let dateObj: Date;
  if (typeof dateValue === 'string') {
    const [y, m, d] = dateValue.split('T')[0].split('-').map(Number);
    if (!y || !m || !d) return '—';
    dateObj = new Date(y, m - 1, d);
  } else {
    dateObj = dateValue;
  }

  if (isNaN(dateObj.getTime())) return '—';

  if (options?.includeDayOfWeek) {
    return new Intl.DateTimeFormat('es-AR', {
      timeZone: GYM_TIMEZONE,
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(dateObj);
  }

  return new Intl.DateTimeFormat('es-AR', {
    timeZone: GYM_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj);
}

/**
 * Formatea fecha y hora completa
 */
export function formatDateTime(dateValue: string | Date | null | undefined): string {
  if (!dateValue) return '—';
  const d = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  if (isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('es-AR', {
    timeZone: GYM_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Formatea DNI argentino con puntos (ej. 42.123.456)
 */
export function formatDni(dni: string | number | null | undefined): string {
  if (!dni) return '—';
  const clean = String(dni).replace(/\D/g, '');
  if (!clean) return String(dni);
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

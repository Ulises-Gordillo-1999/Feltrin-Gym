import type { DayOfWeek } from '@/db/schema';

export const GYM_TIMEZONE = process.env.TZ || 'America/Argentina/Buenos_Aires';

const DAY_OF_WEEK_MAP: Record<number, DayOfWeek> = {
  0: 'DOMINGO',
  1: 'LUNES',
  2: 'MARTES',
  3: 'MIERCOLES',
  4: 'JUEVES',
  5: 'VIERNES',
  6: 'SABADO',
};

/**
 * Retorna la fecha actual como string YYYY-MM-DD según la zona horaria del gimnasio.
 */
export function getTodayBusinessDate(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: GYM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

/**
 * Retorna el día de la semana actual según la zona horaria del gimnasio.
 */
export function getCurrentDayOfWeek(): DayOfWeek {
  const now = new Date();
  // Obtener nombre corto o día de la semana en la TZ del gimnasio
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: GYM_TIMEZONE,
    weekday: 'short',
  }).format(now);

  const dayMap: Record<string, DayOfWeek> = {
    Sun: 'DOMINGO',
    Mon: 'LUNES',
    Tue: 'MARTES',
    Wed: 'MIERCOLES',
    Thu: 'JUEVES',
    Fri: 'VIERNES',
    Sat: 'SABADO',
  };

  return dayMap[parts] ?? 'LUNES';
}

/**
 * Convierte un Date o string a YYYY-MM-DD
 */
export function toISODate(d: Date | string): string {
  if (typeof d === 'string') {
    return d.slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
}

/**
 * Suma días o meses a una fecha YYYY-MM-DD de forma pura sin desfasajes de UTC.
 */
export function addDuration(
  dateStr: string,
  value: number,
  unit: 'DIA' | 'MES',
): string {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-based
  const day = parseInt(dayStr, 10);

  const d = new Date(year, month, day);

  if (unit === 'DIA') {
    d.setDate(d.getDate() + value);
  } else {
    d.setMonth(d.getMonth() + value);
  }

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dayOut = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dayOut}`;
}

/**
 * Diferencia en días enteros (dateA - dateB)
 */
export function diffInDays(dateStrA: string, dateStrB: string): number {
  const [yA, mA, dA] = dateStrA.split('-').map(Number);
  const [yB, mB, dB] = dateStrB.split('-').map(Number);

  const a = Date.UTC(yA, mA - 1, dA);
  const b = Date.UTC(yB, mB - 1, dB);

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((a - b) / msPerDay);
}

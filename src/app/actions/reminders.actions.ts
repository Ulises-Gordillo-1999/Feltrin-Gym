'use server';

import { revalidatePath } from 'next/cache';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  students,
  gymSettings,
  membershipPlans,
  membershipReminders,
  users,
  type ReminderType,
} from '@/db/schema';
import { requireRole } from '@/utils/session';
import { getTodayBusinessDate, addDuration } from '@/utils/dates';
import { cleanWhatsAppPhone, renderWhatsAppMessage, buildWhatsAppUrl } from '@/utils/whatsapp';
import { formatCurrency, formatDate } from '@/utils/format';
import type { ActionResult } from '@/types';

export interface PendingReminderItem {
  studentId: string;
  firstName: string;
  lastName: string;
  dni: string;
  phone: string | null;
  cleanPhone: string | null;
  currentPlanName: string | null;
  membershipExpiresAt: string;
  status: 'POR_VENCER' | 'VENCIDA' | 'EN_GRACIA';
  lastReminderSentAt: string | null;
  alreadySentToday: boolean;
  defaultMessage: string;
  whatsappUrl: string | null;
}

/**
 * Obtiene la lista calculada de alumnos con cuotas por vencer o vencidas,
 * junto con la plantilla pre-renderizada y estado de si ya fueron notificados hoy.
 */
export async function getPendingRemindersAction(): Promise<
  ActionResult<{
    reminders: PendingReminderItem[];
    gymName: string;
    totalPending: number;
    totalSentToday: number;
  }>
> {
  const session = await requireRole(['ADMIN', 'PROFESOR']);
  if (!session) {
    return { ok: false, error: 'No autorizado.' };
  }

  try {
    const settings = await db.query.gymSettings.findFirst();
    const gymName = settings?.gymName || 'Centro de Entrenamiento Feltrin';
    const warningDays = settings?.expiryWarningDays ?? 5;
    const graceDays = settings?.gracePeriodDays ?? 3;
    const today = getTodayBusinessDate();

    // Ventana de vencimiento: desde (hoy - graceDays - 30 días) hasta (hoy + warningDays)
    const maxExpiryDate = addDuration(today, warningDays, 'DIA');
    const minExpiryDate = addDuration(today, -(graceDays + 30), 'DIA');

    // Alumnos activos con fecha de vencimiento dentro del rango
    const rawStudents = await db.query.students.findMany({
      where: and(
        eq(students.status, 'ACTIVO'),
        gte(students.membershipExpiresAt, minExpiryDate),
        lte(students.membershipExpiresAt, maxExpiryDate),
      ),
      with: {
        currentPlan: true,
      },
    });

    // Recordatorios enviados en las últimas 24 horas para cotejar
    const recentReminders = await db.query.membershipReminders.findMany({
      where: gte(membershipReminders.sentAt, sql`NOW() - INTERVAL '24 hours'`),
    });

    const recentReminderMap = new Map<string, typeof recentReminders[number]>();
    for (const r of recentReminders) {
      recentReminderMap.set(r.studentId, r);
    }

    const items: PendingReminderItem[] = [];

    for (const st of rawStudents) {
      if (!st.membershipExpiresAt) continue;

      const isExpired = st.membershipExpiresAt < today;
      const status: 'POR_VENCER' | 'VENCIDA' | 'EN_GRACIA' = isExpired
        ? st.membershipExpiresAt >= addDuration(today, -graceDays, 'DIA')
          ? 'EN_GRACIA'
          : 'VENCIDA'
        : 'POR_VENCER';

      const reminderType: ReminderType = isExpired ? 'VENCIDA' : 'POR_VENCER';
      const template = isExpired
        ? settings?.waTemplateExpired ||
          'Hola {nombre}, te recordamos desde {gimnasio} que tu cuota de {plan} venció el {fecha_vencimiento}. Podés acercarte a recepción o transferir para regularizarla.'
        : settings?.waTemplateExpiring ||
          '¡Hola {nombre}! Te recordamos desde {gimnasio} que tu cuota de {plan} vence el {fecha_vencimiento}. ¡Te esperamos para renovar!';

      const defaultMessage = renderWhatsAppMessage(template, {
        nombre: st.firstName,
        gimnasio: gymName,
        plan: st.currentPlan?.name || 'Membresía',
        fecha_vencimiento: formatDate(st.membershipExpiresAt),
      });

      const cleanPhone = cleanWhatsAppPhone(st.phone);
      const whatsappUrl = cleanPhone ? buildWhatsAppUrl(cleanPhone, defaultMessage) : null;

      const lastReminder = recentReminderMap.get(st.id);
      const alreadySentToday = Boolean(lastReminder);

      items.push({
        studentId: st.id,
        firstName: st.firstName,
        lastName: st.lastName,
        dni: st.dni,
        phone: st.phone,
        cleanPhone,
        currentPlanName: st.currentPlan?.name ?? null,
        membershipExpiresAt: st.membershipExpiresAt,
        status,
        lastReminderSentAt: lastReminder ? lastReminder.sentAt.toISOString() : null,
        alreadySentToday,
        defaultMessage,
        whatsappUrl,
      });
    }

    // Ordenar: primero los no enviados hoy, luego por fecha de vencimiento ascendente
    items.sort((a, b) => {
      if (a.alreadySentToday !== b.alreadySentToday) {
        return a.alreadySentToday ? 1 : -1;
      }
      return a.membershipExpiresAt.localeCompare(b.membershipExpiresAt);
    });

    const totalSentToday = items.filter((x) => x.alreadySentToday).length;
    const totalPending = items.filter((x) => !x.alreadySentToday && x.cleanPhone).length;

    return {
      ok: true,
      data: {
        reminders: items,
        gymName,
        totalPending,
        totalSentToday,
      },
    };
  } catch (error) {
    console.error('Error in getPendingRemindersAction:', error);
    return { ok: false, error: 'No se pudieron calcular los recordatorios.' };
  }
}

/**
 * Registra que un recordatorio fue disparado hacia WhatsApp,
 * guardando trazabilidad en la tabla membership_reminders.
 */
export async function recordReminderSentAction(data: {
  studentId: string;
  type: ReminderType;
  recipientPhone: string;
  message: string;
  membershipExpiresAtSnapshot?: string | null;
}): Promise<ActionResult<{ reminderId: string }>> {
  const session = await requireRole(['ADMIN', 'PROFESOR']);
  if (!session) {
    return { ok: false, error: 'No autorizado.' };
  }

  try {
    const [created] = await db
      .insert(membershipReminders)
      .values({
        studentId: data.studentId,
        type: data.type,
        channel: 'WHATSAPP',
        recipientPhone: data.recipientPhone,
        message: data.message,
        membershipExpiresAtSnapshot: data.membershipExpiresAtSnapshot || null,
        sentById: session.id,
      })
      .returning({ id: membershipReminders.id });

    revalidatePath('/dashboard');
    revalidatePath(`/alumnos/${data.studentId}`);

    return {
      ok: true,
      message: 'Recordatorio registrado correctamente.',
      data: { reminderId: created.id },
    };
  } catch (error) {
    console.error('Error in recordReminderSentAction:', error);
    return { ok: false, error: 'No se pudo registrar el recordatorio.' };
  }
}

/**
 * Obtiene el historial de recordatorios enviados a un alumno.
 */
export async function getStudentRemindersHistoryAction(studentId: string) {
  await requireRole(['ADMIN', 'PROFESOR']);

  try {
    const list = await db.query.membershipReminders.findMany({
      where: eq(membershipReminders.studentId, studentId),
      orderBy: [desc(membershipReminders.sentAt)],
      limit: 15,
      with: {
        sentBy: true,
      },
    });

    return {
      status: 'success' as const,
      data: list.map((r) => ({
        id: r.id,
        type: r.type,
        recipientPhone: r.recipientPhone,
        message: r.message,
        sentAt: r.sentAt.toISOString(),
        sentByName: r.sentBy.fullName,
      })),
    };
  } catch (error) {
    console.error('Error in getStudentRemindersHistoryAction:', error);
    return { status: 'error' as const, message: 'Error al consultar historial.' };
  }
}

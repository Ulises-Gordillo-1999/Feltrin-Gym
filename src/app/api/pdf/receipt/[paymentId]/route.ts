import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { membershipPayments, gymSettings, students } from '@/db/schema';
import { getSession } from '@/utils/session';
import { generatePaymentReceiptPdf } from '@/utils/pdf/receipt';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ paymentId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return new NextResponse('No autorizado', { status: 401 });
  }

  const { paymentId } = await context.params;

  const payment = await db.query.membershipPayments.findFirst({
    where: eq(membershipPayments.id, paymentId),
    with: {
      student: true,
      plan: true,
      registeredBy: { columns: { fullName: true } },
    },
  });

  if (!payment) {
    return new NextResponse('Comprobante no encontrado', { status: 404 });
  }

  // Si es Alumno, verificar que el comprobante le pertenezca
  if (session.role === 'ALUMNO' && session.studentId !== payment.studentId) {
    return new NextResponse('Acceso denegado a este comprobante', { status: 403 });
  }

  const settings = await db.query.gymSettings.findFirst({
    where: eq(gymSettings.id, 1),
  });

  const pdfBytes = generatePaymentReceiptPdf({
    receiptNumber: payment.receiptNumber,
    paidAt: payment.paidAt,
    gymName: settings?.gymName || 'Centro de Entrenamiento Feltrin',
    gymAddress: settings?.address,
    gymPhone: settings?.phone,
    studentName: `${payment.student.lastName}, ${payment.student.firstName}`,
    studentDni: payment.student.dni,
    planName: payment.planNameSnapshot,
    periodStart: payment.periodStart,
    periodEnd: payment.periodEnd,
    listPrice: payment.listPrice,
    discount: payment.discount,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    registeredByName: payment.registeredBy?.fullName ?? 'Administración',
    notes: payment.notes,
    receiptFooter: settings?.receiptFooter,
  });

  const filename = `recibo-feltrin-${String(payment.receiptNumber).padStart(6, '0')}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  });
}

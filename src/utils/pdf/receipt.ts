import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate, formatDni } from '../format';

export interface PaymentReceiptData {
  receiptNumber: number;
  paidAt: Date | string;
  gymName: string;
  gymAddress?: string | null;
  gymPhone?: string | null;
  studentName: string;
  studentDni: string;
  planName: string;
  periodStart: string;
  periodEnd: string;
  listPrice: number;
  discount: number;
  amount: number;
  paymentMethod: string;
  registeredByName: string;
  notes?: string | null;
  receiptFooter?: string | null;
}

/**
 * Genera un PDF de comprobante de pago de mensualidad.
 * Retorna un ArrayBuffer para que pueda ser enviado como descarga o streamed.
 */
export function generatePaymentReceiptPdf(data: PaymentReceiptData): Uint8Array {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // Comprobante prolijo tamaño A5
  });

  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const accentColor: [number, number, number] = [16, 185, 129]; // Emerald 500

  // Encabezado
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 148, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(data.gymName.toUpperCase(), 10, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const gymSub = [data.gymAddress, data.gymPhone].filter(Boolean).join(' • ');
  if (gymSub) {
    doc.text(gymSub, 10, 18);
  }

  // Número de comprobante a la derecha
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const receiptStr = `RECIBO N° ${String(data.receiptNumber).padStart(6, '0')}`;
  doc.text(receiptStr, 138, 12, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${formatDate(data.paidAt)}`, 138, 18, { align: 'right' });

  // Caja de datos del Alumno
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL ALUMNO', 10, 36);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${data.studentName}`, 10, 42);
  doc.text(`DNI: ${formatDni(data.studentDni)}`, 80, 42);

  // Tabla con el detalle del pago
  autoTable(doc, {
    startY: 48,
    head: [['CONCEPTO / PLAN', 'PERÍODO', 'MÉTODO', 'TOTAL']],
    body: [
      [
        data.planName,
        `${formatDate(data.periodStart)} al ${formatDate(data.periodEnd)}`,
        data.paymentMethod.replace('_', ' '),
        formatCurrency(data.amount),
      ],
    ],
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    theme: 'grid',
    margin: { left: 10, right: 10 },
  });

  let currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Desglose si hubo descuento
  if (data.discount > 0) {
    doc.setFontSize(8);
    doc.text(`Precio de lista: ${formatCurrency(data.listPrice)}`, 138, currentY, { align: 'right' });
    currentY += 4;
    doc.text(`Descuento: -${formatCurrency(data.discount)}`, 138, currentY, { align: 'right' });
    currentY += 5;
  }

  // Total destacado
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(80, currentY, 58, 12, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...accentColor);
  doc.text(`TOTAL PAGADO: ${formatCurrency(data.amount)}`, 134, currentY + 8, { align: 'right' });

  currentY += 20;

  // Notas o receptor
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Cobrado por: ${data.registeredByName}`, 10, currentY);

  if (data.notes) {
    currentY += 5;
    doc.text(`Observaciones: ${data.notes}`, 10, currentY);
  }

  // Pie de página
  const footerText =
    data.receiptFooter || 'Gracias por entrenar con nosotros. Este recibo sirve como comprobante de pago oficial.';
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(footerText, 74, 200, { align: 'center', maxWidth: 128 });

  return doc.output('arraybuffer') as unknown as Uint8Array;
}

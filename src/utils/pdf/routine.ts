import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '../format';

export interface RoutinePdfExercise {
  name: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  load?: string | null;
  restSeconds?: number | null;
  notes?: string | null;
}

export interface RoutinePdfDay {
  dayOfWeek: string;
  title: string;
  exercises: RoutinePdfExercise[];
}

export interface RoutinePdfData {
  gymName: string;
  studentName?: string | null;
  routineName: string;
  goal: string;
  level: string;
  trainerName: string;
  assignedDate?: string | null;
  notes?: string | null;
  days: RoutinePdfDay[];
}

export function generateRoutinePdf(data: RoutinePdfData): Uint8Array {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const emeraldColor: [number, number, number] = [16, 185, 129]; // Emerald 500

  // Encabezado
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(data.gymName.toUpperCase(), 14, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`PLAN DE ENTRENAMIENTO • ${data.routineName}`, 14, 22);

  if (data.studentName) {
    doc.text(`Alumno: ${data.studentName}`, 196, 14, { align: 'right' });
  }
  doc.text(`Profesor: ${data.trainerName}`, 196, 22, { align: 'right' });

  let currentY = 40;

  // Metadata de la rutina
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.text(`Objetivo: ${data.goal}   |   Nivel: ${data.level}   |   Fecha: ${formatDate(data.assignedDate || new Date())}`, 14, currentY);
  currentY += 8;

  if (data.notes) {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Indicaciones: ${data.notes}`, 14, currentY);
    currentY += 8;
  }

  // Iterar por días
  for (const day of data.days) {
    // Si queda poco espacio en la página, salto de página
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFillColor(...emeraldColor);
    doc.rect(14, currentY, 4, 8, 'F');

    doc.setTextColor(...primaryColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${day.dayOfWeek} — ${day.title}`, 22, currentY + 6);
    currentY += 10;

    const tableBody = day.exercises.map((ex, idx) => [
      String(idx + 1),
      ex.name,
      ex.muscleGroup,
      String(ex.sets),
      ex.reps,
      ex.load || '—',
      ex.restSeconds ? `${ex.restSeconds}s` : '—',
      ex.notes || '',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'EJERCICIO', 'GRUPO', 'SERIES', 'REPS', 'CARGA', 'PAUSA', 'NOTAS']],
      body: tableBody,
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
      },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 45 },
        2: { cellWidth: 28 },
        3: { cellWidth: 16 },
        4: { cellWidth: 18 },
        5: { cellWidth: 20 },
        6: { cellWidth: 16 },
        7: { cellWidth: 'auto' },
      },
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  return doc.output('arraybuffer') as unknown as Uint8Array;
}

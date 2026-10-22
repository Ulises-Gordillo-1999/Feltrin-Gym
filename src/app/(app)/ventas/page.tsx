import React from 'react';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { products, sales, students } from '@/db/schema';
import { requireRole } from '@/utils/session';
import { SalesClient } from '@/components/sales/SalesClient';

export default async function VentasPage() {
  await requireRole('ADMIN');

  const availableProducts = await db.query.products.findMany({
    where: eq(products.isActive, true),
    orderBy: [products.name],
    with: { category: { columns: { name: true } } },
  });

  const allStudents = await db.query.students.findMany({
    where: eq(students.status, 'ACTIVO'),
    orderBy: [students.lastName],
    columns: { id: true, firstName: true, lastName: true },
  });

  const recentSales = await db.query.sales.findMany({
    orderBy: [desc(sales.soldAt)],
    limit: 20,
    with: {
      student: { columns: { firstName: true, lastName: true } },
      soldBy: { columns: { fullName: true } },
      items: true,
    },
  });

  return (
    <SalesClient
      products={availableProducts.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        categoryName: p.category?.name ?? 'General',
        salePrice: p.salePrice,
        stock: p.stock,
      }))}
      students={allStudents.map((s) => ({
        id: s.id,
        fullName: `${s.lastName}, ${s.firstName}`,
      }))}
      salesHistory={recentSales.map((s) => {
        const cust = s.student
          ? `${s.student.lastName}, ${s.student.firstName}`
          : s.customerName || 'Consumidor Final';
        const itemsSumm = s.items
          .map((i) => `${i.quantity}x ${i.productNameSnapshot}`)
          .join(', ');
        return {
          id: s.id,
          saleNumber: s.saleNumber,
          customerName: cust,
          total: s.total,
          paymentMethod: s.paymentMethod,
          status: s.status,
          soldAt: s.soldAt,
          soldByName: s.soldBy?.fullName ?? 'Admin',
          itemsSummary: itemsSumm,
        };
      })}
    />
  );
}

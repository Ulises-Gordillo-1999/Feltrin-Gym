import React from 'react';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { products, productCategories } from '@/db/schema';
import { requireRole } from '@/utils/session';
import { InventoryClient } from '@/components/inventory/InventoryClient';

export default async function InventarioPage() {
  await requireRole('ADMIN');

  const allProducts = await db.query.products.findMany({
    where: eq(products.isActive, true),
    orderBy: [products.name],
    with: {
      category: { columns: { name: true } },
    },
  });

  const categories = await db.query.productCategories.findMany({
    where: eq(productCategories.isActive, true),
    orderBy: [productCategories.name],
  });

  return (
    <InventoryClient
      products={allProducts.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description,
        categoryName: p.category?.name ?? 'Sin categoría',
        categoryId: p.categoryId,
        imageUrl: p.imageUrl,
        costPrice: p.costPrice,
        salePrice: p.salePrice,
        stock: p.stock,
        minStock: p.minStock,
        isActive: p.isActive,
      }))}
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
      }))}
    />
  );
}

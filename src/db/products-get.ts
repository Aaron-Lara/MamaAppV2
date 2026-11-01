// Lectura de un producto por id, con su stock. Las pantallas no escriben SQL.

import type { SQLiteDatabase } from 'expo-sqlite';

import type { ProductWithStock } from '@/db/products-with-stock';

/** Devuelve el producto con su stock actual, o null si no existe. */
export async function getProductWithStock(
  db: SQLiteDatabase,
  id: number
): Promise<ProductWithStock | null> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    return null;
  }
  const row = await db.getFirstAsync<ProductWithStock>(
    `SELECT p.id, p.name, p.price_cents, p.category, p.track_stock,
            p.min_stock, p.active, COALESCE(SUM(m.quantity), 0) AS stock
       FROM products p
       LEFT JOIN stock_movements m ON m.product_id = p.id
      WHERE p.id = $id
      GROUP BY p.id`,
    { $id: id }
  );
  return row ?? null;
}
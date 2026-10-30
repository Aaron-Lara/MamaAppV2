// Lista de productos con su stock actual. Las pantallas no escriben SQL.
// El stock es la suma de movimientos; no se consulta producto por producto.

import type { SQLiteDatabase } from 'expo-sqlite';

export type ProductWithStock = {
  id: number;
  name: string;
  price_cents: number;
  category: string | null;
  track_stock: number;
  min_stock: number;
  active: number;
  /** Suma de todos los movimientos; puede ser negativa si hubo un error de conteo. */
  stock: number;
};

/**
 * Devuelve todos los productos en una sola consulta, con su stock sumado.
 * Por defecto solo activos; includeInactive trae también los desactivados.
 */
export function listProductsWithStock(
  db: SQLiteDatabase,
  options: { includeInactive?: boolean } = {}
): Promise<ProductWithStock[]> {
  const filter = options.includeInactive ? '' : 'WHERE p.active = 1';
  return db.getAllAsync<ProductWithStock>(`
    SELECT
      p.id,
      p.name,
      p.price_cents,
      p.category,
      p.track_stock,
      p.min_stock,
      p.active,
      COALESCE(SUM(m.quantity), 0) AS stock
    FROM products p
    LEFT JOIN stock_movements m ON m.product_id = p.id
    ${filter}
    GROUP BY p.id
    ORDER BY p.name COLLATE NOCASE ASC, p.id ASC
  `);
}

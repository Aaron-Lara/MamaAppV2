// Lecturas de resumen de ventas: conteos y comparación del total guardado
// contra la suma de sus renglones. Las pantallas no escriben SQL.

import type { SQLiteDatabase } from 'expo-sqlite';

export type RecentSale = {
  id: number;
  total_cents: number;
  payment_method: 'cash' | 'credit';
  customer_name: string | null;
  items_sum_cents: number;
};

export type SalesSummary = {
  salesCount: number;
  saleItemsCount: number;
  customersCount: number;
  recentSales: RecentSale[];
};

type CountableTable = 'sales' | 'sale_items' | 'customers';

/** Cuenta filas de una tabla interna (el nombre nunca viene del usuario). */
async function countRows(db: SQLiteDatabase, table: CountableTable): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>(`SELECT COUNT(*) AS total FROM ${table}`);
  return row?.total ?? 0;
}

export function countSales(db: SQLiteDatabase): Promise<number> {
  return countRows(db, 'sales');
}

export function countSaleItems(db: SQLiteDatabase): Promise<number> {
  return countRows(db, 'sale_items');
}

export function countCustomers(db: SQLiteDatabase): Promise<number> {
  return countRows(db, 'customers');
}

const SALE_SELECT = `
  SELECT s.id, s.total_cents, s.payment_method,
         c.name AS customer_name,
         COALESCE(SUM(si.quantity * si.unit_price_cents), 0) AS items_sum_cents
  FROM sales s
  LEFT JOIN customers c ON c.id = s.customer_id
  LEFT JOIN sale_items si ON si.sale_id = s.id`;

/** Últimas ventas con el total guardado y la suma real de sus renglones. */
export function listRecentSales(db: SQLiteDatabase, limit = 5): Promise<RecentSale[]> {
  return db.getAllAsync<RecentSale>(`${SALE_SELECT} GROUP BY s.id ORDER BY s.id DESC LIMIT $limit`, {
    $limit: limit,
  });
}

/** Una venta concreta con la suma de sus renglones, o null si no existe. */
export function getSaleRow(db: SQLiteDatabase, saleId: number): Promise<RecentSale | null> {
  return db.getFirstAsync<RecentSale>(`${SALE_SELECT} WHERE s.id = $id GROUP BY s.id`, {
    $id: saleId,
  });
}

/** Todo lo que el panel de pruebas necesita mostrar de un jalón. */
export async function getSalesSummary(db: SQLiteDatabase): Promise<SalesSummary> {
  const [salesCount, saleItemsCount, customersCount, recentSales] = await Promise.all([
    countSales(db),
    countSaleItems(db),
    countCustomers(db),
    listRecentSales(db),
  ]);
  return { salesCount, saleItemsCount, customersCount, recentSales };
}

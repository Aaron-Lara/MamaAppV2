// Lista de compras con sus totales. Una sola consulta: no se pregunta por
// cada fila. Las pantallas no escriben SQL.

import type { SQLiteDatabase } from 'expo-sqlite';

import type { PurchaseCurrency } from '@/lib/purchase-types';

export const DEFAULT_PURCHASES_LIMIT = 100;

export type PurchaseListItem = {
  id: number;
  purchase_date: string;
  store: string | null;
  currency: PurchaseCurrency;
  exchange_rate_x10000: number;
  total_cents: number;
  total_mxn_cents: number;
  status: 'active' | 'void';
  item_count: number;
};

/** Últimas compras, de la más reciente a la más vieja. */
export function listPurchases(
  db: SQLiteDatabase,
  options: { limit?: number } = {}
): Promise<PurchaseListItem[]> {
  const limit = options.limit ?? DEFAULT_PURCHASES_LIMIT;
  if (!Number.isSafeInteger(limit) || limit <= 0) {
    throw new Error('El límite de compras debe ser un entero mayor a cero.');
  }
  return db.getAllAsync<PurchaseListItem>(
    `SELECT
       p.id,
       p.purchase_date,
       p.store,
       p.currency,
       p.exchange_rate_x10000,
       p.total_cents,
       p.total_mxn_cents,
       p.status,
       (SELECT COUNT(*) FROM purchase_items i WHERE i.purchase_id = p.id) AS item_count
     FROM purchases p
     ORDER BY p.purchase_date DESC, p.id DESC
     LIMIT $limit`,
    { $limit: limit }
  );
}

// Detalle de una compra con todos sus renglones en dos consultas, sin una
// consulta por fila. Las pantallas no escriben SQL.

import type { SQLiteDatabase } from 'expo-sqlite';

import type { PurchaseListItem } from '@/db/purchases-list';

export type PurchaseDetailLine = {
  id: number;
  product_id: number | null;
  product_name: string | null;
  description: string;
  units: number;
  cost_cents: number;
  cost_mxn_cents: number;
};

export type PurchaseDetail = PurchaseListItem & {
  created_at: string;
  voided_at: string | null;
  void_reason: string | null;
  lines: PurchaseDetailLine[];
};

/** Devuelve la compra con sus renglones, o null si no existe. */
export async function getPurchaseDetail(
  db: SQLiteDatabase,
  purchaseId: number
): Promise<PurchaseDetail | null> {
  const purchase = await db.getFirstAsync<Omit<PurchaseDetail, 'lines'>>(
    `SELECT
       p.id,
       p.purchase_date,
       p.created_at,
       p.store,
       p.currency,
       p.exchange_rate_x10000,
       p.total_cents,
       p.total_mxn_cents,
       p.status,
       p.voided_at,
       p.void_reason,
       (SELECT COUNT(*) FROM purchase_items i WHERE i.purchase_id = p.id) AS item_count
     FROM purchases p
     WHERE p.id = $id`,
    { $id: purchaseId }
  );
  if (!purchase) {
    return null;
  }

  const lines = await db.getAllAsync<PurchaseDetailLine>(
    `SELECT
       i.id,
       i.product_id,
       pr.name AS product_name,
       i.description,
       i.units,
       i.cost_cents,
       i.cost_mxn_cents
     FROM purchase_items i
     LEFT JOIN products pr ON pr.id = i.product_id
     WHERE i.purchase_id = $id
     ORDER BY i.id ASC`,
    { $id: purchaseId }
  );

  return { ...purchase, lines };
}

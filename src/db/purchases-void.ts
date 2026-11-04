// Anulación de compras. La compra nunca se borra: se marca 'void' y el stock
// se compensa en la misma transacción.
//
// REGLA: stock_movements.reference_id comparte espacio de ids entre ventas y
// compras. Toda consulta sobre stock_movements por reference_id debe incluir
// también reason. La anulación de una compra compensa con reason 'purchase' y
// cantidad negativa, nunca con 'void'.

import type { SQLiteDatabase } from 'expo-sqlite';

import { localDateString } from '@/lib/dates';
import { validateVoidId, validateVoidReason } from '@/lib/void-input';

export const PURCHASE_VOID_NOTE = 'Anulación de compra';

export type VoidPurchaseResult = { purchaseId: number; stockMovements: number };

type StockTotal = { product_id: number; total: number };

/**
 * Anula una compra activa y revierte las unidades que entraron al stock.
 * - Falla si la compra no existe o si ya estaba anulada.
 * - El stock puede quedar negativo; nunca se bloquea.
 */
export async function voidPurchase(
  db: SQLiteDatabase,
  purchaseIdInput: number,
  reasonInput: string
): Promise<VoidPurchaseResult> {
  const purchaseId = validateVoidId(purchaseIdInput, 'compra');
  const reason = validateVoidReason(reasonInput);
  const movementDate = localDateString();
  let stockMovements = 0;

  await db.withExclusiveTransactionAsync(async (txn) => {
    const purchase = await txn.getFirstAsync<{ id: number; status: 'active' | 'void' }>(
      'SELECT id, status FROM purchases WHERE id = $id',
      { $id: purchaseId }
    );
    if (!purchase) {
      throw new Error(`La compra ${purchaseId} no existe.`);
    }

    // Defensa: si ya hay compensaciones de compra, no se duplican.
    const already = await txn.getFirstAsync<{ total: number }>(
      `SELECT COUNT(*) AS total FROM stock_movements
        WHERE reference_id = $id AND reason = 'purchase' AND quantity < 0`,
      { $id: purchaseId }
    );
    if ((already?.total ?? 0) > 0) {
      throw new Error('La compra ya está anulada.');
    }

    const updated = await txn.runAsync(
      `UPDATE purchases
          SET status = 'void',
              voided_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
              void_reason = $reason
        WHERE id = $id AND status = 'active'`,
      { $id: purchaseId, $reason: reason }
    );
    if (updated.changes !== 1) {
      throw new Error('La compra ya está anulada.');
    }

    // Suma por producto lo que la compra metió (soporta renglones repetidos).
    const totals = await txn.getAllAsync<StockTotal>(
      `SELECT product_id, COALESCE(SUM(quantity), 0) AS total
         FROM stock_movements
        WHERE reference_id = $id AND reason = 'purchase'
        GROUP BY product_id`,
      { $id: purchaseId }
    );
    const pending = totals.filter((row) => row.total !== 0);
    if (pending.length === 0) return;

    const statement = await txn.prepareAsync(
      `INSERT INTO stock_movements (
         product_id, movement_date, quantity, reason, reference_id, note
       ) VALUES ($productId, $movementDate, $quantity, 'purchase', $purchaseId, $note)`
    );
    try {
      for (const row of pending) {
        await statement.executeAsync({
          $productId: row.product_id,
          $movementDate: movementDate,
          $quantity: -row.total,
          $purchaseId: purchaseId,
          $note: PURCHASE_VOID_NOTE,
        });
        stockMovements += 1;
      }
    } finally {
      await statement.finalizeAsync();
    }
  });

  return { purchaseId, stockMovements };
}

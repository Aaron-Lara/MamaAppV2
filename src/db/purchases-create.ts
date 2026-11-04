// Registro de compras. Las pantallas no escriben SQL.
// Todo se guarda en una sola transacción: compra, renglones y entradas de stock.
// El stock solo se mueve para productos con track_stock = 1.

import type { SQLiteDatabase } from 'expo-sqlite';

import { localDateString } from '@/lib/dates';
import { validatePurchaseInput, type NewPurchaseInput } from '@/lib/purchase-input';

/**
 * Guarda una compra y sus entradas de inventario. Devuelve el id de la compra.
 * "today" se recibe para que la validación de fechas sea pura y determinista.
 */
export async function createPurchase(
  db: SQLiteDatabase,
  input: NewPurchaseInput,
  today: string = localDateString()
): Promise<number> {
  const purchase = validatePurchaseInput(input, today);
  let purchaseId = 0;

  await db.withExclusiveTransactionAsync(async (txn) => {
    const productIds = [
      ...new Set(
        purchase.lines
          .map((line) => line.productId)
          .filter((id): id is number => id != null)
      ),
    ];
    // La conexión exclusiva nace con foreign_keys en OFF: verificamos a mano.
    const tracked = new Set<number>();
    for (const productId of productIds) {
      const product = await txn.getFirstAsync<{ id: number; track_stock: number }>(
        'SELECT id, track_stock FROM products WHERE id = $id',
        { $id: productId }
      );
      if (!product) {
        throw new Error(`El producto ${productId} no existe.`);
      }
      if (product.track_stock === 1) {
        tracked.add(productId);
      }
    }

    const result = await txn.runAsync(
      `INSERT INTO purchases (
         purchase_date, store, currency, exchange_rate_x10000,
         total_cents, total_mxn_cents
       ) VALUES ($purchaseDate, $store, $currency, $rate, $total, $totalMxn)`,
      {
        $purchaseDate: purchase.purchaseDate,
        $store: purchase.store,
        $currency: purchase.currency,
        $rate: purchase.exchangeRateX10000,
        $total: purchase.totalCents,
        $totalMxn: purchase.totalMxnCents,
      }
    );
    purchaseId = result.lastInsertRowId;

    const itemStatement = await txn.prepareAsync(
      `INSERT INTO purchase_items (
         purchase_id, product_id, description, units, cost_cents, cost_mxn_cents
       ) VALUES ($purchaseId, $productId, $description, $units, $cost, $costMxn)`
    );
    try {
      for (const line of purchase.lines) {
        await itemStatement.executeAsync({
          $purchaseId: purchaseId,
          $productId: line.productId,
          $description: line.description,
          $units: line.units,
          $cost: line.costCents,
          $costMxn: line.costMxnCents,
        });
      }
    } finally {
      await itemStatement.finalizeAsync();
    }

    const movementStatement = await txn.prepareAsync(
      `INSERT INTO stock_movements (
         product_id, movement_date, quantity, reason, reference_id
       ) VALUES ($productId, $movementDate, $quantity, 'purchase', $purchaseId)`
    );
    try {
      for (const line of purchase.lines) {
        if (line.productId === null || !tracked.has(line.productId)) {
          continue;
        }
        await movementStatement.executeAsync({
          $productId: line.productId,
          $movementDate: purchase.purchaseDate,
          $quantity: line.units,
          $purchaseId: purchaseId,
        });
      }
    } finally {
      await movementStatement.finalizeAsync();
    }
  });

  if (purchaseId === 0) {
    throw new Error('No se pudo guardar la compra.');
  }
  return purchaseId;
}

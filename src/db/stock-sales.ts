// Salida de inventario por venta. Vive aparte para que stock.ts quede corto
// y para que este camino tenga un único dueño: solo recordSale lo llama.

import type { SQLiteDatabase } from 'expo-sqlite';

/** Renglón de venta desde el punto de vista del inventario. */
export type SaleStockLine = { productId?: number | null; quantity: number };

/**
 * Inserta un movimiento 'sale' por cada producto con track_stock = 1.
 * Debe correr dentro de la MISMA transacción que la venta: si algo falla,
 * venta y movimientos se revierten juntos. Nunca bloquea por falta de stock.
 */
export async function insertSaleStockMovements(
  db: SQLiteDatabase,
  input: { saleId: number; movementDate: string; lines: readonly SaleStockLine[] }
): Promise<void> {
  // Un movimiento por producto (una venta puede repetir el mismo producto).
  const totals = new Map<number, number>();
  for (const line of input.lines) {
    if (line.productId == null) continue;
    totals.set(line.productId, (totals.get(line.productId) ?? 0) + line.quantity);
  }
  if (totals.size === 0) return;

  const tracked: { productId: number; quantity: number }[] = [];
  for (const [productId, quantity] of totals) {
    const product = await db.getFirstAsync<{ track_stock: number }>(
      'SELECT track_stock FROM products WHERE id = $id',
      { $id: productId }
    );
    // La conexión exclusiva nace con foreign_keys en OFF: verificamos a mano.
    if (!product) {
      throw new Error(`El producto ${productId} no existe.`);
    }
    if (product.track_stock === 1) {
      tracked.push({ productId, quantity });
    }
  }
  if (tracked.length === 0) return;

  const statement = await db.prepareAsync(
    `INSERT INTO stock_movements (product_id, movement_date, quantity, reason, reference_id)
     VALUES ($productId, $movementDate, $quantity, 'sale', $saleId)`
  );
  try {
    for (const row of tracked) {
      await statement.executeAsync({
        $productId: row.productId,
        $movementDate: input.movementDate,
        $quantity: -row.quantity,
        $saleId: input.saleId,
      });
    }
  } finally {
    await statement.finalizeAsync();
  }
}

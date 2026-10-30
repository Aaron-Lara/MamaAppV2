// Alta de productos con stock inicial. Las pantallas no escriben SQL.
// Producto y movimiento viven en una sola transacción.

import type { SQLiteDatabase } from 'expo-sqlite';

import { assertUniqueProductName } from '@/db/products-manage';
import { MAX_ADJUSTMENT_QUANTITY, recordAdjustment } from '@/db/stock';
import { validateProductInput, type ProductInput } from '@/lib/product-input';

/** Valida la cantidad inicial antes de abrir la transacción. */
function validateInitialStock(units: number, trackStock: boolean): void {
  if (!Number.isSafeInteger(units) || units < 0) {
    throw new Error('El stock inicial debe ser un entero mayor o igual a cero.');
  }
  if (trackStock && units > MAX_ADJUSTMENT_QUANTITY) {
    throw new Error(`El stock inicial no puede pasar de ${MAX_ADJUSTMENT_QUANTITY} unidades.`);
  }
}

/**
 * Crea un producto y, si controla stock y hay cantidad inicial, registra el
 * movimiento 'Stock inicial'. Si algo falla, no queda nada a medias.
 */
export async function createProductWithStock(
  db: SQLiteDatabase,
  input: ProductInput,
  initialStockUnits: number
): Promise<number> {
  const product = validateProductInput(input);
  validateInitialStock(initialStockUnits, product.trackStock);

  let productId = 0;
  await db.withExclusiveTransactionAsync(async (txn) => {
    await assertUniqueProductName(txn, product.name);

    const result = await txn.runAsync(
      `INSERT INTO products (name, price_cents, category, track_stock, min_stock)
       VALUES ($name, $priceCents, $category, $trackStock, $minStock)`,
      {
        $name: product.name,
        $priceCents: product.priceCents,
        $category: product.category,
        $trackStock: product.trackStock ? 1 : 0,
        $minStock: product.minStock,
      }
    );
    productId = result.lastInsertRowId;

    if (product.trackStock && initialStockUnits > 0) {
      // recordAdjustment no abre transacción propia: usa el txn recibido.
      await recordAdjustment(txn, {
        productId,
        quantity: initialStockUnits,
        reason: 'adjustment',
        note: 'Stock inicial',
      });
    }
  });

  if (productId === 0) {
    throw new Error('No se pudo guardar el producto.');
  }
  return productId;
}

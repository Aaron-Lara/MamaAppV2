// Edición de un producto con conteo de stock opcional, en una sola
// transacción. Las pantallas no escriben SQL. Nada se borra.

import type { SQLiteDatabase } from 'expo-sqlite';

import { assertUniqueProductName } from '@/db/products-manage';
import { getStock, recordAdjustment } from '@/db/stock';
import { validateProductInput, type ProductInput } from '@/lib/product-input';

/**
 * Guarda los cambios de un producto. Si llega stockCount (solo al activar el
 * control de stock por primera vez), el stock queda exactamente en esa
 * cantidad: se registra un ajuste con la diferencia contra el stock actual.
 * Todo ocurre en una sola transacción; si algo falla, no cambia nada.
 */
export async function updateProductWithStockCount(
  db: SQLiteDatabase,
  id: number,
  input: ProductInput,
  stockCount: number | null
): Promise<void> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('El producto no es válido.');
  }
  const product = validateProductInput(input);

  if (stockCount !== null) {
    if (!Number.isSafeInteger(stockCount) || stockCount < 0) {
      throw new Error('El conteo debe ser un entero mayor o igual a cero.');
    }
    if (!product.trackStock) {
      throw new Error('El conteo solo aplica a productos que controlan stock.');
    }
  }

  await db.withExclusiveTransactionAsync(async (txn) => {
    // La conexión exclusiva nace con foreign_keys en OFF: verificamos a mano.
    const existing = await txn.getFirstAsync<{ id: number; track_stock: number }>(
      'SELECT id, track_stock FROM products WHERE id = $id',
      { $id: id }
    );
    if (!existing) {
      throw new Error('El producto no existe.');
    }
    if (stockCount !== null && existing.track_stock === 1) {
      throw new Error('Este producto ya controla stock: corrígelo con un ajuste con motivo.');
    }

    await assertUniqueProductName(txn, product.name, id);

    await txn.runAsync(
      `UPDATE products
          SET name = $name,
              price_cents = $priceCents,
              category = $category,
              track_stock = $trackStock,
              min_stock = $minStock
        WHERE id = $id`,
      {
        $id: id,
        $name: product.name,
        $priceCents: product.priceCents,
        $category: product.category,
        $trackStock: product.trackStock ? 1 : 0,
        $minStock: product.minStock,
      }
    );

    if (stockCount !== null) {
      const current = await getStock(txn, id);
      const difference = stockCount - current;
      if (difference !== 0) {
        await recordAdjustment(txn, {
          productId: id,
          quantity: difference,
          reason: 'adjustment',
          note: 'Conteo al activar el control de stock',
        });
      }
    }
  });
}
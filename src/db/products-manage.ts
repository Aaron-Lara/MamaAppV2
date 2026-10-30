// Cambios de productos existentes. Las pantallas no escriben SQL.
// Nada se borra: los productos se desactivan con setProductActive.

import type { SQLiteDatabase } from 'expo-sqlite';

import { validateProductInput, type ProductInput } from '@/lib/product-input';

/** Normaliza el nombre para comparar sin distinguir mayúsculas. */
function nameKey(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Rechaza nombres repetidos contra TODOS los productos, incluidos los
 * desactivados. Debe correr dentro de la misma transacción que escribe.
 */
export async function assertUniqueProductName(
  db: SQLiteDatabase,
  name: string,
  excludeId: number | null = null
): Promise<void> {
  const rows = await db.getAllAsync<{ id: number; name: string }>(
    excludeId === null
      ? 'SELECT id, name FROM products'
      : 'SELECT id, name FROM products WHERE id <> $excludeId',
    excludeId === null ? {} : { $excludeId: excludeId }
  );
  const key = nameKey(name);
  if (rows.some((row) => nameKey(row.name) === key)) {
    throw new Error('Ya existe un producto con ese nombre.');
  }
}

/** Actualiza los datos editables. No toca ventas, stock ni el estado activo. */
export async function updateProduct(
  db: SQLiteDatabase,
  id: number,
  input: ProductInput
): Promise<void> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('El producto no es válido.');
  }
  const product = validateProductInput(input);

  await db.withExclusiveTransactionAsync(async (txn) => {
    const existing = await txn.getFirstAsync<{ id: number }>(
      'SELECT id FROM products WHERE id = $id',
      { $id: id }
    );
    if (!existing) {
      throw new Error('El producto no existe.');
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
  });
}

/** Activa o desactiva un producto. No borra nada. */
export async function setProductActive(
  db: SQLiteDatabase,
  id: number,
  active: boolean
): Promise<void> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('El producto no es válido.');
  }
  if (typeof active !== 'boolean') {
    throw new Error('El estado del producto no es válido.');
  }

  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM products WHERE id = $id',
    { $id: id }
  );
  if (!existing) {
    throw new Error('El producto no existe.');
  }

  await db.runAsync('UPDATE products SET active = $active WHERE id = $id', {
    $active: active ? 1 : 0,
    $id: id,
  });
}

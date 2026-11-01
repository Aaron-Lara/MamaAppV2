// Ajuste de stock por conteo: la usuaria escribe cuántas unidades hay y la
// diferencia se registra como movimiento. El stock nunca se edita directo.

import type { SQLiteDatabase } from 'expo-sqlite';

import { getStock, recordAdjustment } from '@/db/stock';
import {
  MAX_COUNTED_UNITS,
  planAdjustment,
  type AdjustmentMotive,
} from '@/lib/stock-adjust';

/** Lo que quedó registrado: la pantalla puede mostrarlo al terminar. */
export type AppliedAdjustment = {
  difference: number;
  stockBefore: number;
  stockAfter: number;
};

/**
 * Deja el stock exactamente en countedUnits registrando la diferencia como un
 * movimiento. Todo ocurre en una sola transacción y el stock se lee dentro de
 * ella: una venta simultánea no deja el conteo desfasado. Si el conteo ya
 * coincide no se inserta nada.
 */
export async function adjustStockToCount(
  db: SQLiteDatabase,
  productId: number,
  countedUnits: number,
  motive: AdjustmentMotive,
  note = ''
): Promise<AppliedAdjustment> {
  if (!Number.isSafeInteger(productId) || productId <= 0) {
    throw new Error('El producto no es válido.');
  }
  if (
    !Number.isSafeInteger(countedUnits) ||
    countedUnits < 0 ||
    countedUnits > MAX_COUNTED_UNITS
  ) {
    throw new Error(`La cantidad debe ser un entero entre 0 y ${MAX_COUNTED_UNITS}.`);
  }

  const outcome: { value: AppliedAdjustment | null } = { value: null };

  await db.withExclusiveTransactionAsync(async (txn) => {
    // La conexión exclusiva nace con foreign_keys en OFF: verificamos a mano.
    const product = await txn.getFirstAsync<{ track_stock: number }>(
      'SELECT track_stock FROM products WHERE id = $id',
      { $id: productId }
    );
    if (!product) {
      throw new Error('El producto no existe.');
    }
    if (product.track_stock !== 1) {
      throw new Error('Este producto no controla stock.');
    }

    const stockBefore = await getStock(txn, productId);
    const plan = planAdjustment(stockBefore, countedUnits, motive, note);
    if (!plan.ok) {
      throw new Error(plan.error);
    }
    if (!plan.change) {
      outcome.value = { difference: 0, stockBefore, stockAfter: stockBefore };
      return;
    }

    await recordAdjustment(txn, {
      productId,
      quantity: plan.difference,
      reason: plan.reason,
      note: plan.note,
    });
    outcome.value = { difference: plan.difference, stockBefore, stockAfter: countedUnits };
  });

  if (!outcome.value) {
    throw new Error('No se pudo ajustar el stock. Inténtalo de nuevo.');
  }
  return outcome.value;
}

// Anulación de ventas: la venta nunca se borra. Se marca 'void' y se
// compensa el stock con movimientos 'void' en la misma transacción.
// Las pantallas no escriben SQL.

import type { SQLiteDatabase } from 'expo-sqlite';

import { getCustomerBalance } from '@/db/balances';
import { localDateString } from '@/lib/dates';
import { validateVoidInput } from '@/lib/void-input';

export type VoidSaleResult = { saleId: number; voidMovements: number };

type StockTotal = { product_id: number; total: number };

/**
 * Anula una venta activa y devuelve el stock que tomó.
 * - Falla si el id o el motivo no son válidos (validación pura).
 * - Falla si la venta no existe o si ya estaba anulada.
 * - El stock regresa como movimientos 'void'; no se actualiza ningún total.
 */
export async function voidSale(
  db: SQLiteDatabase,
  saleIdInput: number,
  reasonInput: string
): Promise<VoidSaleResult> {
  const { saleId, reason } = validateVoidInput(saleIdInput, reasonInput);
  const movementDate = localDateString();
  let voidMovements = 0;

  await db.withExclusiveTransactionAsync(async (txn) => {
    // La conexión exclusiva nace con foreign_keys en OFF: verificamos a mano.
    const sale = await txn.getFirstAsync<{
      id: number;
      customer_id: number | null;
      payment_method: 'cash' | 'credit';
      total_cents: number;
      status: 'active' | 'void';
    }>(
      `SELECT id, customer_id, payment_method, total_cents, status
         FROM sales WHERE id = $id`,
      { $id: saleId }
    );
    if (!sale) {
      throw new Error(`La venta ${saleId} no existe.`);
    }

    // Si es una venta fiada activa, los abonos no pueden dejar el saldo en
    // negativo al quitarla. Todo esto corre antes de escribir nada.
    if (
      sale.status === 'active' &&
      sale.payment_method === 'credit' &&
      sale.customer_id !== null
    ) {
      const balance = await getCustomerBalance(txn, sale.customer_id);
      if (balance - sale.total_cents < 0) {
        throw new Error('Primero anula los abonos de ese cliente');
      }
    }

    // Defensa: si ya hay compensaciones para esta venta, no se duplican.
    const already = await txn.getFirstAsync<{ total: number }>(
      `SELECT COUNT(*) AS total FROM stock_movements
        WHERE reference_id = $id AND reason = 'void'`,
      { $id: saleId }
    );
    if ((already?.total ?? 0) > 0) {
      throw new Error('La venta ya está anulada.');
    }

    const updated = await txn.runAsync(
      `UPDATE sales
          SET status = 'void',
              voided_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
              void_reason = $reason
        WHERE id = $id AND status = 'active'`,
      { $id: saleId, $reason: reason }
    );
    if (updated.changes !== 1) {
      throw new Error('La venta ya está anulada.');
    }

    // Suma por producto lo que la venta descontó (soporta renglones repetidos).
    const totals = await txn.getAllAsync<StockTotal>(
      `SELECT product_id, COALESCE(SUM(quantity), 0) AS total
         FROM stock_movements
        WHERE reference_id = $id AND reason = 'sale'
        GROUP BY product_id`,
      { $id: saleId }
    );
    const pending = totals.filter((row) => row.total !== 0);
    if (pending.length === 0) return;

    // reference_id comparte espacio de ids entre orígenes; hoy solo las ventas
    // generan movimientos 'void'. Si se anulan compras, hará falta una columna
    // con el tipo de origen.
    const statement = await txn.prepareAsync(
      `INSERT INTO stock_movements (product_id, movement_date, quantity, reason, reference_id)
       VALUES ($productId, $movementDate, $quantity, 'void', $saleId)`
    );
    try {
      for (const row of pending) {
        await statement.executeAsync({
          $productId: row.product_id,
          $movementDate: movementDate,
          $quantity: -row.total,
          $saleId: saleId,
        });
        voidMovements += 1;
      }
    } finally {
      await statement.finalizeAsync();
    }
  });

  return { saleId, voidMovements };
}

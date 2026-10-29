// Anulación de abonos: el abono nunca se borra. Se marca 'void' y se guarda
// la fecha y el motivo. Las pantallas no escriben SQL.

import type { SQLiteDatabase } from 'expo-sqlite';

import { validateVoidId, validateVoidReason } from '@/lib/void-input';

export type VoidPaymentResult = { paymentId: number };

/**
 * Anula un abono activo.
 * - Falla si el id o el motivo no son válidos (validación pura).
 * - Falla si el abono no existe o si ya estaba anulado.
 * - No borra ninguna fila.
 */
export async function voidPayment(
  db: SQLiteDatabase,
  paymentIdInput: number,
  reasonInput: string
): Promise<VoidPaymentResult> {
  const paymentId = validateVoidId(paymentIdInput, 'abono');
  const reason = validateVoidReason(reasonInput);

  await db.withExclusiveTransactionAsync(async (txn) => {
    // La conexión exclusiva nace con foreign_keys en OFF: verificamos a mano.
    const payment = await txn.getFirstAsync<{ id: number }>(
      'SELECT id FROM payments WHERE id = $id',
      { $id: paymentId }
    );
    if (!payment) {
      throw new Error(`El abono ${paymentId} no existe.`);
    }

    const updated = await txn.runAsync(
      `UPDATE payments
          SET status = 'void',
              voided_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
              void_reason = $reason
        WHERE id = $id AND status = 'active'`,
      { $id: paymentId, $reason: reason }
    );
    if (updated.changes !== 1) {
      throw new Error('El abono ya está anulado.');
    }
  });

  return { paymentId };
}

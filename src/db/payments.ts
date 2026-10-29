// Registro de abonos de fiados. Las pantallas no escriben SQL.
// El dinero se guarda siempre en centavos (enteros).

import type { SQLiteDatabase } from 'expo-sqlite';

import { getCustomerBalance } from '@/db/balances';
import { localDateString } from '@/lib/dates';
import { validatePaymentInput } from '@/lib/payment-input';

export type NewPayment = {
  customerId: number;
  amountCents: number;
  note?: string | null;
};

/**
 * Guarda un abono en una sola transacción.
 * - Falla si el cliente no existe o si el abono supera el saldo actual.
 * - El saldo se lee dentro de la transacción, así que dos abonos simultáneos
 *   no pueden pasar los dos con el mismo saldo viejo.
 */
export async function recordPayment(
  db: SQLiteDatabase,
  input: NewPayment
): Promise<number> {
  const { customerId, amountCents, note } = validatePaymentInput(
    input.customerId,
    input.amountCents,
    input.note
  );
  const paymentDate = localDateString();
  let paymentId = 0;

  await db.withExclusiveTransactionAsync(async (txn) => {
    // La conexión exclusiva nace con foreign_keys en OFF: verificamos a mano.
    const customer = await txn.getFirstAsync<{ id: number }>(
      'SELECT id FROM customers WHERE id = $id',
      { $id: customerId }
    );
    if (!customer) {
      throw new Error('El cliente del abono no existe.');
    }

    const balance = await getCustomerBalance(txn, customerId);
    if (amountCents > balance) {
      throw new Error('El abono no puede ser mayor que lo que debe');
    }

    const result = await txn.runAsync(
      `INSERT INTO payments (customer_id, payment_date, amount_cents, note)
       VALUES ($customerId, $paymentDate, $amountCents, $note)`,
      {
        $customerId: customerId,
        $paymentDate: paymentDate,
        $amountCents: amountCents,
        $note: note,
      }
    );
    paymentId = result.lastInsertRowId;
  });

  if (paymentId === 0) {
    throw new Error('No se pudo guardar el abono.');
  }
  return paymentId;
}

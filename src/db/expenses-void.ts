// Anulación de gastos: el gasto nunca se borra. Se marca 'void' y se guarda
// la fecha y el motivo. Las pantallas no escriben SQL.

import type { SQLiteDatabase } from 'expo-sqlite';

import { validateVoidExpenseInput } from '@/lib/expense-input';

export type VoidExpenseResult = { expenseId: number };

/**
 * Anula un gasto activo.
 * - Falla si el id o el motivo no son válidos (validación pura).
 * - Falla si el gasto no existe o si ya estaba anulado.
 * - No borra ninguna fila ni toca efectivo o inventario.
 */
export async function voidExpense(
  db: SQLiteDatabase,
  expenseIdInput: number,
  reasonInput: string
): Promise<VoidExpenseResult> {
  const { expenseId, reason } = validateVoidExpenseInput(
    expenseIdInput,
    reasonInput
  );

  await db.withExclusiveTransactionAsync(async (txn) => {
    const expense = await txn.getFirstAsync<{ id: number; status: string }>(
      'SELECT id, status FROM expenses WHERE id = $id',
      { $id: expenseId }
    );
    if (!expense) {
      throw new Error(`El gasto ${expenseId} no existe.`);
    }

    const updated = await txn.runAsync(
      `UPDATE expenses
          SET status = 'void',
              voided_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
              void_reason = $reason
        WHERE id = $id AND status = 'active'`,
      { $id: expenseId, $reason: reason }
    );
    if (updated.changes !== 1) {
      throw new Error('El gasto ya está anulado.');
    }
  });

  return { expenseId };
}

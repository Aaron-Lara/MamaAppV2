// Consulta de un gasto por id. Solo lectura; las pantallas no escriben SQL.

import type { SQLiteDatabase } from 'expo-sqlite';

import { mapExpenseRow, type ExpenseRow } from '@/db/expenses-rows';
import type { Expense } from '@/lib/expense-types';

const EXPENSE_SQL = `
  SELECT id, created_at, expense_date, category, description,
         amount_cents, status, voided_at, void_reason
    FROM expenses
   WHERE id = $id
`;

/** Devuelve el gasto, activo o anulado, o null si no existe. */
export async function getExpense(
  db: SQLiteDatabase,
  expenseId: number
): Promise<Expense | null> {
  if (!Number.isSafeInteger(expenseId) || expenseId <= 0) {
    return null;
  }
  const row = await db.getFirstAsync<ExpenseRow>(EXPENSE_SQL, { $id: expenseId });
  return row ? mapExpenseRow(row) : null;
}

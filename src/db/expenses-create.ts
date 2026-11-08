// Registro de gastos. Las pantallas no escriben SQL.
// Un gasto no toca efectivo, ventas, compras ni movimientos de inventario.

import type { SQLiteDatabase } from 'expo-sqlite';

import { localDateString } from '@/lib/dates';
import {
  validateNewExpense,
  type NewExpenseInput,
} from '@/lib/expense-input';

/** Guarda un gasto activo y devuelve su id. */
export async function createExpense(
  db: SQLiteDatabase,
  input: NewExpenseInput,
  today: string = localDateString()
): Promise<number> {
  const expense = validateNewExpense(input, today);

  const result = await db.runAsync(
    `INSERT INTO expenses (expense_date, category, description, amount_cents)
     VALUES ($expenseDate, $category, $description, $amountCents)`,
    {
      $expenseDate: expense.expenseDate,
      $category: expense.category,
      $description: expense.description,
      $amountCents: expense.amountCents,
    }
  );

  if (result.lastInsertRowId === 0) {
    throw new Error('No se pudo guardar el gasto.');
  }
  return result.lastInsertRowId;
}

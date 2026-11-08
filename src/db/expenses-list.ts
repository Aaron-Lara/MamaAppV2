// Listado y total de gastos. Solo lectura; las pantallas no escriben SQL.
// Los cálculos de gastos activos nunca incluyen gastos anulados.

import type { SQLiteDatabase } from 'expo-sqlite';

import { mapExpenseRow, type ExpenseRow } from '@/db/expenses-rows';
import { isValidDateString } from '@/lib/dates';
import { normalizeExpenseText } from '@/lib/expense-input';
import type {
  ActiveExpenseOptions,
  Expense,
  ExpenseListOptions,
  ExpenseStatus,
} from '@/lib/expense-types';

export const DEFAULT_EXPENSES_LIMIT = 100;

type FilterOptions = {
  status?: ExpenseStatus | 'all';
  date?: string;
  category?: string;
};

type Filters = {
  where: string;
  params: Record<string, string>;
};

function buildFilters(options: FilterOptions): Filters {
  const status = options.status ?? 'all';
  if (status !== 'all' && status !== 'active' && status !== 'void') {
    throw new Error('El estado del gasto no es válido.');
  }

  const conditions: string[] = [];
  const params: Record<string, string> = {};

  if (status !== 'all') {
    conditions.push('status = $status');
    params.$status = status;
  }

  if (options.date !== undefined) {
    if (!isValidDateString(options.date)) {
      throw new Error('La fecha del filtro no es válida.');
    }
    conditions.push('expense_date = $date');
    params.$date = options.date;
  }

  if (options.category !== undefined) {
    if (typeof options.category !== 'string') {
      throw new Error('La categoría del filtro no es válida.');
    }
    const category = normalizeExpenseText(options.category);
    if (category) {
      conditions.push('category = $category COLLATE NOCASE');
      params.$category = category;
    }
  }

  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}

/** Gastos filtrados, del más reciente al más viejo. Incluye anulados. */
export async function listExpenses(
  db: SQLiteDatabase,
  options: ExpenseListOptions = {}
): Promise<Expense[]> {
  const limit = options.limit ?? DEFAULT_EXPENSES_LIMIT;
  if (!Number.isSafeInteger(limit) || limit <= 0) {
    throw new Error('El límite de gastos debe ser un entero mayor a cero.');
  }

  const filters = buildFilters(options);
  const rows = await db.getAllAsync<ExpenseRow>(
    `SELECT id, created_at, expense_date, category, description,
            amount_cents, status, voided_at, void_reason
       FROM expenses
       ${filters.where}
       ORDER BY expense_date DESC, id DESC
       LIMIT $limit`,
    { ...filters.params, $limit: limit }
  );
  return rows.map(mapExpenseRow);
}

/** Suma solo gastos activos; lo anulado queda fuera del cálculo. */
export async function sumActiveExpenses(
  db: SQLiteDatabase,
  options: ActiveExpenseOptions = {}
): Promise<number> {
  const filters = buildFilters({ ...options, status: 'active' });
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount_cents), 0) AS total
       FROM expenses
       ${filters.where}`,
    filters.params
  );
  return row?.total ?? 0;
}

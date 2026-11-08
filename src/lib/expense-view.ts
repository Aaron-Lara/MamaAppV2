// Filas y filtros listos para mostrar gastos. Lógica pura: no toca la base
// ni React, así que se prueba con Jest sin expo-sqlite.

import { dayLabel } from './day-navigation';
import { normalizeExpenseText } from './expense-input';
import {
  DEFAULT_EXPENSE_VOID_REASON,
  type Expense,
  type ExpenseStatus,
} from './expense-types';
import { formatCents, sumCents } from './money';

export type ExpenseStatusFilter = ExpenseStatus | 'all';

export type ExpenseFilters = {
  status: ExpenseStatusFilter;
  /** Fecha exacta AAAA-MM-DD, o null para no filtrar por fecha. */
  date: string | null;
  /** Categoría exacta sin distinguir mayúsculas, o null para todas. */
  category: string | null;
};

export type ExpenseCounts = {
  all: number;
  active: number;
  voided: number;
};

export type ExpenseRow = {
  id: number;
  categoryLabel: string;
  amountLabel: string;
  dateLabel: string;
  descriptionLabel: string | null;
  isVoid: boolean;
  statusLabel: string;
};

export type ExpenseDetailHeader = {
  categoryLabel: string;
  amountLabel: string;
  dateLabel: string;
  descriptionLabel: string | null;
  isVoid: boolean;
  statusLabel: string;
  voidReasonLabel: string | null;
};

function categoryMatches(value: string, filter: string): boolean {
  return (
    normalizeExpenseText(value).toLowerCase() ===
    normalizeExpenseText(filter).toLowerCase()
  );
}

function statusText(status: ExpenseStatus): string {
  return status === 'void' ? 'Anulado' : 'Activo';
}

/** El motivo interno no se muestra: la anulación ya no pide texto. */
function visibleVoidReason(reason: string | null): string | null {
  const clean = reason?.trim() || null;
  return clean === DEFAULT_EXPENSE_VOID_REASON ? null : clean;
}

/** Aplica estado, fecha y categoría sin modificar el orden recibido. */
export function filterExpenses(
  expenses: readonly Expense[],
  filters: ExpenseFilters
): Expense[] {
  return expenses.filter((expense) => {
    if (filters.status !== 'all' && expense.status !== filters.status) {
      return false;
    }
    if (filters.date !== null && expense.expenseDate !== filters.date) {
      return false;
    }
    if (
      filters.category !== null &&
      !categoryMatches(expense.category, filters.category)
    ) {
      return false;
    }
    return true;
  });
}

/** Conteos para los chips de estado. */
export function countExpenses(expenses: readonly Expense[]): ExpenseCounts {
  let active = 0;
  let voided = 0;
  for (const expense of expenses) {
    if (expense.status === 'void') {
      voided += 1;
    } else {
      active += 1;
    }
  }
  return { all: expenses.length, active, voided };
}

/** Categorías únicas del historial, ordenadas para los chips del filtro. */
export function expenseCategoryOptions(expenses: readonly Expense[]): string[] {
  const byKey = new Map<string, string>();
  for (const expense of expenses) {
    const label = normalizeExpenseText(expense.category);
    if (!label) {
      continue;
    }
    const key = label.toLowerCase();
    if (!byKey.has(key)) {
      byKey.set(key, label);
    }
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b, 'es'));
}

/** Suma solo gastos activos: lo anulado nunca entra al total. */
export function activeExpenseTotalCents(expenses: readonly Expense[]): number {
  return sumCents(
    expenses
      .filter((expense) => expense.status === 'active')
      .map((expense) => expense.amountCents)
  );
}

/** Convierte los gastos en filas de la lista. */
export function buildExpenseRows(
  expenses: readonly Expense[],
  today: string
): ExpenseRow[] {
  return expenses.map((expense) => ({
    id: expense.id,
    categoryLabel: expense.category,
    amountLabel: formatCents(expense.amountCents),
    dateLabel: dayLabel(expense.expenseDate, today),
    descriptionLabel: expense.description?.trim() || null,
    isVoid: expense.status === 'void',
    statusLabel: statusText(expense.status),
  }));
}

/** Encabezado del detalle de un gasto. */
export function buildExpenseDetailHeader(
  expense: Expense,
  today: string
): ExpenseDetailHeader {
  return {
    categoryLabel: expense.category,
    amountLabel: formatCents(expense.amountCents),
    dateLabel: dayLabel(expense.expenseDate, today),
    descriptionLabel: expense.description?.trim() || null,
    isVoid: expense.status === 'void',
    statusLabel: statusText(expense.status),
    voidReasonLabel: visibleVoidReason(expense.voidReason),
  };
}

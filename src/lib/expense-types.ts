// Tipos puros de gastos. No importan expo-sqlite ni pantallas.
// El dinero siempre se maneja en centavos enteros.

export const MAX_EXPENSE_CATEGORY_LENGTH = 60;
export const MAX_EXPENSE_DESCRIPTION_LENGTH = 200;

/**
 * Motivo interno para la anulación rápida. El esquema exige un motivo no
 * vacío cuando el estado es 'void', pero la interfaz ya no lo pide.
 */
export const DEFAULT_EXPENSE_VOID_REASON = 'Anulado desde la app.';

export type ExpenseStatus = 'active' | 'void';

export type NewExpenseInput = {
  /** Fecha local AAAA-MM-DD; si se omite se usa "today". */
  expenseDate?: string;
  category: string;
  description?: string | null;
  amountCents: number;
};

export type ValidExpenseInput = {
  expenseDate: string;
  category: string;
  description: string | null;
  amountCents: number;
};

export type VoidExpenseInput = {
  expenseId: number;
  reason: string;
};

export type Expense = {
  id: number;
  createdAt: string;
  expenseDate: string;
  category: string;
  description: string | null;
  amountCents: number;
  status: ExpenseStatus;
  voidedAt: string | null;
  voidReason: string | null;
};

export type ExpenseListOptions = {
  status?: ExpenseStatus | 'all';
  /** Fecha exacta AAAA-MM-DD. */
  date?: string;
  category?: string;
  limit?: number;
};

export type ActiveExpenseOptions = {
  /** Fecha exacta AAAA-MM-DD. */
  date?: string;
  category?: string;
};

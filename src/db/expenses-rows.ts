// Fila de la tabla expenses y su conversión al tipo de dominio.

import type { Expense, ExpenseStatus } from '@/lib/expense-types';

export type ExpenseRow = {
  id: number;
  created_at: string;
  expense_date: string;
  category: string;
  description: string | null;
  amount_cents: number;
  status: ExpenseStatus;
  voided_at: string | null;
  void_reason: string | null;
};

export function mapExpenseRow(row: ExpenseRow): Expense {
  return {
    id: row.id,
    createdAt: row.created_at,
    expenseDate: row.expense_date,
    category: row.category,
    description: row.description,
    amountCents: row.amount_cents,
    status: row.status,
    voidedAt: row.voided_at,
    voidReason: row.void_reason,
  };
}

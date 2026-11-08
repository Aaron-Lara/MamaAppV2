// Anulación de un gasto con confirmación simple. El gasto nunca se borra.
// El esquema exige un motivo, así que se guarda uno interno no visible.

import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';

import { voidExpense } from '@/db/expenses-void';
import { DEFAULT_EXPENSE_VOID_REASON } from '@/lib/expense-types';
import { translateVoidExpenseError } from '@/lib/expense-void-messages';

type Options = {
  expenseId: number;
  onVoided: () => void | Promise<void>;
};

export type VoidExpenseState = {
  voiding: boolean;
  error: string | null;
  clearError: () => void;
  requestVoid: () => Promise<boolean>;
};

export function useVoidExpense({
  expenseId,
  onVoided,
}: Options): VoidExpenseState {
  const db = useSQLiteContext();
  const [voiding, setVoiding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Se activa al confirmar, no al abrir el modal: cerrar no bloquea.
  const voidingRef = useRef(false);

  const clearError = useCallback(() => setError(null), []);

  const requestVoid = useCallback(async (): Promise<boolean> => {
    if (voidingRef.current) {
      return false;
    }
    voidingRef.current = true;
    setVoiding(true);
    setError(null);
    try {
      await voidExpense(db, expenseId, DEFAULT_EXPENSE_VOID_REASON);
      await onVoided();
      return true;
    } catch (caught) {
      setError(translateVoidExpenseError(caught));
      return false;
    } finally {
      voidingRef.current = false;
      setVoiding(false);
    }
  }, [db, expenseId, onVoided]);

  return { voiding, error, clearError, requestVoid };
}

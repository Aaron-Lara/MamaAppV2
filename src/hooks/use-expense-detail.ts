// Detalle de un gasto. Se recarga al enfocar y después de anular.

import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';

import { getExpense } from '@/db/expenses-get';
import type { Expense } from '@/lib/expense-types';

const LOAD_ERROR = 'No se pudo cargar el gasto.';
const MISSING_ERROR = 'No se encontró ese gasto.';

export type ExpenseDetailState = {
  detail: Expense | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useExpenseDetail(expenseId: number): ExpenseDetailState {
  const db = useSQLiteContext();
  const [detail, setDetail] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(expenseId > 0);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    if (expenseId <= 0) {
      setDetail(null);
      setLoading(false);
      setError(null);
      return;
    }
    const request = requestId.current + 1;
    requestId.current = request;
    // El indicador solo se muestra en la primera carga de la pantalla.
    if (request === 1) {
      setLoading(true);
    }
    try {
      const data = await getExpense(db, expenseId);
      if (request !== requestId.current) {
        return;
      }
      setDetail(data);
      setError(data ? null : MISSING_ERROR);
    } catch {
      if (request === requestId.current) {
        setError(LOAD_ERROR);
      }
    } finally {
      if (request === requestId.current) {
        setLoading(false);
      }
    }
  }, [db, expenseId]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  return { detail, loading, error, reload };
}

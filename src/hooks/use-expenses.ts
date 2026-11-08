// Lista de gastos: se recarga al enfocar la pantalla y al volver del detalle.
// El filtrado fino se hace en memoria con src/lib/expense-view.ts.

import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';

import { listExpenses } from '@/db/expenses-list';
import type { Expense } from '@/lib/expense-types';

const LOAD_ERROR = 'No se pudieron cargar los gastos.';
/** Límite defensivo del historial visible; la paginación queda pendiente. */
const EXPENSES_VIEW_LIMIT = 500;

export type ExpensesState = {
  items: Expense[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useExpenses(): ExpensesState {
  const db = useSQLiteContext();
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Descarta respuestas de cargas anteriores que lleguen tarde.
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const request = requestId.current + 1;
    requestId.current = request;
    // El indicador solo se muestra en la primera carga de la pantalla.
    if (request === 1) {
      setLoading(true);
    }
    try {
      const next = await listExpenses(db, { limit: EXPENSES_VIEW_LIMIT });
      if (request === requestId.current) {
        setItems(next);
        setError(null);
      }
    } catch {
      if (request === requestId.current) {
        setError(LOAD_ERROR);
      }
    } finally {
      if (request === requestId.current) {
        setLoading(false);
      }
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  return { items, loading, error, reload };
}

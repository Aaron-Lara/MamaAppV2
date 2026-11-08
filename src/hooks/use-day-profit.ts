// Carga de la ganancia neta estimada del día. Las pantallas no escriben SQL.

import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';

import { getDayProfitInputs } from '@/db/day-profit';
import {
  applyDayExpenses,
  estimateDayProfit,
  type NetProfitEstimate,
} from '@/lib/profit-estimate';

const LOAD_ERROR = 'No se pudo calcular la ganancia estimada.';

export type DayProfitState = {
  profit: NetProfitEstimate | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

type LoadedProfit = {
  date: string;
  profit: NetProfitEstimate;
};

export function useDayProfit(date: string): DayProfitState {
  const db = useSQLiteContext();
  const [data, setData] = useState<LoadedProfit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Descarta respuestas de cargas anteriores que lleguen tarde.
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const request = requestId.current + 1;
    requestId.current = request;
    setLoading(true);
    try {
      const inputs = await getDayProfitInputs(db, date);
      const profit = applyDayExpenses(
        estimateDayProfit(inputs.rows, inputs.costs),
        inputs.expenses.totalCents,
        inputs.expenses.count
      );
      if (request !== requestId.current) {
        return;
      }
      setData({ date, profit });
      setError(null);
    } catch {
      if (request === requestId.current) {
        setError(LOAD_ERROR);
      }
    } finally {
      if (request === requestId.current) {
        setLoading(false);
      }
    }
  }, [db, date]);

  // NativeTabs deja la pantalla montada: al cambiar de día o al recibir foco
  // hay que volver a leer. El requestId evita pisar datos con respuestas viejas.
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  // Nunca se muestra la ganancia de otro día mientras llega la nueva.
  const profit = data?.date === date ? data.profit : null;
  return { profit, loading, error, reload };
}

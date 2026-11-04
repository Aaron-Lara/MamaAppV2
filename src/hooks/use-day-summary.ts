// Carga del resumen del día. Las pantallas no escriben SQL.

import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';

import { getDaySummary, type DaySummary } from '@/db/day-summary';

const LOAD_ERROR = 'No se pudo cargar el resumen del día.';

export type DaySummaryState = {
  summary: DaySummary | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useDaySummary(date: string): DaySummaryState {
  const db = useSQLiteContext();
  const [data, setData] = useState<DaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Descarta respuestas de cargas anteriores que lleguen tarde.
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const request = requestId.current + 1;
    requestId.current = request;
    setLoading(true);
    try {
      const next = await getDaySummary(db, date);
      if (request !== requestId.current) {
        return;
      }
      setData(next);
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

  // Nunca se muestra el resumen de otro día mientras llega el nuevo.
  const summary = data?.date === date ? data : null;
  return { summary, loading, error, reload };
}

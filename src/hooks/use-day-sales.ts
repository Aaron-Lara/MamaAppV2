// Carga de las ventas del día y sus filas listas para la lista.

import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';

import { listDaySales } from '@/db/day-sales';
import { buildDaySaleRows, type DaySaleRow } from '@/lib/day-sales-rows';
import { phoneUtcOffsetMinutes } from '@/lib/local-time';

const LOAD_ERROR = 'No se pudieron cargar las ventas del día.';

export type DaySalesState = {
  rows: DaySaleRow[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

type LoadedRows = { date: string; rows: DaySaleRow[] };

export function useDaySales(date: string): DaySalesState {
  const db = useSQLiteContext();
  const [data, setData] = useState<LoadedRows | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Descarta respuestas de cargas anteriores que lleguen tarde.
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const request = requestId.current + 1;
    requestId.current = request;
    setLoading(true);
    try {
      const sales = await listDaySales(db, date);
      if (request !== requestId.current) {
        return;
      }
      // El desfase se toma del instante de la venta más reciente del día.
      const offset = phoneUtcOffsetMinutes(
        sales[0]?.createdAt ?? new Date().toISOString()
      );
      setData({ date, rows: buildDaySaleRows(sales, offset) });
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

  // Nunca se muestran las ventas de otro día mientras llegan las nuevas.
  const rows = data?.date === date ? data.rows : [];
  return { rows, loading, error, reload };
}

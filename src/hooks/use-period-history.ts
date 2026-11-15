// Historial de los últimos periodos. Una sola consulta de solo lectura.
// Datos y errores se identifican por la clave del historial.

import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';

import { getPeriodDailyTotals } from '@/db/period-totals';
import { recentPeriodStarts, type PeriodKind } from '@/lib/period-dates';
import {
  buildPeriodHistory,
  type PeriodHistoryRow,
} from '@/lib/period-history';

export const HISTORY_WEEKS = 8;
export const HISTORY_MONTHS = 6;
const LOAD_ERROR = 'No se pudo cargar el historial de periodos.';

export type PeriodHistoryState = {
  rows: PeriodHistoryRow[];
  count: number;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

type LoadedHistory = { key: string; rows: PeriodHistoryRow[] };
type KeyedError = { key: string; message: string };

export function usePeriodHistory(
  kind: PeriodKind,
  today: string
): PeriodHistoryState {
  const db = useSQLiteContext();
  const [data, setData] = useState<LoadedHistory | null>(null);
  const [pending, setPending] = useState(true);
  const [errorState, setErrorState] = useState<KeyedError | null>(null);
  const requestId = useRef(0);
  const count = kind === 'week' ? HISTORY_WEEKS : HISTORY_MONTHS;
  const key = `${kind}|${today}|${count}`;

  const reload = useCallback(async () => {
    const request = requestId.current + 1;
    requestId.current = request;
    setPending(true);
    setErrorState(null);

    try {
      const starts = recentPeriodStarts(kind, count, today);
      const oldestStart = starts[starts.length - 1];
      const days = await getPeriodDailyTotals(db, oldestStart, today);
      const rows = buildPeriodHistory(kind, days, count, today);

      if (request !== requestId.current) {
        return;
      }
      setData({ key, rows });
    } catch {
      if (request === requestId.current) {
        setErrorState({ key, message: LOAD_ERROR });
      }
    } finally {
      if (request === requestId.current) {
        setPending(false);
      }
    }
  }, [db, kind, count, today, key]);

  // NativeTabs deja la pantalla montada: al recuperar foco se recarga.
  // El cleanup invalida respuestas de consultas que queden en vuelo.
  useFocusEffect(
    useCallback(() => {
      void reload();
      return () => {
        requestId.current += 1;
      };
    }, [reload])
  );

  const current = data !== null && data.key === key ? data : null;
  const error =
    errorState !== null && errorState.key === key ? errorState.message : null;
  const loading = pending || (current === null && error === null);

  return {
    rows: current?.rows ?? [],
    count,
    loading,
    error,
    reload,
  };
}

// Reporte de un periodo y su comparación. Las pantallas no escriben SQL.
// Datos y errores se identifican por la clave del periodo consultado.

import { useFocusEffect } from 'expo-router';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';

import type { DayTopProduct } from '@/db/day-summary';
import { getPeriodProfitInputs } from '@/db/period-profit';
import { getPeriodTopProducts } from '@/db/period-top-products';
import { getPeriodTotals } from '@/db/period-totals';
import type { PeriodRange } from '@/lib/period-dates';
import { estimatePeriodProfit } from '@/lib/period-profit-estimate';
import type { PeriodTotals } from '@/lib/period-summary';
import {
  applyDayExpenses,
  type NetProfitEstimate,
} from '@/lib/profit-estimate';

const LOAD_ERROR = 'No se pudo cargar el reporte del periodo.';

export type PeriodReport = {
  totals: PeriodTotals;
  previousTotals: PeriodTotals;
  profit: NetProfitEstimate;
  previousProfit: NetProfitEstimate;
  topProducts: DayTopProduct[];
};

export type PeriodReportState = {
  report: PeriodReport | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

type LoadedReport = { key: string; report: PeriodReport };
type KeyedError = { key: string; message: string };

function periodKey(range: PeriodRange, previous: PeriodRange): string {
  return [range.kind, range.start, range.end, previous.start, previous.end].join('|');
}

async function loadReport(
  db: SQLiteDatabase,
  range: PeriodRange,
  previous: PeriodRange
): Promise<PeriodReport> {
  const [totals, previousTotals, topProducts, current, before] =
    await Promise.all([
      getPeriodTotals(db, range.start, range.end),
      getPeriodTotals(db, previous.start, previous.end),
      getPeriodTopProducts(db, range.start, range.end),
      getPeriodProfitInputs(db, range.start, range.end),
      getPeriodProfitInputs(db, previous.start, previous.end),
    ]);

  return {
    totals,
    previousTotals,
    topProducts,
    profit: applyDayExpenses(
      estimatePeriodProfit(current.soldRows, current.costRows),
      totals.expensesCents,
      totals.expensesCount
    ),
    previousProfit: applyDayExpenses(
      estimatePeriodProfit(before.soldRows, before.costRows),
      previousTotals.expensesCents,
      previousTotals.expensesCount
    ),
  };
}

export function usePeriodReport(
  range: PeriodRange,
  previousRange: PeriodRange
): PeriodReportState {
  const db = useSQLiteContext();
  const [data, setData] = useState<LoadedReport | null>(null);
  const [pending, setPending] = useState(true);
  const [errorState, setErrorState] = useState<KeyedError | null>(null);
  const requestId = useRef(0);
  const key = periodKey(range, previousRange);

  const reload = useCallback(async () => {
    const request = requestId.current + 1;
    requestId.current = request;
    setPending(true);
    setErrorState(null);

    try {
      const report = await loadReport(db, range, previousRange);
      if (request !== requestId.current) {
        return;
      }
      setData({ key, report });
    } catch {
      if (request === requestId.current) {
        setErrorState({ key, message: LOAD_ERROR });
      }
    } finally {
      if (request === requestId.current) {
        setPending(false);
      }
    }
  }, [db, key, range, previousRange]);

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
    report: current?.report ?? null,
    loading,
    error,
    reload,
  };
}

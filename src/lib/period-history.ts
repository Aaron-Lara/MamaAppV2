// Historial de periodos recientes: una fila por semana o mes, solo lectura.
// Lógica pura: recibe los días ya consultados y no escribe nada.

import {
  periodLabel,
  periodRange,
  periodStart,
  recentPeriodStarts,
  type PeriodKind,
} from './period-dates';
import { sumPeriodDays, type DailyTotals } from './period-summary';

export type PeriodHistoryRow = {
  start: string;
  label: string;
  salesCents: number;
  salesCount: number;
  isCurrent: boolean;
};

/**
 * Filas del más reciente al más viejo. El periodo actual va primero y los
 * periodos sin datos quedan en cero; los días fuera del historial se ignoran.
 */
export function buildPeriodHistory(
  kind: PeriodKind,
  days: readonly DailyTotals[],
  count: number,
  today: string
): PeriodHistoryRow[] {
  const currentStart = periodStart(kind, today);

  return recentPeriodStarts(kind, count, today).map((start) => {
    const range = periodRange(kind, start, today);
    const totals = sumPeriodDays(days, range.start, range.end);
    // La etiqueta muestra el periodo natural; el recorte a hoy se indica aparte.
    const labelRange = { ...range, end: range.periodEnd };
    return {
      start,
      label: periodLabel(labelRange, today),
      salesCents: totals.salesCents,
      salesCount: totals.activeSalesCount,
      isCurrent: start === currentStart,
    };
  });
}

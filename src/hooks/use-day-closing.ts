// Cierre del día memoizado a partir de datos ya cargados por el Resumen.
// No consulta la base ni guarda nada.

import { useMemo } from 'react';

import type { DaySummary } from '@/db/day-summary';
import { buildDayClosing } from '@/lib/day-closing';
import type { DayClosing } from '@/lib/day-closing-types';
import type { NetProfitEstimate } from '@/lib/profit-estimate';

export function useDayClosing(
  label: string,
  summary: DaySummary | null,
  profit: NetProfitEstimate | null,
  profitLoading = false,
  profitFailed = false
): DayClosing | null {
  return useMemo(
    () =>
      summary
        ? buildDayClosing({ label, summary, profit, profitLoading, profitFailed })
        : null,
    [label, summary, profit, profitLoading, profitFailed]
  );
}

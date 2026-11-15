// Cierre del día: junta totales, ganancia, top y stock en bloques listos para
// mostrar o compartir. Lógica pura: no consulta la base ni guarda nada.

import { buildDayClosingWarnings, buildProfitSection } from '@/lib/day-closing-profit';
import {
  buildCashSection,
  buildSalesSection,
  buildStockSection,
  buildTopSection,
} from '@/lib/day-closing-sections';
import type { DayClosing, DayClosingInput } from '@/lib/day-closing-types';
import { INVALID_DAY_LABEL, writtenDate } from '@/lib/day-navigation';
import { buildDaySummaryView } from '@/lib/day-summary-view';

/** "Hoy" -> "Cierre de hoy"; una fecha escrita -> "Cierre del 3 de noviembre". */
export function buildDayClosingHeadline(label: string): string {
  const text = label.trim();
  if (text === 'Hoy') {
    return 'Cierre de hoy';
  }
  if (text === 'Ayer') {
    return 'Cierre de ayer';
  }
  if (text === '' || text === INVALID_DAY_LABEL) {
    return 'Cierre del día';
  }
  return `Cierre del ${text}`;
}

export function buildDayClosing({
  label,
  summary,
  profit,
  profitLoading = false,
  profitFailed = false,
}: DayClosingInput): DayClosing {
  const view = buildDaySummaryView(summary);
  const fecha = writtenDate(summary.date);
  // Un error solo cuenta si no hay datos y no hay una carga en curso.
  const failed = profitFailed && !profitLoading && !profit;

  return {
    headline: buildDayClosingHeadline(label),
    dateLabel: fecha === INVALID_DAY_LABEL ? null : fecha,
    sections: [
      buildSalesSection(view, summary),
      buildCashSection(view),
      buildProfitSection(profit, profitLoading, failed),
      buildTopSection(summary.topProducts),
      buildStockSection(summary.stockReview),
    ],
    warnings: buildDayClosingWarnings(summary, profit, failed),
    hasActivity:
      summary.activeSalesCount > 0 ||
      summary.voidedSalesCount > 0 ||
      summary.paymentsCents > 0 ||
      (profit?.expensesCents ?? 0) > 0,
    profitPending: profitLoading && !profit,
    profitFailed: failed,
  };
}

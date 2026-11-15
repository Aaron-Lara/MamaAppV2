// Tarjetas y comparaciones de un periodo listas para mostrar.
// Lógica pura: recibe totales y ganancia ya calculados.

import { formatCents } from './money';
import { compareValues, formatChange, type ChangeDirection } from './period-compare';
import type { PeriodTotals } from './period-summary';
import type { NetProfitEstimate } from './profit-estimate';

export type PeriodCard = {
  key: string;
  label: string;
  value: string;
  note?: string;
};

export type ComparisonRow = {
  key: string;
  label: string;
  currentLabel: string;
  previousLabel: string;
  changeLabel: string;
  direction: ChangeDirection | 'none';
};

export type PeriodViewInput = {
  totals: PeriodTotals;
  previous: PeriodTotals;
  profit: NetProfitEstimate | null;
  previousProfit: NetProfitEstimate | null;
};

function countLabel(count: number, singular: string, plural: string): string {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
}

function hasActivity(profit: NetProfitEstimate): boolean {
  return profit.hasSales || profit.expensesCents > 0;
}

/** Mismos estados que la tarjeta de ganancia del Resumen diario. */
function profitValue(profit: NetProfitEstimate | null): string {
  if (!profit) return 'Sin datos';
  if (!hasActivity(profit)) return 'Sin ventas';
  return profit.hasKnownNet ? formatCents(profit.netProfitCents) : 'Sin datos de costo';
}

function buildProfitCard(profit: NetProfitEstimate | null): PeriodCard {
  if (!profit) {
    return { key: 'profit', label: 'Ganancia neta estimada', value: 'Sin datos' };
  }
  const loss = profit.hasKnownNet && profit.isNetLoss;
  const card: PeriodCard = {
    key: 'profit',
    label: loss ? 'Pérdida estimada' : 'Ganancia neta estimada',
    value: profitValue(profit),
  };
  if (hasActivity(profit)) {
    card.note = 'Es una estimación';
  }
  return card;
}

export function buildPeriodCards({ totals, profit }: PeriodViewInput): PeriodCard[] {
  return [
    {
      key: 'sales',
      label: 'Ventas',
      value: formatCents(totals.salesCents),
      note: countLabel(totals.activeSalesCount, 'venta', 'ventas'),
    },
    { key: 'cash', label: 'Efectivo', value: formatCents(totals.cashCents) },
    { key: 'credit', label: 'Fiado', value: formatCents(totals.creditCents) },
    {
      key: 'payments',
      label: 'Abonos cobrados',
      value: formatCents(totals.paymentsCents),
      note: countLabel(totals.paymentsCount, 'abono', 'abonos'),
    },
    {
      key: 'expenses',
      label: 'Gastos',
      value: formatCents(totals.expensesCents),
      note: countLabel(totals.expensesCount, 'gasto', 'gastos'),
    },
    buildProfitCard(profit),
    {
      key: 'voided',
      label: 'Anuladas',
      value: String(totals.voidedSalesCount),
      note: 'solo conteo',
    },
  ];
}

function moneyRow(
  key: string,
  label: string,
  currentCents: number,
  previousCents: number
): ComparisonRow {
  const change = compareValues(currentCents, previousCents);
  return {
    key,
    label,
    currentLabel: formatCents(currentCents),
    previousLabel: formatCents(previousCents),
    changeLabel: formatChange(change),
    direction: change.direction,
  };
}

function profitRow(
  profit: NetProfitEstimate | null,
  previousProfit: NetProfitEstimate | null
): ComparisonRow {
  const currentLabel = profitValue(profit);
  const previousLabel = profitValue(previousProfit);

  if (!profit || !previousProfit || !profit.hasKnownNet || !previousProfit.hasKnownNet) {
    return {
      key: 'profit',
      label: 'Ganancia neta',
      currentLabel,
      previousLabel,
      changeLabel: 'sin datos suficientes',
      direction: 'none',
    };
  }

  const change = compareValues(profit.netProfitCents, previousProfit.netProfitCents);
  return {
    key: 'profit',
    label: 'Ganancia neta',
    currentLabel,
    previousLabel,
    changeLabel: formatChange(change),
    direction: change.direction,
  };
}

export function buildPeriodComparisons({
  totals,
  previous,
  profit,
  previousProfit,
}: PeriodViewInput): ComparisonRow[] {
  return [
    moneyRow('sales', 'Ventas', totals.salesCents, previous.salesCents),
    moneyRow('cash', 'Efectivo', totals.cashCents, previous.cashCents),
    moneyRow('credit', 'Fiado', totals.creditCents, previous.creditCents),
    moneyRow('payments', 'Abonos', totals.paymentsCents, previous.paymentsCents),
    moneyRow('expenses', 'Gastos', totals.expensesCents, previous.expensesCents),
    profitRow(profit, previousProfit),
  ];
}

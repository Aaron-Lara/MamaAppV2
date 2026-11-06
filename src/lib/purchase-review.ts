// Datos de la revisión de una compra. Solo formatea valores ya calculados por
// el formulario; no repite reglas ni cálculos financieros.

import { formatCents } from './money';
import { unitCostCents } from './purchase-cost';
import type { PurchaseFormValues, PurchaseLineTotals } from './purchase-form';
import type { PurchaseCurrency } from './purchase-types';

export type PurchaseReviewLine = {
  key: string;
  title: string;
  unitsLabel: string;
  totalLabel: string;
  totalMxnLabel: string | null;
  unitLabel: string;
  unitMxnLabel: string | null;
};

export type PurchaseReview = {
  dateLabel: string;
  storeLabel: string | null;
  currencyLabel: string;
  exchangeRateLabel: string | null;
  lines: PurchaseReviewLine[];
  totalLabel: string;
  totalMxnLabel: string | null;
};

type LineForm = PurchaseFormValues['lines'][number];

function formatMoney(cents: number, currency: PurchaseCurrency): string {
  return currency === 'USD' ? `US${formatCents(cents)}` : formatCents(cents);
}

function lineTitle(line: LineForm): string {
  return line.description.trim() || line.productName?.trim() || 'Producto sin nombre';
}

function fallbackLine(line: LineForm): PurchaseReviewLine {
  const units = line.units.trim();
  return {
    key: line.key,
    title: lineTitle(line),
    unitsLabel: units ? `${units} unidades` : '—',
    totalLabel: '—',
    totalMxnLabel: null,
    unitLabel: '—',
    unitMxnLabel: null,
  };
}

function buildLine(
  line: LineForm,
  totals: PurchaseLineTotals | undefined,
  currency: PurchaseCurrency
): PurchaseReviewLine {
  const units = Number(line.units);
  if (
    !totals ||
    totals.costCents === null ||
    totals.costMxnCents === null ||
    totals.unitCostMxnCents === null ||
    !Number.isSafeInteger(units) ||
    units <= 0
  ) {
    return fallbackLine(line);
  }
  return {
    key: line.key,
    title: lineTitle(line),
    unitsLabel: `${units} ${units === 1 ? 'unidad' : 'unidades'}`,
    totalLabel: formatMoney(totals.costCents, currency),
    totalMxnLabel: currency === 'USD' ? formatCents(totals.costMxnCents) : null,
    unitLabel: formatMoney(unitCostCents(totals.costCents, units), currency),
    unitMxnLabel: currency === 'USD' ? formatCents(totals.unitCostMxnCents) : null,
  };
}

export function buildPurchaseReview(params: {
  dateLabel: string;
  values: PurchaseFormValues;
  lineTotals: Record<string, PurchaseLineTotals>;
  totalCents: number;
  totalMxnCents: number;
}): PurchaseReview {
  const { dateLabel, values, lineTotals, totalCents, totalMxnCents } = params;
  const currency = values.currency;
  return {
    dateLabel,
    storeLabel: values.store.trim() || null,
    currencyLabel: currency === 'USD' ? 'Dólares (USD)' : 'Pesos (MXN)',
    exchangeRateLabel:
      currency === 'USD' ? `${values.exchangeRate.trim()} pesos por dólar` : null,
    lines: values.lines.map((line) => buildLine(line, lineTotals[line.key], currency)),
    totalLabel: formatMoney(totalCents, currency),
    totalMxnLabel: currency === 'USD' ? formatCents(totalMxnCents) : null,
  };
}

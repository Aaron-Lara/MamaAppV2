// Filas listas para mostrar la lista y el detalle de compras. Lógica pura:
// no toca la base ni React, así que se prueba con Jest.

import type { PurchaseDetail, PurchaseDetailLine } from '@/db/purchases-get';
import type { PurchaseListItem } from '@/db/purchases-list';
import { dayLabel } from './day-navigation';
import { EXCHANGE_RATE_SCALE } from './exchange-rate';
import { formatCents } from './money';
import { unitCostCents } from './purchase-cost';
import type { PurchaseCurrency } from './purchase-types';

export type PurchaseRow = {
  id: number;
  storeLabel: string;
  dateLabel: string;
  totalLabel: string;
  itemsLabel: string;
  isVoid: boolean;
  statusLabel: string;
};

export type PurchaseDetailRow = {
  id: number;
  title: string;
  unitsLabel: string;
  costLabel: string;
  costMxnLabel: string;
  unitCostLabel: string;
  currency: PurchaseCurrency;
};

export type PurchaseDetailHeader = {
  storeLabel: string;
  dateLabel: string;
  currencyLabel: string;
  exchangeRateLabel: string | null;
  totalLabel: string;
  totalMxnLabel: string;
  itemsLabel: string;
  isVoid: boolean;
  voidReasonLabel: string | null;
};

function storeText(store: string | null): string {
  const trimmed = store?.trim() ?? '';
  return trimmed || 'Sin tienda';
}

function itemsText(count: number): string {
  return `${count} ${count === 1 ? 'renglón' : 'renglones'}`;
}

/** Total para mostrar: en pesos, o en dólares con su equivalente en pesos. */
export function purchaseTotalLabel(
  currency: PurchaseCurrency,
  totalCents: number,
  totalMxnCents: number
): string {
  if (currency === 'MXN') {
    return formatCents(totalCents);
  }
  return `US${formatCents(totalCents)} → ${formatCents(totalMxnCents)}`;
}

/** 205000 -> "20.50". Redondea a dos decimales para mostrarlo. */
export function formatPurchaseRate(rateX10000: number): string {
  if (!Number.isSafeInteger(rateX10000) || rateX10000 <= 0) {
    throw new Error('El tipo de cambio no es válido.');
  }
  const hundredths = Math.round(rateX10000 / (EXCHANGE_RATE_SCALE / 100));
  return `${Math.floor(hundredths / 100)}.${String(hundredths % 100).padStart(2, '0')}`;
}

/** Convierte las compras de la base en filas de la lista. */
export function buildPurchaseRows(
  items: readonly PurchaseListItem[],
  today: string
): PurchaseRow[] {
  return items.map((item) => ({
    id: item.id,
    storeLabel: storeText(item.store),
    dateLabel: dayLabel(item.purchase_date, today),
    totalLabel: purchaseTotalLabel(item.currency, item.total_cents, item.total_mxn_cents),
    itemsLabel: itemsText(item.item_count),
    isVoid: item.status === 'void',
    statusLabel: item.status === 'void' ? 'Anulada' : 'Activa',
  }));
}

/** Encabezado del detalle: tienda, fecha, moneda, tipo de cambio y totales. */
export function buildPurchaseDetailHeader(
  detail: PurchaseDetail,
  today: string
): PurchaseDetailHeader {
  return {
    storeLabel: storeText(detail.store),
    dateLabel: dayLabel(detail.purchase_date, today),
    currencyLabel: detail.currency,
    exchangeRateLabel:
      detail.currency === 'USD' ? formatPurchaseRate(detail.exchange_rate_x10000) : null,
    totalLabel: purchaseTotalLabel(
      detail.currency,
      detail.total_cents,
      detail.total_mxn_cents
    ),
    totalMxnLabel: formatCents(detail.total_mxn_cents),
    itemsLabel: itemsText(detail.item_count),
    isVoid: detail.status === 'void',
    voidReasonLabel: detail.void_reason?.trim() || null,
  };
}

function lineTitle(line: PurchaseDetailLine): string {
  const description = line.description.trim();
  if (description) {
    return description;
  }
  return line.product_name?.trim() || 'Sin descripción';
}

/** Renglones del detalle con sus costos y el costo por unidad. */
export function buildPurchaseDetailRows(
  lines: readonly PurchaseDetailLine[],
  currency: PurchaseCurrency
): PurchaseDetailRow[] {
  return lines.map((line) => {
    const original = formatCents(line.cost_cents);
    return {
      id: line.id,
      title: lineTitle(line),
      unitsLabel: `${line.units} ${line.units === 1 ? 'unidad' : 'unidades'}`,
      costLabel: currency === 'USD' ? `US${original}` : original,
      costMxnLabel: formatCents(line.cost_mxn_cents),
      unitCostLabel: formatCents(unitCostCents(line.cost_mxn_cents, line.units)),
      currency,
    };
  });
}

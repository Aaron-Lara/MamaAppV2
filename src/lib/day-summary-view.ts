// Arma las tarjetas del Resumen del día. Lógica pura: solo centavos enteros.

import type { DaySummary } from '@/db/day-summary';
import { formatCents, sumCents } from '@/lib/money';

export type DaySummaryView = {
  salesTotalCents: number;
  salesCount: number;
  cashCents: number;
  creditCents: number;
  paymentsCents: number;
  cashInDrawerCents: number;
  voidedCount: number;
};

export type DaySummaryCard = {
  key: string;
  label: string;
  value: string;
  note?: string;
};

/**
 * Números listos para las tarjetas. La caja del día es solo efectivo de
 * ventas activas más abonos activos: nunca incluye fiado ni anulados.
 */
export function buildDaySummaryView(summary: DaySummary): DaySummaryView {
  return {
    salesTotalCents: sumCents([summary.cashCents, summary.creditCents]),
    salesCount: summary.activeSalesCount,
    cashCents: summary.cashCents,
    creditCents: summary.creditCents,
    paymentsCents: summary.paymentsCents,
    cashInDrawerCents: sumCents([summary.cashCents, summary.paymentsCents]),
    voidedCount: summary.voidedSalesCount,
  };
}

/** Tarjetas en orden de lectura, con el texto ya formateado. */
export function buildDaySummaryCards(view: DaySummaryView): DaySummaryCard[] {
  return [
    {
      key: 'sales',
      label: 'Ventas',
      value: formatCents(view.salesTotalCents),
      note: view.salesCount === 1 ? '1 venta' : `${view.salesCount} ventas`,
    },
    { key: 'cash', label: 'Efectivo', value: formatCents(view.cashCents) },
    { key: 'credit', label: 'Fiado', value: formatCents(view.creditCents) },
    {
      key: 'payments',
      label: 'Abonos cobrados',
      value: formatCents(view.paymentsCents),
    },
    {
      key: 'drawer',
      label: 'Dinero en caja del día',
      value: formatCents(view.cashInDrawerCents),
      note: 'No incluye compras ni gastos',
    },
  ];
}

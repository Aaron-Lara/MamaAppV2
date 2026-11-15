// Secciones del cierre del día que salen solo del resumen: ventas, caja, top
// y stock. Lógica pura, sin consultas ni estado.

import type { DaySummary, DayTopProduct } from '@/db/day-summary';
import type { DayClosingLine, DayClosingSection } from '@/lib/day-closing-types';
import type { DaySummaryView } from '@/lib/day-summary-view';
import { formatCents } from '@/lib/money';
import type { StockReview } from '@/lib/stock-review';

function salesLabel(count: number): string {
  return count === 1 ? '1 venta' : `${count} ventas`;
}

function productLabel(count: number): string {
  return count === 1 ? '1 producto' : `${count} productos`;
}

function unitLabel(count: number): string {
  return count === 1 ? '1 unidad' : `${count} unidades`;
}

export function buildSalesSection(
  view: DaySummaryView,
  summary: DaySummary
): DayClosingSection {
  const lines: DayClosingLine[] = [
    {
      key: 'sales-total',
      label: 'Ventas del día',
      value: formatCents(view.salesTotalCents),
      note: salesLabel(view.salesCount),
    },
    { key: 'sales-cash', label: 'Efectivo', value: formatCents(view.cashCents) },
    { key: 'sales-credit', label: 'Fiado', value: formatCents(view.creditCents) },
  ];

  // Las anuladas solo se cuentan: nunca se suman al dinero del día.
  if (summary.voidedSalesCount > 0) {
    lines.push({
      key: 'sales-void',
      label: 'Ventas anuladas',
      value: salesLabel(summary.voidedSalesCount),
      note: 'No suman a los totales',
      tone: 'warning',
    });
  } else {
    lines.push({
      key: 'sales-void',
      label: 'Ventas anuladas',
      value: 'Ninguna',
      tone: 'muted',
    });
  }

  return { key: 'sales', title: 'Ventas', lines };
}

export function buildCashSection(view: DaySummaryView): DayClosingSection {
  return {
    key: 'cash',
    title: 'Caja y abonos',
    lines: [
      {
        key: 'cash-payments',
        label: 'Abonos cobrados',
        value: formatCents(view.paymentsCents),
      },
      {
        key: 'cash-drawer',
        label: 'Dinero en caja del día',
        value: formatCents(view.cashInDrawerCents),
        note: 'No incluye compras ni gastos',
      },
    ],
  };
}

export function buildTopSection(products: readonly DayTopProduct[]): DayClosingSection {
  const lines: DayClosingLine[] = products.map((product) => ({
    key: `top-${product.productId}`,
    label: product.name,
    value: unitLabel(product.units),
  }));

  if (lines.length === 0) {
    lines.push({
      key: 'top-empty',
      label: 'Productos vendidos',
      value: 'Ninguno',
      tone: 'muted',
    });
  }

  return { key: 'top', title: 'Más vendidos', lines };
}

export function buildStockSection(review: StockReview): DayClosingSection {
  const lines: DayClosingLine[] = [];

  if (review.outCount > 0) {
    lines.push({
      key: 'stock-out',
      label: 'Agotados',
      value: productLabel(review.outCount),
      tone: 'danger',
    });
  }
  if (review.lowCount > 0) {
    lines.push({
      key: 'stock-low',
      label: 'Por agotarse',
      value: productLabel(review.lowCount),
      tone: 'warning',
    });
  }
  if (lines.length === 0) {
    lines.push({
      key: 'stock-ok',
      label: 'Inventario',
      value: 'Todo en orden',
      tone: 'muted',
    });
  }

  return { key: 'stock', title: 'Inventario actual (hoy)', lines };
}

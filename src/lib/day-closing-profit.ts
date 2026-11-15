// Sección de ganancia del cierre y sus advertencias. Lógica pura: respeta la
// diferencia entre ganancia conocida, pérdida y ventas sin costo.

import type { DaySummary } from '@/db/day-summary';
import type { DayClosingLine, DayClosingSection } from '@/lib/day-closing-types';
import { formatCents } from '@/lib/money';
import type { NetProfitEstimate } from '@/lib/profit-estimate';

function expenseNote(count: number): string {
  if (count === 0) {
    return 'Sin gastos activos';
  }
  return count === 1 ? '1 gasto activo' : `${count} gastos activos`;
}

function uncostedProductsLabel(count: number): string {
  return count === 1
    ? '1 producto sin costo conocido. Regístralo en Compras.'
    : `${count} productos sin costo conocido. Regístralos en Compras.`;
}

export function buildProfitSection(
  profit: NetProfitEstimate | null,
  loading = false,
  failed = false
): DayClosingSection {
  if (!profit) {
    return {
      key: 'profit',
      title: 'Ganancia',
      lines: [
        {
          key: 'profit-empty',
          label: 'Ganancia estimada',
          value: loading
            ? 'Calculando…'
            : failed
              ? 'No se pudo calcular la ganancia'
              : 'Sin datos',
          tone: failed && !loading ? 'warning' : 'muted',
        },
      ],
    };
  }

  if (!profit.hasSales && profit.expensesCents === 0) {
    return {
      key: 'profit',
      title: 'Ganancia',
      lines: [
        {
          key: 'profit-empty',
          label: 'Resultado del día',
          value: 'Sin ventas ni gastos',
          tone: 'muted',
        },
      ],
    };
  }

  if (!profit.hasSales) {
    return {
      key: 'profit',
      title: 'Ganancia',
      lines: [
        {
          key: 'profit-expenses',
          label: 'Gastos del día',
          value: formatCents(profit.expensesCents),
          note: expenseNote(profit.expensesCount),
        },
        {
          key: 'profit-net',
          label: profit.isNetLoss ? 'Pérdida del día' : 'Resultado del día',
          value: formatCents(profit.netProfitCents),
          note: 'Solo hubo gastos, sin ventas',
          tone: profit.isNetLoss ? 'danger' : 'default',
        },
      ],
    };
  }

  if (!profit.hasKnownCosts) {
    const lines: DayClosingLine[] = [
      {
        key: 'profit-gross',
        label: 'Ganancia estimada',
        value: 'Sin datos de costo',
        tone: 'warning',
      },
      {
        key: 'profit-expenses',
        label: 'Gastos del día',
        value: formatCents(profit.expensesCents),
        note: expenseNote(profit.expensesCount),
      },
      {
        key: 'profit-net',
        label: 'Resultado con gastos',
        value: 'No se puede estimar',
        tone: 'warning',
      },
    ];
    if (profit.uncostedRevenueCents > 0) {
      lines.push({
        key: 'profit-uncosted',
        label: 'Ventas sin costo conocido',
        value: formatCents(profit.uncostedRevenueCents),
        note: 'No incluidas en la ganancia',
      });
    }
    return { key: 'profit', title: 'Ganancia', lines };
  }

  const lines: DayClosingLine[] = [
    {
      key: 'profit-gross',
      label: 'Ganancia antes de gastos',
      value: formatCents(profit.profitCents),
      tone: profit.isLoss ? 'danger' : 'default',
    },
    {
      key: 'profit-expenses',
      label: 'Gastos del día',
      value: formatCents(profit.expensesCents),
      note: expenseNote(profit.expensesCount),
    },
    {
      key: 'profit-net',
      label: profit.isNetLoss ? 'Pérdida neta estimada' : 'Ganancia neta estimada',
      value: formatCents(profit.netProfitCents),
      note: 'Estimación con el último costo conocido',
      tone: profit.isNetLoss ? 'danger' : 'default',
    },
  ];

  if (profit.uncostedRevenueCents > 0) {
    lines.push({
      key: 'profit-uncosted',
      label: 'Ventas sin costo conocido',
      value: formatCents(profit.uncostedRevenueCents),
      note: 'No incluidas en la ganancia',
    });
  }

  return { key: 'profit', title: 'Ganancia', lines };
}

export function buildDayClosingWarnings(
  summary: DaySummary,
  profit: NetProfitEstimate | null,
  failed = false
): string[] {
  const warnings: string[] = [];

  if (summary.activeSalesCount === 0 && summary.voidedSalesCount > 0) {
    warnings.push('Todas las ventas del día están anuladas.');
  }

  if (failed) {
    warnings.push('No se pudo calcular la ganancia. El cierre no incluye ganancia ni gastos.');
  }

  if (!profit) {
    return warnings;
  }

  if (profit.hasSales && !profit.hasKnownCosts) {
    warnings.push('No hay costos conocidos de lo vendido: la ganancia no se puede estimar.');
  }
  if (profit.uncostedProductCount > 0) {
    warnings.push(uncostedProductsLabel(profit.uncostedProductCount));
  }
  if (profit.uncostedRevenueCents > 0) {
    warnings.push(
      `${formatCents(profit.uncostedRevenueCents)} de ventas sin costo conocido quedan fuera de la ganancia.`
    );
  }

  return warnings;
}

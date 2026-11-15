// Pruebas de la sección de ganancia del cierre: costo conocido, costo
// desconocido, pérdida, solo gastos y ausencia de datos.

import type { DaySummary } from '../../db/day-summary';
import { buildDayClosing } from '../day-closing';
import type { DayClosing } from '../day-closing-types';
import type { NetProfitEstimate } from '../profit-estimate';

const resumen: DaySummary = {
  date: '2026-11-03',
  activeSalesCount: 3,
  voidedSalesCount: 0,
  cashCents: 10000,
  creditCents: 5000,
  paymentsCents: 2000,
  topProducts: [],
  stockReview: { outCount: 0, lowCount: 0 },
};

function profit(overrides: Partial<NetProfitEstimate> = {}): NetProfitEstimate {
  return {
    profitCents: 800,
    isLoss: false,
    costOfGoodsCents: 200,
    costedRevenueCents: 1000,
    uncostedRevenueCents: 0,
    uncostedProductCount: 0,
    hasSales: true,
    hasKnownCosts: true,
    expensesCents: 300,
    expensesCount: 2,
    netProfitCents: 500,
    isNetLoss: false,
    hasKnownNet: true,
    ...overrides,
  };
}

function build(datos: NetProfitEstimate | null): DayClosing {
  return buildDayClosing({ label: 'Hoy', summary: resumen, profit: datos });
}

function line(closing: DayClosing, lineKey: string) {
  const found = closing.sections
    .find((section) => section.key === 'profit')
    ?.lines.find((item) => item.key === lineKey);
  if (!found) {
    throw new Error(`Falta el renglón ${lineKey}`);
  }
  return found;
}

describe('ganancia con costo conocido', () => {
  test('muestra ganancia antes de gastos, gastos y ganancia neta', () => {
    const closing = build(profit());
    expect(line(closing, 'profit-gross').value).toBe('$8.00');
    expect(line(closing, 'profit-expenses').value).toBe('$3.00');
    expect(line(closing, 'profit-expenses').note).toBe('2 gastos activos');
    expect(line(closing, 'profit-net').label).toBe('Ganancia neta estimada');
    expect(line(closing, 'profit-net').value).toBe('$5.00');
    expect(line(closing, 'profit-net').note).toBe('Estimación con el último costo conocido');
  });

  test('marca la pérdida sin ocultar el signo', () => {
    const closing = build(
      profit({
        profitCents: -500,
        isLoss: true,
        expensesCents: 0,
        expensesCount: 0,
        netProfitCents: -500,
        isNetLoss: true,
      })
    );
    expect(line(closing, 'profit-gross').value).toBe('-$5.00');
    expect(line(closing, 'profit-gross').tone).toBe('danger');
    expect(line(closing, 'profit-net').label).toBe('Pérdida neta estimada');
    expect(line(closing, 'profit-net').tone).toBe('danger');
  });
});

describe('ganancia con información incompleta', () => {
  test('no estima la ganancia si no hay costos conocidos', () => {
    const closing = build(
      profit({
        profitCents: 0,
        costOfGoodsCents: 0,
        costedRevenueCents: 0,
        uncostedRevenueCents: 1500,
        uncostedProductCount: 2,
        hasKnownCosts: false,
        expensesCents: 0,
        expensesCount: 0,
        netProfitCents: 0,
        hasKnownNet: false,
      })
    );

    expect(line(closing, 'profit-gross').value).toBe('Sin datos de costo');
    expect(line(closing, 'profit-net').value).toBe('No se puede estimar');
    expect(closing.warnings).toContain(
      'No hay costos conocidos de lo vendido: la ganancia no se puede estimar.'
    );
    expect(closing.warnings).toContain(
      '2 productos sin costo conocido. Regístralos en Compras.'
    );
  });

  test('separa las ventas sin costo de una ganancia sí conocida', () => {
    const closing = build(
      profit({ uncostedRevenueCents: 600, uncostedProductCount: 1 })
    );

    expect(line(closing, 'profit-uncosted').value).toBe('$6.00');
    expect(line(closing, 'profit-uncosted').note).toBe('No incluidas en la ganancia');
    expect(closing.warnings).toContain(
      '1 producto sin costo conocido. Regístralo en Compras.'
    );
    expect(closing.warnings).not.toContain(
      'No hay costos conocidos de lo vendido: la ganancia no se puede estimar.'
    );
  });
});

describe('días sin ventas o sin datos', () => {
  test('sin ventas ni gastos lo dice en una sola línea', () => {
    const closing = build(
      profit({
        profitCents: 0,
        hasSales: false,
        hasKnownCosts: false,
        costedRevenueCents: 0,
        expensesCents: 0,
        expensesCount: 0,
        netProfitCents: 0,
        isNetLoss: false,
      })
    );
    expect(line(closing, 'profit-empty').value).toBe('Sin ventas ni gastos');
  });

  test('solo con gastos muestra la pérdida del día', () => {
    const closing = build(
      profit({
        profitCents: 0,
        hasSales: false,
        hasKnownCosts: false,
        costedRevenueCents: 0,
        expensesCents: 600,
        expensesCount: 3,
        netProfitCents: -600,
        isNetLoss: true,
        hasKnownNet: true,
      })
    );
    expect(line(closing, 'profit-expenses').value).toBe('$6.00');
    expect(line(closing, 'profit-expenses').note).toBe('3 gastos activos');
    expect(line(closing, 'profit-net').label).toBe('Pérdida del día');
    expect(line(closing, 'profit-net').value).toBe('-$6.00');
  });

  test('mientras la ganancia no carga no inventa cifras', () => {
    const closing = build(null);
    expect(line(closing, 'profit-empty').value).toBe('Sin datos');
    expect(closing.profitPending).toBe(false);
    expect(closing.warnings).toEqual([]);
  });

  test('mientras la ganancia se calcula lo indica y no deja compartir', () => {
    const closing = buildDayClosing({
      label: 'Hoy',
      summary: resumen,
      profit: null,
      profitLoading: true,
    });
    expect(line(closing, 'profit-empty').value).toBe('Calculando…');
    expect(closing.profitPending).toBe(true);
  });
});

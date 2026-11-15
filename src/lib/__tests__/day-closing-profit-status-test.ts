// Pruebas del estado del cálculo de la ganancia en el cierre: error, reintento
// y datos ya calculados. Solo lógica pura, sin base de datos.

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

function profit(): NetProfitEstimate {
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
  };
}

function build(
  datos: NetProfitEstimate | null,
  options: { loading?: boolean; failed?: boolean } = {}
): DayClosing {
  return buildDayClosing({
    label: 'Hoy',
    summary: resumen,
    profit: datos,
    profitLoading: options.loading,
    profitFailed: options.failed,
  });
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

describe('estado del cálculo de la ganancia', () => {
  test('si el cálculo falla lo dice y no muestra cero', () => {
    const closing = build(null, { failed: true });
    expect(line(closing, 'profit-empty').value).toBe('No se pudo calcular la ganancia');
    expect(line(closing, 'profit-empty').tone).toBe('warning');
    expect(closing.profitFailed).toBe(true);
    expect(closing.profitPending).toBe(false);
    expect(closing.warnings).toContain(
      'No se pudo calcular la ganancia. El cierre no incluye ganancia ni gastos.'
    );
  });

  test('mientras se reintenta muestra Calculando y no el error', () => {
    const closing = build(null, { loading: true, failed: true });
    expect(line(closing, 'profit-empty').value).toBe('Calculando…');
    expect(closing.profitPending).toBe(true);
    expect(closing.profitFailed).toBe(false);
    expect(closing.warnings).toEqual([]);
  });

  test('un error no tapa una ganancia ya calculada', () => {
    const closing = build(profit(), { failed: true });
    expect(line(closing, 'profit-net').value).toBe('$5.00');
    expect(closing.profitFailed).toBe(false);
    expect(closing.warnings).not.toContain(
      'No se pudo calcular la ganancia. El cierre no incluye ganancia ni gastos.'
    );
  });
});

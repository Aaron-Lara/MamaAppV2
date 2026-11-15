// Pruebas de las tarjetas y comparaciones de un periodo.

import { emptyPeriodTotals, type PeriodTotals } from '../period-summary';
import type { NetProfitEstimate } from '../profit-estimate';
import {
  buildPeriodCards,
  buildPeriodComparisons,
  type PeriodCard,
} from '../period-view';

function netProfit(overrides: Partial<NetProfitEstimate> = {}): NetProfitEstimate {
  return {
    profitCents: 0,
    isLoss: false,
    costOfGoodsCents: 0,
    costedRevenueCents: 0,
    uncostedRevenueCents: 0,
    uncostedProductCount: 0,
    hasSales: true,
    hasKnownCosts: true,
    expensesCents: 0,
    expensesCount: 0,
    netProfitCents: 0,
    isNetLoss: false,
    hasKnownNet: true,
    ...overrides,
  };
}

const CURRENT: PeriodTotals = {
  ...emptyPeriodTotals(),
  salesCents: 15000,
  cashCents: 10000,
  creditCents: 5000,
  activeSalesCount: 4,
  voidedSalesCount: 2,
  paymentsCents: 2000,
  paymentsCount: 1,
  expensesCents: 3000,
  expensesCount: 2,
  cashInDrawerCents: 12000,
};

const PREVIOUS: PeriodTotals = {
  ...emptyPeriodTotals(),
  salesCents: 12000,
  cashCents: 9000,
  creditCents: 3000,
  activeSalesCount: 3,
  paymentsCents: 1000,
  paymentsCount: 1,
  expensesCents: 2000,
  expensesCount: 1,
  cashInDrawerCents: 10000,
};

const BASE = {
  totals: CURRENT,
  previous: PREVIOUS,
  profit: netProfit({ netProfitCents: 4000 }),
  previousProfit: netProfit({ netProfitCents: 5000 }),
};

function card(cards: PeriodCard[], key: string): PeriodCard {
  const found = cards.find((item) => item.key === key);
  if (!found) throw new Error(`Falta la tarjeta ${key}.`);
  return found;
}

describe('buildPeriodCards', () => {
  test('arma las tarjetas del periodo con importes y conteos', () => {
    const cards = buildPeriodCards(BASE);
    expect(cards.map((item) => item.key)).toEqual([
      'sales', 'cash', 'credit', 'payments', 'expenses', 'profit', 'voided',
    ]);
    expect(card(cards, 'sales')).toMatchObject({ value: '$150.00', note: '4 ventas' });
    expect(card(cards, 'cash').value).toBe('$100.00');
    expect(card(cards, 'credit').value).toBe('$50.00');
    expect(card(cards, 'payments')).toMatchObject({ value: '$20.00', note: '1 abono' });
    expect(card(cards, 'expenses')).toMatchObject({ value: '$30.00', note: '2 gastos' });
    expect(card(cards, 'voided')).toMatchObject({ value: '2', note: 'solo conteo' });
  });

  test('usa los estados reales de la ganancia neta', () => {
    const normal = card(buildPeriodCards(BASE), 'profit');
    expect(normal).toMatchObject({
      label: 'Ganancia neta estimada',
      value: '$40.00',
      note: 'Es una estimación',
    });

    const loss = card(
      buildPeriodCards({
        ...BASE,
        profit: netProfit({ netProfitCents: -500, isNetLoss: true }),
      }),
      'profit'
    );
    expect(loss).toMatchObject({ label: 'Pérdida estimada', value: '-$5.00' });

    const noSales = card(
      buildPeriodCards({
        ...BASE,
        profit: netProfit({ hasSales: false, expensesCents: 0 }),
      }),
      'profit'
    );
    expect(noSales.value).toBe('Sin ventas');
    expect(noSales.note).toBeUndefined();

    const noCost = card(
      buildPeriodCards({ ...BASE, profit: netProfit({ hasKnownNet: false }) }),
      'profit'
    );
    expect(noCost.value).toBe('Sin datos de costo');

    const missing = card(buildPeriodCards({ ...BASE, profit: null }), 'profit');
    expect(missing.value).toBe('Sin datos');
  });
});

describe('buildPeriodComparisons', () => {
  test('compara las métricas del periodo contra el anterior', () => {
    const rows = buildPeriodComparisons(BASE);
    expect(rows.map((row) => row.key)).toEqual([
      'sales', 'cash', 'credit', 'payments', 'expenses', 'profit',
    ]);
    expect(rows[0]).toMatchObject({
      currentLabel: '$150.00',
      previousLabel: '$120.00',
      changeLabel: '+25 %',
      direction: 'up',
    });
    expect(rows[1]).toMatchObject({ changeLabel: '+11 %', direction: 'up' });
    expect(rows[2]).toMatchObject({ changeLabel: '+67 %', direction: 'up' });
    expect(rows[3]).toMatchObject({ changeLabel: '+100 %', direction: 'up' });
    expect(rows[4]).toMatchObject({ changeLabel: '+50 %', direction: 'up' });
  });

  test('la ganancia solo se compara si ambos periodos la conocen', () => {
    const profitRows = buildPeriodComparisons({
      ...BASE,
      profit: netProfit({ netProfitCents: 4000 }),
      previousProfit: netProfit({ netProfitCents: 5000 }),
    });
    expect(profitRows[5]).toMatchObject({
      currentLabel: '$40.00',
      previousLabel: '$50.00',
      changeLabel: '-20 %',
      direction: 'down',
    });

    const unknown = buildPeriodComparisons({
      ...BASE,
      previousProfit: netProfit({ hasKnownNet: false }),
    });
    expect(unknown[5]).toMatchObject({
      changeLabel: 'sin datos suficientes',
      direction: 'none',
    });
  });

  test('sin ganancia calculada muestra el estado y no inventa porcentaje', () => {
    const rows = buildPeriodComparisons({ ...BASE, profit: null });
    expect(rows[5]).toMatchObject({
      currentLabel: 'Sin datos',
      previousLabel: '$50.00',
      changeLabel: 'sin datos suficientes',
      direction: 'none',
    });
  });
});

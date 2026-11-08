// Pruebas de la ganancia neta: ganancia estimada menos gastos activos.

import {
  applyDayExpenses,
  estimateDayProfit,
  type ProfitEstimate,
} from '../profit-estimate';

function gross(overrides: Partial<ProfitEstimate> = {}): ProfitEstimate {
  return {
    profitCents: 1000,
    isLoss: false,
    costOfGoodsCents: 500,
    costedRevenueCents: 1500,
    uncostedRevenueCents: 0,
    uncostedProductCount: 0,
    hasSales: true,
    hasKnownCosts: true,
    ...overrides,
  };
}

describe('applyDayExpenses', () => {
  test('un día sin ventas ni gastos deja la ganancia neta en cero', () => {
    const result = applyDayExpenses(
      gross({
        profitCents: 0,
        isLoss: false,
        costOfGoodsCents: 0,
        costedRevenueCents: 0,
        hasSales: false,
        hasKnownCosts: false,
      }),
      0,
      0
    );
    expect(result.netProfitCents).toBe(0);
    expect(result.isNetLoss).toBe(false);
    expect(result.hasKnownNet).toBe(true);
    expect(result.expensesCents).toBe(0);
    expect(result.expensesCount).toBe(0);
  });

  test('resta los gastos activos a la ganancia estimada', () => {
    const result = applyDayExpenses(gross(), 300, 2);
    expect(result.profitCents).toBe(1000);
    expect(result.expensesCents).toBe(300);
    expect(result.expensesCount).toBe(2);
    expect(result.netProfitCents).toBe(700);
    expect(result.isNetLoss).toBe(false);
  });

  test('un día con gastos y sin ventas reporta pérdida', () => {
    const result = applyDayExpenses(
      gross({
        profitCents: 0,
        isLoss: false,
        costOfGoodsCents: 0,
        costedRevenueCents: 0,
        hasSales: false,
        hasKnownCosts: false,
      }),
      2500,
      1
    );
    expect(result.hasKnownNet).toBe(true);
    expect(result.netProfitCents).toBe(-2500);
    expect(result.isNetLoss).toBe(true);
  });

  test('la ganancia neta negativa sigue siendo una pérdida', () => {
    const result = applyDayExpenses(gross({ profitCents: -400, isLoss: true }), 100, 1);
    expect(result.netProfitCents).toBe(-500);
    expect(result.isNetLoss).toBe(true);
  });

  test('con ventas sin costo conocido la cifra neta no se marca como conocida', () => {
    const result = applyDayExpenses(
      gross({
        profitCents: 0,
        isLoss: false,
        costOfGoodsCents: 0,
        costedRevenueCents: 0,
        uncostedRevenueCents: 500,
        hasKnownCosts: false,
      }),
      300,
      1
    );
    expect(result.hasKnownNet).toBe(false);
    expect(result.netProfitCents).toBe(-300);
    expect(result.isNetLoss).toBe(true);
  });

  test('no suma ventas por monto a la ganancia ni a la resta de gastos', () => {
    const estimate = estimateDayProfit(
      [
        { productId: 1, units: 1, revenueCents: 1000 },
        { productId: null, units: 1, revenueCents: 500 },
      ],
      [{ productId: 1, costMxnCents: 200, units: 1 }]
    );
    const result = applyDayExpenses(estimate, 300, 1);
    expect(estimate.profitCents).toBe(800);
    expect(estimate.uncostedRevenueCents).toBe(500);
    expect(result.netProfitCents).toBe(500);
    expect(result.hasKnownNet).toBe(true);
  });

  test('rechaza gastos o cantidades inválidas', () => {
    expect(() => applyDayExpenses(gross(), -1, 0)).toThrow('gastos');
    expect(() => applyDayExpenses(gross(), 100, -1)).toThrow('cantidad');
    expect(() => applyDayExpenses(gross(), 100, 1.5)).toThrow('cantidad');
  });
});

// Pruebas de la ganancia de un periodo: costo vigente por fecha de venta,
// redondeo diario y productos sin costo contados una sola vez.

import { applyDayExpenses } from '../profit-estimate';
import {
  estimatePeriodProfit,
  type CostHistoryRow,
  type DatedProfitInputRow,
} from '../period-profit-estimate';

function sale(
  date: string,
  productId: number | null,
  units: number,
  revenueCents: number
): DatedProfitInputRow {
  return { date, productId, units, revenueCents };
}

function cost(
  productId: number,
  purchaseDate: string,
  costMxnCents: number,
  units: number
): CostHistoryRow {
  return { productId, purchaseDate, costMxnCents, units };
}

describe('estimatePeriodProfit', () => {
  test('un periodo sin ventas no tiene ganancia ni costo', () => {
    expect(estimatePeriodProfit([], [])).toEqual({
      profitCents: 0,
      isLoss: false,
      costOfGoodsCents: 0,
      costedRevenueCents: 0,
      uncostedRevenueCents: 0,
      uncostedProductCount: 0,
      hasSales: false,
      hasKnownCosts: false,
    });
  });

  test('una compra posterior no cambia el costo de ventas anteriores', () => {
    const result = estimatePeriodProfit(
      [sale('2026-11-02', 1, 2, 1000), sale('2026-11-04', 1, 2, 1000)],
      [
        cost(1, '2026-11-03', 600, 3),
        cost(1, '2026-11-01', 300, 3),
      ]
    );

    // 2 de noviembre usa 300/3; 4 de noviembre usa 600/3.
    expect(result.profitCents).toBe(1400);
    expect(result.costOfGoodsCents).toBe(600);
    expect(result.costedRevenueCents).toBe(2000);
    expect(result.uncostedRevenueCents).toBe(0);
    expect(result.hasKnownCosts).toBe(true);
  });

  test('conserva el redondeo diario por producto', () => {
    const result = estimatePeriodProfit(
      [
        sale('2026-11-02', 1, 1, 100),
        sale('2026-11-03', 1, 1, 100),
        sale('2026-11-04', 1, 1, 100),
      ],
      [cost(1, '2026-11-01', 100, 3)]
    );

    // Cada día redondea 100/3 = 33; no se redondea una sola vez por periodo.
    expect(result.costOfGoodsCents).toBe(99);
    expect(result.profitCents).toBe(201);
  });

  test('el costo vale desde su propia fecha, incluso el mismo día', () => {
    const result = estimatePeriodProfit(
      [sale('2026-11-03', 1, 1, 500)],
      [cost(1, '2026-11-03', 300, 1)]
    );

    expect(result.costOfGoodsCents).toBe(300);
    expect(result.profitCents).toBe(200);
    expect(result.uncostedProductCount).toBe(0);
  });

  test('un producto sin costo en varios días se cuenta una sola vez', () => {
    const result = estimatePeriodProfit(
      [
        sale('2026-11-02', 1, 1, 100),
        sale('2026-11-03', 1, 2, 200),
        sale('2026-11-03', 2, 1, 300),
        sale('2026-11-03', null, 1, 500),
      ],
      []
    );

    expect(result.hasSales).toBe(true);
    expect(result.hasKnownCosts).toBe(false);
    expect(result.profitCents).toBe(0);
    expect(result.costedRevenueCents).toBe(0);
    expect(result.uncostedRevenueCents).toBe(1100);
    expect(result.uncostedProductCount).toBe(2);
  });

  test('un producto sin costo antes de su compra se cuenta una sola vez', () => {
    const result = estimatePeriodProfit(
      [sale('2026-11-02', 1, 1, 500), sale('2026-11-04', 1, 1, 500)],
      [cost(1, '2026-11-03', 300, 1)]
    );

    expect(result.profitCents).toBe(200);
    expect(result.costedRevenueCents).toBe(500);
    expect(result.uncostedRevenueCents).toBe(500);
    expect(result.uncostedProductCount).toBe(1);
    expect(result.hasKnownCosts).toBe(true);
  });

  test('mezcla ventas con y sin costo sin inventar ganancia', () => {
    const result = estimatePeriodProfit(
      [
        sale('2026-11-02', 1, 1, 500),
        sale('2026-11-02', 2, 1, 300),
        sale('2026-11-02', null, 1, 200),
      ],
      [cost(1, '2026-11-01', 200, 1)]
    );

    expect(result.profitCents).toBe(300);
    expect(result.costedRevenueCents).toBe(500);
    expect(result.uncostedRevenueCents).toBe(500);
    expect(result.uncostedProductCount).toBe(1);

    const net = applyDayExpenses(result, 100, 1);
    expect(net.netProfitCents).toBe(200);
    expect(net.hasKnownNet).toBe(true);
  });

  test('sin ningún costo conocido la ganancia neta no se marca como conocida', () => {
    const result = estimatePeriodProfit([sale('2026-11-02', 1, 1, 500)], []);
    const net = applyDayExpenses(result, 100, 1);

    expect(net.hasKnownNet).toBe(false);
    expect(net.netProfitCents).toBe(-100);
    expect(net.isNetLoss).toBe(true);
  });

  test('los renglones sin producto suman ingreso sin costo pero no productos', () => {
    const result = estimatePeriodProfit(
      [sale('2026-11-02', null, 2, 500)],
      []
    );

    expect(result.hasSales).toBe(true);
    expect(result.hasKnownCosts).toBe(false);
    expect(result.uncostedRevenueCents).toBe(500);
    expect(result.uncostedProductCount).toBe(0);
  });

  test('acumula pérdida cuando el costo supera los ingresos', () => {
    const result = estimatePeriodProfit(
      [sale('2026-11-02', 1, 1, 100)],
      [cost(1, '2026-11-01', 500, 1)]
    );

    expect(result.profitCents).toBe(-400);
    expect(result.isLoss).toBe(true);
  });
});

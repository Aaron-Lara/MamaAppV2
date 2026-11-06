// Pruebas de la ganancia estimada del día.

import { estimateDayProfit } from '../profit-estimate';

describe('estimateDayProfit', () => {
  test('un día sin ventas no tiene ganancia ni costo', () => {
    expect(estimateDayProfit([], [])).toEqual({
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

  test('solo renglones por monto quedan como ventas sin costo conocido', () => {
    const result = estimateDayProfit(
      [{ productId: null, units: 2, revenueCents: 500 }],
      []
    );
    expect(result.hasSales).toBe(true);
    expect(result.hasKnownCosts).toBe(false);
    expect(result.profitCents).toBe(0);
    expect(result.costedRevenueCents).toBe(0);
    expect(result.costOfGoodsCents).toBe(0);
    expect(result.uncostedRevenueCents).toBe(500);
    expect(result.uncostedProductCount).toBe(0);
  });

  test('sin costos conocidos reporta los productos afectados', () => {
    const result = estimateDayProfit(
      [
        { productId: 1, units: 2, revenueCents: 1000 },
        { productId: 2, units: 1, revenueCents: 500 },
      ],
      []
    );
    expect(result.hasKnownCosts).toBe(false);
    expect(result.isLoss).toBe(false);
    expect(result.profitCents).toBe(0);
    expect(result.uncostedRevenueCents).toBe(1500);
    expect(result.uncostedProductCount).toBe(2);
  });

  test('calcula el costo de lo vendido con el último costo conocido', () => {
    const result = estimateDayProfit(
      [{ productId: 1, units: 2, revenueCents: 1000 }],
      [{ productId: 1, costMxnCents: 300, units: 3 }]
    );
    expect(result.hasKnownCosts).toBe(true);
    expect(result.costedRevenueCents).toBe(1000);
    expect(result.costOfGoodsCents).toBe(200);
    expect(result.profitCents).toBe(800);
    expect(result.isLoss).toBe(false);
    expect(result.uncostedRevenueCents).toBe(0);
    expect(result.uncostedProductCount).toBe(0);
  });

  test('mezcla productos con costo, sin costo y renglones por monto', () => {
    const result = estimateDayProfit(
      [
        { productId: 1, units: 2, revenueCents: 1000 },
        { productId: 2, units: 1, revenueCents: 500 },
        { productId: null, units: 1, revenueCents: 100 },
      ],
      [{ productId: 1, costMxnCents: 300, units: 3 }]
    );
    expect(result.hasKnownCosts).toBe(true);
    expect(result.costedRevenueCents).toBe(1000);
    expect(result.costOfGoodsCents).toBe(200);
    expect(result.profitCents).toBe(800);
    expect(result.uncostedRevenueCents).toBe(600);
    expect(result.uncostedProductCount).toBe(1);
  });

  test('redondea la mitad hacia arriba una sola vez', () => {
    const result = estimateDayProfit(
      [{ productId: 1, units: 1, revenueCents: 10 }],
      [{ productId: 1, costMxnCents: 5, units: 2 }]
    );
    expect(result.costOfGoodsCents).toBe(3);
    expect(result.profitCents).toBe(7);
  });

  test('agrupa varios renglones del mismo producto antes de redondear', () => {
    const result = estimateDayProfit(
      [
        { productId: 1, units: 1, revenueCents: 100 },
        { productId: 1, units: 1, revenueCents: 100 },
      ],
      [{ productId: 1, costMxnCents: 100, units: 3 }]
    );
    expect(result.costedRevenueCents).toBe(200);
    expect(result.costOfGoodsCents).toBe(67);
    expect(result.profitCents).toBe(133);
  });

  test('reporta pérdida cuando el costo supera los ingresos', () => {
    const result = estimateDayProfit(
      [{ productId: 1, units: 1, revenueCents: 100 }],
      [{ productId: 1, costMxnCents: 500, units: 1 }]
    );
    expect(result.profitCents).toBe(-400);
    expect(result.isLoss).toBe(true);
    expect(result.costOfGoodsCents).toBe(500);
  });

  test('vende más unidades que la última compra sin lanzar error', () => {
    const result = estimateDayProfit(
      [{ productId: 1, units: 3, revenueCents: 20 }],
      [{ productId: 1, costMxnCents: 5, units: 2 }]
    );
    expect(result.costOfGoodsCents).toBe(8);
    expect(result.profitCents).toBe(12);
  });
});

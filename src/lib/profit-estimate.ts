// Ganancia estimada del día: ingresos con costo conocido menos el costo de lo
// vendido. Lógica pura: centavos enteros y sin acceso a la base.

import { costOfUnits } from './purchase-cost';

export type ProfitInputRow = {
  productId: number | null;
  units: number;
  revenueCents: number;
};

export type ProductCost = {
  productId: number;
  costMxnCents: number;
  units: number;
};

export type ProfitEstimate = {
  profitCents: number;
  isLoss: boolean;
  costOfGoodsCents: number;
  costedRevenueCents: number;
  uncostedRevenueCents: number;
  uncostedProductCount: number;
  hasSales: boolean;
  hasKnownCosts: boolean;
};

type Group = { units: number; revenueCents: number };

function addSafe(current: number, amount: number, label: string): number {
  if (!Number.isSafeInteger(amount)) {
    throw new Error(`${label} debe ser un entero.`);
  }
  const total = current + amount;
  if (!Number.isSafeInteger(total)) {
    throw new Error(`${label} se sale del rango seguro de enteros.`);
  }
  return total;
}

/**
 * Misma fórmula que costOfUnits, pero sin el tope unitsSold <= units.
 * Conserva el costo unitario exacto y redondea una sola vez al final.
 */
function costForUnits(
  costMxnCents: number,
  units: number,
  unitsSold: number
): number {
  if (unitsSold <= units) {
    return costOfUnits(costMxnCents, units, unitsSold);
  }
  if (!Number.isSafeInteger(costMxnCents) || costMxnCents < 0) {
    throw new Error('El costo total debe ser un entero mayor o igual a cero.');
  }
  if (!Number.isSafeInteger(units) || units <= 0) {
    throw new Error('Las unidades deben ser un entero mayor a cero.');
  }
  if (!Number.isSafeInteger(unitsSold) || unitsSold < 0) {
    throw new Error('Las unidades vendidas deben ser un entero mayor o igual a cero.');
  }
  const product = costMxnCents * unitsSold;
  if (!Number.isSafeInteger(product)) {
    throw new Error('El costo proporcional se sale del rango seguro de enteros.');
  }
  return Math.round(product / units);
}

/** Calcula la ganancia del día a partir de filas ya agrupadas o sin agrupar. */
export function estimateDayProfit(
  rows: readonly ProfitInputRow[],
  costs: readonly ProductCost[]
): ProfitEstimate {
  const groups = new Map<number | null, Group>();
  for (const row of rows) {
    if (!Number.isSafeInteger(row.units) || row.units < 0) {
      throw new Error('Las unidades vendidas deben ser un entero mayor o igual a cero.');
    }
    const current = groups.get(row.productId) ?? { units: 0, revenueCents: 0 };
    groups.set(row.productId, {
      units: addSafe(current.units, row.units, 'Las unidades vendidas'),
      revenueCents: addSafe(
        current.revenueCents,
        row.revenueCents,
        'Los ingresos'
      ),
    });
  }

  const byProduct = new Map<number, ProductCost>();
  for (const cost of costs) {
    byProduct.set(cost.productId, cost);
  }

  let costOfGoodsCents = 0;
  let costedRevenueCents = 0;
  let uncostedRevenueCents = 0;
  let uncostedProductCount = 0;
  let hasKnownCosts = false;

  for (const [productId, group] of groups) {
    if (productId === null) {
      uncostedRevenueCents = addSafe(
        uncostedRevenueCents,
        group.revenueCents,
        'Los ingresos sin costo'
      );
      continue;
    }

    const cost = byProduct.get(productId);
    if (!cost) {
      uncostedRevenueCents = addSafe(
        uncostedRevenueCents,
        group.revenueCents,
        'Los ingresos sin costo'
      );
      uncostedProductCount += 1;
      continue;
    }

    hasKnownCosts = true;
    costedRevenueCents = addSafe(
      costedRevenueCents,
      group.revenueCents,
      'Los ingresos con costo'
    );
    const goodsCost = costForUnits(cost.costMxnCents, cost.units, group.units);
    costOfGoodsCents = addSafe(
      costOfGoodsCents,
      goodsCost,
      'El costo de lo vendido'
    );
  }

  const profitCents = costedRevenueCents - costOfGoodsCents;
  return {
    profitCents,
    isLoss: profitCents < 0,
    costOfGoodsCents,
    costedRevenueCents,
    uncostedRevenueCents,
    uncostedProductCount,
    hasSales: groups.size > 0,
    hasKnownCosts,
  };
}

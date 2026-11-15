// Ganancia bruta de un periodo respetando el costo conocido en cada venta.
// Lógica pura: recibe ventas agrupadas por día y el historial de costos ya
// ordenado igual que day-profit.ts. No calcula gastos ni toca la base.

import {
  estimateDayProfit,
  type ProductCost,
  type ProfitEstimate,
  type ProfitInputRow,
} from './profit-estimate';

/** Renglón de venta agrupado por fecha y producto. */
export type DatedProfitInputRow = ProfitInputRow & {
  date: string;
};

/**
 * Costo de una compra con su fecha. El orden recibido debe ser el de
 * day-profit.ts: la primera fila aplicable a una fecha es el último costo.
 */
export type CostHistoryRow = ProductCost & {
  purchaseDate: string;
};

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

/** Agrupa las ventas por fecha conservando el orden de llegada. */
function groupSalesByDate(
  soldRows: readonly DatedProfitInputRow[]
): Map<string, ProfitInputRow[]> {
  const byDate = new Map<string, ProfitInputRow[]>();
  for (const row of soldRows) {
    const rows = byDate.get(row.date);
    const input: ProfitInputRow = {
      productId: row.productId,
      units: row.units,
      revenueCents: row.revenueCents,
    };
    if (rows) {
      rows.push(input);
    } else {
      byDate.set(row.date, [input]);
    }
  }
  return byDate;
}

/** Agrupa el historial de costos por producto conservando su orden. */
function groupCostsByProduct(
  costRows: readonly CostHistoryRow[]
): Map<number, CostHistoryRow[]> {
  const byProduct = new Map<number, CostHistoryRow[]>();
  for (const row of costRows) {
    const rows = byProduct.get(row.productId);
    if (rows) {
      rows.push(row);
    } else {
      byProduct.set(row.productId, [row]);
    }
  }
  return byProduct;
}

/**
 * Costos aplicables a una fecha. Como el historial viene del más reciente al
 * más viejo, la primera fila con purchaseDate <= date es el costo conocido.
 */
function costsForDate(
  date: string,
  rows: readonly ProfitInputRow[],
  byProduct: Map<number, CostHistoryRow[]>,
  uncostedProductIds: Set<number>
): ProductCost[] {
  const costs: ProductCost[] = [];
  const seen = new Set<number>();

  for (const row of rows) {
    const productId = row.productId;
    if (productId === null || seen.has(productId)) {
      continue;
    }
    seen.add(productId);

    const history = byProduct.get(productId);
    const cost = history?.find((item) => item.purchaseDate <= date);
    if (!cost) {
      uncostedProductIds.add(productId);
      continue;
    }
    costs.push({
      productId,
      costMxnCents: cost.costMxnCents,
      units: cost.units,
    });
  }

  return costs;
}

/**
 * Suma la ganancia bruta de cada día usando el mismo estimador del resumen
 * diario. Los productos sin costo se acumulan como ingresos sin costo y se
 * cuentan una sola vez aunque aparezcan en varios días.
 */
export function estimatePeriodProfit(
  soldRows: readonly DatedProfitInputRow[],
  costRows: readonly CostHistoryRow[]
): ProfitEstimate {
  const salesByDate = groupSalesByDate(soldRows);
  const costsByProduct = groupCostsByProduct(costRows);
  const uncostedProductIds = new Set<number>();

  let profitCents = 0;
  let costOfGoodsCents = 0;
  let costedRevenueCents = 0;
  let uncostedRevenueCents = 0;
  let hasSales = false;
  let hasKnownCosts = false;

  for (const [date, rows] of salesByDate) {
    const dayCosts = costsForDate(date, rows, costsByProduct, uncostedProductIds);
    const day = estimateDayProfit(rows, dayCosts);

    profitCents = addSafe(profitCents, day.profitCents, 'La ganancia');
    costOfGoodsCents = addSafe(
      costOfGoodsCents,
      day.costOfGoodsCents,
      'El costo de lo vendido'
    );
    costedRevenueCents = addSafe(
      costedRevenueCents,
      day.costedRevenueCents,
      'Los ingresos con costo'
    );
    uncostedRevenueCents = addSafe(
      uncostedRevenueCents,
      day.uncostedRevenueCents,
      'Los ingresos sin costo'
    );
    hasSales = hasSales || day.hasSales;
    hasKnownCosts = hasKnownCosts || day.hasKnownCosts;
  }

  return {
    profitCents,
    isLoss: profitCents < 0,
    costOfGoodsCents,
    costedRevenueCents,
    uncostedRevenueCents,
    uncostedProductCount: uncostedProductIds.size,
    hasSales,
    hasKnownCosts,
  };
}

// Reglas puras de la vista de inventario: filas, filtros y conteos.
// No importa expo-sqlite ni nada de pantallas.

import {
  getStockStatus,
  matchesInventoryFilter,
  matchesSearch,
  type InventoryFilter,
  type StockStatus,
} from '@/lib/inventory-rules';

/** Lo mínimo que la vista necesita de un producto (no incluye SQL). */
export type InventoryProduct = {
  id: number;
  name: string;
  price_cents: number;
  track_stock: number;
  min_stock: number;
  active: number;
  stock: number;
};

export type InventoryRow = {
  product: InventoryProduct;
  status: StockStatus;
};

export type InventorySelection = {
  query: string;
  filter: InventoryFilter;
  showInactive: boolean;
};

export type InventoryCounts = {
  all: number;
  low: number;
  out: number;
};

/** Productos -> filas con su estado de stock ya clasificado. */
export function buildInventoryRows(products: readonly InventoryProduct[]): InventoryRow[] {
  return products.map((product) => ({
    product,
    status: getStockStatus(product.track_stock === 1, product.stock, product.min_stock),
  }));
}

/**
 * Totales fijos de los filtros: solo activos, sin mirar la búsqueda.
 * Los desactivados nunca cuentan.
 */
export function countInventoryFilters(rows: readonly InventoryRow[]): InventoryCounts {
  const counts: InventoryCounts = { all: 0, low: 0, out: 0 };
  for (const row of rows) {
    if (row.product.active !== 1) {
      continue;
    }
    counts.all += 1;
    if (row.status === 'low') {
      counts.low += 1;
    }
    if (row.status === 'out') {
      counts.out += 1;
    }
  }
  return counts;
}

/**
 * Aplica búsqueda y filtro. "all" incluye desactivados solo si showInactive;
 * "low" y "out" nunca muestran desactivados.
 */
export function selectInventoryRows(
  rows: readonly InventoryRow[],
  selection: InventorySelection
): InventoryRow[] {
  return rows.filter((row) => {
    if (row.product.active !== 1) {
      if (!selection.showInactive || selection.filter !== 'all') {
        return false;
      }
    }
    return (
      matchesSearch(row.product.name, selection.query) &&
      matchesInventoryFilter(row.status, selection.filter)
    );
  });
}

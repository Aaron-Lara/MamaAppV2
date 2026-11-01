// Orden de los productos en la pantalla Vender: los más vendidos primero.
// Lógica pura: no importa expo-sqlite ni pantallas.

import { matchesSearch, normalizeSearchText } from '@/lib/inventory-rules';

export const MAX_FREQUENT = 8;

/** Unidades vendidas de un producto en el periodo que se consultó. */
export type FrequencyRow = { productId: number; unitsSold: number };

type Named = { id: number; name: string; category: string | null };

export type SellableSelection = { query: string; category: string | null };

function byName(a: Named, b: Named): number {
  const first = normalizeSearchText(a.name);
  const second = normalizeSearchText(b.name);
  if (first < second) return -1;
  if (first > second) return 1;
  return a.id - b.id;
}

/**
 * Separa los productos más vendidos (de mayor a menor; empates por nombre) del
 * resto, que queda en orden alfabético sin acentos. No modifica la lista original.
 */
export function splitFrequent<T extends Named>(
  products: readonly T[],
  frequency: readonly FrequencyRow[],
  maxFrequent: number = MAX_FREQUENT
): { frequent: T[]; others: T[] } {
  const units = new Map<number, number>();
  for (const row of frequency) {
    if (Number.isSafeInteger(row.productId) && row.unitsSold > 0) {
      units.set(row.productId, (units.get(row.productId) ?? 0) + row.unitsSold);
    }
  }
  const sold = products
    .filter((product) => (units.get(product.id) ?? 0) > 0)
    .sort((a, b) => (units.get(b.id) ?? 0) - (units.get(a.id) ?? 0) || byName(a, b));
  const frequent = sold.slice(0, Math.max(0, maxFrequent));
  const chosen = new Set(frequent.map((product) => product.id));
  const others = products.filter((product) => !chosen.has(product.id)).sort(byName);
  return { frequent, others };
}

/** Categorías distintas (sin distinguir mayúsculas ni acentos), en orden alfabético. */
export function listCategories(products: readonly Named[]): string[] {
  const found = new Map<string, string>();
  for (const product of products) {
    const label = product.category?.trim() ?? '';
    const key = normalizeSearchText(label);
    if (key !== '' && !found.has(key)) {
      found.set(key, label);
    }
  }
  return [...found.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([, label]) => label);
}

/** Filtra por categoría y por búsqueda, conservando el orden de la lista. */
export function selectSellable<T extends Named>(
  products: readonly T[],
  selection: SellableSelection
): T[] {
  const categoryKey =
    selection.category === null ? null : normalizeSearchText(selection.category);
  return products.filter((product) => {
    if (categoryKey !== null && normalizeSearchText(product.category ?? '') !== categoryKey) {
      return false;
    }
    return matchesSearch(product.name, selection.query);
  });
}
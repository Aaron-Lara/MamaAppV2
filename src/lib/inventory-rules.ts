// Reglas puras de la lista de inventario: búsqueda y estado del stock.
// No importa expo-sqlite ni nada de pantallas.

export type StockStatus = 'untracked' | 'ok' | 'low' | 'out';
export type InventoryFilter = 'all' | 'low' | 'out';

const ACCENTS: Record<string, string> = {
  á: 'a', à: 'a', ä: 'a', â: 'a',
  é: 'e', è: 'e', ë: 'e', ê: 'e',
  í: 'i', ì: 'i', ï: 'i', î: 'i',
  ó: 'o', ò: 'o', ö: 'o', ô: 'o',
  ú: 'u', ù: 'u', ü: 'u', û: 'u',
  ñ: 'n',
};

/** Minúsculas, sin acentos ni ñ, con espacios simples. */
export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[áàäâéèëêíìïîóòöôúùüûñ]/g, (char) => ACCENTS[char] ?? char)
    .replace(/\s+/g, ' ')
    .trim();
}

/** Todas las palabras buscadas deben aparecer en el nombre, en cualquier orden. */
export function matchesSearch(name: string, query: string): boolean {
  const terms = normalizeSearchText(query).split(' ').filter(Boolean);
  if (terms.length === 0) {
    return true;
  }
  const target = normalizeSearchText(name);
  return terms.every((term) => target.includes(term));
}

/** Clasifica el stock. Cero o negativo cuenta como agotado. */
export function getStockStatus(
  trackStock: boolean,
  stock: number,
  minStock: number
): StockStatus {
  if (!Number.isFinite(stock) || !Number.isFinite(minStock)) {
    throw new Error('El stock no es válido.');
  }
  if (!trackStock) {
    return 'untracked';
  }
  if (stock <= 0) {
    return 'out';
  }
  if (stock <= minStock) {
    return 'low';
  }
  return 'ok';
}

export function matchesInventoryFilter(
  status: StockStatus,
  filter: InventoryFilter
): boolean {
  return filter === 'all' || status === filter;
}

/** Cuántos productos necesitan atención (por agotarse o agotados). */
export function countStockAlerts(statuses: readonly StockStatus[]): number {
  return statuses.filter((status) => status === 'low' || status === 'out').length;
}
// Filas de la cuadrícula de Vender: encabezados de sección y pares de productos.
// Lógica pura: no importa expo-sqlite ni componentes.

import type { SellableProduct } from '@/lib/sellable-product';

export const FREQUENT_TITLE = 'Más vendidos';
export const OTHERS_TITLE = 'Todos';

export type SellGridRow =
  | { key: string; type: 'header'; title: string }
  | { key: string; type: 'products'; products: readonly SellableProduct[] };

const COLUMNS = 2;

function productRows(
  products: readonly SellableProduct[],
  section: string
): SellGridRow[] {
  const rows: SellGridRow[] = [];
  for (let index = 0; index < products.length; index += COLUMNS) {
    rows.push({
      key: `${section}-${index}`,
      type: 'products',
      products: products.slice(index, index + COLUMNS),
    });
  }
  return rows;
}

/**
 * Arma las filas de la cuadrícula.
 * - Con frecuentes: "Más vendidos" y luego "Todos".
 * - Sin frecuentes: solo los productos, sin encabezado.
 */
export function buildSellRows(
  frequent: readonly SellableProduct[],
  others: readonly SellableProduct[]
): SellGridRow[] {
  const rows: SellGridRow[] = [];

  if (frequent.length > 0) {
    rows.push({ key: 'header-frequent', type: 'header', title: FREQUENT_TITLE });
    rows.push(...productRows(frequent, 'frequent'));
  }

  if (others.length > 0) {
    if (frequent.length > 0) {
      rows.push({ key: 'header-others', type: 'header', title: OTHERS_TITLE });
    }
    rows.push(...productRows(others, 'others'));
  }

  return rows;
}

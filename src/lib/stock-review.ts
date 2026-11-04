// Conteo informativo de "Por revisar": agotados y por agotarse.
// Reutiliza las reglas de inventario y no importa expo-sqlite.

import { getStockStatus } from '@/lib/inventory-rules';

/** Lo mínimo que hace falta de cada producto para clasificar su stock. */
export type StockReviewProduct = {
  track_stock: number;
  stock: number;
  min_stock: number;
};

export type StockReview = {
  outCount: number;
  lowCount: number;
};

/** Solo cuentan los productos con control de stock; el resto queda fuera. */
export function summarizeStockReview(
  products: readonly StockReviewProduct[]
): StockReview {
  let outCount = 0;
  let lowCount = 0;
  for (const product of products) {
    const status = getStockStatus(product.track_stock === 1, product.stock, product.min_stock);
    if (status === 'out') {
      outCount += 1;
    } else if (status === 'low') {
      lowCount += 1;
    }
  }
  return { outCount, lowCount };
}

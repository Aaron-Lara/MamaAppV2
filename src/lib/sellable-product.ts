// Producto vendible: adapta la fila de la base al formato de la pantalla Vender.
// Lógica pura: no importa expo-sqlite.

import type { CartProduct } from '@/lib/cart';

/** Fila mínima que devuelve listProductsWithStock. */
export type SellableProductRow = {
  id: number;
  name: string;
  price_cents: number;
  category: string | null;
  track_stock: number;
  stock: number;
};

export type SellableProduct = {
  id: number;
  name: string;
  priceCents: number;
  category: string | null;
  trackStock: boolean;
  stock: number;
};

/** Convierte la fila con nombres de la base al producto de la pantalla. */
export function toSellableProduct(row: SellableProductRow): SellableProduct {
  return {
    id: row.id,
    name: row.name,
    priceCents: row.price_cents,
    category: row.category,
    trackStock: row.track_stock === 1,
    stock: row.stock,
  };
}

/** Solo los productos con control de stock pueden estar agotados. */
export function isSoldOut(
  product: Pick<SellableProduct, 'trackStock' | 'stock'>
): boolean {
  return product.trackStock && product.stock <= 0;
}

/** Producto listo para addProduct del carrito. */
export function toCartProduct(product: SellableProduct): CartProduct {
  return {
    id: product.id,
    name: product.name,
    priceCents: product.priceCents,
  };
}

// Conversión pura entre renglones de pedido y datos de venta.
// No importa expo-sqlite para poder probarse con Jest.

import { lineTotalCents, sumCents } from './money';
import type { OrderItemRow, SaleItemDraftFromOrder } from './order-types';

/** Convierte los renglones de order_items al formato de una venta. */
export function orderItemRowsToSaleItems(
  rows: readonly OrderItemRow[]
): SaleItemDraftFromOrder[] {
  return rows.map((row) => ({
    productId: row.product_id,
    description: row.description,
    quantity: row.quantity,
    unitPriceCents: row.unit_price_cents,
  }));
}

/** Total de un pedido a partir de sus renglones guardados. */
export function orderItemRowsTotalCents(rows: readonly OrderItemRow[]): number {
  return sumCents(
    rows.map((row) => lineTotalCents(row.quantity, row.unit_price_cents))
  );
}

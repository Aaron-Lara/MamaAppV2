// Formateador de renglones de venta.
// Items son { quantity: number; description: string }.

export type SaleItem = { quantity: number; description: string };

/** Convierte renglones de venta a formato "2 x Coca Cola, 1 x Lonche". */
export function formatSaleItemsText(items: SaleItem[]): string {
  return items
    .map((item) => `${item.quantity} x ${item.description}`)
    .join(', ');
}

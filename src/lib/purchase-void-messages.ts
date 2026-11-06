// Textos de la anulación de compras: confirmación y errores en español.
// Lógica pura, sin Alert ni base de datos.

import { formatCents } from './money';

export const PURCHASE_VOID_REASON = 'Compra registrada por error.';

/** Pregunta de confirmación con el total en pesos y el aviso de inventario. */
export function purchaseVoidConfirmMessage(totalMxnCents: number): string {
  return (
    `¿Anular la compra de ${formatCents(totalMxnCents)}? ` +
    'Se restarán del inventario las unidades que sumó. ' +
    "Si ya las vendiste, el producto puede quedar en 'Sin stock · revisar conteo'."
  );
}

/** Traduce el error de voidPurchase sin mostrar detalles técnicos. */
export function translateVoidPurchaseError(error: unknown): string {
  const text = error instanceof Error ? error.message.toLowerCase() : '';
  if (text.includes('ya está anulada')) {
    return 'Esa compra ya se anuló.';
  }
  if (text.includes('no existe')) {
    return 'Esa compra ya no existe.';
  }
  return 'No se pudo anular la compra. Inténtalo de nuevo.';
}

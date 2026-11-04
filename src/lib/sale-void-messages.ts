// Textos de la anulación de ventas: confirmación y errores en español.
// Lógica pura, sin Alert ni base de datos.

import { formatCents } from '@/lib/money';

/** Textos que cambian según el contexto (deshacer o anular desde el Resumen). */
export type VoidErrorTexts = {
  alreadyVoided: string;
  hasPayments: string;
  fallback: string;
};

/** Mismos textos que usaba useUndoSale antes de extraer esta función. */
export const UNDO_SALE_TEXTS: VoidErrorTexts = {
  alreadyVoided: 'Esa venta ya no se puede deshacer.',
  hasPayments: 'No se puede deshacer: ese cliente ya tiene abonos.',
  fallback: 'No se pudo deshacer la venta. Inténtalo de nuevo.',
};

/** Textos de la anulación desde la lista del Resumen. */
export const SUMMARY_SALE_TEXTS: VoidErrorTexts = {
  alreadyVoided: 'Esa venta ya no se puede anular.',
  hasPayments: 'No se puede anular: ese cliente ya tiene abonos.',
  fallback: 'No se pudo anular la venta. Inténtalo de nuevo.',
};

export const VOID_FROM_SUMMARY_REASON = 'Anulada desde el Resumen.';

/** Traduce el error de voidSale sin mostrar detalles técnicos. */
export function translateVoidSaleError(error: unknown, texts: VoidErrorTexts): string {
  const text = error instanceof Error ? error.message.toLowerCase() : '';
  if (text.includes('ya está anulada') || text.includes('no existe')) {
    return texts.alreadyVoided;
  }
  if (text.includes('abonos')) {
    return texts.hasPayments;
  }
  return texts.fallback;
}

/** Pregunta de confirmación; avisa si la venta pertenece a otro día. */
export function voidConfirmMessage(totalCents: number, isOtherDay: boolean): string {
  const question = `¿Anular la venta de ${formatCents(totalCents)}?`;
  if (!isOtherDay) {
    return question;
  }
  return `${question} Esta venta es de otro día: cambiará los totales de ese día.`;
}

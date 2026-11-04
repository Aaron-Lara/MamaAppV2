// Traducción de errores al guardar una compra. Lógica pura y en español.

import type { PurchaseLineForm } from './purchase-form-types';

export type PurchaseSaveError = { lineKey: string | null; message: string };

export function describePurchaseSaveError(
  error: unknown,
  lines: readonly PurchaseLineForm[]
): PurchaseSaveError {
  const text = error instanceof Error ? error.message : '';
  const missing = /producto (\d+) no existe/i.exec(text);
  if (missing) {
    const productId = Number(missing[1]);
    const line = lines.find((item) => item.productId === productId);
    if (line) {
      return {
        lineKey: line.key,
        message: 'Este producto ya no existe. Elige otro o escribe una descripción.',
      };
    }
  }
  return {
    lineKey: null,
    message: 'No se pudo guardar la compra. Inténtalo de nuevo.',
  };
}

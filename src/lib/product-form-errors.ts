// Traduce un error al guardar a un mensaje por campo, sin texto técnico.
// No importa expo-sqlite ni nada de pantallas.

import type { ProductFormErrors } from '@/lib/product-form';

export const SAVE_ERROR_FALLBACK = 'No se pudo guardar el producto. Inténtalo de nuevo.';

export function mapSaveError(error: unknown): ProductFormErrors {
  const message = error instanceof Error ? error.message : '';
  const text = message.toLowerCase();
  if (text.includes('nombre')) {
    return { name: message };
  }
  if (text.includes('stock inicial') || text.includes('conteo')) {
    return { stockCount: message };
  }
  if (message === 'El producto no existe.') {
    return { form: message };
  }
  return { form: SAVE_ERROR_FALLBACK };
}
// Ayudantes internos del formulario de productos: conversión de números,
// mensajes de error y a qué campo pertenece cada error de reglas.

import type { ProductFormField } from '@/lib/product-form';

export function parseWholeNumber(text: string, label: string): number {
  const cleaned = text.trim();
  if (cleaned === '') {
    return 0;
  }
  if (!/^\d+$/.test(cleaned)) {
    throw new Error(`${label} debe ser un número entero, sin decimales ni signos.`);
  }
  const value = Number(cleaned);
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${label} es demasiado grande.`);
  }
  return value;
}

export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Revisa los datos del producto.';
}

/** Asigna un error de reglas al campo que lo menciona; si no, al formulario. */
export function fieldForRuleError(message: string): ProductFormField {
  const text = message.toLowerCase();
  if (text.includes('nombre')) return 'name';
  if (text.includes('precio')) return 'price';
  if (text.includes('categor')) return 'category';
  if (text.includes('mínimo') || text.includes('minimo')) return 'minStock';
  return 'form';
}

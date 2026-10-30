// Validación pura de un producto. No toca la base, así que se puede probar
// con Jest sin expo-sqlite.

import { formatCents } from './money';

/** Tope de precio: $1,000.00, para detectar dedos resbalados. */
export const MAX_PRODUCT_PRICE_CENTS = 100000;

/** Largo máximo del nombre escrito por la usuaria. */
export const MAX_PRODUCT_NAME_LENGTH = 60;

/** Largo máximo de la categoría. */
export const MAX_PRODUCT_CATEGORY_LENGTH = 30;

export type ProductInput = {
  name: string;
  priceCents: number;
  category?: string | null;
  /** Si es true, las ventas descuentan inventario. */
  trackStock?: boolean;
  minStock?: number;
};

export type ValidProductInput = {
  name: string;
  priceCents: number;
  category: string | null;
  trackStock: boolean;
  minStock: number;
};

/** Recorta la categoría; vacía o ausente se guarda como null. */
function validateCategory(category: string | null | undefined): string | null {
  if (category == null) {
    return null;
  }
  if (typeof category !== 'string') {
    throw new Error('La categoría del producto no es válida.');
  }
  const trimmed = category.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > MAX_PRODUCT_CATEGORY_LENGTH) {
    throw new Error(`La categoría no puede pasar de ${MAX_PRODUCT_CATEGORY_LENGTH} caracteres.`);
  }
  return trimmed;
}

/** Valida y normaliza el producto antes de escribir nada en la base. */
export function validateProductInput(input: ProductInput): ValidProductInput {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) {
    throw new Error('El producto necesita un nombre.');
  }
  if (name.length > MAX_PRODUCT_NAME_LENGTH) {
    throw new Error(`El nombre no puede pasar de ${MAX_PRODUCT_NAME_LENGTH} caracteres.`);
  }

  if (!Number.isSafeInteger(input.priceCents)) {
    throw new Error('El precio del producto debe ser un entero en centavos.');
  }
  if (input.priceCents <= 0) {
    throw new Error('El precio del producto debe ser mayor a cero.');
  }
  if (input.priceCents > MAX_PRODUCT_PRICE_CENTS) {
    throw new Error(`El precio no puede pasar de ${formatCents(MAX_PRODUCT_PRICE_CENTS)}.`);
  }

  const minStock = input.minStock ?? 0;
  if (!Number.isSafeInteger(minStock) || minStock < 0) {
    throw new Error('El stock mínimo debe ser un entero mayor o igual a cero.');
  }

  return {
    name,
    priceCents: input.priceCents,
    category: validateCategory(input.category),
    trackStock: input.trackStock === true,
    minStock,
  };
}

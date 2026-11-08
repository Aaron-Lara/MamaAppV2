// Validación pura de renglones de pedido.

import { lineTotalCents } from './money';
import type { NewOrderItem, ValidOrderItem } from './order-types';

export const MAX_ORDER_ITEMS = 60;
export const MAX_ORDER_QUANTITY = 10000;
export const MAX_ORDER_DESCRIPTION_LENGTH = 60;

/** Valida un renglón y calcula su total en centavos. */
export function validateOrderItem(item: NewOrderItem, index: number): ValidOrderItem {
  const position = index + 1;
  const productId = item.productId ?? null;
  if (productId !== null && (!Number.isSafeInteger(productId) || productId <= 0)) {
    throw new Error(`El producto del renglón ${position} no es válido.`);
  }

  const description = typeof item.description === 'string' ? item.description.trim() : '';
  if (!description) {
    throw new Error(`El renglón ${position} necesita una descripción.`);
  }
  if (description.length > MAX_ORDER_DESCRIPTION_LENGTH) {
    throw new Error(
      `La descripción del renglón ${position} no puede pasar de ${MAX_ORDER_DESCRIPTION_LENGTH} caracteres.`
    );
  }

  if (
    !Number.isSafeInteger(item.quantity) ||
    item.quantity < 1 ||
    item.quantity > MAX_ORDER_QUANTITY
  ) {
    throw new Error(
      `La cantidad del renglón ${position} debe ser un entero entre 1 y ${MAX_ORDER_QUANTITY}.`
    );
  }
  if (!Number.isSafeInteger(item.unitPriceCents) || item.unitPriceCents < 0) {
    throw new Error(`El precio del renglón ${position} no es válido.`);
  }

  return {
    productId,
    description,
    quantity: item.quantity,
    unitPriceCents: item.unitPriceCents,
    lineTotalCents: lineTotalCents(item.quantity, item.unitPriceCents),
  };
}

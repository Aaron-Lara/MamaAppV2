// Validación pura de un renglón de compra. Vive aparte para que
// purchase-input.ts se mantenga corto.

import { convertToMxnCents } from './exchange-rate';
import { formatCents } from './money';
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_PURCHASE_LINE_CENTS,
  MAX_PURCHASE_UNITS,
  type NewPurchaseLineInput,
  type ValidPurchaseLine,
} from './purchase-types';

/** Valida un renglón y calcula su costo en pesos con enteros. */
export function validatePurchaseLine(
  line: NewPurchaseLineInput,
  index: number,
  rateX10000: number
): ValidPurchaseLine {
  const position = index + 1;
  const productId = line.productId ?? null;
  if (productId !== null && (!Number.isSafeInteger(productId) || productId <= 0)) {
    throw new Error(`El producto del renglón ${position} no es válido.`);
  }

  const description = typeof line.description === 'string' ? line.description : '';
  const trimmed = description.trim();
  if (!trimmed) {
    throw new Error(`El renglón ${position} necesita una descripción.`);
  }
  if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error(
      `La descripción del renglón ${position} no puede pasar de ${MAX_DESCRIPTION_LENGTH} caracteres.`
    );
  }

  const units = line.units;
  if (!Number.isSafeInteger(units) || units < 1 || units > MAX_PURCHASE_UNITS) {
    throw new Error(
      `Las unidades del renglón ${position} deben ser un entero entre 1 y ${MAX_PURCHASE_UNITS}.`
    );
  }

  const costCents = line.costCents;
  if (!Number.isSafeInteger(costCents) || costCents < 0) {
    throw new Error(`El costo del renglón ${position} debe ser un entero mayor o igual a cero.`);
  }
  if (costCents > MAX_PURCHASE_LINE_CENTS) {
    throw new Error(
      `El costo del renglón ${position} no puede pasar de ${formatCents(MAX_PURCHASE_LINE_CENTS)}.`
    );
  }

  return {
    productId,
    description,
    units,
    costCents,
    costMxnCents: convertToMxnCents(costCents, rateX10000),
  };
}

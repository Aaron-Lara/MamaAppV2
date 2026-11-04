// Lectura de unidades y costo total de un renglón del formulario de compras.

import { formatCents } from './money';
import { parseMoneyToCents } from './money-input';
import { MAX_PURCHASE_LINE_CENTS, MAX_PURCHASE_UNITS } from './purchase-types';

export function parsePurchaseUnits(text: string): number | null {
  const cleaned = text.trim();
  if (!/^\d+$/.test(cleaned)) {
    return null;
  }
  const units = Number(cleaned);
  return Number.isSafeInteger(units) && units >= 1 && units <= MAX_PURCHASE_UNITS
    ? units
    : null;
}

export function parsePurchaseCost(
  text: string
): { cents: number | null; error: string | null } {
  const cleaned = text.trim();
  if (!cleaned) {
    return { cents: null, error: 'Escribe el costo total.' };
  }
  try {
    const cents = parseMoneyToCents(cleaned);
    if (cents > MAX_PURCHASE_LINE_CENTS) {
      return {
        cents: null,
        error: `El costo total no puede pasar de ${formatCents(MAX_PURCHASE_LINE_CENTS)}.`,
      };
    }
    return { cents, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    return {
      cents: null,
      error: message.includes('negativo')
        ? 'El costo total no puede ser negativo.'
        : 'Escribe un costo total válido (ejemplo: 120.00).',
    };
  }
}

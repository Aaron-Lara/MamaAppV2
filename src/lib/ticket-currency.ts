// Detección de la moneda del ticket. No convierte montos ni deduce el tipo
// de cambio: solo dice qué moneda parece ser y si hay certeza.

import { foldText } from './ticket-text';
import type { TicketCurrency } from './ticket-types';

export type TicketCurrencyResult = {
  currency: TicketCurrency;
  /** false cuando se propuso MXN sin una marca explícita en el ticket. */
  certain: boolean;
};

const USD_MARKERS = /\bUSD\b|DLLS|DOLARES|US\$|U\.S\.|TIPO DE CAMBIO/;
const MXN_MARKERS = /\bMXN\b|M\.N\.|\bPESOS\b/;

export function detectTicketCurrency(
  lines: readonly string[]
): TicketCurrencyResult {
  const text = foldText(lines.join('\n'));
  const usd = USD_MARKERS.test(text);
  const mxn = MXN_MARKERS.test(text);

  if (usd && !mxn) {
    return { currency: 'USD', certain: true };
  }
  if (usd && mxn) {
    // El ticket menciona las dos: no se puede asegurar ninguna.
    return { currency: 'MXN', certain: false };
  }
  return { currency: 'MXN', certain: mxn };
}

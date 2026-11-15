// Detección de la tienda en el encabezado del ticket. Si no hay una marca
// conocida se devuelve null: nunca se inventa un nombre.

import { MAX_STORE_LENGTH } from './purchase-types';
import { foldText } from './ticket-text';

const BRANDS: { pattern: RegExp; name: string }[] = [
  { pattern: /\bWALMART\b/, name: 'WALMART' },
  { pattern: /\bHEB\b/, name: 'HEB' },
  { pattern: /\bSMART\b/, name: 'SMART' },
  { pattern: /\bLA COMER\b/, name: 'LA COMER' },
  { pattern: /\bSORIANA\b/, name: 'SORIANA' },
  { pattern: /\bCHEDRAUI\b/, name: 'CHEDRAUI' },
  { pattern: /\bBODEGA AURRERA\b/, name: 'BODEGA AURRERA' },
  { pattern: /\bCASA LEY\b/, name: 'CASA LEY' },
  { pattern: /\bCALIMAX\b/, name: 'CALIMAX' },
  { pattern: /\bMERZA\b/, name: 'MERZA' },
  { pattern: /\bSUPER AKI\b/, name: 'SUPER AKI' },
  { pattern: /\bOXXO\b/, name: 'OXXO' },
];

/**
 * Busca una marca conocida solo en las primeras líneas del ticket.
 * Las líneas de producto no cuentan, para no confundir nombres.
 */
export function findTicketStore(lines: readonly string[]): string | null {
  for (const line of lines.slice(0, 10)) {
    const folded = foldText(line);
    for (const brand of BRANDS) {
      if (brand.pattern.test(folded)) {
        return brand.name.slice(0, MAX_STORE_LENGTH);
      }
    }
  }
  return null;
}

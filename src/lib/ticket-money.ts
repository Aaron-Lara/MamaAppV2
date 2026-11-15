// Lectura de montos y cantidades en el texto de un ticket. Todo se convierte
// a centavos enteros; lo que no se entiende se devuelve como null.

import { parseMoneyToCents } from './money-input';
import type { TicketQuantity } from './ticket-types';

export type TicketAmount = {
  cents: number;
  raw: string;
  index: number;
  length: number;
};

export type QuantitySplit = {
  quantity: TicketQuantity;
  /** Texto sin la cantidad, listo para buscar montos. */
  rest: string;
  unitPriceCents: number | null;
};

const CANDIDATE = /-?\s*\$?\s*\d[\d,]*(?:[.,]\d{1,3})?/g;
const MULTIPLIER = /(\d+)\s*[xX@]\s*(\$?\s*\d+[.,]\d{2})/;
const LEADING_COUNT =
  /^\s*(\d+)\s*(PZA|PZ|PIEZA|PIEZAS|UN|UNIDAD|UNIDADES|ART|ARTICULOS?)\b/i;
const WEIGHT = /(\d+(?:[.,]\d+)?)\s+(KGS?|KILOS?|KILOGRAMOS?|GRS?|GRAMOS?|G)\b/i;
const VOLUME = /(\d+(?:[.,]\d+)?)\s+(LTS?|LITROS?|ML)\b/i;

/**
 * Un token aislado -> centavos. Exige dos decimales o el símbolo "$" para no
 * confundir "1L", "600ML" o "0.750" (peso) con dinero. Acepta montos sin
 * separador de miles ("1234.50"); parseMoneyToCents es la autoridad final.
 */
function toCents(raw: string): number | null {
  const symbol = raw.includes('$');
  const cleaned = raw.replace(/[\s$]/g, '');
  if (!cleaned) {
    return null;
  }
  const negative = cleaned.startsWith('-');
  const body = negative ? cleaned.slice(1) : cleaned;

  if (!/^\d[\d,]*(?:[.,]\d{1,3})?$/.test(body)) {
    return null;
  }
  if (!symbol && !/[.,]\d{2}$/.test(body)) {
    return null;
  }

  const thousands = /^\d{1,3}(?:,\d{3})+(?:\.\d{1,3})?$/.test(body);
  let normalized = body;
  if (thousands) {
    normalized = body.replace(/,/g, '');
  } else if (body.includes(',')) {
    normalized = body.replace(',', '.');
  }

  try {
    const cents = parseMoneyToCents(normalized);
    return negative ? -cents : cents;
  } catch {
    return null;
  }
}

/** Todos los montos válidos de un texto, en orden. */
export function findTicketAmounts(text: string): TicketAmount[] {
  const amounts: TicketAmount[] = [];
  for (const match of text.matchAll(CANDIDATE)) {
    const raw = match[0];
    const cents = toCents(raw);
    if (cents === null) {
      continue;
    }
    amounts.push({
      cents,
      raw,
      index: match.index ?? 0,
      length: raw.length,
    });
  }
  return amounts;
}

/** Último monto válido del texto (el total de un renglón o de una línea). */
export function parseTicketAmount(text: string): number | null {
  const amounts = findTicketAmounts(text);
  return amounts.length > 0 ? amounts[amounts.length - 1].cents : null;
}

function integerQuantity(raw: string): TicketQuantity {
  const units = Number(raw);
  return Number.isSafeInteger(units) && units >= 1
    ? { kind: 'integer', units }
    : { kind: 'unknown' };
}

function decimalQuantity(raw: string): TicketQuantity {
  return { kind: 'decimal', raw: raw.replace(/\s+/g, ' ').trim() };
}

/**
 * Separa la cantidad del resto del renglón. Orden: multiplicador (2 x 12.00),
 * conteo inicial (2 PZA), peso (0.750 KG) y volumen (1.5 L).
 */
export function splitQuantity(text: string): QuantitySplit {
  const multiplier = MULTIPLIER.exec(text);
  if (multiplier) {
    return {
      quantity: integerQuantity(multiplier[1]),
      rest: text.replace(/(\d+)\s*[xX@]\s*/, ' '),
      unitPriceCents: toCents(multiplier[2]),
    };
  }

  const leading = LEADING_COUNT.exec(text);
  if (leading) {
    return {
      quantity: integerQuantity(leading[1]),
      rest: text.replace(leading[0], ' '),
      unitPriceCents: null,
    };
  }

  const weight = WEIGHT.exec(text);
  if (weight) {
    return {
      quantity: decimalQuantity(weight[0]),
      rest: text.replace(weight[0], ' '),
      unitPriceCents: null,
    };
  }

  const volume = VOLUME.exec(text);
  if (volume) {
    return {
      quantity: decimalQuantity(volume[0]),
      rest: text.replace(volume[0], ' '),
      unitPriceCents: null,
    };
  }

  return { quantity: { kind: 'unknown' }, rest: text, unitPriceCents: null };
}

// Interpretación de un renglón de producto. Cada renglón conserva su texto
// original; si no se entiende, queda con precio nulo en lugar de inventarse.

import { formatCents, lineTotalCents as multiplyCents } from './money';
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_PURCHASE_LINE_CENTS,
  MAX_PURCHASE_UNITS,
} from './purchase-types';
import {
  findTicketAmounts,
  splitQuantity,
  type TicketAmount,
} from './ticket-money';
import type { TicketLine, TicketWarning } from './ticket-types';

export type ParsedTicketLine = {
  line: TicketLine;
  issues: TicketWarning[];
};

const CURRENCY_WORDS = /\b(?:USD|MXN|DLLS|M\.N\.)\b/gi;

function cleanDescription(
  text: string,
  amounts: readonly TicketAmount[]
): string {
  let out = text;
  for (let index = amounts.length - 1; index >= 0; index -= 1) {
    const amount = amounts[index];
    out = `${out.slice(0, amount.index)} ${out.slice(amount.index + amount.length)}`;
  }
  return out
    .replace(CURRENCY_WORDS, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s*#\-.:=|]+/, '')
    .replace(/[\s*#\-.:=|]+$/, '')
    .trim();
}

/** Renglón sin ningún monto legible: se conserva para que se corrija a mano. */
export function parseUnpricedLine(source: string): ParsedTicketLine {
  const issue: TicketWarning = {
    code: 'missing_price',
    message: 'No se pudo leer el precio del renglón.',
    rawLine: source,
  };
  return {
    line: {
      source,
      description: source.slice(0, MAX_DESCRIPTION_LENGTH).trim(),
      quantity: { kind: 'unknown' },
      unitPriceCents: null,
      lineTotalCents: null,
      confidence: 'low',
      notes: [issue.message],
    },
    issues: [issue],
  };
}

/**
 * Interpreta un renglón con al menos un monto. Devuelve null cuando no hay
 * ningún monto: quien llama decide si es encabezado o producto ilegible.
 */
export function parseTicketLine(source: string): ParsedTicketLine | null {
  const working = source.replace(/^[*#.\-]+\s*/, '').trim();
  if (!working) {
    return null;
  }

  const split = splitQuantity(working);
  const amounts = findTicketAmounts(split.rest);
  if (amounts.length === 0) {
    return null;
  }

  const description = cleanDescription(split.rest, amounts);
  if (!description) {
    return null;
  }

  const issues: TicketWarning[] = [];
  const quantity = split.quantity;
  const printedTotal = amounts[amounts.length - 1].cents;
  const unitPrice = split.unitPriceCents;
  // Con multiplicador explícito y un solo monto, ese monto es el unitario.
  const onlyUnitPrice = unitPrice !== null && amounts.length === 1;

  let lineTotalCents: number | null = onlyUnitPrice ? null : printedTotal;
  if (unitPrice !== null && onlyUnitPrice && quantity.kind === 'integer') {
    try {
      lineTotalCents = multiplyCents(quantity.units, unitPrice);
    } catch {
      lineTotalCents = null;
    }
  }

  if (onlyUnitPrice && lineTotalCents === null) {
    issues.push({
      code: 'invalid_price',
      message: 'No se pudo calcular el total del renglón.',
      rawLine: source,
    });
  } else if (lineTotalCents !== null && lineTotalCents < 0) {
    lineTotalCents = null;
    issues.push({
      code: 'negative_amount',
      message: 'El renglón trae un precio negativo.',
      rawLine: source,
    });
  } else if (
    lineTotalCents !== null &&
    lineTotalCents > MAX_PURCHASE_LINE_CENTS
  ) {
    issues.push({
      code: 'price_too_high',
      message: `El renglón pasa de ${formatCents(MAX_PURCHASE_LINE_CENTS)}.`,
      rawLine: source,
    });
  }

  if (quantity.kind === 'integer' && quantity.units > MAX_PURCHASE_UNITS) {
    issues.push({
      code: 'units_too_large',
      message: `El renglón trae más de ${MAX_PURCHASE_UNITS} unidades.`,
      rawLine: source,
    });
  }
  if (quantity.kind === 'decimal') {
    issues.push({
      code: 'decimal_quantity',
      message: `Cantidad decimal (${quantity.raw}): requiere revisión.`,
      rawLine: source,
    });
  }
  if (quantity.kind === 'unknown') {
    issues.push({
      code: 'missing_quantity',
      message: 'El renglón no indica cantidad.',
      rawLine: source,
    });
  }

  let descriptionText = description;
  if (descriptionText.length > MAX_DESCRIPTION_LENGTH) {
    descriptionText = descriptionText.slice(0, MAX_DESCRIPTION_LENGTH).trim();
    issues.push({
      code: 'description_too_long',
      message: `La descripción se recortó a ${MAX_DESCRIPTION_LENGTH} caracteres.`,
      rawLine: source,
    });
  }

  let unitPriceCents = split.unitPriceCents;
  if (
    unitPriceCents === null &&
    quantity.kind === 'integer' &&
    lineTotalCents !== null
  ) {
    unitPriceCents = Math.round(lineTotalCents / quantity.units);
  }
  if (
    split.unitPriceCents !== null &&
    quantity.kind === 'integer' &&
    lineTotalCents !== null &&
    split.unitPriceCents * quantity.units !== lineTotalCents
  ) {
    issues.push({
      code: 'line_price_mismatch',
      message: 'El precio unitario no coincide con el total del renglón.',
      rawLine: source,
    });
  }

  const low =
    quantity.kind !== 'integer' ||
    lineTotalCents === null ||
    lineTotalCents > MAX_PURCHASE_LINE_CENTS ||
    issues.some((issue) => issue.code === 'line_price_mismatch');

  return {
    line: {
      source,
      description: descriptionText,
      quantity,
      unitPriceCents,
      lineTotalCents,
      confidence: low ? 'low' : 'high',
      notes: issues.map((issue) => issue.message),
    },
    issues,
  };
}

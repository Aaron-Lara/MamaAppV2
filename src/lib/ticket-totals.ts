// Lectura y conciliación de los totales del ticket. Nunca se ajustan precios
// ni cantidades: solo se comparan los números y se reportan diferencias.

import { formatCents, sumCents } from './money';
import { parseTicketAmount } from './ticket-money';
import { foldText } from './ticket-text';
import type {
  TicketCheck,
  TicketCheckKind,
  TicketLine,
  TicketTotals,
  TicketWarning,
} from './ticket-types';

function lastAmount(
  lines: readonly string[],
  predicate: (folded: string) => boolean
): number | null {
  let found: number | null = null;
  for (const line of lines) {
    if (!predicate(foldText(line))) {
      continue;
    }
    const amount = parseTicketAmount(line);
    if (amount !== null) {
      found = Math.abs(amount);
    }
  }
  return found;
}

type TaxInfo = { cents: number | null; included: boolean };

/** Separa el IVA que se suma del que el ticket declara como incluido. */
function taxInfo(lines: readonly string[]): TaxInfo {
  let cents: number | null = null;
  let included = false;

  for (const line of lines) {
    const folded = foldText(line);
    if (!folded.startsWith('IVA') && !folded.startsWith('IMPUESTO')) {
      continue;
    }
    if (folded.includes('INCLUID')) {
      included = true;
    }
    const amount = parseTicketAmount(line);
    if (amount !== null) {
      cents = Math.abs(amount);
    }
  }

  return { cents, included };
}

export function parseTicketTotals(lines: readonly string[]): TicketTotals {
  const tax = taxInfo(lines);
  return {
    subtotalCents: lastAmount(lines, (folded) => folded.startsWith('SUBTOTAL')),
    taxCents: tax.cents,
    taxIncluded: tax.included,
    discountCents: lastAmount(lines, (folded) =>
      folded.startsWith('DESCUENTO')
    ),
    totalCents: lastAmount(
      lines,
      (folded) => folded.startsWith('TOTAL') && !folded.startsWith('SUBTOTAL')
    ),
  };
}

function makeCheck(
  kind: TicketCheckKind,
  expectedCents: number,
  foundCents: number
): TicketCheck {
  const differenceCents = foundCents - expectedCents;
  return {
    kind,
    expectedCents,
    foundCents,
    differenceCents,
    matches: differenceCents === 0,
  };
}

/**
 * Compara los renglones contra el subtotal (o el total si no hay subtotal) y
 * el subtotal con sus impuestos y descuentos contra el total.
 */
export function buildTicketChecks(
  lines: readonly TicketLine[],
  totals: TicketTotals
): TicketCheck[] {
  const checks: TicketCheck[] = [];
  const known = lines
    .map((line) => line.lineTotalCents)
    .filter((value): value is number => value !== null);
  const complete = lines.length > 0 && known.length === lines.length;
  const linesTotal = complete ? sumCents(known) : null;

  if (linesTotal !== null && totals.subtotalCents !== null) {
    checks.push(makeCheck('lines_vs_subtotal', linesTotal, totals.subtotalCents));
  } else if (linesTotal !== null && totals.totalCents !== null) {
    checks.push(makeCheck('lines_vs_total', linesTotal, totals.totalCents));
  }

  if (totals.subtotalCents !== null && totals.totalCents !== null) {
    // "IVA INCLUIDO" no se suma: para la conciliación equivale a cero.
    const taxCents = totals.taxIncluded ? null : totals.taxCents;

    if (taxCents !== null && totals.discountCents === null) {
      checks.push(
        makeCheck('tax', totals.subtotalCents + taxCents, totals.totalCents)
      );
    } else if (totals.discountCents !== null && taxCents === null) {
      checks.push(
        makeCheck(
          'discount',
          totals.subtotalCents - totals.discountCents,
          totals.totalCents
        )
      );
    } else {
      const expected =
        totals.subtotalCents + (taxCents ?? 0) - (totals.discountCents ?? 0);
      checks.push(makeCheck('subtotal_vs_total', expected, totals.totalCents));
    }
  }

  return checks;
}

const MISMATCH_CODES: Record<TicketCheckKind, TicketWarning['code']> = {
  lines_vs_subtotal: 'total_mismatch',
  lines_vs_total: 'total_mismatch',
  subtotal_vs_total: 'subtotal_mismatch',
  tax: 'subtotal_mismatch',
  discount: 'subtotal_mismatch',
};

function describe(check: TicketCheck): string {
  const expected = formatCents(check.expectedCents ?? 0);
  const found = formatCents(check.foundCents ?? 0);
  const difference = formatCents(Math.abs(check.differenceCents ?? 0));

  if (check.kind === 'lines_vs_subtotal') {
    return `La suma de los renglones (${expected}) no coincide con el subtotal (${found}). Diferencia: ${difference}.`;
  }
  if (check.kind === 'lines_vs_total') {
    return `La suma de los renglones (${expected}) no coincide con el total (${found}). Diferencia: ${difference}.`;
  }
  return `El subtotal, los impuestos y el descuento no cuadran con el total (${found}). Diferencia: ${difference}.`;
}

export function ticketTotalWarnings(
  totals: TicketTotals,
  checks: readonly TicketCheck[]
): TicketWarning[] {
  const warnings: TicketWarning[] = [];

  if (totals.totalCents === null) {
    warnings.push({
      code: 'total_missing',
      message: 'No se detectó el total del ticket.',
    });
  }

  for (const check of checks) {
    if (check.matches) {
      continue;
    }
    warnings.push({
      code: MISMATCH_CODES[check.kind],
      message: describe(check),
    });
  }

  return warnings;
}

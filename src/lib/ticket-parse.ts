// Parser de tickets de compra impresos. Lógica pura y determinista: el mismo
// texto produce siempre el mismo resultado. No registra compras ni toca la base.

import { detectTicketCurrency } from './ticket-currency';
import { findTicketDate, ticketDateWarnings } from './ticket-date';
import { extractTicketLines } from './ticket-extract';
import { findTicketStore } from './ticket-store';
import { normalizeTicketText } from './ticket-text';
import {
  buildTicketChecks,
  parseTicketTotals,
  ticketTotalWarnings,
} from './ticket-totals';
import type { TicketParseResult, TicketWarning } from './ticket-types';

export * from './ticket-types';

const MAX_UNPARSED_WARNINGS = 8;

function unparsedWarnings(unparsed: readonly string[]): TicketWarning[] {
  const warnings: TicketWarning[] = unparsed
    .slice(0, MAX_UNPARSED_WARNINGS)
    .map((rawLine) => ({
      code: 'unparsed_line' as const,
      message: 'No se pudo leer este renglón del ticket.',
      rawLine,
    }));

  const extra = unparsed.length - MAX_UNPARSED_WARNINGS;
  if (extra > 0) {
    warnings.push({
      code: 'unparsed_line',
      message: `${extra} renglones más no se pudieron leer.`,
    });
  }
  return warnings;
}

/** Convierte el texto de un ticket en hechos detectados y advertencias. */
export function parseTicket(raw: string): TicketParseResult {
  const textLines = normalizeTicketText(raw);
  const warnings: TicketWarning[] = [];

  const store = findTicketStore(textLines);
  if (!store) {
    warnings.push({
      code: 'store_missing',
      message: 'No se detectó la tienda en el ticket.',
    });
  }

  const detectedDate = findTicketDate(textLines);
  warnings.push(...ticketDateWarnings(detectedDate));

  const currency = detectTicketCurrency(textLines);
  if (!currency.certain) {
    warnings.push({
      code: 'currency_assumed',
      message:
        'El ticket no indica la moneda. Se propone MXN; confírmala antes de guardar.',
    });
  }

  const extracted = extractTicketLines(textLines);
  warnings.push(...extracted.warnings);
  if (extracted.lines.length === 0) {
    warnings.push({
      code: 'no_lines',
      message: 'No se detectó ningún producto en el ticket.',
    });
  }

  const totals = parseTicketTotals(textLines);
  const checks = buildTicketChecks(extracted.lines, totals);
  warnings.push(...ticketTotalWarnings(totals, checks));
  warnings.push(...unparsedWarnings(extracted.unparsed));

  return {
    store,
    date: detectedDate.date,
    dateText: detectedDate.raw,
    currency: currency.currency,
    currencyCertain: currency.certain,
    lines: extracted.lines,
    totals,
    checks,
    warnings,
    unparsedLines: extracted.unparsed,
  };
}

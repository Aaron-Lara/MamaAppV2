// Recorrido de los renglones útiles del ticket: separa encabezado, productos,
// productos ilegibles y excedentes del límite del formulario.

import { MAX_PURCHASE_LINES } from './purchase-types';
import { parseTicketLine, parseUnpricedLine } from './ticket-lines';
import { isNoiseLine, isSummaryLine } from './ticket-text';
import type { TicketLine, TicketWarning } from './ticket-types';

export type TicketLinesResult = {
  lines: TicketLine[];
  unparsed: string[];
  warnings: TicketWarning[];
};

export function extractTicketLines(
  textLines: readonly string[]
): TicketLinesResult {
  const lines: TicketLine[] = [];
  const unparsed: string[] = [];
  const warnings: TicketWarning[] = [];
  let dropped = 0;
  // Solo la primera línea sin precio se asume encabezado (tienda).
  let headerBudget = 1;

  for (const source of textLines) {
    if (isSummaryLine(source)) {
      continue;
    }

    let parsed = parseTicketLine(source);
    if (!parsed) {
      if (isNoiseLine(source)) {
        continue;
      }
      const undetermined = !/\d/.test(source);
      if (lines.length === 0 && undetermined && headerBudget > 0) {
        headerBudget -= 1;
        continue;
      }
      if (lines.length === 0 && undetermined) {
        // No se puede decidir si es producto o encabezado: se conserva.
        unparsed.push(source);
        continue;
      }
      parsed = parseUnpricedLine(source);
    }

    if (lines.length >= MAX_PURCHASE_LINES) {
      dropped += 1;
      unparsed.push(source);
      continue;
    }

    lines.push(parsed.line);
    warnings.push(...parsed.issues);
  }

  if (dropped > 0) {
    warnings.push({
      code: 'line_limit',
      message: `El ticket trae más de ${MAX_PURCHASE_LINES} renglones. Se conservaron los primeros ${MAX_PURCHASE_LINES} y ${dropped} quedaron fuera.`,
    });
  }

  return { lines, unparsed, warnings };
}

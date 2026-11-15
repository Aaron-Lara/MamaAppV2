// Adaptador del parser al formulario de compras. Es el único archivo de la
// etapa que conoce PurchaseFormValues. No crea productos ni asocia ninguno.

import { centsToInputText } from './money-input';
import {
  emptyPurchaseLine,
  type PurchaseFormValues,
  type PurchaseLineForm,
} from './purchase-form-types';
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_PURCHASE_LINE_CENTS,
  MAX_PURCHASE_UNITS,
} from './purchase-types';
import type {
  TicketDraft,
  TicketLine,
  TicketParseResult,
  TicketWarning,
} from './ticket-types';

function draftUnits(line: TicketLine): string {
  if (line.quantity.kind !== 'integer') {
    return '';
  }
  const units = line.quantity.units;
  return Number.isSafeInteger(units) &&
    units >= 1 &&
    units <= MAX_PURCHASE_UNITS
    ? String(units)
    : '';
}

function draftCost(line: TicketLine): string {
  const cents = line.lineTotalCents;
  if (cents === null || cents < 0 || cents > MAX_PURCHASE_LINE_CENTS) {
    return '';
  }
  return centsToInputText(cents);
}

function quantityBlocker(line: TicketLine): TicketWarning {
  if (line.quantity.kind === 'decimal') {
    return {
      code: 'decimal_quantity',
      message: `El renglón "${line.description}" trae ${line.quantity.raw}. Captura unidades enteras.`,
    };
  }
  if (line.quantity.kind === 'integer') {
    return {
      code: 'units_too_large',
      message: `El renglón "${line.description}" trae más de ${MAX_PURCHASE_UNITS} unidades.`,
    };
  }
  return {
    code: 'missing_quantity',
    message: `El renglón "${line.description}" no indica cantidad. Escríbela.`,
  };
}

function lineBlockers(
  line: TicketLine,
  units: string,
  cost: string
): TicketWarning[] {
  const blockers: TicketWarning[] = [];

  if (!units) {
    blockers.push({ ...quantityBlocker(line), rawLine: line.source });
  }

  if (!cost) {
    blockers.push({
      code:
        line.lineTotalCents === null ? 'missing_price' : 'price_too_high',
      message: `El renglón "${line.description}" no tiene un costo válido. Corrígelo.`,
      rawLine: line.source,
    });
  }

  return blockers;
}

/** Construye el borrador que se puede cargar en el formulario de compras. */
export function buildTicketDraft(result: TicketParseResult): TicketDraft {
  const blockers: TicketWarning[] = [];

  const lines: PurchaseLineForm[] = result.lines.map((line, index) => {
    const units = draftUnits(line);
    const cost = draftCost(line);
    blockers.push(...lineBlockers(line, units, cost));

    return {
      key: `ticket-line-${index + 1}`,
      productId: null,
      productName: null,
      trackStock: null,
      description: line.description.slice(0, MAX_DESCRIPTION_LENGTH),
      units,
      cost,
    };
  });

  if (lines.length === 0) {
    lines.push(emptyPurchaseLine('ticket-line-1'));
    blockers.push({
      code: 'no_lines',
      message: 'No se detectó ningún producto. Captúralos a mano.',
    });
  }

  if (result.currency === 'USD') {
    blockers.push({
      code: 'usd_rate_required',
      message:
        'La compra viene en dólares. Captura el tipo de cambio antes de guardar.',
    });
  }

  const values: PurchaseFormValues = {
    store: result.store ?? '',
    currency: result.currency,
    exchangeRate: '',
    lines,
  };

  return {
    values,
    warnings: result.warnings,
    blockers,
    ready: blockers.length === 0,
  };
}

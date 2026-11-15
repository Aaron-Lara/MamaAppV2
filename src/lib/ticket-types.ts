// Tipos del parser de tickets de compra impresos. Solo describen lo que se
// detectó en el texto: no deciden nada del formulario ni tocan la base.

import type { PurchaseFormValues } from './purchase-form-types';

export type TicketCurrency = 'MXN' | 'USD';

/** Cantidad detectada. Las decimales nunca se convierten a enteros. */
export type TicketQuantity =
  | { kind: 'integer'; units: number }
  | { kind: 'decimal'; raw: string }
  | { kind: 'unknown' };

export type TicketWarningCode =
  | 'store_missing'
  | 'date_missing'
  | 'date_invalid'
  | 'date_ambiguous'
  | 'currency_assumed'
  | 'no_lines'
  | 'line_limit'
  | 'unparsed_line'
  | 'decimal_quantity'
  | 'missing_quantity'
  | 'missing_price'
  | 'invalid_price'
  | 'negative_amount'
  | 'units_too_large'
  | 'price_too_high'
  | 'description_too_long'
  | 'line_price_mismatch'
  | 'total_missing'
  | 'total_mismatch'
  | 'subtotal_mismatch'
  | 'usd_rate_required';

export type TicketWarning = {
  code: TicketWarningCode;
  message: string;
  /** Renglón original, para poder auditarlo. */
  rawLine?: string;
};

export type TicketLine = {
  /** Renglón tal como venía en el ticket, sin recortar. */
  source: string;
  description: string;
  quantity: TicketQuantity;
  unitPriceCents: number | null;
  /** Total del renglón, no el precio unitario. */
  lineTotalCents: number | null;
  confidence: 'high' | 'low';
  notes: string[];
};

export type TicketTotals = {
  subtotalCents: number | null;
  taxCents: number | null;
  /** true si el ticket dice "IVA INCLUIDO": no se suma al subtotal. */
  taxIncluded: boolean;
  discountCents: number | null;
  totalCents: number | null;
};

export type TicketCheckKind =
  | 'lines_vs_subtotal'
  | 'lines_vs_total'
  | 'subtotal_vs_total'
  | 'tax'
  | 'discount';

export type TicketCheck = {
  kind: TicketCheckKind;
  expectedCents: number | null;
  foundCents: number | null;
  differenceCents: number | null;
  matches: boolean;
};

export type TicketParseResult = {
  store: string | null;
  /** Fecha AAAA-MM-DD. Es informativa: no cambia la fecha del formulario. */
  date: string | null;
  /** Texto de la fecha tal como venía en el ticket. */
  dateText: string | null;
  currency: TicketCurrency;
  currencyCertain: boolean;
  lines: TicketLine[];
  totals: TicketTotals;
  checks: TicketCheck[];
  warnings: TicketWarning[];
  unparsedLines: string[];
};

export type TicketDraft = {
  values: PurchaseFormValues;
  warnings: TicketWarning[];
  /** Motivos por los que el borrador todavía no se puede guardar. */
  blockers: TicketWarning[];
  ready: boolean;
};

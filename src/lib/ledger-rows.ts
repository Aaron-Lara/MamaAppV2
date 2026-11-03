// Filas del historial de un cliente y validaciones puras del abono.

import type { LedgerItem } from '@/db/customer-ledger';
import { formatCents } from './money';
import { parseMoneyToCents } from './money-input';
import { MAX_PAYMENT_CENTS } from './payment-input';
import { formatSaleItemsText } from './sale-items-formatter';

export type LedgerDisplayRow = {
  key: string;
  id: number;
  type: LedgerItem['type'];
  title: string;
  amountCents: number;
  date: string;
  isVoid: boolean;
  voidReason: string | null;
};

export type PaymentAmountResult =
  | { ok: true; amountCents: number }
  | { ok: false; error: string };

/** Convierte los movimientos sin cambiar el orden recibido (más reciente primero). */
export function buildLedgerRows(ledger: LedgerItem[]): LedgerDisplayRow[] {
  return ledger.map((item) => {
    const items = item.items ?? [];
    const title =
      item.type === 'sale'
        ? items.length > 0
          ? `Fiado: ${formatSaleItemsText(items)}`
          : 'Fiado'
        : 'Abono';

    return {
      key: `${item.type}-${item.id}`,
      id: item.id,
      type: item.type,
      title,
      amountCents: item.amountCents,
      date: item.date,
      isVoid: item.status === 'void',
      voidReason: item.voidReason ?? null,
    };
  });
}

/** Valida el texto del monto contra el saldo actual y el tope por abono. */
export function validatePaymentAmount(
  text: string,
  balanceCents: number
): PaymentAmountResult {
  let amountCents: number;
  try {
    amountCents = parseMoneyToCents(text);
  } catch {
    return { ok: false, error: 'Escribe un monto válido, por ejemplo 50.00.' };
  }

  if (amountCents <= 0) {
    return { ok: false, error: 'El abono debe ser mayor a cero.' };
  }
  if (amountCents > MAX_PAYMENT_CENTS) {
    return {
      ok: false,
      error: `El abono no puede pasar de ${formatCents(MAX_PAYMENT_CENTS)}.`,
    };
  }
  if (amountCents > balanceCents) {
    return { ok: false, error: 'El abono no puede ser mayor que lo que debe' };
  }
  return { ok: true, amountCents };
}

/** Monto del atajo "Pagar todo"; null si el saldo supera el máximo por abono. */
export function payAllAmount(balanceCents: number): number | null {
  if (balanceCents > MAX_PAYMENT_CENTS) {
    return null;
  }
  return balanceCents > 0 ? balanceCents : 0;
}

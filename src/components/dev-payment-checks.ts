// TEMPORAL: helpers de los casos de abonos del panel de pruebas.

import type { SQLiteDatabase } from 'expo-sqlite';

import type { DevCaseResult } from '@/components/dev-sales-cases';
import { getCustomerBalance } from '@/db/balances';
import { recordPayment } from '@/db/payments';
import { formatCents } from '@/lib/money';
import { MAX_PAYMENT_CENTS } from '@/lib/payment-input';

export function errorText(err: unknown): string {
  return err instanceof Error ? err.message : 'Error desconocido.';
}

export function balanceOf(db: SQLiteDatabase, customerId: number): Promise<number> {
  return getCustomerBalance(db, customerId);
}

/** Compara el saldo antes y después y muestra el cambio, no valores absolutos. */
export function deltaResult(
  before: number,
  after: number,
  expectedDelta: number,
  detail: string
): DevCaseResult {
  const delta = after - before;
  const ok = delta === expectedDelta;
  const sign = expectedDelta > 0 ? '+' : '';
  return {
    ok,
    message:
      `Debe ${formatCents(before)} → ${formatCents(after)} ` +
      `(${sign}${formatCents(expectedDelta)}) · ${detail} ${ok ? '✔' : '✖'}`,
  };
}

type FailureInput = {
  customerId: number;
  amountCents: number;
  note?: string | null;
};

/** Intenta un abono inválido y confirma que el saldo vigilado no cambió. */
export async function expectPaymentFailure(
  db: SQLiteDatabase,
  input: FailureInput,
  expectedText: string,
  watchCustomerId = input.customerId
): Promise<DevCaseResult> {
  const before = await balanceOf(db, watchCustomerId);
  try {
    await recordPayment(db, input);
    return {
      ok: false,
      message: `Se guardó el abono y no debía. Debe ${formatCents(before)}.`,
    };
  } catch (err) {
    const after = await balanceOf(db, watchCustomerId);
    const text = errorText(err);
    const textOk = text.toLowerCase().includes(expectedText.toLowerCase());
    const same = before === after;
    return {
      ok: textOk && same,
      message:
        `${text} · Debe ${formatCents(before)} → ${formatCents(after)} ` +
        (textOk && same ? '✔ nada cambió' : '✖ algo cambió'),
    };
  }
}

/** Abona todo el saldo en partes que respeten el tope por abono. */
export async function payAllBalance(
  db: SQLiteDatabase,
  customerId: number,
  note: string
): Promise<number> {
  let remaining = await balanceOf(db, customerId);
  let lastId = 0;
  while (remaining > 0) {
    const chunk = Math.min(remaining, MAX_PAYMENT_CENTS);
    lastId = await recordPayment(db, { customerId, amountCents: chunk, note });
    remaining -= chunk;
  }
  return lastId;
}

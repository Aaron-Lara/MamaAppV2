// TEMPORAL: ejecución de los casos n) a s) del panel de pruebas.

import type { SQLiteDatabase } from 'expo-sqlite';

import type { DevPaymentCaseId } from '@/components/dev-payment-cases';
import {
  balanceOf,
  deltaResult,
  errorText,
  expectPaymentFailure,
  payAllBalance,
} from '@/components/dev-payment-checks';
import type { DevCaseResult } from '@/components/dev-sales-cases';
import { ensureCustomer } from '@/db/customers';
import { recordPayment } from '@/db/payments';
import { voidPayment } from '@/db/payments-void';
import { recordSale } from '@/db/sales';
import { getSaleRow } from '@/db/sales-summary';
import { voidSale } from '@/db/sales-void';
import { formatCents } from '@/lib/money';

const TEST_CUSTOMER = 'TEST cliente';
const TEST_ITEM = 'TEST dulce';
const NOTE = 'prueba';
const SALE_CENTS = 3000;

let lastCreditSale: { saleId: number; customerId: number } | null = null;
let lastPaymentId: number | null = null;

async function testCustomerId(db: SQLiteDatabase): Promise<number> {
  const { id } = await ensureCustomer(db, TEST_CUSTOMER);
  return id;
}

function requireCreditSale(): { saleId: number; customerId: number } {
  if (!lastCreditSale) {
    throw new Error('Primero corre el caso n).');
  }
  return lastCreditSale;
}

async function runCreditSale(db: SQLiteDatabase): Promise<DevCaseResult> {
  const customerId = await testCustomerId(db);
  const before = await balanceOf(db, customerId);
  const saleId = await recordSale(db, {
    paymentMethod: 'credit',
    customerId,
    items: [{ description: TEST_ITEM, quantity: 2, unitPriceCents: 1500 }],
  });
  lastCreditSale = { saleId, customerId };
  const after = await balanceOf(db, customerId);
  return deltaResult(before, after, SALE_CENTS, `venta fiada #${saleId}`);
}

async function runPayTen(db: SQLiteDatabase): Promise<DevCaseResult> {
  const { customerId } = requireCreditSale();
  const before = await balanceOf(db, customerId);
  lastPaymentId = await recordPayment(db, { customerId, amountCents: 1000, note: NOTE });
  const after = await balanceOf(db, customerId);
  return deltaResult(before, after, -1000, `abono #${lastPaymentId}`);
}

async function runOverpay(db: SQLiteDatabase): Promise<DevCaseResult> {
  const { customerId } = requireCreditSale();
  const balance = await balanceOf(db, customerId);
  return expectPaymentFailure(
    db,
    { customerId, amountCents: balance + 1, note: NOTE },
    'El abono no puede ser mayor que lo que debe'
  );
}

async function runVoidPay(db: SQLiteDatabase): Promise<DevCaseResult> {
  const { customerId } = requireCreditSale();
  if (!lastPaymentId) {
    return { ok: false, message: 'Primero corre el caso o).' };
  }
  const before = await balanceOf(db, customerId);
  await voidPayment(db, lastPaymentId, NOTE);
  const after = await balanceOf(db, customerId);
  return deltaResult(before, after, 1000, `abono #${lastPaymentId} anulado`);
}

async function runBadPayments(db: SQLiteDatabase): Promise<DevCaseResult> {
  const { customerId } = requireCreditSale();
  const zero = await expectPaymentFailure(
    db,
    { customerId, amountCents: 0, note: NOTE },
    'El monto del abono debe ser mayor a cero'
  );
  const missing = await expectPaymentFailure(
    db,
    { customerId: 999999, amountCents: 100, note: NOTE },
    'El cliente del abono no existe',
    customerId
  );
  return { ok: zero.ok && missing.ok, message: `$0: ${zero.message} · 999999: ${missing.message}` };
}

async function runVoidCreditSale(db: SQLiteDatabase): Promise<DevCaseResult> {
  const { saleId, customerId } = requireCreditSale();
  const row = await getSaleRow(db, saleId);
  if (row?.status !== 'active') {
    return { ok: false, message: `La venta #${saleId} ya no está activa.` };
  }
  const before = await balanceOf(db, customerId);
  if (before >= SALE_CENTS) {
    await payAllBalance(db, customerId, 'prueba s');
  }
  const paid = await balanceOf(db, customerId);
  try {
    await voidSale(db, saleId, NOTE);
    return { ok: false, message: `Se anuló la venta #${saleId} y no debía.` };
  } catch (err) {
    const after = await balanceOf(db, customerId);
    const text = errorText(err);
    const textOk = text.includes('Primero anula los abonos de ese cliente');
    const same = paid === after;
    return {
      ok: textOk && same,
      message:
        `${text} · Debe ${formatCents(before)} → ${formatCents(paid)} → ${formatCents(after)} ` +
        (textOk && same ? '✔ nada cambió' : '✖ algo cambió'),
    };
  }
}

export async function runPaymentCase(
  db: SQLiteDatabase,
  id: DevPaymentCaseId
): Promise<DevCaseResult> {
  try {
    switch (id) {
      case 'creditSale':
        return await runCreditSale(db);
      case 'payTen':
        return await runPayTen(db);
      case 'overpay':
        return await runOverpay(db);
      case 'voidPay':
        return await runVoidPay(db);
      case 'badPayments':
        return await runBadPayments(db);
      case 'voidCreditSale':
        return await runVoidCreditSale(db);
    }
  } catch (err) {
    return { ok: false, message: errorText(err) };
  }
}

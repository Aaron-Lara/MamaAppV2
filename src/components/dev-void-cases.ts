// TEMPORAL: casos de anulación del panel de pruebas. Se borra con el panel.

import type { SQLiteDatabase } from 'expo-sqlite';

import type { DevCaseResult } from '@/components/dev-sales-cases';
import { PRICE_CENTS, STOCK_PRODUCT, prepareStock } from '@/components/dev-stock-cases';
import { recordSale } from '@/db/sales';
import { getSaleRow } from '@/db/sales-summary';
import { voidSale } from '@/db/sales-void';
import { getStock } from '@/db/stock';

const VOID_REASON = 'prueba';

export type DevVoidCaseId = 'voidSale' | 'voidAgain' | 'voidMissing' | 'voidEmptyReason';

export type DevVoidCase = { id: DevVoidCaseId; label: string; expected: string };

export const DEV_VOID_CASES: DevVoidCase[] = [
  { id: 'voidSale', label: 'j) Vender 2 y anular "TEST stock"', expected: '10 → 8 → 10' },
  { id: 'voidAgain', label: 'k) Anular otra vez la venta de j)', expected: 'error, stock sin cambio' },
  { id: 'voidMissing', label: 'l) Anular la venta 999999', expected: 'error, nada cambia' },
  { id: 'voidEmptyReason', label: 'm) Anular con motivo vacío', expected: 'error, sigue activa' },
];

/** Venta creada en j), para que k) repita exactamente la misma. */
let lastVoided: { saleId: number; productId: number } | null = null;

export function isVoidCase(id: string): id is DevVoidCaseId {
  return DEV_VOID_CASES.some((testCase) => testCase.id === id);
}

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : 'Error desconocido.';
}

/** Vende las unidades pedidas de "TEST stock". */
async function sellTestStock(
  db: SQLiteDatabase,
  productId: number,
  quantity: number
): Promise<number> {
  return recordSale(db, {
    paymentMethod: 'cash',
    items: [{ productId, description: STOCK_PRODUCT, quantity, unitPriceCents: PRICE_CENTS }],
  });
}

/** Intenta anular y confirma el error, sin cambios en stock ni en la venta. */
async function expectVoidFailure(
  db: SQLiteDatabase,
  productId: number,
  saleId: number,
  reason: string,
  expectedText: string
): Promise<DevCaseResult> {
  const beforeStock = await getStock(db, productId);
  const beforeSale = await getSaleRow(db, saleId);
  try {
    await voidSale(db, saleId, reason);
    return { ok: false, message: `Se anuló la venta #${saleId} y no debía.` };
  } catch (err) {
    const text = errorText(err);
    const afterStock = await getStock(db, productId);
    const afterSale = await getSaleRow(db, saleId);
    const stockSame = beforeStock === afterStock;
    const saleSame =
      beforeSale?.status === afterSale?.status &&
      beforeSale?.void_reason === afterSale?.void_reason;
    const textOk = text.toLowerCase().includes(expectedText.toLowerCase());
    return {
      ok: stockSame && saleSame && textOk,
      message:
        `${text} · venta #${saleId} ${afterSale?.status ?? 'no existe'} · ` +
        `stock ${beforeStock} → ${afterStock} ` +
        (stockSame && saleSame && textOk ? '✔ nada cambió' : '✖ algo cambió'),
    };
  }
}

export async function runVoidCase(
  db: SQLiteDatabase,
  id: DevVoidCaseId
): Promise<DevCaseResult> {
  try {
    switch (id) {
      case 'voidSale': {
        const product = await prepareStock(db, 10, 'Preparar la anulación de una venta');
        const before = await getStock(db, product.id);
        const saleId = await sellTestStock(db, product.id, 2);
        const sold = await getStock(db, product.id);
        const result = await voidSale(db, saleId, VOID_REASON);
        const after = await getStock(db, product.id);
        const row = await getSaleRow(db, saleId);
        lastVoided = { saleId, productId: product.id };
        const ok =
          before === 10 &&
          sold === 8 &&
          after === 10 &&
          row?.status === 'void' &&
          row.void_reason === VOID_REASON &&
          result.voidMovements === 1;
        return {
          ok,
          message:
            `Venta #${saleId}: stock ${before} → ${sold} → ${after} · ` +
            `status ${row?.status ?? 'no existe'} · motivo ${row?.void_reason ?? '—'} ` +
            (ok ? '✔' : '✖'),
        };
      }
      case 'voidAgain': {
        if (!lastVoided) {
          return { ok: false, message: 'Primero corre el caso j).' };
        }
        return expectVoidFailure(
          db,
          lastVoided.productId,
          lastVoided.saleId,
          VOID_REASON,
          'ya está anulada'
        );
      }
      case 'voidMissing': {
        const product = await prepareStock(db, 10, 'Preparar el caso de venta inexistente');
        return expectVoidFailure(db, product.id, 999999, VOID_REASON, 'no existe');
      }
      case 'voidEmptyReason': {
        const product = await prepareStock(db, 10, 'Preparar el caso de motivo vacío');
        const saleId = await sellTestStock(db, product.id, 1);
        const result = await expectVoidFailure(db, product.id, saleId, '   ', 'motivo');
        const row = await getSaleRow(db, saleId);
        const active = row?.status === 'active';
        return {
          ok: result.ok && active,
          message: `${result.message} · status ${row?.status ?? 'no existe'} ${active ? '✔' : '✖'}`,
        };
      }
    }
  } catch (err) {
    return { ok: false, message: errorText(err) };
  }
}

// TEMPORAL: casos de prueba del panel de ventas. Se borra junto con el panel.

import type { SQLiteDatabase } from 'expo-sqlite';

import { countSaleItems, countSales, getSaleRow } from '@/db/sales-summary';
import { recordSale, type NewSale, type NewSaleItem } from '@/db/sales';
import { ensureCustomer, findCustomerByName } from '@/db/customers';
import { formatCents } from '@/lib/money';

const TEST_CUSTOMER = 'TEST cliente';
const TEST_ITEM = 'TEST dulce';

export type DevCaseId =
  | 'customer'
  | 'cash1'
  | 'cash3'
  | 'creditNoCustomer'
  | 'missingProduct'
  | 'creditCustomer';

export type DevCase = { id: DevCaseId; label: string; expected: string };

export type DevCaseResult = { ok: boolean; message: string };

export const DEV_CASES: DevCase[] = [
  { id: 'customer', label: 'a) Cliente "TEST cliente"', expected: 'creado o reutilizado' },
  { id: 'cash1', label: 'b) Efectivo, 1 renglón', expected: '$30.00' },
  { id: 'cash3', label: 'c) Efectivo, 3 renglones', expected: '$66.50' },
  { id: 'creditNoCustomer', label: 'd) Fiado sin cliente', expected: 'error, 0 filas nuevas' },
  { id: 'missingProduct', label: 'e) productId 999999', expected: 'error, 0 filas nuevas' },
  { id: 'creditCustomer', label: 'f) Fiado con "TEST cliente"', expected: 'se guarda' },
];

function item(quantity: number, unitPriceCents: number): NewSaleItem {
  return { description: TEST_ITEM, quantity, unitPriceCents };
}

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : 'Error desconocido.';
}

type RowCounts = { sales: number; items: number };

async function rowCounts(db: SQLiteDatabase): Promise<RowCounts> {
  const [sales, items] = await Promise.all([countSales(db), countSaleItems(db)]);
  return { sales, items };
}

function countsLabel(counts: RowCounts): string {
  return `sales ${counts.sales} · sale_items ${counts.items}`;
}

/** Guarda la venta y compara el total esperado con lo que quedó en la base. */
async function saveAndCheck(
  db: SQLiteDatabase,
  input: NewSale,
  expectedCents: number
): Promise<DevCaseResult> {
  const saleId = await recordSale(db, input);
  const row = await getSaleRow(db, saleId);
  if (!row) {
    return { ok: false, message: `Se guardó la venta #${saleId} pero no se pudo leer.` };
  }
  const allMatch = row.total_cents === expectedCents && row.items_sum_cents === row.total_cents;
  return {
    ok: allMatch,
    message:
      `Venta #${saleId}: esperado ${formatCents(expectedCents)} · ` +
      `guardado ${formatCents(row.total_cents)} · renglones ${formatCents(row.items_sum_cents)} ` +
      (allMatch ? '✔' : '✖'),
  };
}

/** Intenta guardar algo inválido y confirma que no dejó filas nuevas. */
async function expectFailure(db: SQLiteDatabase, input: NewSale): Promise<DevCaseResult> {
  const before = await rowCounts(db);
  try {
    const saleId = await recordSale(db, input);
    return {
      ok: false,
      message: `Se guardó la venta #${saleId} y no debía. ${countsLabel(before)}`,
    };
  } catch (err) {
    const after = await rowCounts(db);
    const unchanged = before.sales === after.sales && before.items === after.items;
    return {
      ok: unchanged,
      message:
        `${errorText(err)} · ${countsLabel(before)} → ${countsLabel(after)} ` +
        (unchanged ? '✔ sin filas nuevas' : '✖ hubo filas nuevas'),
    };
  }
}

export async function runDevCase(db: SQLiteDatabase, id: DevCaseId): Promise<DevCaseResult> {
  try {
    switch (id) {
      case 'customer': {
        const { id: customerId, created } = await ensureCustomer(db, TEST_CUSTOMER);
        return {
          ok: true,
          message: `Cliente #${customerId} ${created ? 'creado' : 'reutilizado (ya existía)'}.`,
        };
      }
      case 'cash1':
        return saveAndCheck(db, { paymentMethod: 'cash', items: [item(2, 1500)] }, 3000);
      case 'cash3':
        return saveAndCheck(
          db,
          { paymentMethod: 'cash', items: [item(2, 1500), item(1, 1250), item(3, 800)] },
          6650
        );
      case 'creditNoCustomer':
        return expectFailure(db, { paymentMethod: 'credit', items: [item(2, 1500)] });
      case 'missingProduct':
        return expectFailure(db, {
          paymentMethod: 'cash',
          items: [{ ...item(1, 1500), productId: 999999 }],
        });
      case 'creditCustomer': {
        const customer = await findCustomerByName(db, TEST_CUSTOMER);
        if (!customer) {
          return { ok: false, message: 'Primero crea "TEST cliente" con el caso a).' };
        }
        return saveAndCheck(
          db,
          { paymentMethod: 'credit', customerId: customer.id, items: [item(2, 1500)] },
          3000
        );
      }
    }
  } catch (err) {
    return { ok: false, message: errorText(err) };
  }
}

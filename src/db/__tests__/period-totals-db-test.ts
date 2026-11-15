// Pruebas de los totales de periodo contra SQLite real en memoria:
// días sin movimiento, anulados, abonos por cobro y gastos por fecha.

import type { SQLiteDatabase } from 'expo-sqlite';

import { createCustomer } from '@/db/customers-create';
import { migrateDbIfNeeded } from '@/db/database';
import { createExpense } from '@/db/expenses-create';
import { voidExpense } from '@/db/expenses-void';
import { voidPayment } from '@/db/payments-void';
import { getPeriodDailyTotals, getPeriodTotals } from '@/db/period-totals';
import { createProductWithStock } from '@/db/products-create';
import { createPurchase } from '@/db/purchases-create';
import { recordSale } from '@/db/sales';
import { voidSale } from '@/db/sales-void';
import { sumPeriodDays, type DailyTotals } from '@/lib/period-summary';
import { MemorySQLiteDatabase } from '../../../test-utils/memory-sqlite';

const TODAY = '2026-11-09';
const FROM = '2026-11-04';
const TO = '2026-11-06';
const ZERO = {
  cashCents: 0,
  creditCents: 0,
  activeSalesCount: 0,
  voidedSalesCount: 0,
  paymentsCents: 0,
  paymentsCount: 0,
  expensesCents: 0,
  expensesCount: 0,
};

let memory: MemorySQLiteDatabase;
let db: SQLiteDatabase;

beforeEach(async () => {
  memory = new MemorySQLiteDatabase();
  db = memory as unknown as SQLiteDatabase;
  await migrateDbIfNeeded(db);
});

afterEach(() => memory.close());

function createProduct(name = 'Agua'): Promise<number> {
  return createProductWithStock(db, { name, priceCents: 500, trackStock: false }, 0);
}

async function sell(date: string, quantity = 1, productId?: number): Promise<number> {
  const item =
    productId === undefined
      ? { description: 'Venta por monto', quantity, unitPriceCents: 500 }
      : { productId, description: 'Agua', quantity, unitPriceCents: 500 };
  return recordSale(db, { paymentMethod: 'cash', saleDate: date, items: [item] });
}

/** Los abonos reales usan la fecha del teléfono; la prueba fija payment_date. */
async function insertPayment(
  customerId: number,
  date: string,
  amountCents: number
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO payments (customer_id, payment_date, amount_cents)
     VALUES ($customerId, $date, $amount)`,
    { $customerId: customerId, $date: date, $amount: amountCents }
  );
  return result.lastInsertRowId;
}

function byDate(days: DailyTotals[]): Map<string, DailyTotals> {
  return new Map(days.map((day) => [day.date, day]));
}

test('devuelve todos los días del rango, incluso sin movimientos', async () => {
  const days = await getPeriodDailyTotals(db, FROM, TO);
  expect(days.map((day) => day.date)).toEqual(['2026-11-04', '2026-11-05', '2026-11-06']);
  for (const day of days) {
    expect(day).toEqual({ date: day.date, ...ZERO });
  }
});

test('incluye los extremos y excluye lo que queda fuera', async () => {
  const productId = await createProduct();
  await sell('2026-11-03', 1, productId);
  await sell('2026-11-04', 2, productId);
  await sell('2026-11-06', 3, productId);
  await sell('2026-11-07', 4, productId);

  const days = byDate(await getPeriodDailyTotals(db, FROM, TO));
  expect(days.get('2026-11-04')).toMatchObject({ cashCents: 1000, activeSalesCount: 1 });
  expect(days.get('2026-11-06')).toMatchObject({ cashCents: 1500, activeSalesCount: 1 });
  expect(days.has('2026-11-03')).toBe(false);
  expect(days.has('2026-11-07')).toBe(false);
});

test('separa efectivo y fiado, y la venta fiada cuenta el día de la venta', async () => {
  const productId = await createProduct();
  const customerId = await createCustomer(db, 'Ana');
  await sell('2026-11-04', 2, productId);
  await recordSale(db, {
    paymentMethod: 'credit',
    customerId,
    saleDate: '2026-11-05',
    items: [{ productId, description: 'Agua', quantity: 3, unitPriceCents: 500 }],
  });

  const days = byDate(await getPeriodDailyTotals(db, FROM, TO));
  expect(days.get('2026-11-04')).toMatchObject({ cashCents: 1000, creditCents: 0 });
  expect(days.get('2026-11-05')).toMatchObject({
    cashCents: 0,
    creditCents: 1500,
    activeSalesCount: 1,
  });
});

test('una venta anulada solo incrementa su conteo, nunca el dinero', async () => {
  const productId = await createProduct();
  const saleId = await sell('2026-11-05', 2, productId);
  await voidSale(db, saleId, 'registrada por error');

  const day = byDate(await getPeriodDailyTotals(db, FROM, TO)).get('2026-11-05');
  expect(day).toMatchObject({
    cashCents: 0,
    creditCents: 0,
    activeSalesCount: 0,
    voidedSalesCount: 1,
  });

  const totals = await getPeriodTotals(db, FROM, TO);
  expect(totals.salesCents).toBe(0);
  expect(totals.cashInDrawerCents).toBe(0);
  expect(totals.voidedSalesCount).toBe(1);
});

test('los abonos cuentan el día del cobro y excluyen los anulados', async () => {
  const customerId = await createCustomer(db, 'Ana');
  const active = await insertPayment(customerId, '2026-11-06', 300);
  const voided = await insertPayment(customerId, '2026-11-04', 900);
  await voidPayment(db, voided, 'error de captura');

  const days = byDate(await getPeriodDailyTotals(db, FROM, TO));
  expect(days.get('2026-11-06')).toMatchObject({ paymentsCents: 300, paymentsCount: 1 });
  expect(days.get('2026-11-04')).toMatchObject({ paymentsCents: 0, paymentsCount: 0 });
  expect(active).toBeGreaterThan(0);
});

test('solo los gastos activos cuentan y las compras no son gastos', async () => {
  const productId = await createProduct();
  await createExpense(db, { expenseDate: '2026-11-05', category: 'Limpieza', amountCents: 1200 }, TODAY);
  const voided = await createExpense(db, { expenseDate: '2026-11-05', category: 'Comida', amountCents: 800 }, TODAY);
  await voidExpense(db, voided, 'error de captura');
  await createExpense(db, { expenseDate: '2026-11-06', category: 'Transporte', amountCents: 300 }, TODAY);

  await createPurchase(
    db,
    { purchaseDate: '2026-11-05', currency: 'MXN', lines: [{ productId, description: 'Agua', units: 10, costCents: 3000 }] },
    TODAY
  );

  const days = byDate(await getPeriodDailyTotals(db, FROM, TO));
  expect(days.get('2026-11-05')).toMatchObject({ expensesCents: 1200, expensesCount: 1 });
  expect(days.get('2026-11-06')).toMatchObject({ expensesCents: 300, expensesCount: 1 });
});

test('getPeriodTotals reutiliza la suma pura y calcula la caja', async () => {
  const productId = await createProduct();
  const customerId = await createCustomer(db, 'Ana');
  await sell('2026-11-04', 2, productId);
  await recordSale(db, {
    paymentMethod: 'credit',
    customerId,
    saleDate: '2026-11-05',
    items: [{ productId, description: 'Agua', quantity: 1, unitPriceCents: 500 }],
  });
  await insertPayment(customerId, '2026-11-06', 200);
  await createExpense(db, { expenseDate: '2026-11-06', category: 'Comida', amountCents: 300 }, TODAY);

  const days = await getPeriodDailyTotals(db, FROM, TO);
  const totals = await getPeriodTotals(db, FROM, TO);
  expect(totals).toEqual(sumPeriodDays(days, FROM, TO));
  expect(totals).toMatchObject({
    salesCents: 1500,
    cashCents: 1000,
    creditCents: 500,
    activeSalesCount: 2,
    voidedSalesCount: 0,
    paymentsCents: 200,
    paymentsCount: 1,
    expensesCents: 300,
    expensesCount: 1,
    cashInDrawerCents: 1200,
  });
});

test('rechaza rangos inválidos antes de consultar', async () => {
  await expect(getPeriodDailyTotals(db, '2026-02-30', TO)).rejects.toThrow('El rango de fechas no es válido.');
  await expect(getPeriodDailyTotals(db, 'hoy', TO)).rejects.toThrow('El rango de fechas no es válido.');
  await expect(getPeriodDailyTotals(db, TO, FROM)).rejects.toThrow('El rango de fechas no es válido.');
  await expect(getPeriodTotals(db, TO, FROM)).rejects.toThrow('El rango de fechas no es válido.');
});

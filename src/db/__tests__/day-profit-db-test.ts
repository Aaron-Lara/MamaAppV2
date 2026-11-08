// Pruebas de la ganancia neta contra SQLite real en memoria: gastos activos
// del día exacto, gastos anulados y ausencia de efectos en el efectivo.

import type { SQLiteDatabase } from 'expo-sqlite';

import { migrateDbIfNeeded } from '@/db/database';
import { getDayProfitInputs } from '@/db/day-profit';
import { getDaySummary } from '@/db/day-summary';
import { createCustomer } from '@/db/customers-create';
import { createExpense } from '@/db/expenses-create';
import { voidExpense } from '@/db/expenses-void';
import { createProductWithStock } from '@/db/products-create';
import { createPurchase } from '@/db/purchases-create';
import { recordSale } from '@/db/sales';
import { applyDayExpenses, estimateDayProfit } from '@/lib/profit-estimate';
import { MemorySQLiteDatabase } from '../../../test-utils/memory-sqlite';

const TODAY = '2026-11-06';
const YESTERDAY = '2026-11-05';

let memory: MemorySQLiteDatabase;
let db: SQLiteDatabase;

beforeEach(async () => {
  memory = new MemorySQLiteDatabase();
  db = memory as unknown as SQLiteDatabase;
  await migrateDbIfNeeded(db);
});

afterEach(() => memory.close());

async function netFor(date: string) {
  const inputs = await getDayProfitInputs(db, date);
  return applyDayExpenses(
    estimateDayProfit(inputs.rows, inputs.costs),
    inputs.expenses.totalCents,
    inputs.expenses.count
  );
}

async function costedProduct(): Promise<number> {
  const productId = await createProductWithStock(
    db,
    { name: 'Agua', priceCents: 500, trackStock: true },
    10
  );
  await createPurchase(
    db,
    {
      purchaseDate: TODAY,
      currency: 'MXN',
      lines: [
        { productId, description: 'Agua', units: 10, costCents: 3000 },
      ],
    },
    TODAY
  );
  return productId;
}

describe('getDayProfitInputs con gastos', () => {
  test('un día sin ventas ni gastos devuelve ceros', async () => {
    const inputs = await getDayProfitInputs(db, TODAY);
    expect(inputs.expenses).toEqual({ totalCents: 0, count: 0 });

    const net = await netFor(TODAY);
    expect(net.netProfitCents).toBe(0);
    expect(net.isNetLoss).toBe(false);
    expect(net.hasKnownNet).toBe(true);
  });

  test('cuenta solo gastos activos del día exacto', async () => {
    await createExpense(
      db,
      { expenseDate: TODAY, category: 'Limpieza', amountCents: 1200 },
      TODAY
    );
    await createExpense(
      db,
      { expenseDate: TODAY, category: 'Comida', amountCents: 800 },
      TODAY
    );
    const voided = await createExpense(
      db,
      { expenseDate: TODAY, category: 'Otros', amountCents: 5000 },
      TODAY
    );
    await createExpense(
      db,
      { expenseDate: YESTERDAY, category: 'Transporte', amountCents: 3000 },
      TODAY
    );
    await voidExpense(db, voided, 'registrado por error');

    const today = await getDayProfitInputs(db, TODAY);
    const yesterday = await getDayProfitInputs(db, YESTERDAY);
    expect(today.expenses).toEqual({ totalCents: 2000, count: 2 });
    expect(yesterday.expenses).toEqual({ totalCents: 3000, count: 1 });
  });

  test('ventas y gastos producen la ganancia neta esperada', async () => {
    const productId = await costedProduct();
    await recordSale(db, {
      paymentMethod: 'cash',
      saleDate: TODAY,
      items: [
        { productId, description: 'Agua', quantity: 2, unitPriceCents: 500 },
      ],
    });

    const withoutExpenses = await netFor(TODAY);
    expect(withoutExpenses.profitCents).toBe(400);
    expect(withoutExpenses.netProfitCents).toBe(400);
    expect(withoutExpenses.expensesCount).toBe(0);

    await createExpense(
      db,
      { expenseDate: TODAY, category: 'Limpieza', amountCents: 1500 },
      TODAY
    );

    const withExpenses = await netFor(TODAY);
    expect(withExpenses.profitCents).toBe(400);
    expect(withExpenses.expensesCents).toBe(1500);
    expect(withExpenses.expensesCount).toBe(1);
    expect(withExpenses.netProfitCents).toBe(-1100);
    expect(withExpenses.isNetLoss).toBe(true);
  });

  test('las ventas fiadas siguen contando como ingreso', async () => {
    const productId = await costedProduct();
    const customerId = await createCustomer(db, 'Ana');
    await recordSale(db, {
      paymentMethod: 'credit',
      customerId,
      saleDate: TODAY,
      items: [
        { productId, description: 'Agua', quantity: 2, unitPriceCents: 500 },
      ],
    });

    const net = await netFor(TODAY);
    expect(net.profitCents).toBe(400);
    expect(net.netProfitCents).toBe(400);
  });

  test('una venta por monto sigue sin costo y no inventa ganancia', async () => {
    await recordSale(db, {
      paymentMethod: 'cash',
      saleDate: TODAY,
      items: [
        { description: 'Venta por monto', quantity: 1, unitPriceCents: 500 },
      ],
    });
    await createExpense(
      db,
      { expenseDate: TODAY, category: 'Comida', amountCents: 300 },
      TODAY
    );

    const net = await netFor(TODAY);
    expect(net.uncostedRevenueCents).toBe(500);
    expect(net.profitCents).toBe(0);
    expect(net.hasKnownNet).toBe(false);
    expect(net.netProfitCents).toBe(-300);
  });

  test('un gasto no altera el efectivo ni el resumen del día', async () => {
    await recordSale(db, {
      paymentMethod: 'cash',
      saleDate: TODAY,
      items: [
        { description: 'Venta del día', quantity: 1, unitPriceCents: 5000 },
      ],
    });
    const before = await getDaySummary(db, TODAY);

    await createExpense(
      db,
      { expenseDate: TODAY, category: 'Limpieza', amountCents: 1200 },
      TODAY
    );

    const after = await getDaySummary(db, TODAY);
    expect(after).toEqual(before);
    expect(after.cashCents).toBe(before.cashCents);
  });
});

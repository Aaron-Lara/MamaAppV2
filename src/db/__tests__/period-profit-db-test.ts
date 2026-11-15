// Pruebas de los insumos de ganancia por periodo contra SQLite en memoria:
// ventas por fecha, historial de costos, compras futuras y anuladas.

import type { SQLiteDatabase } from 'expo-sqlite';

import { migrateDbIfNeeded } from '@/db/database';
import { getDayProfitInputs } from '@/db/day-profit';
import { createExpense } from '@/db/expenses-create';
import { voidExpense } from '@/db/expenses-void';
import { getPeriodProfitInputs } from '@/db/period-profit';
import { getPeriodTotals } from '@/db/period-totals';
import { createProductWithStock } from '@/db/products-create';
import { createPurchase } from '@/db/purchases-create';
import { voidPurchase } from '@/db/purchases-void';
import { recordSale } from '@/db/sales';
import { voidSale } from '@/db/sales-void';
import { estimatePeriodProfit } from '@/lib/period-profit-estimate';
import { applyDayExpenses, estimateDayProfit } from '@/lib/profit-estimate';
import { MemorySQLiteDatabase } from '../../../test-utils/memory-sqlite';

const TODAY = '2026-11-09';
const FROM = '2026-11-01';
const TO = '2026-11-06';

let memory: MemorySQLiteDatabase;
let db: SQLiteDatabase;

beforeEach(async () => {
  memory = new MemorySQLiteDatabase();
  db = memory as unknown as SQLiteDatabase;
  await migrateDbIfNeeded(db);
});

afterEach(() => memory.close());

function createProduct(name: string): Promise<number> {
  return createProductWithStock(
    db,
    { name, priceCents: 500, trackStock: false },
    0
  );
}

function buy(
  purchaseDate: string,
  productId: number,
  units: number,
  costCents: number
): Promise<number> {
  return createPurchase(
    db,
    {
      purchaseDate,
      currency: 'MXN',
      lines: [{ productId, description: 'Compra', units, costCents }],
    },
    TODAY
  );
}

async function sell(
  saleDate: string,
  productId: number | null,
  quantity: number,
  unitPriceCents = 500
): Promise<number> {
  const item =
    productId === null
      ? { description: 'Venta por monto', quantity, unitPriceCents }
      : { productId, description: 'Producto', quantity, unitPriceCents };
  return recordSale(db, { paymentMethod: 'cash', saleDate, items: [item] });
}

async function netFor(from: string, to: string) {
  const [inputs, totals] = await Promise.all([
    getPeriodProfitInputs(db, from, to),
    getPeriodTotals(db, from, to),
  ]);
  return applyDayExpenses(
    estimatePeriodProfit(inputs.soldRows, inputs.costRows),
    totals.expensesCents,
    totals.expensesCount
  );
}

describe('getPeriodProfitInputs', () => {
  test('agrupa ventas activas por fecha y producto dentro del rango', async () => {
    const first = await createProduct('Agua');
    const second = await createProduct('Jugo');
    await sell('2026-10-31', first, 9);
    await sell('2026-11-02', first, 2);
    await sell('2026-11-02', second, 3);
    await sell('2026-11-03', first, 1);
    await sell('2026-11-07', first, 9);

    const { soldRows } = await getPeriodProfitInputs(db, '2026-11-02', '2026-11-03');
    expect(soldRows).toEqual([
      { date: '2026-11-02', productId: first, units: 2, revenueCents: 1000 },
      { date: '2026-11-02', productId: second, units: 3, revenueCents: 1500 },
      { date: '2026-11-03', productId: first, units: 1, revenueCents: 500 },
    ]);
  });

  test('excluye ventas anuladas', async () => {
    const productId = await createProduct('Agua');
    const saleId = await sell('2026-11-02', productId, 2);
    await voidSale(db, saleId, 'error de captura');

    const inputs = await getPeriodProfitInputs(db, FROM, TO);
    expect(inputs.soldRows).toEqual([]);
    expect(inputs.costRows).toEqual([]);
  });

  test('trae el historial de costos hasta el final y excluye compras futuras', async () => {
    const productId = await createProduct('Agua');
    await buy('2026-11-02', productId, 10, 3000);
    await buy('2026-11-04', productId, 5, 2000);
    await buy('2026-11-07', productId, 5, 5000);
    await sell('2026-11-05', productId, 1);

    const { costRows } = await getPeriodProfitInputs(db, FROM, TO);
    expect(costRows).toEqual([
      { productId, purchaseDate: '2026-11-04', costMxnCents: 2000, units: 5 },
      { productId, purchaseDate: '2026-11-02', costMxnCents: 3000, units: 10 },
    ]);
  });

  test('excluye compras anuladas', async () => {
    const productId = await createProduct('Agua');
    const purchaseId = await buy('2026-11-02', productId, 5, 2000);
    await voidPurchase(db, purchaseId, 'compra equivocada');
    await sell('2026-11-03', productId, 1);

    const { costRows } = await getPeriodProfitInputs(db, FROM, TO);
    expect(costRows).toEqual([]);
  });

  test('solo trae costos de productos vendidos dentro del rango', async () => {
    const sold = await createProduct('Agua');
    const onlyBought = await createProduct('Jugo');
    await buy('2026-11-02', sold, 5, 2000);
    await buy('2026-11-02', onlyBought, 5, 3000);
    await sell('2026-11-03', sold, 1);

    const { costRows } = await getPeriodProfitInputs(db, FROM, TO);
    expect(costRows).toEqual([
      { productId: sold, purchaseDate: '2026-11-02', costMxnCents: 2000, units: 5 },
    ]);
  });

  test('desempata compras del mismo día como day-profit', async () => {
    const productId = await createProduct('Agua');
    await buy('2026-11-02', productId, 5, 1000);
    await buy('2026-11-02', productId, 5, 2000);
    await sell('2026-11-03', productId, 1);

    const { costRows } = await getPeriodProfitInputs(db, FROM, TO);
    expect(costRows[0]).toMatchObject({ costMxnCents: 2000 });
  });

  test('rechaza rangos inválidos antes de consultar', async () => {
    await expect(
      getPeriodProfitInputs(db, '2026-02-30', TO)
    ).rejects.toThrow('El rango de fechas no es válido.');
    await expect(
      getPeriodProfitInputs(db, 'hoy', TO)
    ).rejects.toThrow('El rango de fechas no es válido.');
    await expect(
      getPeriodProfitInputs(db, TO, FROM)
    ).rejects.toThrow('El rango de fechas no es válido.');
  });
});

describe('ganancia del periodo con costos por fecha', () => {
  test('no aplica retroactivamente una compra posterior dentro del periodo', async () => {
    const productId = await createProduct('Agua');
    await buy('2026-11-02', productId, 3, 300);
    await buy('2026-11-04', productId, 3, 600);
    await sell('2026-11-03', productId, 2);
    await sell('2026-11-05', productId, 2);

    const inputs = await getPeriodProfitInputs(db, FROM, TO);
    const result = estimatePeriodProfit(inputs.soldRows, inputs.costRows);

    expect(result.profitCents).toBe(1400);
    expect(result.costOfGoodsCents).toBe(600);
    expect(result.costedRevenueCents).toBe(2000);
  });

  test('coincide con la suma de las ganancias diarias de day-profit', async () => {
    const productId = await createProduct('Agua');
    await buy('2026-11-02', productId, 3, 300);
    await buy('2026-11-04', productId, 3, 600);
    await sell('2026-11-03', productId, 2);
    await sell('2026-11-05', productId, 2);

    const inputs = await getPeriodProfitInputs(db, FROM, TO);
    const period = estimatePeriodProfit(inputs.soldRows, inputs.costRows);

    const firstDay = await getDayProfitInputs(db, '2026-11-03');
    const secondDay = await getDayProfitInputs(db, '2026-11-05');
    const daily =
      estimateDayProfit(firstDay.rows, firstDay.costs).profitCents +
      estimateDayProfit(secondDay.rows, secondDay.costs).profitCents;

    expect(period.profitCents).toBe(daily);
  });

  test('el periodo actual recortado a hoy ignora compras posteriores', async () => {
    const productId = await createProduct('Agua');
    await buy('2026-11-02', productId, 1, 300);
    await buy('2026-11-07', productId, 1, 900);
    await sell('2026-11-06', productId, 1);

    const inputs = await getPeriodProfitInputs(db, FROM, TO);
    const result = estimatePeriodProfit(inputs.soldRows, inputs.costRows);

    expect(result.profitCents).toBe(200);
    expect(result.hasKnownCosts).toBe(true);
  });

  test('resta solo gastos activos del periodo', async () => {
    const productId = await createProduct('Agua');
    await buy('2026-11-02', productId, 1, 200);
    await sell('2026-11-03', productId, 1);
    await createExpense(
      db,
      { expenseDate: '2026-11-03', category: 'Limpieza', amountCents: 100 },
      TODAY
    );
    const voided = await createExpense(
      db,
      { expenseDate: '2026-11-03', category: 'Comida', amountCents: 500 },
      TODAY
    );
    await voidExpense(db, voided, 'error de captura');

    const net = await netFor(FROM, TO);
    expect(net.expensesCents).toBe(100);
    expect(net.expensesCount).toBe(1);
    expect(net.netProfitCents).toBe(200);
    expect(net.hasKnownNet).toBe(true);
  });

  test('sin costos conocidos la ganancia neta no se marca como conocida', async () => {
    const productId = await createProduct('Agua');
    await sell('2026-11-03', productId, 1);
    await createExpense(
      db,
      { expenseDate: '2026-11-03', category: 'Comida', amountCents: 100 },
      TODAY
    );

    const net = await netFor(FROM, TO);
    expect(net.hasKnownNet).toBe(false);
    expect(net.netProfitCents).toBe(-100);
    expect(net.isNetLoss).toBe(true);
  });
});

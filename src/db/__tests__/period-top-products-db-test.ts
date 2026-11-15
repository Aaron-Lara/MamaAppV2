// Pruebas del top de productos por periodo contra SQLite real en memoria:
// rango inclusivo, anulados, productos nulos, orden, desempate y límite.

import type { SQLiteDatabase } from 'expo-sqlite';

import { migrateDbIfNeeded } from '@/db/database';
import { getPeriodTopProducts } from '@/db/period-top-products';
import { createProductWithStock } from '@/db/products-create';
import { recordSale } from '@/db/sales';
import { voidSale } from '@/db/sales-void';
import { MemorySQLiteDatabase } from '../../../test-utils/memory-sqlite';

const FROM = '2026-11-04';
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
  return createProductWithStock(db, { name, priceCents: 500, trackStock: false }, 0);
}

async function sell(date: string, quantity: number, productId?: number): Promise<number> {
  const item =
    productId === undefined
      ? { description: 'Venta por monto', quantity, unitPriceCents: 500 }
      : { productId, description: 'Producto', quantity, unitPriceCents: 500 };
  return recordSale(db, { paymentMethod: 'cash', saleDate: date, items: [item] });
}

test('suma el rango inclusivo y agrupa por producto', async () => {
  const productId = await createProduct('Agua');
  await sell('2026-11-03', 10, productId);
  await sell('2026-11-04', 2, productId);
  await sell('2026-11-06', 3, productId);
  await sell('2026-11-07', 10, productId);

  expect(await getPeriodTopProducts(db, FROM, TO)).toEqual([
    { productId, name: 'Agua', units: 5 },
  ]);
});

test('excluye ventas anuladas', async () => {
  const productId = await createProduct('Agua');
  const saleId = await sell('2026-11-05', 4, productId);
  await voidSale(db, saleId, 'error de captura');

  expect(await getPeriodTopProducts(db, FROM, TO)).toEqual([]);
});

test('excluye renglones sin product_id', async () => {
  const productId = await createProduct('Agua');
  await sell('2026-11-05', 2, productId);
  await sell('2026-11-05', 9);

  expect(await getPeriodTopProducts(db, FROM, TO)).toEqual([
    { productId, name: 'Agua', units: 2 },
  ]);
});

test('ordena por unidades y desempata por product_id ascendente', async () => {
  const first = await createProduct('Agua');
  const second = await createProduct('Jugo');
  const third = await createProduct('Pan');
  await sell('2026-11-05', 5, first);
  await sell('2026-11-05', 5, second);
  await sell('2026-11-05', 9, third);

  expect(await getPeriodTopProducts(db, FROM, TO)).toEqual([
    { productId: third, name: 'Pan', units: 9 },
    { productId: first, name: 'Agua', units: 5 },
    { productId: second, name: 'Jugo', units: 5 },
  ]);
});

test('devuelve como máximo cinco productos', async () => {
  const productIds: number[] = [];
  for (let index = 1; index <= 6; index += 1) {
    const productId = await createProduct(`Producto ${index}`);
    productIds.push(productId);
    await sell('2026-11-05', 7 - index, productId);
  }

  const top = await getPeriodTopProducts(db, FROM, TO);
  expect(top).toHaveLength(5);
  expect(top.map((row) => row.units)).toEqual([6, 5, 4, 3, 2]);
  expect(top.map((row) => row.productId)).toEqual(productIds.slice(0, 5));
});

test('rechaza rangos inválidos antes de consultar', async () => {
  await expect(getPeriodTopProducts(db, '2026-02-30', TO)).rejects.toThrow('El rango de fechas no es válido.');
  await expect(getPeriodTopProducts(db, 'hoy', TO)).rejects.toThrow('El rango de fechas no es válido.');
  await expect(getPeriodTopProducts(db, TO, FROM)).rejects.toThrow('El rango de fechas no es válido.');
});

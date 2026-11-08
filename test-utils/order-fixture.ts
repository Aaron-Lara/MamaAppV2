// Datos base compartidos por las pruebas de pedidos contra SQLite real.

import type { SQLiteDatabase } from 'expo-sqlite';

import { migrateDbIfNeeded } from '../src/db/database';
import type { NewOrderInput } from '../src/lib/order-types';
import { MemorySQLiteDatabase } from './memory-sqlite';

export const TODAY = '2026-11-06';

export type OrderFixture = {
  memory: MemorySQLiteDatabase;
  db: SQLiteDatabase;
};

/** Base en memoria migrada y con dos clientes y dos productos de prueba. */
export async function createOrderFixture(): Promise<OrderFixture> {
  const memory = new MemorySQLiteDatabase();
  const db = memory as unknown as SQLiteDatabase;
  await migrateDbIfNeeded(db);
  // La conexión exclusiva de expo-sqlite nace con foreign_keys en OFF.
  await db.execAsync('PRAGMA foreign_keys = OFF');
  await db.execAsync(`
    INSERT INTO customers (id, name) VALUES (1, 'Ana'), (2, 'Luis');
    INSERT INTO products (id, name, price_cents, track_stock)
      VALUES (1, 'Pan', 1500, 1), (2, 'Leche', 2500, 0);
  `);
  return { memory, db };
}

export function order(overrides: Partial<NewOrderInput> = {}): NewOrderInput {
  return {
    customerId: 1,
    orderDate: '2026-11-05',
    items: [{ productId: 1, description: 'Pan', quantity: 2, unitPriceCents: 1500 }],
    ...overrides,
  };
}

export async function count(db: SQLiteDatabase, table: string): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) AS total FROM ${table}`
  );
  return row?.total ?? 0;
}

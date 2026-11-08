// Pruebas de la migración v8: cancelar sin motivo conservando pedidos.
// Se comprueban dos caminos: una base v7 con datos y una instalación 0→8.

import type { SQLiteDatabase } from 'expo-sqlite';

import { cancelOrder } from '@/db/orders-cancel';
import { createOrder } from '@/db/orders-create';
import { migrateDbIfNeeded } from '@/db/database';
import { migrateToV1 } from '@/db/migration-v1-products';
import { migrateToV2 } from '@/db/migration-v2-customers-sales';
import { migrateToV3 } from '@/db/migration-v3-stock-movements';
import { migrateToV4 } from '@/db/migration-v4-void-sales';
import { migrateToV5 } from '@/db/migration-v5-payments';
import { migrateToV6 } from '@/db/migration-v6-purchases';
import { migrateToV7 } from '@/db/migration-v7-orders-expenses-school';
import { MemorySQLiteDatabase } from '../../../test-utils/memory-sqlite';

const TODAY = '2026-11-06';
const MIGRATIONS = [
  migrateToV1,
  migrateToV2,
  migrateToV3,
  migrateToV4,
  migrateToV5,
  migrateToV6,
  migrateToV7,
];

type OrderRow = {
  id: number;
  status: string;
  delivered_sale_id: number | null;
  cancel_reason: string | null;
};

async function userVersion(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

/** Crea una base real en v7 con un pedido pendiente, uno entregado y uno cancelado. */
async function createV7WithOrders(): Promise<{
  memory: MemorySQLiteDatabase;
  db: SQLiteDatabase;
}> {
  const memory = new MemorySQLiteDatabase();
  const db = memory as unknown as SQLiteDatabase;
  for (const migrate of MIGRATIONS) {
    await migrate(db);
  }
  await db.execAsync(`
    INSERT INTO customers (id, name) VALUES (1, 'Ana');
    INSERT INTO products (id, name, price_cents, track_stock)
      VALUES (1, 'Pan', 1500, 0);
    INSERT INTO sales (id, sale_date, customer_id, payment_method, total_cents)
      VALUES (1, '2026-11-01', 1, 'cash', 1500);

    INSERT INTO orders (id, customer_id, order_date, status, delivered_at, delivered_sale_id)
      VALUES (1, 1, '2026-11-01', 'delivered', '2026-11-02', 1);
    INSERT INTO orders (id, customer_id, order_date, status, cancelled_at, cancel_reason)
      VALUES (2, 1, '2026-11-03', 'cancelled', '2026-11-04', 'ya no lo quiere');
    INSERT INTO orders (id, customer_id, order_date)
      VALUES (3, 1, '2026-11-05');

    INSERT INTO order_items (id, order_id, product_id, description, quantity, unit_price_cents)
      VALUES (10, 1, 1, 'Pan', 1, 1500),
             (20, 2, 1, 'Pan', 2, 1500),
             (30, 3, 1, 'Pan', 3, 1500);

    PRAGMA user_version = 7;
  `);
  return { memory, db };
}

describe('migración v7 → v8', () => {
  test('conserva pedidos, renglones y relaciones y permite cancelar sin motivo', async () => {
    const { memory, db } = await createV7WithOrders();
    try {
      expect(await userVersion(db)).toBe(7);

      await migrateDbIfNeeded(db);

      expect(await userVersion(db)).toBe(8);

      const orders = await db.getAllAsync<OrderRow>(
        `SELECT id, status, delivered_sale_id, cancel_reason
           FROM orders ORDER BY id`
      );
      expect(orders).toEqual([
        { id: 1, status: 'delivered', delivered_sale_id: 1, cancel_reason: null },
        { id: 2, status: 'cancelled', delivered_sale_id: null, cancel_reason: 'ya no lo quiere' },
        { id: 3, status: 'pending', delivered_sale_id: null, cancel_reason: null },
      ]);

      const items = await db.getAllAsync<{ order_id: number }>(
        'SELECT order_id FROM order_items ORDER BY id'
      );
      expect(items.map((item) => item.order_id)).toEqual([1, 2, 3]);
      expect(await db.getAllAsync('PRAGMA foreign_key_check')).toEqual([]);

      await cancelOrder(db, { orderId: 3 }, TODAY);
      const cancelled = await db.getFirstAsync<OrderRow>(
        `SELECT id, status, delivered_sale_id, cancel_reason
           FROM orders WHERE id = 3`
      );
      expect(cancelled).toEqual({
        id: 3,
        status: 'cancelled',
        delivered_sale_id: null,
        cancel_reason: null,
      });
    } finally {
      memory.close();
    }
  });
});

describe('instalación nueva 0 → 8', () => {
  test('permite cancelar un pedido recién creado sin motivo', async () => {
    const memory = new MemorySQLiteDatabase();
    const db = memory as unknown as SQLiteDatabase;
    try {
      await migrateDbIfNeeded(db);
      expect(await userVersion(db)).toBe(8);

      await db.execAsync(`
        INSERT INTO customers (id, name) VALUES (1, 'Ana');
        INSERT INTO products (id, name, price_cents, track_stock)
          VALUES (1, 'Pan', 1500, 0);
      `);

      const orderId = await createOrder(
        db,
        {
          customerId: 1,
          orderDate: TODAY,
          items: [{ productId: 1, description: 'Pan', quantity: 1, unitPriceCents: 1500 }],
        },
        TODAY
      );
      await cancelOrder(db, { orderId }, TODAY);

      const row = await db.getFirstAsync<OrderRow>(
        `SELECT id, status, delivered_sale_id, cancel_reason
           FROM orders WHERE id = $id`,
        { $id: orderId }
      );
      expect(row).toEqual({
        id: orderId,
        status: 'cancelled',
        delivered_sale_id: null,
        cancel_reason: null,
      });
    } finally {
      memory.close();
    }
  });
});

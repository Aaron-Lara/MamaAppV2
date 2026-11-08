// Pruebas de entrega de pedidos contra SQLite real en memoria:
// efectivo/fiado, doble entrega, rollback y conservación de recordSale.

import type { SQLiteDatabase } from 'expo-sqlite';

import { createOrder } from '@/db/orders-create';
import { deliverOrder } from '@/db/orders-deliver';
import { getOrder } from '@/db/orders-get';
import { recordSale } from '@/db/sales';
import {
  count,
  createOrderFixture,
  order,
  TODAY,
  type OrderFixture,
} from '../../../test-utils/order-fixture';

let fixture: OrderFixture;
let db: SQLiteDatabase;

beforeEach(async () => {
  fixture = await createOrderFixture();
  db = fixture.db;
});

afterEach(() => fixture.memory.close());

describe('deliverOrder', () => {
  test('entrega en efectivo: venta, renglones, stock y pedido a la vez', async () => {
    await createOrder(db, order({ customerId: 2 }), TODAY);
    const orderId = await createOrder(
      db,
      order({
        items: [
          { productId: 1, description: 'Pan', quantity: 2, unitPriceCents: 1500 },
          { productId: 2, description: 'Leche', quantity: 1, unitPriceCents: 2500 },
        ],
      }),
      TODAY
    );

    const saleId = await deliverOrder(db, { orderId, paymentMethod: 'cash' }, TODAY);
    expect(saleId).not.toBe(orderId);

    const sale = await db.getFirstAsync<{ payment_method: string; total_cents: number }>(
      'SELECT payment_method, total_cents FROM sales WHERE id = $id',
      { $id: saleId }
    );
    expect(sale).toEqual({ payment_method: 'cash', total_cents: 5500 });
    expect(await count(db, 'sale_items')).toBe(2);

    const movements = await db.getAllAsync<{
      product_id: number;
      quantity: number;
      reason: string;
      reference_id: number;
    }>('SELECT product_id, quantity, reason, reference_id FROM stock_movements');
    expect(movements).toEqual([
      { product_id: 1, quantity: -2, reason: 'sale', reference_id: saleId },
    ]);

    const detail = await getOrder(db, orderId, TODAY);
    expect(detail).toMatchObject({
      status: 'delivered',
      deliveredAt: TODAY,
      deliveredSaleId: saleId,
      saleStatus: 'active',
    });

    await expect(
      deliverOrder(db, { orderId, paymentMethod: 'cash' }, TODAY)
    ).rejects.toThrow('pendiente');
    expect(await count(db, 'sales')).toBe(1);
    expect(await count(db, 'stock_movements')).toBe(1);
  });

  test('entrega fiada: la venta queda a nombre del cliente y a crédito', async () => {
    const orderId = await createOrder(db, order(), TODAY);
    const saleId = await deliverOrder(db, { orderId, paymentMethod: 'credit' }, TODAY);
    const sale = await db.getFirstAsync<{ payment_method: string; customer_id: number }>(
      'SELECT payment_method, customer_id FROM sales WHERE id = $id',
      { $id: saleId }
    );
    expect(sale).toEqual({ payment_method: 'credit', customer_id: 1 });
  });

  test('revierte venta, renglones y stock si falla la actualización del pedido', async () => {
    const orderId = await createOrder(db, order(), TODAY);
    await db.execAsync(`
      CREATE TRIGGER fail_order_update BEFORE UPDATE ON orders
      BEGIN SELECT RAISE(ABORT, 'fallo simulado'); END;
    `);

    await expect(
      deliverOrder(db, { orderId, paymentMethod: 'cash' }, TODAY)
    ).rejects.toThrow('fallo simulado');
    expect(await count(db, 'sales')).toBe(0);
    expect(await count(db, 'sale_items')).toBe(0);
    expect(await count(db, 'stock_movements')).toBe(0);
    expect(await getOrder(db, orderId, TODAY)).toMatchObject({
      status: 'pending',
      deliveredAt: null,
      deliveredSaleId: null,
    });
  });
});

describe('recordSale', () => {
  test('conserva venta, renglones y movimiento de stock', async () => {
    const saleId = await recordSale(db, {
      paymentMethod: 'cash',
      customerId: 1,
      saleDate: TODAY,
      items: [{ productId: 1, description: 'Pan', quantity: 3, unitPriceCents: 1500 }],
    });
    expect(await count(db, 'sale_items')).toBe(1);
    const movement = await db.getFirstAsync<{ quantity: number; reference_id: number }>(
      'SELECT quantity, reference_id FROM stock_movements'
    );
    expect(movement).toEqual({ quantity: -3, reference_id: saleId });
  });
});

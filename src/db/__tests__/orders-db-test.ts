// Pruebas de datos de pedidos: creación, consulta, listado y cancelación.
// Usan SQLite real en memoria para verificar también el estado guardado.

import type { SQLiteDatabase } from 'expo-sqlite';

import { cancelOrder } from '@/db/orders-cancel';
import { createOrder } from '@/db/orders-create';
import { getOrder } from '@/db/orders-get';
import { listOrders } from '@/db/orders-list';
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

describe('createOrder y getOrder', () => {
  test('guarda cabecera y renglones sin mover stock', async () => {
    const id = await createOrder(
      db,
      order({
        dueDate: '2026-11-07',
        notes: '  para el recreo  ',
        items: [
          { productId: 1, description: '  Pan  ', quantity: 2, unitPriceCents: 1500 },
          { productId: null, description: 'Leche', quantity: 1, unitPriceCents: 2500 },
        ],
      }),
      TODAY
    );

    const detail = await getOrder(db, id, TODAY);
    expect(detail).toMatchObject({
      id,
      customerName: 'Ana',
      orderDate: '2026-11-05',
      dueDate: '2026-11-07',
      notes: 'para el recreo',
      status: 'pending',
      itemCount: 2,
      totalCents: 5500,
      isOverdue: false,
      saleStatus: null,
    });
    expect(detail?.items[0]).toMatchObject({ productName: 'Pan', lineTotalCents: 3000 });
    expect(await count(db, 'stock_movements')).toBe(0);
    expect(await getOrder(db, 999, TODAY)).toBeNull();
  });

  test('rechaza referencias inexistentes antes de guardar', async () => {
    await expect(
      createOrder(db, order({ customerId: 9 }), TODAY)
    ).rejects.toThrow('cliente');
    await expect(
      createOrder(
        db,
        order({
          items: [{ productId: 9, description: 'Pan', quantity: 1, unitPriceCents: 1500 }],
        }),
        TODAY
      )
    ).rejects.toThrow('producto');
    expect(await count(db, 'orders')).toBe(0);
    expect(await count(db, 'order_items')).toBe(0);
  });
});

describe('listOrders', () => {
  test('calcula totales, filtra por estado y busca por cliente', async () => {
    const first = await createOrder(db, order({ dueDate: '2026-11-05' }), TODAY);
    const second = await createOrder(
      db,
      order({
        customerId: 2,
        items: [{ description: 'Leche', quantity: 1, unitPriceCents: 2500 }],
      }),
      TODAY
    );
    await cancelOrder(db, { orderId: second }, TODAY);

    const all = await listOrders(db, { today: TODAY });
    expect(all.map((row) => row.id)).toEqual([second, first]);
    expect(all[1]).toMatchObject({
      customerName: 'Ana',
      totalCents: 3000,
      isOverdue: true,
    });

    expect(await listOrders(db, { status: 'pending', today: TODAY })).toHaveLength(1);
    const cancelled = await listOrders(db, { status: 'cancelled', today: TODAY });
    expect(cancelled[0]).toMatchObject({ id: second, cancelReason: null });
    expect(await listOrders(db, { search: 'ana', today: TODAY })).toHaveLength(1);
  });
});

describe('cancelOrder', () => {
  test('cancela sin motivo ni borrar el pedido y sin tocar stock', async () => {
    const orderId = await createOrder(db, order(), TODAY);
    await cancelOrder(db, { orderId }, TODAY);

    const detail = await getOrder(db, orderId, TODAY);
    expect(detail).toMatchObject({
      status: 'cancelled',
      cancelledAt: TODAY,
      cancelReason: null,
    });
    expect(await count(db, 'orders')).toBe(1);
    expect(await count(db, 'stock_movements')).toBe(0);
    await expect(cancelOrder(db, { orderId }, TODAY)).rejects.toThrow('pendiente');
  });

  test('rechaza una fecha de cancelación futura sin tocar la base', async () => {
    const orderId = await createOrder(db, order(), TODAY);
    await expect(
      cancelOrder(db, { orderId, cancelledAt: '2026-11-07' }, TODAY)
    ).rejects.toThrow('futura');
    expect((await getOrder(db, orderId, TODAY))?.status).toBe('pending');
  });
});

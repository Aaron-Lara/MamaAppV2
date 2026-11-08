// Entrega de un pedido: crea la venta y actualiza el pedido en una sola
// transacción. Si algo falla, no queda venta sin pedido ni pedido sin venta.

import type { SQLiteDatabase } from 'expo-sqlite';

import { insertSaleInTransaction } from '@/db/sales-insert';
import { localDateString } from '@/lib/dates';
import {
  validateDeliverOrderInput,
  type DeliverOrderInput,
} from '@/lib/order-input';
import {
  orderItemRowsToSaleItems,
  orderItemRowsTotalCents,
} from '@/lib/order-rows';
import type { OrderItemRow, OrderStatus } from '@/lib/order-types';

type OrderForDelivery = {
  id: number;
  customer_id: number;
  order_date: string;
  status: OrderStatus;
};

/**
 * Entrega un pedido pendiente en efectivo o fiado y devuelve el id de la venta.
 * La venta, sus renglones, el stock y el estado del pedido son atómicos.
 */
export async function deliverOrder(
  db: SQLiteDatabase,
  input: DeliverOrderInput,
  today: string = localDateString()
): Promise<number> {
  const delivery = validateDeliverOrderInput(input, today);
  let saleId = 0;

  await db.withExclusiveTransactionAsync(async (txn) => {
    const order = await txn.getFirstAsync<OrderForDelivery>(
      `SELECT id, customer_id, order_date, status
         FROM orders WHERE id = $id`,
      { $id: delivery.orderId }
    );
    if (!order) {
      throw new Error('El pedido no existe.');
    }
    if (order.status !== 'pending') {
      throw new Error('Solo se puede entregar un pedido pendiente.');
    }
    if (delivery.deliveredAt < order.order_date) {
      throw new Error('La fecha de entrega no puede ser anterior al pedido.');
    }

    const lineRows = await txn.getAllAsync<OrderItemRow>(
      `SELECT product_id, description, quantity, unit_price_cents
         FROM order_items WHERE order_id = $id ORDER BY id ASC`,
      { $id: delivery.orderId }
    );
    if (lineRows.length === 0) {
      throw new Error('El pedido no tiene renglones.');
    }

    saleId = await insertSaleInTransaction(txn, {
      paymentMethod: delivery.paymentMethod,
      customerId: order.customer_id,
      items: orderItemRowsToSaleItems(lineRows),
      saleDate: delivery.deliveredAt,
      totalCents: orderItemRowsTotalCents(lineRows),
    });

    const updated = await txn.runAsync(
      `UPDATE orders
          SET status = 'delivered',
              delivered_at = $deliveredAt,
              delivered_sale_id = $saleId
        WHERE id = $id AND status = 'pending'`,
      {
        $deliveredAt: delivery.deliveredAt,
        $saleId: saleId,
        $id: delivery.orderId,
      }
    );
    if (updated.changes !== 1) {
      throw new Error('No se pudo marcar el pedido como entregado.');
    }
  });

  if (saleId === 0) {
    throw new Error('No se pudo entregar el pedido.');
  }
  return saleId;
}

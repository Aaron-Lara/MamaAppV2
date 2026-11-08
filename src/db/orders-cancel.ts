// Cancelación de pedidos. Un pedido cancelado no se borra y no mueve stock.

import type { SQLiteDatabase } from 'expo-sqlite';

import { localDateString } from '@/lib/dates';
import {
  validateCancelOrderInput,
  type CancelOrderInput,
} from '@/lib/order-input';
import type { OrderStatus } from '@/lib/order-types';

type OrderForCancel = {
  id: number;
  order_date: string;
  status: OrderStatus;
};

/**
 * Marca un pedido pendiente como cancelado y guarda la fecha.
 * No pide motivo: el pedido queda cancelado sin razón.
 * No crea venta ni movimientos de inventario.
 */
export async function cancelOrder(
  db: SQLiteDatabase,
  input: CancelOrderInput,
  today: string = localDateString()
): Promise<void> {
  const cancel = validateCancelOrderInput(input, today);

  await db.withExclusiveTransactionAsync(async (txn) => {
    const order = await txn.getFirstAsync<OrderForCancel>(
      'SELECT id, order_date, status FROM orders WHERE id = $id',
      { $id: cancel.orderId }
    );
    if (!order) {
      throw new Error('El pedido no existe.');
    }
    if (order.status !== 'pending') {
      throw new Error('Solo se puede cancelar un pedido pendiente.');
    }
    if (cancel.cancelledAt < order.order_date) {
      throw new Error('La fecha de cancelación no puede ser anterior al pedido.');
    }

    const updated = await txn.runAsync(
      `UPDATE orders
          SET status = 'cancelled',
              cancelled_at = $cancelledAt,
              cancel_reason = NULL
        WHERE id = $id AND status = 'pending'`,
      {
        $cancelledAt: cancel.cancelledAt,
        $id: cancel.orderId,
      }
    );
    if (updated.changes !== 1) {
      throw new Error('No se pudo cancelar el pedido.');
    }
  });
}

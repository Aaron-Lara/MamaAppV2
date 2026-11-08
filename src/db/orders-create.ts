// Creación de pedidos. Un pedido no mueve stock: solo guarda la promesa.
// Las pantallas no escriben SQL.

import type { SQLiteDatabase } from 'expo-sqlite';

import { localDateString } from '@/lib/dates';
import { validateNewOrder } from '@/lib/order-input';
import type { NewOrderInput } from '@/lib/order-types';

/**
 * Guarda un pedido pendiente con sus renglones y devuelve su id.
 * Verifica cliente y productos a mano: la transacción exclusiva nace con
 * foreign_keys en OFF. No inserta movimientos de inventario.
 */
export async function createOrder(
  db: SQLiteDatabase,
  input: NewOrderInput,
  today: string = localDateString()
): Promise<number> {
  const order = validateNewOrder(input, today);
  let orderId = 0;

  await db.withExclusiveTransactionAsync(async (txn) => {
    const customer = await txn.getFirstAsync<{ id: number }>(
      'SELECT id FROM customers WHERE id = $id',
      { $id: order.customerId }
    );
    if (!customer) {
      throw new Error('El cliente del pedido no existe.');
    }

    const productIds = [
      ...new Set(
        order.items
          .map((item) => item.productId)
          .filter((id): id is number => id != null)
      ),
    ];
    for (const productId of productIds) {
      const product = await txn.getFirstAsync<{ id: number }>(
        'SELECT id FROM products WHERE id = $id',
        { $id: productId }
      );
      if (!product) {
        throw new Error(`El producto ${productId} no existe.`);
      }
    }

    const result = await txn.runAsync(
      `INSERT INTO orders (customer_id, order_date, due_date, notes)
       VALUES ($customerId, $orderDate, $dueDate, $notes)`,
      {
        $customerId: order.customerId,
        $orderDate: order.orderDate,
        $dueDate: order.dueDate,
        $notes: order.notes,
      }
    );
    orderId = result.lastInsertRowId;

    const statement = await txn.prepareAsync(
      `INSERT INTO order_items (
         order_id, product_id, description, quantity, unit_price_cents
       ) VALUES ($orderId, $productId, $description, $quantity, $unitPriceCents)`
    );
    try {
      for (const item of order.items) {
        await statement.executeAsync({
          $orderId: orderId,
          $productId: item.productId,
          $description: item.description,
          $quantity: item.quantity,
          $unitPriceCents: item.unitPriceCents,
        });
      }
    } finally {
      await statement.finalizeAsync();
    }
  });

  if (orderId === 0) {
    throw new Error('No se pudo guardar el pedido.');
  }
  return orderId;
}

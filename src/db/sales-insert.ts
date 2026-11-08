// Inserción de una venta ya validada dentro de una transacción abierta.
// La comparten recordSale y la entrega de pedidos. No abre transacciones.

import type { SQLiteDatabase } from 'expo-sqlite';

import { insertSaleStockMovements } from '@/db/stock-sales';

export type PaymentMethod = 'cash' | 'credit';

export type SaleItemInput = {
  productId?: number | null;
  description: string;
  quantity: number;
  unitPriceCents: number;
};

export type InsertSaleInput = {
  paymentMethod: PaymentMethod;
  customerId: number | null;
  items: readonly SaleItemInput[];
  saleDate: string;
  totalCents: number;
};

/**
 * Verifica referencias e inserta venta, renglones y movimientos 'sale'.
 * Debe llamarse dentro de una transacción exclusiva: si algo falla, todo
 * se revierte junto. Devuelve el id de la venta.
 */
export async function insertSaleInTransaction(
  txn: SQLiteDatabase,
  input: InsertSaleInput
): Promise<number> {
  // La conexión exclusiva nace con foreign_keys en OFF: verificamos a mano.
  if (input.customerId !== null) {
    const customer = await txn.getFirstAsync<{ id: number }>(
      'SELECT id FROM customers WHERE id = $id',
      { $id: input.customerId }
    );
    if (!customer) {
      throw new Error('El cliente de la venta no existe.');
    }
  }

  const productIds = [
    ...new Set(
      input.items
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
    `INSERT INTO sales (sale_date, customer_id, payment_method, total_cents)
     VALUES ($saleDate, $customerId, $paymentMethod, $totalCents)`,
    {
      $saleDate: input.saleDate,
      $customerId: input.customerId,
      $paymentMethod: input.paymentMethod,
      $totalCents: input.totalCents,
    }
  );
  const saleId = result.lastInsertRowId;

  const statement = await txn.prepareAsync(
    `INSERT INTO sale_items (sale_id, product_id, description, quantity, unit_price_cents)
     VALUES ($saleId, $productId, $description, $quantity, $unitPriceCents)`
  );
  try {
    for (const item of input.items) {
      await statement.executeAsync({
        $saleId: saleId,
        $productId: item.productId ?? null,
        $description: item.description,
        $quantity: item.quantity,
        $unitPriceCents: item.unitPriceCents,
      });
    }
  } finally {
    await statement.finalizeAsync();
  }

  // Dentro de la misma transacción: la venta y su salida de stock viven o mueren juntas.
  await insertSaleStockMovements(txn, {
    saleId,
    movementDate: input.saleDate,
    lines: input.items,
  });

  return saleId;
}

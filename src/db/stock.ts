// Inventario: el stock es la suma de movimientos inmutables.
// Las pantallas no escriben SQL; toda escritura de stock pasa por aquí.

import type { SQLiteDatabase } from 'expo-sqlite';

import { localDateString } from '@/lib/dates';
import { MAX_ADJUSTMENT_QUANTITY } from '@/lib/stock-adjust';

// Vive en la lógica pura para que el ajuste por conteo use el mismo tope.
export { MAX_ADJUSTMENT_QUANTITY };

/** Motivos que una persona puede registrar a mano. */
const ADJUSTMENT_REASONS = ['purchase', 'adjustment', 'waste'] as const;

export type AdjustmentReason = (typeof ADJUSTMENT_REASONS)[number];
export type StockReason = AdjustmentReason | 'sale' | 'void';

export type StockMovement = {
  id: number;
  product_id: number;
  created_at: string;
  movement_date: string;
  quantity: number;
  reason: StockReason;
  reference_id: number | null;
  note: string | null;
};

export type LowStockProduct = {
  id: number;
  name: string;
  min_stock: number;
  stock: number;
};

export type RecordAdjustmentInput = {
  productId: number;
  quantity: number;
  reason: AdjustmentReason;
  note?: string | null;
};

/** Stock actual: 0 cuando el producto todavía no tiene movimientos. */
export async function getStock(db: SQLiteDatabase, productId: number): Promise<number> {
  const row = await db.getFirstAsync<{ stock: number }>(
    'SELECT COALESCE(SUM(quantity), 0) AS stock FROM stock_movements WHERE product_id = $id',
    { $id: productId }
  );
  return row?.stock ?? 0;
}

/** Productos activos que se controlan y ya llegaron a su mínimo (o abajo). */
export function listLowStock(db: SQLiteDatabase): Promise<LowStockProduct[]> {
  return db.getAllAsync<LowStockProduct>(`
    SELECT p.id, p.name, p.min_stock, COALESCE(SUM(m.quantity), 0) AS stock
    FROM products p
    LEFT JOIN stock_movements m ON m.product_id = p.id
    WHERE p.track_stock = 1 AND p.active = 1
    GROUP BY p.id
    HAVING stock <= p.min_stock
    ORDER BY stock ASC, p.name`);
}

/** Últimos movimientos, del más nuevo al más viejo (para revisar a mano). */
export function listRecentMovements(db: SQLiteDatabase, limit = 5): Promise<StockMovement[]> {
  return db.getAllAsync<StockMovement>(
    'SELECT * FROM stock_movements ORDER BY id DESC LIMIT $limit',
    { $limit: limit }
  );
}

/** Valida el ajuste completo antes de escribir nada. */
function validateAdjustment(input: RecordAdjustmentInput): string | null {
  if (!Number.isSafeInteger(input.productId) || input.productId <= 0) {
    throw new Error('El producto del ajuste no es válido.');
  }
  if (!Number.isSafeInteger(input.quantity) || input.quantity === 0) {
    throw new Error('La cantidad del ajuste debe ser un entero distinto de cero.');
  }
  if (Math.abs(input.quantity) > MAX_ADJUSTMENT_QUANTITY) {
    throw new Error(`Un ajuste no puede pasar de ${MAX_ADJUSTMENT_QUANTITY} unidades.`);
  }
  if (!ADJUSTMENT_REASONS.includes(input.reason)) {
    throw new Error('Ese motivo de movimiento no se registra a mano.');
  }
  const note = input.note?.trim() ?? '';
  if ((input.reason === 'adjustment' || input.reason === 'waste') && !note) {
    throw new Error('Este movimiento necesita una nota que explique el cambio.');
  }
  return note || null;
}

/** Registra una entrada, una merma o un ajuste manual. Devuelve el id del movimiento. */
export async function recordAdjustment(
  db: SQLiteDatabase,
  input: RecordAdjustmentInput
): Promise<number> {
  const note = validateAdjustment(input);
  const product = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM products WHERE id = $id',
    { $id: input.productId }
  );
  if (!product) {
    throw new Error(`El producto ${input.productId} no existe.`);
  }
  const result = await db.runAsync(
    `INSERT INTO stock_movements (product_id, movement_date, quantity, reason, note)
     VALUES ($productId, $movementDate, $quantity, $reason, $note)`,
    {
      $productId: input.productId,
      $movementDate: localDateString(),
      $quantity: input.quantity,
      $reason: input.reason,
      $note: note,
    }
  );
  return result.lastInsertRowId;
}

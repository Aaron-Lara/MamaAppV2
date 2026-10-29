// TEMPORAL: casos de inventario del panel de pruebas. Se borra con el panel.

import type { SQLiteDatabase } from 'expo-sqlite';

import type { DevCaseResult } from '@/components/dev-sales-cases';
import { ensureTrackedProduct } from '@/db/products';
import { recordSale } from '@/db/sales';
import { getSaleRow } from '@/db/sales-summary';
import {
  getStock,
  listLowStock,
  listRecentMovements,
  recordAdjustment,
  type StockMovement,
} from '@/db/stock';
import { formatStockLabel } from '@/lib/stock-label';

const STOCK_PRODUCT = 'TEST stock';
const PRICE_CENTS = 1000;
const MIN_STOCK = 5;

export type DevStockCaseId = 'stockCreate' | 'stockSell3' | 'stockSell9';

export type DevStockCase = { id: DevStockCaseId; label: string; expected: string };

export const DEV_STOCK_CASES: DevStockCase[] = [
  { id: 'stockCreate', label: 'g) Producto "TEST stock" +10', expected: 'stock 10' },
  { id: 'stockSell3', label: 'h) Vender 3 x "TEST stock"', expected: '10 → 7' },
  { id: 'stockSell9', label: 'i) Vender 9 x "TEST stock"', expected: '7 → -2, la venta sí se guarda' },
];

export function isStockCase(id: string): id is DevStockCaseId {
  return DEV_STOCK_CASES.some((testCase) => testCase.id === id);
}

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : 'Error desconocido.';
}

/** Crea o reutiliza "TEST stock" y lo deja con la cantidad pedida. */
async function prepareStock(
  db: SQLiteDatabase,
  target: number,
  note: string
): Promise<{ id: number; created: boolean; stock: number }> {
  const { id, created } = await ensureTrackedProduct(db, {
    name: STOCK_PRODUCT,
    priceCents: PRICE_CENTS,
    minStock: MIN_STOCK,
  });
  const current = await getStock(db, id);
  const delta = target - current;
  if (delta !== 0) {
    await recordAdjustment(db, { productId: id, quantity: delta, reason: 'adjustment', note });
  }
  return { id, created, stock: target };
}

/** Vende las unidades pedidas y compara el stock antes y después. */
async function sellAndCheck(
  db: SQLiteDatabase,
  quantity: number,
  target: number
): Promise<DevCaseResult> {
  const { id } = await prepareStock(
    db,
    target,
    `Preparar el caso de vender ${quantity} unidades`
  );
  const before = await getStock(db, id);
  const saleId = await recordSale(db, {
    paymentMethod: 'cash',
    items: [{ productId: id, description: STOCK_PRODUCT, quantity, unitPriceCents: PRICE_CENTS }],
  });
  const after = await getStock(db, id);
  const sale = await getSaleRow(db, saleId);
  const stockOk = before - quantity === after;
  const saleOk = sale !== null;
  return {
    ok: stockOk && saleOk,
    message:
      `Venta #${saleId}: stock ${before} → ${after} ` +
      `(interno ${after} · usuaria "${formatStockLabel(after)}") ` +
      `${stockOk ? '✔' : '✖'} · venta ${saleOk ? 'guardada ✔' : 'perdida ✖'}`,
  };
}

function movementText(movement: StockMovement): string {
  const sign = movement.quantity > 0 ? '+' : '';
  const reference = movement.reference_id === null ? '' : ` ref ${movement.reference_id}`;
  return `#${movement.id} ${movement.movement_date} ${movement.reason} ` +
    `${sign}${movement.quantity}${reference}`;
}

export async function runStockCase(
  db: SQLiteDatabase,
  id: DevStockCaseId
): Promise<DevCaseResult> {
  try {
    switch (id) {
      case 'stockCreate': {
        const { id: productId, created, stock } = await prepareStock(
          db,
          10,
          'Ajuste inicial del panel TEMPORAL'
        );
        const actual = await getStock(db, productId);
        return {
          ok: actual === stock,
          message:
            `Producto #${productId} ${created ? 'creado' : 'reutilizado'} · ` +
            `stock ${actual} ${actual === stock ? '✔' : '✖'} · ` +
            `usuaria "${formatStockLabel(actual)}"`,
        };
      }
      case 'stockSell3':
        return sellAndCheck(db, 3, 10);
      case 'stockSell9': {
        const result = await sellAndCheck(db, 9, 7);
        const [lowStock, movements] = await Promise.all([
          listLowStock(db),
          listRecentMovements(db, 5),
        ]);
        const lowText =
          lowStock.length === 0
            ? 'ninguno'
            : lowStock
                .map((p) => `${p.name}: ${formatStockLabel(p.stock)} (mín ${p.min_stock})`)
                .join(' · ');
        return {
          ok: result.ok,
          message:
            `${result.message}\nStock bajo: ${lowText}\n` +
            `Últimos movimientos: ${movements.map(movementText).join(' | ')}`,
        };
      }
    }
  } catch (err) {
    return { ok: false, message: errorText(err) };
  }
}

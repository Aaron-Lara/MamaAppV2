// Productos más vendidos en los últimos N días. Las pantallas no escriben SQL.
// El corte se calcula en JS con la fecha local del teléfono.

import type { SQLiteDatabase } from 'expo-sqlite';

import { localDateStringDaysAgo } from '@/lib/dates';
import type { FrequencyRow } from '@/lib/sellable-order';

export const FREQUENT_DEFAULT_DAYS = 30;
export const FREQUENT_DEFAULT_LIMIT = 12;

const MIN_DAYS = 1;
const MAX_DAYS = 365;
const MIN_LIMIT = 1;
const MAX_LIMIT = 50;

export type FrequentOptions = { days?: number; limit?: number };

type FrequentRow = { product_id: number; units_sold: number };

const FREQUENT_SQL = `
  SELECT si.product_id, SUM(si.quantity) AS units_sold
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
   WHERE si.product_id IS NOT NULL
     AND s.status = 'active'
     AND s.sale_date >= $cutoff
   GROUP BY si.product_id
   ORDER BY units_sold DESC, si.product_id ASC
   LIMIT $limit
`;

function checkRange(value: number, min: number, max: number, message: string): number {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(message);
  }
  return value;
}

/**
 * Unidades vendidas por producto en los últimos `days` días.
 * Con days = 30 el corte incluye hoy y los 30 días anteriores (31 fechas).
 * Solo cuenta renglones con product_id de ventas activas.
 */
export async function listFrequentProducts(
  db: SQLiteDatabase,
  options: FrequentOptions = {}
): Promise<FrequencyRow[]> {
  const days = checkRange(
    options.days ?? FREQUENT_DEFAULT_DAYS,
    MIN_DAYS,
    MAX_DAYS,
    'Los días deben ser un número entero entre 1 y 365.'
  );
  const limit = checkRange(
    options.limit ?? FREQUENT_DEFAULT_LIMIT,
    MIN_LIMIT,
    MAX_LIMIT,
    'El límite debe ser un número entero entre 1 y 50.'
  );
  const rows = await db.getAllAsync<FrequentRow>(FREQUENT_SQL, {
    $cutoff: localDateStringDaysAgo(days),
    $limit: limit,
  });
  return rows.map((row) => ({ productId: row.product_id, unitsSold: row.units_sold }));
}

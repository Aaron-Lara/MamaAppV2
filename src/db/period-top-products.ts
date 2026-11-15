// Top 5 de productos vendidos en un rango inclusivo. Solo lectura.
// Mismo criterio de agrupación y nombres que el resumen del día.

import type { SQLiteDatabase } from 'expo-sqlite';

import type { DayTopProduct } from '@/db/day-summary';
import { isValidDateString } from '@/lib/dates';

type TopProductRow = {
  product_id: number;
  name: string;
  units: number;
};

const TOP_LIMIT = 5;

// Los renglones por monto (sin producto) no entran al top. El nombre se toma
// del catálogo actual; description queda como respaldo si faltara el producto.
const TOP_PRODUCTS_SQL = `
  SELECT si.product_id AS product_id,
         COALESCE(p.name, si.description) AS name,
         SUM(si.quantity) AS units
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    LEFT JOIN products p ON p.id = si.product_id
   WHERE s.sale_date BETWEEN $from AND $to
     AND s.status = 'active'
     AND si.product_id IS NOT NULL
   GROUP BY si.product_id
   ORDER BY units DESC, si.product_id ASC
   LIMIT $limit
`;

/** Valida el rango antes de consultar; mismo mensaje que period-totals. */
function assertPeriodRange(from: string, to: string): void {
  if (!isValidDateString(from) || !isValidDateString(to) || from > to) {
    throw new Error('El rango de fechas no es válido.');
  }
}

/** Los cinco productos con más unidades vendidas en [from, to]. */
export async function getPeriodTopProducts(
  db: SQLiteDatabase,
  from: string,
  to: string
): Promise<DayTopProduct[]> {
  assertPeriodRange(from, to);

  const rows = await db.getAllAsync<TopProductRow>(TOP_PRODUCTS_SQL, {
    $from: from,
    $to: to,
    $limit: TOP_LIMIT,
  });

  return rows.map((row) => ({
    productId: row.product_id,
    name: row.name,
    units: row.units,
  }));
}

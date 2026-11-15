// Insumos de la ganancia de un periodo: ventas activas agrupadas por día y
// producto, más el historial de costos de esos productos hasta el final del
// rango. Solo lectura; no calcula la ganancia ni replica reglas de negocio.

import type { SQLiteDatabase } from 'expo-sqlite';

import { isValidDateString } from '@/lib/dates';
import type {
  CostHistoryRow,
  DatedProfitInputRow,
} from '@/lib/period-profit-estimate';

type SoldRow = {
  date: string;
  product_id: number | null;
  units: number;
  revenue_cents: number;
};

type CostRow = {
  product_id: number;
  purchase_date: string;
  cost_mxn_cents: number;
  units: number;
};

export type PeriodProfitInputs = {
  soldRows: DatedProfitInputRow[];
  costRows: CostHistoryRow[];
};

// Igual que day-profit.ts, pero agrupando por fecha y producto. Incluye el
// grupo product_id NULL de los renglones "por monto".
const SOLD_ROWS_SQL = `
  SELECT s.sale_date AS date,
         si.product_id AS product_id,
         SUM(si.quantity) AS units,
         SUM(si.unit_price_cents * si.quantity) AS revenue_cents
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
   WHERE s.sale_date BETWEEN $from AND $to
     AND s.status = 'active'
   GROUP BY s.sale_date, si.product_id
   ORDER BY s.sale_date ASC, si.product_id ASC
`;

// Se trae todo el historial hasta $to, no solo el último costo: cada venta
// necesita el costo que existía en su propia fecha. El orden es el mismo de
// day-profit.ts para que la primera fila aplicable sea el último costo.
const COST_ROWS_SQL = `
  SELECT i.product_id AS product_id,
         p.purchase_date AS purchase_date,
         i.cost_mxn_cents AS cost_mxn_cents,
         i.units AS units
    FROM purchase_items i
    JOIN purchases p ON p.id = i.purchase_id
   WHERE p.status = 'active'
     AND p.purchase_date <= $to
     AND i.product_id IS NOT NULL
     AND i.product_id IN (
       SELECT si.product_id
         FROM sale_items si
         JOIN sales s ON s.id = si.sale_id
        WHERE s.sale_date BETWEEN $from AND $to
          AND s.status = 'active'
          AND si.product_id IS NOT NULL
     )
   ORDER BY i.product_id ASC,
            p.purchase_date DESC,
            p.created_at DESC,
            p.id DESC,
            i.id DESC
`;

/** Valida el rango antes de consultar; mismo mensaje que period-totals. */
function assertPeriodRange(from: string, to: string): void {
  if (!isValidDateString(from) || !isValidDateString(to) || from > to) {
    throw new Error('El rango de fechas no es válido.');
  }
}

/** Ventas e historial de costos de [from, to] en dos consultas fijas. */
export async function getPeriodProfitInputs(
  db: SQLiteDatabase,
  from: string,
  to: string
): Promise<PeriodProfitInputs> {
  assertPeriodRange(from, to);

  const [soldRows, costRows] = await Promise.all([
    db.getAllAsync<SoldRow>(SOLD_ROWS_SQL, { $from: from, $to: to }),
    db.getAllAsync<CostRow>(COST_ROWS_SQL, { $from: from, $to: to }),
  ]);

  return {
    soldRows: soldRows.map((row) => ({
      date: row.date,
      productId: row.product_id,
      units: row.units,
      revenueCents: row.revenue_cents,
    })),
    costRows: costRows.map((row) => ({
      productId: row.product_id,
      purchaseDate: row.purchase_date,
      costMxnCents: row.cost_mxn_cents,
      units: row.units,
    })),
  };
}

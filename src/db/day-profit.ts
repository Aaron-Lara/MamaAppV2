// Insumos de la ganancia del día: ventas activas agrupadas por producto y el
// último costo conocido de cada producto. Solo lectura, dos consultas fijas.

import type { SQLiteDatabase } from 'expo-sqlite';

import type { ProductCost, ProfitInputRow } from '@/lib/profit-estimate';

export type DayProfitInputs = {
  rows: ProfitInputRow[];
  costs: ProductCost[];
};

type SoldRow = {
  product_id: number | null;
  units: number;
  revenue_cents: number;
};

type CostRow = {
  product_id: number;
  cost_mxn_cents: number;
  units: number;
};

// Incluye el grupo product_id NULL de los renglones "por monto".
const SOLD_ROWS_SQL = `
  SELECT si.product_id AS product_id,
         SUM(si.quantity) AS units,
         SUM(si.unit_price_cents * si.quantity) AS revenue_cents
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
   WHERE s.sale_date = $date
     AND s.status = 'active'
   GROUP BY si.product_id
`;

// La subconsulta limita los costos a los productos vendidos ese día, sin
// interpolar ids. El Map conserva la primera fila: la compra más reciente.
const COST_ROWS_SQL = `
  SELECT i.product_id AS product_id,
         i.cost_mxn_cents AS cost_mxn_cents,
         i.units AS units
    FROM purchase_items i
    JOIN purchases p ON p.id = i.purchase_id
   WHERE p.status = 'active'
     AND p.purchase_date <= $date
     AND i.product_id IS NOT NULL
     AND i.product_id IN (
       SELECT si.product_id
         FROM sale_items si
         JOIN sales s ON s.id = si.sale_id
        WHERE s.sale_date = $date
          AND s.status = 'active'
          AND si.product_id IS NOT NULL
     )
   ORDER BY i.product_id ASC,
            p.purchase_date DESC,
            p.created_at DESC,
            p.id DESC,
            i.id DESC
`;

/** Filas del día y costos conocidos, sin una consulta por producto. */
export async function getDayProfitInputs(
  db: SQLiteDatabase,
  date: string
): Promise<DayProfitInputs> {
  const [soldRows, costRows] = await Promise.all([
    db.getAllAsync<SoldRow>(SOLD_ROWS_SQL, { $date: date }),
    db.getAllAsync<CostRow>(COST_ROWS_SQL, { $date: date }),
  ]);

  const costs = new Map<number, ProductCost>();
  for (const row of costRows) {
    if (!costs.has(row.product_id)) {
      costs.set(row.product_id, {
        productId: row.product_id,
        costMxnCents: row.cost_mxn_cents,
        units: row.units,
      });
    }
  }

  return {
    rows: soldRows.map((row) => ({
      productId: row.product_id,
      units: row.units,
      revenueCents: row.revenue_cents,
    })),
    costs: [...costs.values()],
  };
}

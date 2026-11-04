// Resumen de un día: totales por forma de pago, abonos, top de productos y
// estado del inventario. Solo lectura; las pantallas no escriben SQL.

import type { SQLiteDatabase } from 'expo-sqlite';

import { listProductsWithStock } from '@/db/products-with-stock';
import { summarizeStockReview, type StockReview } from '@/lib/stock-review';

export type DayTopProduct = {
  productId: number;
  name: string;
  units: number;
};

export type DaySummary = {
  date: string;
  activeSalesCount: number;
  voidedSalesCount: number;
  cashCents: number;
  creditCents: number;
  paymentsCents: number;
  topProducts: DayTopProduct[];
  stockReview: StockReview;
};

type SalesGroupRow = {
  status: 'active' | 'void';
  payment_method: 'cash' | 'credit';
  total_cents: number;
  count: number;
};

type PaymentsRow = { total_cents: number; count: number };

type TopProductRow = { product_id: number; name: string; units: number };

const TOP_LIMIT = 5;

const SALES_GROUPS_SQL = `
  SELECT status, payment_method,
         COALESCE(SUM(total_cents), 0) AS total_cents,
         COUNT(*) AS count
    FROM sales
   WHERE sale_date = $date
   GROUP BY status, payment_method
`;

const PAYMENTS_SQL = `
  SELECT COALESCE(SUM(amount_cents), 0) AS total_cents, COUNT(*) AS count
    FROM payments
   WHERE payment_date = $date AND status = 'active'
`;

// Los renglones por monto (sin producto) no entran al top. El nombre se toma
// del catálogo actual; description queda como respaldo si faltara el producto.
const TOP_PRODUCTS_SQL = `
  SELECT si.product_id AS product_id,
         COALESCE(p.name, si.description) AS name,
         SUM(si.quantity) AS units
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    LEFT JOIN products p ON p.id = si.product_id
   WHERE s.sale_date = $date
     AND s.status = 'active'
     AND si.product_id IS NOT NULL
   GROUP BY si.product_id
   ORDER BY units DESC, si.product_id ASC
   LIMIT ${TOP_LIMIT}
`;

/** Totales y contexto del día en cuatro consultas fijas (nunca una por venta). */
export async function getDaySummary(
  db: SQLiteDatabase,
  date: string
): Promise<DaySummary> {
  const [salesRows, paymentsRow, topRows, products] = await Promise.all([
    db.getAllAsync<SalesGroupRow>(SALES_GROUPS_SQL, { $date: date }),
    db.getFirstAsync<PaymentsRow>(PAYMENTS_SQL, { $date: date }),
    db.getAllAsync<TopProductRow>(TOP_PRODUCTS_SQL, { $date: date }),
    listProductsWithStock(db),
  ]);

  let activeSalesCount = 0;
  let voidedSalesCount = 0;
  let cashCents = 0;
  let creditCents = 0;

  for (const row of salesRows) {
    // Lo anulado solo se cuenta, nunca se suma al dinero del día.
    if (row.status === 'void') {
      voidedSalesCount += row.count;
      continue;
    }
    activeSalesCount += row.count;
    if (row.payment_method === 'cash') {
      cashCents += row.total_cents;
    } else {
      creditCents += row.total_cents;
    }
  }

  return {
    date,
    activeSalesCount,
    voidedSalesCount,
    cashCents,
    creditCents,
    paymentsCents: paymentsRow?.total_cents ?? 0,
    topProducts: topRows.map((row) => ({
      productId: row.product_id,
      name: row.name,
      units: row.units,
    })),
    stockReview: summarizeStockReview(products),
  };
}

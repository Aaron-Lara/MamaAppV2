// Historial de movimientos de un cliente (fiados y abonos)
// y consulta de datos para antigüedad de deuda de todos los clientes.

import type { SQLiteDatabase } from 'expo-sqlite';

export type LedgerItem = {
  id: number;
  type: 'sale' | 'payment';
  date: string;
  amountCents: number;
  status: 'active' | 'void';
  voidReason?: string | null;
  items?: { quantity: number; description: string }[];
};

type LedgerRow = {
  id: number;
  type: 'sale' | 'payment';
  date: string;
  amountCents: number;
  status: 'active' | 'void';
  voidReason: string | null;
};

type SaleItemRow = {
  saleId: number;
  quantity: number;
  description: string;
};

type LedgerLine = { quantity: number; description: string };

/** Historial de un cliente: ventas (con renglones) y abonos (activos/anulados). */
export async function listCustomerLedger(
  db: SQLiteDatabase,
  customerId: number
): Promise<LedgerItem[]> {
  // Una sola consulta trae ventas y abonos con su created_at para ordenar.
  const rows = await db.getAllAsync<LedgerRow>(
    `
    SELECT id, type, date, amountCents, status, voidReason
    FROM (
      SELECT id, 'sale' AS type, sale_date AS date, total_cents AS amountCents,
             status, void_reason AS voidReason, created_at
      FROM sales
      WHERE customer_id = $customerId AND payment_method = 'credit'
      UNION ALL
      SELECT id, 'payment' AS type, payment_date AS date, amount_cents AS amountCents,
             status, void_reason AS voidReason, created_at
      FROM payments
      WHERE customer_id = $customerId
    )
    ORDER BY created_at DESC, id DESC
    `,
    { $customerId: customerId }
  );

  // Renglones de todas las ventas fiadas del cliente en una consulta con JOIN.
  const itemRows = await db.getAllAsync<SaleItemRow>(
    `
    SELECT si.sale_id AS saleId, si.quantity, si.description
    FROM sale_items AS si
    JOIN sales AS s ON s.id = si.sale_id
    WHERE s.customer_id = $customerId AND s.payment_method = 'credit'
    `,
    { $customerId: customerId }
  );

  const itemsBySale = new Map<number, LedgerLine[]>();
  for (const row of itemRows) {
    const lines = itemsBySale.get(row.saleId) ?? [];
    lines.push({ quantity: row.quantity, description: row.description });
    itemsBySale.set(row.saleId, lines);
  }

  return rows.map((row) => {
    const item: LedgerItem = {
      id: row.id,
      type: row.type,
      date: row.date,
      amountCents: row.amountCents,
      status: row.status,
      voidReason: row.voidReason,
    };
    if (row.type !== 'sale') {
      return item;
    }
    return { ...item, items: itemsBySale.get(row.id) ?? [] };
  });
}

export type DebtSaleInput = {
  customerId: number;
  saleDate: string;
  totalCents: number;
};

export type DebtPaymentInput = {
  customerId: number;
  paidCents: number;
};

export type DebtInput = {
  sales: DebtSaleInput[];
  payments: DebtPaymentInput[];
};

/** Datos de todos los clientes para calcular antigüedad de deuda. */
export async function listDebtAgeInputs(db: SQLiteDatabase): Promise<DebtInput> {
  const sales = await db.getAllAsync<DebtSaleInput>(
    `SELECT customer_id AS customerId, sale_date AS saleDate, total_cents AS totalCents
     FROM sales
     WHERE status = 'active' AND payment_method = 'credit'
     ORDER BY sale_date ASC, id ASC`
  );

  const payments = await db.getAllAsync<DebtPaymentInput>(
    `SELECT customer_id AS customerId, SUM(amount_cents) AS paidCents
     FROM payments
     WHERE status = 'active'
     GROUP BY customer_id`
  );

  return { sales, payments };
}

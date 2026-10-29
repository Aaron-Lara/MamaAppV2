// Saldos de fiados. Solo cuentan las ventas fiadas activas y los abonos
// activos; lo anulado no se resta ni se suma. Las pantallas no escriben SQL.

import type { SQLiteDatabase } from 'expo-sqlite';

export type Debtor = {
  customerId: number;
  name: string;
  balanceCents: number;
};

type BalanceRow = { balance_cents: number };
type DebtorRow = { customer_id: number; name: string; balance_cents: number };

const BALANCE_SQL = `
  SELECT
    (SELECT COALESCE(SUM(s.total_cents), 0)
       FROM sales s
      WHERE s.customer_id = $customerId
        AND s.status = 'active'
        AND s.payment_method = 'credit')
    -
    (SELECT COALESCE(SUM(p.amount_cents), 0)
       FROM payments p
      WHERE p.customer_id = $customerId
        AND p.status = 'active') AS balance_cents
`;

/** Saldo actual del cliente: ventas fiadas activas menos abonos activos. */
export async function getCustomerBalance(
  db: SQLiteDatabase,
  customerId: number
): Promise<number> {
  const row = await db.getFirstAsync<BalanceRow>(BALANCE_SQL, { $customerId: customerId });
  return row?.balance_cents ?? 0;
}

const DEBTORS_SQL = `
  SELECT customer_id, name, balance_cents
  FROM (
    SELECT c.id AS customer_id, c.name,
      (SELECT COALESCE(SUM(s.total_cents), 0)
         FROM sales s
        WHERE s.customer_id = c.id
          AND s.status = 'active'
          AND s.payment_method = 'credit')
      -
      (SELECT COALESCE(SUM(p.amount_cents), 0)
         FROM payments p
        WHERE p.customer_id = c.id
          AND p.status = 'active') AS balance_cents
    FROM customers c
  )
  WHERE balance_cents > 0
  ORDER BY balance_cents DESC, name ASC
`;

/** Clientes que deben algo, del saldo mayor al menor. */
export async function listDebtors(db: SQLiteDatabase): Promise<Debtor[]> {
  const rows = await db.getAllAsync<DebtorRow>(DEBTORS_SQL);
  return rows.map((row) => ({
    customerId: row.customer_id,
    name: row.name,
    balanceCents: row.balance_cents,
  }));
}

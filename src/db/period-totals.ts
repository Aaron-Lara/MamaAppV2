// Totales diarios de un rango inclusivo: ventas activas, abonos y gastos.
// Solo lectura; una consulta fija rellena también los días sin movimiento.

import type { SQLiteDatabase } from 'expo-sqlite';

import { isValidDateString } from '@/lib/dates';
import {
  sumPeriodDays,
  type DailyTotals,
  type PeriodTotals,
} from '@/lib/period-summary';

type DailyTotalsRow = {
  date: string;
  cash_cents: number;
  credit_cents: number;
  active_count: number;
  voided_count: number;
  payments_cents: number;
  payments_count: number;
  expenses_cents: number;
  expenses_count: number;
};

// El CTE genera cada día del rango; los LEFT JOIN dejan en cero los días sin
// movimiento. Lo anulado nunca suma dinero: las ventas solo aportan conteo.
const DAILY_TOTALS_SQL = `
  WITH RECURSIVE days(day) AS (
    SELECT $from
    UNION ALL
    SELECT date(day, '+1 day') FROM days WHERE day < $to
  ),
  sales_daily AS (
    SELECT sale_date AS day,
           SUM(CASE WHEN status = 'active' AND payment_method = 'cash'
                    THEN total_cents ELSE 0 END) AS cash_cents,
           SUM(CASE WHEN status = 'active' AND payment_method = 'credit'
                    THEN total_cents ELSE 0 END) AS credit_cents,
           SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_count,
           SUM(CASE WHEN status = 'void' THEN 1 ELSE 0 END) AS voided_count
      FROM sales
     WHERE sale_date BETWEEN $from AND $to
     GROUP BY sale_date
  ),
  payments_daily AS (
    SELECT payment_date AS day,
           SUM(amount_cents) AS payments_cents,
           COUNT(*) AS payments_count
      FROM payments
     WHERE payment_date BETWEEN $from AND $to
       AND status = 'active'
     GROUP BY payment_date
  ),
  expenses_daily AS (
    SELECT expense_date AS day,
           SUM(amount_cents) AS expenses_cents,
           COUNT(*) AS expenses_count
      FROM expenses
     WHERE expense_date BETWEEN $from AND $to
       AND status = 'active'
     GROUP BY expense_date
  )
  SELECT days.day AS date,
         COALESCE(s.cash_cents, 0) AS cash_cents,
         COALESCE(s.credit_cents, 0) AS credit_cents,
         COALESCE(s.active_count, 0) AS active_count,
         COALESCE(s.voided_count, 0) AS voided_count,
         COALESCE(p.payments_cents, 0) AS payments_cents,
         COALESCE(p.payments_count, 0) AS payments_count,
         COALESCE(e.expenses_cents, 0) AS expenses_cents,
         COALESCE(e.expenses_count, 0) AS expenses_count
    FROM days
    LEFT JOIN sales_daily s ON s.day = days.day
    LEFT JOIN payments_daily p ON p.day = days.day
    LEFT JOIN expenses_daily e ON e.day = days.day
   ORDER BY days.day ASC
`;

/** Valida el rango antes de consultar; mismo mensaje que sumPeriodDays. */
function assertPeriodRange(from: string, to: string): void {
  if (!isValidDateString(from) || !isValidDateString(to) || from > to) {
    throw new Error('El rango de fechas no es válido.');
  }
}

/** Un DailyTotals por día de [from, to], incluidos los días sin movimientos. */
export async function getPeriodDailyTotals(
  db: SQLiteDatabase,
  from: string,
  to: string
): Promise<DailyTotals[]> {
  assertPeriodRange(from, to);

  const rows = await db.getAllAsync<DailyTotalsRow>(DAILY_TOTALS_SQL, {
    $from: from,
    $to: to,
  });

  return rows.map((row) => ({
    date: row.date,
    cashCents: row.cash_cents,
    creditCents: row.credit_cents,
    activeSalesCount: row.active_count,
    voidedSalesCount: row.voided_count,
    paymentsCents: row.payments_cents,
    paymentsCount: row.payments_count,
    expensesCents: row.expenses_cents,
    expensesCount: row.expenses_count,
  }));
}

/** Totales del rango; delega la suma en la lógica pura ya probada. */
export async function getPeriodTotals(
  db: SQLiteDatabase,
  from: string,
  to: string
): Promise<PeriodTotals> {
  const days = await getPeriodDailyTotals(db, from, to);
  return sumPeriodDays(days, from, to);
}

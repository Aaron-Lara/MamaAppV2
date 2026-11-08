// Listado de pedidos con cliente, conteo de renglones y total.
// Solo lectura; las pantallas no escriben SQL.

import type { SQLiteDatabase } from 'expo-sqlite';

import { localDateString } from '@/lib/dates';
import { matchesSearch } from '@/lib/inventory-rules';
import { isOrderOverdue, isOrderStatus } from '@/lib/order-input';
import type { OrderFilter, OrderStatus, OrderSummary } from '@/lib/order-types';

export type ListOrdersOptions = {
  status?: OrderFilter;
  search?: string;
  /** Fecha local de hoy, para marcar atrasados sin leer el reloj. */
  today?: string;
};

type OrderRow = {
  id: number;
  customer_id: number;
  customer_name: string;
  order_date: string;
  due_date: string | null;
  status: OrderStatus;
  delivered_at: string | null;
  delivered_sale_id: number | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  item_count: number;
  total_cents: number;
};

const ORDERS_SQL = `
  SELECT o.id, o.customer_id, c.name AS customer_name, o.order_date, o.due_date,
         o.status, o.delivered_at, o.delivered_sale_id, o.cancelled_at,
         o.cancel_reason,
         COUNT(oi.id) AS item_count,
         COALESCE(SUM(oi.quantity * oi.unit_price_cents), 0) AS total_cents
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    LEFT JOIN order_items oi ON oi.order_id = o.id
`;

/** Pedidos filtrados por estado y búsqueda de cliente, del más reciente al más viejo. */
export async function listOrders(
  db: SQLiteDatabase,
  options: ListOrdersOptions = {}
): Promise<OrderSummary[]> {
  const status = options.status ?? 'all';
  if (status !== 'all' && !isOrderStatus(status)) {
    throw new Error('El filtro de pedidos no es válido.');
  }
  const today = options.today ?? localDateString();
  const where = status === 'all' ? '' : 'WHERE o.status = $status';
  const query = `${ORDERS_SQL}
     ${where}
     GROUP BY o.id
     ORDER BY o.order_date DESC, o.id DESC`;

  const rows =
    status === 'all'
      ? await db.getAllAsync<OrderRow>(query)
      : await db.getAllAsync<OrderRow>(query, { $status: status });

  const search = options.search?.trim() ?? '';
  const filtered = search
    ? rows.filter((row) => matchesSearch(row.customer_name, search))
    : rows;

  return filtered.map((row) => ({
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    orderDate: row.order_date,
    dueDate: row.due_date,
    status: row.status,
    deliveredAt: row.delivered_at,
    deliveredSaleId: row.delivered_sale_id,
    cancelledAt: row.cancelled_at,
    cancelReason: row.cancel_reason,
    itemCount: row.item_count,
    totalCents: row.total_cents,
    isOverdue: isOrderOverdue(row.status, row.due_date, today),
  }));
}

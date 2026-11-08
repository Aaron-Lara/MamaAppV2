// Detalle de un pedido con sus renglones y el estado de la venta generada.
// Solo lectura; las pantallas no escriben SQL.

import type { SQLiteDatabase } from 'expo-sqlite';

import { localDateString } from '@/lib/dates';
import { lineTotalCents } from '@/lib/money';
import { isOrderOverdue } from '@/lib/order-input';
import type {
  OrderDetail,
  OrderDetailItem,
  OrderStatus,
} from '@/lib/order-types';

type OrderHeaderRow = {
  id: number;
  customer_id: number;
  customer_name: string;
  order_date: string;
  due_date: string | null;
  notes: string | null;
  status: OrderStatus;
  delivered_at: string | null;
  delivered_sale_id: number | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  sale_status: 'active' | 'void' | null;
  item_count: number;
  total_cents: number;
};

type OrderLineRow = {
  id: number;
  product_id: number | null;
  product_name: string | null;
  description: string;
  quantity: number;
  unit_price_cents: number;
};

const HEADER_SQL = `
  SELECT o.id, o.customer_id, c.name AS customer_name, o.order_date, o.due_date,
         o.notes, o.status, o.delivered_at, o.delivered_sale_id, o.cancelled_at,
         o.cancel_reason, o.created_at, s.status AS sale_status,
         (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count,
         (SELECT COALESCE(SUM(oi.quantity * oi.unit_price_cents), 0)
            FROM order_items oi WHERE oi.order_id = o.id) AS total_cents
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    LEFT JOIN sales s ON s.id = o.delivered_sale_id
   WHERE o.id = $id
`;

const LINES_SQL = `
  SELECT oi.id, oi.product_id, p.name AS product_name, oi.description,
         oi.quantity, oi.unit_price_cents
    FROM order_items oi
    LEFT JOIN products p ON p.id = oi.product_id
   WHERE oi.order_id = $id
   ORDER BY oi.id ASC
`;

/** Devuelve el pedido con sus renglones, o null si el id no existe. */
export async function getOrder(
  db: SQLiteDatabase,
  orderId: number,
  today: string = localDateString()
): Promise<OrderDetail | null> {
  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    return null;
  }

  const header = await db.getFirstAsync<OrderHeaderRow>(HEADER_SQL, {
    $id: orderId,
  });
  if (!header) {
    return null;
  }

  const lineRows = await db.getAllAsync<OrderLineRow>(LINES_SQL, {
    $id: orderId,
  });
  const items: OrderDetailItem[] = lineRows.map((row) => ({
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    description: row.description,
    quantity: row.quantity,
    unitPriceCents: row.unit_price_cents,
    lineTotalCents: lineTotalCents(row.quantity, row.unit_price_cents),
  }));

  return {
    id: header.id,
    customerId: header.customer_id,
    customerName: header.customer_name,
    orderDate: header.order_date,
    dueDate: header.due_date,
    status: header.status,
    deliveredAt: header.delivered_at,
    deliveredSaleId: header.delivered_sale_id,
    cancelledAt: header.cancelled_at,
    cancelReason: header.cancel_reason,
    itemCount: header.item_count,
    totalCents: header.total_cents,
    isOverdue: isOrderOverdue(header.status, header.due_date, today),
    notes: header.notes,
    createdAt: header.created_at,
    saleStatus: header.sale_status,
    items,
  };
}

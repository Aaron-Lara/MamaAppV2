// Filas y filtros de la lista de pedidos. Lógica pura: sin SQL ni pantallas.

import { dayLabel } from './day-navigation';
import { matchesSearch } from './inventory-rules';
import { formatCents } from './money';
import type { OrderFilter, OrderStatus, OrderSummary } from './order-types';

/** Estado que se muestra en la fila: el atraso tiene su propio color. */
export type OrderRowStatus = OrderStatus | 'overdue';
/** Filtro de la pantalla: "pending" incluye también los atrasados. */
export type OrderListFilter = OrderFilter | 'overdue';

export type OrderListRow = {
  id: number;
  customerName: string;
  orderDateLabel: string;
  dueDateLabel: string | null;
  totalLabel: string;
  itemsLabel: string;
  status: OrderRowStatus;
  statusLabel: string;
  isOverdue: boolean;
};

export const ORDER_STATUS_LABELS: Record<OrderRowStatus, string> = {
  pending: 'Pendiente',
  overdue: 'Atrasado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

function itemsText(count: number): string {
  return count === 1 ? '1 producto' : `${count} productos`;
}

/** Convierte los pedidos de la base en filas listas para la lista. */
export function buildOrderListRows(
  items: readonly OrderSummary[],
  today: string
): OrderListRow[] {
  return items.map((item) => {
    const status: OrderRowStatus = item.isOverdue ? 'overdue' : item.status;
    return {
      id: item.id,
      customerName: item.customerName,
      orderDateLabel: dayLabel(item.orderDate, today),
      dueDateLabel: item.dueDate
        ? `${item.isOverdue ? 'Venció' : 'Entrega'}: ${dayLabel(item.dueDate, today)}`
        : null,
      totalLabel: formatCents(item.totalCents),
      itemsLabel: itemsText(item.itemCount),
      status,
      statusLabel: ORDER_STATUS_LABELS[status],
      isOverdue: item.isOverdue,
    };
  });
}

/** Aplica búsqueda por cliente y el filtro elegido. */
export function filterOrderListRows(
  rows: readonly OrderListRow[],
  filter: OrderListFilter,
  query: string
): OrderListRow[] {
  const trimmed = query.trim();
  return rows.filter((row) => {
    if (!matchesSearch(row.customerName, trimmed)) {
      return false;
    }
    if (filter === 'all') {
      return true;
    }
    if (filter === 'overdue') {
      return row.isOverdue;
    }
    if (filter === 'pending') {
      return row.status === 'pending' || row.status === 'overdue';
    }
    return row.status === filter;
  });
}

/** Totales por filtro para los chips y el aviso de atrasados. */
export function countOrderListRows(
  rows: readonly OrderListRow[]
): Record<OrderListFilter, number> {
  const counts: Record<OrderListFilter, number> = {
    all: 0,
    pending: 0,
    overdue: 0,
    delivered: 0,
    cancelled: 0,
  };
  for (const row of rows) {
    counts.all += 1;
    if (row.isOverdue) {
      counts.overdue += 1;
    }
    if (row.status === 'pending' || row.status === 'overdue') {
      counts.pending += 1;
    }
    if (row.status === 'delivered') {
      counts.delivered += 1;
    }
    if (row.status === 'cancelled') {
      counts.cancelled += 1;
    }
  }
  return counts;
}

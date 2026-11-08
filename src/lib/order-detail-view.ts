// Datos listos para mostrar el detalle de un pedido. Lógica pura.

import { dayLabel } from './day-navigation';
import { formatCents } from './money';
import {
  ORDER_STATUS_LABELS,
  type OrderRowStatus,
} from './order-list-view';
import type { OrderDetail, OrderDetailItem } from './order-types';

export type OrderDetailHeaderView = {
  id: number;
  customerName: string;
  status: OrderRowStatus;
  statusLabel: string;
  orderDateLabel: string;
  dueDateLabel: string | null;
  deliveredAtLabel: string | null;
  cancelledAtLabel: string | null;
  notes: string | null;
  itemsLabel: string;
  totalLabel: string;
  canDeliver: boolean;
  canCancel: boolean;
  saleVoided: boolean;
};

export type OrderDetailLineView = {
  id: number;
  title: string;
  productLabel: string | null;
  quantityLabel: string;
  unitPriceLabel: string;
  lineTotalLabel: string;
};

function itemsText(count: number): string {
  return count === 1 ? '1 producto' : `${count} productos`;
}

/** Encabezado del detalle con estado, fechas, notas y acciones posibles. */
export function buildOrderDetailHeader(
  detail: OrderDetail,
  today: string
): OrderDetailHeaderView {
  const status: OrderRowStatus = detail.isOverdue ? 'overdue' : detail.status;
  return {
    id: detail.id,
    customerName: detail.customerName,
    status,
    statusLabel: ORDER_STATUS_LABELS[status],
    orderDateLabel: dayLabel(detail.orderDate, today),
    dueDateLabel: detail.dueDate ? dayLabel(detail.dueDate, today) : null,
    deliveredAtLabel: detail.deliveredAt
      ? dayLabel(detail.deliveredAt, today)
      : null,
    cancelledAtLabel: detail.cancelledAt
      ? dayLabel(detail.cancelledAt, today)
      : null,
    notes: detail.notes?.trim() || null,
    itemsLabel: itemsText(detail.itemCount),
    totalLabel: formatCents(detail.totalCents),
    canDeliver: detail.status === 'pending',
    canCancel: detail.status === 'pending',
    saleVoided: detail.saleStatus === 'void',
  };
}

/** Renglones del detalle con cantidad, precio unitario y total. */
export function buildOrderDetailLines(
  items: readonly OrderDetailItem[]
): OrderDetailLineView[] {
  return items.map((item) => {
    const title = item.description.trim() || item.productName?.trim() || 'Sin descripción';
    const product = item.productName?.trim() || null;
    return {
      id: item.id,
      title,
      productLabel: product && product !== title ? product : null,
      quantityLabel:
        item.quantity === 1 ? '1 unidad' : `${item.quantity} unidades`,
      unitPriceLabel: formatCents(item.unitPriceCents),
      lineTotalLabel: formatCents(item.lineTotalCents),
    };
  });
}

// Tipos puros de pedidos. No importan expo-sqlite ni pantallas.
// Las fechas de negocio son texto local AAAA-MM-DD.

export type OrderStatus = 'pending' | 'delivered' | 'cancelled';
export type OrderFilter = OrderStatus | 'all';
export type OrderPaymentMethod = 'cash' | 'credit';

export type NewOrderItem = {
  productId?: number | null;
  description: string;
  quantity: number;
  unitPriceCents: number;
};

export type NewOrderInput = {
  customerId: number;
  /** Fecha local AAAA-MM-DD; si se omite se usa "today". */
  orderDate?: string;
  dueDate?: string | null;
  notes?: string | null;
  items: NewOrderItem[];
};

export type ValidOrderItem = {
  productId: number | null;
  description: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

export type ValidOrderInput = {
  customerId: number;
  orderDate: string;
  dueDate: string | null;
  notes: string | null;
  items: ValidOrderItem[];
  totalCents: number;
};

export type DeliverOrderInput = {
  orderId: number;
  paymentMethod: OrderPaymentMethod;
  /** Fecha local AAAA-MM-DD; si se omite se usa "today". */
  deliveredAt?: string;
};

export type ValidDeliverOrderInput = {
  orderId: number;
  paymentMethod: OrderPaymentMethod;
  deliveredAt: string;
};

export type CancelOrderInput = {
  orderId: number;
  /** Fecha local AAAA-MM-DD; si se omite se usa "today". */
  cancelledAt?: string;
};

export type ValidCancelOrderInput = {
  orderId: number;
  cancelledAt: string;
};

export type OrderSummary = {
  id: number;
  customerId: number;
  customerName: string;
  orderDate: string;
  dueDate: string | null;
  status: OrderStatus;
  deliveredAt: string | null;
  deliveredSaleId: number | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  itemCount: number;
  totalCents: number;
  isOverdue: boolean;
};

export type OrderDetailItem = {
  id: number;
  productId: number | null;
  productName: string | null;
  description: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

export type OrderDetail = OrderSummary & {
  notes: string | null;
  createdAt: string;
  saleStatus: 'active' | 'void' | null;
  items: OrderDetailItem[];
};

/** Renglón tal como lo devuelve la tabla order_items. */
export type OrderItemRow = {
  product_id: number | null;
  description: string;
  quantity: number;
  unit_price_cents: number;
};

/** Renglón listo para insertSaleInTransaction. */
export type SaleItemDraftFromOrder = {
  productId: number | null;
  description: string;
  quantity: number;
  unitPriceCents: number;
};

// Tipos y valores iniciales del formulario de pedidos. Lógica pura.

import type { NewOrderInput } from './order-types';

export type OrderLineForm = {
  key: string;
  productId: number | null;
  productName: string | null;
  description: string;
  quantity: string;
  unitPrice: string;
};

export type OrderFormValues = {
  customerId: number | null;
  customerName: string | null;
  orderDate: string;
  dueDate: string;
  notes: string;
  lines: OrderLineForm[];
};

export type OrderLineErrors = {
  description?: string;
  quantity?: string;
  unitPrice?: string;
};

export type OrderFormErrors = {
  customer?: string;
  orderDate?: string;
  dueDate?: string;
  notes?: string;
  general?: string;
  lines: Record<string, OrderLineErrors>;
};

export type OrderFormResult = {
  ok: boolean;
  errors: OrderFormErrors;
  input: NewOrderInput | null;
  totalCents: number;
  lineTotals: Record<string, number | null>;
};

export function emptyOrderLine(key: string): OrderLineForm {
  return {
    key,
    productId: null,
    productName: null,
    description: '',
    quantity: '1',
    unitPrice: '',
  };
}

export function emptyOrderForm(today: string): OrderFormValues {
  return {
    customerId: null,
    customerName: null,
    orderDate: today,
    dueDate: '',
    notes: '',
    lines: [emptyOrderLine('line-1')],
  };
}

export function emptyOrderFormErrors(): OrderFormErrors {
  return { lines: {} };
}

// Validaciones puras de entrega, cancelación y atraso de pedidos.

import { isValidDateString } from './dates';
import type {
  CancelOrderInput,
  DeliverOrderInput,
  OrderPaymentMethod,
  OrderStatus,
  ValidCancelOrderInput,
  ValidDeliverOrderInput,
} from './order-types';

/** Valida un id positivo de pedido. */
export function validateOrderId(id: number): number {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('El pedido no es válido.');
  }
  return id;
}

/** La fecha de hoy se recibe como parámetro para no leer el reloj. */
export function validateToday(today: string): void {
  if (!isValidDateString(today)) {
    throw new Error('La fecha de hoy no es válida.');
  }
}

function validatePaymentMethod(method: OrderPaymentMethod): OrderPaymentMethod {
  if (method !== 'cash' && method !== 'credit') {
    throw new Error('La forma de pago no es válida.');
  }
  return method;
}

/** Valida la entrega; la comparación con la fecha del pedido se hace en datos. */
export function validateDeliverOrderInput(
  input: DeliverOrderInput,
  today: string
): ValidDeliverOrderInput {
  validateToday(today);
  const orderId = validateOrderId(input.orderId);
  const paymentMethod = validatePaymentMethod(input.paymentMethod);
  const deliveredAt = input.deliveredAt ?? today;
  if (!isValidDateString(deliveredAt)) {
    throw new Error('La fecha de entrega no es válida.');
  }
  if (deliveredAt > today) {
    throw new Error('La fecha de entrega no puede ser futura.');
  }
  return { orderId, paymentMethod, deliveredAt };
}

/** Valida la cancelación. Solo requiere confirmación y una fecha válida. */
export function validateCancelOrderInput(
  input: CancelOrderInput,
  today: string
): ValidCancelOrderInput {
  validateToday(today);
  const orderId = validateOrderId(input.orderId);

  const cancelledAt = input.cancelledAt ?? today;
  if (!isValidDateString(cancelledAt)) {
    throw new Error('La fecha de cancelación no es válida.');
  }
  if (cancelledAt > today) {
    throw new Error('La fecha de cancelación no puede ser futura.');
  }
  return { orderId, cancelledAt };
}

/** Un pedido pendiente con fecha de entrega vencida está atrasado. */
export function isOrderOverdue(
  status: OrderStatus,
  dueDate: string | null,
  today: string
): boolean {
  return status === 'pending' && dueDate !== null && dueDate < today;
}

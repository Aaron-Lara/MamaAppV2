// Validación pura de pedidos. No lee el reloj ni toca la base: "today" se
// recibe como parámetro para que las pruebas sean deterministas.

import { isValidDateString } from './dates';
import { sumCents } from './money';
import { validateToday } from './order-actions-input';
import { MAX_ORDER_ITEMS, validateOrderItem } from './order-item-input';
import type {
  NewOrderInput,
  OrderStatus,
  ValidOrderInput,
} from './order-types';

export * from './order-types';
export * from './order-item-input';
export * from './order-actions-input';

export const MAX_ORDER_NOTES_LENGTH = 300;

const ORDER_STATUSES: readonly OrderStatus[] = ['pending', 'delivered', 'cancelled'];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && ORDER_STATUSES.includes(value as OrderStatus);
}

function validateOptionalDate(
  value: string | null | undefined,
  label: string
): string | null {
  if (value == null) return null;
  if (typeof value !== 'string') {
    throw new Error(`La ${label} no es válida.`);
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!isValidDateString(trimmed)) {
    throw new Error(`La ${label} no es válida.`);
  }
  return trimmed;
}

function validateNotes(notes: string | null | undefined): string | null {
  if (notes == null) return null;
  if (typeof notes !== 'string') {
    throw new Error('Las notas del pedido no son válidas.');
  }
  const trimmed = notes.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_ORDER_NOTES_LENGTH) {
    throw new Error(`Las notas no pueden pasar de ${MAX_ORDER_NOTES_LENGTH} caracteres.`);
  }
  return trimmed;
}

/** Valida y normaliza un pedido completo antes de escribir nada en la base. */
export function validateNewOrder(input: NewOrderInput, today: string): ValidOrderInput {
  validateToday(today);

  if (!Number.isSafeInteger(input.customerId) || input.customerId <= 0) {
    throw new Error('El cliente del pedido no es válido.');
  }

  const orderDate = input.orderDate ?? today;
  if (!isValidDateString(orderDate)) {
    throw new Error('La fecha del pedido no es válida.');
  }
  if (orderDate > today) {
    throw new Error('La fecha del pedido no puede ser futura.');
  }

  const dueDate = validateOptionalDate(input.dueDate, 'fecha de entrega');
  if (dueDate !== null && dueDate < orderDate) {
    throw new Error('La fecha de entrega no puede ser anterior a la fecha del pedido.');
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new Error('El pedido necesita al menos un renglón.');
  }
  if (input.items.length > MAX_ORDER_ITEMS) {
    throw new Error(`Un pedido no puede pasar de ${MAX_ORDER_ITEMS} renglones.`);
  }

  const items = input.items.map(validateOrderItem);
  return {
    customerId: input.customerId,
    orderDate,
    dueDate,
    notes: validateNotes(input.notes),
    items,
    totalCents: sumCents(items.map((item) => item.lineTotalCents)),
  };
}

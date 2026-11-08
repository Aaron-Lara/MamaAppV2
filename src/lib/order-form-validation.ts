// Validación pura del formulario de pedidos: texto escrito -> NewOrderInput.
// Recibe "today" y no toca la base, así se prueba con Jest sin expo-sqlite.

import { isValidDateString } from './dates';
import { lineTotalCents, sumCents } from './money';
import { parseMoneyToCents } from './money-input';
import {
  emptyOrderFormErrors,
  type OrderFormResult,
  type OrderFormValues,
  type OrderLineErrors,
} from './order-form-types';
import { MAX_ORDER_NOTES_LENGTH } from './order-input';
import {
  MAX_ORDER_DESCRIPTION_LENGTH,
  MAX_ORDER_ITEMS,
  MAX_ORDER_QUANTITY,
} from './order-item-input';
import type { NewOrderItem } from './order-types';

/** Cantidad entera dentro del rango permitido por la lógica de pedidos. */
export function parseOrderQuantity(text: string): number | null {
  const cleaned = text.trim();
  if (!/^\d+$/.test(cleaned)) {
    return null;
  }
  const quantity = Number(cleaned);
  return Number.isSafeInteger(quantity) &&
    quantity >= 1 &&
    quantity <= MAX_ORDER_QUANTITY
    ? quantity
    : null;
}

/** Precio unitario en centavos; devuelve el mensaje de error si no se puede. */
export function parseOrderPrice(
  text: string
): { cents: number | null; error: string | null } {
  const cleaned = text.trim();
  if (!cleaned) {
    return { cents: null, error: 'Escribe el precio unitario.' };
  }
  try {
    return { cents: parseMoneyToCents(cleaned), error: null };
  } catch (error) {
    return {
      cents: null,
      error: error instanceof Error ? error.message : 'El precio no es válido.',
    };
  }
}

/** Valida todo el formulario y calcula el total de los renglones completos. */
export function validateOrderForm(
  values: OrderFormValues,
  today: string
): OrderFormResult {
  const errors = emptyOrderFormErrors();
  const lineTotals: Record<string, number | null> = {};

  const customerId = values.customerId;
  let validCustomerId: number | null = null;
  if (customerId === null || !Number.isSafeInteger(customerId) || customerId <= 0) {
    errors.customer = 'Elige un cliente.';
  } else {
    validCustomerId = customerId;
  }

  const rawOrderDate = values.orderDate.trim();
  let orderDate: string | null = null;
  if (!rawOrderDate || !isValidDateString(rawOrderDate)) {
    errors.orderDate = 'Escribe una fecha válida (AAAA-MM-DD).';
  } else if (rawOrderDate > today) {
    errors.orderDate = 'La fecha del pedido no puede ser futura.';
  } else {
    orderDate = rawOrderDate;
  }

  const rawDueDate = values.dueDate.trim();
  let dueDate: string | null = null;
  if (rawDueDate) {
    if (!isValidDateString(rawDueDate)) {
      errors.dueDate = 'Escribe una fecha válida (AAAA-MM-DD).';
    } else if (orderDate !== null && rawDueDate < orderDate) {
      errors.dueDate = 'La fecha de entrega no puede ser anterior al pedido.';
    } else {
      dueDate = rawDueDate;
    }
  }

  const notes = values.notes.trim();
  if (notes.length > MAX_ORDER_NOTES_LENGTH) {
    errors.notes = `Las notas no pueden pasar de ${MAX_ORDER_NOTES_LENGTH} caracteres.`;
  }

  if (values.lines.length === 0) {
    errors.general = 'Agrega al menos un producto.';
  } else if (values.lines.length > MAX_ORDER_ITEMS) {
    errors.general = `Un pedido no puede pasar de ${MAX_ORDER_ITEMS} renglones.`;
  }

  const items: NewOrderItem[] = [];
  for (const line of values.lines) {
    const lineErrors: OrderLineErrors = {};
    const description = line.description.trim();
    if (!description) {
      lineErrors.description = 'Escribe una descripción.';
    } else if (description.length > MAX_ORDER_DESCRIPTION_LENGTH) {
      lineErrors.description = `No puede pasar de ${MAX_ORDER_DESCRIPTION_LENGTH} caracteres.`;
    }

    let quantity = parseOrderQuantity(line.quantity);
    if (quantity === null) {
      lineErrors.quantity = `Cantidad entera entre 1 y ${MAX_ORDER_QUANTITY}.`;
    }

    const price = parseOrderPrice(line.unitPrice);
    if (price.error) {
      lineErrors.unitPrice = price.error;
    }

    let lineTotal: number | null = null;
    if (quantity !== null && price.cents !== null) {
      try {
        lineTotal = lineTotalCents(quantity, price.cents);
      } catch {
        lineErrors.unitPrice = 'El total del renglón es demasiado grande.';
        quantity = null;
      }
    }
    lineTotals[line.key] = lineTotal;

    if (Object.keys(lineErrors).length > 0) {
      errors.lines[line.key] = lineErrors;
    }
    if (description && quantity !== null && price.cents !== null) {
      items.push({
        productId: line.productId,
        description,
        quantity,
        unitPriceCents: price.cents,
      });
    }
  }

  let totalCents = 0;
  try {
    totalCents = sumCents(Object.values(lineTotals).map((value) => value ?? 0));
  } catch {
    errors.general = 'El total del pedido es demasiado grande.';
  }

  const hasLineErrors = Object.keys(errors.lines).length > 0;
  const ok =
    validCustomerId !== null &&
    orderDate !== null &&
    !errors.dueDate &&
    !errors.notes &&
    !errors.general &&
    !hasLineErrors &&
    items.length === values.lines.length;
  const input =
    ok && validCustomerId !== null && orderDate !== null
      ? {
          customerId: validCustomerId,
          orderDate,
          dueDate,
          notes: notes || null,
          items,
        }
      : null;

  return { ok: input !== null, errors, input, totalCents, lineTotals };
}

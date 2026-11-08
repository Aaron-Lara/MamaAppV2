// Reductores puros del formulario de pedidos. No tocan React ni la base.

import { centsToInputText } from './money-input';
import {
  emptyOrderLine,
  type OrderFormValues,
  type OrderLineForm,
} from './order-form-types';
import { MAX_ORDER_ITEMS } from './order-item-input';

export type OrderLinePatch = Partial<Omit<OrderLineForm, 'key'>>;

export type OrderProductChoice = {
  id: number;
  name: string;
  priceCents: number;
};

export function updateOrderLine(
  values: OrderFormValues,
  key: string,
  patch: OrderLinePatch
): OrderFormValues {
  return {
    ...values,
    lines: values.lines.map((line) =>
      line.key === key ? { ...line, ...patch } : line
    ),
  };
}

export function addOrderLine(
  values: OrderFormValues,
  key: string
): OrderFormValues {
  if (values.lines.length >= MAX_ORDER_ITEMS) {
    return values;
  }
  return { ...values, lines: [...values.lines, emptyOrderLine(key)] };
}

export function removeOrderLine(
  values: OrderFormValues,
  key: string
): OrderFormValues {
  if (values.lines.length <= 1) {
    return values;
  }
  return { ...values, lines: values.lines.filter((line) => line.key !== key) };
}

/** Elige un producto y precarga nombre y precio, sin perder una descripción propia. */
export function selectOrderLineProduct(
  values: OrderFormValues,
  key: string,
  product: OrderProductChoice | null
): OrderFormValues {
  return {
    ...values,
    lines: values.lines.map((line) => {
      if (line.key !== key) {
        return line;
      }
      if (!product) {
        return { ...line, productId: null, productName: null };
      }
      const keepDescription =
        line.description.trim() !== '' &&
        line.description.trim() !== line.productName;
      return {
        ...line,
        productId: product.id,
        productName: product.name,
        description: keepDescription ? line.description : product.name,
        unitPrice: centsToInputText(product.priceCents),
      };
    }),
  };
}

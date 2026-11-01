// Carrito de venta: lógica pura, sin expo-sqlite ni pantallas.
// El dinero va siempre en centavos enteros.

import { lineTotalCents, sumCents } from '@/lib/money';

export const MAX_CART_LINES = 40;
export const MAX_LINE_QUANTITY = 999;
/** Desde esta cantidad la pantalla avisa (detecta dedos resbalados). */
export const UNUSUAL_QUANTITY = 20;

export type CartLine = {
  key: string;
  productId: number | null;
  description: string;
  unitPriceCents: number;
  quantity: number;
};

export type Cart = { lines: readonly CartLine[]; nextId: number };

export type CartProduct = { id: number; name: string; priceCents: number };

/** Renglón listo para guardar con recordSale. */
export type SaleItemDraft = {
  productId: number | null;
  description: string;
  quantity: number;
  unitPriceCents: number;
};

export function emptyCart(): Cart {
  return { lines: [], nextId: 1 };
}

function assertCanAddLine(cart: Cart): void {
  if (cart.lines.length >= MAX_CART_LINES) {
    throw new Error(`La venta no puede tener más de ${MAX_CART_LINES} renglones.`);
  }
}

function assertPrice(priceCents: number): void {
  if (!Number.isSafeInteger(priceCents) || priceCents < 0) {
    throw new Error('El precio no es válido.');
  }
}

/** Suma una unidad del producto; si ya está en el carrito, aumenta su cantidad. */
export function addProduct(cart: Cart, product: CartProduct): Cart {
  if (!Number.isSafeInteger(product.id) || product.id <= 0) {
    throw new Error('El producto no es válido.');
  }
  assertPrice(product.priceCents);
  const name = product.name.trim();
  if (name === '') {
    throw new Error('El producto no tiene nombre.');
  }
  const key = `p${product.id}`;
  if (cart.lines.some((line) => line.key === key)) {
    return changeQuantity(cart, key, 1);
  }
  assertCanAddLine(cart);
  const line: CartLine = {
    key,
    productId: product.id,
    description: name,
    unitPriceCents: product.priceCents,
    quantity: 1,
  };
  return { ...cart, lines: [...cart.lines, line] };
}

/** Renglón "por monto" (sin producto del catálogo), por ejemplo un lonche suelto. */
export function addAmount(cart: Cart, description: string, amountCents: number): Cart {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new Error('El monto debe ser mayor a cero.');
  }
  assertCanAddLine(cart);
  const line: CartLine = {
    key: `m${cart.nextId}`,
    productId: null,
    description: description.trim() || 'Venta por monto',
    unitPriceCents: amountCents,
    quantity: 1,
  };
  return { lines: [...cart.lines, line], nextId: cart.nextId + 1 };
}

/** Quita un renglón completo. Una clave que ya no existe se ignora. */
export function removeLine(cart: Cart, key: string): Cart {
  return { ...cart, lines: cart.lines.filter((line) => line.key !== key) };
}

/** Cambia la cantidad de un renglón; si llega a cero o menos, lo quita. */
export function changeQuantity(cart: Cart, key: string, delta: number): Cart {
  if (!Number.isSafeInteger(delta) || delta === 0) {
    throw new Error('El cambio de cantidad no es válido.');
  }
  const line = cart.lines.find((item) => item.key === key);
  if (!line) {
    return cart;
  }
  const quantity = line.quantity + delta;
  if (quantity <= 0) {
    return removeLine(cart, key);
  }
  if (quantity > MAX_LINE_QUANTITY) {
    throw new Error(`No puedes llevar más de ${MAX_LINE_QUANTITY} unidades en un renglón.`);
  }
  return {
    ...cart,
    lines: cart.lines.map((item) => (item.key === key ? { ...item, quantity } : item)),
  };
}

export function cartTotalCents(cart: Cart): number {
  return sumCents(cart.lines.map((line) => lineTotalCents(line.quantity, line.unitPriceCents)));
}

export function cartUnitCount(cart: Cart): number {
  return cart.lines.reduce((total, line) => total + line.quantity, 0);
}

/** true si algún renglón lleva una cantidad fuera de lo normal (pedir confirmación). */
export function hasUnusualQuantity(cart: Cart): boolean {
  return cart.lines.some((line) => line.quantity >= UNUSUAL_QUANTITY);
}

/** Renglones en el formato que espera recordSale. */
export function toSaleItems(cart: Cart): SaleItemDraft[] {
  return cart.lines.map((line) => ({
    productId: line.productId,
    description: line.description,
    quantity: line.quantity,
    unitPriceCents: line.unitPriceCents,
  }));
}
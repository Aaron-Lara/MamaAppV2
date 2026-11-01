// Cobro: del carrito a los datos de una venta, y cálculo del cambio.
// Lógica pura: no importa expo-sqlite ni pantallas.

import { cartTotalCents, toSaleItems, type Cart, type SaleItemDraft } from '@/lib/cart';
import { formatCents } from '@/lib/money';
import { parseMoneyToCents } from '@/lib/money-input';

export type PaymentMethod = 'cash' | 'credit';

/** Datos listos para recordSale. */
export type SaleDraft = {
  paymentMethod: PaymentMethod;
  customerId: number | null;
  items: SaleItemDraft[];
};

export type CheckoutResult =
  | { ok: true; sale: SaleDraft; totalCents: number }
  | { ok: false; error: string };

export type ChangeResult = { ok: true; changeCents: number } | { ok: false; error: string };

/** Billetes que se ofrecen como atajo en "Paga con" (en centavos). */
const BILLS_CENTS = [2000, 5000, 10000, 20000, 50000];
const TEN_PESOS_CENTS = 1000;
const MAX_SUGGESTIONS = 4;
const TENDER_HINT = 'Escribe con cuánto paga (por ejemplo 100 o 50.50).';

function isValidId(value: number | null): value is number {
  return value !== null && Number.isSafeInteger(value) && value > 0;
}

/** Valida el carrito y la forma de pago, y arma los datos de la venta. */
export function buildSaleDraft(
  cart: Cart,
  paymentMethod: PaymentMethod,
  customerId: number | null
): CheckoutResult {
  if (cart.lines.length === 0) {
    return { ok: false, error: 'Agrega al menos un producto.' };
  }
  if (paymentMethod !== 'cash' && paymentMethod !== 'credit') {
    return { ok: false, error: 'La forma de pago no es válida.' };
  }
  if (paymentMethod === 'credit' && !isValidId(customerId)) {
    return { ok: false, error: 'Elige a quién se le fía.' };
  }
  const sale: SaleDraft = {
    paymentMethod,
    // El efectivo no se liga a un cliente: solo el fiado lo necesita.
    customerId: paymentMethod === 'credit' ? customerId : null,
    items: toSaleItems(cart),
  };
  return { ok: true, sale, totalCents: cartTotalCents(cart) };
}

/** Cambio a devolver según lo que escribió la usuaria en "Paga con". */
export function calculateChange(totalCents: number, tenderedText: string): ChangeResult {
  if (!Number.isSafeInteger(totalCents) || totalCents < 0) {
    return { ok: false, error: 'El total no es válido.' };
  }
  if (tenderedText.trim() === '') {
    return { ok: false, error: TENDER_HINT };
  }
  let tenderedCents: number;
  try {
    tenderedCents = parseMoneyToCents(tenderedText);
  } catch {
    return { ok: false, error: TENDER_HINT };
  }
  if (tenderedCents < totalCents) {
    const missing = formatCents(totalCents - tenderedCents);
    return { ok: false, error: `El pago no alcanza: faltan ${missing}.` };
  }
  return { ok: true, changeCents: tenderedCents - totalCents };
}

/** Atajos de "Paga con": el total exacto, el siguiente múltiplo de $10 y billetes. */
export function suggestTenders(totalCents: number): number[] {
  if (!Number.isSafeInteger(totalCents) || totalCents <= 0) {
    return [];
  }
  const roundedUp = Math.ceil(totalCents / TEN_PESOS_CENTS) * TEN_PESOS_CENTS;
  const candidates = [totalCents, roundedUp, ...BILLS_CENTS.filter((bill) => bill > totalCents)];
  return [...new Set(candidates)].sort((a, b) => a - b).slice(0, MAX_SUGGESTIONS);
}
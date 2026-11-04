// Validación pura de una compra. No lee la fecha del sistema: recibe "today"
// y no toca la base, así que se puede probar con Jest sin expo-sqlite.
// El costo de cada renglón es el TOTAL que aparece en el ticket, no el unitario.

import { isValidDateString } from './dates';
import {
  MAX_EXCHANGE_RATE,
  MIN_EXCHANGE_RATE,
  MXN_RATE_X10000,
} from './exchange-rate';
import { sumCents } from './money';
import { validatePurchaseLine } from './purchase-line-input';
import {
  MAX_PURCHASE_LINES,
  MAX_STORE_LENGTH,
  type NewPurchaseInput,
  type PurchaseCurrency,
  type ValidPurchaseInput,
} from './purchase-types';

export * from './purchase-types';
export { validatePurchaseLine } from './purchase-line-input';

/** Recorta la tienda; vacía o ausente se guarda como null. */
function validateStore(store: string | null | undefined): string | null {
  if (store == null) {
    return null;
  }
  if (typeof store !== 'string') {
    throw new Error('La tienda de la compra no es válida.');
  }
  const trimmed = store.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > MAX_STORE_LENGTH) {
    throw new Error(`La tienda no puede pasar de ${MAX_STORE_LENGTH} caracteres.`);
  }
  return trimmed;
}

function validateRate(currency: PurchaseCurrency, value: number | undefined): number {
  if (currency === 'MXN') {
    return MXN_RATE_X10000;
  }
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < MIN_EXCHANGE_RATE * 10000 ||
    value > MAX_EXCHANGE_RATE * 10000
  ) {
    throw new Error(
      `El tipo de cambio debe estar entre ${MIN_EXCHANGE_RATE} y ${MAX_EXCHANGE_RATE} pesos por dólar.`
    );
  }
  return value;
}

/** Valida y normaliza la compra completa antes de escribir nada en la base. */
export function validatePurchaseInput(
  input: NewPurchaseInput,
  today: string
): ValidPurchaseInput {
  if (!isValidDateString(today)) {
    throw new Error('La fecha de hoy no es válida.');
  }

  const purchaseDate = input.purchaseDate ?? today;
  if (!isValidDateString(purchaseDate)) {
    throw new Error('La fecha de la compra no es válida.');
  }
  if (purchaseDate > today) {
    throw new Error('La fecha de la compra no puede ser futura.');
  }

  if (input.currency !== 'MXN' && input.currency !== 'USD') {
    throw new Error('La moneda de la compra no es válida.');
  }
  const exchangeRateX10000 = validateRate(input.currency, input.exchangeRateX10000);

  if (!Array.isArray(input.lines) || input.lines.length === 0) {
    throw new Error('La compra necesita al menos un renglón.');
  }
  if (input.lines.length > MAX_PURCHASE_LINES) {
    throw new Error(`Una compra no puede pasar de ${MAX_PURCHASE_LINES} renglones.`);
  }

  const lines = input.lines.map((line, index) =>
    validatePurchaseLine(line, index, exchangeRateX10000)
  );
  const totalCents = sumCents(lines.map((line) => line.costCents));
  const totalMxnCents = sumCents(lines.map((line) => line.costMxnCents));

  return {
    purchaseDate,
    store: validateStore(input.store),
    currency: input.currency,
    exchangeRateX10000,
    lines,
    totalCents,
    totalMxnCents,
  };
}

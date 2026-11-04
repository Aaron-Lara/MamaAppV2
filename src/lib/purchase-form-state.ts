// Reductores puros del formulario de compras. No tocan React ni la base.

import {
  emptyPurchaseLine,
  type PurchaseFormErrors,
  type PurchaseFormValues,
  type PurchaseLineForm,
} from './purchase-form-types';
import { MAX_PURCHASE_LINES, type PurchaseCurrency } from './purchase-types';

export type PurchaseLinePatch = Partial<Omit<PurchaseLineForm, 'key'>>;

export function updatePurchaseLine(
  values: PurchaseFormValues,
  key: string,
  patch: PurchaseLinePatch
): PurchaseFormValues {
  return {
    ...values,
    lines: values.lines.map((line) =>
      line.key === key ? { ...line, ...patch } : line
    ),
  };
}

export function addPurchaseLine(
  values: PurchaseFormValues,
  key: string
): PurchaseFormValues {
  if (values.lines.length >= MAX_PURCHASE_LINES) {
    return values;
  }
  return { ...values, lines: [...values.lines, emptyPurchaseLine(key)] };
}

export function removePurchaseLine(
  values: PurchaseFormValues,
  key: string
): PurchaseFormValues {
  if (values.lines.length <= 1) {
    return values;
  }
  return { ...values, lines: values.lines.filter((line) => line.key !== key) };
}

export function changePurchaseCurrency(
  values: PurchaseFormValues,
  currency: PurchaseCurrency,
  lastExchangeRateText: string
): PurchaseFormValues {
  if (values.currency === currency) {
    return values;
  }
  const exchangeRate =
    currency === 'USD' && !values.exchangeRate.trim()
      ? lastExchangeRateText
      : values.exchangeRate;
  return { ...values, currency, exchangeRate };
}

export function selectPurchaseLineProduct(
  values: PurchaseFormValues,
  key: string,
  product: { id: number; name: string; trackStock: boolean } | null
): PurchaseFormValues {
  return {
    ...values,
    lines: values.lines.map((line) => {
      if (line.key !== key) {
        return line;
      }
      if (!product) {
        return { ...line, productId: null, productName: null, trackStock: null };
      }
      const keepDescription =
        line.description.trim() !== '' && line.description.trim() !== line.productName;
      return {
        ...line,
        productId: product.id,
        productName: product.name,
        trackStock: product.trackStock,
        description: keepDescription ? line.description : product.name,
      };
    }),
  };
}

export function withLineProductError(
  errors: PurchaseFormErrors,
  key: string,
  message: string
): PurchaseFormErrors {
  return {
    ...errors,
    lines: {
      ...errors.lines,
      [key]: { ...errors.lines[key], product: message },
    },
  };
}

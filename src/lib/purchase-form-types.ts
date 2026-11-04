// Tipos y valores iniciales del formulario de compras. Separados de la
// validación para que cada archivo quede corto.

import type { NewPurchaseInput, PurchaseCurrency } from './purchase-types';

export type PurchaseLineForm = {
  key: string;
  productId: number | null;
  productName: string | null;
  /** null = sin producto; false = el producto no controla stock. */
  trackStock: boolean | null;
  description: string;
  units: string;
  cost: string;
};

export type PurchaseFormValues = {
  store: string;
  currency: PurchaseCurrency;
  exchangeRate: string;
  lines: PurchaseLineForm[];
};

export type PurchaseLineErrors = {
  product?: string;
  description?: string;
  units?: string;
  cost?: string;
};

export type PurchaseFormErrors = {
  store?: string;
  exchangeRate?: string;
  general?: string;
  lines: Record<string, PurchaseLineErrors>;
};

export type PurchaseLineTotals = {
  costCents: number | null;
  costMxnCents: number | null;
  unitCostMxnCents: number | null;
};

export type PurchaseFormResult = {
  ok: boolean;
  errors: PurchaseFormErrors;
  input: NewPurchaseInput | null;
  exchangeRateX10000: number | null;
  totalCents: number;
  totalMxnCents: number;
  lines: Record<string, PurchaseLineTotals>;
};

export function emptyPurchaseLine(key = 'line-1'): PurchaseLineForm {
  return {
    key,
    productId: null,
    productName: null,
    trackStock: null,
    description: '',
    units: '1',
    cost: '',
  };
}

export function emptyPurchaseForm(): PurchaseFormValues {
  return { store: '', currency: 'MXN', exchangeRate: '', lines: [emptyPurchaseLine()] };
}

export function emptyPurchaseErrors(): PurchaseFormErrors {
  return { lines: {} };
}

/** 205000 -> "20.5"; 199999 -> "19.9999"; 200000 -> "20". */
export function exchangeRateToInputText(rateX10000: number): string {
  if (!Number.isSafeInteger(rateX10000) || rateX10000 <= 0) {
    throw new Error('El tipo de cambio no es válido.');
  }
  const whole = Math.floor(rateX10000 / 10000);
  const fraction = String(rateX10000 % 10000).padStart(4, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : String(whole);
}

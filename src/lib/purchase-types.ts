// Constantes y tipos de una compra. Se separaron para que purchase-input.ts
// quede corto y para compartirlos con las pantallas y los datos.

export const MAX_PURCHASE_UNITS = 10000;
export const MAX_PURCHASE_LINES = 60;
export const MAX_STORE_LENGTH = 60;
export const MAX_DESCRIPTION_LENGTH = 60;
/** $10,000.00 por renglón, en la moneda original de la compra. */
export const MAX_PURCHASE_LINE_CENTS = 1_000_000;

export type PurchaseCurrency = 'MXN' | 'USD';

export type NewPurchaseLineInput = {
  productId?: number | null;
  description: string;
  units: number;
  costCents: number;
};

export type NewPurchaseInput = {
  /** Fecha local AAAA-MM-DD; si se omite se usa "today". */
  purchaseDate?: string;
  store?: string | null;
  currency: PurchaseCurrency;
  exchangeRateX10000?: number;
  lines: NewPurchaseLineInput[];
};

export type ValidPurchaseLine = {
  productId: number | null;
  description: string;
  units: number;
  costCents: number;
  costMxnCents: number;
};

export type ValidPurchaseInput = {
  purchaseDate: string;
  store: string | null;
  currency: PurchaseCurrency;
  exchangeRateX10000: number;
  lines: ValidPurchaseLine[];
  totalCents: number;
  totalMxnCents: number;
};

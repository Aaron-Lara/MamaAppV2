// Validación pura del formulario de compras: texto de la usuaria -> input de
// createPurchase. Junta todos los errores por campo y por renglón a la vez.

import { convertToMxnCents, MXN_RATE_X10000, parseExchangeRate } from './exchange-rate';
import { unitCostCents } from './purchase-cost';
import { parsePurchaseCost, parsePurchaseUnits } from './purchase-form-lines';
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_PURCHASE_LINES,
  MAX_PURCHASE_UNITS,
  MAX_STORE_LENGTH,
  type NewPurchaseInput,
  type NewPurchaseLineInput,
} from './purchase-types';
import type {
  PurchaseFormErrors,
  PurchaseFormResult,
  PurchaseFormValues,
  PurchaseLineErrors,
  PurchaseLineTotals,
} from './purchase-form-types';

export * from './purchase-form-types';

/** Valida todo el formulario y calcula los totales que se muestran. */
export function validatePurchaseForm(
  values: PurchaseFormValues,
  purchaseDate: string
): PurchaseFormResult {
  const errors: PurchaseFormErrors = { lines: {} };
  const lines: Record<string, PurchaseLineTotals> = {};
  const inputLines: NewPurchaseLineInput[] = [];
  let totalCents = 0;
  let totalMxnCents = 0;

  const store = values.store.trim();
  if (store.length > MAX_STORE_LENGTH) {
    errors.store = `La tienda no puede pasar de ${MAX_STORE_LENGTH} caracteres.`;
  }

  let exchangeRateX10000: number | null =
    values.currency === 'MXN' ? MXN_RATE_X10000 : null;
  if (values.currency === 'USD') {
    try {
      exchangeRateX10000 = parseExchangeRate(values.exchangeRate);
    } catch (error) {
      errors.exchangeRate =
        error instanceof Error ? error.message : 'El tipo de cambio no es válido.';
    }
  }

  if (values.lines.length === 0) {
    errors.general = 'La compra necesita al menos un renglón.';
  } else if (values.lines.length > MAX_PURCHASE_LINES) {
    errors.general = `Una compra no puede pasar de ${MAX_PURCHASE_LINES} renglones.`;
  }

  values.lines.forEach((line) => {
    const lineErrors: PurchaseLineErrors = {};
    const description = line.description.trim();

    if (!description) {
      lineErrors.description = 'Escribe una descripción.';
    } else if (description.length > MAX_DESCRIPTION_LENGTH) {
      lineErrors.description = `La descripción no puede pasar de ${MAX_DESCRIPTION_LENGTH} caracteres.`;
    }

    const units = parsePurchaseUnits(line.units);
    if (units === null) {
      lineErrors.units = `Las unidades deben ser un entero entre 1 y ${MAX_PURCHASE_UNITS}.`;
    }

    const cost = parsePurchaseCost(line.cost);
    if (cost.error) {
      lineErrors.cost = cost.error;
    }

    if (line.productId !== null && (!Number.isSafeInteger(line.productId) || line.productId <= 0)) {
      lineErrors.product = 'El producto del renglón no es válido.';
    }

    if (cost.cents !== null) {
      totalCents += cost.cents;
    }
    const costMxnCents =
      cost.cents !== null && exchangeRateX10000 !== null
        ? convertToMxnCents(cost.cents, exchangeRateX10000)
        : null;
    if (costMxnCents !== null) {
      totalMxnCents += costMxnCents;
    }
    const unitCostMxnCents =
      costMxnCents !== null && units !== null ? unitCostCents(costMxnCents, units) : null;

    lines[line.key] = {
      costCents: cost.cents,
      costMxnCents,
      unitCostMxnCents,
    };

    if (Object.keys(lineErrors).length > 0) {
      errors.lines[line.key] = lineErrors;
    }
    if (units !== null && cost.cents !== null && Object.keys(lineErrors).length === 0) {
      inputLines.push({
        productId: line.productId,
        description: line.description,
        units,
        costCents: cost.cents,
      });
    }
  });

  const hasErrors =
    Object.keys(errors.lines).length > 0 ||
    Boolean(errors.store || errors.exchangeRate || errors.general);
  const input: NewPurchaseInput | null =
    hasErrors || exchangeRateX10000 === null
      ? null
      : {
          purchaseDate,
          store: store || null,
          currency: values.currency,
          exchangeRateX10000,
          lines: inputLines,
        };

  return {
    ok: input !== null,
    errors,
    input,
    exchangeRateX10000,
    totalCents,
    totalMxnCents,
    lines,
  };
}

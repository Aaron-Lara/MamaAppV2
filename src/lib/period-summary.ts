// Totales de un periodo a partir de los días ya consultados.
// Lógica pura: centavos enteros y sin acceso a la base de datos.

import { isValidDateString } from './dates';
import { sumCents } from './money';

export type DailyTotals = {
  date: string;
  cashCents: number;
  creditCents: number;
  activeSalesCount: number;
  voidedSalesCount: number;
  paymentsCents: number;
  paymentsCount: number;
  expensesCents: number;
  expensesCount: number;
};

export type PeriodTotals = {
  salesCents: number;
  cashCents: number;
  creditCents: number;
  activeSalesCount: number;
  voidedSalesCount: number;
  paymentsCents: number;
  paymentsCount: number;
  expensesCents: number;
  expensesCount: number;
  cashInDrawerCents: number;
};

export function emptyPeriodTotals(): PeriodTotals {
  return {
    salesCents: 0,
    cashCents: 0,
    creditCents: 0,
    activeSalesCount: 0,
    voidedSalesCount: 0,
    paymentsCents: 0,
    paymentsCount: 0,
    expensesCents: 0,
    expensesCount: 0,
    cashInDrawerCents: 0,
  };
}

/** Suma conteos validando que sean enteros no negativos. */
function sumCounts(values: readonly number[]): number {
  let total = 0;
  for (const value of values) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error('Los conteos deben ser enteros mayores o iguales a cero.');
    }
    total += value;
    if (!Number.isSafeInteger(total)) {
      throw new Error('La suma se sale del rango seguro de enteros.');
    }
  }
  return total;
}

/**
 * Suma los días dentro de [from, to]. Los importes vienen de ventas activas
 * del día; las anuladas solo aportan su conteo. La caja es efectivo + abonos.
 */
export function sumPeriodDays(
  days: readonly DailyTotals[],
  from: string,
  to: string
): PeriodTotals {
  if (!isValidDateString(from) || !isValidDateString(to) || from > to) {
    throw new Error('El rango de fechas no es válido.');
  }

  const inRange = days.filter((day) => day.date >= from && day.date <= to);
  const cashCents = sumCents(inRange.map((day) => day.cashCents));
  const creditCents = sumCents(inRange.map((day) => day.creditCents));
  const paymentsCents = sumCents(inRange.map((day) => day.paymentsCents));
  const expensesCents = sumCents(inRange.map((day) => day.expensesCents));

  return {
    salesCents: sumCents([cashCents, creditCents]),
    cashCents,
    creditCents,
    activeSalesCount: sumCounts(inRange.map((day) => day.activeSalesCount)),
    voidedSalesCount: sumCounts(inRange.map((day) => day.voidedSalesCount)),
    paymentsCents,
    paymentsCount: sumCounts(inRange.map((day) => day.paymentsCount)),
    expensesCents,
    expensesCount: sumCounts(inRange.map((day) => day.expensesCount)),
    cashInDrawerCents: sumCents([cashCents, paymentsCents]),
  };
}

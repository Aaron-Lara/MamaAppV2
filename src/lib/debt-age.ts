// Cálculo de antigüedad de deuda (FIFO).
// Los días se calculan por fechas de calendario (AAAA-MM-DD).

import { isValidDateString } from './dates';

export const DEBT_WARNING_DAYS = 7;
export const DEBT_DANGER_DAYS = 14;

export type DebtAgeStatus = 'normal' | 'warning' | 'danger';
export type DebtAgeResult = {
  daysOld: number | null;
  status: DebtAgeStatus;
  isOverdue: boolean;
};

type Sale = { saleDate: string; totalCents: number };

/**
 * Aplica abonos a ventas FIFO y calcula la antigüedad de la deuda restante.
 * @param sales Ventas fiadas activas ordenadas por fecha ascendente
 *   (la más antigua primero). El orden lo debe garantizar quien llama.
 * @param paidCents Monto total de abonos activos.
 * @param today Fecha actual en formato AAAA-MM-DD.
 */
export function calculateDebtAge(
  sales: Sale[],
  paidCents: number,
  today: string
): DebtAgeResult {
  assertValidDate(today, 'La fecha de hoy');

  let remainingPaid = paidCents;
  let firstUnpaidSaleDate: string | null = null;

  for (const sale of sales) {
    if (remainingPaid >= sale.totalCents) {
      remainingPaid -= sale.totalCents;
    } else {
      firstUnpaidSaleDate = sale.saleDate;
      break;
    }
  }

  if (!firstUnpaidSaleDate) {
    return { daysOld: null, status: 'normal', isOverdue: false };
  }

  const daysOld = countDaysBetween(firstUnpaidSaleDate, today);

  let status: DebtAgeStatus = 'normal';
  if (daysOld >= DEBT_DANGER_DAYS) {
    status = 'danger';
  } else if (daysOld >= DEBT_WARNING_DAYS) {
    status = 'warning';
  }

  return {
    daysOld,
    status,
    isOverdue: daysOld >= DEBT_WARNING_DAYS,
  };
}

/**
 * Calcula días de calendario entre dos fechas AAAA-MM-DD.
 * Usa Date.UTC para ignorar la zona horaria y el horario de verano:
 * la división entre 86400000 siempre da un entero exacto.
 * Si la segunda fecha es anterior a la primera, devuelve 0.
 */
function countDaysBetween(date1: string, date2: string): number {
  assertValidDate(date1, 'La fecha de la venta');
  assertValidDate(date2, 'La fecha de hoy');

  const [y1, m1, d1] = date1.split('-').map(Number);
  const [y2, m2, d2] = date2.split('-').map(Number);

  const day1 = Date.UTC(y1, m1 - 1, d1);
  const day2 = Date.UTC(y2, m2 - 1, d2);

  return Math.max(0, (day2 - day1) / 86400000);
}

/** Lanza un error en español si el texto no es una fecha de calendario válida. */
function assertValidDate(value: string, label: string): void {
  if (!isValidDateString(value)) {
    throw new Error(`${label} no es válida: "${value}". Usa el formato AAAA-MM-DD.`);
  }
}

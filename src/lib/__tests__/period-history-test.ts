// Pruebas del historial de periodos: agrupación, orden y periodos vacíos.

import { buildPeriodHistory } from '../period-history';
import type { DailyTotals } from '../period-summary';

function day(date: string, overrides: Partial<DailyTotals> = {}): DailyTotals {
  return {
    date,
    cashCents: 0,
    creditCents: 0,
    activeSalesCount: 0,
    voidedSalesCount: 0,
    paymentsCents: 0,
    paymentsCount: 0,
    expensesCents: 0,
    expensesCount: 0,
    ...overrides,
  };
}

describe('buildPeriodHistory', () => {
  test('agrupa semanas del más reciente al más viejo y marca la actual', () => {
    const days = [
      day('2026-11-02', { cashCents: 1000, creditCents: 500, activeSalesCount: 2 }),
      day('2026-10-28', { cashCents: 2000, activeSalesCount: 1 }),
      day('2026-10-01', { cashCents: 9999, activeSalesCount: 9 }),
    ];

    expect(buildPeriodHistory('week', days, 3, '2026-11-03')).toEqual([
      {
        start: '2026-11-02',
        label: '2 al 8 de noviembre',
        salesCents: 1500,
        salesCount: 2,
        isCurrent: true,
      },
      {
        start: '2026-10-26',
        label: '26 de octubre al 1 de noviembre',
        salesCents: 2000,
        salesCount: 1,
        isCurrent: false,
      },
      {
        start: '2026-10-19',
        label: '19 al 25 de octubre',
        salesCents: 0,
        salesCount: 0,
        isCurrent: false,
      },
    ]);
  });

  test('agrupa meses y agrega el año cuando cambia', () => {
    const days = [
      day('2026-12-15', { cashCents: 3000, activeSalesCount: 1 }),
      day('2026-11-05', { creditCents: 1000, activeSalesCount: 2 }),
      day('2026-10-10', { cashCents: 5000, activeSalesCount: 5 }),
    ];

    expect(buildPeriodHistory('month', days, 3, '2027-01-15')).toEqual([
      { start: '2027-01-01', label: 'enero', salesCents: 0, salesCount: 0, isCurrent: true },
      {
        start: '2026-12-01',
        label: 'diciembre de 2026',
        salesCents: 3000,
        salesCount: 1,
        isCurrent: false,
      },
      {
        start: '2026-11-01',
        label: 'noviembre de 2026',
        salesCents: 1000,
        salesCount: 2,
        isCurrent: false,
      },
    ]);
  });

  test('los periodos sin datos quedan en cero y no se ocultan', () => {
    const rows = buildPeriodHistory('week', [], 2, '2026-11-03');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ salesCents: 0, salesCount: 0, isCurrent: true });
    expect(rows[1]).toMatchObject({ salesCents: 0, salesCount: 0, isCurrent: false });
  });

  test('rechaza una cantidad inválida de periodos', () => {
    expect(() => buildPeriodHistory('week', [], 0, '2026-11-03')).toThrow(
      'La cantidad de periodos debe ser un entero mayor a cero.'
    );
  });
});

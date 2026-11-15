// Pruebas de los totales de periodo: sumas, rango y anuladas.

import {
  emptyPeriodTotals,
  sumPeriodDays,
  type DailyTotals,
} from '../period-summary';

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

const DAYS: DailyTotals[] = [
  day('2026-11-01', { cashCents: 9999, activeSalesCount: 9 }),
  day('2026-11-02', {
    cashCents: 1000,
    creditCents: 500,
    activeSalesCount: 2,
    voidedSalesCount: 1,
    paymentsCents: 200,
    paymentsCount: 1,
    expensesCents: 300,
    expensesCount: 1,
  }),
  day('2026-11-03', { cashCents: 700, activeSalesCount: 1 }),
  day('2026-11-04', { cashCents: 5000, activeSalesCount: 5 }),
];

describe('emptyPeriodTotals', () => {
  test('todos los campos en cero', () => {
    expect(emptyPeriodTotals()).toEqual({
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
    });
  });
});

describe('sumPeriodDays', () => {
  test('suma solo los días dentro del rango inclusivo', () => {
    expect(sumPeriodDays(DAYS, '2026-11-02', '2026-11-03')).toEqual({
      salesCents: 2200,
      cashCents: 1700,
      creditCents: 500,
      activeSalesCount: 3,
      voidedSalesCount: 1,
      paymentsCents: 200,
      paymentsCount: 1,
      expensesCents: 300,
      expensesCount: 1,
      cashInDrawerCents: 1900,
    });
  });

  test('un solo día no arrastra vecinos', () => {
    expect(sumPeriodDays(DAYS, '2026-11-02', '2026-11-02')).toMatchObject({
      cashCents: 1000,
      creditCents: 500,
      salesCents: 1500,
      activeSalesCount: 2,
      cashInDrawerCents: 1200,
    });
  });

  test('un rango sin días devuelve ceros', () => {
    expect(sumPeriodDays(DAYS, '2026-10-01', '2026-10-31')).toEqual(emptyPeriodTotals());
  });

  test('el orden de los días no cambia el resultado', () => {
    const reversed = [...DAYS].reverse();
    expect(sumPeriodDays(reversed, '2026-11-02', '2026-11-03')).toEqual(
      sumPeriodDays(DAYS, '2026-11-02', '2026-11-03')
    );
  });

  test('las anuladas solo suman su conteo, nunca dinero', () => {
    const totals = sumPeriodDays(
      [day('2026-11-05', { voidedSalesCount: 7, activeSalesCount: 0 })],
      '2026-11-05',
      '2026-11-05'
    );
    expect(totals.salesCents).toBe(0);
    expect(totals.cashInDrawerCents).toBe(0);
    expect(totals.voidedSalesCount).toBe(7);
  });

  test('rechaza fechas inválidas y rangos invertidos', () => {
    expect(() => sumPeriodDays(DAYS, '2026-02-30', '2026-11-03')).toThrow(
      'El rango de fechas no es válido.'
    );
    expect(() => sumPeriodDays(DAYS, 'hoy', '2026-11-03')).toThrow(
      'El rango de fechas no es válido.'
    );
    expect(() => sumPeriodDays(DAYS, '2026-11-04', '2026-11-02')).toThrow(
      'El rango de fechas no es válido.'
    );
  });

  test('rechaza importes y conteos que no son enteros', () => {
    expect(() =>
      sumPeriodDays([day('2026-11-02', { cashCents: 10.5 })], '2026-11-02', '2026-11-02')
    ).toThrow();
    expect(() =>
      sumPeriodDays(
        [day('2026-11-02', { activeSalesCount: 1.5 })],
        '2026-11-02',
        '2026-11-02'
      )
    ).toThrow('Los conteos deben ser enteros mayores o iguales a cero.');
  });
});

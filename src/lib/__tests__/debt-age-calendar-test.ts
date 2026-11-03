import { calculateDebtAge, DEBT_DANGER_DAYS, DEBT_WARNING_DAYS } from '../debt-age';

const ventaBase = [{ saleDate: '2026-01-01', totalCents: 100 }];

describe('calculateDebtAge en días de calendario', () => {
  test('cruce del horario de verano de EE. UU. en marzo: 7 días', () => {
    const sales = [{ saleDate: '2026-03-05', totalCents: 100 }];
    const result = calculateDebtAge(sales, 0, '2026-03-12');
    expect(result.daysOld).toBe(7);
    expect(result.status).toBe('warning');
    expect(result.isOverdue).toBe(true);
  });

  test('cruce del horario de verano de EE. UU. en noviembre: 7 días', () => {
    const sales = [{ saleDate: '2026-11-01', totalCents: 100 }];
    const result = calculateDebtAge(sales, 0, '2026-11-08');
    expect(result.daysOld).toBe(7);
    expect(result.status).toBe('warning');
    expect(result.isOverdue).toBe(true);
  });

  test('límite inferior: un día antes de la advertencia es normal', () => {
    const result = calculateDebtAge(ventaBase, 0, '2026-01-07');
    expect(result.daysOld).toBe(DEBT_WARNING_DAYS - 1);
    expect(result.status).toBe('normal');
    expect(result.isOverdue).toBe(false);
  });

  test('límite de advertencia', () => {
    const result = calculateDebtAge(ventaBase, 0, '2026-01-08');
    expect(result.daysOld).toBe(DEBT_WARNING_DAYS);
    expect(result.status).toBe('warning');
    expect(result.isOverdue).toBe(true);
  });

  test('límite inferior de peligro sigue en advertencia', () => {
    const result = calculateDebtAge(ventaBase, 0, '2026-01-14');
    expect(result.daysOld).toBe(DEBT_DANGER_DAYS - 1);
    expect(result.status).toBe('warning');
  });

  test('límite de peligro', () => {
    const result = calculateDebtAge(ventaBase, 0, '2026-01-15');
    expect(result.daysOld).toBe(DEBT_DANGER_DAYS);
    expect(result.status).toBe('danger');
    expect(result.isOverdue).toBe(true);
  });
});

describe('calculateDebtAge valida las fechas', () => {
  test('lanza error si la fecha de la venta no existe', () => {
    expect(() =>
      calculateDebtAge([{ saleDate: '2026-02-30', totalCents: 100 }], 0, '2026-03-01')
    ).toThrow('La fecha de la venta no es válida');
  });

  test('lanza error si la fecha de hoy tiene un formato incorrecto', () => {
    expect(() => calculateDebtAge(ventaBase, 0, 'hoy')).toThrow(
      'La fecha de hoy no es válida'
    );
  });

  test('lanza error si el mes de hoy está fuera de rango', () => {
    expect(() => calculateDebtAge(ventaBase, 0, '2026-13-01')).toThrow(
      'La fecha de hoy no es válida'
    );
  });
});

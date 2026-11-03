import { calculateDebtAge } from '../debt-age';

describe('calculateDebtAge', () => {
  test('sin ventas no hay deuda', () => {
    const result = calculateDebtAge([], 500, '2026-01-10');
    expect(result).toEqual({ daysOld: null, status: 'normal', isOverdue: false });
  });

  test('un abono total deja la deuda en cero', () => {
    const sales = [{ saleDate: '2026-01-01', totalCents: 100 }];
    const result = calculateDebtAge(sales, 100, '2026-01-10');
    expect(result).toEqual({ daysOld: null, status: 'normal', isOverdue: false });
  });

  test('abono exacto a la primera venta pasa la deuda a la segunda', () => {
    const sales = [
      { saleDate: '2026-01-01', totalCents: 100 },
      { saleDate: '2026-01-05', totalCents: 100 },
    ];
    // 100 paga completa la venta del 1 y la deuda más antigua es la del 5.
    const result = calculateDebtAge(sales, 100, '2026-01-10');
    expect(result.daysOld).toBe(5);
    expect(result.status).toBe('normal');
    expect(result.isOverdue).toBe(false);
  });

  test('varias ventas con abonos parciales aplican FIFO', () => {
    const sales = [
      { saleDate: '2026-01-01', totalCents: 100 },
      { saleDate: '2026-01-05', totalCents: 200 },
      { saleDate: '2026-01-10', totalCents: 100 },
    ];
    // 250 cubre la primera venta y deja 150 pendientes en la segunda.
    const result = calculateDebtAge(sales, 250, '2026-01-12');
    expect(result.daysOld).toBe(7);
    expect(result.status).toBe('warning');
    expect(result.isOverdue).toBe(true);
  });

  test('un abono parcial sobre la tercera venta usa la fecha de la tercera', () => {
    const sales = [
      { saleDate: '2026-01-01', totalCents: 100 },
      { saleDate: '2026-01-05', totalCents: 200 },
      { saleDate: '2026-01-10', totalCents: 100 },
    ];
    // 320 cubre las dos primeras y deja 20 pendientes en la tercera.
    const result = calculateDebtAge(sales, 320, '2026-01-12');
    expect(result.daysOld).toBe(2);
    expect(result.status).toBe('normal');
  });

  test('la misma fecha da 0 días', () => {
    const sales = [{ saleDate: '2026-05-20', totalCents: 100 }];
    const result = calculateDebtAge(sales, 0, '2026-05-20');
    expect(result.daysOld).toBe(0);
    expect(result.status).toBe('normal');
    expect(result.isOverdue).toBe(false);
  });

  test('si hoy es anterior a la venta da 0 días', () => {
    const sales = [{ saleDate: '2026-05-20', totalCents: 100 }];
    const result = calculateDebtAge(sales, 0, '2026-05-15');
    expect(result.daysOld).toBe(0);
    expect(result.status).toBe('normal');
    expect(result.isOverdue).toBe(false);
  });

  test('cruza el fin de mes', () => {
    const sales = [{ saleDate: '2026-01-30', totalCents: 100 }];
    const result = calculateDebtAge(sales, 0, '2026-02-05');
    expect(result.daysOld).toBe(6);
    expect(result.status).toBe('normal');
  });

  test('cruza el fin de año', () => {
    const sales = [{ saleDate: '2025-12-28', totalCents: 100 }];
    const result = calculateDebtAge(sales, 0, '2026-01-04');
    expect(result.daysOld).toBe(7);
    expect(result.status).toBe('warning');
  });
});

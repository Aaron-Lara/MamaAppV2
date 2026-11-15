// Pruebas del calendario de reportes: semanas lunes-domingo y meses.

import {
  canGoNextPeriod, INVALID_PERIOD_LABEL, periodLabel, periodRange, periodStart,
  previousPeriodRange, recentPeriodStarts, shiftPeriod, type PeriodKind, type PeriodRange,
} from '../period-dates';

const TODAY = '2026-11-03'; // martes
const range = (kind: PeriodKind, date: string, today = TODAY) => periodRange(kind, date, today);

describe('periodStart', () => {
  test('la semana empieza en lunes, aunque se pida un domingo', () => {
    expect(periodStart('week', '2026-11-02')).toBe('2026-11-02');
    expect(periodStart('week', '2026-11-04')).toBe('2026-11-02');
    expect(periodStart('week', '2026-11-08')).toBe('2026-11-02');
  });
  test('cruza mes y año', () => {
    expect(periodStart('week', '2026-10-29')).toBe('2026-10-26');
    expect(periodStart('week', '2027-01-01')).toBe('2026-12-28');
  });
  test('el mes empieza el día 1', () => {
    expect(periodStart('month', '2026-11-15')).toBe('2026-11-01');
    expect(periodStart('month', '2026-01-31')).toBe('2026-01-01');
  });
  test('rechaza tipo y fecha inválidos', () => {
    expect(() => periodStart('day' as unknown as PeriodKind, TODAY)).toThrow('El tipo de periodo no es válido.');
    expect(() => periodStart('week', '2026-02-30')).toThrow('La fecha no es válida.');
  });
});

describe('periodRange', () => {
  test('una semana pasada está completa', () => {
    expect(range('week', '2026-10-26')).toEqual({
      kind: 'week', start: '2026-10-26', end: '2026-11-01',
      periodEnd: '2026-11-01', elapsedDays: 7, isPartial: false,
    });
  });
  test('la semana en curso se recorta a hoy', () => {
    expect(range('week', TODAY)).toEqual({
      kind: 'week', start: '2026-11-02', end: '2026-11-03',
      periodEnd: '2026-11-08', elapsedDays: 2, isPartial: true,
    });
  });
  test('el domingo cierra la semana sin recorte', () => {
    const week = range('week', TODAY, '2026-11-08');
    expect([week.end, week.elapsedDays, week.isPartial]).toEqual(['2026-11-08', 7, false]);
  });
  test('el mes pasado está completo y el actual se recorta', () => {
    expect(range('month', '2026-10-15')).toMatchObject({
      start: '2026-10-01', end: '2026-10-31', elapsedDays: 31, isPartial: false,
    });
    expect(range('month', TODAY)).toMatchObject({
      start: '2026-11-01', end: '2026-11-03', elapsedDays: 3, isPartial: true,
    });
  });
  test('resuelve febrero bisiesto', () => {
    expect(range('month', '2024-02-10', '2024-03-01')).toMatchObject({
      start: '2024-02-01', end: '2024-02-29', elapsedDays: 29,
    });
  });
  test('un ancla futura se trata como hoy', () => {
    expect(range('week', '2026-11-20', '2026-11-04')).toMatchObject({
      start: '2026-11-02', end: '2026-11-04',
    });
  });
  test('rechaza fechas inválidas', () => {
    expect(() => range('week', 'hoy')).toThrow('La fecha no es válida.');
    expect(() => range('month', TODAY, '2026-02-30')).toThrow('La fecha no es válida.');
  });
});

describe('previousPeriodRange', () => {
  test('semana parcial contra los mismos días de la semana anterior', () => {
    expect(previousPeriodRange(range('week', '2026-11-04', '2026-11-04'))).toEqual({
      kind: 'week', start: '2026-10-26', end: '2026-10-28',
      periodEnd: '2026-11-01', elapsedDays: 3, isPartial: true,
    });
  });
  test('semana completa contra la semana completa anterior', () => {
    expect(previousPeriodRange(range('week', TODAY, '2026-11-08'))).toMatchObject({
      start: '2026-10-26', end: '2026-11-01', elapsedDays: 7, isPartial: false,
    });
  });
  test('mes parcial contra el mismo avance del mes anterior', () => {
    expect(previousPeriodRange(range('month', '2026-11-08', '2026-11-08'))).toMatchObject({
      start: '2026-10-01', end: '2026-10-08', elapsedDays: 8, isPartial: true,
    });
  });
  test('mes completo contra el mes completo anterior', () => {
    expect(previousPeriodRange(range('month', '2026-10-15'))).toMatchObject({
      start: '2026-09-01', end: '2026-09-30', elapsedDays: 30, isPartial: false,
    });
  });
  test('se recorta al fin de febrero cuando el anterior es más corto', () => {
    expect(previousPeriodRange(range('month', '2027-03-30', '2027-03-30'))).toMatchObject({
      start: '2027-02-01', end: '2027-02-28', elapsedDays: 28,
    });
    expect(previousPeriodRange(range('month', '2024-03-30', '2024-03-30')).end).toBe('2024-02-29');
  });
  test('rechaza periodos inválidos', () => {
    const broken = { ...range('week', TODAY), start: '2026-02-30' };
    expect(() => previousPeriodRange(broken)).toThrow('La fecha no es válida.');
    const backwards: PeriodRange = {
      kind: 'week', start: '2026-11-05', end: '2026-11-01',
      periodEnd: '2026-11-08', elapsedDays: 1, isPartial: true,
    };
    expect(() => previousPeriodRange(backwards)).toThrow('El periodo no es válido.');
  });
});

describe('shiftPeriod', () => {
  test('retrocede semanas y meses', () => {
    expect(shiftPeriod('week', '2026-11-02', -1, TODAY)).toBe('2026-10-26');
    expect(shiftPeriod('week', '2026-11-02', -3, TODAY)).toBe('2026-10-12');
    expect(shiftPeriod('month', '2026-11-10', -1, '2026-11-15')).toBe('2026-10-01');
    expect(shiftPeriod('month', '2027-01-15', -1, '2027-01-20')).toBe('2026-12-01');
    expect(shiftPeriod('week', '2027-01-04', -1, '2027-01-10')).toBe('2026-12-28');
  });
  test('no avanza más allá del periodo de hoy', () => {
    expect(shiftPeriod('week', '2026-11-02', 1, TODAY)).toBe('2026-11-02');
    expect(shiftPeriod('month', '2026-10-01', 1, TODAY)).toBe('2026-11-01');
    expect(shiftPeriod('month', '2026-11-01', 1, TODAY)).toBe('2026-11-01');
  });
  test('delta cero devuelve el inicio del periodo', () => {
    expect(shiftPeriod('week', '2026-11-05', 0, TODAY)).toBe('2026-11-02');
  });
  test('rechaza delta y fechas inválidas', () => {
    expect(() => shiftPeriod('week', '2026-11-02', 1.5, TODAY)).toThrow('El cambio de periodo debe ser un número entero.');
    expect(() => shiftPeriod('week', '2026-02-30', -1, TODAY)).toThrow('La fecha no es válida.');
  });
});

describe('canGoNextPeriod', () => {
  test('hay siguiente solo si el periodo es anterior al de hoy', () => {
    expect(canGoNextPeriod('week', '2026-10-26', TODAY)).toBe(true);
    expect(canGoNextPeriod('week', '2026-11-02', TODAY)).toBe(false);
    expect(canGoNextPeriod('week', '2026-11-09', TODAY)).toBe(false);
    expect(canGoNextPeriod('month', '2026-10-01', TODAY)).toBe(true);
    expect(canGoNextPeriod('month', '2026-11-01', TODAY)).toBe(false);
  });
  test('con fechas inválidas no permite avanzar', () => {
    expect(canGoNextPeriod('week', '2026-02-30', TODAY)).toBe(false);
    expect(canGoNextPeriod('week', '2026-10-26', 'hoy')).toBe(false);
  });
});

describe('periodLabel', () => {
  test('semana dentro del mismo mes y año', () => {
    expect(periodLabel(range('week', TODAY, '2026-11-08'), TODAY)).toBe('2 al 8 de noviembre');
  });
  test('semana de un solo día', () => {
    expect(periodLabel(range('week', '2026-11-02', '2026-11-02'), '2026-11-02')).toBe('2 de noviembre');
  });
  test('agrega el año cuando no es el año de hoy', () => {
    expect(periodLabel(range('week', '2025-11-04'), TODAY)).toBe('3 al 9 de noviembre de 2025');
    expect(periodLabel(range('month', '2025-11-03'), TODAY)).toBe('noviembre de 2025');
  });
  test('semana que cruza mes y año', () => {
    expect(periodLabel(range('week', '2026-10-29'), TODAY)).toBe('26 de octubre al 1 de noviembre');
    expect(periodLabel(range('week', '2027-01-01', '2027-01-10'), '2027-01-10')).toBe(
      '28 de diciembre de 2026 al 3 de enero de 2027'
    );
  });
  test('mes del año en curso y con hoy inválido', () => {
    expect(periodLabel(range('month', TODAY), TODAY)).toBe('noviembre');
    expect(periodLabel(range('month', TODAY), 'hoy')).toBe('noviembre de 2026');
  });
  test('con rango inválido devuelve el aviso', () => {
    const broken = { ...range('week', TODAY), start: '2026-02-30' };
    expect(periodLabel(broken, TODAY)).toBe(INVALID_PERIOD_LABEL);
  });
});

describe('recentPeriodStarts', () => {
  test('devuelve los periodos del más reciente al más viejo', () => {
    expect(recentPeriodStarts('week', 3, TODAY)).toEqual(['2026-11-02', '2026-10-26', '2026-10-19']);
    expect(recentPeriodStarts('month', 3, TODAY)).toEqual(['2026-11-01', '2026-10-01', '2026-09-01']);
    expect(recentPeriodStarts('month', 3, '2027-01-15')).toEqual(['2027-01-01', '2026-12-01', '2026-11-01']);
  });
  test('con count 1 solo devuelve el periodo de hoy', () => {
    expect(recentPeriodStarts('week', 1, TODAY)).toEqual(['2026-11-02']);
  });
  test('rechaza cantidades inválidas', () => {
    expect(() => recentPeriodStarts('week', 0, TODAY)).toThrow('La cantidad de periodos debe ser un entero mayor a cero.');
    expect(() => recentPeriodStarts('week', -2, TODAY)).toThrow();
    expect(() => recentPeriodStarts('week', 1.5, TODAY)).toThrow();
    expect(() => recentPeriodStarts('week', 2, 'hoy')).toThrow('La fecha no es válida.');
  });
});

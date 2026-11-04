import {
  canGoNext,
  dayLabel,
  INVALID_DAY_LABEL,
  shiftDay,
} from '../day-navigation';

describe('shiftDay', () => {
  test('avanza dentro del mismo mes', () => {
    expect(shiftDay('2026-11-03', 1, '2026-11-30')).toBe('2026-11-04');
  });

  test('cruza el mes hacia adelante', () => {
    expect(shiftDay('2026-10-31', 1, '2026-11-30')).toBe('2026-11-01');
  });

  test('cruza el año hacia adelante', () => {
    expect(shiftDay('2026-12-31', 1, '2027-01-05')).toBe('2027-01-01');
  });

  test('cruza el año hacia atrás', () => {
    expect(shiftDay('2026-01-01', -1, '2026-01-05')).toBe('2025-12-31');
  });

  test('respeta el 29 de febrero en año bisiesto', () => {
    expect(shiftDay('2024-02-28', 1, '2024-03-05')).toBe('2024-02-29');
  });

  test('no pasa de hoy', () => {
    expect(shiftDay('2026-11-03', 1, '2026-11-03')).toBe('2026-11-03');
  });

  test('una fecha futura se recorta a hoy', () => {
    expect(shiftDay('2026-11-10', 1, '2026-11-03')).toBe('2026-11-03');
  });

  test('rechaza una fecha que no existe en el calendario', () => {
    expect(() => shiftDay('2026-02-30', 1, '2026-03-01')).toThrow('La fecha no es válida.');
  });

  test('rechaza un texto que no es fecha', () => {
    expect(() => shiftDay('ayer', 1, '2026-11-03')).toThrow('La fecha no es válida.');
  });
});

describe('canGoNext', () => {
  test('permite avanzar desde un día anterior', () => {
    expect(canGoNext('2026-11-02', '2026-11-03')).toBe(true);
  });

  test('no permite avanzar desde hoy', () => {
    expect(canGoNext('2026-11-03', '2026-11-03')).toBe(false);
  });

  test('no permite avanzar desde una fecha futura', () => {
    expect(canGoNext('2026-11-10', '2026-11-03')).toBe(false);
  });

  test('con fechas inválidas no permite avanzar', () => {
    expect(canGoNext('2026-02-30', '2026-11-03')).toBe(false);
    expect(canGoNext('2026-11-02', 'hoy')).toBe(false);
  });
});

describe('dayLabel', () => {
  test('etiqueta el día de hoy', () => {
    expect(dayLabel('2026-11-03', '2026-11-03')).toBe('Hoy');
  });

  test('etiqueta ayer dentro del mismo mes', () => {
    expect(dayLabel('2026-11-02', '2026-11-03')).toBe('Ayer');
  });

  test('etiqueta ayer cuando cruza el mes', () => {
    expect(dayLabel('2026-10-31', '2026-11-01')).toBe('Ayer');
  });

  test('escribe la fecha sin año cuando es el mismo año', () => {
    expect(dayLabel('2026-10-27', '2026-11-03')).toBe('27 de octubre');
  });

  test('agrega el año cuando cambia el año', () => {
    expect(dayLabel('2025-12-31', '2026-01-02')).toBe('31 de diciembre de 2025');
  });

  test('con fecha inválida devuelve el aviso', () => {
    expect(dayLabel('2026-02-30', '2026-11-03')).toBe(INVALID_DAY_LABEL);
    expect(dayLabel('no-es-fecha', '2026-11-03')).toBe(INVALID_DAY_LABEL);
  });

  test('con hoy inválido escribe la fecha con año', () => {
    expect(dayLabel('2025-12-31', 'hoy')).toBe('31 de diciembre de 2025');
  });
});

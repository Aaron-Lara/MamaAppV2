import { localDateStringDaysAgo } from '../dates';

// Fechas armadas en hora local (nunca ISO/UTC) para no depender de la zona.
describe('localDateStringDaysAgo', () => {
  test('resta días dentro del mismo mes', () => {
    expect(localDateStringDaysAgo(5, new Date(2026, 5, 20))).toBe('2026-06-15');
  });

  test('cruza el mes hacia atrás', () => {
    expect(localDateStringDaysAgo(1, new Date(2026, 2, 1))).toBe('2026-02-28');
  });

  test('cruza el año hacia atrás', () => {
    expect(localDateStringDaysAgo(1, new Date(2026, 0, 1))).toBe('2025-12-31');
  });

  test('respeta el 29 de febrero en año bisiesto', () => {
    expect(localDateStringDaysAgo(1, new Date(2024, 2, 1))).toBe('2024-02-29');
  });

  test('en año no bisiesto el 29 de febrero no existe', () => {
    expect(localDateStringDaysAgo(1, new Date(2025, 2, 1))).toBe('2025-02-28');
  });

  test('con 30 días incluye hoy y los 30 días anteriores', () => {
    expect(localDateStringDaysAgo(30, new Date(2026, 0, 31))).toBe('2026-01-01');
  });

  test('con 0 días devuelve la misma fecha', () => {
    expect(localDateStringDaysAgo(0, new Date(2026, 6, 9))).toBe('2026-07-09');
  });

  test('no modifica el Date recibido', () => {
    const from = new Date(2026, 2, 1);
    localDateStringDaysAgo(1, from);
    expect(from.getDate()).toBe(1);
  });
});

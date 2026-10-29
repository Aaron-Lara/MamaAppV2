// Pruebas de las funciones puras de dinero (todo en centavos).

import { formatCents, lineTotalCents, sumCents } from '../money';

describe('sumCents', () => {
  test('suma montos enteros', () => {
    expect(sumCents([1250, 350, 0])).toBe(1600);
  });

  test('una lista vacía suma cero', () => {
    expect(sumCents([])).toBe(0);
  });

  test('rechaza montos con decimales', () => {
    expect(() => sumCents([1250, 12.5])).toThrow();
  });

  test('rechaza NaN e Infinity', () => {
    expect(() => sumCents([NaN])).toThrow();
    expect(() => sumCents([Infinity])).toThrow();
  });

  test('rechaza sumas fuera del rango seguro de enteros', () => {
    expect(() => sumCents([Number.MAX_SAFE_INTEGER, 1])).toThrow();
  });
});

describe('lineTotalCents', () => {
  test('multiplica cantidad por precio unitario', () => {
    expect(lineTotalCents(3, 1250)).toBe(3750);
  });

  test('cantidad cero da cero', () => {
    expect(lineTotalCents(0, 1250)).toBe(0);
  });

  test('rechaza negativos', () => {
    expect(() => lineTotalCents(-1, 1250)).toThrow();
    expect(() => lineTotalCents(1, -1250)).toThrow();
  });

  test('rechaza decimales', () => {
    expect(() => lineTotalCents(1.5, 1250)).toThrow();
    expect(() => lineTotalCents(2, 10.5)).toThrow();
  });
});

describe('formatCents', () => {
  const cases: [number, string][] = [
    [0, '$0.00'],
    [50, '$0.50'],
    [99, '$0.99'],
    [100, '$1.00'],
    [1250, '$12.50'],
    [123456789, '$1,234,567.89'],
    [-2550, '-$25.50'],
  ];

  test.each(cases)('formatea %d como %s', (cents, expected) => {
    expect(formatCents(cents)).toBe(expected);
  });

  test('conserva el acarreo de un renglón', () => {
    expect(formatCents(lineTotalCents(7, 33))).toBe('$2.31');
  });

  test('rechaza montos con decimales', () => {
    expect(() => formatCents(12.5)).toThrow();
  });
});
